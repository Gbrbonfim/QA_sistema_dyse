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
-- deste script, que só conhecia 'student'/'teacher'. "financeiro" é um
-- papel ACIMA de "admin": enxerga tudo que "admin" enxerga (turmas,
-- matérias, alunos, professores) e, além disso, o módulo Financeiro —
-- que "admin" sozinho NÃO acessa mais (ver 1.1 e a seção 9).
alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles add constraint profiles_role_check
  check (role in ('student', 'teacher', 'admin', 'financeiro'));

-- "auth.users" guarda o e-mail, mas o app (chave anônima) não consegue ler
-- essa tabela direto — por isso o e-mail também é copiado pra cá, pra
-- telas como a de gestão conseguirem listar/identificar alunos e professores.
alter table public.profiles add column if not exists email text;

-- Uma pessoa pode ser "admin" (gestão) E dar aula ao mesmo tempo — ex: uma
-- professora que também gerencia os demais professores. Como "role" é uma
-- coluna única (só um valor por vez), isso é resolvido com um flag à
-- parte em vez de trocar a role principal: ela continua "admin" (gerencia
-- turmas/professores/alunos normalmente) e, com "also_teacher" = true,
-- GANHA por cima tudo que um "teacher" tem (acesso a /professora.html,
-- gerenciar/publicar as próprias atividades, aparecer nas listas de
-- professor pra vínculo financeiro e turma). Ver is_teacher() logo abaixo.
alter table public.profiles add column if not exists also_teacher boolean not null default false;

-- Mesma ideia, agora pro caminho inverso: alguém de gestão/financeiro que
-- também é aluno (ex: faz as próprias atividades) e precisa acessar
-- /area-do-aluno.html sem perder o papel principal. Não precisa de uma
-- função is_student() própria porque nada na RLS distingue aluno por
-- role — activity_results já é liberado por auth.uid() = user_id pra
-- qualquer autenticado; este flag só destrava a NAVEGAÇÃO (login.html e
-- area-do-aluno.html bloqueiam admin/teacher por padrão, ver lá).
alter table public.profiles add column if not exists also_student boolean not null default false;

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
-- true pra quem TEM role = 'teacher' OU tem o flag also_teacher = true
-- (ver comentário em "also_teacher", acima) — ou seja, também vale pra um
-- "admin" que também dá aula.
create or replace function public.is_teacher()
returns boolean
language sql
stable
security definer set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and (lower(trim(role)) = 'teacher' or also_teacher = true)
  );
$$;

-- "financeiro" é hierarquicamente ACIMA de "admin" (ver comentário na
-- constraint da role, acima): por isso is_admin() aceita as duas roles —
-- toda política de gestão "normal" (turmas/matérias/alunos/professores)
-- usa is_admin() e continua liberada pra quem é "financeiro" também. Só as
-- políticas do módulo financeiro (seção 9) usam is_financeiro() — essa sim
-- estrita, só role = 'financeiro' — pra travar especificamente "admin".
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer set search_path = public
as $$
  select exists (
    select 1 from public.profiles where id = auth.uid() and lower(trim(role)) in ('admin', 'financeiro')
  );
$$;

create or replace function public.is_financeiro()
returns boolean
language sql
stable
security definer set search_path = public
as $$
  select exists (
    select 1 from public.profiles where id = auth.uid() and lower(trim(role)) = 'financeiro'
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

-- ----------------------------------------------------------------------
-- 9) MÓDULO FINANCEIRO
--    Valores pagos aos professores por modalidade (com histórico
--    versionado), vínculo financeiro aluno↔professor↔modalidade (com
--    histórico de períodos), mensalidades geradas por mês de competência,
--    pagamentos aos professores, gastos personalizados, fechamento
--    mensal (com trava) e auditoria. Importante: "modalidade" aqui é o
--    plano financeiro do aluno (VIP/Grupo/Dupla/Intensivo) — é um
--    conceito DIFERENTE de "turma" (que só controla acesso a matérias).
--    Os dois não se misturam.
--
--    Acesso: todas as tabelas/políticas de gestão desta seção usam
--    is_financeiro() (role = 'financeiro'), NÃO is_admin() — quem é só
--    "admin" (gestão comum) não tem acesso a nada daqui, nem pela tela nem
--    direto pela API. "financeiro" é um papel à parte, promovido manualmente
--    como qualquer outro (ver instruções no fim do arquivo).
-- ----------------------------------------------------------------------

-- 9.1) Modalidades (catálogo)
create table if not exists public.modalidades (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  is_custom_value boolean not null default false, -- true = "Intensivo": valor definido aluno a aluno, sem valor de catálogo
  created_at timestamptz default now()
);

alter table public.modalidades enable row level security;

drop policy if exists "qualquer usuario logado ve as modalidades" on public.modalidades;
create policy "qualquer usuario logado ve as modalidades"
  on public.modalidades for select
  using (auth.role() = 'authenticated');

drop policy if exists "admins gerenciam modalidades" on public.modalidades;
create policy "admins gerenciam modalidades"
  on public.modalidades for all
  using (public.is_financeiro())
  with check (public.is_financeiro());

insert into public.modalidades (slug, name, is_custom_value) values
  ('vip', 'VIP', false),
  ('grupo', 'Grupo', false),
  ('dupla', 'Dupla', false),
  ('intensivo', 'Intensivo', true)
on conflict (slug) do nothing;

-- 9.2) Valores pagos ao professor por modalidade — HISTÓRICO VERSIONADO.
--      Editar um valor NUNCA sobrescreve a linha anterior: insere uma nova
--      linha com "vigente_desde". O valor vigente num mês de competência é
--      sempre a linha de "vigente_desde" mais recente que seja <= aquele
--      mês — assim, mudar o valor só afeta meses correntes/futuros.
create table if not exists public.modalidade_valores (
  id bigint generated always as identity primary key,
  modalidade_id uuid not null references public.modalidades(id) on delete cascade,
  valor_professor numeric(10,2) not null,
  vigente_desde date not null default date_trunc('month', now())::date,
  criado_por uuid references auth.users(id),
  criado_em timestamptz default now()
);

create index if not exists idx_modalidade_valores_modalidade on public.modalidade_valores (modalidade_id, vigente_desde desc);

alter table public.modalidade_valores enable row level security;

-- Só professor(a) (pra ver a própria comissão) e financeiro têm motivo pra
-- ler os valores — "admin" comum e aluno ficam de fora (valor é dado
-- financeiro, não é um rótulo público como o nome da modalidade).
drop policy if exists "qualquer usuario logado ve os valores de modalidade" on public.modalidade_valores;
drop policy if exists "professor e financeiro veem os valores de modalidade" on public.modalidade_valores;
create policy "professor e financeiro veem os valores de modalidade"
  on public.modalidade_valores for select
  using (public.is_teacher() or public.is_financeiro());

drop policy if exists "admins gerenciam valores de modalidade" on public.modalidade_valores;
create policy "admins gerenciam valores de modalidade"
  on public.modalidade_valores for all
  using (public.is_financeiro())
  with check (public.is_financeiro());

-- Seed dos valores iniciais (só insere se a modalidade ainda não tiver
-- nenhum valor cadastrado — não sobrescreve edição já feita pela gestão).
-- "Intensivo" fica de fora: não tem valor de catálogo, é definido aluno a
-- aluno (campo "valor_professor_customizado" em aluno_financeiro_historico).
insert into public.modalidade_valores (modalidade_id, valor_professor, vigente_desde)
select m.id, v.valor, date_trunc('month', now())::date
from public.modalidades m
join (values ('vip', 200.00), ('grupo', 100.00), ('dupla', 150.00)) as v(slug, valor)
  on v.slug = m.slug
where not exists (select 1 from public.modalidade_valores mv where mv.modalidade_id = m.id);

-- 9.3) Vínculo financeiro aluno↔professor↔modalidade, por PERÍODO.
--      Cada linha é um período (data_inicio até data_fim, ou data_fim nula
--      = período aberto/atual). Trocar de professor ou de modalidade fecha
--      o período aberto (preenche data_fim) e abre um novo — o histórico
--      nunca é sobrescrito, então meses anteriores continuam corretos.
create table if not exists public.aluno_financeiro_historico (
  id bigint generated always as identity primary key,
  aluno_id uuid not null references auth.users(id) on delete cascade,
  professor_id uuid references auth.users(id) on delete set null,
  modalidade_id uuid not null references public.modalidades(id) on delete restrict,
  valor_mensal_aluno numeric(10,2) not null default 0,
  valor_professor_customizado numeric(10,2), -- só usado quando a modalidade é "Intensivo" (is_custom_value = true)
  situacao text not null default 'ativo' check (situacao in ('ativo','pausado','cancelado','encerrado')),
  data_inicio date not null default current_date,
  data_fim date,
  quantidade_parcelas int, -- nº de meses que o PROFESSOR recebe por este aluno a partir de data_inicio (ex: 6 = ago..jan); nulo = sem prazo definido
  observacao text,
  criado_por uuid references auth.users(id),
  criado_em timestamptz default now()
);
alter table public.aluno_financeiro_historico add column if not exists quantidade_parcelas int;

create index if not exists idx_aluno_financeiro_aluno on public.aluno_financeiro_historico (aluno_id, data_inicio desc);
create index if not exists idx_aluno_financeiro_professor on public.aluno_financeiro_historico (professor_id);

alter table public.aluno_financeiro_historico enable row level security;

drop policy if exists "professor ve historico dos proprios alunos" on public.aluno_financeiro_historico;
create policy "professor ve historico dos proprios alunos"
  on public.aluno_financeiro_historico for select
  using (professor_id = auth.uid());

drop policy if exists "admins gerenciam historico financeiro dos alunos" on public.aluno_financeiro_historico;
create policy "admins gerenciam historico financeiro dos alunos"
  on public.aluno_financeiro_historico for all
  using (public.is_financeiro())
  with check (public.is_financeiro());

-- 9.4) Fechamento mensal (controle de qual mês de competência está
--      travado para alteração).
create table if not exists public.fechamentos_mensais (
  id bigint generated always as identity primary key,
  mes_competencia date not null unique,
  fechado_em timestamptz,
  fechado_por uuid references auth.users(id),
  reaberto_em timestamptz,
  reaberto_por uuid references auth.users(id),
  observacao text
);

alter table public.fechamentos_mensais enable row level security;

drop policy if exists "admins gerenciam fechamentos mensais" on public.fechamentos_mensais;
create policy "admins gerenciam fechamentos mensais"
  on public.fechamentos_mensais for all
  using (public.is_financeiro())
  with check (public.is_financeiro());

-- "security definer": lida dentro do trigger de trava (9.8) e pode ser
-- chamada por qualquer usuário autenticado sem expor a tabela inteira.
create or replace function public.mes_esta_fechado(check_mes date)
returns boolean
language sql
stable
security definer set search_path = public
as $$
  select exists (
    select 1 from public.fechamentos_mensais
    where mes_competencia = date_trunc('month', check_mes)::date
      and fechado_em is not null
  );
$$;

-- 9.5) Mensalidades — o "razão" mensal por aluno, gerado a partir do
--      histórico (9.3) e dos valores de modalidade (9.2). É esta tabela
--      que fica CONGELADA quando o mês é fechado (ver 9.8). O status de
--      pagamento em si (se o professor já recebeu) fica em
--      "pagamentos_professores" (9.6), por professor+mês — não por aluno,
--      pra não duplicar a mesma informação em dois lugares.
create table if not exists public.mensalidades (
  id bigint generated always as identity primary key,
  aluno_id uuid not null references auth.users(id) on delete cascade,
  aluno_nome text, -- copiado do perfil na geração: a RLS de "profiles" só libera pro professor os alunos
                    -- das turmas dele (controle de acesso a matéria), que é um escopo DIFERENTE do vínculo
                    -- financeiro (por professor_id, direto nesta tabela) — sem essa cópia, um aluno vinculado
                    -- financeiramente mas fora das turmas do professor apareceria sem nome no painel dele.
                    -- Mesmo padrão já usado em activity_results.student_name/student_email.
  mes_competencia date not null,
  professor_id uuid references auth.users(id) on delete set null,
  modalidade_id uuid references public.modalidades(id) on delete set null,
  valor_recebido numeric(10,2) not null default 0,      -- valor mensal pago pelo aluno naquele mês
  valor_pago_professor numeric(10,2) not null default 0, -- comissão calculada pra este aluno naquele mês
  observacoes text,
  fechado boolean not null default false, -- espelha fechamentos_mensais, só pra exibição rápida sem join extra
  atualizado_em timestamptz default now(),
  unique (aluno_id, mes_competencia)
);

create index if not exists idx_mensalidades_mes on public.mensalidades (mes_competencia);
create index if not exists idx_mensalidades_professor on public.mensalidades (professor_id, mes_competencia);

alter table public.mensalidades enable row level security;

drop policy if exists "professor ve as proprias mensalidades" on public.mensalidades;
create policy "professor ve as proprias mensalidades"
  on public.mensalidades for select
  using (professor_id = auth.uid());

drop policy if exists "admins gerenciam mensalidades" on public.mensalidades;
create policy "admins gerenciam mensalidades"
  on public.mensalidades for all
  using (public.is_financeiro())
  with check (public.is_financeiro());

-- 9.6) Pagamentos aos professores — um registro por professor+mês (não por
--      aluno). "Total previsto" não é armazenado aqui: é sempre a soma ao
--      vivo de mensalidades.valor_pago_professor daquele professor/mês.
create table if not exists public.pagamentos_professores (
  id bigint generated always as identity primary key,
  professor_id uuid not null references auth.users(id) on delete cascade,
  mes_competencia date not null,
  status text not null default 'pendente' check (status in ('pendente','pago','pago_parcial','cancelado')),
  valor_pago numeric(10,2),
  data_pagamento date,
  observacoes text,
  atualizado_por uuid references auth.users(id),
  atualizado_em timestamptz default now(),
  unique (professor_id, mes_competencia)
);

create index if not exists idx_pagamentos_professor_mes on public.pagamentos_professores (professor_id, mes_competencia);

alter table public.pagamentos_professores enable row level security;

drop policy if exists "professor ve os proprios pagamentos" on public.pagamentos_professores;
create policy "professor ve os proprios pagamentos"
  on public.pagamentos_professores for select
  using (professor_id = auth.uid());

drop policy if exists "admins gerenciam pagamentos de professores" on public.pagamentos_professores;
create policy "admins gerenciam pagamentos de professores"
  on public.pagamentos_professores for all
  using (public.is_financeiro())
  with check (public.is_financeiro());

-- 9.7) Gastos personalizados — por aluno + mês. "valor" pode ser negativo
--      (estorno/desconto). Quando forma_calculo = 'percentual', "valor" é
--      a taxa em % (ex: 10.00 = 10%) calculada sobre mensalidades.valor_recebido
--      na hora de montar o relatório (não fica armazenado, pra nunca ficar
--      desatualizado se o valor recebido mudar enquanto o mês está aberto).
--      Só a gestão usa esta tabela — não faz parte do painel do professor.
create table if not exists public.gastos_personalizados (
  id bigint generated always as identity primary key,
  aluno_id uuid not null references auth.users(id) on delete cascade,
  mes_competencia date not null,
  descricao text not null,
  tipo text not null default 'outro',
  forma_calculo text not null check (forma_calculo in ('fixo','percentual')),
  valor numeric(10,2) not null,
  observacao text,
  fechado boolean not null default false,
  criado_por uuid references auth.users(id),
  criado_em timestamptz default now()
);

create index if not exists idx_gastos_aluno_mes on public.gastos_personalizados (aluno_id, mes_competencia);

alter table public.gastos_personalizados enable row level security;

drop policy if exists "admins gerenciam gastos personalizados" on public.gastos_personalizados;
create policy "admins gerenciam gastos personalizados"
  on public.gastos_personalizados for all
  using (public.is_financeiro())
  with check (public.is_financeiro());

-- 9.8) TRAVA DE MÊS FECHADO — bloqueia qualquer INSERT/UPDATE/DELETE em
--      mensalidades, gastos_personalizados e pagamentos_professores se o
--      mês de competência daquela linha já estiver fechado. Pra alterar,
--      é preciso reabrir o mês antes (9.9 é feito pela tela, que limpa
--      fechado_em em fechamentos_mensais antes de liberar a edição).
create or replace function public.bloqueia_alteracao_mes_fechado()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  check_mes date;
begin
  if TG_OP = 'DELETE' then
    check_mes := old.mes_competencia;
  else
    check_mes := new.mes_competencia;
  end if;

  if public.mes_esta_fechado(check_mes) then
    raise exception 'O mês % está fechado para alterações. Reabra o mês antes de continuar.', to_char(check_mes, 'MM/YYYY');
  end if;

  if TG_OP = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_bloqueia_mensalidade_fechada on public.mensalidades;
create trigger trg_bloqueia_mensalidade_fechada
  before insert or update or delete on public.mensalidades
  for each row execute procedure public.bloqueia_alteracao_mes_fechado();

drop trigger if exists trg_bloqueia_gasto_fechado on public.gastos_personalizados;
create trigger trg_bloqueia_gasto_fechado
  before insert or update or delete on public.gastos_personalizados
  for each row execute procedure public.bloqueia_alteracao_mes_fechado();

drop trigger if exists trg_bloqueia_pagamento_fechado on public.pagamentos_professores;
create trigger trg_bloqueia_pagamento_fechado
  before insert or update or delete on public.pagamentos_professores
  for each row execute procedure public.bloqueia_alteracao_mes_fechado();

-- 9.9) AUDITORIA — log genérico (trigger, não só JS) anexado nas tabelas
--      financeiras. É trigger de banco (não só a tela) porque a gestão às
--      vezes edita direto pelo Table Editor do Supabase (é o próprio fluxo
--      documentado neste arquivo pra promover role) — um log só em JS
--      perderia esses casos.
create table if not exists public.financeiro_auditoria (
  id bigint generated always as identity primary key,
  tabela text not null,
  registro_id text,
  acao text not null,
  usuario_id uuid references auth.users(id),
  dados_antes jsonb,
  dados_depois jsonb,
  criado_em timestamptz default now()
);

create index if not exists idx_financeiro_auditoria_tabela on public.financeiro_auditoria (tabela, criado_em desc);

alter table public.financeiro_auditoria enable row level security;

drop policy if exists "admins veem a auditoria financeira" on public.financeiro_auditoria;
create policy "admins veem a auditoria financeira"
  on public.financeiro_auditoria for select
  using (public.is_financeiro());

create or replace function public.log_financeiro_auditoria()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  rec_id text;
begin
  if TG_OP = 'DELETE' then
    rec_id := (to_jsonb(old)->>'id');
  else
    rec_id := (to_jsonb(new)->>'id');
  end if;

  insert into public.financeiro_auditoria (tabela, registro_id, acao, usuario_id, dados_antes, dados_depois)
  values (
    TG_TABLE_NAME,
    rec_id,
    lower(TG_OP),
    auth.uid(),
    case when TG_OP in ('UPDATE','DELETE') then to_jsonb(old) else null end,
    case when TG_OP in ('UPDATE','INSERT') then to_jsonb(new) else null end
  );

  if TG_OP = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_audit_modalidades on public.modalidades;
create trigger trg_audit_modalidades
  after insert or update or delete on public.modalidades
  for each row execute procedure public.log_financeiro_auditoria();

drop trigger if exists trg_audit_modalidade_valores on public.modalidade_valores;
create trigger trg_audit_modalidade_valores
  after insert or update or delete on public.modalidade_valores
  for each row execute procedure public.log_financeiro_auditoria();

drop trigger if exists trg_audit_aluno_financeiro_historico on public.aluno_financeiro_historico;
create trigger trg_audit_aluno_financeiro_historico
  after insert or update or delete on public.aluno_financeiro_historico
  for each row execute procedure public.log_financeiro_auditoria();

drop trigger if exists trg_audit_mensalidades on public.mensalidades;
create trigger trg_audit_mensalidades
  after insert or update or delete on public.mensalidades
  for each row execute procedure public.log_financeiro_auditoria();

drop trigger if exists trg_audit_pagamentos_professores on public.pagamentos_professores;
create trigger trg_audit_pagamentos_professores
  after insert or update or delete on public.pagamentos_professores
  for each row execute procedure public.log_financeiro_auditoria();

drop trigger if exists trg_audit_gastos_personalizados on public.gastos_personalizados;
create trigger trg_audit_gastos_personalizados
  after insert or update or delete on public.gastos_personalizados
  for each row execute procedure public.log_financeiro_auditoria();

drop trigger if exists trg_audit_fechamentos_mensais on public.fechamentos_mensais;
create trigger trg_audit_fechamentos_mensais
  after insert or update or delete on public.fechamentos_mensais
  for each row execute procedure public.log_financeiro_auditoria();

-- ----------------------------------------------------------------------
-- 9.10) GASTOS PADRÃO — despesas que se aplicam automaticamente a TODOS os
--       alunos ativos, todo mês (ex: assinatura do Flexge por aluno). É um
--       catálogo (como "modalidades"); ao gerar as mensalidades do mês
--       (dyseGerarMensalidadesDoMes), o sistema materializa uma linha em
--       gastos_personalizados por (aluno ativo × gasto padrão ativo),
--       marcada com "gasto_padrao_id" pra nunca duplicar em gerações
--       seguintes. Gastos lançados manualmente continuam com
--       "gasto_padrao_id" nulo e não são afetados por isto.
-- ----------------------------------------------------------------------
create table if not exists public.gastos_padrao (
  id bigint generated always as identity primary key,
  descricao text not null,
  tipo text not null default 'outro',
  forma_calculo text not null check (forma_calculo in ('fixo','percentual')),
  valor numeric(10,2) not null,
  ativo boolean not null default true,
  criado_por uuid references auth.users(id),
  criado_em timestamptz default now()
);

alter table public.gastos_padrao enable row level security;

drop policy if exists "admins gerenciam gastos padrao" on public.gastos_padrao;
create policy "admins gerenciam gastos padrao"
  on public.gastos_padrao for all
  using (public.is_financeiro())
  with check (public.is_financeiro());

drop trigger if exists trg_audit_gastos_padrao on public.gastos_padrao;
create trigger trg_audit_gastos_padrao
  after insert or update or delete on public.gastos_padrao
  for each row execute procedure public.log_financeiro_auditoria();

alter table public.gastos_personalizados add column if not exists gasto_padrao_id bigint references public.gastos_padrao(id) on delete cascade;
alter table public.gastos_personalizados drop constraint if exists gastos_personalizados_aluno_mes_padrao_key;
alter table public.gastos_personalizados add constraint gastos_personalizados_aluno_mes_padrao_key unique (aluno_id, mes_competencia, gasto_padrao_id);

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
--    Alguém que é "admin" e TAMBÉM dá aula (ex: uma professora que também
--    faz parte da gestão): não mude a role dela pra "teacher" (perderia o
--    acesso de gestão) — em vez disso, na mesma linha, marque a coluna
--    "also_teacher" como "true". Ela continua entrando por padrão em
--    /gestao.html, e o botão "Painel da professora" que aparece pra ela lá
--    (e em toda página) leva pra /professora.html, onde ela vê e gerencia
--    as próprias turmas/atividades/financeiro normalmente.
--    Mesma lógica pro caminho inverso — alguém de gestão/financeiro/professor
--    que TAMBÉM é aluno (faz as próprias atividades): marque "also_student"
--    como "true" na linha da pessoa. Ela continua entrando por padrão no
--    painel principal dela, e ganha o link "Minhas atividades" (leva pra
--    /area-do-aluno.html). Sem turma vinculada (aba Alunos → vincular
--    turma) ela não vê nenhuma matéria liberada lá, igual qualquer aluno.
-- 3. Todo aluno que se cadastrar entra automaticamente como "student", SEM
--    turma — use o /gestao.html (aba Alunos) pra vincular cada um a uma
--    turma. Sem turma, o aluno não enxerga nenhuma matéria liberada.
-- 4. Módulo financeiro: só quem tem a role "financeiro" enxerga a aba
--    Financeiro do /gestao.html (e a coluna/filtros financeiros na aba
--    Alunos) — "admin" comum não vê mais. Pra liberar alguém (inclusive
--    você mesmo, além da conta "admin"), mude a coluna "role" da pessoa
--    pra "financeiro" no Table Editor, do mesmo jeito do passo 2. Uma vez
--    lá, vincule cada aluno a um professor responsável e uma modalidade
--    (VIP/Grupo/Dupla/Intensivo). Os valores pagos ao professor por
--    modalidade já vêm com R$200 (VIP) / R$100 (Grupo) / R$150 (Dupla) —
--    "Intensivo" não tem valor de catálogo, é definido aluno a aluno na
--    hora do vínculo.
-- ======================================================================
