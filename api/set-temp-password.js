/* ======================================================================
   DYSE · Função serverless (Vercel) — senha temporária definida pela gestão
   ----------------------------------------------------------------------
   Mesma chave/configuração de api/create-student.js (SUPABASE_SERVICE_ROLE_KEY
   como variável de ambiente do servidor — nunca no navegador).

   O que faz: recebe o user_id de um aluno ou professor já cadastrado,
   confirma que quem está chamando é "admin"/"financeiro" logado de
   verdade, gera uma senha temporária legível e a define direto na conta
   via Auth Admin API (auth.admin.updateUserById) — sem depender de e-mail
   chegando. A senha volta na resposta pra gestão repassar pro aluno (por
   WhatsApp, por exemplo); ela não fica salva em lugar nenhum do banco.
   ====================================================================== */

const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');

const SUPABASE_URL = "https://vnpjsjrqghttsagbssxx.supabase.co";
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Sem caracteres ambíguos (0/O, 1/l/I) pra facilitar ditar/digitar a senha.
const TEMP_PASSWORD_CHARS = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';

function gerarSenhaTemporaria(tamanho){
  let senha = '';
  for(let i = 0; i < tamanho; i++){
    senha += TEMP_PASSWORD_CHARS[crypto.randomInt(0, TEMP_PASSWORD_CHARS.length)];
  }
  return senha;
}

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
    res.status(403).json({ error: 'Só a gestão pode definir senha de outra conta.' });
    return;
  }

  const body = req.body || {};
  const targetUserId = (body.user_id || '').trim();
  if(!targetUserId){
    res.status(400).json({ error: 'user_id é obrigatório.' });
    return;
  }

  const tempPassword = gerarSenhaTemporaria(10);
  const { data: updated, error: updateError } = await admin.auth.admin.updateUserById(targetUserId, {
    password: tempPassword
  });
  if(updateError){
    res.status(400).json({ error: updateError.message });
    return;
  }

  res.status(200).json({ ok: true, temp_password: tempPassword, email: updated.user.email });
};
