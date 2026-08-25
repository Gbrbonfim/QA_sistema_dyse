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

/* ---------- "Lembrar de mim" ----------
   Por padrão o supabase-js guarda a sessão em localStorage (sobrevive
   fechar o navegador). O checkbox "Lembrar de mim" do login troca isso: se
   desmarcado, a sessão vai pra sessionStorage (some ao fechar a aba/
   navegador, mas continua valendo enquanto a pessoa navega pelo site
   normalmente). A preferência em si (dyse-lembrar) sempre fica em
   localStorage — é só uma flag, não é dado sensível, e precisa estar
   disponível antes mesmo de existir sessão pra decidir onde ler/gravar.
   Como cada página estática recria o cliente do zero ao carregar
   assets/dyse-auth.js, a escolha feita no login vale pra navegação inteira
   até o próximo login. */
function dyseSetLembrarDeMim(lembrar){
  localStorage.setItem('dyse-lembrar', lembrar ? '1' : '0');
}
function dyseAuthStorage(){
  const lembrar = localStorage.getItem('dyse-lembrar') !== '0'; // padrão: lembrar
  return lembrar ? window.localStorage : window.sessionStorage;
}

const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: {
      getItem: (key) => dyseAuthStorage().getItem(key),
      setItem: (key, value) => dyseAuthStorage().setItem(key, value),
      removeItem: (key) => dyseAuthStorage().removeItem(key)
    }
  }
});

const TOTAL_ACTIVITIES = 16;

/* ---------- Sessão ---------- */
async function dyseGetSession(){
  const { data } = await sb.auth.getSession();
  return data.session;
}

/* Checagem de cargo tolerante a maiúsculas/espaços extras, caso o valor
   salvo no banco não esteja perfeitamente igual a "teacher". Também vale
   pra quem tem o flag "also_teacher" (ex: um admin que também dá aula —
   ver comentário em supabase-schema.sql, coluna profiles.also_teacher). */
function dyseIsTeacher(profile){
  return !!(profile && (String(profile.role || '').trim().toLowerCase() === 'teacher' || profile.also_teacher === true));
}

/* Mesmo critério, espelhado pro flag "also_student" (ver comentário na
   coluna profiles.also_student, supabase-schema.sql): quem NÃO é "student"
   de role mas também faz atividades como aluno(a) precisa aparecer nas
   listas de aluno (gestão → aba Alunos, chamada, vínculo financeiro, turma
   do professor) igual a qualquer aluno de verdade. */
function dyseIsStudent(profile){
  return !!(profile && (String(profile.role || '').trim().toLowerCase() === 'student' || profile.also_student === true));
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

/* Checagem de cargo "gestão" (admin), mesmo padrão tolerante do dyseIsTeacher.
   "financeiro" é um papel ACIMA de admin (ver supabase-schema.sql, seção
   1.1): quem é "financeiro" também conta como admin pra tudo que não é o
   módulo financeiro em si (turmas/matérias/alunos/professores). */
function dyseIsAdmin(profile){
  const role = profile ? String(profile.role || '').trim().toLowerCase() : '';
  return role === 'admin' || role === 'financeiro';
}

/* Checagem estrita do papel "financeiro" — ao contrário de dyseIsAdmin(),
   NÃO inclui "admin" comum. Usada só pra decidir se mostra a aba
   Financeiro/colunas financeiras em gestao.html; a trava de verdade é a
   RLS (is_financeiro() no banco), isto aqui é só pra não exibir uma tela
   que vai dar erro de permissão pra quem não pode ver. */
function dyseIsFinanceiro(profile){
  return !!(profile && String(profile.role || '').trim().toLowerCase() === 'financeiro');
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

/* ---------- Reenviar acesso (aluno ou professor) ----------
   Mesmo fluxo de "esqueci minha senha" do Supabase — funciona tanto pra
   quem nunca definiu senha (convite ainda não aceito) quanto pra quem já
   tem conta ativa e perdeu o acesso. Usa a chave anônima (sem precisar de
   service_role nem de função serverless) porque reenviar/recuperar acesso
   por e-mail é uma operação pública por natureza (é o mesmo "esqueci minha
   senha" que qualquer usuário poderia acionar sozinho em /login.html). */
async function dyseReenviarAcesso(email){
  const { error } = await sb.auth.resetPasswordForEmail(email, {
    redirectTo: window.location.origin + '/definir-senha.html'
  });
  return { error };
}

/* ---------- Barra "Olá, Fulano · Sair" ---------- */
async function dyseRenderAuthBar(containerId){
  const el = document.getElementById(containerId);
  if(!el) return;
  const session = await dyseGetSession();
  if(!session) return;
  const meta = session.user.user_metadata || {};
  const name = meta.full_name || session.user.email;
  const profile = await dyseGetProfile(session);

  // Quem acumula papéis (ex: admin que também dá aula, via also_teacher; ou
  // financeiro/admin/teacher que também é aluno, via also_student) ganha um
  // link pra cada painel que tem direito, em vez de só um link fixo — sem
  // isso não haveria como alcançar /professora.html ou /area-do-aluno.html
  // a partir de /gestao.html (ou vice-versa) pela interface.
  const alsoStudent = !!(profile && profile.also_student);
  const links = [];
  if(dyseIsAdmin(profile)) links.push('<a href="/gestao.html" class="dyse-auth-link">Painel da gestão</a>');
  if(dyseIsTeacher(profile)) links.push('<a href="/professora.html" class="dyse-auth-link">Painel da professora</a>');
  if(!links.length || alsoStudent) links.push('<a href="/area-do-aluno.html" class="dyse-auth-link">Minhas atividades</a>');

  el.innerHTML =
    '<span class="dyse-auth-name">👤 ' + escapeHtml(name) + '</span>' +
    links.join('') +
    '<button type="button" class="dyse-auth-logout" onclick="dyseLogout()">Sair</button>';
}

function escapeHtml(s){
  const d = document.createElement('div');
  d.textContent = s || '';
  return d.innerHTML;
}

/* ---------- Salvar resultado de uma atividade ----------
   "aula" é opcional (default 1) — o TOEFL nunca passa esse argumento e
   continua gravando exatamente como antes (todas as linhas dele já ficam
   com aula=1 desde a migration da seção 15 do schema). */
async function dyseSaveResult(course, activityNum, activityTheme, reportText, meta, aula = 1){
  const session = await dyseGetSession();
  if(!session) return { error: 'not-authenticated' };
  const profile = await dyseGetProfile(session);
  const payload = {
    user_id: session.user.id,
    student_name: (profile && profile.full_name) || session.user.user_metadata?.full_name || session.user.email,
    student_email: session.user.email,
    course: course,
    aula: aula,
    activity_num: activityNum,
    activity_theme: activityTheme,
    report_text: reportText,
    meta: meta || {},
    status: 'concluida',
    updated_at: new Date().toISOString()
  };
  const { error } = await sb
    .from('activity_results')
    .upsert(payload, { onConflict: 'user_id,course,aula,activity_num' });
  return { error };
}

/* ---------- Salvar progresso PARCIAL (autosave), sem marcar como concluída ----------
   Faz upsert preservando "status" como 'em_andamento' — usado por atividades
   com autosave contínuo (ex: seções que salvam sozinhas antes do aluno
   clicar em "Concluir"). Nunca sobrescreve um status 'concluida'/'pulada'
   já gravado (ex: reabrir uma atividade já concluída pra revisar não deve
   "voltar" o estado dela pra em_andamento). */
async function dyseAutosaveParcial(course, activityNum, activityTheme, reportText, meta, aula = 1){
  const existing = await dyseLoadResult(course, activityNum, aula);
  if(existing && (existing.status === 'concluida' || existing.status === 'pulada')) return { error: null };
  const session = await dyseGetSession();
  if(!session) return { error: 'not-authenticated' };
  const profile = await dyseGetProfile(session);
  const payload = {
    user_id: session.user.id,
    student_name: (profile && profile.full_name) || session.user.user_metadata?.full_name || session.user.email,
    student_email: session.user.email,
    course: course,
    aula: aula,
    activity_num: activityNum,
    activity_theme: activityTheme,
    report_text: reportText,
    meta: meta || {},
    status: 'em_andamento',
    updated_at: new Date().toISOString()
  };
  const { error } = await sb
    .from('activity_results')
    .upsert(payload, { onConflict: 'user_id,course,aula,activity_num' });
  return { error };
}

/* ---------- Pular atividade ----------
   Grava status='pulada' SEM apagar report_text/meta já existentes — por
   isso é um UPDATE parcial quando já existe linha (nunca um upsert do
   payload inteiro), e só insere uma linha mínima quando não existia nada
   ainda. Passa pela trigger "enforce_activity_published" do banco (seção
   15.4 do schema): pular uma atividade bloqueada é rejeitado igual a
   concluir uma. */
async function dyseSkipActivity(course, activityNum, aula = 1){
  const session = await dyseGetSession();
  if(!session) return { error: 'not-authenticated' };
  const { data: existing } = await sb
    .from('activity_results')
    .select('id')
    .eq('user_id', session.user.id).eq('course', course).eq('aula', aula).eq('activity_num', activityNum)
    .maybeSingle();
  if(existing){
    const { error } = await sb
      .from('activity_results')
      .update({ status: 'pulada', skipped_at: new Date().toISOString(), updated_at: new Date().toISOString() })
      .eq('id', existing.id);
    return { error };
  }
  const profile = await dyseGetProfile(session);
  const { error } = await sb.from('activity_results').insert({
    user_id: session.user.id,
    student_name: (profile && profile.full_name) || session.user.user_metadata?.full_name || session.user.email,
    student_email: session.user.email,
    course: course,
    aula: aula,
    activity_num: activityNum,
    status: 'pulada',
    skipped_at: new Date().toISOString(),
    meta: {}
  });
  return { error };
}

/* ---------- Buscar resultado salvo de UMA atividade (para retomar) ---------- */
async function dyseLoadResult(course, activityNum, aula = 1){
  const session = await dyseGetSession();
  if(!session) return null;
  const { data, error } = await sb
    .from('activity_results')
    .select('*')
    .eq('user_id', session.user.id)
    .eq('course', course)
    .eq('aula', aula)
    .eq('activity_num', activityNum)
    .maybeSingle();
  if(error) return null;
  return data;
}

/* ---------- Listar TODOS os resultados do aluno logado (área do aluno) ----------
   Se "course" for informado, filtra só aquele curso; se "aula" também for
   informado, filtra também por aula (senão traz todas as aulas do curso). */
async function dyseListMyResults(course, aula){
  const session = await dyseGetSession();
  if(!session) return [];
  let query = sb
    .from('activity_results')
    .select('course, aula, activity_num, activity_theme, status, updated_at, meta')
    .eq('user_id', session.user.id);
  if(course) query = query.eq('course', course);
  if(aula !== undefined && aula !== null) query = query.eq('aula', aula);
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

/* ---------- Atividades liberadas (visíveis) por curso+aula ----------
   Retorna um Set com os números das atividades marcadas como liberadas.
   "aula" default 1 — o TOEFL (sem conceito de aula) nunca passa esse
   argumento e continua funcionando exatamente como antes. */
async function dyseGetPublishedSet(course, aula = 1){
  const { data, error } = await sb
    .from('published_activities')
    .select('activity_num, is_published')
    .eq('course', course)
    .eq('aula', aula);
  if(error || !data) return new Set();
  return new Set(data.filter(r => r.is_published).map(r => r.activity_num));
}

/* ---------- [Professora] listar liberação de TODAS as atividades de uma aula de um curso ----------
   Retorna um Map activity_num -> true/false (mesmo as nunca tocadas voltam como false). */
async function dyseGetPublishedMap(course, aula = 1){
  const { data, error } = await sb
    .from('published_activities')
    .select('activity_num, is_published')
    .eq('course', course)
    .eq('aula', aula);
  const map = {};
  if(!error && data) data.forEach(r => map[r.activity_num] = r.is_published);
  return map;
}

/* ---------- [Professora] liberar ou ocultar uma atividade ---------- */
async function dyseSetPublished(course, activityNum, isPublished, aula = 1){
  const { error } = await sb
    .from('published_activities')
    .upsert(
      { course, aula, activity_num: activityNum, is_published: isPublished, updated_at: new Date().toISOString() },
      { onConflict: 'course,aula,activity_num' }
    );
  return { error };
}

/* ---------- Bloqueia a página de atividade se ela não estiver liberada.
   Professoras sempre podem acessar (útil pra revisar/testar antes de liberar). */
async function dyseRequirePublished(course, activityNum, aula = 1){
  const session = await dyseGetSession();
  if(!session) return false;
  const profile = await dyseGetProfile(session);
  if(dyseIsTeacher(profile) || dyseIsAdmin(profile)) return true;

  const published = await dyseGetPublishedSet(course, aula);
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

async function dyseCreateTurma(name, description, capacidade, diasSemana, horario){
  const { data, error } = await sb.from('turmas').insert({
    name, description, capacidade: capacidade || null,
    dias_semana: diasSemana || [], horario: horario || null
  }).select('*').maybeSingle();
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
   contas cujo "role" foi digitado com variação no Table Editor do Supabase.
   Pedir role='teacher' também traz quem tem role diferente (ex: "admin")
   mas o flag also_teacher=true — mesmo critério de dyseIsTeacher(), pra
   essas contas aparecerem nas listas de professor (turmas, vínculo
   financeiro etc.) igual a qualquer outra professora. */
async function dyseListProfilesByRole(role){
  const { data, error } = await sb.from('profiles').select('*').order('full_name', { ascending: true });
  if(error || !data) return [];
  const target = String(role).trim().toLowerCase();
  return data.filter(p => {
    if(target === 'teacher') return dyseIsTeacher(p);
    if(target === 'student') return dyseIsStudent(p);
    return String(p.role || '').trim().toLowerCase() === target;
  });
}

/* ---------- Contas (quem não é "student" puro: admin/financeiro/teacher) ----------
   Tela "Contas" em gestao.html — deixa a gestão marcar also_teacher/also_student
   e vincular turma pra essas contas, tudo pela tela (antes só dava pelo Table
   Editor do Supabase, ver seção final de supabase-schema.sql). */
async function dyseListGestaoAccounts(){
  const { data, error } = await sb.from('profiles').select('*').order('full_name', { ascending: true });
  if(error || !data) return [];
  return data.filter(p => String(p.role || '').trim().toLowerCase() !== 'student');
}

async function dyseSetAlsoTeacher(profileId, value){
  const { error } = await sb.from('profiles').update({ also_teacher: !!value }).eq('id', profileId);
  return { error };
}

async function dyseSetAlsoStudent(profileId, value){
  const { error } = await sb.from('profiles').update({ also_student: !!value }).eq('id', profileId);
  return { error };
}

async function dyseSetStudentTurma(studentId, turmaId){
  const { error } = await sb.from('profiles').update({ turma_id: turmaId }).eq('id', studentId);
  return { error };
}

/* ---------- Quais atividades de uma matéria a gestão libera pro professor ----------
   Sem "aula", traz todas as aulas da matéria de uma vez (útil pra montar o
   accordion inteiro com uma query só). */
async function dyseListMateriaActivities(materiaSlug, aula){
  let query = sb.from('materia_activities').select('*').eq('materia_slug', materiaSlug);
  if(aula !== undefined && aula !== null) query = query.eq('aula', aula);
  const { data, error } = await query;
  return error ? [] : data;
}

async function dyseListAllMateriaActivities(){
  const { data, error } = await sb.from('materia_activities').select('*');
  return error ? [] : data;
}

async function dyseSetMateriaActivityReleased(materiaSlug, activityNum, released, aula = 1){
  const { error } = await sb
    .from('materia_activities')
    .upsert(
      { materia_slug: materiaSlug, aula, activity_num: activityNum, released_to_teachers: released, updated_at: new Date().toISOString() },
      { onConflict: 'materia_slug,aula,activity_num' }
    );
  return { error };
}

/* ---------- Catálogo de cursos (professora.html + area-do-aluno.html) ----------
   Fonte única pras duas telas — antes cada uma tinha seu próprio array
   "COURSES" hardcoded (e podiam divergir). "nivel_aulas" já tem a lista
   real de aulas por matéria (numero/topico); o nome/descrição do curso em
   si (que não muda por aula, não faz sentido morar no banco linha a linha)
   fica num manifesto mínimo aqui do lado do código. */
const DYSE_COURSE_META = {
  toefl: { name: 'TOEFL iBT', description: 'Reading, Listening, Writing, Speaking e Grammar no novo formato do exame.' },
  a1:    { name: 'A1 · Atividades Complementares', description: 'Atividades complementares por aula do curso A1.' }
};
async function dyseListCourseCatalog(){
  const { data, error } = await sb.from('nivel_aulas').select('materia_slug, numero, topico').eq('ativo', true).order('numero', { ascending: true });
  if(error || !data) return [];
  const bySlug = {};
  data.forEach(row => {
    if(!DYSE_COURSE_META[row.materia_slug]) return; // só matérias que também são "curso de atividades" (TOEFL, A1...)
    (bySlug[row.materia_slug] = bySlug[row.materia_slug] || []).push({ numero: row.numero, topico: row.topico });
  });
  return Object.keys(bySlug).map(slug => ({
    id: slug,
    name: DYSE_COURSE_META[slug].name,
    description: DYSE_COURSE_META[slug].description,
    aulas: bySlug[slug]
  }));
}

/* ---------- [Gestão] adicionar uma nova aula a qualquer matéria com currículo ----------
   Usado pelo botão "+ Adicionar aula" no modal de Material (gestao.html) —
   genérico, funciona pra A1, TOEFL ou qualquer matéria futura. */
async function dyseCreateNivelAula(materiaSlug, numero, topico, materialUrl){
  const { data, error } = await sb
    .from('nivel_aulas')
    .insert({ materia_slug: materiaSlug, numero: numero, topico: topico, material_url: materialUrl || null })
    .select('*')
    .maybeSingle();
  return { data, error };
}

/* ======================================================================
   FINANCEIRO — modalidades/valores, vínculo financeiro do aluno,
   mensalidades, pagamentos, gastos e fechamento mensal.
   Usado por /gestao.html (visão completa) e /professora.html (só os
   próprios dados — a RLS já restringe, mas filtramos aqui também).
   ====================================================================== */

/* ---------- Utilitários de data ---------- */
/* Mês de competência sempre como "YYYY-MM-01" — chave padrão usada em
   todas as tabelas financeiras. */
function dyseMesCompetencia(d){
  const date = d ? new Date(d) : new Date();
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  return y + '-' + m + '-01';
}

/* "new Date()" sem argumento aqui é proposital (não é string ISO sendo
   reinterpretada) — mas toISOString() converte pra UTC, o que troca a data
   errado à noite (fusos atrás de UTC, como o Brasil) perto da virada do dia.
   Usa os getters locais em vez disso, pra "hoje" bater com o calendário
   local do usuário. */
function dyseHoje(){
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return y + '-' + m + '-' + day;
}

/* Último dia (YYYY-MM-DD) do mês de competência informado (sempre "YYYY-MM-01").
   Construído só com Date.UTC/getUTC*, nunca misturando uma string ISO
   "parseada como UTC" com getters/setters que leem em horário local — essa
   mistura é o erro clássico que fazia esta conta "voltar" pro dia 1 em fusos
   atrás de UTC (Brasil incluído), cortando fora qualquer aluno cujo período
   não começasse exatamente no dia 1. */
function dyseFimDoMes(mes){
  const [y, m] = mes.split('-').map(Number);
  const proximoMes = m === 12 ? 1 : m + 1;
  const anoProximo = m === 12 ? y + 1 : y;
  const ultimoDia = new Date(Date.UTC(anoProximo, proximoMes - 1, 0)).getUTCDate();
  return y + '-' + String(m).padStart(2,'0') + '-' + String(ultimoDia).padStart(2,'0');
}

/* Último mês de competência (YYYY-MM-01) coberto pela quantidade de
   parcelas de um período do histórico financeiro. Ex: data_inicio em
   agosto/2026 com 6 parcelas cobre até janeiro/2027 (ago,set,out,nov,dez,jan)
   — fevereiro em diante não gera mais mensalidade pra esse período. Sem
   quantidade_parcelas definida, o período não tem prazo (retorna null). */
function dyseUltimoMesPago(historicoRow){
  if(!historicoRow.quantidade_parcelas) return null;
  const [y, m] = historicoRow.data_inicio.split('-').map(Number);
  const idx = (m - 1) + (Number(historicoRow.quantidade_parcelas) - 1);
  const ano = y + Math.floor(idx / 12);
  const mesNum = (idx % 12) + 1;
  return ano + '-' + String(mesNum).padStart(2,'0') + '-01';
}

/* ---------- Modalidades (catálogo) ---------- */
async function dyseListModalidades(){
  const { data, error } = await sb.from('modalidades').select('*').order('name', { ascending: true });
  return error ? [] : data;
}

async function dyseCreateModalidade(slug, name, isCustomValue){
  const { data, error } = await sb
    .from('modalidades')
    .insert({ slug, name, is_custom_value: !!isCustomValue })
    .select('*')
    .maybeSingle();
  return { data, error };
}

async function dyseUpdateModalidade(id, fields){
  const { error } = await sb.from('modalidades').update(fields).eq('id', id);
  return { error };
}

/* ---------- Valores pagos ao professor por modalidade (histórico versionado) ----------
   Sem "modalidadeId", traz o histórico de todas as modalidades. */
async function dyseListModalidadeValores(modalidadeId){
  let query = sb.from('modalidade_valores').select('*').order('vigente_desde', { ascending: false });
  if(modalidadeId) query = query.eq('modalidade_id', modalidadeId);
  const { data, error } = await query;
  return error ? [] : data;
}

/* Insere uma NOVA versão do valor — nunca sobrescreve uma já existente,
   preservando o cálculo dos meses anteriores. */
async function dyseSetModalidadeValor(modalidadeId, valorProfessor, vigenteDesde){
  const session = await dyseGetSession();
  const { data, error } = await sb
    .from('modalidade_valores')
    .insert({
      modalidade_id: modalidadeId,
      valor_professor: valorProfessor,
      vigente_desde: vigenteDesde || dyseMesCompetencia(),
      criado_por: session ? session.user.id : null
    })
    .select('*')
    .maybeSingle();
  return { data, error };
}

/* Valor vigente de uma modalidade num mês: a linha de "vigente_desde" mais
   recente que seja <= o mês informado. */
function dyseValorVigente(valoresDaModalidade, mesCompetencia){
  const alvo = mesCompetencia || dyseMesCompetencia();
  const candidatos = (valoresDaModalidade || [])
    .filter(v => v.vigente_desde <= alvo)
    .sort((a, b) => b.vigente_desde.localeCompare(a.vigente_desde));
  return candidatos.length ? Number(candidatos[0].valor_professor) : null;
}

/* ---------- Vínculo financeiro aluno↔professor↔modalidade (histórico por período) ----------
   Sem "alunoId", traz o histórico de todos os alunos. */
async function dyseListAlunoFinanceiroHistorico(alunoId){
  // Ordena por data_inicio e, em caso de empate (mais de uma edição no mesmo
  // dia — comum em testes), por "id" como critério de desempate: garante que
  // a edição mais recente sempre "ganha" de forma determinística, em vez de
  // depender da ordem que o banco devolve linhas com data_inicio igual.
  let query = sb.from('aluno_financeiro_historico').select('*').order('data_inicio', { ascending: false }).order('id', { ascending: false });
  if(alunoId) query = query.eq('aluno_id', alunoId);
  const { data, error } = await query;
  return error ? [] : data;
}

/* Período aberto (data_fim nula) de um aluno dentro de um histórico já carregado. */
function dyseFindPeriodoAberto(historicoDoAluno){
  return (historicoDoAluno || []).find(h => !h.data_fim) || null;
}

/* Cria/edita o vínculo financeiro do aluno. Trocar professor ou modalidade
   fecha o período aberto atual (data_fim = ontem) e abre um novo a partir
   de hoje — preserva o histórico. Editar valor/situação/data de início/
   parcelas/observação no período aberto atual atualiza a própria linha,
   sem gerar uma versão nova a cada pequena edição. */
async function dyseSetAlunoFinanceiro(alunoId, campos){
  const session = await dyseGetSession();
  const userId = session ? session.user.id : null;
  const historico = await dyseListAlunoFinanceiroHistorico(alunoId);
  const aberto = dyseFindPeriodoAberto(historico);

  const professorNovo = campos.professor_id || null;
  const mudouVinculo = aberto && (
    (aberto.professor_id || null) !== professorNovo ||
    aberto.modalidade_id !== campos.modalidade_id
  );

  if(aberto && !mudouVinculo){
    const { error } = await sb
      .from('aluno_financeiro_historico')
      .update({
        valor_mensal_aluno: campos.valor_mensal_aluno,
        valor_professor_customizado: campos.valor_professor_customizado ?? null,
        situacao: campos.situacao,
        data_inicio: campos.data_inicio || aberto.data_inicio,
        quantidade_parcelas: campos.quantidade_parcelas ?? null,
        observacao: campos.observacao || null
      })
      .eq('id', aberto.id);
    return { error };
  }

  if(aberto && mudouVinculo){
    const ontem = new Date();
    ontem.setDate(ontem.getDate() - 1);
    const { error: closeError } = await sb
      .from('aluno_financeiro_historico')
      .update({ data_fim: ontem.toISOString().slice(0, 10) })
      .eq('id', aberto.id);
    if(closeError) return { error: closeError };
  }

  const { data, error } = await sb
    .from('aluno_financeiro_historico')
    .insert({
      aluno_id: alunoId,
      professor_id: professorNovo,
      modalidade_id: campos.modalidade_id,
      valor_mensal_aluno: campos.valor_mensal_aluno,
      valor_professor_customizado: campos.valor_professor_customizado ?? null,
      situacao: campos.situacao || 'ativo',
      data_inicio: campos.data_inicio || dyseHoje(),
      quantidade_parcelas: campos.quantidade_parcelas ?? null,
      observacao: campos.observacao || null,
      criado_por: userId
    })
    .select('*')
    .maybeSingle();
  return { data, error };
}

/* ---------- Mensalidades (razão mensal por aluno) ---------- */
async function dyseMesFechado(mes){
  const { data, error } = await sb.from('fechamentos_mensais').select('fechado_em').eq('mes_competencia', mes).maybeSingle();
  if(error || !data) return false;
  return !!data.fechado_em;
}

/* Gera/atualiza as mensalidades do mês a partir do histórico financeiro dos
   alunos e dos valores de modalidade vigentes naquele mês. Não faz nada se
   o mês já estiver fechado (preserva o congelamento). Só alunos com
   situação "ativo" no período geram mensalidade.

   Quando mais de um período do histórico toca o mesmo mês (troca de
   professor no meio do mês), o valor é RATEADO entre os professores
   envolvidos, proporcional a quantas aulas cada um deu ao aluno naquele
   mês — contado via o módulo de presença (turma_sessoes/sessao_presencas,
   usando a turma ATUAL do aluno: profiles.turma_id não é historizado, então
   isso assume que a troca de turma acontece junto com a troca de professor
   financeiro). Sem presença lançada ainda (mês futuro, chamada não feita),
   cai no comportamento antigo: o período de "data_inicio" mais recente leva
   o mês inteiro — garante que a geração nunca fica vazia. */
async function dyseGerarMensalidadesDoMes(mes){
  if(await dyseMesFechado(mes)) return { skipped: true };

  const [historico, modalidades, valores, alunos] = await Promise.all([
    dyseListAlunoFinanceiroHistorico(),
    dyseListModalidades(),
    dyseListModalidadeValores(),
    dyseListProfilesByRole('student')
  ]);

  const modalidadeById = {};
  modalidades.forEach(m => { modalidadeById[m.id] = m; });
  const valoresPorModalidade = {};
  valores.forEach(v => {
    (valoresPorModalidade[v.modalidade_id] = valoresPorModalidade[v.modalidade_id] || []).push(v);
  });
  const nomeAlunoById = {};
  alunos.forEach(a => { nomeAlunoById[a.id] = a.full_name || a.email || ''; });

  const fimDoMesStr = dyseFimDoMes(mes);

  function valorProfessorDoPeriodo(h){
    const modalidade = modalidadeById[h.modalidade_id];
    return (modalidade && modalidade.is_custom_value)
      ? Number(h.valor_professor_customizado || 0)
      : (dyseValorVigente(valoresPorModalidade[h.modalidade_id], mes) || 0);
  }

  // Agrupa TODOS os períodos elegíveis (ativo + dentro das parcelas
  // contratadas) que tocam o mês, por aluno — não só um "vencedor". Como
  // dyseListAlunoFinanceiroHistorico já ordena por data_inicio desc/id desc,
  // cada array de períodos já sai com o mais recente primeiro.
  const periodosPorAluno = {};
  historico.forEach(h => {
    if(h.data_inicio > fimDoMesStr) return;
    if(h.data_fim && h.data_fim < mes) return;
    if(h.situacao !== 'ativo') return;
    const ultimoMesPago = dyseUltimoMesPago(h);
    if(ultimoMesPago && mes > ultimoMesPago) return; // fora das parcelas contratadas
    (periodosPorAluno[h.aluno_id] = periodosPorAluno[h.aluno_id] || []).push(h);
  });

  // Cache por execução: sessões de aula do mês em QUALQUER turma — o rateio
  // precisa enxergar aulas fora da turma cadastrada no perfil da aluna,
  // porque a troca de professor no meio do mês pode vir acompanhada de
  // troca de turma também (cada professora dá aula pra ela numa turma
  // diferente, não necessariamente a mesma turma com professora nova).
  // Buscada uma única vez, sob demanda (só quando algum aluno realmente
  // precisa de rateio neste mês).
  let sessoesDoMesCache = null;
  async function sessoesDoMes(){
    if(sessoesDoMesCache === null) sessoesDoMesCache = await dyseListSessoesDoMes(mes, fimDoMesStr);
    return sessoesDoMesCache;
  }

  const linhas = [];
  for(const alunoId of Object.keys(periodosPorAluno)){
    const periodos = periodosPorAluno[alunoId];
    const nomeAluno = nomeAlunoById[alunoId] || null;

    if(periodos.length === 1){
      const h = periodos[0];
      linhas.push({
        aluno_id: alunoId, aluno_nome: nomeAluno, mes_competencia: mes,
        professor_id: h.professor_id, modalidade_id: h.modalidade_id,
        valor_recebido: Number(h.valor_mensal_aluno || 0),
        valor_pago_professor: valorProfessorDoPeriodo(h),
        atualizado_em: new Date().toISOString()
      });
      continue;
    }

    // Mais de um período tocando o mês (troca de professor no meio do mês).
    const vencedor = periodos[0]; // mais recente — usado no fallback e como referência de valor_mensal_aluno
    let contagemPorProfessor = null; // Map professor_id(ou null) -> nº de presenças

    {
      const sessoes = await sessoesDoMes();
      // Só conta aulas de professores que fazem parte do vínculo financeiro
      // deste aluno no mês — uma aula dada por um substituto sem vínculo
      // financeiro não deve gerar pagamento a ele. Não restringe por turma:
      // cada professora entitulada pode ter dado aula pra este aluno numa
      // turma diferente (ver comentário em sessoesDoMes, acima).
      const professoresEntitulados = new Set(periodos.map(h => h.professor_id || null));
      const professorPorSessao = {};
      sessoes.forEach(s => { professorPorSessao[s.id] = s.professor_id || null; });
      const sessoesEntituladasIds = sessoes.filter(s => professoresEntitulados.has(s.professor_id || null)).map(s => s.id);
      if(sessoesEntituladasIds.length){
        const presencas = await dyseListPresencasAluno(alunoId, sessoesEntituladasIds);
        if(presencas.length){
          contagemPorProfessor = new Map();
          presencas.forEach(p => {
            const prof = professorPorSessao[p.sessao_id];
            contagemPorProfessor.set(prof, (contagemPorProfessor.get(prof) || 0) + 1);
          });
        }
      }
    }

    if(!contagemPorProfessor || !contagemPorProfessor.size){
      // Fallback: sem turma atual, ou zero presença lançada no mês —
      // o período mais recente leva o mês inteiro (comportamento antigo).
      linhas.push({
        aluno_id: alunoId, aluno_nome: nomeAluno, mes_competencia: mes,
        professor_id: vencedor.professor_id, modalidade_id: vencedor.modalidade_id,
        valor_recebido: Number(vencedor.valor_mensal_aluno || 0),
        valor_pago_professor: valorProfessorDoPeriodo(vencedor),
        atualizado_em: new Date().toISOString()
      });
      continue;
    }

    // Rateio proporcional às presenças. valor_recebido é uma "panela" única
    // (o aluno paga UMA mensalidade) — divide em centavos exatos entre as
    // linhas, sobra pro último item (ordem determinística por professor_id).
    // valor_pago_professor NÃO é panela compartilhada: cada professor tem
    // sua própria taxa (pode ter modalidade/valor diferente), multiplicada
    // pela PRÓPRIA fração de aulas.
    const totalContagem = [...contagemPorProfessor.values()].reduce((s, n) => s + n, 0);
    const totalCentavos = Math.round(Number(vencedor.valor_mensal_aluno || 0) * 100);
    const entradas = [...contagemPorProfessor.entries()].sort((a, b) => String(a[0]).localeCompare(String(b[0])));

    let distribuidos = 0;
    entradas.forEach(([professorId, contagem], idx) => {
      const periodo = periodos.find(h => (h.professor_id || null) === professorId) || vencedor;
      const share = contagem / totalContagem;
      const isUltimo = idx === entradas.length - 1;
      const centavos = isUltimo ? (totalCentavos - distribuidos) : Math.round(totalCentavos * share);
      distribuidos += centavos;
      const valorRecebido = centavos / 100;
      const valorProfessor = Math.round(valorProfessorDoPeriodo(periodo) * share * 100) / 100;
      // Só pula a linha se não houver NADA a registrar pra este professor —
      // valor_recebido é o valor mensal do ALUNO (pode estar zerado por erro
      // de cadastro, ou genuinamente ser R$0 nesse período) e valor_professor
      // vem da tabela de modalidade, os dois são independentes: um valor
      // recebido zerado não pode apagar a comissão da professora que deu a
      // aula de verdade.
      if(valorRecebido <= 0 && valorProfessor <= 0) return;
      linhas.push({
        aluno_id: alunoId, aluno_nome: nomeAluno, mes_competencia: mes,
        professor_id: professorId, modalidade_id: periodo.modalidade_id,
        valor_recebido: valorRecebido, valor_pago_professor: valorProfessor,
        atualizado_em: new Date().toISOString()
      });
    });
  }

  if(!linhas.length) return { count: 0 };

  // Apaga linhas "órfãs" de professor que sobraram de uma geração anterior
  // (ex: mês tinha 2 professores rateados, recontagem agora só acha 1) —
  // upsert sozinho não remove o que não está mais no cálculo. Só vale a
  // consulta extra abaixo quando pelo menos um aluno teve mais de um
  // período tocando o mês (troca de professor) — no caso comum (todo mundo
  // com 1 período só), pula direto pro upsert. Sem essa checagem, TODA
  // geração (troca de mês em Pagamentos, todo salvamento de vínculo
  // financeiro, toda validação de fechamento) pagava um round-trip a mais
  // no banco à toa.
  const houveTrocaDeProfessorNoMes = Object.values(periodosPorAluno).some(periodos => periodos.length > 1);
  if(houveTrocaDeProfessorNoMes){
    const alunosProcessados = Object.keys(periodosPorAluno);
    const chavesVivas = new Set(linhas.map(l => l.aluno_id + '|' + (l.professor_id || '')));
    const existentes = (await dyseListMensalidades(mes)).filter(m => alunosProcessados.includes(m.aluno_id));
    const idsParaApagar = existentes.filter(m => !chavesVivas.has(m.aluno_id + '|' + (m.professor_id || ''))).map(m => m.id);
    if(idsParaApagar.length) await sb.from('mensalidades').delete().in('id', idsParaApagar);
  }

  const { error } = await sb.from('mensalidades').upsert(linhas, { onConflict: 'aluno_id,mes_competencia,professor_id' });

  // Materializa os gastos padrão (ex: Flexge) como um gasto normal por aluno
  // ativo neste mês — upsert por (aluno, mês, gasto_padrao_id) garante que
  // rodar de novo não duplica, e gastos lançados manualmente (gasto_padrao_id
  // nulo) nunca são tocados aqui. Dedupe por aluno_id ANTES de montar o
  // upsert: com o rateio, um aluno pode gerar 2+ "linhas" de mensalidade no
  // mesmo mês — sem isso, a mesma chave (aluno, mês, gasto_padrao_id) seria
  // enviada duas vezes no mesmo upsert e o Postgres rejeita.
  const gastosPadrao = (await dyseListGastosPadrao()).filter(g => g.ativo);
  if(gastosPadrao.length){
    const alunoIdsUnicos = [...new Set(linhas.map(l => l.aluno_id))];
    const gastosLinhas = [];
    alunoIdsUnicos.forEach(alunoId => {
      gastosPadrao.forEach(gp => {
        gastosLinhas.push({
          aluno_id: alunoId,
          mes_competencia: mes,
          descricao: gp.descricao,
          tipo: gp.tipo,
          forma_calculo: gp.forma_calculo,
          valor: gp.valor,
          gasto_padrao_id: gp.id
        });
      });
    });
    await sb.from('gastos_personalizados').upsert(gastosLinhas, { onConflict: 'aluno_id,mes_competencia,gasto_padrao_id' });
  }

  return { count: linhas.length, error };
}

/* Sem "mes", traz todos os meses (a RLS já restringe o professor às
   próprias linhas — esta função serve tanto a gestão quanto o professor). */
async function dyseListMensalidades(mes){
  let query = sb.from('mensalidades').select('*');
  if(mes) query = query.eq('mes_competencia', mes);
  const { data, error } = await query;
  return error ? [] : data;
}

/* Mensalidades do professor logado, explicitamente filtradas por
   professor_id (além da RLS, por clareza e defesa em profundidade). */
async function dyseListMyMensalidades(mes){
  const session = await dyseGetSession();
  if(!session) return [];
  let query = sb.from('mensalidades').select('*').eq('professor_id', session.user.id);
  if(mes) query = query.eq('mes_competencia', mes);
  const { data, error } = await query.order('mes_competencia', { ascending: false });
  return error ? [] : data;
}

/* Gera "qtd" meses de competência (YYYY-MM-01) sequenciais a partir de
   "mes" (inclusive). */
function dyseProximosMeses(mes, qtd){
  const meses = [];
  let atual = mes;
  for(let i = 0; i < qtd; i++){
    meses.push(atual);
    const [y, m] = atual.split('-').map(Number);
    const proxMesNum = m === 12 ? 1 : m + 1;
    const proxAno = m === 12 ? y + 1 : y;
    atual = proxAno + '-' + String(proxMesNum).padStart(2,'0') + '-01';
  }
  return meses;
}

/* Previsão (SEM gravar nada em "mensalidades") do que o professor logado
   deve receber por aluno em cada um de "qtdMeses" meses a partir de
   "mesInicial" (inclusive) — usada pra listar vários meses futuros de uma
   vez (ex: "Previsão dos próximos meses" no painel da professora), sem
   repetir as 4 consultas abaixo pra cada mês like dysePreverFinanceiroProfessor
   fazia sendo chamada mês a mês (o que ficava lento ao trocar o seletor
   repetidas vezes). Um mês só é gerado oficialmente (mensalidades de
   verdade) quando a gestão abre Pagamentos/Relatório pra ele em
   gestao.html — até lá, um mês futuro com parcelas contratadas aparece
   vazio pro professor.

   Só usa dados que o próprio professor já enxerga via RLS (seu próprio
   histórico financeiro) — não sabe se algum desses meses vai ser rateado
   com outro professor (isso depende de presença lançada, calculada só na
   geração oficial em dyseGerarMensalidadesDoMes), então é só uma
   estimativa: o valor final pode sair diferente. */
async function dysePreverFinanceiroProfessorMeses(mesInicial, qtdMeses){
  const session = await dyseGetSession();
  if(!session) return [];

  const [historico, modalidades, valores, alunos] = await Promise.all([
    dyseListAlunoFinanceiroHistorico(), // RLS já restringe ao próprio professor
    dyseListModalidades(),
    dyseListModalidadeValores(),
    dyseListProfilesByRole('student')
  ]);

  const meuHistorico = historico.filter(h => (h.professor_id || null) === session.user.id); // defesa em profundidade, RLS já filtra
  const modalidadeById = {};
  modalidades.forEach(m => { modalidadeById[m.id] = m; });
  const valoresPorModalidade = {};
  valores.forEach(v => { (valoresPorModalidade[v.modalidade_id] = valoresPorModalidade[v.modalidade_id] || []).push(v); });
  const nomeAlunoById = {};
  alunos.forEach(a => { nomeAlunoById[a.id] = a.full_name || a.email || ''; });

  return dyseProximosMeses(mesInicial, qtdMeses).map(mes => {
    const fimDoMesStr = dyseFimDoMes(mes);
    const porAluno = {};
    meuHistorico.forEach(h => {
      if(h.situacao !== 'ativo') return;
      if(h.data_inicio > fimDoMesStr) return;
      if(h.data_fim && h.data_fim < mes) return;
      const ultimoMesPago = dyseUltimoMesPago(h);
      if(ultimoMesPago && mes > ultimoMesPago) return;
      const atual = porAluno[h.aluno_id];
      const ganha = !atual || h.data_inicio > atual.data_inicio || (h.data_inicio === atual.data_inicio && h.id > atual.id);
      if(ganha) porAluno[h.aluno_id] = h;
    });

    const linhas = Object.values(porAluno).map(h => {
      const modalidade = modalidadeById[h.modalidade_id];
      const valorProfessor = (modalidade && modalidade.is_custom_value)
        ? Number(h.valor_professor_customizado || 0)
        : (dyseValorVigente(valoresPorModalidade[h.modalidade_id], mes) || 0);
      return {
        aluno_id: h.aluno_id,
        aluno_nome: nomeAlunoById[h.aluno_id] || null,
        mes_competencia: mes,
        professor_id: h.professor_id,
        modalidade_id: h.modalidade_id,
        valor_recebido: Number(h.valor_mensal_aluno || 0),
        valor_pago_professor: valorProfessor
      };
    });
    return { mes, linhas };
  });
}

/* Previsão de UM mês só — mantida por conveniência pra quem só precisa de
   um mês (ex: o mês selecionado no painel), delega pra
   dysePreverFinanceiroProfessorMeses. */
async function dysePreverFinanceiroProfessor(mes){
  const [resultado] = await dysePreverFinanceiroProfessorMeses(mes, 1);
  return resultado ? resultado.linhas : [];
}

/* Mesma ideia de dysePreverFinanceiroProfessor, mas pra TODOS os meses que
   os vínculos do professor tocam (não só um mês pedido) — alimenta
   "Histórico de meses anteriores" em professora.html, que antes só
   mostrava os meses em que a gestão já tinha aberto Pagamentos/Relatório
   (dyseGerarMensalidadesDoMes gerando a linha real em "mensalidades") e
   deixava buracos nos meses que ninguém tinha visitado ainda. O teto de
   cada vínculo é o que vier primeiro entre: mês atual, fim do período
   (data_fim) e a última parcela contratada (quantidade_parcelas). Sem
   rateio entre professores aqui — sem chamada lançada não dá pra prever
   divisão, então (igual dysePreverFinanceiroProfessor) cada mês fica só
   com o período mais recente que o toca. */
async function dyseListMinhaPrevisaoHistoricoFinanceiro(){
  const session = await dyseGetSession();
  if(!session) return [];

  const [historico, modalidades, valores, alunos] = await Promise.all([
    dyseListAlunoFinanceiroHistorico(), // RLS já restringe ao próprio professor
    dyseListModalidades(),
    dyseListModalidadeValores(),
    dyseListProfilesByRole('student')
  ]);

  const meusPeriodos = historico.filter(h => (h.professor_id || null) === session.user.id && h.situacao === 'ativo');
  if(!meusPeriodos.length) return [];

  const modalidadeById = {};
  modalidades.forEach(m => { modalidadeById[m.id] = m; });
  const valoresPorModalidade = {};
  valores.forEach(v => { (valoresPorModalidade[v.modalidade_id] = valoresPorModalidade[v.modalidade_id] || []).push(v); });
  const nomeAlunoById = {};
  alunos.forEach(a => { nomeAlunoById[a.id] = a.full_name || a.email || ''; });

  function mesSeguinte(mes){
    const [y, m] = mes.split('-').map(Number);
    const mm = m === 12 ? 1 : m + 1;
    const yy = m === 12 ? y + 1 : y;
    return yy + '-' + String(mm).padStart(2, '0') + '-01';
  }

  const hoje = dyseMesCompetencia();
  const mesesSet = new Set();
  meusPeriodos.forEach(h => {
    const inicioMes = h.data_inicio.slice(0, 7) + '-01';
    const ultimoMesPago = dyseUltimoMesPago(h);
    const fimMes = h.data_fim ? (h.data_fim.slice(0, 7) + '-01') : null;
    // Teto do período: se tem parcelas contratadas, mostra o prazo INTEIRO
    // (inclusive meses futuros ainda não vividos — "6 parcelas" precisa
    // aparecer como 6 meses pra professora, não só os que já passaram).
    // Um período encerrado (data_fim) nunca passa do mês em que foi
    // fechado, mesmo que ainda sobrasse parcela. Sem parcela E sem
    // data_fim (prazo indefinido) não dá pra saber quantos meses futuros
    // existem, então fica só até o mês atual.
    let teto = fimMes || ultimoMesPago || hoje;
    if(fimMes && ultimoMesPago && ultimoMesPago < fimMes) teto = ultimoMesPago;
    for(let cursor = inicioMes; cursor <= teto; cursor = mesSeguinte(cursor)) mesesSet.add(cursor);
  });

  const linhas = [];
  mesesSet.forEach(mes => {
    const fimDoMesStr = dyseFimDoMes(mes);
    const porAluno = {};
    meusPeriodos.forEach(h => {
      if(h.data_inicio > fimDoMesStr) return;
      if(h.data_fim && h.data_fim < mes) return;
      const ultimoMesPago = dyseUltimoMesPago(h);
      if(ultimoMesPago && mes > ultimoMesPago) return;
      const atual = porAluno[h.aluno_id];
      const ganha = !atual || h.data_inicio > atual.data_inicio || (h.data_inicio === atual.data_inicio && h.id > atual.id);
      if(ganha) porAluno[h.aluno_id] = h;
    });
    Object.values(porAluno).forEach(h => {
      const modalidade = modalidadeById[h.modalidade_id];
      const valorProfessor = (modalidade && modalidade.is_custom_value)
        ? Number(h.valor_professor_customizado || 0)
        : (dyseValorVigente(valoresPorModalidade[h.modalidade_id], mes) || 0);
      linhas.push({
        aluno_id: h.aluno_id,
        aluno_nome: nomeAlunoById[h.aluno_id] || null,
        mes_competencia: mes,
        professor_id: h.professor_id,
        modalidade_id: h.modalidade_id,
        valor_recebido: Number(h.valor_mensal_aluno || 0),
        valor_pago_professor: valorProfessor
      });
    });
  });
  return linhas;
}

/* ======================================================================
   PRESENÇA (CHAMADA) — sessões de aula por turma+data+professor e
   presença por aluno dentro de cada sessão. Alimenta o rateio de
   mensalidade em dyseGerarMensalidadesDoMes quando o vínculo financeiro
   do aluno troca de professor no meio do mês.
   ====================================================================== */

/* Sessões de uma turma dentro de um mês de competência (mesma janela
   usada em todo o financeiro: do início do mês até dyseFimDoMes). */
async function dyseListSessoesTurma(turmaId, mes){
  const { data, error } = await sb
    .from('turma_sessoes')
    .select('*')
    .eq('turma_id', turmaId)
    .gte('data', mes)
    .lte('data', dyseFimDoMes(mes))
    .order('data', { ascending: false });
  return error ? [] : data;
}

/* Sessões de aula dentro de um mês, em QUALQUER turma — usada pelo rateio
   (dyseGerarMensalidadesDoMes) pra achar as aulas de cada professora
   entitulada mesmo quando ela dá aula pra este aluno numa turma diferente
   da cadastrada no perfil dele. "fimDoMesStr" já vem calculado de quem
   chama, pra não recalcular por aluno dentro do mesmo laço. */
async function dyseListSessoesDoMes(mes, fimDoMesStr){
  const { data, error } = await sb
    .from('turma_sessoes')
    .select('*')
    .gte('data', mes)
    .lte('data', fimDoMesStr);
  return error ? [] : data;
}

/* Cria/atualiza a sessão de uma data pra turma, sempre em nome da
   professora logada. onConflict inclui professor_id: reabrir a mesma
   data só atualiza a própria sessão, nunca a de outra professora que
   também deu aula pra essa turma no mesmo dia. */
async function dyseUpsertSessaoTurma(turmaId, data, observacao){
  const session = await dyseGetSession();
  if(!session) return { error: { message: 'Sessão expirada.' } };
  const { data: row, error } = await sb
    .from('turma_sessoes')
    .upsert({
      turma_id: turmaId,
      professor_id: session.user.id,
      data: data || dyseHoje(),
      observacao: observacao || null,
      criado_por: session.user.id,
      atualizado_em: new Date().toISOString()
    }, { onConflict: 'turma_id,data,professor_id' })
    .select('*')
    .maybeSingle();
  return { data: row, error };
}

/* Desfaz uma chamada já registrada (exclui a sessão de aula). As
   presenças lançadas nela caem junto (sessao_presencas.sessao_id
   referencia turma_sessoes com "on delete cascade"). Usado quando a
   professora marcou a chamada errada (turma/data trocada, aula que não
   rolou, etc.) e precisa registrar de novo do zero. */
async function dyseExcluirSessaoTurma(sessaoId){
  const { error } = await sb.from('turma_sessoes').delete().eq('id', sessaoId);
  return { error };
}

/* Presenças já lançadas numa sessão (pra pré-marcar o checklist ao
   reabrir uma data já registrada). */
async function dyseListPresencasSessao(sessaoId){
  const { data, error } = await sb.from('sessao_presencas').select('*').eq('sessao_id', sessaoId);
  return error ? [] : data;
}

/* Grava a chamada inteira de uma sessão de uma vez.
   "presencas" = [{ aluno_id, presente }, ...] — um item por aluno
   matriculado na turma no momento da chamada. */
async function dyseUpsertPresencas(sessaoId, presencas){
  const linhas = (presencas || []).map(p => ({ sessao_id: sessaoId, aluno_id: p.aluno_id, presente: !!p.presente }));
  if(!linhas.length) return { error: null };
  const { error } = await sb.from('sessao_presencas').upsert(linhas, { onConflict: 'sessao_id,aluno_id' });
  return { error };
}

/* Presenças (presente=true) de UM aluno, restritas a uma lista específica
   de sessao_id — o chamador já filtrou por turma+mês+professores
   elegíveis; aqui só falta cruzar com o aluno. */
async function dyseListPresencasAluno(alunoId, sessaoIds){
  if(!sessaoIds || !sessaoIds.length) return [];
  const { data, error } = await sb
    .from('sessao_presencas')
    .select('sessao_id, presente')
    .eq('aluno_id', alunoId)
    .eq('presente', true)
    .in('sessao_id', sessaoIds);
  return error ? [] : data;
}

/* ======================================================================
   MÓDULO ACADÊMICO — Registro de Classe e histórico do aluno.
   Escalável por nível: nenhuma função aqui é específica de A1 ou de 44
   aulas — isso vem de niveis.total_aulas/eixos_avaliacao, cadastrado no
   banco (ver schema.sql seção 12).
   ====================================================================== */

/* ---------- Níveis e aulas do nível ---------- */
/* Um "nível" (A1, A2...) é uma matéria com currículo — reconhecida por ter
   "total_aulas" preenchido (matérias comuns, tipo TOEFL, ficam com isso
   nulo). Vincular/desvincular uma turma a um nível é o mesmo
   dyseSetTurmaMateria(turmaId, slug, enabled) já usado em "Matérias
   liberadas" — não existe uma função separada pra isso. */
async function dyseListNiveis(){
  const { data, error } = await sb.from('materias').select('*').not('total_aulas', 'is', null).order('name', { ascending: true });
  return error ? [] : data;
}

/* "incluirInativas" (default false) — telas de USO (professora escolhendo
   aula pra registrar classe, aluno vendo Material, catálogo de cursos) só
   devem oferecer aulas ativas. Telas de HISTÓRICO (Report Card, histórico
   acadêmico do aluno) precisam ver TODAS, mesmo desativadas depois — senão
   um registro_classe antigo perde a referência de número/tópico da aula. */
async function dyseListNivelAulas(materiaSlug, incluirInativas){
  if(!materiaSlug) return [];
  let query = sb.from('nivel_aulas').select('*').eq('materia_slug', materiaSlug).order('numero', { ascending: true });
  if(!incluirInativas) query = query.eq('ativo', true);
  const { data, error } = await query;
  return error ? [] : data;
}

/* Link do material (Google Slides/Drive) de uma aula — só admin (RLS de
   nivel_aulas já restringe update a is_admin()). */
async function dyseUpdateNivelAulaMaterial(nivelAulaId, url){
  const { error } = await sb.from('nivel_aulas').update({ material_url: (url || '').trim() || null }).eq('id', nivelAulaId);
  return { error };
}

/* ---------- [Gestão] ativar/desativar e excluir uma aula ----------
   Desativar tira a aula das telas de uso (ver dyseListNivelAulas) sem
   apagar nada. Excluir é bloqueado pelo próprio Postgres se já existir
   registro_classe pra essa aula (nivel_aula_id ... on delete restrict) —
   nesse caso "error" vem preenchido e a tela deve orientar a desativar
   em vez de excluir. */
async function dyseSetNivelAulaAtivo(nivelAulaId, ativo){
  const { error } = await sb.from('nivel_aulas').update({ ativo: !!ativo }).eq('id', nivelAulaId);
  return { error };
}

async function dyseDeleteNivelAula(nivelAulaId){
  const { error } = await sb.from('nivel_aulas').delete().eq('id', nivelAulaId);
  return { error };
}

/* IDs de nivel_aula já registrados (registros_classe) pro ALUNO LOGADO,
   numa matéria — via RPC "security definer", nunca lendo registros_classe
   direto: aquela tabela é anotação interna da professora (avaliações,
   observações), o aluno não pode ler nenhum campo dela, só saber "essa
   aula já foi dada" pra tela de Material (área do aluno). */
async function dyseListMinhasAulasRegistradas(materiaSlug){
  if(!materiaSlug) return [];
  const { data, error } = await sb.rpc('minhas_aulas_registradas', { check_materia_slug: materiaSlug });
  return error ? [] : data.map(r => r.nivel_aula_id);
}

/* ---------- Registro de Classe (Bloco B — por aluno) ---------- */

/* Histórico completo de um aluno, em qualquer turma/professor — a RLS
   (teacher_can_see_turma pela turma ATUAL do aluno) já garante que só
   quem pode ver o aluno agora enxerga isso, mesmo registros antigos
   feitos por outro professor/turma. */
async function dyseListRegistrosClasse(alunoId){
  const { data, error } = await sb.from('registros_classe').select('*').eq('aluno_id', alunoId);
  return error ? [] : data;
}

/* Registros de uma LISTA de alunos numa aula específica — usado pra
   pré-preencher a tela de registro de uma turma inteira de uma vez. */
async function dyseListRegistrosClasseDaAula(alunoIds, nivelAulaId){
  if(!alunoIds || !alunoIds.length) return [];
  const { data, error } = await sb
    .from('registros_classe')
    .select('*')
    .eq('nivel_aula_id', nivelAulaId)
    .in('aluno_id', alunoIds);
  return error ? [] : data;
}

/* "avaliacoes" = { "Tarefa Final": "sim"|"parcial"|"nao"|"nao_participou", ... },
   chaves = niveis.eixos_avaliacao do nível daquela aula. */
async function dyseUpsertRegistroClasse(alunoId, nivelAulaId, campos){
  const session = await dyseGetSession();
  const userId = session ? session.user.id : null;
  const { data, error } = await sb
    .from('registros_classe')
    .upsert({
      aluno_id: alunoId,
      nivel_aula_id: nivelAulaId,
      turma_id: campos.turma_id || null,
      professor_id: userId,
      data_aula: campos.data_aula || dyseHoje(),
      avaliacoes: campos.avaliacoes || {},
      observacoes: campos.observacoes || null,
      criado_por: userId,
      atualizado_por: userId,
      atualizado_em: new Date().toISOString()
    }, { onConflict: 'aluno_id,nivel_aula_id' })
    .select('*')
    .maybeSingle();
  return { data, error };
}

/* ---------- Planner da sessão (Bloco C — por turma+aula) ---------- */
async function dyseGetRegistroClasseSessao(turmaId, nivelAulaId){
  const { data, error } = await sb
    .from('registro_classe_sessao')
    .select('*')
    .eq('turma_id', turmaId)
    .eq('nivel_aula_id', nivelAulaId)
    .maybeSingle();
  return error ? null : data;
}

async function dyseUpsertRegistroClasseSessao(turmaId, nivelAulaId, campos){
  const session = await dyseGetSession();
  const userId = session ? session.user.id : null;
  const { data, error } = await sb
    .from('registro_classe_sessao')
    .upsert({
      turma_id: turmaId,
      nivel_aula_id: nivelAulaId,
      data_aula: campos.data_aula || dyseHoje(),
      pontos_a_retomar: campos.pontos_a_retomar || null,
      ajuste_de_ritmo: campos.ajuste_de_ritmo || null,
      alerta_report_card: !!campos.alerta_report_card,
      alerta_report_card_motivo: campos.alerta_report_card_motivo || null,
      criado_por: userId,
      atualizado_em: new Date().toISOString()
    }, { onConflict: 'turma_id,nivel_aula_id' })
    .select('*')
    .maybeSingle();
  return { data, error };
}

async function dyseListRegistroClasseSessoesPorPares(turmaIds, nivelAulaIds){
  if(!turmaIds.length || !nivelAulaIds.length) return [];
  const { data, error } = await sb
    .from('registro_classe_sessao')
    .select('*')
    .in('turma_id', turmaIds)
    .in('nivel_aula_id', nivelAulaIds);
  return error ? [] : data;
}

/* ======================================================================
   REPORT CARD — geração a partir do Registro de Classe acumulado, com
   fluxo de aprovação em 3 etapas (rascunho → liberado_professor →
   liberado_aluno). O aluno nunca vê rascunho; o professor só vê depois
   de liberado (RLS, schema seção 13). Escalável: os checkpoints de
   revisão e a aula de apresentação final são detectados pelo TÓPICO da
   aula (padrão "revisão"/"apresentação final"), não por número fixo —
   funciona pra qualquer nível/syllabus futuro sem mudar código.
   ====================================================================== */
const DYSE_LIMIAR_PP = 0.7; // >=70% "sim" entre as amostras do eixo -> sugere PP
const DYSE_LIMIAR_R = 0.35; // <=35% "sim" -> sugere R; entre os dois -> P

/* Sugestão PP/P/R a partir de uma lista de avaliações ('sim'|'parcial'|'nao',
   já sem "nao_participou") de um único eixo. Nunca inventa: sem amostra,
   retorna null. */
function dyseSugerirPPR(valores){
  if(!valores.length) return null;
  const sim = valores.filter(v => v === 'sim').length;
  const proporcaoSim = sim / valores.length;
  const nivel = proporcaoSim >= DYSE_LIMIAR_PP ? 'PP' : (proporcaoSim <= DYSE_LIMIAR_R ? 'R' : 'P');
  return { nivel, amostras: valores.length };
}

function dyseMapAvaliacaoParaPPR(valor){
  return { sim: 'PP', parcial: 'P', nao: 'R' }[valor] || null;
}

/* Gera (ou regenera, enquanto ainda em rascunho) o Report Card de um
   aluno num intervalo de aulas de uma matéria/nível. Recusa sobrescrever
   um Report Card que já saiu de rascunho — depois de liberado, os
   campos são editados direto (dyseUpdateReportCard), nunca regerados por
   cima, pra não apagar revisão já feita. */
async function dyseGerarReportCard(alunoId, materiaSlug, semestre, aulaInicio, aulaFim){
  const session = await dyseGetSession();
  const userId = session ? session.user.id : null;

  const { data: existente } = await sb
    .from('report_cards').select('id, status')
    .eq('aluno_id', alunoId).eq('materia_slug', materiaSlug).eq('semestre', semestre)
    .maybeSingle();
  if(existente && existente.status !== 'rascunho'){
    return { error: { message: 'Este Report Card já foi liberado — edite os campos direto em vez de gerar de novo, pra não perder revisão já feita.' } };
  }

  const [todasAulas, todosRegistros, alunos, materias] = await Promise.all([
    dyseListNivelAulas(materiaSlug, true), // true: relatório histórico precisa das aulas mesmo se desativadas depois
    dyseListRegistrosClasse(alunoId),
    dyseListProfilesByRole('student'),
    dyseListMaterias()
  ]);

  const aulaPorId = {}; todasAulas.forEach(a => { aulaPorId[a.id] = a; });
  const aulasDoIntervalo = todasAulas.filter(a => a.numero >= aulaInicio && a.numero <= aulaFim);
  const registrosDoIntervalo = todosRegistros.filter(r => {
    const aula = aulaPorId[r.nivel_aula_id];
    return aula && aula.numero >= aulaInicio && aula.numero <= aulaFim;
  });
  const registroPorNumero = {};
  registrosDoIntervalo.forEach(r => { const aula = aulaPorId[r.nivel_aula_id]; if(aula) registroPorNumero[aula.numero] = r; });

  // Frequência: presente = tem registro E pelo menos um eixo diferente de
  // "não participou". Aula sem registro nenhum não conta como ausência —
  // vira um aviso separado (pode só não ter sido lançada ainda).
  let presentes = 0, semRegistro = 0;
  aulasDoIntervalo.forEach(a => {
    const r = registroPorNumero[a.numero];
    if(!r){ semRegistro++; return; }
    const participou = Object.values(r.avaliacoes || {}).some(v => v !== 'nao_participou');
    if(participou) presentes++;
  });
  const previstas = aulasDoIntervalo.length;
  const percentual = previstas ? Math.round((presentes / previstas) * 1000) / 10 : 0;
  const frequencia = { aulas_previstas: previstas, aulas_presentes: presentes, percentual, criterio_atingido: percentual >= 75, aulas_sem_registro: semRegistro };

  // Avaliação por eixo — uma sugestão por eixo configurado na matéria/nível.
  const materiaAtual = materias.find(m => m.slug === materiaSlug);
  const eixosNivel = (materiaAtual && materiaAtual.eixos_avaliacao) || [];
  const avaliacaoEixos = {};
  eixosNivel.forEach(eixo => {
    const valores = registrosDoIntervalo.map(r => (r.avaliacoes || {})[eixo]).filter(v => v && v !== 'nao_participou');
    const sugestao = dyseSugerirPPR(valores);
    avaliacaoEixos[eixo] = { nivel: sugestao ? sugestao.nivel : null, amostras: sugestao ? sugestao.amostras : 0, observacoes: '' };
  });

  // Revisões-teste: aulas de revisão dentro do intervalo. Nota do Forms e
  // validade oficial não têm fonte de dado — ficam pendentes; "fluência
  // oral" é sugerida a partir do eixo "Tarefa Final" daquela aula.
  const checkpoints = aulasDoIntervalo.filter(a => /revis[ãa]o/i.test(a.topico));
  const revisoesTeste = checkpoints.map(a => {
    const r = registroPorNumero[a.numero];
    const tarefaFinal = r ? (r.avaliacoes || {})['Tarefa Final'] : null;
    return {
      aula_numero: a.numero,
      aula_topico: a.topico,
      nota_forms: null,
      fluencia_oral: tarefaFinal && tarefaFinal !== 'nao_participou' ? dyseMapAvaliacaoParaPPR(tarefaFinal) : null,
      validade_oficial: null
    };
  });

  // Apresentação Final — só se a aula correspondente estiver no intervalo.
  const aulaFinal = aulasDoIntervalo.find(a => /apresenta[çc][ãa]o final/i.test(a.topico));
  let apresentacaoFinal = null;
  if(aulaFinal){
    const r = registroPorNumero[aulaFinal.numero];
    const tarefaFinal = r ? (r.avaliacoes || {})['Tarefa Final'] : null;
    apresentacaoFinal = {
      aula_numero: aulaFinal.numero,
      eixos: {
        'Cumprimento da Tarefa': { nivel: tarefaFinal && tarefaFinal !== 'nao_participou' ? dyseMapAvaliacaoParaPPR(tarefaFinal) : null, observacoes: '' },
        'Gramática do Nível': { nivel: null, observacoes: '' },
        'Fluência e Pronúncia': { nivel: null, observacoes: '' },
        'Interação': { nivel: null, observacoes: '' },
        'Vocabulário do Nível': { nivel: null, observacoes: '' }
      },
      resultado: null
    };
  }

  // Alertas do Planner (Bloco C) do período — referência pro professor
  // escrever os blocos F/G/H, igual a nota metodológica do modelo pede.
  // Usa o turma_id GRAVADO em cada registro (retrato de onde o aluno
  // estava naquela aula específica), não a turma atual.
  const turmaIds = [...new Set(registrosDoIntervalo.map(r => r.turma_id).filter(Boolean))];
  const nivelAulaIds = registrosDoIntervalo.map(r => r.nivel_aula_id);
  const paresValidos = new Set(registrosDoIntervalo.filter(r => r.turma_id).map(r => r.turma_id + '|' + r.nivel_aula_id));
  const sessoesCandidatas = await dyseListRegistroClasseSessoesPorPares(turmaIds, nivelAulaIds);
  const alertasPlanner = sessoesCandidatas
    .filter(s => s.alerta_report_card && paresValidos.has(s.turma_id + '|' + s.nivel_aula_id))
    .map(s => { const aula = aulaPorId[s.nivel_aula_id]; return { aula_numero: aula ? aula.numero : null, aula_topico: aula ? aula.topico : null, motivo: s.alerta_report_card_motivo || null }; })
    .sort((a, b) => (a.aula_numero || 0) - (b.aula_numero || 0));

  const dados = {
    frequencia,
    avaliacao_eixos: avaliacaoEixos,
    revisoes_teste: revisoesTeste,
    apresentacao_final: apresentacaoFinal,
    alertas_planner: alertasPlanner,
    pontos_fortes: '',
    pontos_desenvolvimento: '',
    consideracoes_professor: '',
    encaminhamento: { tipo: null, motivo: '' }
  };

  const aluno = alunos.find(a => a.id === alunoId);
  const ultimoRegistro = registrosDoIntervalo[registrosDoIntervalo.length - 1];

  const { data, error } = await sb
    .from('report_cards')
    .upsert({
      aluno_id: alunoId,
      materia_slug: materiaSlug,
      semestre,
      aula_inicio: aulaInicio,
      aula_fim: aulaFim,
      status: 'rascunho',
      dados,
      turma_id: (aluno && aluno.turma_id) || null,
      professor_id: ultimoRegistro ? ultimoRegistro.professor_id : null,
      gerado_por: userId,
      gerado_em: new Date().toISOString(),
      atualizado_em: new Date().toISOString()
    }, { onConflict: 'aluno_id,materia_slug,semestre' })
    .select('*')
    .maybeSingle();
  return { data, error };
}

async function dyseListReportCards(alunoId){
  let query = sb.from('report_cards').select('*');
  if(alunoId) query = query.eq('aluno_id', alunoId);
  const { data, error } = await query.order('semestre', { ascending: true });
  return error ? [] : data;
}

async function dyseUpdateReportCard(id, dados){
  const { data, error } = await sb
    .from('report_cards')
    .update({ dados, atualizado_em: new Date().toISOString() })
    .eq('id', id)
    .select('*')
    .maybeSingle();
  return { data, error };
}

async function dyseLiberarReportCardProfessor(id){
  const session = await dyseGetSession();
  const userId = session ? session.user.id : null;
  const { data, error } = await sb
    .from('report_cards')
    .update({ status: 'liberado_professor', liberado_professor_por: userId, liberado_professor_em: new Date().toISOString() })
    .eq('id', id)
    .select('*')
    .maybeSingle();
  return { data, error };
}

/* Marca quem/quando revisou, sem mudar o status — "Liberar para Aluno" é
   uma ação separada e explícita (dyseLiberarReportCardAluno). */
async function dyseMarcarReportCardRevisado(id){
  const session = await dyseGetSession();
  const userId = session ? session.user.id : null;
  const { error } = await sb
    .from('report_cards')
    .update({ revisado_por: userId, revisado_em: new Date().toISOString() })
    .eq('id', id);
  return { error };
}

async function dyseLiberarReportCardAluno(id){
  const session = await dyseGetSession();
  const userId = session ? session.user.id : null;
  const { data, error } = await sb
    .from('report_cards')
    .update({ status: 'liberado_aluno', liberado_aluno_por: userId, liberado_aluno_em: new Date().toISOString() })
    .eq('id', id)
    .select('*')
    .maybeSingle();
  return { data, error };
}

/* ---------- Gastos personalizados (por aluno + mês) ---------- */
async function dyseListGastos(alunoId, mes){
  let query = sb.from('gastos_personalizados').select('*');
  if(alunoId) query = query.eq('aluno_id', alunoId);
  if(mes) query = query.eq('mes_competencia', mes);
  const { data, error } = await query.order('criado_em', { ascending: false });
  return error ? [] : data;
}

async function dyseCreateGasto(campos){
  const session = await dyseGetSession();
  const { data, error } = await sb
    .from('gastos_personalizados')
    .insert({
      aluno_id: campos.aluno_id,
      mes_competencia: campos.mes_competencia,
      descricao: campos.descricao,
      tipo: campos.tipo || 'outro',
      forma_calculo: campos.forma_calculo,
      valor: campos.valor,
      observacao: campos.observacao || null,
      criado_por: session ? session.user.id : null
    })
    .select('*')
    .maybeSingle();
  return { data, error };
}

async function dyseUpdateGasto(id, fields){
  const { error } = await sb.from('gastos_personalizados').update(fields).eq('id', id);
  return { error };
}

async function dyseDeleteGasto(id){
  const { error } = await sb.from('gastos_personalizados').delete().eq('id', id);
  return { error };
}

/* ---------- Gastos padrão (aplicados automaticamente a TODOS os alunos ativos, todo mês) ---------- */
async function dyseListGastosPadrao(){
  const { data, error } = await sb.from('gastos_padrao').select('*').order('descricao', { ascending: true });
  return error ? [] : data;
}

async function dyseCreateGastoPadrao(campos){
  const session = await dyseGetSession();
  const { data, error } = await sb
    .from('gastos_padrao')
    .insert({
      descricao: campos.descricao,
      tipo: campos.tipo || 'outro',
      forma_calculo: campos.forma_calculo,
      valor: campos.valor,
      ativo: campos.ativo !== false,
      criado_por: session ? session.user.id : null
    })
    .select('*')
    .maybeSingle();
  return { data, error };
}

async function dyseUpdateGastoPadrao(id, fields){
  const { error } = await sb.from('gastos_padrao').update(fields).eq('id', id);
  return { error };
}

async function dyseDeleteGastoPadrao(id){
  const { error } = await sb.from('gastos_padrao').delete().eq('id', id);
  return { error };
}

/* Valor efetivo de um gasto: se percentual, calcula em cima do valor
   recebido do aluno naquele mês (nunca fica armazenado, sempre ao vivo). */
function dyseValorGasto(gasto, valorRecebidoAluno){
  if(gasto.forma_calculo === 'percentual') return Number(valorRecebidoAluno || 0) * (Number(gasto.valor) / 100);
  return Number(gasto.valor);
}

/* Lucro líquido = valor recebido − valor pago ao professor − gastos (fixos + percentuais). */
function dyseLucroMensalidade(mensalidade, gastosDoAluno){
  const gastos = (gastosDoAluno || []).reduce((soma, g) => soma + dyseValorGasto(g, mensalidade.valor_recebido), 0);
  const lucro = Number(mensalidade.valor_recebido) - Number(mensalidade.valor_pago_professor) - gastos;
  return { gastos, lucro };
}

/* Lucro de um aluno num mês, dividido entre as mensalidades do mês (pode
   haver mais de uma linha quando o vínculo trocou de professor no meio
   do mês — rateio por presença). Gastos (fixos e percentuais) são
   cobrados UMA VEZ por aluno, sobre a SOMA de "valor_recebido" das linhas
   do mês, e distribuídos entre elas proporcionalmente à participação de
   cada uma na soma — nunca duplicados por linha. Com uma linha só (o
   caso comum), o resultado bate exatamente com o de dyseLucroMensalidade. */
function dyseLucroPorAluno(mensalidadesDoAluno, gastosDoAluno){
  const linhas = mensalidadesDoAluno || [];
  const somaRecebido = linhas.reduce((s, m) => s + Number(m.valor_recebido || 0), 0);
  const totalGastos = (gastosDoAluno || []).reduce((s, g) => s + dyseValorGasto(g, somaRecebido), 0);
  const porMensalidadeId = {};
  linhas.forEach(m => {
    const share = somaRecebido > 0 ? Number(m.valor_recebido || 0) / somaRecebido : (linhas.length ? 1 / linhas.length : 0);
    const gastos = totalGastos * share;
    const lucro = Number(m.valor_recebido || 0) - Number(m.valor_pago_professor || 0) - gastos;
    porMensalidadeId[m.id] = { gastos, lucro };
  });
  const lucroTotal = linhas.reduce((s, m) => s + porMensalidadeId[m.id].lucro, 0);
  return { totalGastos, lucroTotal, porMensalidadeId };
}

/* ---------- Pagamentos aos professores (por professor + mês) ---------- */
async function dyseListPagamentosProfessores(mes){
  let query = sb.from('pagamentos_professores').select('*');
  if(mes) query = query.eq('mes_competencia', mes);
  const { data, error } = await query;
  return error ? [] : data;
}

async function dyseListMyPagamentos(){
  const session = await dyseGetSession();
  if(!session) return [];
  const { data, error } = await sb
    .from('pagamentos_professores')
    .select('*')
    .eq('professor_id', session.user.id)
    .order('mes_competencia', { ascending: false });
  return error ? [] : data;
}

async function dyseRegistrarPagamentoProfessor(professorId, mes, campos){
  const session = await dyseGetSession();
  const { data, error } = await sb
    .from('pagamentos_professores')
    .upsert({
      professor_id: professorId,
      mes_competencia: mes,
      status: campos.status,
      valor_pago: campos.valor_pago ?? null,
      data_pagamento: campos.data_pagamento || null,
      observacoes: campos.observacoes || null,
      atualizado_por: session ? session.user.id : null,
      atualizado_em: new Date().toISOString()
    }, { onConflict: 'professor_id,mes_competencia' })
    .select('*')
    .maybeSingle();
  return { data, error };
}

/* ---------- Fechamento mensal ---------- */
async function dyseListFechamentos(){
  const { data, error } = await sb.from('fechamentos_mensais').select('*').order('mes_competencia', { ascending: false });
  return error ? [] : data;
}

/* Lista avisos de pendência antes de fechar o mês (seção 9 do briefing).
   Array vazio = nenhuma pendência encontrada. */
async function dyseValidarFechamento(mes){
  const avisos = [];
  await dyseGerarMensalidadesDoMes(mes);
  const [historico, mensalidades, pagamentos] = await Promise.all([
    dyseListAlunoFinanceiroHistorico(),
    dyseListMensalidades(mes),
    dyseListPagamentosProfessores(mes)
  ]);

  const ativosSemModalidade = historico.filter(h => !h.data_fim && h.situacao === 'ativo' && !h.modalidade_id);
  if(ativosSemModalidade.length) avisos.push(ativosSemModalidade.length + ' aluno(s) ativo(s) sem modalidade definida.');

  const ativosSemProfessor = historico.filter(h => !h.data_fim && h.situacao === 'ativo' && !h.professor_id);
  if(ativosSemProfessor.length) avisos.push(ativosSemProfessor.length + ' aluno(s) ativo(s) sem professor responsável.');

  const semValorRecebido = mensalidades.filter(m => !m.valor_recebido || Number(m.valor_recebido) <= 0);
  if(semValorRecebido.length) avisos.push(semValorRecebido.length + ' aluno(s) sem valor recebido cadastrado neste mês.');

  const professoresComAluno = new Set(mensalidades.map(m => m.professor_id).filter(Boolean));
  const professoresComPagamento = new Set(pagamentos.map(p => p.professor_id));
  const professoresSemCalculo = [...professoresComAluno].filter(id => !professoresComPagamento.has(id));
  if(professoresSemCalculo.length) avisos.push(professoresSemCalculo.length + ' professor(es) sem pagamento lançado neste mês.');

  const pendentes = pagamentos.filter(p => p.status === 'pendente');
  if(pendentes.length) avisos.push(pendentes.length + ' pagamento(s) de professor ainda pendente(s).');

  return avisos;
}

async function dyseFecharMes(mes, observacao){
  const session = await dyseGetSession();
  const userId = session ? session.user.id : null;

  await dyseGerarMensalidadesDoMes(mes); // garante que o mês está com os dados mais recentes antes de congelar
  await sb.from('mensalidades').update({ fechado: true }).eq('mes_competencia', mes);
  await sb.from('gastos_personalizados').update({ fechado: true }).eq('mes_competencia', mes);

  const { data, error } = await sb
    .from('fechamentos_mensais')
    .upsert({
      mes_competencia: mes,
      fechado_em: new Date().toISOString(),
      fechado_por: userId,
      reaberto_em: null,
      reaberto_por: null,
      observacao: observacao || null
    }, { onConflict: 'mes_competencia' })
    .select('*')
    .maybeSingle();
  return { data, error };
}

async function dyseReabrirMes(mes, motivo){
  const session = await dyseGetSession();
  const userId = session ? session.user.id : null;

  const { error } = await sb
    .from('fechamentos_mensais')
    .update({
      fechado_em: null,
      reaberto_em: new Date().toISOString(),
      reaberto_por: userId,
      observacao: motivo || null
    })
    .eq('mes_competencia', mes);
  if(error) return { error };

  await sb.from('mensalidades').update({ fechado: false }).eq('mes_competencia', mes);
  await sb.from('gastos_personalizados').update({ fechado: false }).eq('mes_competencia', mes);
  await dyseGerarMensalidadesDoMes(mes); // recalcula na hora — reabrir sozinho só destrava, não atualiza os dados
  return { error: null };
}