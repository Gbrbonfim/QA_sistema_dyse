/* ======================================================================
   DYSE · Função serverless (Vercel) — cadastro de aluno pela gestão
   ----------------------------------------------------------------------
   Único lugar do projeto que usa a chave "service_role" do Supabase — ela
   NUNCA pode ir para nenhum arquivo servido ao navegador (dyse-auth.js,
   gestao.html, etc.), só existe aqui, do lado do servidor, lida de uma
   variável de ambiente da Vercel.

   Configuração necessária (uma vez, no painel da Vercel do projeto que
   serve este QA):
     Settings → Environment Variables → adicionar
       SUPABASE_SERVICE_ROLE_KEY = (Supabase → Project Settings → API →
       "service_role" secret — NÃO é a "anon" key que já está em
       assets/dyse-auth.js)
     Redeploy depois de salvar a variável.

   O que faz: recebe nome + e-mail de um aluno novo, confirma que quem
   está chamando é uma conta "admin" logada de verdade (via token da
   sessão), cria a conta do aluno no Supabase Auth e dispara o e-mail de
   convite (o próprio Supabase manda o link pra o aluno definir a senha).
   O gatilho "handle_new_user" do banco cria a linha em "profiles"
   automaticamente como "student" assim que a conta é criada.
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

  // Confirma que quem está chamando é "admin" — mesma checagem que a RLS
  // já faz no banco, repetida aqui porque a service_role ignora RLS.
  const { data: profile, error: profileError } = await admin
    .from('profiles')
    .select('role')
    .eq('id', userData.user.id)
    .maybeSingle();
  if(profileError || !profile || String(profile.role || '').trim().toLowerCase() !== 'admin'){
    res.status(403).json({ error: 'Só a gestão pode cadastrar alunos.' });
    return;
  }

  const body = req.body || {};
  const fullName = (body.full_name || '').trim();
  const email = (body.email || '').trim();
  if(!fullName || !email){
    res.status(400).json({ error: 'Nome e e-mail são obrigatórios.' });
    return;
  }

  const { data: invited, error: inviteError } = await admin.auth.admin.inviteUserByEmail(email, {
    data: { full_name: fullName }
  });
  if(inviteError){
    res.status(400).json({ error: inviteError.message });
    return;
  }

  res.status(200).json({ ok: true, user_id: invited.user.id });
};
