/* ======================================================================
   DYSE · Função serverless (Vercel) — vínculo manual aluno <-> cliente Asaas
   ----------------------------------------------------------------------
   POST, só gestão/financeiro. Pra quando o sync não casou o aluno
   automaticamente (e-mail/CPF diferentes). Recebe { aluno_id,
   asaas_customer_id }, confere o cliente no Asaas, grava aluno_asaas
   (match_metodo = 'manual') e já traz as assinaturas/cobranças dele.

   Env: SUPABASE_SERVICE_ROLE_KEY, ASAAS_API_KEY  (ver api/_asaas.js)
   ====================================================================== */

const {
  adminClient, requireUser, asaasFetch, asaasGetAll,
  soDigitos, mapCobranca, mapAssinatura, HttpError
} = require('./_asaas');

async function run(req, res){
  if(req.method !== 'POST'){ res.status(405).json({ error: 'Método não permitido.' }); return; }

  const admin = adminClient();
  await requireUser(req, admin, ['financeiro', 'admin']);

  let body = req.body || {};
  if(typeof body === 'string'){ try{ body = JSON.parse(body); }catch(e){ body = {}; } }
  const alunoId = body.aluno_id;
  const customerId = String(body.asaas_customer_id || '').trim();
  if(!alunoId || !customerId){
    res.status(400).json({ error: 'Informe aluno_id e asaas_customer_id.' });
    return;
  }

  const { data: perfil } = await admin.from('profiles').select('id').eq('id', alunoId).maybeSingle();
  if(!perfil){ res.status(404).json({ error: 'Aluno não encontrado.' }); return; }

  // já usado por outro aluno?
  const { data: emUso } = await admin.from('aluno_asaas')
    .select('aluno_id').eq('asaas_customer_id', customerId).neq('aluno_id', alunoId).maybeSingle();
  if(emUso){ res.status(409).json({ error: 'Esse cliente do Asaas já está vinculado a outro aluno.' }); return; }

  let customer;
  try{
    customer = await asaasFetch('/customers/' + encodeURIComponent(customerId));
  }catch(e){
    res.status(404).json({ error: 'Cliente não encontrado no Asaas (confira o ID cus_...).' });
    return;
  }

  const agora = new Date().toISOString();
  const { error: upErr } = await admin.from('aluno_asaas').upsert({
    aluno_id: alunoId,
    cpf_cnpj: soDigitos(customer.cpfCnpj) || null,
    asaas_customer_id: customer.id,
    match_metodo: 'manual',
    nome_asaas: customer.name || null,
    email_asaas: customer.email || null,
    sincronizado_em: agora,
    atualizado_em: agora
  }, { onConflict: 'aluno_id' });
  if(upErr) throw new HttpError(500, 'Erro salvando o vínculo: ' + upErr.message);

  // traz assinaturas + cobranças desse cliente agora
  const [subs, pays] = await Promise.all([
    asaasGetAll('/subscriptions?customer=' + encodeURIComponent(customer.id)),
    asaasGetAll('/payments?customer=' + encodeURIComponent(customer.id))
  ]);

  if(subs.length){
    await admin.from('asaas_assinaturas').upsert(
      subs.map(s => ({ ...mapAssinatura(s), aluno_id: alunoId, sincronizado_em: agora })),
      { onConflict: 'id' }
    );
  }
  if(pays.length){
    const pixPorId = new Map();
    for(const p of pays.filter(p => p.status === 'PENDING' || p.status === 'OVERDUE').slice(0, 40)){
      try{ const qr = await asaasFetch('/payments/' + p.id + '/pixQrCode'); if(qr && qr.payload) pixPorId.set(p.id, qr.payload); }catch(e){}
    }
    await admin.from('asaas_cobrancas').upsert(
      pays.map(p => ({ ...mapCobranca(p, { pixPayload: pixPorId.get(p.id) }), aluno_id: alunoId, sincronizado_em: agora })),
      { onConflict: 'id' }
    );
  }

  res.status(200).json({ ok: true, cliente: { id: customer.id, nome: customer.name }, assinaturas: subs.length, cobrancas: pays.length });
}

module.exports = async function handler(req, res){
  try{ await run(req, res); }
  catch(err){
    const status = err && err.status ? err.status : 500;
    if(!res.headersSent) res.status(status).json({ error: (err && err.message) || String(err) });
  }
};
