/* ======================================================================
   DYSE · Função serverless (Vercel) — transcrição de voz das atividades
   ----------------------------------------------------------------------
   Recebe o áudio gravado pelo aluno (corpo bruto: audio/webm, audio/mp4,
   audio/ogg…) e devolve { texto } com o que ele disse em inglês.

   É a RESERVA das atividades de fala: o navegador tenta reconhecer a voz
   sozinho (Chrome, Edge, Safari); quando não tem reconhecimento (Firefox,
   alguns Androids/apps) ou ele falha, o áudio vem para cá. Assim a
   atividade funciona em qualquer navegador que grave áudio.

   Só usuário logado (qualquer papel). Áudio até 3 MB (~1 min).

   Variáveis de ambiente necessárias na Vercel:
     SUPABASE_SERVICE_ROLE_KEY  (já usada pelas outras funções)
     ELEVENLABS_API_KEY         (elevenlabs.io → Developers → API Keys)
     ELEVENLABS_STT_MODEL       (opcional; padrão scribe_v1)
   ====================================================================== */

const SUPABASE_URL = "https://vnpjsjrqghttsagbssxx.supabase.co";
const LIMITE = 3 * 1024 * 1024;

function lerCorpo(req){
  return new Promise((ok, falha) => {
    const partes = []; let tam = 0;
    req.on('data', c => {
      tam += c.length;
      if(tam > LIMITE){ falha(new Error('grande')); req.destroy(); return; }
      partes.push(c);
    });
    req.on('end', () => ok(Buffer.concat(partes)));
    req.on('error', falha);
  });
}

async function run(req, res){
  if(req.method !== 'POST'){ res.status(405).json({ error: 'Método não permitido.' }); return; }

  const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const XI_KEY = process.env.ELEVENLABS_API_KEY;
  if(!SERVICE_ROLE_KEY || !XI_KEY){ res.status(500).json({ error: 'Transcrição não configurada no servidor.' }); return; }

  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if(!token){ res.status(401).json({ error: 'Não autenticado.' }); return; }

  const { createClient } = require('@supabase/supabase-js');
  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { auth: { autoRefreshToken: false, persistSession: false } });
  const { data: userData, error: userError } = await admin.auth.getUser(token);
  if(userError || !userData || !userData.user){ res.status(401).json({ error: 'Sessão inválida ou expirada.' }); return; }

  let audio;
  try{ audio = await lerCorpo(req); }
  catch(e){ res.status(413).json({ error: 'Áudio grande demais.' }); return; }
  if(!audio || audio.length < 200){ res.status(400).json({ error: 'Áudio vazio.' }); return; }

  const tipo = String(req.headers['content-type'] || 'application/octet-stream').split(';')[0];
  const ext = /mp4|m4a|aac/.test(tipo) ? 'm4a' : /ogg/.test(tipo) ? 'ogg' : /wav/.test(tipo) ? 'wav' : 'webm';

  const form = new FormData();
  form.append('model_id', process.env.ELEVENLABS_STT_MODEL || 'scribe_v1');
  form.append('language_code', 'en');
  form.append('tag_audio_events', 'false');
  form.append('file', new Blob([audio], { type: tipo }), 'fala.' + ext);

  const r = await fetch('https://api.elevenlabs.io/v1/speech-to-text', {
    method: 'POST',
    headers: { 'xi-api-key': XI_KEY },
    body: form
  });
  if(!r.ok){
    const det = await r.text().catch(() => '');
    console.error('ElevenLabs STT', r.status, det.slice(0, 300));
    res.status(502).json({ error: 'Não consegui transcrever agora.' });
    return;
  }
  const j = await r.json();
  res.status(200).json({ texto: String(j.text || '').trim() });
}

async function handler(req, res){
  try{
    await run(req, res);
  }catch(err){
    console.error('transcrever', err);
    if(!res.headersSent) res.status(500).json({ error: 'Falha na transcrição.' });
  }
}

module.exports = handler;
module.exports.config = { maxDuration: 30 };
