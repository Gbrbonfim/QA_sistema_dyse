/* ======================================================================
   DYSE · Do You Speak English?
   Módulo central de autenticação e salvamento de progresso (Supabase)
   ----------------------------------------------------------------------
   Este é o ÚNICO arquivo onde você precisa colar a URL e a chave do seu
   projeto Supabase. Todas as páginas (login, área do aluno, atividades,
   painel da professora) usam este mesmo arquivo.
   ====================================================================== */

const SUPABASE_URL = "https://SEU-PROJETO.supabase.co";   // <-- 1) troque aqui
const SUPABASE_ANON_KEY = "SUA-CHAVE-ANON-PUBLICA-AQUI";   // <-- 2) troque aqui

/* Não altere daqui pra baixo. */

const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const TOTAL_ACTIVITIES = 16;

/* ---------- Sessão ---------- */
async function dyseGetSession(){
  const { data } = await sb.auth.getSession();
  return data.session;
}

async function dyseGetProfile(session){
  if(!session) return null;
  const { data } = await sb
    .from('profiles')
    .select('*')
    .eq('id', session.user.id)
    .maybeSingle();
  return data;
}

/* Bloqueia a página caso não haja login. Chame no topo de páginas
   protegidas (área do aluno, atividades, painel da professora). */
async function dyseRequireAuth(){
  const session = await dyseGetSession();
  if(!session){
    const next = encodeURIComponent(location.pathname + location.search);
    location.href = '/login.html?next=' + next;
    return null;
  }
  document.documentElement.classList.add('dyse-auth-ready');
  return session;
}

/* Bloqueia a página caso o usuário não seja professor(a). */
async function dyseRequireTeacher(){
  const session = await dyseRequireAuth();
  if(!session) return null;
  const profile = await dyseGetProfile(session);
  if(!profile || profile.role !== 'teacher'){
    alert('Esta página é exclusiva para professores.');
    location.href = '/area-do-aluno.html';
    return null;
  }
  return session;
}

async function dyseLogout(){
  await sb.auth.signOut();
  location.href = '/login.html';
}

/* ---------- Barra "Olá, Fulano · Sair" ---------- */
async function dyseRenderAuthBar(containerId){
  const el = document.getElementById(containerId);
  if(!el) return;
  const session = await dyseGetSession();
  if(!session) return;
  const meta = session.user.user_metadata || {};
  const name = meta.full_name || session.user.email;
  el.innerHTML =
    '<span class="dyse-auth-name">👤 ' + escapeHtml(name) + '</span>' +
    '<a href="/area-do-aluno.html" class="dyse-auth-link">Minhas atividades</a>' +
    '<button type="button" class="dyse-auth-logout" onclick="dyseLogout()">Sair</button>';
}

function escapeHtml(s){
  const d = document.createElement('div');
  d.textContent = s || '';
  return d.innerHTML;
}

/* ---------- Salvar resultado de uma atividade ---------- */
async function dyseSaveResult(activityNum, activityTheme, reportText, meta){
  const session = await dyseGetSession();
  if(!session) return { error: 'not-authenticated' };
  const profile = await dyseGetProfile(session);
  const payload = {
    user_id: session.user.id,
    student_name: (profile && profile.full_name) || session.user.user_metadata?.full_name || session.user.email,
    student_email: session.user.email,
    activity_num: activityNum,
    activity_theme: activityTheme,
    report_text: reportText,
    meta: meta || {},
    updated_at: new Date().toISOString()
  };
  const { error } = await sb
    .from('activity_results')
    .upsert(payload, { onConflict: 'user_id,activity_num' });
  return { error };
}

/* ---------- Buscar resultado salvo de UMA atividade (para retomar) ---------- */
async function dyseLoadResult(activityNum){
  const session = await dyseGetSession();
  if(!session) return null;
  const { data, error } = await sb
    .from('activity_results')
    .select('*')
    .eq('user_id', session.user.id)
    .eq('activity_num', activityNum)
    .maybeSingle();
  if(error) return null;
  return data;
}

/* ---------- Listar TODOS os resultados do aluno logado (área do aluno) ---------- */
async function dyseListMyResults(){
  const session = await dyseGetSession();
  if(!session) return [];
  const { data, error } = await sb
    .from('activity_results')
    .select('activity_num, activity_theme, updated_at, meta')
    .eq('user_id', session.user.id);
  return error ? [] : data;
}

/* ---------- [Professora] listar TODOS os resultados de TODOS os alunos ---------- */
async function dyseListAllResults(){
  const { data, error } = await sb
    .from('activity_results')
    .select('*')
    .order('student_name', { ascending: true })
    .order('activity_num', { ascending: true });
  return error ? [] : data;
}
