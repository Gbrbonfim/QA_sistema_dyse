/* ======================================================================
   DYSE · Função serverless (Vercel) — exclusão definitiva de aluno
   ----------------------------------------------------------------------
   Mesma chave/configuração de api/create-student.js (SUPABASE_SERVICE_ROLE_KEY
   como variável de ambiente do servidor — nunca no navegador).

   Por que isso precisa existir: apagar só a linha de "profiles" pelo Table
   Editor do Supabase NÃO remove a conta de "auth.users" — o e-mail continua
   registrado e a pessoa não pode ser recadastrada, nem consegue logar de
   verdade. A exclusão correta tem que passar pela Auth Admin API
   (auth.admin.deleteUser), que aí sim remove de auth.users — e como
   profiles.id referencia auth.users com "on delete cascade", o perfil some
   junto automaticamente.
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

  // Confirma que quem está chamando é "admin".
  const { data: profile, error: profileError } = await admin
    .from('profiles')
    .select('role')
    .eq('id', userData.user.id)
    .maybeSingle();
  if(profileError || !profile || String(profile.role || '').trim().toLowerCase() !== 'admin'){
    res.status(403).json({ error: 'Só a gestão pode excluir usuários.' });
    return;
  }

  const body = req.body || {};
  const userId = (body.user_id || '').trim();
  if(!userId){
    res.status(400).json({ error: 'user_id é obrigatório.' });
    return;
  }
  if(userId === userData.user.id){
    res.status(400).json({ error: 'Você não pode excluir a própria conta por aqui.' });
    return;
  }

  const { error: deleteError } = await admin.auth.admin.deleteUser(userId);
  if(deleteError){
    res.status(400).json({ error: deleteError.message });
    return;
  }

  res.status(200).json({ ok: true });
};
