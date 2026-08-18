/* DYSE · Atividades Complementares A1 — engine compartilhado
   Reúne o que toda atividade precisa (auth gate, checagem de liberação,
   autosave em activity_results, TTS, vídeo com pausa pra exercício) num
   só lugar — com 15 atividades por aula × 44 aulas, cada arquivo de
   atividade fica só com o exercício em si, não com esse boilerplate. */

const DyseAtividade = (function(){

  function dyseCheckAuth(){
    if(typeof dyseRequireAuth !== 'function'){
      document.documentElement.classList.add('dyse-auth-ready');
      return Promise.resolve(null);
    }
    return dyseRequireAuth();
  }
  const sessionPromise = dyseCheckAuth();

  /* Chamar assim que o <body> tiver os elementos #authBar e #dyseAuthGate.
     Resolve com { session, dadosSalvos } — dadosSalvos é o "meta" salvo
     numa visita anterior (ou null, se a atividade nunca foi feita). */
  async function boot(atividade){
    const session = await sessionPromise;
    if(!session) return { session: null, dadosSalvos: null };

    if(typeof dyseRequirePublished === 'function'){
      const allowed = await dyseRequirePublished(atividade.course, atividade.numero);
      if(!allowed) return { session: null, dadosSalvos: null }; // já está redirecionando
    }

    if(typeof dyseRenderAuthBar === 'function') dyseRenderAuthBar('authBar');

    let dadosSalvos = null;
    if(typeof dyseLoadResult === 'function'){
      try{
        const existing = await dyseLoadResult(atividade.course, atividade.numero);
        if(existing && existing.meta) dadosSalvos = existing.meta;
      }catch(e){ console.error('dyseLoadResult falhou:', e); }
    }
    return { session, dadosSalvos };
  }

  /* Marca a atividade como concluída — salva no Supabase e mostra o banner
     de "atividade concluída" (precisa de um elemento #doneBanner na página). */
  async function concluir(atividade, reportText, meta){
    if(typeof dyseSaveResult === 'function'){
      await dyseSaveResult(atividade.course, atividade.numero, atividade.titulo, reportText, meta || {});
    }
    const banner = document.getElementById('doneBanner');
    if(banner) banner.classList.add('show');
    const btn = document.getElementById('btnConcluir');
    if(btn){ btn.disabled = true; btn.textContent = 'Atividade concluída ✓'; }
  }

  /* ---------- Text-to-speech (mesmo padrão do TOEFL) ---------- */
  function speak(text, onend){
    if(!('speechSynthesis' in window)){
      alert('Seu navegador não tem suporte a áudio (Web Speech API). Tente usar o Google Chrome.');
      return;
    }
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = 'en-US';
    utter.rate = 0.92;
    utter.pitch = 1;
    if(onend) utter.onend = onend;
    window.speechSynthesis.speak(utter);
  }

  /* ---------- Vídeo do YouTube com pausa pra exercício ----------
     videoId vazio = vídeo ainda não cadastrado pela coordenação; mostra
     aviso em vez de tentar carregar um vídeo que não existe.
     pausas: [{tempo: segundos, pergunta: 'texto', el: <function que
     preenche o card de pausa com a pergunta>}] — quando o player passa de
     um "tempo", pausa e mostra o card; o botão "Continuar" (dentro do
     card, chamado por quem monta a pergunta) dá play de novo. */
  function montarVideoComPausas(containerId, videoId, pausas){
    const wrap = document.getElementById(containerId);
    if(!wrap) return;
    if(!videoId){
      wrap.innerHTML = '<div class="video-pending">🎬 Vídeo desta atividade ainda não foi cadastrado pela coordenação. Volte em breve!</div>';
      return;
    }
    wrap.innerHTML = '<div class="video-frame-wrap"><div id="' + containerId + '-player"></div></div>';

    const pausasRestantes = pausas.slice().sort((a, b) => a.tempo - b.tempo);
    let player = null;
    let checkTimer = null;

    function onPlayerReady(){
      checkTimer = setInterval(() => {
        if(!player || typeof player.getCurrentTime !== 'function') return;
        if(!pausasRestantes.length) return;
        const proxima = pausasRestantes[0];
        if(player.getCurrentTime() >= proxima.tempo){
          player.pauseVideo();
          pausasRestantes.shift();
          proxima.aoPausar(() => player.playVideo());
        }
      }, 400);
    }

    function criarPlayer(){
      player = new YT.Player(containerId + '-player', {
        videoId: videoId,
        playerVars: { rel: 0, modestbranding: 1 },
        events: { onReady: onPlayerReady }
      });
    }

    if(window.YT && window.YT.Player){
      criarPlayer();
    }else{
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      document.head.appendChild(tag);
      window.onYouTubeIframeAPIReady = criarPlayer;
    }
  }

  return { boot, concluir, speak, montarVideoComPausas };
})();
