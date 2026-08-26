/* ======================================================================
   DYSE · Função serverless (Vercel) — editar nome/e-mail de aluno
   ----------------------------------------------------------------------
   Mesma chave/configuração de api/create-student.js (SUPABASE_SERVICE_ROLE_KEY
   como variável de ambiente do servidor — nunca no navegador).

   Por que isso precisa existir: "profiles.email" é só uma cópia salva na
   hora do cadastro (trigger handle_new_user) — atualizar só essa coluna
   pelo Table Editor não muda o e-mail de LOGIN de verdade (auth.users),
   então o aluno continuaria entrando com o e-mail antigo. A troca correta
   passa pela Auth Admin API (auth.admin.updateUserById), que muda
   auth.users, e só depois espelha nome/e-mail em "profiles".
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
    res.status(500).json({ error: 'SUPABASE_SERVICE_ROLE_KEY não configurada neste ambiente. Veja as instruções no topo de api/create-student.js.' });
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

  // Confirma que o token pertence a uma sessão real e válida.
  const { data: userData, error: userError } = await admin.auth.getUser(token);
  if(userError || !userData || !userData.user){
    res.status(401).json({ error: 'Sessão inválida ou expirada.' });
    return;
  }

  // Confirma que quem está chamando é "admin" (ou "financeiro", papel acima
  // de admin — ver supabase-schema.sql).
  const { data: profile, error: profileError } = await admin
    .from('profiles')
    .select('role')
    .eq('id', userData.user.id)
    .maybeSingle();
  const callerRole = profile ? String(profile.role || '').trim().toLowerCase() : '';
  if(profileError || !profile || (callerRole !== 'admin' && callerRole !== 'financeiro')){
    res.status(403).json({ error: 'Só a gestão pode editar dados de outra conta.' });
    return;
  }

  const body = req.body || {};
  const targetUserId = (body.user_id || '').trim();
  const fullName = (body.full_name || '').trim();
  const email = (body.email || '').trim();
  if(!targetUserId || !fullName || !email){
    res.status(400).json({ error: 'user_id, full_name e email são obrigatórios.' });
    return;
  }

  const { error: authUpdateError } = await admin.auth.admin.updateUserById(targetUserId, {
    email,
    email_confirm: true,
    user_metadata: { full_name: fullName }
  });
  if(authUpdateError){
    res.status(400).json({ error: authUpdateError.message });
    return;
  }

  const { error: profileUpdateError } = await admin
    .from('profiles')
    .update({ full_name: fullName, email })
    .eq('id', targetUserId);
  if(profileUpdateError){
    res.status(400).json({ error: profileUpdateError.message });
    return;
  }

  res.status(200).json({ ok: true });
};
