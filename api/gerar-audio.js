/* ======================================================================
   DYSE · Função serverless (Vercel) — gera os áudios das atividades
   ----------------------------------------------------------------------
   Gera a frase na ElevenLabs e salva o MP3 no Supabase Storage, bucket
   público "audios-atividades", com o MESMO nome que o praticas.js procura
   (chaveAudio). Frase que já tem áudio no bucket nunca é gerada de novo.

   Dois usos:
   1) { itens: [{ texto, voz }] } (até 25) — o player chama quando uma frase
      ainda não tem áudio, gera na hora e já fica salvo para todos.
   2) { pendentes: N } (ou GET ?pendentes=N, usado pelo cron diário) — gera
      as próximas N frases da lista oficial que ainda não têm áudio.

   Segurança: sem login de gestão/professor(a), só são aceitas frases que
   estão na lista oficial das atividades (atividades/praticas/audio/fila.json,
   gerada por scripts/gerar-audios.ps1 -Fila junto com cada atividade nova).
   Assim ninguém consegue gastar crédito com texto qualquer.

   Variáveis de ambiente (já existentes na Vercel):
     SUPABASE_SERVICE_ROLE_KEY, ELEVENLABS_API_KEY
   ====================================================================== */

const fs = require('fs');
const path = require('path');

const SUPABASE_URL = "https://vnpjsjrqghttsagbssxx.supabase.co";
const BUCKET = 'audios-atividades';
// Mesmas vozes e modelo do scripts/gerar-audios.ps1: f = Bella, m = Chris.
const VOZES = { f: 'hpp4J3VqNfWAUOO0d1Us', m: 'iP95p4xoKVk53GoZ742B' };
const MODELO = 'eleven_multilingual_v2';
const MAX_ITENS = 25;
const MAX_PENDENTES = 20;
const PARALELO = 4;

// Igual ao chaveAudio() do praticas.js (FNV-1a de "voz|texto").
function chaveAudio(texto, voz){
  const s = voz + '|' + String(texto || '').trim();
  let h = 0x811c9dc5;
  for(const ch of s){ h ^= ch.codePointAt(0); h = Math.imul(h, 0x01000193) >>> 0; }
  return voz + '-' + h.toString(16).padStart(8, '0');
}

let FILA = null;
function lerFila(){
  if(FILA) return FILA;
  try{
    const bruto = fs.readFileSync(path.join(process.cwd(), 'atividades', 'praticas', 'audio', 'fila.json'), 'utf8').replace(/^﻿/, '');
    FILA = JSON.parse(bruto).map(x => ({ texto: String(x.t || '').trim(), voz: x.v === 'm' ? 'm' : 'f' })).filter(x => x.texto);
  }catch(e){ console.error('gerar-audio: fila.json', e); FILA = []; }
  return FILA;
}

async function ehEquipe(admin, req){
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if(!token) return false;
  const { data: userData, error } = await admin.auth.getUser(token);
  if(error || !userData || !userData.user) return false;
  const { data: profile } = await admin.from('profiles').select('role').eq('id', userData.user.id).maybeSingle();
  const role = profile ? String(profile.role || '').trim().toLowerCase() : '';
  return role === 'admin' || role === 'financeiro' || role === 'teacher';
}

async function listarExistentes(admin){
  const ja = new Set();
  for(let offset = 0; ; offset += 1000){
    const { data, error } = await admin.storage.from(BUCKET).list('', { limit: 1000, offset });
    if(error) throw error;
    (data || []).forEach(f => ja.add(f.name));
    if(!data || data.length < 1000) break;
  }
  return ja;
}

async function gerarUm(admin, XI_KEY, it){
  const chave = chaveAudio(it.texto, it.voz);
  const r = await fetch('https://api.elevenlabs.io/v1/text-to-speech/' + VOZES[it.voz] + '?output_format=mp3_44100_64', {
    method: 'POST',
    headers: { 'xi-api-key': XI_KEY, 'Content-Type': 'application/json', 'Accept': 'audio/mpeg' },
    body: JSON.stringify({ text: it.texto, model_id: MODELO, voice_settings: { stability: 0.55, similarity_boost: 0.75 } })
  });
  if(!r.ok){
    const det = await r.text().catch(() => '');
    console.error('ElevenLabs TTS', r.status, det.slice(0, 300));
    return { chave, status: 'erro', erro: 'ElevenLabs ' + r.status, parar: r.status === 401 || r.status === 402 || /quota/i.test(det) };
  }
  const mp3 = Buffer.from(await r.arrayBuffer());
  const up = await admin.storage.from(BUCKET).upload(chave + '.mp3', mp3, { contentType: 'audio/mpeg', upsert: true, cacheControl: '31536000' });
  if(up.error){ console.error('gerar-audio storage', up.error); return { chave, status: 'erro', erro: 'Storage' }; }
  return { chave, status: 'gerado' };
}

async function gerarVarios(admin, XI_KEY, lista){
  const resultado = [];
  let i = 0, parar = false;
  await Promise.all(Array.from({ length: Math.min(PARALELO, lista.length) }, async () => {
    while(i < lista.length && !parar){
      const it = lista[i++];
      const r = await gerarUm(admin, XI_KEY, it);
      if(r.parar) parar = true;
      delete r.parar;
      resultado.push(r);
    }
  }));
  return { resultado, parar };
}

async function run(req, res){
  if(req.method !== 'POST' && req.method !== 'GET'){ res.status(405).json({ error: 'Método não permitido.' }); return; }

  const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const XI_KEY = process.env.ELEVENLABS_API_KEY;
  if(!SERVICE_ROLE_KEY || !XI_KEY){ res.status(500).json({ error: 'Geração de áudio não configurada no servidor.' }); return; }

  let body = req.method === 'GET' ? (req.query || {}) : (req.body || {});
  if(typeof body === 'string'){ try{ body = JSON.parse(body); }catch(e){ body = {}; } }

  const { createClient } = require('@supabase/supabase-js');
  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { auth: { autoRefreshToken: false, persistSession: false } });
  const fila = lerFila();
  const oficiais = new Set(fila.map(x => chaveAudio(x.texto, x.voz)));
  const ja = await listarExistentes(admin);

  // 2) Próximas frases da lista oficial que ainda não têm áudio.
  if(body.pendentes != null){
    const n = Math.max(1, Math.min(MAX_PENDENTES, parseInt(body.pendentes, 10) || MAX_PENDENTES));
    const faltam = fila.filter(x => !ja.has(chaveAudio(x.texto, x.voz) + '.mp3'));
    const { resultado, parar } = await gerarVarios(admin, XI_KEY, faltam.slice(0, n));
    const gerados = resultado.filter(x => x.status === 'gerado').length;
    res.status(200).json({ total: fila.length, faltavam: faltam.length, gerados, faltam: faltam.length - gerados, parou: parar, erros: resultado.filter(x => x.status === 'erro') });
    return;
  }

  // 1) Frases enviadas (player ou equipe).
  if(req.method !== 'POST'){ res.status(400).json({ error: 'Nada a fazer.' }); return; }
  const equipe = await ehEquipe(admin, req);
  const itens = (Array.isArray(body.itens) ? body.itens : [])
    .map(x => ({ texto: String((x && x.texto) || '').trim(), voz: x && x.voz === 'm' ? 'm' : 'f' }))
    .filter(x => x.texto && x.texto.length <= 300)
    .filter(x => equipe || oficiais.has(chaveAudio(x.texto, x.voz)));
  if(!itens.length){ res.status(400).json({ error: 'Nenhuma frase válida enviada.' }); return; }
  if(itens.length > MAX_ITENS){ res.status(400).json({ error: 'Máximo de ' + MAX_ITENS + ' frases por vez.' }); return; }

  const resultado = [];
  const novos = [];
  itens.forEach(it => {
    const chave = chaveAudio(it.texto, it.voz);
    if(ja.has(chave + '.mp3')) resultado.push({ chave, status: 'existia' }); else novos.push(it);
  });
  const g = await gerarVarios(admin, XI_KEY, novos);
  res.status(200).json({ resultado: resultado.concat(g.resultado) });
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
