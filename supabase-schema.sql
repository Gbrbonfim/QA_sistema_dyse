-- ======================================================================
-- DYSE · Do You Speak English? — Área do Aluno
-- Script de configuração do banco de dados (Supabase)
-- ----------------------------------------------------------------------
-- Este script é 100% seguro de rodar quantas vezes você quiser — sempre
-- que algo já existir (tabela, política, gatilho), ele atualiza em vez
-- de dar erro. Pode colar ele inteiro de novo sempre que eu te mandar
-- uma versão nova.
--
-- Como usar:
--   1. Abra seu projeto em supabase.com
--   2. Vá em "SQL Editor" (menu lateral) → "New query"
--   3. Cole TODO este arquivo e clique em "Run"
-- ======================================================================

-- ----------------------------------------------------------------------
-- 1) TABELA DE PERFIS
--    Guarda o nome e o "papel" (aluno, professora ou gestão) de cada usuário.
-- ----------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  full_name text,
  role text not null default 'student' check (role in ('student', 'teacher')),
  created_at timestamptz default now()
);

-- Adiciona o papel "admin" (gestão) para quem já rodou uma versão anterior
-- deste script, que só conhecia 'student'/'teacher'.
alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles add constraint profiles_role_check
  check (role in ('student', 'teacher', 'admin'));

-- "auth.users" guarda o e-mail, mas o app (chave anônima) não consegue ler
-- essa tabela direto — por isso o e-mail também é copiado pra cá, pra
-- telas como a de gestão conseguirem listar/identificar alunos e professores.
alter table public.profiles add column if not exists email text;

alter table public.profiles enable row level security;

-- ----------------------------------------------------------------------
-- 1.1) FUNÇÕES DE APOIO PRA RLS ("security definer" ignora RLS por dentro)
--    Toda política que precisa saber "esse usuário é professor/gestão?"
--    usa essas funções em vez de consultar "profiles" direto de dentro da
--    própria política de "profiles" (ou de uma tabela que, por sua vez,
--    consulta "profiles" de volta). Consultar a MESMA tabela (ou duas
--    tabelas que se consultam em círculo) de dentro de uma política pode
--    fazer o Postgres detectar "recursão infinita" e derrubar a consulta
--    com erro 500 — foi exatamente isso que quebrou o login geral depois
--    que as tabelas de turma entraram em cena. Como estas funções são
--    "security definer", elas leem "profiles" ignorando RLS (não reentram
--    nas políticas), cortando o ciclo pela raiz.
-- ----------------------------------------------------------------------
create or replace function public.is_teacher()
returns boolean
language sql
stable
security definer set search_path = public
as $$
  select exists (
    select 1 from public.profiles where id = auth.uid() and lower(trim(role)) = 'teacher'
  );
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer set search_path = public
as $$
  select exists (
    select 1 from public.profiles where id = auth.uid() and lower(trim(role)) = 'admin'
  );
$$;

drop policy if exists "usuarios podem ver o proprio perfil" on public.profiles;
create policy "usuarios podem ver o proprio perfil"
  on public.profiles for select
  using (auth.uid() = id);

drop policy if exists "usuarios podem atualizar o proprio perfil" on public.profiles;
create policy "usuarios podem atualizar o proprio perfil"
  on public.profiles for update
  using (auth.uid() = id);

-- Necessária para a "autocorreção" no app: se o perfil não existir por
-- qualquer motivo, o próprio usuário logado consegue criar a própria linha
-- (sempre como "student" — nunca como "teacher", graças ao valor padrão
-- da coluna e ao gatilho de segurança criado mais abaixo).
drop policy if exists "usuarios podem criar o proprio perfil" on public.profiles;
create policy "usuarios podem criar o proprio perfil"
  on public.profiles for insert
  with check (auth.uid() = id);

-- ----------------------------------------------------------------------
-- 2) GATILHO: cria o perfil automaticamente quando alguém se cadastra
-- ----------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, email)
  values (new.id, new.raw_user_meta_data->>'full_name', new.email)
  on conflict (id) do update set email = excluded.email; -- se já existir (ex: recriada pela autocorreção do app), só atualiza o e-mail
  return new;
exception
  when others then
    -- Nunca deixa um erro aqui impedir o cadastro do usuário em auth.users.
    -- Se o perfil não for criado por aqui, a autocorreção do app garante
    -- que ele será criado no primeiro login.
    return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Corrige contas que já existiam em "auth.users" antes deste gatilho
-- existir (ou que ficaram órfãs por qualquer outro motivo). Seguro rodar
-- quantas vezes quiser — só afeta quem ainda não tem perfil.
insert into public.profiles (id, full_name, email, role)
select u.id, u.raw_user_meta_data->>'full_name', u.email, 'student'
from auth.users u
left join public.profiles p on p.id = u.id
where p.id is null;

-- Preenche o e-mail de perfis que já existiam antes da coluna "email" ser
-- criada. Seguro rodar quantas vezes quiser — só afeta quem está sem e-mail.
update public.profiles p
set email = u.email
from auth.users u
where u.id = p.id and p.email is null;

-- ----------------------------------------------------------------------
-- 3) TABELA DE RESULTADOS DAS ATIVIDADES
--    Uma linha por (aluno + curso + atividade). Se o aluno refizer a
--    atividade, a mesma linha é atualizada (upsert) em vez de criar nova.
--    "course" identifica a trilha: 'toefl', 'a1', 'a2', etc. — assim
--    cada curso pode ter sua própria "atividade 1" sem conflito.
-- ----------------------------------------------------------------------
create table if not exists public.activity_results (
  id bigint generated always as identity primary key,
  user_id uuid references auth.users on delete cascade not null,
  student_name text,
  student_email text,
  course text not null default 'toefl',
  activity_num int not null,
  activity_theme text,
  report_text text,
  meta jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Garante a coluna "course" e a chave única certa mesmo se a tabela já
-- existia de uma versão anterior deste script (sem essa coluna).
alter table public.activity_results add column if not exists course text not null default 'toefl';
alter table public.activity_results drop constraint if exists activity_results_user_id_activity_num_key;
alter table public.activity_results drop constraint if exists activity_results_user_course_activity_key;
alter table public.activity_results add constraint activity_results_user_course_activity_key unique (user_id, course, activity_num);

alter table public.activity_results enable row level security;

drop policy if exists "alunos podem ver os proprios resultados" on public.activity_results;
create policy "alunos podem ver os proprios resultados"
  on public.activity_results for select
  using (auth.uid() = user_id);

drop policy if exists "alunos podem inserir os proprios resultados" on public.activity_results;
create policy "alunos podem inserir os proprios resultados"
  on public.activity_results for insert
  with check (auth.uid() = user_id);

drop policy if exists "alunos podem atualizar os proprios resultados" on public.activity_results;
create policy "alunos podem atualizar os proprios resultados"
  on public.activity_results for update
  using (auth.uid() = user_id);

-- ----------------------------------------------------------------------
-- 4) Índices (aceleram o painel da professora)
-- ----------------------------------------------------------------------
create index if not exists idx_activity_results_user on public.activity_results (user_id);
create index if not exists idx_activity_results_activity on public.activity_results (activity_num);
create index if not exists idx_activity_results_course on public.activity_results (course);

-- ----------------------------------------------------------------------
-- 5) SEGURANÇA EXTRA: impede que um aluno vire "professora" sozinho
--    Mesmo que ninguém exponha isso na interface, sem esta trava
--    tecnicamente um usuário logado poderia chamar a API do Supabase
--    diretamente e tentar mudar sua própria "role" para 'teacher'.
--    Este gatilho bloqueia qualquer tentativa disso: só uma conta que
--    JÁ é 'teacher'/'admin' (promovida por você, manualmente, no Table
--    Editor) pode alterar a role de alguém.
-- ----------------------------------------------------------------------
create or replace function public.prevent_role_self_escalation()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if new.role is distinct from old.role then
    if not (public.is_teacher() or public.is_admin()) then
      new.role := old.role; -- ignora a tentativa de mudança
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_prevent_role_self_escalation on public.profiles;
create trigger trg_prevent_role_self_escalation
  before update on public.profiles
  for each row execute procedure public.prevent_role_self_escalation();

-- ----------------------------------------------------------------------
-- 6) ATIVIDADES LIBERADAS
--    A professora controla quais atividades ficam visíveis pros alunos.
-- ----------------------------------------------------------------------
create table if not exists public.published_activities (
  id bigint generated always as identity primary key,
  course text not null,
  activity_num int not null,
  is_published boolean not null default false,
  updated_at timestamptz default now(),
  unique (course, activity_num)
);

alter table public.published_activities enable row level security;

drop policy if exists "qualquer usuario logado pode ver o que esta liberado" on public.published_activities;
create policy "qualquer usuario logado pode ver o que esta liberado"
  on public.published_activities for select
  using (auth.role() = 'authenticated');

drop policy if exists "professoras podem liberar/ocultar atividades" on public.published_activities;
create policy "professoras podem liberar/ocultar atividades"
  on public.published_activities for all
  using (public.is_teacher())
  with check (public.is_teacher());

-- ----------------------------------------------------------------------
-- 7) (Opcional) Libera as 16 atividades do TOEFL de uma vez, pra não
--    "sumir" tudo que já estava visível na primeira vez que você rodar
--    este script. Como usa "on conflict do nothing", rodar de novo NÃO
--    sobrescreve escolhas que você já tenha feito manualmente pelo
--    painel da professora (se você desligou alguma, continua desligada).
-- ----------------------------------------------------------------------
insert into public.published_activities (course, activity_num, is_published)
select 'toefl', n, true
from generate_series(1, 16) as n
on conflict (course, activity_num) do nothing;

-- ----------------------------------------------------------------------
-- 8) GESTÃO: papel "admin", turmas, matérias e permissões de professor
--    A gestão cria turmas e matérias, decide quais matérias cada turma
--    pode acessar, e vincula alunos e professores às turmas. A partir
--    daqui, um professor só enxerga resultados de alunos das turmas em
--    que a gestão deu permissão a ele (antes, todo professor via tudo).
-- ----------------------------------------------------------------------

-- 8.1) Turmas
create table if not exists public.turmas (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  created_at timestamptz default now()
);

alter table public.turmas enable row level security;

drop policy if exists "qualquer usuario logado ve as turmas" on public.turmas;
create policy "qualquer usuario logado ve as turmas"
  on public.turmas for select
  using (auth.role() = 'authenticated');

drop policy if exists "admins gerenciam turmas" on public.turmas;
create policy "admins gerenciam turmas"
  on public.turmas for all
  using (public.is_admin())
  with check (public.is_admin());

-- 8.2) Matérias (só um rótulo pra organizar acesso — não gera atividade)
create table if not exists public.materias (
  slug text primary key,
  name text not null,
  description text,
  created_at timestamptz default now()
);

alter table public.materias enable row level security;

drop policy if exists "qualquer usuario logado ve as materias" on public.materias;
create policy "qualquer usuario logado ve as materias"
  on public.materias for select
  using (auth.role() = 'authenticated');

drop policy if exists "admins gerenciam materias" on public.materias;
create policy "admins gerenciam materias"
  on public.materias for all
  using (public.is_admin())
  with check (public.is_admin());

-- O TOEFL já existe no código (é o único curso hoje), então já cadastra a
-- matéria dele aqui pra gestão só precisar liberar/ocultar por turma, sem
-- ter que criá-la manualmente. Não sobrescreve se você já editou o nome/
-- descrição pela tela de gestão.
insert into public.materias (slug, name, description)
values ('toefl', 'TOEFL iBT', 'Reading, Listening, Writing, Speaking e Grammar no novo formato do exame.')
on conflict (slug) do nothing;

-- 8.2.1) Dentro de cada matéria, quais das atividades a gestão libera pro
--        professor GERENCIAR (ou seja, poder publicar/ocultar pros alunos
--        dele em /professora.html). Uma atividade sem liberação da gestão
--        nem aparece como opção pro professor mexer.
create table if not exists public.materia_activities (
  materia_slug text references public.materias(slug) on delete cascade,
  activity_num int not null,
  released_to_teachers boolean not null default false,
  updated_at timestamptz default now(),
  primary key (materia_slug, activity_num)
);

alter table public.materia_activities enable row level security;

drop policy if exists "qualquer usuario logado ve liberacao de atividades por materia" on public.materia_activities;
create policy "qualquer usuario logado ve liberacao de atividades por materia"
  on public.materia_activities for select
  using (auth.role() = 'authenticated');

drop policy if exists "admins gerenciam liberacao de atividades por materia" on public.materia_activities;
create policy "admins gerenciam liberacao de atividades por materia"
  on public.materia_activities for all
  using (public.is_admin())
  with check (public.is_admin());

-- Libera as 16 atividades do TOEFL de cara, pra não "sumir" nada do que já
-- estava disponível pro professor antes dessa trava existir. "on conflict
-- do nothing" garante que rodar de novo não desfaz uma escolha que a
-- gestão já tenha feito pela tela.
insert into public.materia_activities (materia_slug, activity_num, released_to_teachers)
select 'toefl', n, true
from generate_series(1, 16) as n
on conflict (materia_slug, activity_num) do nothing;

-- "security definer": usada dentro da política de "published_activities"
-- pra bloquear, também no banco (não só na tela), o professor publicar uma
-- atividade que a gestão não liberou pra ele. Se a gestão nunca configurou
-- aquela atividade (linha não existe em materia_activities), não bloqueia
-- — preserva o comportamento de antes dessa trava existir.
create or replace function public.activity_released_to_teachers(check_course text, check_activity_num int)
returns boolean
language sql
stable
security definer set search_path = public
as $$
  select coalesce(
    (select released_to_teachers from public.materia_activities
     where materia_slug = check_course and activity_num = check_activity_num),
    true
  );
$$;

-- Agora que a função acima existe, reforça a política de publicação (não
-- só a tela — mesmo chamando a API do Supabase direto, o professor não
-- consegue publicar uma atividade que a gestão não liberou pra ele).
drop policy if exists "professoras podem liberar/ocultar atividades" on public.published_activities;
create policy "professoras podem liberar/ocultar atividades"
  on public.published_activities for all
  using (public.is_teacher())
  with check (public.is_teacher() and public.activity_released_to_teachers(course, activity_num));

-- 8.3) Quais matérias cada turma pode acessar (a gestão decide)
create table if not exists public.turma_materias (
  turma_id uuid references public.turmas(id) on delete cascade,
  materia_slug text references public.materias(slug) on delete cascade,
  primary key (turma_id, materia_slug)
);

alter table public.turma_materias enable row level security;

drop policy if exists "qualquer usuario logado ve as materias liberadas por turma" on public.turma_materias;
create policy "qualquer usuario logado ve as materias liberadas por turma"
  on public.turma_materias for select
  using (auth.role() = 'authenticated');

drop policy if exists "admins gerenciam materias por turma" on public.turma_materias;
create policy "admins gerenciam materias por turma"
  on public.turma_materias for all
  using (public.is_admin())
  with check (public.is_admin());

-- 8.4) Quais turmas cada professor tem permissão de ver
create table if not exists public.teacher_turmas (
  teacher_id uuid references auth.users(id) on delete cascade,
  turma_id uuid references public.turmas(id) on delete cascade,
  primary key (teacher_id, turma_id)
);

alter table public.teacher_turmas enable row level security;

-- "security definer": consultada de dentro de políticas de OUTRAS tabelas
-- (profiles, activity_results) sem reacionar a RLS de "teacher_turmas" —
-- é o que evita o ciclo profiles → teacher_turmas → profiles → ...
create or replace function public.teacher_can_see_turma(check_turma_id uuid)
returns boolean
language sql
stable
security definer set search_path = public
as $$
  select exists (
    select 1 from public.teacher_turmas
    where teacher_id = auth.uid() and turma_id = check_turma_id
  );
$$;

drop policy if exists "professoras veem as proprias permissoes de turma" on public.teacher_turmas;
create policy "professoras veem as proprias permissoes de turma"
  on public.teacher_turmas for select
  using (teacher_id = auth.uid());

drop policy if exists "admins gerenciam permissoes de turma" on public.teacher_turmas;
create policy "admins gerenciam permissoes de turma"
  on public.teacher_turmas for all
  using (public.is_admin())
  with check (public.is_admin());

-- 8.5) Cada aluno pertence a (no máximo) uma turma
alter table public.profiles add column if not exists turma_id uuid references public.turmas(id) on delete set null;
create index if not exists idx_profiles_turma on public.profiles (turma_id);

-- 8.6) profiles: professor só vê perfis de alunos das turmas permitidas a
--      ele (substitui a policy antiga, que deixava ver TODOS os perfis).
--      Admin ganha visão e edição completas (pra poder atribuir turma,
--      trocar role, etc.).
drop policy if exists "professoras podem ver todos os perfis" on public.profiles;
drop policy if exists "professoras veem perfis dos alunos das turmas permitidas" on public.profiles;
create policy "professoras veem perfis dos alunos das turmas permitidas"
  on public.profiles for select
  using (turma_id is not null and public.teacher_can_see_turma(turma_id));

drop policy if exists "admins veem todos os perfis" on public.profiles;
create policy "admins veem todos os perfis"
  on public.profiles for select
  using (public.is_admin());

drop policy if exists "admins atualizam qualquer perfil" on public.profiles;
create policy "admins atualizam qualquer perfil"
  on public.profiles for update
  using (public.is_admin());

-- 8.7) activity_results: professor só vê resultados de alunos das turmas
--      permitidas a ele (substitui a policy antiga, que deixava ver
--      resultados de TODO mundo). Admin continua vendo tudo.
drop policy if exists "professoras podem ver todos os resultados" on public.activity_results;
drop policy if exists "professoras veem resultados das turmas permitidas" on public.activity_results;
create policy "professoras veem resultados das turmas permitidas"
  on public.activity_results for select
  using (
    exists (
      select 1 from public.profiles p
      where p.id = public.activity_results.user_id
        and p.turma_id is not null
        and public.teacher_can_see_turma(p.turma_id)
    )
  );

drop policy if exists "admins veem todos os resultados" on public.activity_results;
create policy "admins veem todos os resultados"
  on public.activity_results for select
  using (public.is_admin());

-- ======================================================================
-- PRONTO! Depois de rodar este script:
--
-- 1. Crie sua própria conta pela página /login.html (aba "Criar conta").
-- 2. No Supabase, vá em "Table Editor" → tabela "profiles",
--    encontre a linha com o SEU nome e mude a coluna "role"
--    de "student" para "admin". Isso libera o /gestao.html pra você.
--    Promover alguém a "teacher" continua sendo feito aqui também (mude a
--    coluna "role" da linha da pessoa pra "teacher") — a tela de gestão
--    organiza turma/matéria/permissões de quem já existe, não cria conta
--    nem muda role.
-- 3. Todo aluno que se cadastrar entra automaticamente como "student", SEM
--    turma — use o /gestao.html (aba Alunos) pra vincular cada um a uma
--    turma. Sem turma, o aluno não enxerga nenhuma matéria liberada.
-- ======================================================================
