/* ======================================================================
   DYSE · Função serverless (Vercel) — cadastro de professor(a) pela gestão
   ----------------------------------------------------------------------
   Mesma chave/configuração de api/create-student.js (SUPABASE_SERVICE_ROLE_KEY
   como variável de ambiente do servidor — nunca no navegador).

   O que faz: igual a create-student.js (convida por e-mail, ou cria com
   senha temporária se send_email:false), mas depois de criar a conta troca
   a role do perfil de "student" (valor padrão do gatilho handle_new_user)
   para "teacher" — só assim porque o trigger não sabe distinguir aluno de
   professor na hora do cadastro.
   ====================================================================== */

const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');

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

  // Confirma que quem está chamando é "admin" (ou "financeiro", que é um
  // papel acima de admin — ver supabase-schema.sql).
  const { data: profile, error: profileError } = await admin
    .from('profiles')
    .select('role')
    .eq('id', userData.user.id)
    .maybeSingle();
  const callerRole = profile ? String(profile.role || '').trim().toLowerCase() : '';
  if(profileError || !profile || (callerRole !== 'admin' && callerRole !== 'financeiro')){
    res.status(403).json({ error: 'Só a gestão pode cadastrar professores.' });
    return;
  }

  const body = req.body || {};
  const fullName = (body.full_name || '').trim();
  const email = (body.email || '').trim();
  const sendEmail = body.send_email !== false; // default true — só não manda se vier explicitamente "false"
  if(!fullName || !email){
    res.status(400).json({ error: 'Nome e e-mail são obrigatórios.' });
    return;
  }

  let userId;
  let emailSent = false;

  if(sendEmail){
    const origin = req.headers.origin || ('https://' + req.headers.host);
    const { data: invited, error: inviteError } = await admin.auth.admin.inviteUserByEmail(email, {
      data: { full_name: fullName },
      redirectTo: origin + '/definir-senha.html'
    });
    if(inviteError){
      res.status(400).json({ error: inviteError.message });
      return;
    }
    userId = invited.user.id;
    emailSent = true;
  } else {
    // Mesmo padrão do cadastro em lote de alunos: cria a conta direto com
    // uma senha temporária aleatória, sem disparar e-mail. O acesso real é
    // enviado depois pelo botão "Reenviar acesso".
    const tempPassword = crypto.randomBytes(24).toString('base64');
    const { data: created, error: createError } = await admin.auth.admin.createUser({
      email,
      password: tempPassword,
      email_confirm: true,
      user_metadata: { full_name: fullName }
    });
    if(createError){
      res.status(400).json({ error: createError.message });
      return;
    }
    userId = created.user.id;
  }

  // O gatilho handle_new_user cria a linha em "profiles" como "student"
  // (valor padrão da coluna) — corrige pra "teacher" aqui.
  const { error: roleError } = await admin.from('profiles').update({ role: 'teacher' }).eq('id', userId);
  if(roleError){
    res.status(400).json({ error: 'Conta criada, mas não foi possível marcar como professor(a): ' + roleError.message });
    return;
  }

  res.status(200).json({ ok: true, user_id: userId, email_sent: emailSent });
};
