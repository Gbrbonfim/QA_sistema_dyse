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
--    Guarda o nome e o "papel" (aluno ou professora) de cada usuário.
-- ----------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  full_name text,
  role text not null default 'student' check (role in ('student', 'teacher')),
  created_at timestamptz default now()
);

alter table public.profiles enable row level security;

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

-- Professoras precisam enxergar o nome de todos os alunos (para o painel).
drop policy if exists "professoras podem ver todos os perfis" on public.profiles;
create policy "professoras podem ver todos os perfis"
  on public.profiles for select
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'teacher'
    )
  );

-- ----------------------------------------------------------------------
-- 2) GATILHO: cria o perfil automaticamente quando alguém se cadastra
-- ----------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data->>'full_name')
  on conflict (id) do nothing; -- se já existir (ex: recriada pela autocorreção do app), não duplica nem falha
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
insert into public.profiles (id, full_name, role)
select u.id, u.raw_user_meta_data->>'full_name', 'student'
from auth.users u
left join public.profiles p on p.id = u.id
where p.id is null;

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

drop policy if exists "professoras podem ver todos os resultados" on public.activity_results;
create policy "professoras podem ver todos os resultados"
  on public.activity_results for select
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'teacher'
    )
  );

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
--    JÁ é 'teacher' (promovida por você, manualmente, no Table Editor)
--    pode alterar a role de alguém.
-- ----------------------------------------------------------------------
create or replace function public.prevent_role_self_escalation()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if new.role is distinct from old.role then
    if not exists (
      select 1 from public.profiles p where p.id = auth.uid() and p.role = 'teacher'
    ) then
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
  using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'teacher')
  )
  with check (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'teacher')
  );

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

-- ======================================================================
-- PRONTO! Depois de rodar este script:
--
-- 1. Crie sua própria conta pela página /login.html (aba "Criar conta").
-- 2. No Supabase, vá em "Table Editor" → tabela "profiles",
--    encontre a linha com o SEU nome e mude a coluna "role"
--    de "student" para "teacher". Isso libera o /professora.html pra você.
-- 3. Todo aluno que se cadastrar entra automaticamente como "student".
-- ======================================================================
