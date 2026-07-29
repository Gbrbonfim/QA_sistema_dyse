/* ======================================================================
   DYSE · Do You Speak English?
   Módulo central de autenticação e salvamento de progresso (Supabase)
   ----------------------------------------------------------------------
   Este é o ÚNICO arquivo onde você precisa colar a URL e a chave do seu
   projeto Supabase. Todas as páginas (login, área do aluno, atividades,
   painel da professora) usam este mesmo arquivo.
   ====================================================================== */

const SUPABASE_URL = "https://vnpjsjrqghttsagbssxx.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZucGpzanJxZ2h0dHNhZ2Jzc3h4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ4MjMzNzYsImV4cCI6MjEwMDM5OTM3Nn0.g_p_IgFbellbbeSP3MVA8kEKh7GdB3zne6x6fqW4avU";

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
async function dyseSaveResult(course, activityNum, activityTheme, reportText, meta){
  const session = await dyseGetSession();
  if(!session) return { error: 'not-authenticated' };
  const profile = await dyseGetProfile(session);
  const payload = {
    user_id: session.user.id,
    student_name: (profile && profile.full_name) || session.user.user_metadata?.full_name || session.user.email,
    student_email: session.user.email,
    course: course,
    activity_num: activityNum,
    activity_theme: activityTheme,
    report_text: reportText,
    meta: meta || {},
    updated_at: new Date().toISOString()
  };
  const { error } = await sb
    .from('activity_results')
    .upsert(payload, { onConflict: 'user_id,course,activity_num' });
  return { error };
}

/* ---------- Buscar resultado salvo de UMA atividade (para retomar) ---------- */
async function dyseLoadResult(course, activityNum){
  const session = await dyseGetSession();
  if(!session) return null;
  const { data, error } = await sb
    .from('activity_results')
    .select('*')
    .eq('user_id', session.user.id)
    .eq('course', course)
    .eq('activity_num', activityNum)
    .maybeSingle();
  if(error) return null;
  return data;
}

/* ---------- Listar TODOS os resultados do aluno logado (área do aluno) ----------
   Se "course" for informado, filtra só aquele curso; senão, traz todos. */
async function dyseListMyResults(course){
  const session = await dyseGetSession();
  if(!session) return [];
  let query = sb
    .from('activity_results')
    .select('course, activity_num, activity_theme, updated_at, meta')
    .eq('user_id', session.user.id);
  if(course) query = query.eq('course', course);
  const { data, error } = await query;
  return error ? [] : data;
}

/* ---------- [Professora] listar TODOS os resultados de TODOS os alunos ---------- */
async function dyseListAllResults(){
  const { data, error } = await sb
    .from('activity_results')
    .select('*')
    .order('student_name', { ascending: true })
    .order('course', { ascending: true })
    .order('activity_num', { ascending: true });
  return error ? [] : data;
}

/* ---------- Atividades liberadas (visíveis) por curso ----------
   Retorna um Set com os números das atividades marcadas como liberadas. */
async function dyseGetPublishedSet(course){
  const { data, error } = await sb
    .from('published_activities')
    .select('activity_num, is_published')
    .eq('course', course);
  if(error || !data) return new Set();
  return new Set(data.filter(r => r.is_published).map(r => r.activity_num));
}

/* ---------- [Professora] listar liberação de TODAS as atividades de um curso ----------
   Retorna um Map activity_num -> true/false (mesmo as nunca tocadas voltam como false). */
async function dyseGetPublishedMap(course){
  const { data, error } = await sb
    .from('published_activities')
    .select('activity_num, is_published')
    .eq('course', course);
  const map = {};
  if(!error && data) data.forEach(r => map[r.activity_num] = r.is_published);
  return map;
}

/* ---------- [Professora] liberar ou ocultar uma atividade ---------- */
async function dyseSetPublished(course, activityNum, isPublished){
  const { error } = await sb
    .from('published_activities')
    .upsert(
      { course, activity_num: activityNum, is_published: isPublished, updated_at: new Date().toISOString() },
      { onConflict: 'course,activity_num' }
    );
  return { error };
}

/* ---------- Bloqueia a página de atividade se ela não estiver liberada.
   Professoras sempre podem acessar (útil pra revisar/testar antes de liberar). */
async function dyseRequirePublished(course, activityNum){
  const session = await dyseGetSession();
  if(!session) return false;
  const profile = await dyseGetProfile(session);
  if(profile && profile.role === 'teacher') return true;

  const published = await dyseGetPublishedSet(course);
  if(!published.has(activityNum)){
    alert('Esta atividade ainda não foi liberada pela professora.');
    location.href = '/area-do-aluno.html';
    return false;
  }
  return true;
}
