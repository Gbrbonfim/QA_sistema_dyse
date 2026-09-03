/* ======================================================================
   DYSE · Função serverless (Vercel) — cobrança avulsa no Asaas
   ----------------------------------------------------------------------
   POST, só gestão/financeiro. Cria uma cobrança pontual (fora da
   assinatura recorrente) pro cliente Asaas já vinculado ao aluno e
   devolve o link de pagamento / boleto / copia-e-cola do PIX.

   Body: { aluno_id, valor, vencimento (YYYY-MM-DD), descricao, billing_type }
     billing_type: UNDEFINED (padrão, aluno escolhe) | BOLETO | PIX | CREDIT_CARD

   Env: SUPABASE_SERVICE_ROLE_KEY, ASAAS_API_KEY  (ver api/_asaas.js)
   ====================================================================== */

const { adminClient, requireUser, asaasFetch, mapCobranca, HttpError } = require('./_asaas');

const TIPOS = ['UNDEFINED', 'BOLETO', 'PIX', 'CREDIT_CARD'];

async function run(req, res){
  if(req.method !== 'POST'){ res.status(405).json({ error: 'Método não permitido.' }); return; }

  const admin = adminClient();
  await requireUser(req, admin, ['financeiro', 'admin']);

  let body = req.body || {};
  if(typeof body === 'string'){ try{ body = JSON.parse(body); }catch(e){ body = {}; } }

  const alunoId = body.aluno_id;
  const valor = Number(body.valor);
  const vencimento = String(body.vencimento || '').slice(0, 10);
  const descricao = String(body.descricao || '').trim();
  const billingType = TIPOS.includes(body.billing_type) ? body.billing_type : 'UNDEFINED';

  if(!alunoId || !(valor > 0) || !/^\d{4}-\d{2}-\d{2}$/.test(vencimento)){
    res.status(400).json({ error: 'Informe aluno, valor (> 0) e vencimento (AAAA-MM-DD).' });
    return;
  }

  const { data: vinculo } = await admin.from('aluno_asaas')
    .select('asaas_customer_id').eq('aluno_id', alunoId).maybeSingle();
  if(!vinculo || !vinculo.asaas_customer_id){
    res.status(409).json({ error: 'Esse aluno ainda não está associado a um cliente do Asaas. Sincronize ou vincule manualmente primeiro.' });
    return;
  }

  const pay = await asaasFetch('/payments', {
    method: 'POST',
    body: {
      customer: vinculo.asaas_customer_id,
      billingType,
      value: Math.round(valor * 100) / 100,
      dueDate: vencimento,
      description: descricao || 'Cobrança avulsa DYSE',
      externalReference: 'dyse:avulsa:' + alunoId
    }
  });

  let pixPayload = null;
  if(billingType === 'PIX' || billingType === 'UNDEFINED'){
    try{ const qr = await asaasFetch('/payments/' + pay.id + '/pixQrCode'); if(qr && qr.payload) pixPayload = qr.payload; }catch(e){}
  }

  const agora = new Date().toISOString();
  const { error } = await admin.from('asaas_cobrancas').upsert({
    ...mapCobranca(pay, { pixPayload }),
    aluno_id: alunoId,
    avulsa: true,
    sincronizado_em: agora
  }, { onConflict: 'id' });
  if(error) throw new HttpError(500, 'Cobrança criada no Asaas, mas falhou ao salvar no sistema: ' + error.message);

  res.status(200).json({
    ok: true,
    cobranca_id: pay.id,
    invoiceUrl: pay.invoiceUrl || null,
    bankSlipUrl: pay.bankSlipUrl || null,
    pixPayload,
    valor: pay.value,
    vencimento: pay.dueDate
  });
}

module.exports = async function handler(req, res){
  try{ await run(req, res); }
  catch(err){
    const status = err && err.status ? err.status : 500;
    if(!res.headersSent) res.status(status).json({ error: (err && err.message) || String(err) });
  }
};
