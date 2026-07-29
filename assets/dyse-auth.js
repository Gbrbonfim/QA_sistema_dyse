/* ======================================================================
   DYSE · Do You Speak English?
   Módulo central de autenticação, autorização e progresso (Supabase)
   ====================================================================== */

const SUPABASE_URL = "https://vnpjsjrqghttsagbssxx.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZucGpzanJxZ2h0dHNhZ2Jzc3h4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ4MjMzNzYsImV4cCI6MjEwMDM5OTM3Nn0.g_p_IgFbellbbeSP3MVA8kEKh7GdB3zne6x6fqW4avU";

const DYSE_STUDENT_HOME = '/area-do-aluno.html';
const DYSE_TEACHER_HOME = '/painel-professora.html';
const TOTAL_ACTIVITIES = 16;

if (!window.supabase) {
  throw new Error('A biblioteca Supabase não foi carregada antes de dyse-auth.js.');
}

const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

function dyseNormalizeRole(role) {
  return String(role || '').trim().toLowerCase();
}

function dyseIsTeacherProfile(profile) {
  return dyseNormalizeRole(profile?.role) === 'teacher';
}

function dyseShowProtectedPage() {
  document.documentElement.classList.add('dyse-auth-ready');
}

/* ---------- Sessão e perfil ---------- */
async function dyseGetSession() {
  const { data, error } = await sb.auth.getSession();

  if (error) {
    console.error('DYSE: erro ao buscar sessão:', error);
    return null;
  }

  return data?.session || null;
}

async function dyseGetProfile(session) {
  if (!session?.user?.id) return null;

  const { data: profile, error: profileError } = await sb
    .from('profiles')
    .select('id, full_name, role')
    .eq('id', session.user.id)
    .maybeSingle();

  if (profileError) {
    console.error('DYSE: erro ao buscar perfil:', profileError);
    throw profileError;
  }

  if (profile) return profile;

  // Fallback somente quando o perfil realmente não existe.
  // Usa INSERT em vez de UPSERT para nunca atualizar uma role existente.
  const fallbackName =
    session.user.user_metadata?.full_name ||
    session.user.email ||
    'Aluno';

  const { data: created, error: createError } = await sb
    .from('profiles')
    .insert({
      id: session.user.id,
      full_name: fallbackName,
      role: 'student'
    })
    .select('id, full_name, role')
    .single();

  if (!createError) return created;

  // Pode acontecer de um trigger criar o perfil ao mesmo tempo.
  if (createError.code === '23505') {
    const { data: retry, error: retryError } = await sb
      .from('profiles')
      .select('id, full_name, role')
      .eq('id', session.user.id)
      .single();

    if (retryError) {
      console.error('DYSE: erro ao reler perfil:', retryError);
      throw retryError;
    }

    return retry;
  }

  console.error('DYSE: erro ao criar perfil:', createError);
  throw createError;
}

async function dyseIsTeacher(session) {
  const activeSession = session || await dyseGetSession();
  if (!activeSession) return false;
  const profile = await dyseGetProfile(activeSession);
  return dyseIsTeacherProfile(profile);
}

/* ---------- Destino conforme a role ---------- */
function dyseSafeNextUrl(rawNext) {
  if (!rawNext) return null;

  try {
    const parsed = new URL(rawNext, location.origin);

    if (parsed.origin !== location.origin) return null;
    if (!parsed.pathname.startsWith('/')) return null;
    if (parsed.pathname === '/login.html') return null;

    return parsed.pathname + parsed.search + parsed.hash;
  } catch (error) {
    return null;
  }
}

async function dyseGetHomeByRole(session) {
  if (!session) return '/login.html';
  const profile = await dyseGetProfile(session);
  return dyseIsTeacherProfile(profile) ? DYSE_TEACHER_HOME : DYSE_STUDENT_HOME;
}

async function dyseGetDestinationAfterAuth(session, requestedNext) {
  const home = await dyseGetHomeByRole(session);
  const safeNext = dyseSafeNextUrl(requestedNext);

  if (!safeNext) return home;

  // Evita que a professora seja enviada novamente para a área do aluno
  // e que o aluno seja enviado diretamente para o painel da professora.
  if (safeNext === DYSE_STUDENT_HOME && home === DYSE_TEACHER_HOME) return home;
  if (safeNext === DYSE_TEACHER_HOME && home === DYSE_STUDENT_HOME) return home;

  return safeNext;
}

async function dyseRedirectAfterAuth(session, requestedNext) {
  const destination = await dyseGetDestinationAfterAuth(session, requestedNext);
  location.replace(destination);
}

/* ---------- Proteção de páginas ---------- */
async function dyseRequireAuth(options = {}) {
  const reveal = options.reveal !== false;
  const session = await dyseGetSession();

  if (!session) {
    const next = encodeURIComponent(location.pathname + location.search + location.hash);
    location.replace('/login.html?next=' + next);
    return null;
  }

  try {
    await dyseGetProfile(session);
  } catch (error) {
    alert('Não foi possível carregar seu perfil. Atualize a página ou tente novamente mais tarde.');
    return null;
  }

  if (reveal) dyseShowProtectedPage();
  return session;
}

async function dyseRequireStudent() {
  const session = await dyseRequireAuth({ reveal: false });
  if (!session) return null;

  const profile = await dyseGetProfile(session);

  if (dyseIsTeacherProfile(profile)) {
    location.replace(DYSE_TEACHER_HOME);
    return null;
  }

  dyseShowProtectedPage();
  return session;
}

async function dyseRequireTeacher() {
  const session = await dyseRequireAuth({ reveal: false });
  if (!session) return null;

  const profile = await dyseGetProfile(session);

  if (!dyseIsTeacherProfile(profile)) {
    alert('Esta página é exclusiva para professores.');
    location.replace(DYSE_STUDENT_HOME);
    return null;
  }

  dyseShowProtectedPage();
  return session;
}

async function dyseLogout() {
  const { error } = await sb.auth.signOut();
  if (error) console.error('DYSE: erro ao sair:', error);
  location.replace('/login.html');
}

/* ---------- Barra de autenticação ---------- */
async function dyseRenderAuthBar(containerId) {
  const el = document.getElementById(containerId);
  if (!el) return;

  const session = await dyseGetSession();
  if (!session) return;

  const profile = await dyseGetProfile(session);
  const metadata = session.user.user_metadata || {};
  const name = profile?.full_name || metadata.full_name || session.user.email;
  const isTeacher = dyseIsTeacherProfile(profile);
  const destination = isTeacher ? DYSE_TEACHER_HOME : DYSE_STUDENT_HOME;
  const linkText = isTeacher ? 'Painel da professora' : 'Minhas atividades';

  el.innerHTML =
    '<span class="dyse-auth-name">👤 ' + escapeHtml(name) + '</span>' +
    '<a href="' + destination + '" class="dyse-auth-link">' + linkText + '</a>' +
    '<button type="button" class="dyse-auth-logout" onclick="dyseLogout()">Sair</button>';
}

function escapeHtml(value) {
  const div = document.createElement('div');
  div.textContent = value || '';
  return div.innerHTML;
}

/* ---------- Progresso das atividades ---------- */
async function dyseSaveResult(course, activityNum, activityTheme, reportText, meta) {
  const session = await dyseGetSession();
  if (!session) return { error: 'not-authenticated' };

  const profile = await dyseGetProfile(session);

  // Professora pode revisar atividades, mas a revisão não vira resultado de aluno.
  if (dyseIsTeacherProfile(profile)) {
    return { error: null, skipped: 'teacher-preview' };
  }

  const payload = {
    user_id: session.user.id,
    student_name: profile?.full_name || session.user.user_metadata?.full_name || session.user.email,
    student_email: session.user.email,
    course: String(course),
    activity_num: Number(activityNum),
    activity_theme: activityTheme,
    report_text: reportText,
    meta: meta || {},
    updated_at: new Date().toISOString()
  };

  const { error } = await sb
    .from('activity_results')
    .upsert(payload, { onConflict: 'user_id,course,activity_num' });

  if (error) console.error('DYSE: erro ao salvar atividade:', error);
  return { error };
}

async function dyseLoadResult(course, activityNum) {
  const session = await dyseGetSession();
  if (!session) return null;

  const profile = await dyseGetProfile(session);
  if (dyseIsTeacherProfile(profile)) return null;

  const { data, error } = await sb
    .from('activity_results')
    .select('*')
    .eq('user_id', session.user.id)
    .eq('course', String(course))
    .eq('activity_num', Number(activityNum))
    .maybeSingle();

  if (error) {
    console.error('DYSE: erro ao carregar atividade:', error);
    return null;
  }

  return data;
}

async function dyseListMyResults(course) {
  const session = await dyseGetSession();
  if (!session) return [];

  let query = sb
    .from('activity_results')
    .select('course, activity_num, activity_theme, updated_at, meta')
    .eq('user_id', session.user.id);

  if (course) query = query.eq('course', String(course));

  const { data, error } = await query;

  if (error) {
    console.error('DYSE: erro ao listar resultados do aluno:', error);
    return [];
  }

  return data || [];
}

async function dyseListAllResults() {
  const session = await dyseGetSession();
  if (!session || !await dyseIsTeacher(session)) {
    return { data: [], error: new Error('Acesso exclusivo para professores.') };
  }

  const { data, error } = await sb
    .from('activity_results')
    .select('*')
    .order('updated_at', { ascending: false });

  if (error) console.error('DYSE: erro ao listar todos os resultados:', error);
  return { data: data || [], error };
}

/* ---------- Atividades publicadas ---------- */
async function dyseGetPublishedSet(course) {
  const { data, error } = await sb
    .from('published_activities')
    .select('activity_num, is_published')
    .eq('course', String(course));

  if (error) {
    console.error('DYSE: erro ao consultar atividades publicadas:', error);
    return new Set();
  }

  return new Set(
    (data || [])
      .filter(row => row.is_published === true)
      .map(row => Number(row.activity_num))
  );
}

async function dyseGetPublishedMap(course) {
  const { data, error } = await sb
    .from('published_activities')
    .select('activity_num, is_published')
    .eq('course', String(course));

  const map = {};

  if (error) {
    console.error('DYSE: erro ao carregar mapa de publicação:', error);
    return { map, error };
  }

  (data || []).forEach(row => {
    map[Number(row.activity_num)] = row.is_published === true;
  });

  return { map, error: null };
}

async function dyseSetPublished(course, activityNum, isPublished) {
  const session = await dyseGetSession();
  if (!session || !await dyseIsTeacher(session)) {
    return { error: new Error('Acesso exclusivo para professores.') };
  }

  const { error } = await sb
    .from('published_activities')
    .upsert(
      {
        course: String(course),
        activity_num: Number(activityNum),
        is_published: Boolean(isPublished),
        updated_at: new Date().toISOString()
      },
      { onConflict: 'course,activity_num' }
    );

  if (error) console.error('DYSE: erro ao alterar publicação:', error);
  return { error };
}

async function dyseRequirePublished(course, activityNum) {
  const session = await dyseGetSession();
  if (!session) return false;

  const profile = await dyseGetProfile(session);
  if (dyseIsTeacherProfile(profile)) return true;

  const published = await dyseGetPublishedSet(course);

  if (!published.has(Number(activityNum))) {
    alert('Esta atividade ainda não foi liberada pela professora.');
    location.replace(DYSE_STUDENT_HOME);
    return false;
  }

  return true;
}
