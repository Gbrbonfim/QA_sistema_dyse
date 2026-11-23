/* ======================================================================
   DYSE · Função serverless (Vercel) — gera os áudios das atividades
   ----------------------------------------------------------------------
   Recebe { itens: [{ texto, voz }] } (voz "f" ou "m", até 25 por chamada),
   gera cada frase na ElevenLabs e salva o MP3 no Supabase Storage, bucket
   público "audios-atividades", com o MESMO nome que o praticas.js procura
   (chaveAudio). Frase que já tem áudio no bucket não é gerada de novo.

   Só gestão ou professor(a). Os alunos só tocam os arquivos prontos.

   Variáveis de ambiente (já existentes na Vercel):
     SUPABASE_SERVICE_ROLE_KEY, ELEVENLABS_API_KEY
   ====================================================================== */

const SUPABASE_URL = "https://vnpjsjrqghttsagbssxx.supabase.co";
const BUCKET = 'audios-atividades';
// Mesmas vozes e modelo do scripts/gerar-audios.ps1: f = Bella, m = Chris.
const VOZES = { f: 'hpp4J3VqNfWAUOO0d1Us', m: 'iP95p4xoKVk53GoZ742B' };
const MODELO = 'eleven_multilingual_v2';
const MAX_ITENS = 25;

// Igual ao chaveAudio() do praticas.js (FNV-1a de "voz|texto").
function chaveAudio(texto, voz){
  const s = voz + '|' + String(texto || '').trim();
  let h = 0x811c9dc5;
  for(const ch of s){ h ^= ch.codePointAt(0); h = Math.imul(h, 0x01000193) >>> 0; }
  return voz + '-' + h.toString(16).padStart(8, '0');
}

async function run(req, res){
  if(req.method !== 'POST'){ res.status(405).json({ error: 'Método não permitido.' }); return; }

  const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const XI_KEY = process.env.ELEVENLABS_API_KEY;
  if(!SERVICE_ROLE_KEY || !XI_KEY){ res.status(500).json({ error: 'Geração de áudio não configurada no servidor.' }); return; }

  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if(!token){ res.status(401).json({ error: 'Não autenticado.' }); return; }

  const { createClient } = require('@supabase/supabase-js');
  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { auth: { autoRefreshToken: false, persistSession: false } });
  const { data: userData, error: userError } = await admin.auth.getUser(token);
  if(userError || !userData || !userData.user){ res.status(401).json({ error: 'Sessão inválida ou expirada.' }); return; }
  const { data: profile } = await admin.from('profiles').select('role').eq('id', userData.user.id).maybeSingle();
  const role = profile ? String(profile.role || '').trim().toLowerCase() : '';
  if(role !== 'admin' && role !== 'financeiro' && role !== 'teacher'){
    res.status(403).json({ error: 'Só gestão ou professor(a) pode gerar áudios.' });
    return;
  }

  let body = req.body || {};
  if(typeof body === 'string'){ try{ body = JSON.parse(body); }catch(e){ body = {}; } }
  const itens = (Array.isArray(body.itens) ? body.itens : [])
    .map(x => ({ texto: String((x && x.texto) || '').trim(), voz: x && x.voz === 'm' ? 'm' : 'f' }))
    .filter(x => x.texto && x.texto.length <= 300);
  if(!itens.length){ res.status(400).json({ error: 'Nenhuma frase enviada.' }); return; }
  if(itens.length > MAX_ITENS){ res.status(400).json({ error: 'Máximo de ' + MAX_ITENS + ' frases por vez.' }); return; }

  // O que já existe no bucket não é gerado de novo (não gasta crédito).
  const { data: existentes } = await admin.storage.from(BUCKET).list('', { limit: 10000 });
  const ja = new Set((existentes || []).map(f => f.name));

  const resultado = [];
  for(const it of itens){
    const chave = chaveAudio(it.texto, it.voz);
    if(ja.has(chave + '.mp3')){ resultado.push({ chave, status: 'existia' }); continue; }
    const r = await fetch('https://api.elevenlabs.io/v1/text-to-speech/' + VOZES[it.voz] + '?output_format=mp3_44100_64', {
      method: 'POST',
      headers: { 'xi-api-key': XI_KEY, 'Content-Type': 'application/json', 'Accept': 'audio/mpeg' },
      body: JSON.stringify({ text: it.texto, model_id: MODELO, voice_settings: { stability: 0.55, similarity_boost: 0.75 } })
    });
    if(!r.ok){
      const det = await r.text().catch(() => '');
      console.error('ElevenLabs TTS', r.status, det.slice(0, 300));
      resultado.push({ chave, status: 'erro', erro: 'ElevenLabs ' + r.status + ': ' + det.slice(0, 200) });
      if(r.status === 401 || r.status === 402 || /quota/i.test(det)) break;   // sem crédito: para
      continue;
    }
    const mp3 = Buffer.from(await r.arrayBuffer());
    const up = await admin.storage.from(BUCKET).upload(chave + '.mp3', mp3, { contentType: 'audio/mpeg', upsert: true, cacheControl: '31536000' });
    resultado.push(up.error ? { chave, status: 'erro', erro: 'Storage: ' + up.error.message } : { chave, status: 'gerado' });
  }
  res.status(200).json({ resultado });
}

async function handler(req, res){
  try{
    await run(req, res);
  }catch(err){
    console.error('gerar-audio', err);
    if(!res.headersSent) res.status(500).json({ error: 'Falha ao gerar áudio.' });
  }
}

module.exports = handler;
module.exports.config = { maxDuration: 60 };
