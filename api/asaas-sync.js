/* ======================================================================
   DYSE · Função serverless (Vercel) — sincroniza o Asaas com o sistema
   ----------------------------------------------------------------------
   POST, só gestão/financeiro. Puxa clientes, assinaturas e cobranças do
   Asaas (paginado, poucas chamadas), casa cada aluno com vínculo
   financeiro ao cliente do Asaas (por CPF, senão por e-mail), faz o
   backfill do CPF em aluno_asaas, atualiza os caches asaas_assinaturas /
   asaas_cobrancas e aplica na hora a regra de inadimplência de 14 dias
   (fn_asaas_suspender / fn_asaas_reativar) pra não depender do cron na
   primeira carga.

   Env: SUPABASE_SERVICE_ROLE_KEY, ASAAS_API_KEY  (ver api/_asaas.js)
   ====================================================================== */

const {
  adminClient, requireUser, asaasFetch, asaasGetAll,
  soDigitos, mapCobranca, mapAssinatura, HttpError
} = require('./_asaas');

const MESES_HISTORICO = 18;

async function run(req, res){
  if(req.method !== 'POST'){ res.status(405).json({ error: 'Método não permitido.' }); return; }

  const admin = adminClient();
  await requireUser(req, admin, ['financeiro', 'admin']);

  // 1) Dados do Asaas (poucas chamadas — paginação de 100)
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

  // 2) Dados do sistema
  const [{ data: periodosAbertos }, { data: perfis }, { data: vinculosExistentes }] = await Promise.all([
    admin.from('aluno_financeiro_historico')
      .select('aluno_id, situacao, pausa_automatica')
      .is('data_fim', null),
    admin.from('profiles').select('id, full_name, email'),
    admin.from('aluno_asaas').select('*')
  ]);

  const perfilPorId = new Map((perfis || []).map(p => [p.id, p]));
  const vinculoPorId = new Map((vinculosExistentes || []).map(v => [v.aluno_id, v]));
  const alunosComVinculo = [...new Set((periodosAbertos || []).map(p => p.aluno_id))];

  // 3) Casa cada aluno com o cliente Asaas
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

    if(customer && customer.id){
      customerIdPorAluno.set(alunoId, customer.id);
      casados++;
    } else {
      naoEncontrados++;
    }

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

  // asaas_customer_id é unique: se dois alunos casaram com o mesmo cliente
  // (e-mails/CPFs iguais na base), só o primeiro fica vinculado; os outros
  // caem em "nao_encontrado" pra resolução manual (senão o upsert quebra).
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

  // customer_id -> aluno_id (inclui os que já estavam vinculados)
  const alunoPorCustomer = new Map();
  for(const [alunoId, custId] of customerIdPorAluno) alunoPorCustomer.set(custId, alunoId);
  for(const v of (vinculosExistentes || [])){
    if(v.asaas_customer_id && !alunoPorCustomer.has(v.asaas_customer_id)) alunoPorCustomer.set(v.asaas_customer_id, v.aluno_id);
  }

  // 4) Cache das assinaturas
  const linhasAssin = subscriptions.map(s => ({
    ...mapAssinatura(s),
    aluno_id: alunoPorCustomer.get(s.customer) || null,
    sincronizado_em: new Date().toISOString()
  }));
  if(linhasAssin.length){
    const { error } = await admin.from('asaas_assinaturas').upsert(linhasAssin, { onConflict: 'id' });
    if(error) throw new HttpError(500, 'Erro salvando assinaturas: ' + error.message);
  }

  // 5) Cache das cobranças. Pra cobrança em aberto, busca o copia-e-cola do
  //    PIX (chamada extra, mas são poucas — inadimplência real é pequena).
  const abertas = payments.filter(p => p.status === 'PENDING' || p.status === 'OVERDUE').slice(0, 60);
  const pixPorId = new Map();
  for(let i = 0; i < abertas.length; i += 6){
    await Promise.all(abertas.slice(i, i + 6).map(async p => {
      try{
        const qr = await asaasFetch('/payments/' + p.id + '/pixQrCode');
        if(qr && qr.payload) pixPorId.set(p.id, qr.payload);
      }catch(e){ /* nem toda cobrança tem PIX; segue sem */ }
    }));
  }

  const linhasCobr = payments.map(p => ({
    ...mapCobranca(p, { pixPayload: pixPorId.get(p.id) }),
    aluno_id: alunoPorCustomer.get(p.customer) || null,
    sincronizado_em: new Date().toISOString()
  }));
  if(linhasCobr.length){
    // upsert em blocos (evita payload gigante)
    for(let i = 0; i < linhasCobr.length; i += 500){
      const { error } = await admin.from('asaas_cobrancas').upsert(linhasCobr.slice(i, i + 500), { onConflict: 'id' });
      if(error) throw new HttpError(500, 'Erro salvando cobranças: ' + error.message);
    }
  }

  // 6) Regra dos 14 dias, aplicada agora
  const hoje = new Date();
  const limite = new Date(hoje); limite.setDate(limite.getDate() - 14);
  const limiteStr = limite.toISOString().slice(0, 10);

  const vencidasPorAluno = new Map(); // aluno_id -> tem OVERDUE (qualquer)
  const vencidas14PorAluno = new Map(); // aluno_id -> tem OVERDUE com vencimento <= hoje-14
  for(const p of payments){
    const alunoId = alunoPorCustomer.get(p.customer);
    if(!alunoId) continue;
    if(p.status === 'OVERDUE'){
      vencidasPorAluno.set(alunoId, true);
      if(p.dueDate && p.dueDate <= limiteStr) vencidas14PorAluno.set(alunoId, true);
    }
  }

  const situacaoPorAluno = new Map((periodosAbertos || []).map(p => [p.aluno_id, p]));
  let suspensos = 0, reativados = 0;

  for(const alunoId of alunosComVinculo){
    const per = situacaoPorAluno.get(alunoId);
    if(!per) continue;
    if(per.situacao === 'ativo' && vencidas14PorAluno.get(alunoId)){
      const { error } = await admin.rpc('fn_asaas_suspender', {
        p_aluno_id: alunoId,
        p_motivo: 'Suspensão automática: cobrança do Asaas vencida há mais de 14 dias.'
      });
      if(!error) suspensos++;
    } else if(per.situacao === 'pausado' && per.pausa_automatica && !vencidasPorAluno.get(alunoId)){
      const { error } = await admin.rpc('fn_asaas_reativar', {
        p_aluno_id: alunoId,
        p_motivo: 'Reativação automática: cobranças do Asaas regularizadas.'
      });
      if(!error) reativados++;
    }
  }

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
    suspensos,
    reativados
  });
}

module.exports = async function handler(req, res){
  try{
    await run(req, res);
  }catch(err){
    const status = err && err.status ? err.status : 500;
    if(!res.headersSent) res.status(status).json({ error: (err && err.message) || String(err) });
  }
};
module.exports.config = { maxDuration: 60 };
