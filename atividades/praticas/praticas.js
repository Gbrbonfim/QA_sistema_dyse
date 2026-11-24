/* DYSE · Atividades — motor único dos exercícios
   ------------------------------------------------------------------
   Cada página de atividade só declara os itens e chama:
     DysePratica.iniciar({ course, aula, num, tipo, itens })
   Tipos: 'imagem' (escute e escolha a imagem), 'escolha' (Make a Choice,
   aceita "chat" pra diálogo), 'montar' (monte a frase com palavra isca),
   'fala' (escute e grave, com reconhecimento de voz).

   Regras de correção:
   - escolha / imagem / montar: 2 tentativas. 1º erro = laranja, mostra
     onde errou e deixa tentar de novo. 2º erro = vermelho e mostra
     "A resposta correta é" + "Suas tentativas".
   - fala: cada palavra fica verde/laranja/vermelha; só avança se passar
     (nota mínima). Depois de 3 tentativas aparece "Pular".
   - Sequência de acertos (2X, 3X...) sobe a cada acerto de primeira e
     zera quando o aluno esgota as tentativas. Acertar na 2ª não zera.
   - Pontos: critério DYSE (DYSE_PONTOS em catalogo.js) — acertos, combos
     e bônus de atividade perfeita. Somam no Ranking de atividades.
   - O aluno NÃO refaz sozinho: ao terminar vai pra próxima liberada; só
     refaz se a professora liberar (refazer_liberado_em, seção 38). */
(function(){
  // Fala: a frase tem de sair EXATAMENTE certa; 3 erros mostram a resposta.
  const MAX_FALA_TRIES = 3;

  const S = {
    cfg: null, info: null, staff: false, i: 0, streak: 0, maxStreak: 0,
    res: [],          // por item: { status, tentativas:[], usouLeitura }
    cur: null         // estado do item atual
  };

  /* ---------- utilidades ---------- */
  const $ = sel => document.querySelector(sel);
  // Ícone Material Symbols Rounded (Google) — o site não usa emoji.
  const I = (nome, cls) => '<span class="msr' + (cls ? ' ' + cls : '') + '" aria-hidden="true">' + nome + '</span>';
  const esc = s => { const d = document.createElement('div'); d.textContent = s == null ? '' : String(s); return d.innerHTML; };
  function shuffle(arr, seed){
    const a = arr.slice(); let s = seed || 7;
    for(let i = a.length - 1; i > 0; i--){ s = (s * 9301 + 49297) % 233280; const j = Math.floor(s / 233280 * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
    return a;
  }

  /* ---------- áudio gravado (ElevenLabs) ----------
     As frases ficam em /atividades/praticas/audio/<chave>.mp3, geradas uma vez
     pelo scripts/gerar-audios.ps1. audio/manifest.js lista as que existem
     (window.DYSE_AUDIOS). Sem o arquivo, cai na voz do navegador (abaixo).
     Voz "f" (feminina) por padrão; "m" quando quem fala é um personagem homem. */
  const HOMENS = ['Lucas', 'Diego', 'Sam', 'Leo', 'Tom', 'Pedro', 'Charles', 'Anthony', 'Mike', 'Paul'];
  function vozPara(texto, quem){
    if(quem) return HOMENS.indexOf(quem) >= 0 ? 'm' : 'f';
    const m = /(?:I'm|My name is) ([A-Z][a-z]+)/.exec(texto || '');
    return m && HOMENS.indexOf(m[1]) >= 0 ? 'm' : 'f';
  }
  function chaveAudio(texto, voz){
    const s = voz + '|' + String(texto || '').trim();
    let h = 0x811c9dc5;
    for(const ch of s){ h ^= ch.codePointAt(0); h = Math.imul(h, 0x01000193) >>> 0; }
    return voz + '-' + h.toString(16).padStart(8, '0');
  }
  (function carregarManifesto(){
    const s = document.createElement('script');
    s.src = '/atividades/praticas/audio/manifest.js';
    s.onerror = () => {};
    document.head.appendChild(s);
  })();
  let AUDIO_ATUAL = null;
  function pararAudio(){
    if(AUDIO_ATUAL){ try{ AUDIO_ATUAL.pause(); }catch(e){} AUDIO_ATUAL = null; }
    // Só cancela se houver fala em andamento: no iPhone, cancel() seguido de
    // speak() na mesma hora faz a fala nova sair muda.
    if(window.speechSynthesis && (speechSynthesis.speaking || speechSynthesis.pending)){ speechSynthesis.cancel(); return true; }
    return false;
  }
  /* iPhone/iPad: a fala do navegador só toca depois de um toque do usuário.
     Chamado no toque em "Começar" para liberar o som da atividade inteira. */
  function desbloquearAudio(){
    try{
      if(window.speechSynthesis){
        const u = new SpeechSynthesisUtterance(' ');
        u.volume = 0; u.lang = 'en-US';
        speechSynthesis.speak(u);
      }
    }catch(e){}
  }
  /* Texto que o motor fala em cada item (o mesmo que o script de geração usa). */
  /* O que é falado em voz alta e por quem. Em "Make a Choice" a frase completa
     pode ter apoio visual que não se lê: "A → B" (fala B), "I am = I'm" (fala
     I'm), 'Lucas says: "…"' (fala só a citação, na voz do Lucas). */
  function falaDoItem(tipo, item){
    if(tipo === 'imagem') return { texto: item.audioTexto, quem: null };
    if(tipo === 'fala') return { texto: item.frase, quem: null };
    if(tipo === 'montar') return { texto: item.completa || (item.palavras.join(' ') + (item.fim || '')), quem: null };
    let t = String(item.completa || (item.frase ? item.frase.replace('___', item.opcoes[item.certa]) : item.opcoes[item.certa]));
    let quem = item.quemProximo || null;
    if(t.indexOf(' → ') >= 0) t = t.split(' → ').pop();
    else if(t.indexOf(' = ') >= 0) t = t.split(' = ').pop();
    const cit = /^([A-Z][a-z]+)(?: says)?: "(.+)"$/.exec(t);
    if(cit){ quem = cit[1]; t = cit[2]; }
    return { texto: t.trim(), quem: quem };
  }

  /* ---------- áudio: voz do navegador em inglês (reserva) ---------- */
  let VOZ = null;
  function escolherVoz(){
    const vs = (window.speechSynthesis && speechSynthesis.getVoices()) || [];
    VOZ = vs.find(v => /en-US/i.test(v.lang) && /Google|Samantha|Jenny|Aria|Natural/i.test(v.name))
       || vs.find(v => /en-US/i.test(v.lang)) || vs.find(v => /^en/i.test(v.lang)) || null;
  }
  if(window.speechSynthesis){ escolherVoz(); speechSynthesis.onvoiceschanged = escolherVoz; }
  /* Áudios gerados pela api/gerar-audio.js ficam no Supabase Storage (bucket
     público "audios-atividades", mesmo nome de arquivo). Se a frase ainda não
     tiver áudio lá, cai na voz do navegador. */
  const AUDIO_BUCKET = 'https://vnpjsjrqghttsagbssxx.supabase.co/storage/v1/object/public/audios-atividades/';
  const SEM_AUDIO = {};   // chaves que já falharam nesta página: vai direto pra voz do navegador
  /* Meio segundo de silêncio antes de cada áudio: a saída de som (fone, Bluetooth,
     depois de usar o microfone) demora para "acordar" e engolia o começo das
     frases curtas ("Peru", "Egypt"). Os MP3 da atividade são baixados logo no
     início e já montados com o silêncio na frente (sem espera ao tocar). */
  const SILENCIO_MP3 = Uint8Array.from(atob('//tQxAADwAABpAAAACAAADSAAAAETEFNRTMuMTAwVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVUxBTUUzLjEwMFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVf/7UsRdg8AAAaQAAAAgAAA0gAAABFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVTEFNRTMuMTAwVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV//tSxKGDwAABpAAAACAAADSAAAAEVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVMQU1FMy4xMDBVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVX/+1LEoYPAAAGkAAAAIAAANIAAAARVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVUxBTUUzLjEwMFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVf/7UsShg8AAAaQAAAAgAAA0gAAABFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVTEFNRTMuMTAwVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV//tSxKGDwAABpAAAACAAADSAAAAEVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVMQU1FMy4xMDBVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVX/+1LEoYPAAAGkAAAAIAAANIAAAARVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVUxBTUUzLjEwMFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVf/7UsShg8AAAaQAAAAgAAA0gAAABFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVTEFNRTMuMTAwVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV//tSxKGDwAABpAAAACAAADSAAAAEVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVMQU1FMy4xMDBVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVX/+1LEoYPAAAGkAAAAIAAANIAAAARVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVUxBTUUzLjEwMFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVf/7UsShg8AAAaQAAAAgAAA0gAAABFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVTEFNRTMuMTAwVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV//tSxKGDwAABpAAAACAAADSAAAAEVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVMQU1FMy4xMDBVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVX/+1LEoYPAAAGkAAAAIAAANIAAAARVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVUxBTUUzLjEwMFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVf/7UsShg8AAAaQAAAAgAAA0gAAABFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVTEFNRTMuMTAwVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV//tSxKGDwAABpAAAACAAADSAAAAEVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVMQU1FMy4xMDBVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVX/+1LEoYPAAAGkAAAAIAAANIAAAARVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVUxBTUUzLjEwMFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVf/7UsShg8AAAaQAAAAgAAA0gAAABFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVTEFNRTMuMTAwVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV//tSxKGDwAABpAAAACAAADSAAAAEVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVX/+1LEoYPAAAGkAAAAIAAANIAAAARVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVQ=='), c => c.charCodeAt(0));
  const AUDIO_PRONTO = {};   // chave -> URL local (blob) com o silêncio na frente
  function precarregarAudios(cfg){
    let lista = [];
    try{ lista = DysePratica._audios(cfg); }catch(e){ return; }
    const vistos = {};
    lista.forEach(x => {
      if(!x.texto || vistos[x.chave] || AUDIO_PRONTO[x.chave]) return;
      vistos[x.chave] = 1;
      const local = window.DYSE_AUDIOS && window.DYSE_AUDIOS[x.chave];
      fetch(local ? '/atividades/praticas/audio/' + x.chave + '.mp3' : AUDIO_BUCKET + x.chave + '.mp3')
        .then(r => r.ok ? r.arrayBuffer() : Promise.reject(r.status))
        .then(buf => { AUDIO_PRONTO[x.chave] = URL.createObjectURL(new Blob([SILENCIO_MP3, buf], { type: 'audio/mpeg' })); })
        .catch(() => {});
    });
  }
  function falar(texto, rate, quem){
    const cancelou = pararAudio();
    const chave = chaveAudio(texto, vozPara(texto, quem));
    const local = window.DYSE_AUDIOS && window.DYSE_AUDIOS[chave];
    if(AUDIO_PRONTO[chave] || local || !SEM_AUDIO[chave]){
      const a = new Audio(AUDIO_PRONTO[chave] || (local ? '/atividades/praticas/audio/' + chave + '.mp3' : AUDIO_BUCKET + chave + '.mp3'));
      a.playbackRate = rate && rate < 0.8 ? 0.75 : 1;   // "Devagar" sem distorcer a voz
      AUDIO_ATUAL = a;
      let caiu = false;
      const reserva = () => { if(caiu || AUDIO_ATUAL !== a) return; caiu = true; SEM_AUDIO[chave] = 1; falarNavegador(texto, rate, false); };
      a.onerror = reserva;
      a.play().catch(e => { if(!e || e.name !== 'AbortError') reserva(); });
      return;
    }
    falarNavegador(texto, rate, cancelou);
  }
  let FALA_ATUAL = null;   // referência viva: o Safari/Chrome descartam a fala se ela for "coletada"
  function falarNavegador(texto, rate, aposCancelar){
    if(!window.speechSynthesis) return;
    if(!VOZ) escolherVoz();
    const u = FALA_ATUAL = new SpeechSynthesisUtterance(texto);
    u.lang = 'en-US'; u.rate = rate || 0.92; u.volume = 1;
    if(VOZ) u.voice = VOZ;
    const ir = () => { if(speechSynthesis.paused) speechSynthesis.resume(); speechSynthesis.speak(u); };
    // Logo depois de cancel(), o iPhone precisa de um respiro antes de falar de novo.
    if(aposCancelar) setTimeout(ir, 120); else ir();
  }

  /* ---------- topo / barra / banner ---------- */
  function montarTopo(){
    const n = S.cfg.itens.length;
    document.body.innerHTML =
      '<header class="px-top" id="pxTop"><div class="px-top-row">' +
        '<span class="px-mark">dyse</span>' +
        '<div class="px-title"><b>' + esc(S.info.atividade.titulo) + '</b><small>' + esc(S.info.nivelNome) + ' · Aula ' + String(S.cfg.aula).padStart(2, '0') + ' · ' + esc(S.info.atividade.tipo) + '</small></div>' +
        '<div class="px-streak" id="pxStreak"></div>' +
        '<button class="px-close" title="Sair da atividade" onclick="DysePratica.sair()">Sair</button>' +
      '</div>' +
      '<div class="px-bar' + (n > 12 ? ' many' : '') + '" id="pxBar">' + Array.from({length: n}, (_, k) => '<span>' + (k + 1) + '</span>').join('') + '</div></header>' +
      (S.staff ? '<div class="px-staff-note">Modo professora: você pode testar à vontade, o resultado não é salvo.</div>' : '') +
      '<main class="px-main" id="pxMain"></main>' +
      '<footer class="px-foot" id="pxFoot"><div class="px-banner" id="pxBanner"></div><div class="px-actions" id="pxActions"></div></footer>';
  }
  function pintarBarra(){
    document.querySelectorAll('#pxBar span').forEach((el, k) => {
      el.className = '';
      if(k === S.i && !S.res[k]) el.className = 'cur';
      else if(S.res[k]) el.className = S.res[k].status === 'skip' ? 'bad' : S.res[k].status;
    });
  }
  // Feedback aparece numa bandeja colorida no rodapé, logo acima dos botões.
  function banner(tipo, texto){
    const foot = $('#pxFoot'), b = $('#pxBanner');
    if(foot) foot.className = 'px-foot' + (tipo ? ' ' + tipo : '');
    if(!tipo){ b.className = 'px-banner'; b.innerHTML = ''; return; }
    const ic = tipo === 'ok' ? I('check') : tipo === 'warn' ? I('priority_high') : I('close');
    const titulo = tipo === 'ok' ? 'Muito bem!' : tipo === 'warn' ? 'Quase lá' : 'Não foi dessa vez';
    b.className = 'px-banner ' + tipo;
    b.innerHTML = '<span class="ic">' + ic + '</span><span class="tx"><b>' + titulo + '</b>' + esc(texto) + '</span>';
  }
  function pintarStreak(pop){
    const el = $('#pxStreak');
    if(S.streak < 2){ el.className = 'px-streak'; el.textContent = ''; return; }
    el.innerHTML = I('local_fire_department') + S.streak + ' seguidas';
    el.className = 'px-streak on' + (S.streak >= 9 ? ' lv3' : S.streak >= 6 ? ' lv2' : '') + (pop ? ' pop' : '');
    if(pop) setTimeout(() => el.classList.remove('pop'), 250);
  }
  function acoes(lista){
    $('#pxActions').innerHTML = lista.map(a =>
      '<button type="button" class="px-act ' + (a.cls || '') + '" ' + (a.disabled ? 'disabled' : '') +
      ' onclick="DysePratica._act(\'' + a.id + '\')" id="pxAct_' + a.id + '"><span class="i">' + a.ic + '</span><span class="tag">' + esc(a.label) + '</span></button>'
    ).join('');
  }
  const HANDLERS = {};
  function on(id, fn){ HANDLERS[id] = fn; }

  /* ---------- tempo de estudo (desempate do ranking) ----------
     Conta só enquanto a página está visível e a atividade começou. */
  function tempoGasto(){ return (S.tempoAcum || 0) + (S.t0 ? Date.now() - S.t0 : 0); }
  function iniciarTempo(){ if(!S.t0) S.t0 = Date.now(); }
  document.addEventListener('visibilitychange', () => {
    if(!S.cfg || S.tempoAcum == null && !S.t0) return;
    if(document.hidden){ S.tempoAcum = tempoGasto(); S.t0 = null; }
    else if(S.comecou) S.t0 = Date.now();
  });

  /* ---------- progresso guardado por 15 minutos ----------
     Cada questão respondida fica guardada no aparelho (localStorage, por aluno
     e por atividade). Se o aluno sair e voltar em até 15 minutos, continua de
     onde parou; depois disso o progresso é apagado e ele refaz a atividade
     inteira. O prazo conta a partir da última vez que o progresso foi salvo. */
  const PROGRESSO_MIN = 15;
  function chaveProgresso(){ return 'dyse-progresso:' + (S.uid || 'anon') + ':' + S.cfg.course + ':' + S.cfg.aula + ':' + S.cfg.num; }
  function salvarProgresso(){
    try{
      const feitas = S.res.filter(Boolean).length;
      if(!feitas){ localStorage.removeItem(chaveProgresso()); return; }
      localStorage.setItem(chaveProgresso(), JSON.stringify({
        i: S.res[S.i] ? S.i + 1 : S.i, res: S.res, streak: S.streak, maxStreak: S.maxStreak,
        comboRun: S.comboRun || 0, combos: S.combos || 0, tempoMs: tempoGasto(), salvoEm: Date.now()
      }));
    }catch(e){}
  }
  function apagarProgresso(){ try{ localStorage.removeItem(chaveProgresso()); }catch(e){} }
  function lerProgresso(){
    try{
      const g = JSON.parse(localStorage.getItem(chaveProgresso()) || 'null');
      if(!g) return null;
      const valido = Date.now() - g.salvoEm < PROGRESSO_MIN * 60000 && Array.isArray(g.res) && g.i > 0 && g.i < S.cfg.itens.length;
      if(!valido){ apagarProgresso(); return null; }
      return g;
    }catch(e){ return null; }
  }

  /* ---------- registro do resultado de um item ---------- */
  function fecharItem(status, extra){
    const tent = S.cur.tentativas;
    S.res[S.i] = Object.assign({ status: status, tentativas: tent }, extra || {});
    if(status === 'ok'){
      S.streak++; S.maxStreak = Math.max(S.maxStreak, S.streak); pintarStreak(true);
      // Combo DYSE: 3 acertos DE PRIMEIRA seguidos (acerto na 2ª quebra o combo).
      S.comboRun = (S.comboRun || 0) + 1;
      if(S.comboRun % DYSE_PONTOS.comboACada === 0) S.combos = (S.combos || 0) + 1;
    } else {
      S.comboRun = 0;
      if(status === 'bad' || status === 'skip'){ S.streak = 0; pintarStreak(false); }
    }
    pintarBarra();
    salvarProgresso();
  }
  function avancar(){
    pararAudio();
    S.i++;
    if(S.i >= S.cfg.itens.length) return finalizar();
    renderItem();
  }
  function botoesFim(item, comTraduzir){
    const l = [];
    if(item.audio !== false) l.push({ id: 'ouvirFim', ic: I('play_arrow'), label: 'Escutar' });
    if(comTraduzir && item.traducao) l.push({ id: 'traduzir', ic: I('translate'), label: 'Traduzir' });
    l.push({ id: 'avancar', ic: I('arrow_forward'), label: 'Avançar', cls: 'primary' });
    on('ouvirFim', () => { const f = falaDoItem(S.cfg.tipo, item); falar(f.texto, null, f.quem); });
    on('traduzir', () => modalTraducao(item.completa, item.traducao));
    on('avancar', avancar);
    acoes(l);
  }
  function mostrarRevisao(main, correta, tentativas){
    main.insertAdjacentHTML('beforeend',
      '<div class="px-review-box"><div class="lb">A resposta correta é</div>' +
      '<div class="right">' + esc(correta) + '</div>' +
      '<div class="lb bad">Suas tentativas</div>' +
      tentativas.map(t => '<div class="wrong">' + esc(t) + '</div>').join('') + '</div>');
  }

  /* ---------- render por tipo ---------- */
  function renderItem(){
    banner(null);
    S.cur = { tentativas: [], sel: null, falhas: 0 };
    pintarBarra();
    const item = S.cfg.itens[S.i];
    ({ imagem: renderImagem, escolha: renderEscolha, montar: renderMontar, fala: renderFala })[S.cfg.tipo](item);
    // Instrução própria da questão (quando a atividade mistura formatos).
    if(item.instrucao){ const p = $('#pxMain .px-instr'); if(p) p.textContent = item.instrucao; }
    $('#pxMain').insertAdjacentHTML('afterbegin', '<div class="px-qtag">Questão ' + (S.i + 1) + ' <span>de ' + S.cfg.itens.length + '</span></div>');
    window.scrollTo(0, 0);
  }

  /* IMAGEM — escute e escolha */
  function renderImagem(item){
    const main = $('#pxMain');
    main.innerHTML = '<p class="px-instr">' + esc(S.cfg.instrucao || 'Listen and choose the right picture') + '</p>' +
      '<div class="px-imgs">' + item.opcoes.map((o, k) =>
        '<button type="button" class="px-img" id="pxImg' + k + '" onclick="DysePratica._img(' + k + ')">' +
          '<span class="key">' + 'ABCDEFGH'[k] + '</span><span class="ph">' +
            // "icon": desenho do Material Symbols no lugar da foto (vocabulário de objetos).
            (o.icon ? '<span class="msr px-ph-ic" aria-hidden="true">' + esc(o.icon) + '</span>' : '<img src="' + esc(o.img) + '" alt="">') +
          '</span><span class="lbl">' + esc(o.label) + '</span></button>').join('') + '</div>';
    item.completa = item.audioTexto;
    on('ouvir', () => falar(item.audioTexto));
    on('ouvirLento', () => falar(item.audioTexto, 0.6));
    acoes([{ id: 'ouvirLento', ic: I('slow_motion_video'), label: 'Devagar' }, { id: 'ouvir', ic: I('play_arrow'), label: 'Escutar', cls: 'primary' }]);
    falar(item.audioTexto);   // no mesmo toque (iPhone só libera som assim)
  }
  function clicarImagem(k){
    const item = S.cfg.itens[S.i];
    if(S.res[S.i]) return;
    const el = $('#pxImg' + k);
    if(el.disabled) return;
    S.cur.tentativas.push(item.opcoes[k].label);
    const revelar = () => item.opcoes.forEach((o, j) => { const b = $('#pxImg' + j); b.disabled = true; b.classList.add('reveal'); });
    if(k === item.certa){
      el.classList.add('ok'); revelar();
      fecharItem(S.cur.tentativas.length === 1 ? 'ok' : 'warn');
      banner('ok', 'Você acertou!'); botoesFim(item, false);
    } else if(S.cur.tentativas.length === 1){
      el.classList.add('warn'); el.disabled = true;
      banner('warn', 'Resposta incorreta. Escute de novo e tente mais uma vez.');
    } else {
      el.classList.add('bad'); $('#pxImg' + item.certa).classList.add('ok'); revelar();
      fecharItem('bad');
      banner('bad', 'Resposta incorreta');
      mostrarRevisao($('#pxMain'), item.opcoes[item.certa].label, S.cur.tentativas);
      botoesFim(item, false);
    }
  }

  /* ESCOLHA — Make a Choice (com ou sem diálogo) */
  function frasePreenchida(item, txt, cls){
    const partes = item.frase.split('___');
    if(partes.length < 2) return esc(item.frase);
    return esc(partes[0]) + (txt == null ? '<span class="blank">&nbsp;</span>' : '<span class="fill ' + (cls || '') + '">' + esc(txt) + '</span>') + esc(partes[1]);
  }
  function renderEscolha(item){
    const main = $('#pxMain');
    item.completa = item.completa || (item.frase ? item.frase.replace('___', item.opcoes[item.certa]) : item.opcoes[item.certa]);
    let topo = '';
    if(item.chat){
      // Conversa no formato de app de mensagens: cabeçalho do contato, balões
      // com horário e confirmação de leitura, e a próxima fala "digitando…" até o aluno responder.
      const nomes = [];
      item.chat.concat([{ quem: item.quemProximo }]).forEach(c => { if(c.quem && nomes.indexOf(c.quem) < 0) nomes.push(c.quem); });
      const hora = k => '10:' + String(12 + k).padStart(2, '0');
      topo = '<div class="px-phone">' +
        '<div class="px-phone-top"><span class="av">' + esc((nomes[0] || '?').charAt(0)) + '</span>' +
          '<div class="who"><b>' + esc(nomes.join(' & ')) + '</b><small>online</small></div><span class="ic">' + I('call') + '</span></div>' +
        '<div class="px-chat">' + '<div class="px-day">HOJE</div>' + item.chat.map((c, k) =>
          '<div class="px-bubble ' + (c.lado || 'a') + '"><b>' + esc(c.quem) + '</b>' + esc(c.texto) +
          '<i class="tm">' + hora(k) + ((c.lado || 'a') === 'b' ? ' ' + I('done_all', 'tick') : '') + '</i></div>').join('') +
        '<div class="px-bubble ' + (item.ladoProximo || 'a') + ' next" id="pxNext"><b>' + esc(item.quemProximo || '') + '</b>' +
          '<span class="typing"><span></span><span></span><span></span></span></div></div>' +
        '<div class="px-phone-bar"><span>Choose the answer below…</span><span class="snd">' + I('send') + '</span></div></div>';
      S.cur.horaProx = hora(item.chat.length);
    }
    main.innerHTML = '<p class="px-instr">' + esc(S.cfg.instrucao || 'Choose an option to complete the sentence') + '</p>' + topo +
      (item.frase ? '<div class="px-sentence" id="pxSent">' + frasePreenchida(item, null) + '</div>' : '') +
      '<div class="px-opts">' + item.opcoes.map((o, k) =>
        '<button type="button" class="px-opt" id="pxOpt' + k + '" onclick="DysePratica._sel(' + k + ')"><span class="dot">' + 'ABCDEFGH'[k] + '</span><span>' + esc(o) + '</span></button>').join('') + '</div>';
    on('validar', validarEscolha);
    acoes([{ id: 'validar', ic: I('check'), label: 'Validar', cls: 'primary', disabled: true }]);
  }
  function selecionar(k){
    if(S.res[S.i]) return;
    const b = $('#pxOpt' + k); if(b.disabled) return;
    document.querySelectorAll('.px-opt').forEach(el => { if(!el.disabled) el.classList.remove('sel'); });
    b.classList.add('sel'); S.cur.sel = k;
    const item = S.cfg.itens[S.i];
    if(item.frase) $('#pxSent').innerHTML = frasePreenchida(item, item.opcoes[k]);
    $('#pxAct_validar').disabled = false;
  }
  function validarEscolha(){
    const item = S.cfg.itens[S.i], k = S.cur.sel;
    if(k == null || S.res[S.i]) return;
    const txtTent = item.frase ? item.frase.replace('___', item.opcoes[k]) : item.opcoes[k];
    S.cur.tentativas.push(txtTent);
    const b = $('#pxOpt' + k); b.classList.remove('sel');
    if(k === item.certa){
      b.classList.add('ok');
      if(item.frase) $('#pxSent').innerHTML = frasePreenchida(item, item.opcoes[k], 'ok');
      if(item.chat){ const n = $('#pxNext'); n.classList.remove('next'); n.innerHTML = '<b>' + esc(item.quemProximo || '') + '</b>' + esc(item.opcoes[k]) + '<i class="tm">' + (S.cur.horaProx || '') + ((item.ladoProximo || 'a') === 'b' ? ' ' + I('done_all', 'tick') : '') + '</i>'; }
      document.querySelectorAll('.px-opt').forEach(el => el.disabled = true);
      fecharItem(S.cur.tentativas.length === 1 ? 'ok' : 'warn');
      banner('ok', 'Você acertou!'); botoesFim(item, true);
    } else if(S.cur.tentativas.length === 1){
      b.classList.add('warn'); b.disabled = true;
      if(item.frase) $('#pxSent').innerHTML = frasePreenchida(item, item.opcoes[k], 'warn');
      banner('warn', 'Resposta incorreta. Tente mais uma vez.');
      S.cur.sel = null; $('#pxAct_validar').disabled = true;
    } else {
      b.classList.add('bad');
      if(item.frase) $('#pxSent').innerHTML = frasePreenchida(item, item.opcoes[k], 'bad');
      document.querySelectorAll('.px-opt').forEach(el => el.disabled = true);
      fecharItem('bad');
      banner('bad', 'Resposta incorreta');
      mostrarRevisao($('#pxMain'), item.completa, S.cur.tentativas);
      botoesFim(item, true);
    }
  }

  /* MONTAR — monte a frase (com palavra isca) */
  function renderMontar(item){
    const pecas = item.palavras.concat(item.isca || []);
    item.completa = item.completa || (item.palavras.join(' ') + (item.fim || ''));
    S.cur.banco = shuffle(pecas.map((t, k) => ({ t: t, k: k })), S.i + 3);
    S.cur.slots = Array(item.palavras.length).fill(null);
    const main = $('#pxMain');
    main.innerHTML = '<p class="px-instr">' + esc(S.cfg.instrucao || 'Click the words and make the sentence') + '</p>' +
      (item.contexto ? '<div class="px-ctx">' + esc(item.contexto) + '</div>' : '') +
      '<div class="px-slots" id="pxSlots"></div><div class="px-bank" id="pxBank"></div>';
    desenharMontar();
    on('validar', validarMontar);
    acoes([{ id: 'validar', ic: I('check'), label: 'Validar', cls: 'primary', disabled: true }]);
  }
  function desenharMontar(cores){
    const item = S.cfg.itens[S.i];
    const usados = new Set(S.cur.slots.filter(Boolean).map(p => p.k));
    $('#pxSlots').innerHTML = S.cur.slots.map((p, s) => p
      ? '<button type="button" class="px-chip placed ' + ((cores && cores[s]) || '') + '" onclick="DysePratica._unslot(' + s + ')">' + esc(p.t) + '</button>'
      : '<span class="px-slot"></span>').join('') + (item.fim ? '<span>' + esc(item.fim) + '</span>' : '');
    $('#pxBank').innerHTML = S.cur.banco.map(p =>
      '<button type="button" class="px-chip ' + (usados.has(p.k) ? 'ghost' : '') + '" onclick="DysePratica._slot(' + p.k + ')">' + esc(p.t) + '</button>').join('');
    const cheio = S.cur.slots.every(Boolean);
    const v = $('#pxAct_validar'); if(v) v.disabled = !cheio;
  }
  function porNoSlot(k){
    if(S.res[S.i] || S.cur.travado) return;
    const s = S.cur.slots.indexOf(null); if(s < 0) return;
    S.cur.slots[s] = S.cur.banco.find(p => p.k === k);
    desenharMontar();
  }
  function tirarDoSlot(s){
    if(S.res[S.i] || S.cur.travado) return;
    S.cur.slots[s] = null; desenharMontar();
  }
  function validarMontar(){
    const item = S.cfg.itens[S.i];
    if(S.res[S.i] || !S.cur.slots.every(Boolean)) return;
    const tent = S.cur.slots.map(p => p.t);
    S.cur.tentativas.push(tent.join(' ') + (item.fim || ''));
    const certoPos = tent.map((t, s) => t === item.palavras[s]);
    if(certoPos.every(Boolean)){
      desenharMontar(certoPos.map(() => 'ok')); S.cur.travado = true;
      fecharItem(S.cur.tentativas.length === 1 ? 'ok' : 'warn');
      banner('ok', 'Você acertou!'); botoesFim(item, true);
      falar(item.completa);
    } else if(S.cur.tentativas.length === 1){
      desenharMontar(certoPos.map(c => c ? 'ok' : 'warn')); S.cur.travado = true;
      banner('warn', 'Quase! As palavras em laranja estão no lugar errado. Tente de novo.');
      $('#pxAct_validar').disabled = true;
      setTimeout(() => {
        S.cur.slots = S.cur.slots.map((p, s) => certoPos[s] ? p : null);
        S.cur.travado = false; desenharMontar();
      }, 1500);
    } else {
      desenharMontar(certoPos.map(c => c ? 'ok' : 'bad')); S.cur.travado = true;
      fecharItem('bad'); banner('bad', 'Resposta incorreta');
      mostrarRevisao($('#pxMain'), item.completa, S.cur.tentativas);
      botoesFim(item, true);
    }
  }

  /* FALA — escute e grave */
  const CONTR = { "what's":"what is", "i'm":"i am", "it's":"it is", "he's":"he is", "she's":"she is", "you're":"you are", "we're":"we are", "they're":"they are", "that's":"that is", "where's":"where is", "let's":"let us", "isn't":"is not", "aren't":"are not", "isnt":"is not", "arent":"are not", "don't":"do not", "doesn't":"does not", "dont":"do not", "doesnt":"does not", "can't":"cannot", "cant":"cannot","whats":"what is", "im":"i am", "hes":"he is", "shes":"she is", "youre":"you are", "theyre":"they are", "thats":"that is", "wheres":"where is" };
  /* O reconhecimento de voz escreve números com algarismos ("13", "£4.50",
     "7:30"); a frase da atividade vem por extenso. Converte antes de comparar. */
  const UNI = ['zero','one','two','three','four','five','six','seven','eight','nine','ten','eleven','twelve','thirteen','fourteen','fifteen','sixteen','seventeen','eighteen','nineteen'];
  const DEZ = ['','','twenty','thirty','forty','fifty','sixty','seventy','eighty','ninety'];
  function numExt(n){
    n = parseInt(n, 10);
    if(n < 20) return UNI[n];
    if(n < 100) return DEZ[Math.floor(n / 10)] + (n % 10 ? ' ' + UNI[n % 10] : '');
    if(n < 1000) return UNI[Math.floor(n / 100)] + ' hundred' + (n % 100 ? ' ' + numExt(n % 100) : '');
    if(n < 10000) return UNI[Math.floor(n / 1000)] + ' thousand' + (n % 1000 ? ' ' + numExt(n % 1000) : '');
    return String(n);
  }
  const MOEDA = { '£': ['pound', 'pounds'], '$': ['dollar', 'dollars'], '€': ['euro', 'euros'] };
  function numPorExtenso(w){
    const h = /^(\d{1,2}):(\d{2})$/.exec(w);
    if(h) return numExt(h[1]) + (+h[2] ? ' ' + (+h[2] < 10 ? 'oh ' : '') + numExt(h[2]) : " o'clock");
    const m = /^([£$€])?(\d{1,4})(?:[.,](\d{2}))?(p)?$/.exec(w);
    if(!m) return w;
    if(m[4]) return numExt(m[2]) + ' pence';
    if(!m[1]) return numExt(m[2]) + (m[3] ? ' ' + numExt(m[3]) : '');
    const nome = MOEDA[m[1]];
    let s = numExt(m[2]) + ' ' + nome[+m[2] === 1 ? 0 : 1];
    if(m[3] && +m[3]) s += m[1] === '£' ? ' ' + numExt(m[3]) : ' and ' + numExt(m[3]) + ' cents';
    return s;
  }
  function norm(txt){
    return String(txt || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[’`]/g, "'").split(/\s+/)
      .map(w => numPorExtenso(w.replace(/[.,!?;:"]+$/, '')))
      .join(' ').replace(/-/g, ' ').split(/\s+/)
      .map(w => w.replace(/[^a-z']/g, '')).filter(Boolean)
      .map(w => CONTR[w] || w.replace(/'/g, '')).join(' ').split(' ').filter(Boolean);
  }
  function lev(a, b){
    const m = a.length, n = b.length; if(!m) return n; if(!n) return m;
    const d = Array.from({length: m + 1}, (_, i) => [i]);
    for(let j = 1; j <= n; j++) d[0][j] = j;
    for(let i = 1; i <= m; i++) for(let j = 1; j <= n; j++)
      d[i][j] = Math.min(d[i-1][j] + 1, d[i][j-1] + 1, d[i-1][j-1] + (a[i-1] === b[j-1] ? 0 : 1));
    return d[m][n];
  }
  /* Avaliação RÍGIDA: o que o aluno disse tem de ser exatamente a frase
     (mesmas palavras, na mesma ordem). Maiúsculas, pontuação e contrações
     ("I'm" = "I am") não importam; homófonos listados em item.aceita contam
     como a palavra certa. Palavra faltando, trocada ou A MAIS = erro.
     Devolve as cores de cada palavra da frase e o que foi dito, já marcado. */
  /* Palavras de MESMO SOM: o reconhecimento de voz não tem como saber qual o
     aluno quis dizer, então valem como a mesma palavra (dos dois lados). */
  const MESMO_SOM = { to: 'too', two: 'too', by: 'bye', buy: 'bye', high: 'hi', meat: 'meet', sea: 'see', four: 'for', u: 'you', r: 'are', eye: 'i', grease: 'greece', chilly: 'chile', chili: 'chile', chilli: 'chile' };
  const somDe = p => MESMO_SOM[p] || p;
  /* Horário dito como "half past seven" vira "7:30" no reconhecimento. Se a
     frase da atividade usa o jeito past / to / quarter / half, o horário em
     algarismos é reescrito nesse mesmo jeito antes de comparar. */
  function horaNoEstilo(frase, ouvido){
    if(!/\b(past|to|quarter|half)\b/i.test(frase)) return ouvido;
    const comA = /\ba quarter\b/i.test(frase);
    // "quarter to six" sem o "a" (o reconhecimento costuma cortar) conta como "a quarter".
    if(comA) ouvido = String(ouvido || '').split(/\s+/).map((w, k, ws) => /^quarter$/i.test(w) && !/^a$/i.test(ws[k - 1] || '') ? 'a ' + w : w).join(' ');
    return String(ouvido || '').replace(/\b(\d{1,2}):(\d{2})\b/g, (s, h, m) => {
      h = +h; m = +m; const prox = h % 12 + 1;
      if(m === 0) return numExt(h) + " o'clock";
      if(m === 15) return (comA ? 'a ' : '') + 'quarter past ' + numExt(h);
      if(m === 30) return 'half past ' + numExt(h);
      if(m === 45) return (comA ? 'a ' : '') + 'quarter to ' + numExt(prox);
      return m < 30 ? numExt(m) + ' past ' + numExt(h) : numExt(60 - m) + ' to ' + numExt(prox);
    });
  }
  function avaliarFala(item, ouvido){
    const aceita = item.aceita || {};
    const tokens = item.frase.split(/\s+/);
    const exp = [];
    tokens.forEach((t, k) => norm(t).forEach(p => exp.push({ p: somDe(p), k: k })));
    ouvido = horaNoEstilo(item.frase, ouvido);
    const brutas = String(ouvido || '').trim().split(/\s+/).filter(Boolean);
    const heard = [];
    brutas.forEach((w, b) => norm(w).forEach(p => heard.push({ p: somDe(aceita[p] || p), b: b })));
    // maior sequência comum (mesma ordem) entre o esperado e o que foi dito
    const m = exp.length, n = heard.length;
    const L = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
    for(let i = m - 1; i >= 0; i--) for(let j = n - 1; j >= 0; j--)
      L[i][j] = exp[i].p === heard[j].p ? L[i + 1][j + 1] + 1 : Math.max(L[i + 1][j], L[i][j + 1]);
    const okExp = new Array(m).fill(false), okHeard = new Array(n).fill(false);
    for(let i = 0, j = 0; i < m && j < n;){
      if(exp[i].p === heard[j].p){ okExp[i] = okHeard[j] = true; i++; j++; }
      else if(L[i + 1][j] >= L[i][j + 1]) i++; else j++;
    }
    const cores = tokens.map((t, k) => {
      const idx = []; exp.forEach((e, i) => { if(e.k === k) idx.push(i); });
      return !idx.length || idx.every(i => okExp[i]) ? 'ok' : 'bad';
    });
    const certas = okExp.filter(Boolean).length;
    const sobrando = okHeard.filter(x => !x).length;
    const nota = m ? certas / (m + sobrando) : 0;
    // o que o aluno disse, com as palavras erradas/a mais marcadas
    const ditoHtml = brutas.map((w, b) => {
      const partes = []; heard.forEach((h, j) => { if(h.b === b) partes.push(j); });
      const certa = partes.length && partes.every(j => okHeard[j]);
      return '<span class="' + (certa ? 'ok' : 'bad') + '">' + esc(w) + '</span>';
    }).join(' ');
    return { cores: cores, nota: nota, perfeita: certas === m && sobrando === 0 && m > 0, ditoHtml: ditoHtml };
  }
  /* Nota da pronúncia — cartão próprio da DYSE: porcentagem grande, rótulo e
     10 "degraus" que acendem em sequência na cor do nível. */
  function notaFala(nota, perfeita){
    const n = Math.max(0, Math.min(1, nota));
    const pct = Math.round(n * 100), cheios = Math.round(n * 10);
    const nv = perfeita ? ['ok', 'Perfeito!'] : n >= 0.6 ? ['mid', 'Quase lá'] : ['low', 'Vamos de novo'];
    return '<div class="px-score ' + nv[0] + '"><div class="num">' + pct + '<small>%</small></div>' +
      '<div class="info"><b>' + nv[1] + '</b><div class="seg">' +
      Array.from({ length: 10 }, (_, k) => '<i class="' + (k < cheios ? 'on' : '') + '" style="animation-delay:' + (k * 45) + 'ms"></i>').join('') +
      '</div><small>palavras certas</small></div></div>';
  }
  function desenharFrase(item, cores, revelar){
    const tokens = item.frase.split(/\s+/);
    $('#pxWords').innerHTML = tokens.map((t, k) => {
      const vis = revelar || S.cur.leitura || k === item.dica || (cores && cores[k] && cores[k] !== 'bad');
      const cls = cores && cores[k] ? cores[k] : '';
      return '<span class="w ' + (vis || cls === 'bad' ? cls : 'hidden') + '">' + esc(t) + '</span>';
    }).join('');
  }
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  // Gravar funciona em qualquer navegador moderno; sem SR, quem transcreve é o servidor.
  const PODE_GRAVAR = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia && window.MediaRecorder);
  const ANDROID = /Android/i.test(navigator.userAgent || '');
  /* iPhone/iPad: o reconhecimento do Safari só funciona na 1ª gravação quando
     roda junto com o gravador (nas seguintes não ouve nada). Lá a voz é sempre
     gravada e transcrita no servidor (api/transcrever.js). */
  const IOS = /iPad|iPhone|iPod/.test(navigator.userAgent || '') || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  /* O microfone é aberto a cada gravação e fechado no fim dela (no iPhone o
     Safari pode pedir a permissão a cada vez — decisão: aceitar isso). */
  const abrirMic = () => navigator.mediaDevices.getUserMedia({ audio: true });
  function fecharMic(st){ if(st) st.getTracks().forEach(t => t.stop()); }
  function renderFala(item){
    item.completa = item.frase;
    const main = $('#pxMain');
    main.innerHTML = '<p class="px-instr">' + esc(S.cfg.instrucao || 'Listen and record') + '</p>' +
      '<div class="px-scene"><div class="card">' + I('record_voice_over') + '</div><div class="wave"><span></span><span></span><span></span><span></span><span></span><span></span><span></span></div></div>' +
      '<div class="px-words" id="pxWords"></div>' +
      '<div id="pxGauge"></div><div class="px-heard" id="pxHeard"></div>' +
      (item.nota ? '<p class="px-note">' + I('lightbulb') + esc(item.nota) + '</p>' : '') +
      '<div id="pxCompare"></div>' +
      (SR || PODE_GRAVAR ? '' : '<div class="px-ctx" style="margin-top:16px;">Este navegador não consegue gravar sua voz. Atualize o navegador ou abra no <b>Chrome</b>, <b>Edge</b>, <b>Safari</b> ou <b>Firefox</b>. Você pode ouvir e pular as frases.</div>');
    desenharFrase(item, null, false);
    acoesFala(item, false);
    // Sem setTimeout: falar dentro do mesmo toque (Começar/Avançar) é o que o
    // iPhone exige para liberar o som.
    falar(item.frase);
  }
  /* Botões da fala. Estados: false (início), 'retry' (errou, ainda tem
     tentativa), 'ok' (acertou), 'fim' (errou as 3: mostra a resposta). */
  function acoesFala(item, depois){
    on('ouvir', () => falar(item.frase));
    on('gravar', () => { if(S.cur.gravando) pararGravacao(); else iniciarGravacao(item); });
    on('leitura', () => { S.cur.leitura = true; desenharFrase(item, S.cur.ultCores, false); });
    on('pular', () => { fecharItem('skip', { nota: 0 }); avancar(); });
    on('traduzir', () => modalTraducao(item.frase, item.traducao));
    on('avancar', avancar);
    if(depois === 'ok' || depois === 'fim'){
      acoes([{ id: 'ouvir', ic: I('play_arrow'), label: 'Escutar' }, { id: 'traduzir', ic: I('translate'), label: 'Traduzir' }, { id: 'avancar', ic: I('arrow_forward'), label: 'Avançar', cls: 'primary' }]);
    } else {
      const l = [{ id: 'ouvir', ic: I('play_arrow'), label: 'Escutar' },
        { id: 'gravar', ic: I('mic'), label: depois === 'retry' ? 'Gravar de novo' : 'Gravar', cls: 'rec', disabled: !(SR || PODE_GRAVAR) },
        { id: 'leitura', ic: I('visibility'), label: 'Leitura' }];
      if(!(SR || PODE_GRAVAR)) l.push({ id: 'pular', ic: I('skip_next'), label: 'Pular' });
      acoes(l);
    }
  }

  /* ---------- Gravação: TOQUE para gravar ----------
     No iPhone o microfone e o reconhecimento de voz só podem começar num
     toque completo (clique) — "encostar e segurar" não vale como gesto, então
     não dá para usar segurar-e-soltar. Fluxo: toque em Gravar, fale; termina
     sozinho quando o aluno para de falar (ou toque de novo para enviar).
     Em paralelo o MediaRecorder guarda a voz para o "Compare sua pronúncia". */
  function botaoGravando(on){
    const btn = $('#pxAct_gravar'); if(!btn) return;
    btn.classList.toggle('on', on);
    const i = btn.querySelector('.i'), t = btn.querySelector('.tag');
    if(on){ btn.dataset.label = t ? t.textContent : ''; if(t) t.textContent = 'Toque p/ enviar'; }
    else if(t && btn.dataset.label) t.textContent = btn.dataset.label;
    if(i) i.innerHTML = I(on ? 'graphic_eq' : 'mic');
  }
  /* Aviso do microfone (todos os navegadores): antes da 1ª gravação da página,
     se o navegador ainda vai perguntar, explica que é preciso tocar em
     "Permitir"; se o microfone estiver bloqueado, mostra como liberar. */
  async function estadoMic(){
    try{
      if(!navigator.permissions || !navigator.permissions.query) return 'desconhecido';
      return (await navigator.permissions.query({ name: 'microphone' })).state;   // granted | prompt | denied
    }catch(e){ return 'desconhecido'; }
  }
  function modalMicBloqueado(){
    const m = modal('<div class="px-m-kicker">' + I('mic_off') + ' Microfone bloqueado</div><h2>Libere o microfone para gravar</h2>' +
      '<div class="meta" style="text-align:left;">O navegador está bloqueando o microfone para este site. Para liberar:<br><br>' +
      '<b>No computador ou Android:</b> toque no <b>cadeado</b> (ou no ícone de ajustes) ao lado do endereço do site → <b>Permissões</b> → <b>Microfone</b> → <b>Permitir</b>. Depois recarregue a página.<br><br>' +
      '<b>No iPhone:</b> toque em <b>aA</b> ao lado do endereço → <b>Ajustes do Site</b> → <b>Microfone</b> → <b>Permitir</b>.</div>' +
      '<button class="px-btn">Entendi</button>', 'small');
    m.querySelector('button').onclick = () => m.remove();
  }
  async function iniciarGravacao(item, avisado){
    if(S.cur.gravando || !(SR || PODE_GRAVAR)) return;
    if(!avisado && !S.micAvisado){
      const st = await estadoMic();
      if(st === 'denied'){ modalMicBloqueado(); return; }
      if(st !== 'granted'){
        S.micAvisado = true;
        const m = modal('<div class="px-m-kicker">' + I('mic') + ' Microfone</div><h2>Vamos gravar a sua voz</h2>' +
          '<div class="meta">Para gravar, o navegador vai pedir permissão para usar o microfone. Quando aparecer a pergunta, toque em <b>Permitir</b>. Sem essa permissão não dá para gravar.</div>' +
          '<button class="px-btn">' + I('mic') + ' Entendi, gravar</button>', 'small');
        // O toque neste botão já inicia a gravação (o navegador exige um toque para abrir o microfone).
        m.querySelector('button').onclick = () => { m.remove(); iniciarGravacao(item, true); };
        return;
      }
    }
    pararAudio();
    const G = S.cur.grav = { item: item, chunks: [], resultados: [], recorder: null, stream: null, rec: null };
    S.cur.gravando = true;
    botaoGravando(true);
    $('#pxHeard').textContent = 'Pode falar…';
    $('#pxMain').classList.add('gravando');
    // No Android o reconhecimento do Chrome falha se outra gravação estiver
    // usando o microfone: lá, com reconhecimento, não grava em paralelo (fica
    // sem o "Minha voz", mas a avaliação funciona). Se o reconhecimento falhar
    // no aparelho, as próximas gravações vão direto para o servidor.
    // Celular (iPhone e Android): sempre grava e transcreve no servidor. O
    // reconhecimento do navegador no celular falha com frequência (só a 1ª
    // gravação no iPhone; sem o serviço de voz do Google em alguns Androids).
    const usarSR = SR && !S.forcarServidor && !((IOS || ANDROID) && PODE_GRAVAR);
    G.usouSR = !!usarSR;
    if(!(usarSR && ANDROID)){
      try{
        G.stream = await abrirMic();
        G.recorder = new MediaRecorder(G.stream);
        G.recorder.ondataavailable = e => { if(e.data && e.data.size) G.chunks.push(e.data); };
        G.recorder.start();
      }catch(e){ G.recorder = null; }
    }
    // Tocou de novo (ou saiu) enquanto o navegador pedia o microfone: libera e para.
    if(G.encerrada){ fecharMic(G.stream); return; }
    G.timer = setTimeout(pararGravacao, 12000);   // trava de segurança
    if(usarSR){
      // Reconhecimento do próprio navegador (Chrome, Edge, Safari).
      const rec = G.rec = new SR();
      rec.lang = 'en-US'; rec.interimResults = true; rec.maxAlternatives = 3; rec.continuous = false;
      rec.onresult = ev => { G.resultados = Array.from(ev.results); };
      rec.onerror = ev => { G.erroSR = ev.error; };
      rec.onend = () => encerrarGravacao(G, false);
      try{ rec.start(); }catch(e){ G.erroSR = 'start'; G.rec = null; vigiarSilencio(G); }
    } else if(G.recorder){
      // Navegador sem reconhecimento (ex.: Firefox): grava e o servidor transcreve.
      vigiarSilencio(G);
    } else {
      encerrarGravacao(G, false);
    }
  }
  function pararGravacao(){
    const G = S.cur && S.cur.grav;
    if(!G || G.encerrada) return;
    if(!G.stream && !G.rec){ encerrarGravacao(G, true); return; }   // ainda esperando o microfone
    if(G.rec){
      try{
        G.rec.stop();
        // Alguns aparelhos (Android/emulador) nunca avisam o fim do
        // reconhecimento e o botão ficava travado: depois de 2 s encerra assim
        // mesmo e as próximas gravações vão para o servidor.
        setTimeout(() => {
          if(G.encerrada) return;
          G.erroSR = G.erroSR || 'travou';
          try{ G.rec.abort(); }catch(e){}
          encerrarGravacao(G, false);
        }, 2000);
        return;
      }catch(e){}
    }
    encerrarGravacao(G, false);
  }
  /* Sem reconhecimento do navegador: para sozinho 1,3 s depois que o aluno
     para de falar (mede o volume do microfone). Tocar de novo também envia. */
  function vigiarSilencio(G){
    try{
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if(!Ctx || !G.stream) return;
      const ctx = G.ctx = new Ctx();
      if(ctx.resume) ctx.resume();
      const an = ctx.createAnalyser(); an.fftSize = 1024;
      ctx.createMediaStreamSource(G.stream).connect(an);
      const buf = new Uint8Array(an.fftSize);
      let falou = false, ultimoSom = Date.now();
      G.vigia = setInterval(() => {
        an.getByteTimeDomainData(buf);
        let s = 0; for(let k = 0; k < buf.length; k++){ const x = (buf[k] - 128) / 128; s += x * x; }
        if(Math.sqrt(s / buf.length) > 0.04){ falou = true; ultimoSom = Date.now(); }
        else if(falou && Date.now() - ultimoSom > 1300) pararGravacao();
      }, 100);
    }catch(e){}
  }
  /* Para o gravador e só DEPOIS libera o microfone (no iPhone, parar o
     microfone antes perde a gravação). Blob com o tipo certo pra tocar no Safari. */
  function pararGravador(G){
    return new Promise(ok => {
      const soltarMic = () => fecharMic(G.stream);
      if(!G.recorder || G.recorder.state === 'inactive'){ soltarMic(); ok(null); return; }
      G.recorder.onstop = () => {
        soltarMic();
        ok(G.chunks.length ? new Blob(G.chunks, { type: G.recorder.mimeType || 'audio/mp4' }) : null);
      };
      G.recorder.stop();
    });
  }
  /* Transcrição no servidor (api/transcrever.js → ElevenLabs Speech to Text):
     reserva para navegadores sem reconhecimento ou quando ele falha. */
  async function transcreverNoServidor(blob){
    try{
      const session = typeof dyseSessaoParaServidor === 'function' ? await dyseSessaoParaServidor() : null;
      if(!session) return '';
      const r = await fetch('/api/transcrever', {
        method: 'POST',
        headers: { 'Content-Type': blob.type || 'application/octet-stream', 'Authorization': 'Bearer ' + session.access_token },
        body: blob
      });
      if(!r.ok){ console.error('transcrever:', r.status, await r.text()); return ''; }
      const j = await r.json();
      return String(j.texto || '').trim();
    }catch(e){ console.error('transcrever:', e); return ''; }
  }
  async function encerrarGravacao(G, abortou){
    if(G.encerrada) return;
    G.encerrada = true;
    clearTimeout(G.timer);
    clearInterval(G.vigia);
    if(G.ctx){ try{ G.ctx.close(); }catch(e){} }
    const item = G.item, cur = S.cur;
    cur.gravando = false;
    botaoGravando(false);
    $('#pxMain').classList.remove('gravando');
    const blob = await pararGravador(G);
    if(S.cur !== cur) return;   // já foi para outra questão
    if(blob && !abortou){
      if(cur.audioUrl) URL.revokeObjectURL(cur.audioUrl);
      cur.audioUrl = URL.createObjectURL(blob);
      compare(item);
    }
    const R = G.resultados;
    let finais = abortou || !R.length ? [] : R.length === 1 ? Array.from(R[0]).map(a => a.transcript) : [R.map(r => r[0].transcript).join(' ')];
    finais = finais.filter(t => String(t).trim());
    // Navegador não reconheceu (ou não tem reconhecimento): servidor transcreve a gravação.
    if(!abortou && !finais.length && blob){
      $('#pxHeard').textContent = 'Conferindo o que você disse…';
      acoes([]);
      const t = await transcreverNoServidor(blob);
      if(S.cur !== cur) return;
      if(t) finais = [t];
    }
    // Não ouviu nada: não conta como tentativa.
    if(!finais.length){
      // Reconhecimento do aparelho com defeito (não é só silêncio): daqui em
      // diante grava e manda para o servidor transcrever.
      const falhaReal = G.erroSR && G.erroSR !== 'no-speech' && G.erroSR !== 'aborted';
      if(!abortou && G.usouSR && falhaReal && PODE_GRAVAR) S.forcarServidor = true;
      const semMic = G.erroSR === 'not-allowed' || G.erroSR === 'service-not-allowed' || G.erroSR === 'audio-capture' || (!G.usouSR && !G.stream);
      $('#pxHeard').textContent = abortou ? 'Toque em Gravar e fale a frase em voz alta.'
        : semMic ? 'Não consegui usar o microfone. Toque em Gravar de novo e permita o microfone se o navegador pedir.'
        : 'Não ouvi nada. Toque em Gravar e fale a frase em voz alta, perto do microfone.';
      if(semMic) estadoMic().then(st => { if(st === 'denied') modalMicBloqueado(); });
      acoesFala(item, (cur.falhas || 0) ? 'retry' : false);
      return;
    }
    let best = null;
    finais.forEach(t => { const a = avaliarFala(item, t); if(!best || a.nota > best.nota) best = Object.assign(a, { texto: t }); });
    S.cur.tentativas.push(best.texto);
    S.cur.ultCores = best.cores;
    $('#pxHeard').innerHTML = '<span class="lb">Você disse:</span> ' + best.ditoHtml;
    $('#pxGauge').innerHTML = notaFala(best.nota, best.perfeita);
    if(best.perfeita){
      desenharFrase(item, best.cores, true);
      fecharItem(!S.cur.falhas && !S.cur.leitura ? 'ok' : 'warn', { nota: 1 });
      banner('ok', 'Você falou a frase certinha.');
      acoesFala(item, 'ok');
      return;
    }
    S.cur.falhas = (S.cur.falhas || 0) + 1;
    if(S.cur.falhas >= MAX_FALA_TRIES){
      // 3 erros: mostra a frase, fala em voz alta e libera o Avançar.
      desenharFrase(item, null, true);
      fecharItem('bad', { nota: best.nota });
      banner('bad', 'A frase correta é: ' + item.frase);
      acoesFala(item, 'fim');
      setTimeout(() => falar(item.frase), 500);
      return;
    }
    desenharFrase(item, best.cores, false);
    const restam = MAX_FALA_TRIES - S.cur.falhas;
    banner('warn', 'Não foi isso: as palavras em vermelho estão erradas ou sobrando. Escute e repita a frase exatamente. ' + (restam === 1 ? 'Última chance.' : 'Você tem mais ' + restam + ' chances.'));
    acoesFala(item, 'retry');
  }
  function compare(item){
    if(!S.cur.audioUrl) return;
    $('#pxCompare').innerHTML = '<div class="px-compare-t">Compare sua pronúncia</div>' +
      '<div class="px-compare"><button class="box eu" onclick="DysePratica._playEu()">' + I('play_arrow') + 'Minha voz</button>' +
      '<button class="box orig" onclick="DysePratica._playOrig()">' + I('play_arrow') + 'Original</button></div>';
  }

  /* ---------- modais ---------- */
  function modal(html, cls){
    const bg = document.createElement('div'); bg.className = 'px-modal-bg';
    bg.innerHTML = '<div class="px-modal ' + (cls || '') + '">' + html + '</div>';
    document.body.appendChild(bg);
    return bg;
  }
  function modalTraducao(en, pt){
    const m = modal('<div class="px-m-kicker">Tradução</div><div class="tr-en">' + esc(en) + '</div>' +
      '<div class="tr-pt">' + esc(pt || '—') + '</div><button class="px-btn ghost">Fechar</button>', 'small');
    m.querySelector('button').onclick = () => m.remove();
  }
  function modalIntro(){
    const at = S.info.atividade;
    const m = modal(
      '<div class="cv-side"><span class="cv-mark">dyse</span><span class="cv-ic">' + I(at.microfone ? 'mic' : 'edit_note') + '</span>' +
        '<span class="cv-lv">' + esc(S.info.nivelNome) + '<br>Aula ' + String(S.cfg.aula).padStart(2, '0') + '</span></div>' +
      '<div class="cv-body">' +
        '<div class="px-m-kicker">' + esc(at.tipo) + '</div>' +
        '<h2>' + esc(at.titulo) + '</h2>' +
        '<div class="meta">' + esc(S.info.aulaInfo.titulo) + '</div>' +
        '<div class="cv-chips"><span>' + I('schedule') + esc(at.minutos) + ' min</span><span>' + I('checklist') + S.cfg.itens.length + ' questões</span>' +
          (at.microfone ? '<span>' + I('mic') + 'Usa microfone</span>' : '') +
          (S.refazendo ? '<span style="background:#FDF0DD; color:#CE8613;">' + I('replay') + 'Treino · não soma no ranking</span>' : '') + '</div>' +
        '<div class="cv-grid"><div><small>Você vai treinar</small><b>' + esc(at.treina) + '</b></div><div class="pts"><small>Ganhe até</small><b>' + dysePraticaPontosMax(S.cfg.itens.length) + ' pts</b></div></div>' +
        (S.retomado ? '<div class="px-ctx" style="margin:0 0 12px;">' + I('history') + ' Você parou na questão ' + (S.i + 1) + ' de ' + S.cfg.itens.length + '. Seu progresso fica guardado por ' + PROGRESSO_MIN + ' minutos depois que você sai.</div>' : '') +
        '<button class="px-btn" id="pxComecar">' + (S.retomado ? 'Continuar da questão ' + (S.i + 1) : 'Começar') + ' ' + I('arrow_forward') + '</button>' +
      '</div>', 'cover');
    // imagem/fala já falam a 1ª questão dentro deste toque; as outras só liberam o som.
    m.querySelector('#pxComecar').onclick = () => {
      S.comecou = true; iniciarTempo(); if(S.cfg.tipo !== 'imagem' && S.cfg.tipo !== 'fala') desbloquearAudio(); m.remove(); renderItem(); };
  }
  function sair(){
    const feitas = S.res.filter(Boolean).length;
    const aviso = feitas
      ? 'Seu progresso (' + feitas + ' de ' + S.cfg.itens.length + ' questões) fica guardado por <b>' + PROGRESSO_MIN + ' minutos</b>. Se você voltar depois disso, vai ter que refazer a atividade inteira.'
      : 'Você ainda não respondeu nenhuma questão.';
    const m = modal('<div class="px-m-kicker">Pausa</div><h2>Quer sair da atividade?</h2><div class="meta">' + aviso + '</div>' +
      '<button class="px-btn" id="pxStay">Continuar praticando</button><button class="px-btn ghost" id="pxLeave">Sair do exercício</button>', 'small');
    m.querySelector('#pxStay').onclick = () => m.remove();
    m.querySelector('#pxLeave').onclick = () => { salvarProgresso(); location.href = S.staff ? '/professora.html' : '/area-do-aluno.html#praticas'; };
  }

  /* ---------- Pontuação DYSE (ver DYSE_PONTOS em catalogo.js) ---------- */
  function calcularPontos(){
    const n = S.cfg.itens.length;
    const primeira = S.res.filter(r => r && r.status === 'ok').length;
    const segunda = S.res.filter(r => r && r.status === 'warn').length;
    const combos = S.combos || 0;
    const perfeita = primeira === n;
    const det = {
      primeira: primeira * DYSE_PONTOS.primeira,
      segunda: segunda * DYSE_PONTOS.segunda,
      combo: combos * DYSE_PONTOS.combo,
      perfeita: perfeita ? DYSE_PONTOS.perfeita : 0
    };
    return { primeira, segunda, combos, perfeita, det, total: det.primeira + det.segunda + det.combo + det.perfeita, max: dysePraticaPontosMax(n) };
  }

  /* Próxima atividade liberada pra este aluno e ainda não concluída, na
     ordem do catálogo (começa depois da atual e dá a volta). */
  async function proximaLiberada(){
    try{
      const lista = dysePraticasEmOrdem(S.info.nivel);
      const [liberadas, resultados] = await Promise.all([dyseMinhasPraticasLiberadas(), dyseListMyResults(S.cfg.course)]);
      const feitas = new Set(resultados.filter(r => r.status === 'concluida').map(r => r.course + ':' + r.aula + ':' + r.activity_num));
      const atual = lista.findIndex(a => a.aula === S.cfg.aula && a.num === S.cfg.num);
      for(let k = 1; k <= lista.length; k++){
        const a = lista[(atual + k) % lista.length];
        const chave = a.course + ':' + a.aula + ':' + a.num;
        if(a.aula === S.cfg.aula && a.num === S.cfg.num) continue;
        if(liberadas.has(chave) && !feitas.has(chave)) return a;
      }
    }catch(e){}
    return null;
  }

  function linksFim(prox){
    const voltar = S.staff ? '/professora.html' : '/area-do-aluno.html#praticas';
    if(S.staff){
      return '<button class="px-btn" onclick="location.reload()">Testar de novo</button>' +
        '<button class="px-btn ghost" onclick="location.href=\'' + voltar + '\'">Voltar ao painel</button>';
    }
    if(prox){
      const url = dysePraticaUrl(prox.nivel, prox.aula, prox.num);
      return '<div class="px-next"><div><small>Próxima atividade liberada</small><b>' + esc(prox.titulo) + '</b>' +
          '<span id="pxNextCount">Abrindo em <i>10</i>s…</span></div>' +
          '<a class="px-btn" href="' + url + '" style="width:auto; margin:0; padding:12px 22px; text-decoration:none;">Ir agora ' + I('arrow_forward') + '</a></div>' +
        '<button class="px-btn ghost" onclick="DysePratica._ficar(\'' + voltar + '\')">Voltar para Atividades</button>';
    }
    return '<div class="px-next done"><div><b>Você fez todas as atividades liberadas!</b><small>Quando a professora liberar novas, elas aparecem no seu menu Atividades.</small></div></div>' +
      '<button class="px-btn" onclick="location.href=\'' + voltar + '\'">Voltar para Atividades</button>';
  }

  /* ---------- final: pontos, revisão e salvar ---------- */
  async function finalizar(){
    pararAudio();
    apagarProgresso();
    const itens = S.cfg.itens, n = itens.length;
    const p = calcularPontos();
    const acertos = p.primeira + p.segunda;

    const linhas = itens.map((it, k) => {
      const r = S.res[k] || { status: 'skip', tentativas: [] };
      const ic = r.status === 'ok' ? 'certo de primeira' : r.status === 'warn' ? 'certo na 2ª tentativa' : r.status === 'skip' ? 'pulou' : 'errou';
      return (k + 1) + '. ' + it.completa + ' — ' + ic + (r.status === 'ok' ? '' : ' (tentativas: ' + (r.tentativas.join(' | ') || 'nenhuma') + ')');
    });
    const resumo = 'Acertos de primeira: ' + p.primeira + '/' + n + ' · Acertos totais: ' + acertos + '/' + n + ' · Pontos DYSE: ' + p.total + '/' + p.max;
    const report = S.info.nivelNome + ' · Aula ' + String(S.cfg.aula).padStart(2, '0') + ' · ' + S.info.atividade.titulo + ' (' + S.info.atividade.tipo + ')\n' + resumo + '\n\n' + linhas.join('\n');
    const meta = {
      tipo: S.cfg.tipo, acertos: acertos, acertos_primeira: p.primeira, total: n, pontos: p.total, pontos_max: p.max,
      criterio: 'dyse-v1', pontos_detalhe: p.det, combos: p.combos, max_sequencia: S.maxStreak,
      duracao_seg: Math.round(tempoGasto() / 1000),
      itens: itens.map((it, k) => { const r = S.res[k] || { status: 'skip', tentativas: [] };
        return { n: k + 1, correta: it.completa, status: r.status, tentativas: r.tentativas, nota: r.nota != null ? Math.round(r.nota * 100) : undefined }; })
    };

    let salvo = '';
    if(!S.staff){
      const { error } = await dyseSaveResult(S.cfg.course, S.cfg.num, S.info.atividade.titulo, report, meta, S.cfg.aula);
      salvo = error ? '<div class="px-ctx" style="color:var(--bad);">Não consegui salvar seu resultado. Verifique a internet e fale com a professora.</div>' : '';
    }
    const prox = S.staff ? null : await proximaLiberada();
    banner(null);
    $('#pxFoot').style.display = 'none';
    const pctAcerto = Math.round((acertos / n) * 100);
    const prec = p.primeira / n;
    $('#pxMain').outerHTML = '<div class="px-result" id="pxMain">' + salvo +
      '<div class="px-res-hero"><span class="px-mark">dyse</span><div class="ring" style="--p:' + pctAcerto + '"><b>' + acertos + '/' + n + '</b><small>corretas</small></div>' +
        '<h2>' + (p.perfeita ? 'Perfeita!' : prec >= 0.7 ? 'Mandou bem!' : 'Bom treino!') + '</h2><p>' + esc(S.info.atividade.titulo) + ' · Aula ' + String(S.cfg.aula).padStart(2, '0') + '</p></div>' +
      '<div class="px-res-total" style="margin-bottom:16px;"><span>' + (S.refazendo ? 'Pontos do treino' : 'Pontos DYSE') +
        '<small style="display:block; font-size:.72rem; opacity:.7; font-weight:500;">de ' + p.max + ' possíveis · ' +
        (S.refazendo ? 'no ranking continua valendo a 1ª vez' + (S.pontosOriginais != null ? ' (' + S.pontosOriginais + ' pts)' : '') : 'contam no Ranking') +
        '</small></span><b>' + p.total + ' pts</b></div>' +
      linksFim(prox) +
      '<div class="px-res-card" style="margin-top:16px;"><h3>Como você pontuou</h3>' +
        '<div class="px-res-line"><div class="ic">' + I('target') + '</div><div class="txt">Acertos de primeira<small>' + p.primeira + ' × ' + DYSE_PONTOS.primeira + ' pts</small></div><div class="pts">+' + p.det.primeira + '</div></div>' +
        '<div class="px-res-line"><div class="ic">' + I('replay') + '</div><div class="txt">Acertos na 2ª tentativa<small>' + p.segunda + ' × ' + DYSE_PONTOS.segunda + ' pts</small></div><div class="pts">+' + p.det.segunda + '</div></div>' +
        '<div class="px-res-line"><div class="ic">' + I('local_fire_department') + '</div><div class="txt">Combo DYSE<small>' + p.combos + ' combo' + (p.combos === 1 ? '' : 's') + ' de ' + DYSE_PONTOS.comboACada + ' acertos seguidos</small></div><div class="pts">+' + p.det.combo + '</div></div>' +
        '<div class="px-res-line"><div class="ic">' + I('emoji_events') + '</div><div class="txt">Atividade perfeita<small>' + (p.perfeita ? 'Tudo de primeira!' : 'Acerte tudo de primeira pra ganhar') + '</small></div><div class="pts">+' + p.det.perfeita + '</div></div>' +
      '</div>' +
      '<div class="px-res-card"><h3>Seu relatório: ' + acertos + ' de ' + n + ' corretas</h3><ul class="px-review">' +
        itens.map((it, k) => {
          const r = S.res[k] || { status: 'skip', tentativas: [] };
          const st = r.status;
          const sub = st === 'ok' ? 'Acertou de primeira' : st === 'warn' ? 'Acertou na 2ª tentativa' + (r.tentativas.length > 1 ? ' · antes: ' + r.tentativas.slice(0, -1).join(' | ') : '')
            : st === 'skip' ? 'Pulada' : 'Sua resposta: ' + r.tentativas.join(' | ');
          return '<li><span class="st ' + st + '">' + (st === 'ok' ? I('check') : st === 'warn' ? I('priority_high') : st === 'skip' ? I('remove') : I('close')) + '</span><div>' + esc(it.completa) + '<small>' + esc(sub) + '</small></div></li>';
        }).join('') + '</ul></div>' +
    '</div>';
    window.scrollTo(0, 0);
    if(prox) iniciarContagem(dysePraticaUrl(prox.nivel, prox.aula, prox.num));
  }

  // Vai sozinho pra próxima atividade liberada em 10s (dá pra ir na hora ou voltar).
  let CONTAGEM = null;
  function iniciarContagem(url){
    let s = 10;
    CONTAGEM = setInterval(() => {
      s--;
      const el = document.querySelector('#pxNextCount i');
      if(el) el.textContent = s;
      if(s <= 0){ clearInterval(CONTAGEM); location.href = url; }
    }, 1000);
  }

  /* Atividade já concluída: o aluno não refaz sozinho — só se a professora
     liberar "refazer" (aluno_atividades_liberadas.refazer_liberado_em mais
     recente que o resultado salvo). O banco também barra (seção 38). */
  async function telaJaConcluida(res){
    const m = res.meta || {};
    const prox = await proximaLiberada();
    document.body.innerHTML =
      '<header class="px-top"><div class="px-top-row"><span class="px-mark">dyse</span>' +
        '<div class="px-title"><b>' + esc(S.info.atividade.titulo) + '</b><small>' + esc(S.info.nivelNome) + ' · Aula ' + String(S.cfg.aula).padStart(2, '0') + '</small></div>' +
        '<button class="px-close" onclick="location.href=\'/area-do-aluno.html#praticas\'">Sair</button></div></header>' +
      '<div class="px-result">' +
        '<div class="px-res-hero"><span class="px-mark">dyse</span><div class="ring" style="--p:' + (m.total ? Math.round((m.acertos / m.total) * 100) : 100) + '"><b>' + (m.total ? m.acertos + '/' + m.total : I('check')) + '</b><small>corretas</small></div>' +
          '<h2>Atividade concluída</h2><p>Você já fez esta atividade' + (m.pontos != null ? ' e ganhou <b>' + m.pontos + ' pts</b>' : '') + '. Pra refazer, peça à sua professora.</p></div>' +
        linksFim(prox) +
      '</div>';
    if(prox) iniciarContagem(dysePraticaUrl(prox.nivel, prox.aula, prox.num));
  }

  /* ---------- API pública ---------- */
  window.DysePratica = {
    async iniciar(cfg){
      S.cfg = cfg;
      precarregarAudios(cfg);
      S.info = dysePraticaInfo(cfg.course, cfg.aula, cfg.num);
      const session = await dyseRequireAuth(); if(!session) return;
      const ok = await dyseRequirePraticaLiberada(cfg.course, cfg.aula, cfg.num); if(!ok) return;
      S.uid = session.user && session.user.id;
      const profile = await dyseGetProfile(session);
      // Modo de teste (não salva) só pra gestão/professora abrindo uma
      // atividade que NÃO foi liberada pra ela mesma. Se foi liberada pra
      // essa conta (ex: gestão que também é aluno), funciona como aluno.
      const ehStaff = dyseIsTeacher(profile) || dyseIsAdmin(profile);
      const liberadaPraMim = (await dyseMinhasPraticasLiberadas()).has(cfg.course + ':' + cfg.aula + ':' + cfg.num);
      S.staff = ehStaff && !liberadaPraMim;
      document.title = 'DYSE · ' + S.info.nivelNome + ' · Aula ' + String(cfg.aula).padStart(2, '0') + ' · ' + S.info.atividade.titulo;
      if(!S.staff){
        const [res, refazer] = await Promise.all([dyseLoadResult(cfg.course, cfg.num, cfg.aula), dyseMinhasPraticasRefazer()]);
        const liberadoEm = refazer[cfg.course + ':' + cfg.aula + ':' + cfg.num];
        const podeRefazer = res && liberadoEm && new Date(liberadoEm) > new Date(res.updated_at);
        if(res && res.status === 'concluida' && !podeRefazer){ await telaJaConcluida(res); return; }
        // Refazer liberado pela professora: vale como treino — o ranking guarda
        // só os pontos da 1ª conclusão (o banco congela, seção 39).
        if(res && res.status === 'concluida' && podeRefazer){
          S.refazendo = true;
          S.pontosOriginais = res.pontos_ranking != null ? res.pontos_ranking : (res.meta && res.meta.pontos);
        }
      }
      const g = lerProgresso();
      if(g){
        Object.assign(S, { i: g.i, res: g.res, streak: g.streak || 0, maxStreak: g.maxStreak || 0, comboRun: g.comboRun, combos: g.combos, tempoAcum: g.tempoMs || 0, retomado: true });
      }
      montarTopo();
      if(g){ pintarBarra(); pintarStreak(false); }
      modalIntro();
    },
    sair: sair,
    _act(id){ if(HANDLERS[id]) HANDLERS[id](); },
    _img: clicarImagem, _sel: selecionar, _slot: porNoSlot, _unslot: tirarDoSlot,
    _ficar(url){ if(CONTAGEM) clearInterval(CONTAGEM); location.href = url; },
    _playEu(){ if(S.cur && S.cur.audioUrl) new Audio(S.cur.audioUrl).play(); },
    _playOrig(){ const it = S.cfg.itens[S.i]; falar(it.frase); },
    _avaliar(item, ouvido){ return avaliarFala(item, ouvido); },   // usado nos testes
    // Usado pelo scripts/gerar-audios.ps1 pra listar as frases de cada atividade.
    // Gera no servidor (api/gerar-audio.js) os áudios que faltam das frases dadas. Só gestão/professor(a).
    async _gerarAudios(lista){
      const session = typeof dyseSessaoParaServidor === 'function' ? await dyseSessaoParaServidor() : null;
      if(!session) throw new Error('sem sessão');
      const r = await fetch('/api/gerar-audio', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + session.access_token }, body: JSON.stringify({ itens: lista }) });
      return r.json();
    },
    _audios(cfg){ return cfg.itens.map(it => { const f = falaDoItem(cfg.tipo, it); const v = vozPara(f.texto, f.quem); return { texto: String(f.texto).trim(), voz: v, chave: chaveAudio(f.texto, v) }; }); }
  };
})();
