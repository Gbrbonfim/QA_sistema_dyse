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

/* Checagem de cargo tolerante a maiúsculas/espaços extras, caso o valor
   salvo no banco não esteja perfeitamente igual a "teacher". */
function dyseIsTeacher(profile){
  return !!(profile && String(profile.role || '').trim().toLowerCase() === 'teacher');
}

async function dyseGetProfile(session){
  if(!session) return null;
  try{
    const { data, error: selectError } = await sb
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .maybeSingle();

    console.log('%c[DYSE DEBUG] dyseGetProfile SELECT', 'color:#F0A224;font-weight:bold', { data, selectError });

    if(data) return data;

    // Autocorreção: se por qualquer motivo o perfil não existe ainda
    // (conta criada antes do gatilho existir, login social, criação manual
    // no painel do Supabase, falha pontual do gatilho, etc.), criamos aqui
    // mesmo, na hora. Assim o login nunca fica "travado" por falta de perfil.
    const fallbackName = session.user.user_metadata?.full_name || session.user.email;
    const { data: created, error: upsertError } = await sb
      .from('profiles')
      .upsert(
        { id: session.user.id, full_name: fallbackName, email: session.user.email }, // sem "role" aqui: se a linha já existir, não sobrescreve o role dela
        { onConflict: 'id', ignoreDuplicates: false }
      )
      .select('*')
      .maybeSingle();

    console.log('%c[DYSE DEBUG] dyseGetProfile FALLBACK UPSERT (SELECT não achou nada)', 'color:#EB6424;font-weight:bold', { created, upsertError });

    return created;
  }catch(e){
    console.error('%c[DYSE DEBUG] dyseGetProfile EXCEÇÃO', 'color:red;font-weight:bold', e);
    return null; // nunca deixa isso travar quem chamou — segue como se não tivesse perfil ainda
  }
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
  await dyseGetProfile(session); // garante que o perfil existe (autocorreção), em toda página protegida
  document.documentElement.classList.add('dyse-auth-ready');
  return session;
}

/* Bloqueia a página caso o usuário não seja professor(a). */
async function dyseRequireTeacher(){
  const session = await dyseRequireAuth();
  if(!session) return null;
  const profile = await dyseGetProfile(session);
  console.log('%c[DYSE DEBUG] dyseRequireTeacher', 'color:#D03B55;font-weight:bold', {
    userId: session.user.id,
    userEmail: session.user.email,
    profile: profile,
    'profile.role (raw)': profile ? JSON.stringify(profile.role) : '(perfil veio nulo)',
    isTeacher: dyseIsTeacher(profile)
  });
  if(!dyseIsTeacher(profile)){
    location.href = '/area-do-aluno.html?notice=not-teacher';
    return null;
  }
  return session;
}

/* Checagem de cargo "gestão" (admin), mesmo padrão tolerante do dyseIsTeacher. */
function dyseIsAdmin(profile){
  return !!(profile && String(profile.role || '').trim().toLowerCase() === 'admin');
}

/* Bloqueia a página caso o usuário não seja da gestão. */
async function dyseRequireAdmin(){
  const session = await dyseRequireAuth();
  if(!session) return null;
  const profile = await dyseGetProfile(session);
  if(!dyseIsAdmin(profile)){
    location.href = dyseIsTeacher(profile) ? '/professora.html?notice=not-admin' : '/area-do-aluno.html?notice=not-admin';
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
  if(dyseIsTeacher(profile) || dyseIsAdmin(profile)) return true;

  const published = await dyseGetPublishedSet(course);
  if(!published.has(activityNum)){
    location.href = '/area-do-aluno.html?notice=locked';
    return false;
  }
  return true;
}

/* ======================================================================
   GESTÃO — turmas, matérias e permissões (usado por /gestao.html e,
   pra leitura, também por /professora.html e /area-do-aluno.html)
   ====================================================================== */

/* ---------- Turmas ---------- */
async function dyseListTurmas(){
  const { data, error } = await sb.from('turmas').select('*').order('name', { ascending: true });
  return error ? [] : data;
}

async function dyseCreateTurma(name, description){
  const { data, error } = await sb.from('turmas').insert({ name, description }).select('*').maybeSingle();
  return { data, error };
}

async function dyseUpdateTurma(id, fields){
  const { error } = await sb.from('turmas').update(fields).eq('id', id);
  return { error };
}

async function dyseDeleteTurma(id){
  const { error } = await sb.from('turmas').delete().eq('id', id);
  return { error };
}

/* ---------- Matérias ---------- */
async function dyseListMaterias(){
  const { data, error } = await sb.from('materias').select('*').order('name', { ascending: true });
  return error ? [] : data;
}

async function dyseCreateMateria(slug, name, description){
  const { data, error } = await sb.from('materias').insert({ slug, name, description }).select('*').maybeSingle();
  return { data, error };
}

async function dyseDeleteMateria(slug){
  const { error } = await sb.from('materias').delete().eq('slug', slug);
  return { error };
}

/* ---------- Matérias liberadas por turma ---------- */
async function dyseListAllTurmaMaterias(){
  const { data, error } = await sb.from('turma_materias').select('*');
  return error ? [] : data;
}

async function dyseSetTurmaMateria(turmaId, materiaSlug, enabled){
  if(enabled){
    const { error } = await sb.from('turma_materias').insert({ turma_id: turmaId, materia_slug: materiaSlug });
    return { error };
  }
  const { error } = await sb.from('turma_materias').delete().eq('turma_id', turmaId).eq('materia_slug', materiaSlug);
  return { error };
}

/* ---------- Turmas permitidas por professor ---------- */
async function dyseListAllTeacherTurmas(){
  const { data, error } = await sb.from('teacher_turmas').select('*');
  return error ? [] : data;
}

/* Turmas do professor logado (sem argumento) — usado no painel da professora. */
async function dyseListMyTurmas(){
  const session = await dyseGetSession();
  if(!session) return [];
  const { data, error } = await sb.from('teacher_turmas').select('turma_id').eq('teacher_id', session.user.id);
  return error ? [] : data;
}

async function dyseSetTeacherTurma(teacherId, turmaId, enabled){
  if(enabled){
    const { error } = await sb.from('teacher_turmas').insert({ teacher_id: teacherId, turma_id: turmaId });
    return { error };
  }
  const { error } = await sb.from('teacher_turmas').delete().eq('teacher_id', teacherId).eq('turma_id', turmaId);
  return { error };
}

/* ---------- Perfis por papel (alunos / professoras) ---------- */
/* Comparação tolerante a maiúsculas/espaço extra (mesmo motivo do
   dyseIsTeacher/dyseIsAdmin): um ".eq('role', role)" exato deixaria de fora
   contas cujo "role" foi digitado com variação no Table Editor do Supabase. */
async function dyseListProfilesByRole(role){
  const { data, error } = await sb.from('profiles').select('*').order('full_name', { ascending: true });
  if(error || !data) return [];
  const target = String(role).trim().toLowerCase();
  return data.filter(p => String(p.role || '').trim().toLowerCase() === target);
}

async function dyseSetStudentTurma(studentId, turmaId){
  const { error } = await sb.from('profiles').update({ turma_id: turmaId }).eq('id', studentId);
  return { error };
}

/* ---------- Quais atividades de uma matéria a gestão libera pro professor ---------- */
async function dyseListMateriaActivities(materiaSlug){
  const { data, error } = await sb.from('materia_activities').select('*').eq('materia_slug', materiaSlug);
  return error ? [] : data;
}

async function dyseListAllMateriaActivities(){
  const { data, error } = await sb.from('materia_activities').select('*');
  return error ? [] : data;
}

async function dyseSetMateriaActivityReleased(materiaSlug, activityNum, released){
  const { error } = await sb
    .from('materia_activities')
    .upsert(
      { materia_slug: materiaSlug, activity_num: activityNum, released_to_teachers: released, updated_at: new Date().toISOString() },
      { onConflict: 'materia_slug,activity_num' }
    );
  return { error };
}