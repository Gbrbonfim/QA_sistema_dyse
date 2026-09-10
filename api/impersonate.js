/* ======================================================================
   DYSE · Função serverless (Vercel) — "Acessar conta" (gestão entra na
   conta de um professor sem a senha dele)
   ----------------------------------------------------------------------
   Mesma chave/configuração de api/create-student.js (SUPABASE_SERVICE_ROLE_KEY
   como variável de ambiente do servidor — nunca no navegador).

   O que faz: confirma que quem chama é gestão (admin/financeiro) logada de
   verdade, confirma que o alvo é um PROFESSOR (nunca outro admin), e gera
   um magic link de uso único (Auth Admin API generateLink) que, ao ser
   aberto no navegador, loga como esse professor e cai em /login.html, que
   redireciona pro painel dele. Registra a ação em financeiro_auditoria.

   Observação de segurança: o link substitui a sessão de quem clicou neste
   navegador. Pra voltar pra gestão, faz login de novo.

   Config no Supabase: em Authentication → URL Configuration, a lista de
   "Redirect URLs" precisa cobrir <origin>/login.html (ex.: https://SEU_DOMINIO/**).
   ====================================================================== */

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "https://vnpjsjrqghttsagbssxx.supabase.co";
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

module.exports = async function handler(req, res){
  if(req.method !== 'POST'){
    res.status(405).json({ error: 'Método não permitido.' });
    return;
  }
  if(!SERVICE_ROLE_KEY){
    res.status(500).json({ error: 'SUPABASE_SERVICE_ROLE_KEY não configurada neste ambiente. Veja api/create-student.js.' });
    return;
  }

  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if(!token){
    res.status(401).json({ error: 'Não autenticado.' });
    return;
  }

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false }
  });

  const { data: userData, error: userError } = await admin.auth.getUser(token);
  if(userError || !userData || !userData.user){
    res.status(401).json({ error: 'Sessão inválida ou expirada.' });
    return;
  }

  const { data: caller, error: callerError } = await admin
    .from('profiles').select('role').eq('id', userData.user.id).maybeSingle();
  const callerRole = caller ? String(caller.role || '').trim().toLowerCase() : '';
  if(callerError || !caller || (callerRole !== 'admin' && callerRole !== 'financeiro')){
    res.status(403).json({ error: 'Só a gestão pode acessar a conta de outra pessoa.' });
    return;
  }

  const body = req.body || {};
  const targetUserId = (body.user_id || '').trim();
  if(!targetUserId){
    res.status(400).json({ error: 'user_id é obrigatório.' });
    return;
  }
  if(targetUserId === userData.user.id){
    res.status(400).json({ error: 'Você já está na sua própria conta.' });
    return;
  }

  const { data: alvo } = await admin
    .from('profiles').select('role, also_teacher, full_name').eq('id', targetUserId).maybeSingle();
  if(!alvo){
    res.status(404).json({ error: 'Conta não encontrada.' });
    return;
  }
  const alvoRole = String(alvo.role || '').trim().toLowerCase();
  const alvoEhProfessor = (alvoRole === 'teacher' || alvo.also_teacher === true) && alvoRole !== 'admin' && alvoRole !== 'financeiro';
  if(!alvoEhProfessor){
    res.status(403).json({ error: 'Por aqui só dá pra acessar a conta de um professor.' });
    return;
  }

  const { data: alvoAuth, error: alvoAuthError } = await admin.auth.admin.getUserById(targetUserId);
  const alvoEmail = alvoAuth && alvoAuth.user ? alvoAuth.user.email : null;
  if(alvoAuthError || !alvoEmail){
    res.status(400).json({ error: 'Essa conta não tem e-mail — não dá pra gerar o acesso.' });
    return;
  }

  const origin = req.headers.origin || ('https://' + (req.headers.host || ''));
  const redirectTo = origin + '/login.html';

  const { data: link, error: linkError } = await admin.auth.admin.generateLink({
    type: 'magiclink',
    email: alvoEmail,
    options: { redirectTo }
  });
  if(linkError || !link || !link.properties || !link.properties.action_link){
    res.status(400).json({ error: (linkError && linkError.message) || 'Não foi possível gerar o link de acesso.' });
    return;
  }

  // Trilha de auditoria — nunca trava o acesso se falhar.
  try{
    await admin.from('financeiro_auditoria').insert({
      tabela: 'auth.impersonate',
      registro_id: targetUserId,
      acao: 'acessar_conta',
      usuario_id: userData.user.id,
      dados_depois: { alvo_email: alvoEmail, alvo_nome: alvo.full_name || null }
    });
  }catch(e){ /* ignora */ }

  res.status(200).json({
    ok: true,
    url: link.properties.action_link,
    email: alvoEmail,
    nome: alvo.full_name || alvoEmail
  });
};
