/* ======================================================================
   DYSE · Calendário Letivo (componente compartilhado)
   ----------------------------------------------------------------------
   O calendário não é mais uma página à parte: vira uma aba dentro de cada
   painel (Área do Aluno, Painel do professor, Painel da gestão).

     dyseMontarCalendario(elementoContainer, { canEdit: true|false })

   canEdit = true só para a gestão: clicar num dia abre o popover pra marcar
   feriado/recesso/etc., aparece o "Liberar/Despublicar" e o quadro de
   informações vira editável. Para alunos e professores é só leitura e,
   enquanto o ano não estiver liberado, mostra o aviso de "ainda não foi
   liberado". Depende das funções dyse*Calendario* de assets/dyse-auth.js.
   ====================================================================== */
(function(){
  const MESES = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
  const DOW = ['D','S','T','Q','Q','S','S'];
  const TIPOS = {
    feriado: 'Feriado',
    recesso: 'Recesso / férias',
    reposicao: 'Reposição de aulas',
    retorno_conversacao: 'Retorno das aulas de conversação',
    inicio_semestre: 'Início do semestre'
  };

  const CSS = `
.dyse-cal{
  --tipo-recesso:#EB6424; --tipo-feriado:#F0A224; --tipo-reposicao:#D03B55;
  --tipo-retorno_conversacao:#FCABAF; --tipo-inicio_semestre:#3A1D10;
  --ink-recesso:#D94E12; --ink-feriado:#C07E12; --ink-reposicao:#C42E48; --ink-retorno_conversacao:#D2637D;
}
.dyse-cal *, .dyse-cal-pop *{box-sizing:border-box;}
.dyse-cal .cal-toolbar{display:flex; align-items:center; gap:14px; flex-wrap:wrap; margin-bottom:22px;}
.dyse-cal .cal-toolbar .spacer{flex:1 1 auto;}
.dyse-cal select, .dyse-cal input[type=text], .dyse-cal-pop select, .dyse-cal-pop input{
  font-family:var(--font-body); font-size:.92rem; color:var(--seal);
  border:2px solid #eee0cf; border-radius:var(--radius-sm); padding:9px 12px; background:#fff;
}
.dyse-cal select:focus, .dyse-cal input:focus, .dyse-cal-pop select:focus, .dyse-cal-pop input:focus{outline:none; border-color:var(--amaranth);}
.dyse-cal .pub-pill{display:inline-flex; align-items:center; gap:8px; font-size:.82rem; font-weight:700; padding:7px 14px; border-radius:999px;}
.dyse-cal .pub-pill.on{background:#eaf7ee; color:var(--ok);}
.dyse-cal .pub-pill.off{background:#fbeceb; color:var(--bad);}
.dyse-cal .msg{font-size:.85rem; font-weight:600; margin-left:6px;}
.dyse-cal .msg.ok{color:var(--ok);} .dyse-cal .msg.bad{color:var(--bad);}
.dyse-cal .cal-layout{display:grid; grid-template-columns:230px 1fr; gap:20px; align-items:start;}
@media (max-width:1000px){ .dyse-cal .cal-layout{grid-template-columns:1fr;} }
.dyse-cal .side-card{background:#fff; border-radius:var(--radius-md); box-shadow:var(--shadow-card); padding:20px; margin-bottom:20px;}
.dyse-cal .side-card h3{margin:0 0 14px; font-size:1rem; color:var(--seal);}
.dyse-cal .legend-row{display:flex; align-items:center; gap:10px; margin-bottom:10px; font-size:.85rem;}
.dyse-cal .legend-dot{width:16px; height:16px; border-radius:5px; flex:none;}
.dyse-cal .info-row{display:flex; flex-direction:column; gap:2px; margin-bottom:12px;}
.dyse-cal .info-row label{font-size:.72rem; font-weight:700; letter-spacing:.04em; text-transform:uppercase; color:var(--seal-soft);}
.dyse-cal .info-row .val{font-size:.95rem; font-weight:600;}
.dyse-cal .info-row input{width:100%;}
.dyse-cal .info-note{font-size:.76rem; color:var(--seal-soft); opacity:.8; margin-top:6px;}
.dyse-cal .months-grid{display:grid; grid-template-columns:repeat(4, minmax(0,1fr)); gap:26px 24px;}
@media (max-width:1400px){ .dyse-cal .months-grid{grid-template-columns:repeat(3, minmax(0,1fr));} }
@media (max-width:1000px){ .dyse-cal .months-grid{grid-template-columns:repeat(2, minmax(0,1fr));} }
@media (max-width:560px){ .dyse-cal .months-grid{grid-template-columns:1fr;} }
.dyse-cal .cal-panel{background:#fff; border-radius:var(--radius-md); box-shadow:var(--shadow-card); padding:22px 20px;}
.dyse-cal .month{background:transparent; max-width:210px; width:100%; margin-inline:auto;}
.dyse-cal .month h4{margin:0 0 6px; text-align:center; font-size:.7rem; font-weight:800; letter-spacing:.16em; text-transform:uppercase; color:var(--seal);}
.dyse-cal .dow{display:grid; grid-template-columns:repeat(7,1fr);}
.dyse-cal .dow span{text-align:center; font-size:.54rem; font-weight:700; color:var(--amaranth); padding:2px 0;}
.dyse-cal .dow span:first-child, .dyse-cal .dow span:last-child{background:#fdf2f4;}
.dyse-cal .days{display:grid; grid-template-columns:repeat(7,1fr);}
.dyse-cal .cal-day{aspect-ratio:1/1; display:flex; align-items:center; justify-content:center; position:relative;
  border:none; background:transparent; font-family:var(--font-body); font-size:.64rem; font-weight:500; color:var(--seal); border-radius:0; padding:0;}
.dyse-cal .days > .cal-day:not(.empty):nth-child(7n+1), .dyse-cal .days > .cal-day:not(.empty):nth-child(7n){background:#fdf2f4;}
.dyse-cal .cal-day.empty{visibility:hidden;}
.dyse-cal button.cal-day{cursor:pointer;}
.dyse-cal button.cal-day:hover{outline:2px solid var(--amaranth); outline-offset:-2px; z-index:1;}
.dyse-cal .cal-day.tipo-recesso{color:var(--ink-recesso); font-weight:800;}
.dyse-cal .cal-day.tipo-feriado{color:var(--ink-feriado); font-weight:800;}
.dyse-cal .cal-day.tipo-reposicao{color:var(--ink-reposicao); font-weight:800;}
.dyse-cal .cal-day.tipo-retorno_conversacao{color:var(--ink-retorno_conversacao); font-weight:800;}
.dyse-cal .cal-day.tipo-inicio_semestre{background:var(--tipo-inicio_semestre); color:#fff; font-weight:800; border-radius:4px;}
.dyse-cal .cal-day.today{outline:1.5px dashed var(--amaranth); outline-offset:-2px;}
.dyse-cal .cal-day.has-note::after{content:"*"; position:absolute; top:0; right:2px; font-size:.6rem; line-height:1;}
.dyse-cal .month-notes{margin-top:6px; font-size:.58rem; color:var(--seal-soft); line-height:1.45;}
.dyse-cal .month-notes div{margin-bottom:1px;}
.dyse-cal .locked-box{background:#fff; border-radius:var(--radius-md); box-shadow:var(--shadow-card); padding:40px 28px; text-align:center; color:var(--seal-soft);}
.dyse-cal .locked-box strong{display:block; font-size:1.05rem; color:var(--seal); margin-bottom:6px;}
.dyse-cal-pop{position:fixed; z-index:9000; width:250px; background:#fff; border-radius:var(--radius-md);
  box-shadow:0 18px 44px rgba(58,29,16,0.28); padding:16px; display:none; font-family:var(--font-body); color:var(--seal);}
.dyse-cal-pop.open{display:block;}
.dyse-cal-pop h5{margin:0 0 10px; font-size:.9rem; color:var(--seal);}
.dyse-cal-pop label{display:block; font-size:.72rem; font-weight:700; text-transform:uppercase; letter-spacing:.04em; color:var(--seal-soft); margin:10px 0 3px;}
.dyse-cal-pop select, .dyse-cal-pop input{width:100%;}
.dyse-cal-pop-actions{display:flex; gap:8px; margin-top:14px; flex-wrap:wrap;}
.dyse-cal-pop-actions .btn{padding:8px 12px; font-size:.82rem;}
.dyse-cal-backdrop{position:fixed; inset:0; z-index:8999; display:none;}
/* Navegação mês a mês: só no celular (no computador aparece o ano inteiro). */
.dyse-cal .mes-nav{display:none;}
@media (max-width:760px){
  .dyse-cal .cal-toolbar{gap:10px; margin-bottom:16px;}
  .dyse-cal .cal-layout{display:flex; flex-direction:column; align-items:stretch; gap:14px;}
  /* Ordem no celular: legenda (só texto) → calendário → informações. */
  .dyse-cal .cal-side{display:contents;}
  .dyse-cal .legend-card{order:0; background:none; box-shadow:none; padding:0; margin:0; display:flex; flex-wrap:wrap; gap:6px 14px;}
  .dyse-cal .legend-card h3{display:none;}
  .dyse-cal .legend-card .legend-row{margin:0; gap:6px; font-size:.78rem; color:var(--seal-soft);}
  .dyse-cal .legend-card .legend-dot{width:10px; height:10px; border-radius:50%;}
  .dyse-cal .cal-layout > .cal-panel{order:1;}
  .dyse-cal .info-card{order:2; margin-bottom:0;}
  .dyse-cal .cal-panel{padding:14px 14px 18px;}
  .dyse-cal .mes-nav{display:flex; align-items:center; justify-content:space-between; gap:8px; margin-bottom:12px;}
  .dyse-cal .mes-nav b{font-size:1.05rem; font-weight:700; color:var(--seal); text-align:center; flex:1;}
  .dyse-cal .mes-nav button{width:44px; height:44px; border-radius:50%; border:2px solid #eee0cf; background:#fff; color:var(--amaranth); display:inline-flex; align-items:center; justify-content:center; cursor:pointer; -webkit-tap-highlight-color:transparent;}
  .dyse-cal .mes-nav button:active{background:#fdf2f4;}
  .dyse-cal .mes-nav button:disabled{opacity:.35; cursor:default;}
  .dyse-cal .mes-nav svg{width:22px; height:22px;}
  .dyse-cal .months-grid{display:block;}
  .dyse-cal .months-grid .month{display:none; max-width:none;}
  .dyse-cal .months-grid .month.atual{display:block;}
  .dyse-cal .month h4{display:none;}
  .dyse-cal .dow span{font-size:.72rem; padding:6px 0;}
  .dyse-cal .cal-day{font-size:.95rem; border-radius:10px;}
  .dyse-cal .cal-day.today{outline:none; background:var(--amaranth) !important; color:#fff; font-weight:800;}
  .dyse-cal .month-notes{font-size:.8rem; margin-top:12px; padding-top:10px; border-top:1px dashed #eee0cf;}
}
.dyse-cal-backdrop.open{display:block;}
.dyse-cal .cal-print{display:none;}
.dyse-cal .print-wrap{position:relative;}
.dyse-cal .print-menu{position:absolute; right:0; top:calc(100% + 6px); z-index:50; min-width:250px; background:#fff; border-radius:14px;
  box-shadow:0 12px 32px rgba(58,29,16,.18); padding:6px;}
.dyse-cal .print-menu[hidden]{display:none;}
.dyse-cal .print-menu button{display:flex; align-items:center; gap:12px; width:100%; min-height:48px; padding:10px 12px; border:none; background:none;
  border-radius:10px; text-align:left; cursor:pointer; color:var(--seal, #3A1D10); font:inherit;}
.dyse-cal .print-menu button:hover, .dyse-cal .print-menu button:focus-visible{background:#FFF3E6; outline:none;}
.dyse-cal .print-menu .msr{font-size:22px; color:var(--amaranth, #D03B55); flex:none;}
.dyse-cal .print-menu b{display:block; font-size:.9rem; font-weight:600;}
.dyse-cal .print-menu small{display:block; font-size:.75rem; opacity:.7;}
#dyseCalPrintRoot{display:none;}
/* Impressão: uma cópia solta no <body> (sem a altura travada da tela), pra
   o calendário completo poder ocupar quantas páginas precisar. */
@media print{
  html.dyse-cal-printing, html.dyse-cal-printing body{height:auto !important; overflow:visible !important; background:#fff !important;}
  html.dyse-cal-printing body > *:not(#dyseCalPrintRoot){display:none !important;}
  html.dyse-cal-printing #dyseCalPrintRoot{display:block !important; color:#3A1D10; font-family:'Poppins', Arial, sans-serif;}
  #dyseCalPrintRoot *{-webkit-print-color-adjust:exact; print-color-adjust:exact;}
  #dyseCalPrintRoot .p-titulo{font-size:16pt; font-weight:700; margin:0 0 12pt;}

  /* Calendário completo: os 12 meses em grade (também no celular) */
  #dyseCalPrintRoot .legend-card{display:flex !important; flex-wrap:wrap; gap:4pt 14pt; background:none; box-shadow:none; padding:0; margin:0 0 12pt;}
  #dyseCalPrintRoot .legend-card h3{display:none;}
  #dyseCalPrintRoot .legend-row{margin:0; font-size:9pt;}
  #dyseCalPrintRoot .months-grid{display:grid !important; grid-template-columns:repeat(3,1fr) !important; gap:12pt 16pt;}
  #dyseCalPrintRoot .months-grid .month{display:block !important; max-width:none; page-break-inside:avoid; break-inside:avoid;}
  #dyseCalPrintRoot .month h4{display:block !important;}
  #dyseCalPrintRoot .cal-day.today{background:none !important; color:inherit !important; outline:none !important; font-weight:inherit;}
  #dyseCalPrintRoot .month-notes{font-size:8pt;}

  /* Lista do mês */
  #dyseCalPrintRoot .cal-print{display:block; color:#000;}
  .dyse-cal .cal-print h2{font-size:16pt; font-weight:600; margin:0 0 14pt;}
  .dyse-cal .cal-print table{width:100%; border-collapse:collapse; font-size:11pt;}
  .dyse-cal .cal-print th{text-align:left; font-weight:600; border-bottom:1.5pt solid #000; padding:6pt 8pt 6pt 0;}
  .dyse-cal .cal-print td{border-bottom:.5pt solid #bbb; padding:7pt 8pt 7pt 0; vertical-align:top;}
  .dyse-cal .cal-print .p-data{white-space:nowrap; width:1%;}
  .dyse-cal .cal-print .p-tipo{white-space:nowrap; width:1%; padding-right:16pt;}
  .dyse-cal .cal-print tr{page-break-inside:avoid;}
}`;

  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const pad = n => n < 10 ? '0' + n : '' + n;
  const iso = (y, m, d) => y + '-' + pad(m + 1) + '-' + pad(d);
  const hojeIso = () => { const t = new Date(); return iso(t.getFullYear(), t.getMonth(), t.getDate()); };

  function injetarCss(){
    if(document.getElementById('dyseCalCss')) return;
    const st = document.createElement('style');
    st.id = 'dyseCalCss';
    st.textContent = CSS;
    document.head.appendChild(st);
  }

  window.dyseMontarCalendario = function(container, opts){
    if(!container || container.dataset.calMontado) return;
    container.dataset.calMontado = '1';
    injetarCss();
    const canEdit = !!(opts && opts.canEdit);
    // mes = mês em destaque no celular (começa no mês atual).
    const st = { ano: new Date().getFullYear(), mes: new Date().getMonth(), config: null, dias: {}, popDate: null };

    container.classList.add('dyse-cal');
    container.innerHTML =
      '<div class="cal-toolbar">' +
        '<label style="font-weight:700; font-size:.85rem;">Ano letivo</label>' +
        '<select data-cal="ano"></select>' +
        '<span data-cal="pub"></span>' +
        '<span data-cal="msg" class="msg"></span>' +
        '<span class="spacer"></span>' +
        '<div class="print-wrap">' +
          '<button type="button" class="btn btn-ghost" data-cal="print" aria-haspopup="menu" aria-expanded="false">Imprimir</button>' +
          '<div class="print-menu" data-cal="printMenu" role="menu" hidden>' +
            '<button type="button" role="menuitem" data-modo="lista"><span class="msr" aria-hidden="true">format_list_bulleted</span><span><b>Lista do mês</b><small>Só os apontamentos do mês aberto</small></span></button>' +
            '<button type="button" role="menuitem" data-modo="ano"><span class="msr" aria-hidden="true">calendar_month</span><span><b>Calendário completo</b><small>Os 12 meses do ano</small></span></button>' +
          '</div>' +
        '</div>' +
      '</div>' +
      '<div data-cal="body"><p style="opacity:.6;">Carregando...</p></div>';
    const $ = k => container.querySelector('[data-cal="' + k + '"]');

    // popover de edição (só gestão) — fica no <body> pra não ser cortado
    let pop = null, backdrop = null;
    if(canEdit){
      backdrop = document.createElement('div');
      backdrop.className = 'dyse-cal-backdrop';
      pop = document.createElement('div');
      pop.className = 'dyse-cal-pop';
      pop.innerHTML =
        '<h5 data-pop="titulo">Dia</h5>' +
        '<label>Tipo</label><select data-pop="tipo"><option value="">— nenhum (dia normal) —</option>' +
          Object.keys(TIPOS).map(t => '<option value="' + t + '">' + TIPOS[t] + '</option>').join('') + '</select>' +
        '<label>Texto (opcional)</label><input type="text" data-pop="texto" placeholder="ex: Carnaval, Tiradentes...">' +
        '<label>Repetir até (opcional)</label><input type="date" data-pop="ate">' +
        '<div class="dyse-cal-pop-actions">' +
          '<button type="button" class="btn btn-primary" data-pop="salvar">Salvar</button>' +
          '<button type="button" class="btn btn-ghost" data-pop="limpar">Limpar dia</button>' +
          '<button type="button" class="btn btn-ghost" data-pop="cancelar">Cancelar</button>' +
        '</div>';
      document.body.appendChild(backdrop);
      document.body.appendChild(pop);
      backdrop.addEventListener('click', fecharPop);
      pop.querySelector('[data-pop="cancelar"]').addEventListener('click', fecharPop);
      pop.querySelector('[data-pop="salvar"]').addEventListener('click', salvarDia);
      pop.querySelector('[data-pop="limpar"]').addEventListener('click', limparDia);
    }
    const P = k => pop.querySelector('[data-pop="' + k + '"]');

    function flash(texto, ok){
      const el = $('msg');
      el.textContent = texto;
      el.className = 'msg ' + (ok ? 'ok' : 'bad');
      if(texto) setTimeout(() => { if(el.textContent === texto){ el.textContent = ''; el.className = 'msg'; } }, 4000);
    }

    function montarAnos(){
      const atual = new Date().getFullYear();
      const anos = [];
      for(let y = atual - 1; y <= atual + 2; y++) anos.push(y);
      $('ano').innerHTML = anos.map(y => '<option value="' + y + '"' + (y === st.ano ? ' selected' : '') + '>' + y + '</option>').join('');
    }

    async function carregarAno(){
      const ano = st.ano;
      try{
        if(canEdit) await dyseEnsureCalendarioAno(ano);
        const [config, dias] = await Promise.all([dyseGetCalendarioConfig(ano), dyseListCalendarioDias(ano)]);
        if(ano !== st.ano) return; // trocou de ano no meio do caminho
        st.config = config;
        st.dias = {};
        (dias || []).forEach(d => { st.dias[d.data] = { tipo: d.tipo, titulo: d.titulo || '' }; });
      }catch(e){
        console.error('Calendário:', e);
      }
      render();
    }

    function pubHtml(){
      if(!canEdit) return '';
      const on = st.config && st.config.publicado;
      return '<span class="pub-pill ' + (on ? 'on' : 'off') + '">' + (on ? '● Liberado para alunos e professores' : '○ Não liberado (só a gestão vê)') + '</span>' +
        '<button type="button" class="btn ' + (on ? 'btn-ghost' : 'btn-primary') + '" style="padding:8px 14px; margin-left:8px;" data-cal="toggle">' +
          (on ? 'Despublicar' : 'Liberar ' + st.ano) + '</button>';
    }

    function render(){
      $('pub').innerHTML = pubHtml();
      const tg = $('toggle'); if(tg) tg.addEventListener('click', togglePublicado);
      const body = $('body');
      if(!canEdit && (!st.config || !st.config.publicado)){
        body.innerHTML = '<div class="locked-box"><strong>Calendário de ' + st.ano + ' ainda não foi liberado</strong>' +
          'Assim que a gestão publicar, ele aparece aqui.</div>';
        return;
      }
      body.innerHTML =
        '<div class="cal-layout">' +
          '<div class="cal-side">' + legendaHtml() + infoHtml() + '</div>' +
          '<div class="cal-panel">' + mesNavHtml() + '<div class="months-grid">' + MESES.map((_, m) => mesHtml(m)).join('') + '</div></div>' +
        '</div>';
      ligarMesNav();
      if(canEdit){
        body.querySelectorAll('button.cal-day[data-date]').forEach(b => b.addEventListener('click', ev => abrirPop(ev, b.dataset.date)));
        const salvar = body.querySelector('[data-cal="salvarInfo"]');
        if(salvar) salvar.addEventListener('click', salvarInfo);
      }
    }

    /* ---------- Celular: um mês por vez, com setas e arrastar pro lado ---------- */
    const SETA_ESQ = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="15 18 9 12 15 6"/></svg>';
    const SETA_DIR = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="9 18 15 12 9 6"/></svg>';
    function anosDisponiveis(){ return Array.from($('ano').options).map(o => parseInt(o.value, 10)); }
    function mesNavHtml(){
      return '<div class="mes-nav">' +
        '<button type="button" data-cal="mesPrev" aria-label="Mês anterior">' + SETA_ESQ + '</button>' +
        '<b data-cal="mesTitulo" aria-live="polite"></b>' +
        '<button type="button" data-cal="mesNext" aria-label="Próximo mês">' + SETA_DIR + '</button>' +
      '</div>';
    }
    function mostrarMes(){
      container.querySelectorAll('.months-grid .month').forEach((el, i) => el.classList.toggle('atual', i === st.mes));
      const t = $('mesTitulo'); if(t) t.textContent = MESES[st.mes] + ' ' + st.ano;
      const anos = anosDisponiveis();
      const prev = $('mesPrev'), next = $('mesNext');
      if(prev) prev.disabled = st.mes === 0 && st.ano <= Math.min.apply(null, anos);
      if(next) next.disabled = st.mes === 11 && st.ano >= Math.max.apply(null, anos);
    }
    function irMes(delta){
      let m = st.mes + delta, ano = st.ano;
      if(m < 0){ m = 11; ano--; } else if(m > 11){ m = 0; ano++; }
      if(ano !== st.ano){
        if(anosDisponiveis().indexOf(ano) < 0) return; // fora dos anos da lista
        st.mes = m;
        st.ano = ano;
        $('ano').value = String(ano);
        $('body').innerHTML = '<p style="opacity:.6;">Carregando...</p>';
        carregarAno();
        return;
      }
      st.mes = m;
      mostrarMes();
    }
    function ligarMesNav(){
      const prev = $('mesPrev'), next = $('mesNext');
      if(prev) prev.addEventListener('click', () => irMes(-1));
      if(next) next.addEventListener('click', () => irMes(1));
      // arrastar o dedo pro lado também troca de mês
      const grid = container.querySelector('.months-grid');
      let x0 = null, y0 = null;
      if(grid){
        grid.addEventListener('touchstart', e => { x0 = e.touches[0].clientX; y0 = e.touches[0].clientY; }, { passive: true });
        grid.addEventListener('touchend', e => {
          if(x0 === null) return;
          const dx = e.changedTouches[0].clientX - x0, dy = e.changedTouches[0].clientY - y0;
          x0 = null;
          if(Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) irMes(dx < 0 ? 1 : -1);
        }, { passive: true });
      }
      mostrarMes();
    }

    function legendaHtml(){
      return '<div class="side-card legend-card"><h3>Legenda</h3>' + Object.keys(TIPOS).map(t =>
        '<div class="legend-row"><span class="legend-dot" style="background:var(--tipo-' + t + ');"></span>' + TIPOS[t] + '</div>').join('') + '</div>';
    }

    function infoHtml(){
      const c = st.config || {};
      const campos = [['inicio_ano','Início do ano letivo'],['fim_ano','Término do ano letivo'],['total_dias_letivos','Total de dias letivos'],
        ['total_semanas_letivas','Total de semanas letivas'],['observacao','Observação']];
      if(canEdit){
        return '<div class="side-card info-card"><h3>Informações importantes</h3>' +
          campos.map(([k, l]) => '<div class="info-row"><label>' + l + '</label><input type="text" data-info="' + k + '" value="' + esc(c[k] || '') + '"></div>').join('') +
          '<button type="button" class="btn btn-primary" style="width:100%; margin-top:6px;" data-cal="salvarInfo">Salvar informações</button>' +
          '<div class="info-note">Este quadro é preenchido à mão. As datas marcadas nos meses não recalculam esses totais automaticamente.</div></div>';
      }
      const linhas = campos.filter(([k]) => c[k]);
      if(!linhas.length) return '';
      return '<div class="side-card info-card"><h3>Informações importantes</h3>' +
        linhas.map(([k, l]) => '<div class="info-row"><label>' + l + '</label><span class="val">' + esc(c[k]) + '</span></div>').join('') + '</div>';
    }

    function mesHtml(m){
      const ano = st.ano, primeiro = new Date(ano, m, 1).getDay(), nDias = new Date(ano, m + 1, 0).getDate(), hoje = hojeIso();
      let cells = '';
      for(let i = 0; i < primeiro; i++) cells += '<div class="cal-day empty"></div>';
      for(let d = 1; d <= nDias; d++){
        const key = iso(ano, m, d), mark = st.dias[key], cls = ['cal-day'];
        if(mark){ cls.push('marked', 'tipo-' + mark.tipo); if(mark.titulo) cls.push('has-note'); }
        if(key === hoje) cls.push('today');
        const tag = canEdit ? 'button' : 'div';
        const title = mark ? ' title="' + esc(mark.titulo || TIPOS[mark.tipo]) + '"' : '';
        cells += '<' + tag + (canEdit ? ' type="button"' : '') + ' class="' + cls.join(' ') + '" data-date="' + key + '"' + title + '>' + d + '</' + tag + '>';
      }
      // notas: agrupa dias consecutivos com mesmo tipo+texto ("4 a 31 — recesso")
      const notas = []; let run = null;
      const flush = () => {
        if(!run) return;
        notas.push('<div>' + (run.ini === run.fim ? run.ini : run.ini + ' a ' + run.fim) + ' — ' + esc(run.titulo || TIPOS[run.tipo]) + '</div>');
        run = null;
      };
      for(let d = 1; d <= nDias; d++){
        const mk = st.dias[iso(ano, m, d)];
        if(mk && run && mk.tipo === run.tipo && (mk.titulo || '') === run.titulo){ run.fim = d; continue; }
        flush();
        if(mk) run = { tipo: mk.tipo, titulo: mk.titulo || '', ini: d, fim: d };
      }
      flush();
      return '<div class="month"><h4>' + MESES[m] + '</h4>' +
        '<div class="dow">' + DOW.map(x => '<span>' + x + '</span>').join('') + '</div>' +
        '<div class="days">' + cells + '</div>' +
        (notas.length ? '<div class="month-notes">' + notas.join('') + '</div>' : '') + '</div>';
    }

    async function togglePublicado(){
      const novo = !(st.config && st.config.publicado);
      if(novo && !confirm('Liberar o calendário de ' + st.ano + ' para todos os alunos e professores?')) return;
      const { error } = await dyseSetCalendarioPublicado(st.ano, novo);
      if(error){ flash('Erro: ' + error.message, false); return; }
      st.config = await dyseGetCalendarioConfig(st.ano);
      render();
      flash(novo ? 'Calendário liberado.' : 'Calendário despublicado.', true);
    }

    async function salvarInfo(){
      const campos = {};
      container.querySelectorAll('[data-info]').forEach(i => { campos[i.dataset.info] = i.value.trim(); });
      const { error } = await dyseSaveCalendarioConfig(st.ano, campos);
      if(error){ flash('Erro: ' + error.message, false); return; }
      st.config = await dyseGetCalendarioConfig(st.ano);
      flash('Informações salvas.', true);
    }

    function abrirPop(evt, key){
      st.popDate = key;
      const [y, mo, d] = key.split('-');
      P('titulo').textContent = 'Dia ' + d + '/' + mo + '/' + y;
      const mark = st.dias[key] || { tipo: '', titulo: '' };
      P('tipo').value = mark.tipo || '';
      P('texto').value = mark.titulo || '';
      P('ate').value = '';
      P('ate').min = key;
      P('ate').max = st.ano + '-12-31';
      backdrop.classList.add('open');
      pop.classList.add('open');
      const r = evt.currentTarget.getBoundingClientRect();
      const vw = document.documentElement.clientWidth, vh = document.documentElement.clientHeight;
      const popH = pop.offsetHeight || 320;
      let left = Math.max(8, Math.min(r.left, vw - 262));
      let top = r.bottom + 6;
      if(top + popH > vh - 8) top = Math.max(8, r.top - popH - 6);
      pop.style.left = left + 'px';
      pop.style.top = top + 'px';
    }

    function fecharPop(){
      if(!pop) return;
      pop.classList.remove('open');
      backdrop.classList.remove('open');
      st.popDate = null;
    }

    async function salvarDia(){
      if(!st.popDate) return;
      const tipo = P('tipo').value, titulo = P('texto').value.trim();
      let ate = P('ate').value;
      if(ate && ate > st.ano + '-12-31') ate = st.ano + '-12-31';
      if(!tipo){ flash('Escolha um tipo (ou use "Limpar dia").', false); return; }
      const { error } = (ate && ate > st.popDate)
        ? await dyseSetCalendarioIntervalo(st.ano, st.popDate, ate, tipo, titulo)
        : await dyseSetCalendarioDia(st.ano, st.popDate, tipo, titulo);
      if(error){ flash('Erro: ' + error.message, false); return; }
      fecharPop();
      await carregarAno();
      flash('Dia marcado.', true);
    }

    async function limparDia(){
      if(!st.popDate) return;
      const { error } = await dyseSetCalendarioDia(st.ano, st.popDate, null, null);
      if(error){ flash('Erro: ' + error.message, false); return; }
      fecharPop();
      await carregarAno();
      flash('Marcação removida.', true);
    }

    $('ano').addEventListener('change', () => {
      st.ano = parseInt($('ano').value, 10);
      st.mes = st.ano === new Date().getFullYear() ? new Date().getMonth() : 0;
      $('body').innerHTML = '<p style="opacity:.6;">Carregando...</p>';
      carregarAno();
    });
    /* ---------- Impressão: lista simples com os apontamentos do mês aberto ---------- */
    const DIAS_SEMANA = ['dom','seg','ter','qua','qui','sex','sáb'];
    function listaImpressaoHtml(){
      const ano = st.ano, m = st.mes, nDias = new Date(ano, m + 1, 0).getDate();
      const dt = d => pad(d) + '/' + pad(m + 1) + ' (' + DIAS_SEMANA[new Date(ano, m, d).getDay()] + ')';
      const itens = []; let run = null;
      const flush = () => {
        if(!run) return;
        const tipo = TIPOS[run.tipo] || '';
        const texto = run.titulo && run.titulo !== tipo ? run.titulo : '';
        itens.push('<tr><td class="p-data">' + (run.ini === run.fim ? dt(run.ini) : dt(run.ini) + ' a ' + dt(run.fim)) + '</td>' +
          '<td class="p-tipo">' + esc(tipo) + '</td><td>' + esc(texto) + '</td></tr>');
        run = null;
      };
      for(let d = 1; d <= nDias; d++){
        const mk = st.dias[iso(ano, m, d)];
        if(mk && run && mk.tipo === run.tipo && (mk.titulo || '') === run.titulo){ run.fim = d; continue; }
        flush();
        if(mk) run = { tipo: mk.tipo, titulo: mk.titulo || '', ini: d, fim: d };
      }
      flush();
      return '<h2>' + MESES[m] + ' ' + ano + '</h2>' +
        (itens.length
          ? '<table><thead><tr><th>Data</th><th>Tipo</th><th>Descrição</th></tr></thead><tbody>' + itens.join('') + '</tbody></table>'
          : '<p>Nenhum apontamento neste mês.</p>');
    }
    // modo: 'lista' (apontamentos do mês aberto) ou 'ano' (os 12 meses em grade)
    let modoEscolhido = null, tituloOriginal = null;
    function prepararImpressao(){
      // só quando o calendário está na tela (as outras abas imprimem normal)
      if(!container.offsetParent || !container.querySelector('.months-grid')) return;
      const modo = modoEscolhido || 'lista';   // Ctrl+P do navegador = lista
      const titulo = 'Calendário Letivo DYSE ' + st.ano;
      let root = document.getElementById('dyseCalPrintRoot');
      if(!root){ root = document.createElement('div'); root.id = 'dyseCalPrintRoot'; document.body.appendChild(root); }
      root.className = 'dyse-cal';
      root.innerHTML = '<h1 class="p-titulo">' + titulo + '</h1>' + (modo === 'lista'
        ? '<div class="cal-print">' + listaImpressaoHtml() + '</div>'
        : legendaHtml() + '<div class="months-grid">' + MESES.map((_, m) => mesHtml(m)).join('') + '</div>');
      document.documentElement.classList.add('dyse-cal-printing');
      // o título da aba vira o cabeçalho da impressão e o nome do PDF
      if(tituloOriginal === null){ tituloOriginal = document.title; document.title = titulo; }
    }
    function limparImpressao(){
      modoEscolhido = null;
      document.documentElement.classList.remove('dyse-cal-printing');
      if(tituloOriginal !== null){ document.title = tituloOriginal; tituloOriginal = null; }
    }
    window.addEventListener('beforeprint', prepararImpressao);
    window.addEventListener('afterprint', limparImpressao);

    const menu = $('printMenu');
    const abrirMenu = abrir => { menu.hidden = !abrir; $('print').setAttribute('aria-expanded', abrir ? 'true' : 'false'); };
    $('print').addEventListener('click', ev => { ev.stopPropagation(); abrirMenu(menu.hidden); });
    document.addEventListener('click', ev => { if(!menu.hidden && !menu.contains(ev.target)) abrirMenu(false); });
    document.addEventListener('keydown', ev => { if(ev.key === 'Escape') abrirMenu(false); });
    menu.querySelectorAll('[data-modo]').forEach(b => b.addEventListener('click', () => {
      abrirMenu(false);
      modoEscolhido = b.dataset.modo;
      prepararImpressao();
      window.print();
      setTimeout(limparImpressao, 500);
    }));

    montarAnos();
    carregarAno();
  };
})();
