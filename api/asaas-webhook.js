/* ======================================================================
   DYSE · Função serverless (Vercel) — webhook do Asaas
   ----------------------------------------------------------------------
   O Asaas chama esta URL a cada evento de cobrança. Sem sessão: a
   autenticação é o header "asaas-access-token", que precisa bater com
   ASAAS_WEBHOOK_TOKEN (o mesmo valor configurado no painel do Asaas).

   - Idempotência: cada evento tem id único; asaas_eventos.asaas_event_id
     é unique. Evento já processado → 200 e sai (o Asaas reenvia em erro).
   - PAYMENT_*  → atualiza asaas_cobrancas a partir de body.payment.
   - Pagou (RECEIVED/CONFIRMED) e não sobra cobrança vencida → reativa.
   - NÃO suspende aqui: a regra dos 14 dias é do cron (api/asaas-cron.js).
   - INVOICE_*  → atualiza o status da nota fiscal na cobrança.

   Env: SUPABASE_SERVICE_ROLE_KEY, ASAAS_API_KEY, ASAAS_WEBHOOK_TOKEN
   ====================================================================== */

const { adminClient, asaasFetch, mapCobranca } = require('./_asaas');

const PAGO = ['PAYMENT_RECEIVED', 'PAYMENT_CONFIRMED', 'PAYMENT_RECEIVED_IN_CASH'];

async function resolverAlunoId(admin, customerId){
  if(!customerId) return null;
  const { data } = await admin.from('aluno_asaas').select('aluno_id').eq('asaas_customer_id', customerId).maybeSingle();
  return data ? data.aluno_id : null;
}

async function run(req, res){
  if(req.method !== 'POST'){ res.status(405).json({ error: 'Método não permitido.' }); return; }

  const token = process.env.ASAAS_WEBHOOK_TOKEN;
  if(!token){ res.status(500).json({ error: 'ASAAS_WEBHOOK_TOKEN não configurado.' }); return; }
  if((req.headers['asaas-access-token'] || '') !== token){ res.status(401).json({ error: 'Token inválido.' }); return; }

  let body = req.body || {};
  if(typeof body === 'string'){ try{ body = JSON.parse(body); }catch(e){ body = {}; } }

  const eventoId = body.id || null;
  const evento = body.event || null;
  const pay = body.payment || null;
  const inv = body.invoice || null;
  if(!evento){ res.status(200).json({ ok: true, ignored: 'sem event' }); return; }

  const admin = adminClient();

  // dedupe / claim
  if(eventoId){
    const { data: existente } = await admin.from('asaas_eventos').select('processado').eq('asaas_event_id', eventoId).maybeSingle();
    if(existente && existente.processado){ res.status(200).json({ ok: true, duplicado: true }); return; }
    await admin.from('asaas_eventos').upsert({
      asaas_event_id: eventoId,
      evento,
      payment_id: pay ? pay.id : null,
      payload: body,
      processado: false
    }, { onConflict: 'asaas_event_id' });
  }

  if(evento === 'PAYMENT_DELETED' && pay){
    await admin.from('asaas_cobrancas').delete().eq('id', pay.id);
  } else if(pay){
    const alunoId = await resolverAlunoId(admin, pay.customer);

    let pixPayload = null;
    if(pay.status === 'PENDING' || pay.status === 'OVERDUE'){
      try{ const qr = await asaasFetch('/payments/' + pay.id + '/pixQrCode'); if(qr && qr.payload) pixPayload = qr.payload; }catch(e){}
    }

    await admin.from('asaas_cobrancas').upsert({
      ...mapCobranca(pay, { pixPayload }),
      aluno_id: alunoId,
      sincronizado_em: new Date().toISOString()
    }, { onConflict: 'id' });

    // regularizou? reativa (só se a pausa foi automática — a RPC confere)
    if(PAGO.includes(evento) && alunoId){
      const { data: aindaVencidas } = await admin.from('asaas_cobrancas')
        .select('id').eq('aluno_id', alunoId).eq('status', 'OVERDUE').limit(1);
      if(!aindaVencidas || !aindaVencidas.length){
        await admin.rpc('fn_asaas_reativar', {
          p_aluno_id: alunoId,
          p_motivo: 'Reativação automática: pagamento confirmado no Asaas (' + pay.id + ').'
        });
      }
    }
  } else if(inv){
    // evento de nota fiscal
    const patch = {
      nota_fiscal_id: inv.id,
      nota_fiscal_status: inv.status || null,
      nota_fiscal_url: inv.pdfUrl || inv.xmlUrl || null,
      sincronizado_em: new Date().toISOString()
    };
    if(inv.payment) await admin.from('asaas_cobrancas').update(patch).eq('id', inv.payment);
    else await admin.from('asaas_cobrancas').update(patch).eq('nota_fiscal_id', inv.id);
  }

  if(eventoId) await admin.from('asaas_eventos').update({ processado: true }).eq('asaas_event_id', eventoId);

  res.status(200).json({ ok: true });
}

module.exports = async function handler(req, res){
  try{ await run(req, res); }
  catch(err){
    // 500 → o Asaas reenvia; a dedupe (processado=false) deixa reprocessar
    if(!res.headersSent) res.status(500).json({ error: (err && err.message) || String(err) });
  }
};
