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

  /* "aula" é opcional em todo ATIVIDADE — default 1 (única aula que existe
     hoje). Nada muda pra quem já usa o engine sem esse campo. */
  function aulaDe(atividade){ return atividade.aula || 1; }

  /* URL da atividade N dentro da MESMA aula/curso, seguindo a convenção de
     nome de arquivo já usada em todo o A1 ("atividade_N.html", na mesma
     pasta). Cursos futuros com pasta por aula podem sobrescrever isso
     passando atividade.urlAtividade = function(n){ return '...'; }. */
  function urlDaAtividade(atividade, numero){
    if(typeof atividade.urlAtividade === 'function') return atividade.urlAtividade(numero);
    return 'atividade_' + numero + '.html';
  }

  /* Absoluta (não relativa) de propósito: a partir da Aula 02 os arquivos
     moram em subpastas por aula (ex: /atividades/a1/aula-02/atividade_5.html),
     então um "index.html" relativo apontaria pra dentro da subpasta errada. */
  function urlDoIndiceCurso(atividade){
    return '/atividades/' + atividade.course + '/';
  }

  /* Próxima atividade da mesma aula, SE estiver liberada — nunca aponta
     pra uma bloqueada. null quando não há próxima (fim da aula, ou a
     próxima ainda não foi liberada pela professora). */
  async function proximaAtividade(atividade){
    if(typeof dyseGetPublishedSet !== 'function') return null;
    if(atividade.numero >= atividade.totalAula) return null;
    const publicadas = await dyseGetPublishedSet(atividade.course, aulaDe(atividade));
    const proximoNumero = atividade.numero + 1;
    if(!publicadas.has(proximoNumero)) return null;
    return urlDaAtividade(atividade, proximoNumero);
  }

  /* Estado da atividade pro aluno logado, um dos 5 valores pedidos:
     'bloqueada' | 'disponivel' | 'em_andamento' | 'concluida' | 'pulada'.
     Usado pelos index.html de cada curso pra pintar o card de cada atividade. */
  async function status(atividade){
    if(typeof dyseGetPublishedSet !== 'function' || typeof dyseLoadResult !== 'function') return 'disponivel';
    const publicadas = await dyseGetPublishedSet(atividade.course, aulaDe(atividade));
    if(!publicadas.has(atividade.numero)) return 'bloqueada';
    const row = await dyseLoadResult(atividade.course, atividade.numero, aulaDe(atividade));
    if(!row) return 'disponivel';
    return row.status || 'em_andamento';
  }

  /* Injeta o botão "Pular atividade" num slot fixo (<div id="skipBtnSlot">)
     se a página tiver esse slot — não faz nada em páginas antigas que ainda
     não têm o slot (compatível com o que já está publicado). Alvo de toque
     ≥44px (min-height no CSS, .btn-skip em estilo.css). */
  function renderSkipButton(atividade){
    const slot = document.getElementById('skipBtnSlot');
    if(!slot || slot.dataset.rendered) return;
    slot.dataset.rendered = '1';
    slot.innerHTML = '<button type="button" class="btn btn-ghost btn-skip" id="btnPular">Pular atividade →</button>';
    document.getElementById('btnPular').addEventListener('click', () => pular(atividade));
  }

  /* Pular sem concluir — nunca apaga resposta já salva, nunca leva a uma
     atividade bloqueada. Sem próxima liberada, volta pro índice do curso. */
  async function pular(atividade){
    const btn = document.getElementById('btnPular');
    if(btn){ btn.disabled = true; btn.textContent = 'Pulando...'; }
    if(typeof dyseSkipActivity === 'function'){
      const { error } = await dyseSkipActivity(atividade.course, atividade.numero, aulaDe(atividade));
      if(error){
        alert('Não foi possível pular essa atividade agora. Tente de novo em instantes.');
        if(btn){ btn.disabled = false; btn.textContent = 'Pular atividade →'; }
        return;
      }
    }
    const proxima = await proximaAtividade(atividade);
    location.href = proxima || urlDoIndiceCurso(atividade);
  }

  /* Chamar assim que o <body> tiver os elementos #authBar e #dyseAuthGate.
     Resolve com { session, dadosSalvos } — dadosSalvos é o "meta" salvo
     numa visita anterior (ou null, se a atividade nunca foi feita). */
  async function boot(atividade){
    const session = await sessionPromise;
    if(!session) return { session: null, dadosSalvos: null };

    if(typeof dyseRequirePublished === 'function'){
      const allowed = await dyseRequirePublished(atividade.course, atividade.numero, aulaDe(atividade));
      if(!allowed) return { session: null, dadosSalvos: null }; // já está redirecionando
    }

    if(typeof dyseRenderAuthBar === 'function') dyseRenderAuthBar('authBar');

    let dadosSalvos = null;
    let statusAtual = null;
    if(typeof dyseLoadResult === 'function'){
      try{
        const existing = await dyseLoadResult(atividade.course, atividade.numero, aulaDe(atividade));
        if(existing){
          if(existing.meta) dadosSalvos = existing.meta;
          statusAtual = existing.status;
        }
      }catch(e){ console.error('dyseLoadResult falhou:', e); }
    }

    /* Atividade já concluída não precisa (nem faz sentido) de "Pular" —
       pular é só pra avançar sem terminar algo que ainda está pendente. */
    if(statusAtual !== 'concluida') renderSkipButton(atividade);

    return { session, dadosSalvos, statusAtual };
  }

  /* Autosave parcial (não marca como concluída) — pra atividades com várias
     seções internas que salvam sozinhas antes do clique final em "Concluir"
     (mesmo espírito do autosave do TOEFL, só que passando pelo engine em
     vez de reimplementado por arquivo). */
  async function autosaveParcial(atividade, reportText, meta){
    if(typeof dyseAutosaveParcial === 'function'){
      await dyseAutosaveParcial(atividade.course, atividade.numero, atividade.titulo, reportText, meta || {}, aulaDe(atividade));
    }
  }

  /* Marca a atividade como concluída — salva no Supabase e AVANÇA
     automaticamente pra próxima atividade já liberada da mesma aula (sem
     precisar de outro clique). Só mostra o banner "Atividade concluída"
     parado, com link de voltar, quando não há próxima liberada (é a
     última da aula, ou a seguinte ainda não foi liberada). */
  async function concluir(atividade, reportText, meta){
    if(typeof dyseSaveResult === 'function'){
      await dyseSaveResult(atividade.course, atividade.numero, atividade.titulo, reportText, meta || {}, aulaDe(atividade));
    }
    const btn = document.getElementById('btnConcluir');
    const skipBtn = document.getElementById('btnPular');
    if(skipBtn) skipBtn.style.display = 'none';

    const proxima = await proximaAtividade(atividade);
    if(proxima){
      if(btn){ btn.disabled = true; btn.textContent = 'Concluído! Indo pra próxima atividade...'; }
      setTimeout(() => { location.href = proxima; }, 900);
      return;
    }

    const banner = document.getElementById('doneBanner');
    if(banner) banner.classList.add('show');
    const nextSlot = document.getElementById('doneBannerNext');
    if(nextSlot) nextSlot.innerHTML = '<a class="btn btn-ghost" href="' + urlDoIndiceCurso(atividade) + '">← Voltar pras atividades</a>';
    if(btn){ btn.disabled = true; btn.textContent = 'Atividade concluída ✓'; }
  }

  /* ---------- Reconhecimento de voz (Web Speech API) ----------
     Porta pro engine compartilhado o que hoje só existe duplicado em cada
     arquivo do TOEFL — usado pelas atividades de Speaking. Fallback
     gracioso quando o navegador não suporta (comum em iOS Safari): nunca
     trava a atividade, só avisa que a gravação não está disponível. */
  function iniciarReconhecimento(targetText, callbacks){
    callbacks = callbacks || {};
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if(!SpeechRecognition){
      if(callbacks.onError) callbacks.onError('unsupported');
      return null;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.onresult = (event) => {
      const heard = event.results[0][0].transcript;
      const similarity = calcularSimilaridade(heard, targetText);
      if(callbacks.onResult) callbacks.onResult(heard, similarity);
    };
    recognition.onerror = (event) => {
      if(callbacks.onError) callbacks.onError(event.error);
    };
    recognition.start();
    return recognition;
  }

  /* ---------- Relatório detalhado (mesmo espírito do buildReportText do TOEFL) ----------
     "resumo" é a linha de placar (ex: "4/6 corretas (67%)"); "linhas" é um
     array de strings já formatadas, uma por pergunta/item, que cada
     atividade monta enquanto o aluno responde. Sem "linhas", cai pro
     comportamento antigo (só título + resumo). */
  function montarRelatorio(atividade, resumo, linhas){
    let texto = atividade.titulo + '\n' + resumo;
    if(linhas && linhas.length) texto += '\n\n' + linhas.join('\n');
    return texto;
  }

  /* % de palavras da frase-alvo encontradas na fala reconhecida (mesmo
     cálculo simples usado hoje nas atividades TOEFL de Speaking). */
  function calcularSimilaridade(ouvido, alvo){
    const normaliza = (s) => s.toLowerCase().replace(/[^a-z0-9' ]/g, '').split(/\s+/).filter(Boolean);
    const palavrasAlvo = normaliza(alvo);
    const palavrasOuvidas = new Set(normaliza(ouvido));
    if(!palavrasAlvo.length) return 0;
    const acertos = palavrasAlvo.filter(p => palavrasOuvidas.has(p)).length;
    return Math.round((acertos / palavrasAlvo.length) * 100);
  }

  /* ---------- Text-to-speech (mesmo padrão do TOEFL) ----------
     "rate" opcional (default 0.92) — aulas Pré-A1 (01-05) usam 0.8, mais
     devagar que o padrão, seguindo a curva de dificuldade combinada. */
  function speak(text, onend, rate){
    if(!('speechSynthesis' in window)){
      alert('Seu navegador não tem suporte a áudio (Web Speech API). Tente usar o Google Chrome.');
      return;
    }
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = 'en-US';
    utter.rate = rate || 0.92;
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

  return { boot, concluir, autosaveParcial, pular, status, speak, montarVideoComPausas, iniciarReconhecimento, montarRelatorio };
})();
