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
  const PASS_FALA = 0.7;      // nota mínima pra passar na fala
  const MAX_FALA_TRIES = 3;   // depois disso libera "Pular"

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

  /* ---------- áudio: voz do navegador em inglês ---------- */
  let VOZ = null;
  function escolherVoz(){
    const vs = (window.speechSynthesis && speechSynthesis.getVoices()) || [];
    VOZ = vs.find(v => /en-US/i.test(v.lang) && /Google|Samantha|Jenny|Aria|Natural/i.test(v.name))
       || vs.find(v => /en-US/i.test(v.lang)) || vs.find(v => /^en/i.test(v.lang)) || null;
  }
  if(window.speechSynthesis){ escolherVoz(); speechSynthesis.onvoiceschanged = escolherVoz; }
  function falar(texto, rate){
    if(!window.speechSynthesis) return;
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(texto);
    u.lang = 'en-US'; u.rate = rate || 0.92;
    if(VOZ) u.voice = VOZ;
    speechSynthesis.speak(u);
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
      '<div class="px-bar" id="pxBar">' + Array.from({length: n}, (_, k) => '<span>' + (k + 1) + '</span>').join('') + '</div></header>' +
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
  }
  function avancar(){
    if(window.speechSynthesis) speechSynthesis.cancel();
    S.i++;
    if(S.i >= S.cfg.itens.length) return finalizar();
    renderItem();
  }
  function botoesFim(item, comTraduzir){
    const l = [];
    if(item.audio !== false) l.push({ id: 'ouvirFim', ic: I('play_arrow'), label: 'Escutar' });
    if(comTraduzir && item.traducao) l.push({ id: 'traduzir', ic: I('translate'), label: 'Traduzir' });
    l.push({ id: 'avancar', ic: I('arrow_forward'), label: 'Avançar', cls: 'primary' });
    on('ouvirFim', () => falar(item.completa || item.audioTexto || ''));
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
    $('#pxMain').insertAdjacentHTML('afterbegin', '<div class="px-qtag">Questão ' + (S.i + 1) + ' <span>de ' + S.cfg.itens.length + '</span></div>');
    window.scrollTo(0, 0);
  }

  /* IMAGEM — escute e escolha */
  function renderImagem(item){
    const main = $('#pxMain');
    main.innerHTML = '<p class="px-instr">' + esc(S.cfg.instrucao || 'Escute e escolha a imagem correta') + '</p>' +
      '<div class="px-imgs">' + item.opcoes.map((o, k) =>
        '<button type="button" class="px-img" id="pxImg' + k + '" onclick="DysePratica._img(' + k + ')">' +
          '<span class="key">' + 'ABCDEFGH'[k] + '</span><span class="ph"><img src="' + esc(o.img) + '" alt=""></span><span class="lbl">' + esc(o.label) + '</span></button>').join('') + '</div>';
    item.completa = item.audioTexto;
    on('ouvir', () => falar(item.audioTexto));
    on('ouvirLento', () => falar(item.audioTexto, 0.6));
    acoes([{ id: 'ouvirLento', ic: I('slow_motion_video'), label: 'Devagar' }, { id: 'ouvir', ic: I('play_arrow'), label: 'Escutar', cls: 'primary' }]);
    setTimeout(() => falar(item.audioTexto), 350);
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
        '<div class="px-phone-bar"><span>Escolha a resposta abaixo…</span><span class="snd">' + I('send') + '</span></div></div>';
      S.cur.horaProx = hora(item.chat.length);
    }
    main.innerHTML = '<p class="px-instr">' + esc(S.cfg.instrucao || 'Selecione uma opção para completar a frase') + '</p>' + topo +
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
    main.innerHTML = '<p class="px-instr">' + esc(S.cfg.instrucao || 'Clique nas palavras e monte a frase') + '</p>' +
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
      setTimeout(() => falar(item.completa), 300);
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
  const CONTR = { "what's":"what is", "i'm":"i am", "it's":"it is", "he's":"he is", "she's":"she is", "you're":"you are", "we're":"we are", "they're":"they are", "that's":"that is", "where's":"where is", "let's":"let us", "whats":"what is", "im":"i am", "hes":"he is", "shes":"she is", "youre":"you are", "theyre":"they are", "thats":"that is", "wheres":"where is" };
  function norm(txt){
    return String(txt || '').toLowerCase().replace(/[’`]/g, "'").split(/\s+/)
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
  // Avalia cada palavra exibida contra o que o reconhecimento ouviu.
  function avaliarFala(item, ouvido){
    const heard = norm(ouvido);
    const pool = heard.slice();
    const tokens = item.frase.split(/\s+/);
    const cores = tokens.map(tok => {
      const partes = norm(tok);
      if(!partes.length) return 'ok';
      let ok = true, quase = true;
      partes.forEach(p => {
        const idx = pool.indexOf(p);
        if(idx >= 0){ pool.splice(idx, 1); return; }
        ok = false;
        const perto = pool.findIndex(h => lev(h, p) <= Math.max(1, Math.floor(p.length / 4)));
        if(perto >= 0) pool.splice(perto, 1); else quase = false;
      });
      return ok ? 'ok' : quase ? 'warn' : 'bad';
    });
    const nota = cores.reduce((s, c) => s + (c === 'ok' ? 1 : c === 'warn' ? 0.5 : 0), 0) / cores.length;
    return { cores: cores, nota: nota };
  }
  function gauge(nota){
    const ang = -90 + 180 * Math.max(0, Math.min(1, nota));
    return '<svg class="px-gauge" viewBox="0 0 120 70">' +
      '<path d="M10 60 A50 50 0 0 1 43 13" stroke="#FCABAF" stroke-width="10" fill="none"/>' +
      '<path d="M45 12 A50 50 0 0 1 76 12" stroke="#F0A224" stroke-width="10" fill="none"/>' +
      '<path d="M78 13 A50 50 0 0 1 110 60" stroke="#2E8B57" stroke-width="10" fill="none"/>' +
      '<g transform="rotate(' + ang + ' 60 60)"><line x1="60" y1="60" x2="60" y2="22" stroke="#3A1D10" stroke-width="4" stroke-linecap="round"/></g>' +
      '<circle cx="60" cy="60" r="7" fill="#3A1D10"/></svg>';
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
  function renderFala(item){
    item.completa = item.frase;
    const main = $('#pxMain');
    main.innerHTML = '<p class="px-instr">' + esc(S.cfg.instrucao || 'Escute e grave') + '</p>' +
      '<div class="px-scene"><div class="card">' + I('record_voice_over') + '</div><div class="wave"><span></span><span></span><span></span><span></span><span></span><span></span><span></span></div></div>' +
      '<div class="px-words" id="pxWords"></div>' +
      '<div id="pxGauge"></div><div class="px-heard" id="pxHeard"></div>' +
      (item.nota ? '<p class="px-note">' + I('lightbulb') + esc(item.nota) + '</p>' : '') +
      '<div id="pxCompare"></div>' +
      (SR ? '' : '<div class="px-ctx" style="margin-top:16px;">Seu navegador não reconhece a voz. Abra esta atividade no <b>Google Chrome</b> ou no <b>Edge</b> para gravar. Você pode ouvir e pular as frases.</div>');
    desenharFrase(item, null, false);
    acoesFala(item, false);
    setTimeout(() => falar(item.frase), 400);
  }
  function acoesFala(item, depois){
    on('ouvir', () => falar(item.frase));
    on('ouvirLento', () => falar(item.frase, 0.6));
    on('gravar', () => gravar(item));
    on('leitura', () => { S.cur.leitura = true; desenharFrase(item, S.cur.ultCores, false); });
    on('pular', () => { fecharItem('skip', { nota: S.cur.melhor || 0 }); avancar(); });
    on('traduzir', () => modalTraducao(item.frase, item.traducao));
    on('avancar', avancar);
    if(depois === 'ok'){
      acoes([{ id: 'traduzir', ic: I('translate'), label: 'Traduzir' }, { id: 'gravar', ic: I('mic'), label: 'Regravar' }, { id: 'avancar', ic: I('arrow_forward'), label: 'Avançar', cls: 'primary' }]);
    } else if(depois === 'retry'){
      const l = [{ id: 'traduzir', ic: I('translate'), label: 'Traduzir' }, { id: 'gravar', ic: I('mic'), label: 'Regravar', cls: 'rec' }];
      if(S.cur.falhas >= MAX_FALA_TRIES) l.push({ id: 'pular', ic: I('skip_next'), label: 'Pular' });
      acoes(l);
    } else {
      const l = [{ id: 'ouvir', ic: I('play_arrow'), label: 'Escutar' }, { id: 'gravar', ic: I('mic'), label: 'Gravar', cls: 'rec', disabled: !SR }, { id: 'leitura', ic: I('visibility'), label: 'Leitura' }];
      if(!SR) l.push({ id: 'pular', ic: I('skip_next'), label: 'Pular' });
      acoes(l);
    }
  }
  async function gravar(item){
    if(!SR || S.cur.gravando) return;
    if(window.speechSynthesis) speechSynthesis.cancel();
    S.cur.gravando = true;
    const btn = $('#pxAct_gravar');
    if(btn){
      btn.classList.add('rec', 'on');
      const i = btn.querySelector('.i'), t = btn.querySelector('.tag');
      if(i) i.innerHTML = I('stop'); if(t) t.textContent = 'Parar';
    }
    $('#pxHeard').textContent = 'Fale agora…';
    $('#pxMain').classList.add('gravando');
    // grava a própria voz em paralelo, pro "Compare sua pronúncia"
    let recorder = null, chunks = [], stream = null;
    try{
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      recorder = new MediaRecorder(stream); recorder.ondataavailable = e => chunks.push(e.data); recorder.start();
    }catch(e){ recorder = null; }
    const rec = new SR();
    rec.lang = 'en-US'; rec.interimResults = true; rec.maxAlternatives = 3; rec.continuous = false;
    let finais = [];
    rec.onresult = ev => {
      const r = ev.results[ev.results.length - 1];
      const alts = Array.from(r).map(a => a.transcript);
      if(r.isFinal) finais = alts;
      const parcial = avaliarFala(item, alts[0]);
      desenharFrase(item, parcial.cores.map(c => c === 'ok' ? 'ok' : null), false);
    };
    rec.onerror = ev => { if(ev.error === 'not-allowed') $('#pxHeard').textContent = 'Permita o uso do microfone no navegador para gravar.'; };
    rec.onend = () => {
      S.cur.gravando = false;
      $('#pxMain').classList.remove('gravando');
      if(recorder && recorder.state !== 'inactive'){ recorder.onstop = () => { S.cur.audioUrl = URL.createObjectURL(new Blob(chunks)); compare(item); }; recorder.stop(); }
      if(stream) stream.getTracks().forEach(t => t.stop());
      if(!finais.length){
        $('#pxHeard').textContent = 'Não consegui ouvir. Toque em Gravar e fale mais perto do microfone.';
        acoesFala(item, S.cur.tentativas.length ? 'retry' : false);
        return;
      }
      let best = null;
      finais.forEach(t => { const a = avaliarFala(item, t); if(!best || a.nota > best.nota) best = Object.assign(a, { texto: t }); });
      S.cur.tentativas.push(best.texto);
      S.cur.ultCores = best.cores;
      S.cur.melhor = Math.max(S.cur.melhor || 0, best.nota);
      $('#pxHeard').textContent = 'Ouvi: “' + best.texto + '”';
      desenharFrase(item, best.cores, true);
      $('#pxGauge').innerHTML = gauge(best.nota);
      if(best.nota >= PASS_FALA){
        if(!S.res[S.i]) fecharItem(S.cur.falhas === 0 && !S.cur.leitura ? 'ok' : 'warn', { nota: best.nota });
        else S.res[S.i].nota = Math.max(S.res[S.i].nota || 0, best.nota);
        banner('ok', 'Você foi muito bem!'); acoesFala(item, 'ok');
      } else {
        S.cur.falhas++;
        if(!S.res[S.i]) banner('warn', 'Vamos tentar melhorar? Ouça o original e regrave.');
        acoesFala(item, S.res[S.i] ? 'ok' : 'retry');
      }
    };
    try{ rec.start(); }catch(e){ S.cur.gravando = false; }
    on('gravar', () => { try{ rec.stop(); }catch(e){} });
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
        '<button class="px-btn">Começar ' + I('arrow_forward') + '</button>' +
      '</div>', 'cover');
    m.querySelector('button').onclick = () => { m.remove(); renderItem(); };
  }
  function sair(){
    const m = modal('<div class="px-m-kicker">Pausa</div><h2>Quer sair da atividade?</h2><div class="meta">O que você respondeu até agora não será salvo.</div>' +
      '<button class="px-btn" id="pxStay">Continuar praticando</button><button class="px-btn ghost" id="pxLeave">Sair do exercício</button>', 'small');
    m.querySelector('#pxStay').onclick = () => m.remove();
    m.querySelector('#pxLeave').onclick = () => { location.href = S.staff ? '/professora.html' : '/area-do-aluno.html#praticas'; };
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
    if(window.speechSynthesis) speechSynthesis.cancel();
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
      S.info = dysePraticaInfo(cfg.course, cfg.aula, cfg.num);
      const session = await dyseRequireAuth(); if(!session) return;
      const ok = await dyseRequirePraticaLiberada(cfg.course, cfg.aula, cfg.num); if(!ok) return;
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
      montarTopo();
      modalIntro();
    },
    sair: sair,
    _act(id){ if(HANDLERS[id]) HANDLERS[id](); },
    _img: clicarImagem, _sel: selecionar, _slot: porNoSlot, _unslot: tirarDoSlot,
    _ficar(url){ if(CONTAGEM) clearInterval(CONTAGEM); location.href = url; },
    _playEu(){ if(S.cur && S.cur.audioUrl) new Audio(S.cur.audioUrl).play(); },
    _playOrig(){ const it = S.cfg.itens[S.i]; falar(it.frase); }
  };
})();
