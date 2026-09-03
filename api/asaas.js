/* ======================================================================
   DYSE · Função serverless (Vercel) — módulo Asaas (dispatcher)
   ----------------------------------------------------------------------
   Uma função só, roteada por ?action= (ou body.action), pra caber no
   limite de 12 Serverless Functions do plano Hobby. O webhook
   (api/asaas-webhook.js) fica separado porque a autenticação dele é
   outra (header token, sem sessão).

     action=sync      POST  · gestão/financeiro · casa alunos e traz tudo do Asaas
     action=link      POST  · gestão/financeiro · vínculo manual { aluno_id, asaas_customer_id }
     action=cobranca  POST  · gestão/financeiro · cobrança avulsa { aluno_id, valor, vencimento, descricao, billing_type }
     action=nota      POST  · gestão OU aluno dono · emite/consulta NF { cobranca_id }
                              (aluno só de BOLETO já pago — trava no servidor)
     action=cron      GET/POST · header Authorization: Bearer <CRON_SECRET>
                              · gatilho manual da varredura de inadimplência
                              (o agendamento diário roda no Supabase via pg_cron)

   Env: SUPABASE_SERVICE_ROLE_KEY, ASAAS_API_KEY, CRON_SECRET,
        ASAAS_NF_SERVICE_DESCRIPTION / _CODE / _NAME (opcionais)
   ====================================================================== */

const {
  adminClient, requireUser, asaasFetch, asaasGetAll,
  soDigitos, mapCobranca, mapAssinatura, HttpError
} = require('./_asaas');

const MESES_HISTORICO = 18;
const TIPOS_COBRANCA = ['UNDEFINED', 'BOLETO', 'PIX', 'CREDIT_CARD'];
const NF_PAGO = ['RECEIVED', 'CONFIRMED', 'RECEIVED_IN_CASH'];

function parseBody(req){
  let body = req.body || {};
  if(typeof body === 'string'){ try{ body = JSON.parse(body); }catch(e){ body = {}; } }
  return body;
}

/* --------------------------------------------------------------------
   action=sync
   ------------------------------------------------------------------ */
async function acaoSync(req, res, admin){
  const desde = new Date();
  desde.setMonth(desde.getMonth() - MESES_HISTORICO);
  const desdeStr = desde.toISOString().slice(0, 10);

  const [customers, subscriptions, payments] = await Promise.all([
    asaasGetAll('/customers'),
    asaasGetAll('/subscriptions'),
    asaasGetAll('/payments?dateCreated%5Bge%5D=' + desdeStr)
  ]);

  const custByCpf = new Map();
  const custByEmail = new Map();
  for(const c of customers){
    const cpf = soDigitos(c.cpfCnpj);
    const email = String(c.email || '').trim().toLowerCase();
    if(cpf && !custByCpf.has(cpf)) custByCpf.set(cpf, c);
    if(email && !custByEmail.has(email)) custByEmail.set(email, c);
  }

  const [{ data: periodosAbertos }, { data: perfis }, { data: vinculosExistentes }] = await Promise.all([
    admin.from('aluno_financeiro_historico').select('aluno_id, situacao, pausa_automatica').is('data_fim', null),
    admin.from('profiles').select('id, full_name, email'),
    admin.from('aluno_asaas').select('*')
  ]);

  const perfilPorId = new Map((perfis || []).map(p => [p.id, p]));
  const vinculoPorId = new Map((vinculosExistentes || []).map(v => [v.aluno_id, v]));
  const alunosComVinculo = [...new Set((periodosAbertos || []).map(p => p.aluno_id))];

  const linhasAlunoAsaas = [];
  const customerIdPorAluno = new Map();
  let casados = 0, naoEncontrados = 0;

  for(const alunoId of alunosComVinculo){
    const perfil = perfilPorId.get(alunoId) || {};
    const jaTem = vinculoPorId.get(alunoId);

    let customer = null;
    let metodo = jaTem ? jaTem.match_metodo : 'pendente';

    if(jaTem && jaTem.asaas_customer_id){
      customer = customers.find(c => c.id === jaTem.asaas_customer_id) || { id: jaTem.asaas_customer_id };
    } else {
      const cpf = soDigitos(jaTem && jaTem.cpf_cnpj);
      const email = String(perfil.email || '').trim().toLowerCase();
      if(cpf && custByCpf.has(cpf)){ customer = custByCpf.get(cpf); metodo = 'cpf'; }
      else if(email && custByEmail.has(email)){ customer = custByEmail.get(email); metodo = 'email'; }
      else { metodo = 'nao_encontrado'; }
    }

    if(customer && customer.id){ customerIdPorAluno.set(alunoId, customer.id); casados++; }
    else { naoEncontrados++; }

    linhasAlunoAsaas.push({
      aluno_id: alunoId,
      cpf_cnpj: soDigitos((customer && customer.cpfCnpj) || (jaTem && jaTem.cpf_cnpj)) || null,
      asaas_customer_id: (customer && customer.id) || null,
      match_metodo: metodo,
      nome_asaas: (customer && customer.name) || (jaTem && jaTem.nome_asaas) || null,
      email_asaas: (customer && customer.email) || (jaTem && jaTem.email_asaas) || null,
      sincronizado_em: new Date().toISOString(),
      atualizado_em: new Date().toISOString()
    });
  }

  // asaas_customer_id é unique: se dois alunos casaram com o mesmo cliente,
  // só o primeiro fica vinculado; os outros viram "nao_encontrado".
  const customerJaUsado = new Set();
  let conflitos = 0;
  for(const linha of linhasAlunoAsaas){
    if(!linha.asaas_customer_id) continue;
    if(customerJaUsado.has(linha.asaas_customer_id)){
      linha.asaas_customer_id = null;
      linha.match_metodo = 'nao_encontrado';
      customerIdPorAluno.delete(linha.aluno_id);
      casados--; naoEncontrados++; conflitos++;
    } else {
      customerJaUsado.add(linha.asaas_customer_id);
    }
  }

  if(linhasAlunoAsaas.length){
    const { error } = await admin.from('aluno_asaas').upsert(linhasAlunoAsaas, { onConflict: 'aluno_id' });
    if(error) throw new HttpError(500, 'Erro salvando vínculos aluno_asaas: ' + error.message);
  }

  const alunoPorCustomer = new Map();
  for(const [alunoId, custId] of customerIdPorAluno) alunoPorCustomer.set(custId, alunoId);
  for(const v of (vinculosExistentes || [])){
    if(v.asaas_customer_id && !alunoPorCustomer.has(v.asaas_customer_id)) alunoPorCustomer.set(v.asaas_customer_id, v.aluno_id);
  }

  const linhasAssin = subscriptions.map(s => ({
    ...mapAssinatura(s),
    aluno_id: alunoPorCustomer.get(s.customer) || null,
    sincronizado_em: new Date().toISOString()
  }));
  if(linhasAssin.length){
    const { error } = await admin.from('asaas_assinaturas').upsert(linhasAssin, { onConflict: 'id' });
    if(error) throw new HttpError(500, 'Erro salvando assinaturas: ' + error.message);
  }

  const abertas = payments.filter(p => p.status === 'PENDING' || p.status === 'OVERDUE').slice(0, 60);
  const pixPorId = new Map();
  for(let i = 0; i < abertas.length; i += 6){
    await Promise.all(abertas.slice(i, i + 6).map(async p => {
      try{
        const qr = await asaasFetch('/payments/' + p.id + '/pixQrCode');
        if(qr && qr.payload) pixPorId.set(p.id, qr.payload);
      }catch(e){}
    }));
  }

  const linhasCobr = payments.map(p => ({
    ...mapCobranca(p, { pixPayload: pixPorId.get(p.id) }),
    aluno_id: alunoPorCustomer.get(p.customer) || null,
    sincronizado_em: new Date().toISOString()
  }));
  for(let i = 0; i < linhasCobr.length; i += 500){
    const { error } = await admin.from('asaas_cobrancas').upsert(linhasCobr.slice(i, i + 500), { onConflict: 'id' });
    if(error) throw new HttpError(500, 'Erro salvando cobranças: ' + error.message);
  }

  // regra dos 14 dias, aplicada agora (mesma lógica do pg_cron)
  const { data: cron } = await admin.rpc('fn_asaas_cron_inadimplencia');

  res.status(200).json({
    ok: true,
    sincronizado_em: new Date().toISOString(),
    alunos_com_vinculo: alunosComVinculo.length,
    casados,
    nao_encontrados: naoEncontrados,
    clientes_asaas: customers.length,
    assinaturas: linhasAssin.length,
    cobrancas: linhasCobr.length,
    conflitos_de_cliente: conflitos,
    suspensos: (cron && cron.suspensos) || 0,
    reativados: (cron && cron.reativados) || 0
  });
}

/* --------------------------------------------------------------------
   action=link
   ------------------------------------------------------------------ */
async function acaoLink(req, res, admin){
  const body = parseBody(req);
  const alunoId = body.aluno_id;
  const customerId = String(body.asaas_customer_id || '').trim();
  if(!alunoId || !customerId){ res.status(400).json({ error: 'Informe aluno_id e asaas_customer_id.' }); return; }

  const { data: perfil } = await admin.from('profiles').select('id').eq('id', alunoId).maybeSingle();
  if(!perfil){ res.status(404).json({ error: 'Aluno não encontrado.' }); return; }

  const { data: emUso } = await admin.from('aluno_asaas')
    .select('aluno_id').eq('asaas_customer_id', customerId).neq('aluno_id', alunoId).maybeSingle();
  if(emUso){ res.status(409).json({ error: 'Esse cliente do Asaas já está vinculado a outro aluno.' }); return; }

  let customer;
  try{ customer = await asaasFetch('/customers/' + encodeURIComponent(customerId)); }
  catch(e){ res.status(404).json({ error: 'Cliente não encontrado no Asaas (confira o ID cus_...).' }); return; }

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

  const [subs, pays] = await Promise.all([
    asaasGetAll('/subscriptions?customer=' + encodeURIComponent(customer.id)),
    asaasGetAll('/payments?customer=' + encodeURIComponent(customer.id))
  ]);

  if(subs.length){
    await admin.from('asaas_assinaturas').upsert(
      subs.map(s => ({ ...mapAssinatura(s), aluno_id: alunoId, sincronizado_em: agora })), { onConflict: 'id' });
  }
  if(pays.length){
    const pixPorId = new Map();
    for(const p of pays.filter(p => p.status === 'PENDING' || p.status === 'OVERDUE').slice(0, 40)){
      try{ const qr = await asaasFetch('/payments/' + p.id + '/pixQrCode'); if(qr && qr.payload) pixPorId.set(p.id, qr.payload); }catch(e){}
    }
    await admin.from('asaas_cobrancas').upsert(
      pays.map(p => ({ ...mapCobranca(p, { pixPayload: pixPorId.get(p.id) }), aluno_id: alunoId, sincronizado_em: agora })), { onConflict: 'id' });
  }

  res.status(200).json({ ok: true, cliente: { id: customer.id, nome: customer.name }, assinaturas: subs.length, cobrancas: pays.length });
}

/* --------------------------------------------------------------------
   action=cobranca
   ------------------------------------------------------------------ */
async function acaoCobranca(req, res, admin){
  const body = parseBody(req);
  const alunoId = body.aluno_id;
  const valor = Number(body.valor);
  const vencimento = String(body.vencimento || '').slice(0, 10);
  const descricao = String(body.descricao || '').trim();
  const billingType = TIPOS_COBRANCA.includes(body.billing_type) ? body.billing_type : 'UNDEFINED';

  if(!alunoId || !(valor > 0) || !/^\d{4}-\d{2}-\d{2}$/.test(vencimento)){
    res.status(400).json({ error: 'Informe aluno, valor (> 0) e vencimento (AAAA-MM-DD).' }); return;
  }

  const { data: vinculo } = await admin.from('aluno_asaas').select('asaas_customer_id').eq('aluno_id', alunoId).maybeSingle();
  if(!vinculo || !vinculo.asaas_customer_id){
    res.status(409).json({ error: 'Esse aluno ainda não está associado a um cliente do Asaas. Sincronize ou vincule manualmente primeiro.' }); return;
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
    ...mapCobranca(pay, { pixPayload }), aluno_id: alunoId, avulsa: true, sincronizado_em: agora
  }, { onConflict: 'id' });
  if(error) throw new HttpError(500, 'Cobrança criada no Asaas, mas falhou ao salvar no sistema: ' + error.message);

  res.status(200).json({
    ok: true, cobranca_id: pay.id,
    invoiceUrl: pay.invoiceUrl || null, bankSlipUrl: pay.bankSlipUrl || null,
    pixPayload, valor: pay.value, vencimento: pay.dueDate
  });
}

/* --------------------------------------------------------------------
   action=nota
   ------------------------------------------------------------------ */
async function acaoNota(req, res, admin, ctx){
  const ehGestao = ctx.role === 'financeiro' || ctx.role === 'admin';
  const body = parseBody(req);
  const cobrancaId = String(body.cobranca_id || '').trim();
  if(!cobrancaId){ res.status(400).json({ error: 'Informe cobranca_id.' }); return; }

  const { data: cobr } = await admin.from('asaas_cobrancas').select('*').eq('id', cobrancaId).maybeSingle();
  if(!cobr){ res.status(404).json({ error: 'Cobrança não encontrada.' }); return; }

  if(!ehGestao){
    if(cobr.aluno_id !== ctx.user.id){ res.status(403).json({ error: 'Essa cobrança não é sua.' }); return; }
    if(cobr.billing_type !== 'BOLETO' || !NF_PAGO.includes(cobr.status)){
      res.status(403).json({ error: 'A nota fiscal só pode ser emitida para boletos já pagos.' }); return;
    }
  }

  const lista = await asaasFetch('/invoices?payment=' + encodeURIComponent(cobrancaId) + '&limit=10');
  let invoice = (lista && lista.data && lista.data[0]) || null;

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

  if(invoice && ['SCHEDULED', 'SYNCHRONIZED'].includes(invoice.status)){
    try{ invoice = await asaasFetch('/invoices/' + invoice.id + '/authorize', { method: 'POST' }); }catch(e){}
  }

  const patch = {
    nota_fiscal_id: invoice.id,
    nota_fiscal_status: invoice.status || null,
    nota_fiscal_url: invoice.pdfUrl || invoice.xmlUrl || null,
    sincronizado_em: new Date().toISOString()
  };
  const { error } = await admin.from('asaas_cobrancas').update(patch).eq('id', cobrancaId);
  if(error) throw new HttpError(500, 'NF acionada no Asaas, mas falhou ao salvar: ' + error.message);

  res.status(200).json({ ok: true, ...patch });
}

/* --------------------------------------------------------------------
   action=cron  (gatilho manual; o diário roda no pg_cron do Supabase)
   ------------------------------------------------------------------ */
async function acaoCron(req, res, admin){
  const secret = process.env.CRON_SECRET;
  if(!secret){ res.status(500).json({ error: 'CRON_SECRET não configurado.' }); return; }
  if((req.headers.authorization || '') !== 'Bearer ' + secret){ res.status(401).json({ error: 'Não autorizado.' }); return; }
  const { data, error } = await admin.rpc('fn_asaas_cron_inadimplencia');
  if(error){ res.status(500).json({ error: 'Erro na varredura: ' + error.message }); return; }
  res.status(200).json({ ok: true, ...(data || {}) });
}

/* -------------------------------------------------------------------- */
const ACOES = { sync: acaoSync, link: acaoLink, cobranca: acaoCobranca, nota: acaoNota, cron: acaoCron };

async function run(req, res){
  const action = String((req.query && req.query.action) || parseBody(req).action || '').trim();
  const fn = ACOES[action];
  if(!fn){ res.status(400).json({ error: 'Ação inválida: "' + action + '".' }); return; }

  const admin = adminClient();

  if(action === 'cron'){ await acaoCron(req, res, admin); return; }

  if(req.method !== 'POST'){ res.status(405).json({ error: 'Método não permitido.' }); return; }
  const rolesOk = action === 'nota'
    ? ['financeiro', 'admin', 'student', 'teacher']
    : ['financeiro', 'admin'];
  const ctx = await requireUser(req, admin, rolesOk);
  await fn(req, res, admin, ctx);
}

module.exports = async function handler(req, res){
  try{ await run(req, res); }
  catch(err){
    const status = err && err.status ? err.status : 500;
    if(!res.headersSent) res.status(status).json({ error: (err && err.message) || String(err) });
  }
};
module.exports.config = { maxDuration: 60 };
