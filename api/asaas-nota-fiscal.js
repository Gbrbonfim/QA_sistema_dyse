/* ======================================================================
   DYSE · Função serverless (Vercel) — emitir / consultar nota fiscal (Asaas)
   ----------------------------------------------------------------------
   POST { cobranca_id }.
   Quem pode: gestão/financeiro (qualquer cobrança elegível) OU o próprio
   aluno dono da cobrança — mas o aluno só emite NF de BOLETO já PAGO
   (trava no servidor, o front só espelha o aviso).

   Fluxo Asaas: procura invoice já criada pra essa cobrança; se estiver
   agendada/sincronizada, autoriza; se não existir, cria e autoriza.
   Guarda nota_fiscal_id/status/url em asaas_cobrancas.

   Env: SUPABASE_SERVICE_ROLE_KEY, ASAAS_API_KEY (ver api/_asaas.js)
        ASAAS_NF_SERVICE_DESCRIPTION / ASAAS_NF_SERVICE_CODE /
        ASAAS_NF_SERVICE_NAME  (opcionais — usados só no fallback de criação)
   ====================================================================== */

const { adminClient, requireUser, asaasFetch, HttpError } = require('./_asaas');

const PAGO = ['RECEIVED', 'CONFIRMED', 'RECEIVED_IN_CASH'];

function resumoInvoice(inv){
  return {
    nota_fiscal_id: inv.id,
    nota_fiscal_status: inv.status || null,
    nota_fiscal_url: inv.pdfUrl || inv.xmlUrl || null
  };
}

async function run(req, res){
  if(req.method !== 'POST'){ res.status(405).json({ error: 'Método não permitido.' }); return; }

  const admin = adminClient();
  const { user, role } = await requireUser(req, admin, ['financeiro', 'admin', 'student', 'teacher']);
  const ehGestao = role === 'financeiro' || role === 'admin';

  let body = req.body || {};
  if(typeof body === 'string'){ try{ body = JSON.parse(body); }catch(e){ body = {}; } }
  const cobrancaId = String(body.cobranca_id || '').trim();
  if(!cobrancaId){ res.status(400).json({ error: 'Informe cobranca_id.' }); return; }

  const { data: cobr } = await admin.from('asaas_cobrancas').select('*').eq('id', cobrancaId).maybeSingle();
  if(!cobr){ res.status(404).json({ error: 'Cobrança não encontrada.' }); return; }

  if(!ehGestao){
    if(cobr.aluno_id !== user.id){ res.status(403).json({ error: 'Essa cobrança não é sua.' }); return; }
    if(cobr.billing_type !== 'BOLETO' || !PAGO.includes(cobr.status)){
      res.status(403).json({ error: 'A nota fiscal só pode ser emitida para boletos já pagos.' });
      return;
    }
  }

  // 1) já existe invoice pra essa cobrança?
  const lista = await asaasFetch('/invoices?payment=' + encodeURIComponent(cobrancaId) + '&limit=10');
  let invoice = (lista && lista.data && lista.data[0]) || null;

  // 2) não existe → cria
  if(!invoice){
    invoice = await asaasFetch('/invoices', {
      method: 'POST',
      body: {
        payment: cobrancaId,
        serviceDescription: process.env.ASAAS_NF_SERVICE_DESCRIPTION || cobr.descricao || 'Serviços educacionais',
        observations: 'Nota fiscal referente à cobrança ' + cobrancaId + '.',
        value: cobr.valor,
        deductions: 0,
        effectiveDate: new Date().toISOString().slice(0, 10),
        municipalServiceCode: process.env.ASAAS_NF_SERVICE_CODE || undefined,
        municipalServiceName: process.env.ASAAS_NF_SERVICE_NAME || undefined,
        taxes: { retainIss: false, iss: 0, cofins: 0, csll: 0, inss: 0, ir: 0, pis: 0 }
      }
    });
  }

  // 3) agendada/sincronizada → autoriza (emite). Já autorizada → segue.
  if(invoice && ['SCHEDULED', 'SYNCHRONIZED'].includes(invoice.status)){
    try{ invoice = await asaasFetch('/invoices/' + invoice.id + '/authorize', { method: 'POST' }); }
    catch(e){ /* pode já estar em processamento; devolve o status atual abaixo */ }
  }

  const patch = { ...resumoInvoice(invoice), sincronizado_em: new Date().toISOString() };
  const { error } = await admin.from('asaas_cobrancas').update(patch).eq('id', cobrancaId);
  if(error) throw new HttpError(500, 'NF acionada no Asaas, mas falhou ao salvar: ' + error.message);

  res.status(200).json({ ok: true, ...patch });
}

module.exports = async function handler(req, res){
  try{ await run(req, res); }
  catch(err){
    const status = err && err.status ? err.status : 500;
    if(!res.headersSent) res.status(status).json({ error: (err && err.message) || String(err) });
  }
};
