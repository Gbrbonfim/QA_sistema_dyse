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
--
--    Exceção: quando auth.uid() é nulo, a alteração NÃO veio de uma sessão
--    de usuário comum (aluno/professor logado pelo app) — só chega assim
--    quando é feita com a service_role key, do lado do servidor (ver
--    api/create-teacher.js). Como essas rotas já checam "quem chamou é
--    admin/financeiro" antes de mexer no banco, é seguro deixar passar;
--    sem essa exceção, o próprio cadastro de professor pela gestão ficava
--    bloqueado (a role voltava pra "student" sozinha, silenciosamente).
-- ----------------------------------------------------------------------
create or replace function public.prevent_role_self_escalation()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if new.role is distinct from old.role then
    if auth.uid() is not null and not (public.is_teacher() or public.is_admin()) then
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
--    O INSERT em si fica lá na seção 15.1 — depois que a coluna "aula"
--    existe e a chave única já é (course, aula, activity_num), pra não
--    quebrar num "on conflict" que não bate mais com a constraint atual
--    numa segunda execução deste script (ver comentário na seção 15).
-- ----------------------------------------------------------------------

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

-- Capacidade máxima de alunos da turma — opcional (null = sem limite
-- definido). Usada em gestao.html só pra calcular "X vagas"/"Sem vagas";
-- não é reforçada no banco, é informativa mesmo.
alter table public.turmas add column if not exists capacidade int;

-- Dia(s) da semana e horário em que a turma se encontra. dias_semana guarda
-- os slugs 'seg'..'dom'; horario é sempre um dos 31 horários cheios de
-- 07:00 a 22:00 (passo de 30min, sempre 1h de duração — ver HORARIO_SLOTS
-- em gestao.html/professora.html), pra poder cruzar com
-- professor_disponibilidade abaixo e pintar a agenda do professor de
-- vermelho nos horários ocupados por uma turma dele(a).
alter table public.turmas add column if not exists dias_semana text[] not null default '{}';
alter table public.turmas add column if not exists horario text;

-- Normalização (idempotente): turmas criadas ANTES de "horario" virar um
-- <select> de horário fixo têm texto livre digitado à mão ("21hrs",
-- "14h30min", "09HRS"...), que não bate com o formato canônico "HH:MM"
-- usado por professor_disponibilidade — sem isso, a turma nunca aparece
-- como "ocupada" na agenda do professor, mesmo já tendo dia/horário
-- cadastrados. Só converte padrões CLAROS de um horário só; não mexe em
-- quem já está em "HH:MM" nem em texto que não reconhece (ex: intervalo
-- "13h30 - 16h30" — nesse caso normalmente a turma dá aula em dias com
-- horários DIFERENTES, algo que o campo único "horario" não representa;
-- fica de fora de propósito, pra revisão manual pela tela de edição).
update public.turmas
set horario = case
    when horario ~* '^\d{1,2}h\d{2}min$' then
      lpad(split_part(horario, 'h', 1), 2, '0') || ':' || substring(horario from 'h(\d{2})min')
    when horario ~* '^\d{1,2}h\d{2}$' then
      lpad(split_part(horario, 'h', 1), 2, '0') || ':' || split_part(horario, 'h', 2)
    when horario ~* '^\d{1,2}\s*hrs?$' then
      lpad(regexp_replace(horario, '\D', '', 'g'), 2, '0') || ':00'
    else horario
  end
where horario is not null
  and horario !~ '^([01]\d|2[0-3]):(00|30)$';

-- "dias_semana"/"horario" (acima) só representam UM horário compartilhado
-- por todos os dias da turma — não dá conta do caso real de uma turma
-- (normalmente VIP/individual) que dá aula em dias DIFERENTES com
-- horários DIFERENTES (ex: terça às 13:30 e quinta às 16:30). "encontros"
-- guarda um array de {"dia":"ter","horario":"13:30"} — um item por
-- encontro semanal — e passa a ser a fonte de verdade usada pela agenda
-- de disponibilidade (professorTurmasOcupadas/minhasOcupacoes, em
-- gestao.html/professora.html); "dias_semana"/"horario" continuam
-- existindo só como resumo legado (útil se algo ainda ler só eles).
alter table public.turmas add column if not exists encontros jsonb not null default '[]'::jsonb;

-- Migração idempotente: preenche "encontros" a partir de dias_semana +
-- horario pra quem já está no formato canônico HH:MM (turmas com horário
-- ainda não normalizado, ver bloco acima, ficam de fora até serem
-- corrigidas manualmente pela tela — mesmo critério de "revisão manual").
update public.turmas
set encontros = (
  select coalesce(jsonb_agg(jsonb_build_object('dia', d, 'horario', turmas.horario)), '[]'::jsonb)
  from unnest(turmas.dias_semana) as d
)
where jsonb_array_length(encontros) = 0
  and horario ~ '^([01]\d|2[0-3]):(00|30)$'
  and dias_semana is not null and array_length(dias_semana, 1) > 0;

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

-- 8.1.1) Disponibilidade dos professores (agenda de horários livres) +
--        sugestões de troca de horário de turma
--    Cada professor(a) marca, no próprio painel, os horários da semana em
--    que está livre pra dar aula (dom-sáb, sempre slots de 1h cheia,
--    começando em hora cheia ou meia — 07:00 a 22:00). A gestão enxerga
--    essa agenda cruzada com as turmas (dias_semana/horario, acima): um
--    horário marcado como livre que bate com uma turma do professor fica
--    "ocupado" na tela — isso é calculado na hora, não fica guardado aqui.
create table if not exists public.professor_disponibilidade (
  id bigint generated always as identity primary key,
  teacher_id uuid references auth.users(id) on delete cascade not null,
  dia_semana text not null check (dia_semana in ('dom','seg','ter','qua','qui','sex','sab')),
  horario text not null,
  created_at timestamptz default now(),
  unique (teacher_id, dia_semana, horario)
);
alter table public.professor_disponibilidade enable row level security;

drop policy if exists "professor gerencia a propria disponibilidade" on public.professor_disponibilidade;
create policy "professor gerencia a propria disponibilidade"
  on public.professor_disponibilidade for all
  using (teacher_id = auth.uid())
  with check (teacher_id = auth.uid());

drop policy if exists "gestao ve toda a disponibilidade" on public.professor_disponibilidade;
create policy "gestao ve toda a disponibilidade"
  on public.professor_disponibilidade for select
  using (public.is_admin());

-- Quando a gestão precisa remanejar uma turma pra outro horário, em vez de
-- editar direto, ela "sugere" (linha aqui com status 'pendente') e o
-- professor responde no próprio painel: aceita (a turma muda de verdade —
-- ver api/aceitar-horario-sugestao.js, que precisa de service_role porque
-- professor não tem permissão de UPDATE em "turmas"), rejeita (só marca
-- 'rejeitado', turma não muda), ou contrapropõe outro horário (marca
-- 'contraproposta' e preenche os campos "_resposta" — aí quem decide
-- aceitar ou não é a gestão, que já tem permissão direta em "turmas").
create table if not exists public.horario_sugestoes (
  id uuid primary key default gen_random_uuid(),
  turma_id uuid references public.turmas(id) on delete cascade not null,
  teacher_id uuid references auth.users(id) on delete cascade not null,
  criado_por uuid references auth.users(id) not null,
  dias_semana_sugerido text[] not null,
  horario_sugerido text not null,
  mensagem text,
  status text not null default 'pendente' check (status in ('pendente','aceito','rejeitado','contraproposta')),
  dias_semana_resposta text[],
  horario_resposta text,
  resposta_mensagem text,
  created_at timestamptz default now(),
  respondido_at timestamptz
);
alter table public.horario_sugestoes enable row level security;

drop policy if exists "professor ve as proprias sugestoes" on public.horario_sugestoes;
create policy "professor ve as proprias sugestoes"
  on public.horario_sugestoes for select
  using (teacher_id = auth.uid());

drop policy if exists "professor responde as proprias sugestoes" on public.horario_sugestoes;
create policy "professor responde as proprias sugestoes"
  on public.horario_sugestoes for update
  using (teacher_id = auth.uid());

drop policy if exists "gestao gerencia sugestoes" on public.horario_sugestoes;
create policy "gestao gerencia sugestoes"
  on public.horario_sugestoes for all
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
-- gestão já tenha feito pela tela. O INSERT em si fica na seção 15.2, pelo
-- mesmo motivo do comentário na seção 7 (chave única muda de 2 pra 3
-- colunas quando a coluna "aula" é criada).

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
-- Datas do contrato (distintas de data_inicio/data_fim, que controlam o
-- PERÍODO do vínculo financeiro atual — contrato_fim alimenta o filtro de
-- "contratos vencendo" em gestao.html, sem fechar/reabrir período nenhum.
alter table public.aluno_financeiro_historico add column if not exists contrato_inicio date;
alter table public.aluno_financeiro_historico add column if not exists contrato_fim date;

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

-- Aluno lê a própria situação (só leitura) — usado pra bloquear o painel do
-- aluno quando a situação vira "pausado" (existem débitos).
drop policy if exists "aluno ve o proprio historico financeiro" on public.aluno_financeiro_historico;
create policy "aluno ve o proprio historico financeiro"
  on public.aluno_financeiro_historico for select
  using (aluno_id = auth.uid());

-- Admin comum (role 'admin', não só 'financeiro') LÊ o histórico — os filtros
-- da aba Alunos em gestao.html (modalidade / professor responsável / situação /
-- contrato vencendo) e os selinhos de cada linha precisam desses dados. É SÓ
-- select: editar valor/modalidade/professor continua exclusivo de is_financeiro()
-- pela política "admins gerenciam historico financeiro dos alunos" acima.
drop policy if exists "admin comum le historico financeiro" on public.aluno_financeiro_historico;
create policy "admin comum le historico financeiro"
  on public.aluno_financeiro_historico for select
  using (public.is_admin());

-- 9.3.1) Histórico de observações do vínculo financeiro — a coluna
--        "observacao" em aluno_financeiro_historico guarda só a observação
--        ATUAL do período (sobrescrita a cada "Salvar" no modal Financeiro).
--        Esta tabela é um LOG somente-inserção: cada vez que a gestão salva o
--        vínculo com uma observação nova, entra uma linha datada aqui, pra não
--        perder o registro de por que cada ajuste foi feito.
create table if not exists public.aluno_financeiro_observacoes (
  id bigint generated always as identity primary key,
  aluno_id uuid not null references auth.users(id) on delete cascade,
  periodo_id bigint references public.aluno_financeiro_historico(id) on delete set null,
  observacao text not null,
  registrado_por uuid references auth.users(id),
  registrado_em timestamptz default now()
);

create index if not exists idx_aluno_fin_obs_aluno on public.aluno_financeiro_observacoes (aluno_id, registrado_em desc);

alter table public.aluno_financeiro_observacoes enable row level security;

drop policy if exists "admins gerenciam observacoes do vinculo financeiro" on public.aluno_financeiro_observacoes;
create policy "admins gerenciam observacoes do vinculo financeiro"
  on public.aluno_financeiro_observacoes for all
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

-- 9.6.1) Histórico de pagamentos — "pagamentos_professores" guarda só o
--        ESTADO ATUAL (upsert por professor+mês, cada "Salvar pagamento"
--        sobrescreve o anterior — é o que alimenta a coluna "Total Pago" e
--        o status da tela Pagamentos). Esta tabela é um LOG somente-inserção
--        de cada vez que "Salvar pagamento" foi clicado, pra dar pra ver
--        pagamentos feitos em parcelas dentro do mesmo mês (ex: metade
--        agora, resto depois) sem perder o registro do que já foi pago.
create table if not exists public.pagamentos_professores_historico (
  id bigint generated always as identity primary key,
  professor_id uuid not null references auth.users(id) on delete cascade,
  mes_competencia date not null,
  status text not null,
  valor_pago numeric(10,2),
  data_pagamento date,
  observacoes text,
  registrado_por uuid references auth.users(id),
  registrado_em timestamptz default now()
);

create index if not exists idx_pagamentos_historico_prof_mes on public.pagamentos_professores_historico (professor_id, mes_competencia, registrado_em desc);

alter table public.pagamentos_professores_historico enable row level security;

drop policy if exists "professor ve o proprio historico de pagamentos" on public.pagamentos_professores_historico;
create policy "professor ve o proprio historico de pagamentos"
  on public.pagamentos_professores_historico for select
  using (professor_id = auth.uid());

drop policy if exists "admins gerenciam historico de pagamentos" on public.pagamentos_professores_historico;
create policy "admins gerenciam historico de pagamentos"
  on public.pagamentos_professores_historico for all
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

-- ----------------------------------------------------------------------
-- 10) MÓDULO DE PRESENÇA (CHAMADA)
--     Registra, por sessão de aula (turma + data + professor), quais
--     alunos estavam presentes. É a fonte de dados usada na seção 11 pra
--     ratear a mensalidade entre dois professores quando o vínculo
--     financeiro do aluno troca no meio do mês (ver dyseGerarMensalidadesDoMes
--     em dyse-auth.js). Tabela de gestão de turma normal (como
--     activity_results) — por isso a política de oversight usa is_admin()
--     (que já cobre "financeiro", ver comentário na função is_admin() na
--     seção 1), não is_financeiro().
-- ----------------------------------------------------------------------

-- 10.1) Sessões de aula. Chave inclui "professor_id" (não só turma+data)
--       de propósito: se duas professoras derem aula pra mesma turma no
--       mesmo dia (aula dupla, substituição), cada uma registra a própria
--       sessão sem sobrescrever a chamada da outra.
create table if not exists public.turma_sessoes (
  id bigint generated always as identity primary key,
  turma_id uuid not null references public.turmas(id) on delete cascade,
  professor_id uuid references auth.users(id) on delete set null,
  data date not null default current_date,
  observacao text,
  criado_por uuid references auth.users(id),
  criado_em timestamptz default now(),
  atualizado_em timestamptz default now()
);

alter table public.turma_sessoes drop constraint if exists turma_sessoes_turma_data_professor_key;
alter table public.turma_sessoes add constraint turma_sessoes_turma_data_professor_key unique (turma_id, data, professor_id);

create index if not exists idx_turma_sessoes_turma_data on public.turma_sessoes (turma_id, data desc);

alter table public.turma_sessoes enable row level security;

drop policy if exists "professoras gerenciam sessoes das turmas permitidas" on public.turma_sessoes;
create policy "professoras gerenciam sessoes das turmas permitidas"
  on public.turma_sessoes for all
  using (public.teacher_can_see_turma(turma_id))
  with check (public.teacher_can_see_turma(turma_id));

drop policy if exists "admins gerenciam todas as sessoes" on public.turma_sessoes;
create policy "admins gerenciam todas as sessoes"
  on public.turma_sessoes for all
  using (public.is_admin())
  with check (public.is_admin());

-- 10.2) Presença por aluno dentro de uma sessão. "presente" default true:
--       ao fazer a chamada, o normal é desmarcar quem FALTOU — mas a tela
--       sempre grava uma linha por aluno matriculado (presente=true ou
--       false), nunca omite quem faltou, senão o rateio da seção 11
--       trataria "sem linha" e "faltou" como a mesma coisa.
create table if not exists public.sessao_presencas (
  id bigint generated always as identity primary key,
  sessao_id bigint not null references public.turma_sessoes(id) on delete cascade,
  aluno_id uuid not null references auth.users(id) on delete cascade,
  presente boolean not null default true,
  criado_em timestamptz default now()
);

alter table public.sessao_presencas drop constraint if exists sessao_presencas_sessao_aluno_key;
alter table public.sessao_presencas add constraint sessao_presencas_sessao_aluno_key unique (sessao_id, aluno_id);

create index if not exists idx_sessao_presencas_aluno on public.sessao_presencas (aluno_id);
create index if not exists idx_sessao_presencas_sessao on public.sessao_presencas (sessao_id);

alter table public.sessao_presencas enable row level security;

-- "sessao_presencas" não tem turma_id, só sessao_id — sobe até
-- turma_sessoes pra achar a turma, igual ao padrão de
-- activity_results→profiles.
drop policy if exists "professoras gerenciam presencas das turmas permitidas" on public.sessao_presencas;
create policy "professoras gerenciam presencas das turmas permitidas"
  on public.sessao_presencas for all
  using (
    exists (
      select 1 from public.turma_sessoes ts
      where ts.id = public.sessao_presencas.sessao_id
        and public.teacher_can_see_turma(ts.turma_id)
    )
  )
  with check (
    exists (
      select 1 from public.turma_sessoes ts
      where ts.id = public.sessao_presencas.sessao_id
        and public.teacher_can_see_turma(ts.turma_id)
    )
  );

drop policy if exists "admins gerenciam todas as presencas" on public.sessao_presencas;
create policy "admins gerenciam todas as presencas"
  on public.sessao_presencas for all
  using (public.is_admin())
  with check (public.is_admin());

-- 10.3) Auditoria — mesma trilha genérica do módulo financeiro (9.9):
--       presença agora tem consequência financeira direta (rateio de
--       mensalidade, seção 11), então fica no mesmo log em caso de
--       disputa sobre quem recebeu por quantas aulas.
drop trigger if exists trg_audit_turma_sessoes on public.turma_sessoes;
create trigger trg_audit_turma_sessoes
  after insert or update or delete on public.turma_sessoes
  for each row execute procedure public.log_financeiro_auditoria();

drop trigger if exists trg_audit_sessao_presencas on public.sessao_presencas;
create trigger trg_audit_sessao_presencas
  after insert or update or delete on public.sessao_presencas
  for each row execute procedure public.log_financeiro_auditoria();

-- ----------------------------------------------------------------------
-- 11) MENSALIDADES — permite mais de uma linha por (aluno, mês)
--     Quando o vínculo financeiro do aluno troca de professor no meio do
--     mês, dyseGerarMensalidadesDoMes() (dyse-auth.js) passa a gerar uma
--     linha por professor envolvido, cada uma com sua fatia de
--     valor_recebido/valor_pago_professor — rateio proporcional às aulas
--     dadas por cada um, contadas via o módulo de presença (seção 10). A
--     chave antiga (aluno_id, mes_competencia) impedia isso.
-- ----------------------------------------------------------------------
alter table public.mensalidades drop constraint if exists mensalidades_aluno_id_mes_competencia_key;
alter table public.mensalidades drop constraint if exists mensalidades_aluno_mes_professor_key;
alter table public.mensalidades add constraint mensalidades_aluno_mes_professor_key unique (aluno_id, mes_competencia, professor_id);

-- ----------------------------------------------------------------------
-- 12) MÓDULO ACADÊMICO — Registro de Classe e histórico do aluno
--     Escalável por nível (A1 é só o primeiro) — nada abaixo é específico
--     de A1 ou de 44 aulas. Um "nível" (A1, A2, B1...) é cadastrado como
--     MATÉRIA — mesma tabela/mecanismo já usado pro TOEFL (seção 8.2) e
--     pro mesmo toggle "Matérias liberadas" da gestão — só que com
--     "total_aulas"/"eixos_avaliacao" preenchidos, o que a identifica como
--     uma matéria "com currículo" e libera o Registro de Classe pra
--     qualquer turma que a tenha marcada em turma_materias. Não existe uma
--     tabela "niveis" à parte de propósito: evita dois mecanismos
--     parecidos (matérias x níveis) fazendo a mesma coisa — vincular
--     conteúdo a uma turma.
-- ----------------------------------------------------------------------

-- 12.1) "materias" ganha os campos que uma matéria-com-currículo precisa.
--       Ficam nulos pra matérias comuns (ex: TOEFL) — só uma matéria com
--       total_aulas preenchido aparece como opção de nível no Registro de
--       Classe. "eixos_avaliacao" define as colunas de avaliação do Bloco
--       B daquele nível — cada um pode ter eixos diferentes.
alter table public.materias add column if not exists total_aulas int;
alter table public.materias add column if not exists eixos_avaliacao jsonb;

-- 12.2) Aulas de cada matéria-com-currículo — Bloco A do modelo
--       institucional (referência pedagógica da coordenação, não
--       preenchida pelo professor). "conteudo" em JSONB pelo mesmo motivo
--       de eixos_avaliacao: os campos do Bloco A podem variar por
--       matéria/nível no futuro. O nome da tabela ("nivel_aulas") ficou
--       do desenho anterior (com tabela "niveis" própria) — mantido pra
--       não precisar renomear em cascata; conceitualmente hoje é "aulas
--       de uma matéria com currículo".
create table if not exists public.nivel_aulas (
  id uuid primary key default gen_random_uuid(),
  materia_slug text not null references public.materias(slug) on delete cascade,
  numero int not null,
  topico text not null,
  conteudo jsonb not null default '{}'::jsonb,
  criado_em timestamptz default now()
);

-- 12.3) MIGRAÇÃO — quem já rodou uma versão anterior deste script tem uma
--       tabela "niveis" separada e "nivel_aulas.nivel_id"/"turmas.nivel_id"
--       apontando pra ela. Este bloco só faz algo se "niveis" ainda
--       existir; numa instalação nova (ou já migrada) não faz nada.
do $migra_niveis_para_materias$
begin
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'niveis') then
    -- Leva o catálogo pra "materias" (sem sobrescrever se a matéria já existir).
    insert into public.materias (slug, name, total_aulas, eixos_avaliacao)
    select slug, nome, total_aulas, eixos_avaliacao from public.niveis
    on conflict (slug) do nothing;

    -- nivel_aulas: troca nivel_id (uuid → tabela niveis) por materia_slug (text → materias).
    if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'nivel_aulas' and column_name = 'nivel_id') then
      alter table public.nivel_aulas add column if not exists materia_slug text references public.materias(slug) on delete cascade;
      update public.nivel_aulas na set materia_slug = n.slug from public.niveis n where na.nivel_id = n.id and na.materia_slug is null;
      alter table public.nivel_aulas alter column materia_slug set not null;
      alter table public.nivel_aulas drop constraint if exists nivel_aulas_nivel_numero_key;
      alter table public.nivel_aulas drop column nivel_id;
    end if;

    -- turmas.nivel_id vira uma linha em turma_materias (mesmo vínculo de "Matérias liberadas").
    if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'turmas' and column_name = 'nivel_id') then
      insert into public.turma_materias (turma_id, materia_slug)
      select t.id, n.slug from public.turmas t join public.niveis n on n.id = t.nivel_id
      where t.nivel_id is not null
      on conflict do nothing;
      alter table public.turmas drop column nivel_id;
    end if;

    drop table public.niveis cascade;
  end if;
end $migra_niveis_para_materias$;

-- Só depois da migração acima é garantido que "materia_slug" existe em
-- toda instalação (nova ou antiga) — por isso a constraint/índice/RLS
-- ficam aqui, não dentro do "create table" de 12.2.
alter table public.nivel_aulas drop constraint if exists nivel_aulas_materia_numero_key;
alter table public.nivel_aulas add constraint nivel_aulas_materia_numero_key unique (materia_slug, numero);

create index if not exists idx_nivel_aulas_materia on public.nivel_aulas (materia_slug, numero);

alter table public.nivel_aulas enable row level security;

drop policy if exists "professoras e admins veem aulas do nivel" on public.nivel_aulas;
create policy "professoras e admins veem aulas do nivel"
  on public.nivel_aulas for select
  using (public.is_teacher() or public.is_admin());

drop policy if exists "admins gerenciam aulas do nivel" on public.nivel_aulas;
create policy "admins gerenciam aulas do nivel"
  on public.nivel_aulas for all
  using (public.is_admin())
  with check (public.is_admin());

-- 12.4) Registro de Classe (Bloco B) — vinculado ao ALUNO, não à turma.
--       "unique(aluno_id, nivel_aula_id, data_aula)": uma aula pode ser
--       ministrada em MAIS DE UM DIA — a DATA é a identidade do registro.
--       O professor escolhe a data, avalia aquele dia e salva; outra data =
--       outro registro, com sua avaliação e sua observação próprias.
--       Troca de turma/professor nunca duplica nem reinicia
--       o histórico. turma_id/professor_id aqui são só o retrato de quem
--       registrou; quem PODE VER depende da turma atual do aluno (RLS
--       abaixo), não da turma gravada aqui — é isso que faz o histórico
--       "seguir" o aluno quando ele troca de turma/professor.
create table if not exists public.registros_classe (
  id bigint generated always as identity primary key,
  aluno_id uuid not null references auth.users(id) on delete cascade,
  nivel_aula_id uuid not null references public.nivel_aulas(id) on delete restrict,
  turma_id uuid references public.turmas(id) on delete set null,
  professor_id uuid references auth.users(id) on delete set null,
  -- A DATA é a identidade do registro: (aluno, aula, data_aula) é único.
  data_aula date not null default current_date,
  avaliacoes jsonb not null default '{}'::jsonb,
  observacoes text,
  criado_por uuid references auth.users(id),
  criado_em timestamptz default now(),
  atualizado_por uuid references auth.users(id),
  atualizado_em timestamptz default now()
);

alter table public.registros_classe drop constraint if exists registros_classe_aluno_aula_key;
alter table public.registros_classe drop column if exists datas;        -- tentativa 1 (multidata numa linha só)
alter table public.registros_classe drop column if exists sessao_ordem; -- tentativa 2 (Dia 1/Dia 2 como chave)
alter table public.registros_classe add constraint registros_classe_aluno_aula_key unique (aluno_id, nivel_aula_id, data_aula);

create index if not exists idx_registros_classe_aluno on public.registros_classe (aluno_id, nivel_aula_id);

alter table public.registros_classe enable row level security;

-- Mesmo padrão de activity_results (seção 8.7): visibilidade pela turma
-- ATUAL do aluno via teacher_can_see_turma, não pela turma gravada no
-- registro — assim a professora nova enxerga o que a antiga registrou.
drop policy if exists "professoras veem registros dos alunos das turmas atuais" on public.registros_classe;
create policy "professoras veem registros dos alunos das turmas atuais"
  on public.registros_classe for select
  using (
    exists (
      select 1 from public.profiles p
      where p.id = public.registros_classe.aluno_id
        and p.turma_id is not null
        and public.teacher_can_see_turma(p.turma_id)
    )
  );

drop policy if exists "professoras registram alunos das turmas atuais" on public.registros_classe;
create policy "professoras registram alunos das turmas atuais"
  on public.registros_classe for insert
  with check (
    exists (
      select 1 from public.profiles p
      where p.id = public.registros_classe.aluno_id
        and p.turma_id is not null
        and public.teacher_can_see_turma(p.turma_id)
    )
  );

drop policy if exists "professoras atualizam registros dos alunos das turmas atuais" on public.registros_classe;
create policy "professoras atualizam registros dos alunos das turmas atuais"
  on public.registros_classe for update
  using (
    exists (
      select 1 from public.profiles p
      where p.id = public.registros_classe.aluno_id
        and p.turma_id is not null
        and public.teacher_can_see_turma(p.turma_id)
    )
  )
  with check (
    exists (
      select 1 from public.profiles p
      where p.id = public.registros_classe.aluno_id
        and p.turma_id is not null
        and public.teacher_can_see_turma(p.turma_id)
    )
  );

-- DELETE: a professora precisa poder APAGAR um dia lançado por engano
-- (botão "Remover o Dia N" no Registro de Classe). Mesmo critério de
-- visibilidade das outras políticas (turma ATUAL do aluno).
drop policy if exists "professoras apagam registros dos alunos das turmas atuais" on public.registros_classe;
create policy "professoras apagam registros dos alunos das turmas atuais"
  on public.registros_classe for delete
  using (
    exists (
      select 1 from public.profiles p
      where p.id = public.registros_classe.aluno_id
        and p.turma_id is not null
        and public.teacher_can_see_turma(p.turma_id)
    )
  );

drop policy if exists "admins gerenciam todos os registros de classe" on public.registros_classe;
create policy "admins gerenciam todos os registros de classe"
  on public.registros_classe for all
  using (public.is_admin())
  with check (public.is_admin());

-- Auditoria — reaproveita o trigger genérico já usado em
-- turma_sessoes/sessao_presencas/mensalidades (seção 9.9).
drop trigger if exists trg_audit_registros_classe on public.registros_classe;
create trigger trg_audit_registros_classe
  after insert or update or delete on public.registros_classe
  for each row execute procedure public.log_financeiro_auditoria();

-- 12.5) Planner (Bloco C) — por turma+aula, não por aluno (é sobre o
--       ritmo da turma, não do indivíduo).
create table if not exists public.registro_classe_sessao (
  id bigint generated always as identity primary key,
  turma_id uuid not null references public.turmas(id) on delete cascade,
  nivel_aula_id uuid not null references public.nivel_aulas(id) on delete restrict,
  -- Mesma ideia de registros_classe: 1 linha por (turma, aula, DATA).
  data_aula date not null default current_date,
  pontos_a_retomar text,
  ajuste_de_ritmo text,
  alerta_report_card boolean not null default false,
  alerta_report_card_motivo text,
  criado_por uuid references auth.users(id),
  criado_em timestamptz default now(),
  atualizado_em timestamptz default now()
);

alter table public.registro_classe_sessao drop constraint if exists registro_classe_sessao_turma_aula_key;
alter table public.registro_classe_sessao drop column if exists datas;        -- tentativa 1
alter table public.registro_classe_sessao drop column if exists sessao_ordem; -- tentativa 2
alter table public.registro_classe_sessao add constraint registro_classe_sessao_turma_aula_key unique (turma_id, nivel_aula_id, data_aula);

alter table public.registro_classe_sessao enable row level security;

drop policy if exists "professoras gerenciam planner das turmas permitidas" on public.registro_classe_sessao;
create policy "professoras gerenciam planner das turmas permitidas"
  on public.registro_classe_sessao for all
  using (public.teacher_can_see_turma(turma_id))
  with check (public.teacher_can_see_turma(turma_id));

drop policy if exists "admins gerenciam todo o planner" on public.registro_classe_sessao;
create policy "admins gerenciam todo o planner"
  on public.registro_classe_sessao for all
  using (public.is_admin())
  with check (public.is_admin());

drop trigger if exists trg_audit_registro_classe_sessao on public.registro_classe_sessao;
create trigger trg_audit_registro_classe_sessao
  after insert or update or delete on public.registro_classe_sessao
  for each row execute procedure public.log_financeiro_auditoria();

-- 12.6) Seed da matéria "A1" (nível) e suas 44 aulas, extraído de
--       "Registro de Classe & Planner Pedagógico A1 · Modelo
--       Institucional" — idempotente: só insere o que ainda não existe
--       (ON CONFLICT DO NOTHING), nunca sobrescreve edição manual feita
--       depois (nem o nome/descrição da matéria, nem uma aula já editada).
insert into public.materias (slug, name, description, total_aulas, eixos_avaliacao)
values ('a1', 'A1', 'Currículo do nível A1 — 44 aulas.', 44, '["Tarefa Final","Speaking","Listening","Read./Writ."]'::jsonb)
on conflict (slug) do nothing;

insert into public.nivel_aulas (materia_slug, numero, topico, conteudo) values
  ('a1', 1, $$Acolhimento — vocabulário de países, diálogo de apresentação, pronúncia (linking)$$, jsonb_build_object(
    'habilidades', jsonb_build_array('Speaking','Listening','Vocabulário funcional'),
    'tarefa_comunicativa', $$Role-play: apresentar-se e perguntar nome e nacionalidade de um colega, encerrando a conversa de forma natural.$$,
    'estrutura_gramatical', $$Chunks funcionais de apresentação (What's your name? / I'm from... / Where are you from?) tratados lexicalmente — sem antecipar to be (foco da Aula 02).$$,
    'pontos_atencao', jsonb_build_array($$Primeiros 10 min: acolhimento + Trilha Pedagógica do nível (de onde o aluno parte e onde chega).$$, $$Países com pronúncia distante do português (Switzerland, Germany) geram insegurança — normalizar o erro.$$),
    'foco_fonetico_som', $$Linking consoante+vogal entre palavras, destacado em 'meet you'.$$,
    'foco_fonetico_erro', $$Fala truncada sem linking; troca do som de 'th' em 'thank you' por /t/ ou /f/.$$,
    'foco_fonetico_correcao', $$Modelar a frase inteira e pedir eco (drilling) antes do role-play individual; gravar e comparar com o áudio original.$$,
    'tarefa_de_casa', $$Flexge – ambientação.$$
  )),
  ('a1', 2, $$To Be afirmativo + subject pronouns$$, jsonb_build_object(
    'habilidades', jsonb_build_array('Speaking','Reading','Writing'),
    'tarefa_comunicativa', $$Descrever uma pessoa famosa (nome, nacionalidade, profissão) usando o to be afirmativo, apresentando para a turma.$$,
    'estrutura_gramatical', $$To be afirmativo (I'm/He's/She's/It's/We're/You're/They're) e subject pronouns, a partir dos chunks da Aula 01.$$,
    'pontos_atencao', jsonb_build_array($$Confusão entre 'we're' e 'they're' quando o grupo não inclui o falante.$$, $$Esquecimento do apóstrofo em nomes próprios ('Adam's').$$),
    'foco_fonetico_som', $$Três pronúncias do 's' de contração: /s/, /z/, /ɪz/; acento de frase na informação nova.$$,
    'foco_fonetico_erro', $$Toda contração 's' pronunciada como /s/, sem distinguir /z/ e /ɪz/.$$,
    'foco_fonetico_correcao', $$Drilling em pares mínimos 'he's/she's'; gravar a apresentação e comparar com o modelo do professor.$$,
    'tarefa_de_casa', $$Preparação de slide 6 da aula 03.$$
  )),
  ('a1', 3, $$To Be negativo$$, jsonb_build_object(
    'habilidades', jsonb_build_array('Speaking','Listening','Reading','Writing'),
    'tarefa_comunicativa', $$Corrigir informações falsas sobre nacionalidades de celebridades usando o to be negativo + afirmativo.$$,
    'estrutura_gramatical', $$To be negativo (isn't/aren't/'m not) e formação de nacionalidades a partir do país (Brazil→Brazilian).$$,
    'pontos_atencao', jsonb_build_array($$Aluno nega o verbo sem completar a informação certa depois ('She isn't Chinese' sem 'She's Japanese').$$, $$Confusão entre 'isn't' e 'aren't' conforme o sujeito.$$),
    'foco_fonetico_som', $$Sílaba tônica em nacionalidades polissilábicas (Brazilian, Japanese, Chinese).$$,
    'foco_fonetico_erro', $$Tonificação na sílaba errada por transferência do português; redução do isn't/aren't ambígua na fala rápida.$$,
    'foco_fonetico_correcao', $$Identificar a sílaba tônica no drilling de nacionalidades; praticar pares contrastivos afirmativo/negativo em cadeia oral.$$,
    'tarefa_de_casa', $$Slides 8, 9 e 10 + preparação slide 4 da aula 04.$$
  )),
  ('a1', 4, $$To Be interrogativo (Changing Nationalities)$$, jsonb_build_object(
    'habilidades', jsonb_build_array('Speaking','Listening','Reading'),
    'tarefa_comunicativa', $$Entrevistar um colega sobre nacionalidade e origem usando perguntas com to be e respostas curtas.$$,
    'estrutura_gramatical', $$To be interrogativo (Am I.../Are you.../Is he...?) e short answers (Yes, he is. / No, she isn't.).$$,
    'pontos_atencao', jsonb_build_array($$Confusão sobre quando usar 'from' na pergunta ('Are you Canada?').$$, $$Inversão sujeito-verbo ainda instável nas primeiras tentativas.$$),
    'foco_fonetico_som', $$Entonação ascendente em perguntas de sim/não com to be.$$,
    'foco_fonetico_erro', $$Entonação plana ou descendente, soando como afirmação.$$,
    'foco_fonetico_correcao', $$Modelar a curva entonacional exagerando a subida no final da pergunta.$$,
    'tarefa_de_casa', $$Slides 8 e 9.$$
  )),
  ('a1', 5, $$To Be revisão + saudações culturais$$, jsonb_build_object(
    'habilidades', jsonb_build_array('Speaking','Listening'),
    'tarefa_comunicativa', $$Comparar formas de cumprimentar em diferentes países/culturas, revisando as três formas do to be.$$,
    'estrutura_gramatical', $$Revisão integrada do to be (afirmativo, negativo, interrogativo) aplicada a saudações e partes do corpo.$$,
    'pontos_atencao', jsonb_build_array($$Momento de consolidação — observar se erros das Aulas 2-4 ainda persistem antes da Aula 06.$$, $$Vocabulário cultural novo (bow, air kiss) não é foco gramatical, só enriquecimento.$$),
    'foco_fonetico_som', $$Entonação em perguntas fechadas (revisão da Aula 04).$$,
    'foco_fonetico_erro', $$Reincidência de erros anteriores; pronúncia de 'bow' /baʊ/ vs. /boʊ/ pode confundir.$$,
    'foco_fonetico_correcao', $$Retomar rapidamente qualquer padrão de erro recorrente das aulas 2-4 antes de seguir.$$,
    'tarefa_de_casa', $$Extra practice de vocabulário cultural.$$
  )),
  ('a1', 6, $$Vocabulário de hotel$$, jsonb_build_object(
    'habilidades', jsonb_build_array('Speaking','Listening','Reading','Writing','Vocabulário funcional'),
    'tarefa_comunicativa', $$Role-play: check-in em um hotel (recepcionista e hóspede) usando dados pessoais reais.$$,
    'estrutura_gramatical', $$Perguntas funcionais com What's your...?/Where are you from? e o alfabeto para soletrar (spelling).$$,
    'pontos_atencao', jsonb_build_array($$Soletração é ponto de atrito recorrente (letras como G, J, Y, W soam muito diferente do português).$$, $$Aluno pode confundir 'What's your name?' com o registro mais formal do check-in.$$),
    'foco_fonetico_som', $$Nomes das letras do alfabeto, especialmente G /dʒiː/, J /dʒeɪ/, W /ˈdʌbəljuː/.$$,
    'foco_fonetico_erro', $$Aluno 'aportuguesa' o nome das letras; confunde 'double' ao soletrar letras repetidas.$$,
    'foco_fonetico_correcao', $$Drilling isolado do alfabeto antes de aplicá-lo a nomes reais; praticar 'double + letra'.$$,
    'tarefa_de_casa', $$Soletrar o nome completo gravando áudio + preparação da aula 07.$$
  )),
  ('a1', 7, $$Artigos a/an + objetos de viagem$$, jsonb_build_object(
    'habilidades', jsonb_build_array('Speaking','Listening','Writing','Vocabulário funcional'),
    'tarefa_comunicativa', $$Descrever o que tem na própria bolsa/mala usando a/an e vocabulário de objetos de viagem.$$,
    'estrutura_gramatical', $$Artigos indefinidos a/an (regra do som inicial: consoante vs. vogal) com substantivos contáveis no singular.$$,
    'pontos_atencao', jsonb_build_array($$A regra é sobre o SOM inicial, não a letra — focar em casos regulares nesta aula.$$, $$Aluno tende a esquecer o artigo por completo (interferência do português).$$),
    'foco_fonetico_som', $$Diferença entre 'a' /ə/ (átono) e 'an' /ən/ diante de vogal.$$,
    'foco_fonetico_erro', $$Uso de 'a' antes de som vocálico ('a apple'); omissão do artigo ao listar itens em sequência.$$,
    'foco_fonetico_correcao', $$Drilling rápido de pares a/an antes da produção livre; modelar a lista completa da bolsa com todos os artigos.$$,
    'tarefa_de_casa', $$Vídeo descrevendo itens da mala + slides 4, 5 e 6 da aula 08.$$
  )),
  ('a1', 8, $$Plurais + números + preços$$, jsonb_build_object(
    'habilidades', jsonb_build_array('Speaking','Listening','Reading','Vocabulário funcional'),
    'tarefa_comunicativa', $$Perguntar e informar preços em um mercado usando plurais e um sistema de moeda (£, $ ou €).$$,
    'estrutura_gramatical', $$Plural regular (+s/+es/+ies), números 11-100 e How much is/are...? + preços.$$,
    'pontos_atencao', jsonb_build_array($$Par -teen/-ty é a maior fonte de mal-entendido — reforçar antes de seguir para preços.$$, $$Plural de consoante+y (baby→babies) precisa de mais prática que +s simples.$$),
    'foco_fonetico_som', $$Acento tônico distintivo entre -TEEN (final tônica) e -ty (inicial tônica).$$,
    'foco_fonetico_erro', $$Confundir 13 com 30, 14 com 40; regularizar todos os plurais como +s.$$,
    'foco_fonetico_correcao', $$Drilling contrastivo em pares (13 vs. 30) com gesto de mão indicando a sílaba tônica.$$,
    'tarefa_de_casa', $$Slides 11 e 12.$$
  )),
  ('a1', 9, $$Possessive adjectives$$, jsonb_build_object(
    'habilidades', jsonb_build_array('Speaking','Listening','Reading','Writing'),
    'tarefa_comunicativa', $$Apresentar à turma as coisas favoritas de um colega usando adjetivos possessivos (his/her/their/our).$$,
    'estrutura_gramatical', $$Possessive adjectives (my/your/his/her/its/our/their) em contraste com subject pronouns.$$,
    'pontos_atencao', jsonb_build_array($$Confusão entre 'his' e 'her' na produção rápida.$$, $$Confusão entre subject pronoun e possessive adjective ('She bag is blue').$$),
    'foco_fonetico_som', $$Diferenciação entre /hɪz/ (his) e /hɜːr/ (her).$$,
    'foco_fonetico_erro', $$Uso de subject pronoun no lugar do possessive adjective.$$,
    'foco_fonetico_correcao', $$Drilling de substituição rápida (I → my, she → her, they → their) antes da entrevista.$$,
    'tarefa_de_casa', $$Slide 7 + preparação slides 2, 3 e 4 da próxima aula.$$
  )),
  ('a1', 10, $$Genitivo 's (família)$$, jsonb_build_object(
    'habilidades', jsonb_build_array('Speaking','Listening','Reading'),
    'tarefa_comunicativa', $$Descrever relações em uma árvore genealógica usando o genitivo 's e vocabulário de família.$$,
    'estrutura_gramatical', $$Genitivo 's para posse/relação (Luke is Haley's brother) e vocabulário de parentesco.$$,
    'pontos_atencao', jsonb_build_array($$Confusão entre genitivo 's (posse) e contração 's do to be — mesma grafia, funções diferentes.$$, $$Ordem das palavras: 'Haley's mother', não 'the mother of Haley'.$$),
    'foco_fonetico_som', $$O 's' do genitivo segue a mesma regra /s/,/z/,/ɪz/ da 3ª pessoa/contrações.$$,
    'foco_fonetico_erro', $$Inversão da ordem ('the brother of Haley'); confundir se o 's' é do to be ou do genitivo.$$,
    'foco_fonetico_correcao', $$Praticar a transformação 'the X of Y' → 'Y's X' com exemplos da árvore genealógica.$$,
    'tarefa_de_casa', $$Slides 10 e 11 da aula 10 + slides 4 e 5 preparação aula 11.$$
  )),
  ('a1', 11, $$Adjetivos$$, jsonb_build_object(
    'habilidades', jsonb_build_array('Speaking','Listening','Reading'),
    'tarefa_comunicativa', $$Descrever a raça de cachorro favorita (ou outro animal) usando adjetivos, justificando a escolha.$$,
    'estrutura_gramatical', $$Posição do adjetivo (antes do substantivo ou depois do to be) e invariabilidade de número (big dogs, não 'bigs dogs').$$,
    'pontos_atencao', jsonb_build_array($$Erro clássico: pluralizar o adjetivo ('bigs dogs').$$, $$Ordem adjetivo+substantivo invertida por influência do português.$$),
    'foco_fonetico_som', $$Ligação natural entre adjetivo e substantivo ('a friendly dog').$$,
    'foco_fonetico_erro', $$Adicionar 's' ao adjetivo no plural; colocar o adjetivo depois do substantivo.$$,
    'foco_fonetico_correcao', $$Drilling de frases curtas enfatizando que o adjetivo nunca muda; reordenação oral rápida.$$,
    'tarefa_de_casa', $$Slides 8 e 9 + slides 3 e 4 da aula 12.$$
  )),
  ('a1', 12, $$Have/has + refeições$$, jsonb_build_object(
    'habilidades', jsonb_build_array('Speaking','Listening','Reading','Writing'),
    'tarefa_comunicativa', $$Descrever o cardápio pessoal de dois dias da semana usando have/has + vocabulário de refeições.$$,
    'estrutura_gramatical', $$Have/has no presente simples (have p/ I/you/we/they; has p/ he/she/it) aplicado a refeições e dias da semana.$$,
    'pontos_atencao', jsonb_build_array($$Aluno usa 'have' para todas as pessoas, esquecendo 'has' — erro clássico de 3ª pessoa que reaparece na Aula 13.$$, $$Confusão entre 'have breakfast' e 'have a breakfast' (artigo desnecessário).$$),
    'foco_fonetico_som', $$Pronúncia de 'has' /hæz/ com /z/ final, diferente de 'have' /hæv/.$$,
    'foco_fonetico_erro', $$Omissão do 's' em 'has'; inserção de artigo indevido antes de refeições.$$,
    'foco_fonetico_correcao', $$Drilling contrastivo I have / she has, reforçando o /z/ final de has.$$,
    'tarefa_de_casa', $$Slides 6 e 10 da aula 12 + slide 3 da aula 13.$$
  )),
  ('a1', 13, $$Present Simple afirmativo + rotina diária$$, jsonb_build_object(
    'habilidades', jsonb_build_array('Speaking','Listening','Reading','Writing'),
    'tarefa_comunicativa', $$Descrever a própria rotina diária e a de uma pessoa famosa usando o present simple afirmativo.$$,
    'estrutura_gramatical', $$Present simple afirmativo com todas as pessoas, incluindo a regra ortográfica da 3ª pessoa (+s, +es, +ies).$$,
    'pontos_atencao', jsonb_build_array($$A regra da 3ª pessoa (+s/+es/+ies) é o ponto crítico desta aula.$$, $$Aluno esquece o 's' mesmo sabendo a regra, por não haver marca equivalente no português falado.$$),
    'foco_fonetico_som', $$O 's' final da 3ª pessoa: /s/, /z/ ou /ɪz/, mesma lógica do genitivo/contrações.$$,
    'foco_fonetico_erro', $$Omissão sistemática do 's' na 3ª pessoa; aplicação incorreta da regra +es.$$,
    'foco_fonetico_correcao', $$Drilling de substituição rápida (I get up → she gets up) até automatizar.$$,
    'tarefa_de_casa', $$Slide 14 da aula 13.$$
  )),
  ('a1', 14, $$Dizer as horas$$, jsonb_build_object(
    'habilidades', jsonb_build_array('Speaking','Listening'),
    'tarefa_comunicativa', $$Perguntar e responder horários de compromissos usando o sistema o'clock/past/to/quarter/half.$$,
    'estrutura_gramatical', $$Estrutura para dizer as horas (minutos + past/to + hora) e a pergunta What time...?$$,
    'pontos_atencao', jsonb_build_array($$Sistema past/to é bem diferente da lógica direta do português — maior fonte de confusão.$$, $$Uso de 'about' para horários aproximados reduz a ansiedade de precisão.$$),
    'foco_fonetico_som', $$Entonação e ritmo ao dizer horários compostos ('a quarter past two').$$,
    'foco_fonetico_erro', $$Tentar traduzir literalmente do português; confundir 'past' com 'to'.$$,
    'foco_fonetico_correcao', $$Usar um relógio analógico físico/desenhado para visualizar por que 'to' aponta pra hora seguinte.$$,
    'tarefa_de_casa', $$Slide 22 + estudar para a revisão da próxima aula.$$
  )),
  ('a1', 15, $$Revisão 1-14$$, jsonb_build_object(
    'habilidades', jsonb_build_array('Speaking'),
    'tarefa_comunicativa', $$Entrevista com um colega usando perguntas pessoais variadas, cobrindo os pontos gramaticais das Aulas 1-14.$$,
    'estrutura_gramatical', $$Revisão integrada: to be (3 formas), artigos a/an, plurais, números, possessivos, genitivo 's, have/has, present simple, advérbios de frequência.$$,
    'pontos_atencao', jsonb_build_array($$Primeiro checkpoint formal de revisão-teste — usar Forms + fluência oral pra alimentar o Registro de Classe e o critério de progressão.$$, $$Observar se erros recorrentes das aulas 1-14 ainda aparecem sob pressão de fala espontânea.$$),
    'foco_fonetico_som', $$Revisão geral: sons -ed/-s/'s finais e entonação de perguntas.$$,
    'foco_fonetico_erro', $$Reincidência dos padrões já mapeados (3ª pessoa sem 's', a/an trocados, contrações omitidas).$$,
    'foco_fonetico_correcao', $$Não interromper a entrevista pra corrigir — anotar padrões no Registro de Classe e planejar reforço na Aula 16.$$,
    'tarefa_de_casa', $$Google Forms de revisão gramatical (se não concluído em sala).$$
  )),
  ('a1', 16, $$Advérbios de frequência$$, jsonb_build_object(
    'habilidades', jsonb_build_array('Speaking','Writing'),
    'tarefa_comunicativa', $$Escrever e compartilhar frases reais sobre os próprios hábitos usando advérbios de frequência variados.$$,
    'estrutura_gramatical', $$Advérbios de frequência (always/usually/often/sometimes/never) e sua posição (antes de verbos comuns; depois do to be).$$,
    'pontos_atencao', jsonb_build_array($$Posição do advérbio é o ponto crítico — antes de verbos comuns, mas depois do to be.$$, $$Confusão de intensidade entre 'often' e 'usually'.$$),
    'foco_fonetico_som', $$Redução vocálica em 'usually' /ˈjuːʒuəli/.$$,
    'foco_fonetico_erro', $$Colocar o advérbio sempre no início/fim da frase; pronunciar 'usually' sílaba por sílaba.$$,
    'foco_fonetico_correcao', $$Cartões com sujeito+verbo de um lado e advérbio do outro, aluno decide a posição fisicamente.$$,
    'tarefa_de_casa', $$Slide 8 da aula 16.$$
  )),
  ('a1', 17, $$Interrogativo com do/does$$, jsonb_build_object(
    'habilidades', jsonb_build_array('Speaking','Writing'),
    'tarefa_comunicativa', $$Entrevistar um colega sobre hábitos de uso do celular usando perguntas com do/does e respostas curtas.$$,
    'estrutura_gramatical', $$Present simple interrogativo com do/does (+ short answers) e question words antes do auxiliar.$$,
    'pontos_atencao', jsonb_build_array($$Aluno tende a manter a estrutura do to be nas perguntas ('Is he use Instagram?').$$, $$Esquecimento do 's' em 'does' nas perguntas mesmo já dominando no afirmativo.$$),
    'foco_fonetico_som', $$Redução do auxiliar 'do you' na fala rápida — reconhecimento auditivo, não produção obrigatória.$$,
    'foco_fonetico_erro', $$Uso indevido de is/are em perguntas que pedem do/does; question word depois do auxiliar.$$,
    'foco_fonetico_correcao', $$Quadro contrastivo: perguntas com to be (Aula 4) vs. do/does (esta aula).$$,
    'tarefa_de_casa', $$Slide 13 + preparação slide 5 da aula 18.$$
  )),
  ('a1', 18, $$Present Simple completo + profissões$$, jsonb_build_object(
    'habilidades', jsonb_build_array('Speaking','Listening','Reading','Writing'),
    'tarefa_comunicativa', $$Descrever a rotina de uma profissão à escolha, usando as três formas do present simple.$$,
    'estrutura_gramatical', $$Consolidação do present simple nas 3 formas, aplicado a profissões (nurse, farmer, lawyer, engineer etc.).$$,
    'pontos_atencao', jsonb_build_array($$Aula de consolidação de todo o present simple — checar se erros de 3ª pessoa (Aulas 13, 17) já foram superados.$$, $$Vocabulário de profissões é extenso; não cobrar produção de todas as palavras.$$),
    'foco_fonetico_som', $$Consolidação da pronúncia do 's'/'es' final da 3ª pessoa (works, teaches, finishes).$$,
    'foco_fonetico_erro', $$Reincidência pontual do 's' na 3ª pessoa; confusão residual entre do/does.$$,
    'foco_fonetico_correcao', $$Usar o Registro de Classe das aulas anteriores pra identificar quem ainda troca do/does e reforçar direcionado.$$,
    'tarefa_de_casa', $$Slides 12, 13 e 14.$$
  )),
  ('a1', 19, $$Hobbies — leitura, vocabulário e opiniões$$, jsonb_build_object(
    'habilidades', jsonb_build_array('Speaking','Listening','Reading'),
    'tarefa_comunicativa', $$Conversar sobre hobbies que gostaria de experimentar, opinando com fun/boring/relaxing/difficult.$$,
    'estrutura_gramatical', $$Vocabulário de hobbies e adjetivos de opinião em frases com to be (this is fun / I think X is relaxing).$$,
    'pontos_atencao', jsonb_build_array($$Vocabulário amplo — priorizar reconhecimento e opinião sobre produção exaustiva.$$, $$Aluno pode confundir 'boring' com 'bored' — só um alerta pontual, sem aprofundar.$$),
    'foco_fonetico_som', $$Entonação de opinião pessoal ('I think... is...') com ênfase no adjetivo.$$,
    'foco_fonetico_erro', $$Troca de 'boring' por 'bored'; hesitação ao formar a opinião.$$,
    'foco_fonetico_correcao', $$Modelar a estrutura 'I think + hobby + is + adjetivo' repetidas vezes antes da conversa livre.$$,
    'tarefa_de_casa', $$Flexge + escrever 2 frases de opinião sobre hobbies diferentes.$$
  )),
  ('a1', 20, $$Questions com To Be e outros verbos$$, jsonb_build_object(
    'habilidades', jsonb_build_array('Speaking','Listening','Reading','Writing'),
    'tarefa_comunicativa', $$Entrevistar um colega com bateria de perguntas pessoais variadas (to be + do/does) e contar à turma o que lembrou.$$,
    'estrutura_gramatical', $$Contraste consolidado entre perguntas com to be (Am/Is/Are) e com outros verbos (Do/Does).$$,
    'pontos_atencao', jsonb_build_array($$Fechamento formal do contraste to be vs. do/does (Aulas 4 e 17) — avaliar se já decide sem hesitação.$$, $$Perguntas mais íntimas podem gerar timidez — lembrar o princípio do erro como parte do processo.$$),
    'foco_fonetico_som', $$Entonação consolidada: perguntas com to be (subida) vs. wh- com do/does (mais neutra).$$,
    'foco_fonetico_erro', $$Hesitação na escolha do auxiliar correto sob pressão de fala espontânea.$$,
    'foco_fonetico_correcao', $$Não interromper a entrevista — anotar padrões e fazer correção coletiva ao final, só nos 2-3 mais frequentes.$$,
    'tarefa_de_casa', $$Reforçar oralmente as perguntas que geraram mais dúvida, registrando no Planner.$$
  )),
  ('a1', 21, $$Imperativos$$, jsonb_build_object(
    'habilidades', jsonb_build_array('Speaking','Listening','Reading'),
    'tarefa_comunicativa', $$Dar instruções de uma receita simples usando verbos no imperativo (afirmativo e negativo).$$,
    'estrutura_gramatical', $$Imperativo afirmativo (verbo no início) e negativo (Don't + verbo), aplicado a instruções de receita.$$,
    'pontos_atencao', jsonb_build_array($$Aluno tende a adicionar sujeito antes do verbo imperativo ('You cook the eggs').$$, $$Ordem de advérbios/complementos em instruções longas pode gerar hesitação.$$),
    'foco_fonetico_som', $$Entonação firme e direta de instruções, sem a suavização de polidez do português.$$,
    'foco_fonetico_erro', $$Inserção de sujeito antes do verbo; uso de 'no' em vez de 'don't'.$$,
    'foco_fonetico_correcao', $$Drilling de transformação: frase com sujeito → imperativo sem sujeito, com os verbos da receita.$$,
    'tarefa_de_casa', $$Slide 11.$$
  )),
  ('a1', 22, $$Object pronouns$$, jsonb_build_object(
    'habilidades', jsonb_build_array('Speaking','Listening','Reading','Writing'),
    'tarefa_comunicativa', $$Conversar sobre filmes e animais favoritos, opinando com object pronouns (it/them/him/her).$$,
    'estrutura_gramatical', $$Object pronouns (me/you/him/her/it/us/them) em contraste com subject pronouns (Aula 2) e possessive adjectives (Aula 9).$$,
    'pontos_atencao', jsonb_build_array($$Maior confusão: usar subject pronoun após verbo/preposição ('I love she' em vez de 'I love her').$$, $$Diferenciação entre 'it' e 'him/her' ao falar de pets com nome.$$),
    'foco_fonetico_som', $$Contraste sutil entre 'him' /hɪm/ e 'her' /hɜːr/ na fala conectada.$$,
    'foco_fonetico_erro', $$Uso de subject pronoun após verbo; uso de 'it' para pessoas.$$,
    'foco_fonetico_correcao', $$Drilling de substituição imediata: 'I like Naomi Watts' → 'I like her'.$$,
    'tarefa_de_casa', $$Slides 9, 10 e 11.$$
  )),
  ('a1', 23, $$Pedidos em restaurante$$, jsonb_build_object(
    'habilidades', jsonb_build_array('Speaking','Listening','Reading','Vocabulário funcional'),
    'tarefa_comunicativa', $$Role-play: pedir comida em um restaurante usando I'll have.../I'll start with... e side dishes.$$,
    'estrutura_gramatical', $$Expressões funcionais pra pedir comida e vocabulário de cardápio (appetizer, main course, side dish).$$,
    'pontos_atencao', jsonb_build_array($$'I'll' é fórmula fixa pra pedidos — não é necessário explicar o futuro com will neste nível.$$, $$'Side dish' é conceito cultural sem equivalente direto — reforçar com exemplos do cardápio.$$),
    'foco_fonetico_som', $$Pronúncia da contração 'I'll' /aɪl/.$$,
    'foco_fonetico_erro', $$Pronunciar 'I'll' como duas sílabas separadas; esquecer 'with a side of...'.$$,
    'foco_fonetico_correcao', $$Drilling da contração isoladamente antes de inserir em frases completas.$$,
    'tarefa_de_casa', $$Slide 9 + preparação slides 3-6.$$
  )),
  ('a1', 24, $$Can (habilidade)$$, jsonb_build_object(
    'habilidades', jsonb_build_array('Speaking','Listening'),
    'tarefa_comunicativa', $$Dizer o que consegue e não consegue fazer (esportes/fitness) usando can/can't.$$,
    'estrutura_gramatical', $$Can/can't para habilidade, invariável para todas as pessoas, com a diferença /kæn/ forte vs. /kən/ fraco.$$,
    'pontos_atencao', jsonb_build_array($$Distinção can forte vs. fraco é sutil — muitos alunos pronunciam sempre forte.$$, $$Aluno usa 'do' desnecessariamente com can ('Do you can...?').$$),
    'foco_fonetico_som', $$Can forte /kæn/ em perguntas/negativas; can fraco /kən/ em afirmativas.$$,
    'foco_fonetico_erro', $$Pronunciar 'can' sempre forte; inserir do/does antes de can.$$,
    'foco_fonetico_correcao', $$Drilling contrastivo com pares mínimos (I can dance vs. Can you dance?).$$,
    'tarefa_de_casa', $$Slides 10, 11 e 12.$$
  )),
  ('a1', 25, $$Can/Could (pedidos educados)$$, jsonb_build_object(
    'habilidades', jsonb_build_array('Speaking','Listening','Writing','Vocabulário funcional'),
    'tarefa_comunicativa', $$Role-play: pedir um café (estilo Starbucks) usando Can I have.../Could I have.../I'd like...$$,
    'estrutura_gramatical', $$Can/Could/I'd like para pedidos educados (diferente do can de habilidade da Aula 24).$$,
    'pontos_atencao', jsonb_build_array($$Diferenciar este 'can' do 'can' de habilidade (Aula 24) — contraste explícito.$$, $$'Could'/'I'd like' são formas mais educadas — não obrigatórias neste nível.$$),
    'foco_fonetico_som', $$Pronúncia de 'could' /kʊd/ e de 'I'd like' /aɪd laɪk/ como bloco fluido.$$,
    'foco_fonetico_erro', $$Confundir a função com a de habilidade; pronunciar 'could' como 'coud' /kaʊd/.$$,
    'foco_fonetico_correcao', $$Contraste rápido: 'Can you swim?' vs. 'Can I have a coffee?' antes do role-play.$$,
    'tarefa_de_casa', $$Slides 12 e 13.$$
  )),
  ('a1', 26, $$Can/Can't (permissão)$$, jsonb_build_object(
    'habilidades', jsonb_build_array('Speaking','Listening','Reading','Vocabulário funcional'),
    'tarefa_comunicativa', $$Role-play: perguntar e responder sobre regras em uma escola/lugar novo usando can/can't (permissão).$$,
    'estrutura_gramatical', $$Can/can't para regras e permissão (terceira função de can), com short answers.$$,
    'pontos_atencao', jsonb_build_array($$Terceira função de 'can' — nomear explicitamente a diferença (habilidade/pedido/permissão).$$, $$'Can I...?' de permissão e de pedido educado são estruturalmente idênticos.$$),
    'foco_fonetico_som', $$Entonação de resposta curta 'Yes, you can' vs. 'No, you can't' (ênfase no 't' final).$$,
    'foco_fonetico_erro', $$Dificuldade em perceber can /kən/ vs. can't /kænt/ em fala rápida.$$,
    'foco_fonetico_correcao', $$Drilling específico de discriminação auditiva can/can't com pares contrastantes.$$,
    'tarefa_de_casa', $$Slides 7 e 8 + preparação slides 4 e 5 da aula 27.$$
  )),
  ('a1', 27, $$Present Continuous afirmativo + roupas$$, jsonb_build_object(
    'habilidades', jsonb_build_array('Speaking','Listening','Reading','Writing'),
    'tarefa_comunicativa', $$Descrever o que está vestindo (ou uma celebridade) agora, usando o present continuous afirmativo.$$,
    'estrutura_gramatical', $$Present continuous afirmativo (to be + verbo-ing) com regras ortográficas (+ing, -e+ing, dobra de consoante) e vocabulário de roupas.$$,
    'pontos_atencao', jsonb_build_array($$Regras ortográficas do -ing são o ponto técnico mais denso da aula.$$, $$Itens sempre no plural (jeans, shorts) vs. singular (a jacket) podem confundir a concordância.$$),
    'foco_fonetico_som', $$Pronúncia do -ing como /ɪŋ/ (nunca com 'g' forte no final).$$,
    'foco_fonetico_erro', $$Aplicar a mesma regra de -ing pra todos os verbos; pronunciar o -ing com 'g' forte.$$,
    'foco_fonetico_correcao', $$Agrupar verbos por regra ortográfica antes do exercício de escrita.$$,
    'tarefa_de_casa', $$Slides 15 e 16 + preparação slide 3 da aula 28.$$
  )),
  ('a1', 28, $$Present Continuous completo + clima$$, jsonb_build_object(
    'habilidades', jsonb_build_array('Speaking','Listening','Reading','Writing'),
    'tarefa_comunicativa', $$Descrever o que está acontecendo agora e o clima no momento, usando o present continuous nas 3 formas.$$,
    'estrutura_gramatical', $$Present continuous completo (afirmativa, negativa, interrogativa) e vocabulário de estações/clima.$$,
    'pontos_atencao', jsonb_build_array($$Aula de consolidação — checar se as regras do -ing (Aula 27) já estão internalizadas.$$, $$Negativa/interrogativa seguem o padrão do to be (Aulas 3-4), aproveitar essa base.$$),
    'foco_fonetico_som', $$Entonação de perguntas no present continuous, reaproveitando o padrão do to be.$$,
    'foco_fonetico_erro', $$Uso de do/does pra negar/perguntar; esquecimento do to be auxiliar na negativa.$$,
    'foco_fonetico_correcao', $$Reforçar que o present continuous usa sempre to be, nunca do/does.$$,
    'tarefa_de_casa', $$Slides 13, 14 e 15 + preparação slide 3 da aula 29.$$
  )),
  ('a1', 29, $$Present Simple vs Continuous$$, jsonb_build_object(
    'habilidades', jsonb_build_array('Speaking','Listening','Reading','Writing'),
    'tarefa_comunicativa', $$Sugerir um lugar para ir de acordo com o hábito da pessoa e o clima atual, contrastando simple e continuous.$$,
    'estrutura_gramatical', $$Contraste de uso entre present simple (hábitos: always/usually/sometimes/never) e continuous (agora/hoje).$$,
    'pontos_atencao', jsonb_build_array($$Ponto crítico de todo o bloco 13-28: decidir qual tempo usar conforme o contexto, não só conjugar certo.$$, $$Marcadores temporais são a pista mais confiável — reforçar essa associação.$$),
    'foco_fonetico_som', $$Sem padrão fonético novo central — foco na escolha do tempo verbal certo.$$,
    'foco_fonetico_erro', $$Uso do continuous para hábitos gerais; confusão sem marcador temporal explícito.$$,
    'foco_fonetico_correcao', $$Quadro contrastivo visual (marcadores de hábito vs. momento) fixado durante a aula.$$,
    'tarefa_de_casa', $$Slides 11 e 12.$$
  )),
  ('a1', 30, $$Revisão GRANDE 16-29$$, jsonb_build_object(
    'habilidades', jsonb_build_array('Speaking'),
    'tarefa_comunicativa', $$Role-plays e jogo de perguntas cobrindo advérbios, do/does, profissões, hobbies, imperativos, object pronouns, restaurante, can, simple vs. continuous.$$,
    'estrutura_gramatical', $$Revisão integrada de todo o bloco das Aulas 16-29.$$,
    'pontos_atencao', jsonb_build_array($$Maior revisão do nível até aqui (14 aulas) — usar Forms + fluência oral como dado robusto pro Registro de Classe.$$, $$As três funções de 'can' tendem a se confundir sob pressão de revisão ampla.$$),
    'foco_fonetico_som', $$Revisão consolidada: -ing, 3ª pessoa, can forte/fraco, contrações do to be.$$,
    'foco_fonetico_erro', $$Mistura das três funções de can; reincidência pontual de erros já mapeados.$$,
    'foco_fonetico_correcao', $$Usar o Registro de Classe pra mapear os 2-3 padrões mais recorrentes e planejar reforço nas Aulas 31+.$$,
    'tarefa_de_casa', $$Google Forms de revisão gramatical (se não concluído em sala).$$
  )),
  ('a1', 31, $$There is/are + casa$$, jsonb_build_object(
    'habilidades', jsonb_build_array('Speaking','Listening','Reading','Writing'),
    'tarefa_comunicativa', $$Descrever a própria casa cômodo por cômodo, usando there is/are (+ some/any).$$,
    'estrutura_gramatical', $$There is/are nas 3 formas + some (afirmativa)/any (negativa e interrogativa), com vocabulário de cômodos e móveis.$$,
    'pontos_atencao', jsonb_build_array($$Distinção some (afirmativa) vs. any (negativa/interrogativa) é o ponto técnico central.$$, $$Muito vocabulário novo — priorizar o padrão gramatical sobre a lista completa.$$),
    'foco_fonetico_som', $$Contração 'there's' /ðɛərz/ nas afirmativas.$$,
    'foco_fonetico_erro', $$Uso de 'some' em perguntas/negativas; concordância incorreta is/are com singular/plural.$$,
    'foco_fonetico_correcao', $$Drilling de transformação: afirmativa com some → negativa/interrogativa com any.$$,
    'tarefa_de_casa', $$Slide 10 + preparação slides 10, 11 e 12 da aula 32.$$
  )),
  ('a1', 32, $$To Be passado (was/were)$$, jsonb_build_object(
    'habilidades', jsonb_build_array('Speaking','Listening','Writing'),
    'tarefa_comunicativa', $$Jogo: adivinhar onde/quem celebridades eram quando jovens, usando was/were.$$,
    'estrutura_gramatical', $$Passado do to be (was/were) afirmativo, com marcadores de tempo passado (yesterday, last night, in 2010).$$,
    'pontos_atencao', jsonb_build_array($$Aluno usa 'was' para todas as pessoas, esquecendo 'were' para you/we/they.$$, $$Marcadores de tempo passado são novos e precisam de destaque.$$),
    'foco_fonetico_som', $$Diferenciação de vogal entre was /wʌz/ e were /wɜːr/.$$,
    'foco_fonetico_erro', $$Uso de 'was' para you/we/they; omissão dos marcadores de tempo passado.$$,
    'foco_fonetico_correcao', $$Drilling contrastivo was/were com os pronomes, destacando a diferença vocálica.$$,
    'tarefa_de_casa', $$Slides 14 e 15 + separar uma foto antiga para a próxima aula.$$
  )),
  ('a1', 33, $$Meses, datas, números ordinais$$, jsonb_build_object(
    'habilidades', jsonb_build_array('Speaking','Listening','Reading'),
    'tarefa_comunicativa', $$Perguntar e dizer datas (aniversário, feriados) usando números ordinais e os meses do ano.$$,
    'estrutura_gramatical', $$Números ordinais (first, second, third...thirtieth) e estrutura pra dizer datas (the + ordinal + of + mês).$$,
    'pontos_atencao', jsonb_build_array($$Ordinais irregulares (first, second, third, fifth, eighth, ninth, twelfth) precisam de destaque especial.$$, $$Duas formas de dizer a data podem confundir — deixar claro que ambas são aceitas.$$),
    'foco_fonetico_som', $$Pronúncia do sufixo '-th' como em 'thanks' /θ/, presente em quase todos os ordinais.$$,
    'foco_fonetico_erro', $$Regularizar ordinais irregulares ('threeth' em vez de 'third'); omitir o artigo 'the'.$$,
    'foco_fonetico_correcao', $$Isolar e praticar repetidamente os ordinais irregulares antes de generalizar a regra +th.$$,
    'tarefa_de_casa', $$Flexge.$$
  )),
  ('a1', 34, $$Was/were completo + signos do zodíaco$$, jsonb_build_object(
    'habilidades', jsonb_build_array('Speaking','Listening','Writing'),
    'tarefa_comunicativa', $$Descobrir o signo do zodíaco de um colega/familiar a partir da data de nascimento, usando was/were nas 3 formas.$$,
    'estrutura_gramatical', $$Consolidação de was/were nas 3 formas (afirmativa, negativa, interrogativa + short answers), aplicado aos signos.$$,
    'pontos_atencao', jsonb_build_array($$Fecha o sistema was/were — checar se a distinção por pessoa já está consolidada.$$, $$Nomes dos signos têm pronúncia bem diferente do português.$$),
    'foco_fonetico_som', $$Pronúncia dos nomes dos signos (Sagittarius, Capricorn, Aquarius), origem grega/latina.$$,
    'foco_fonetico_erro', $$Negativa/interrogativa com was/were ainda inconsistente ('Were he a scientist?').$$,
    'foco_fonetico_correcao', $$Retomar rapidamente o quadro was/were por pessoa antes da atividade de signos.$$,
    'tarefa_de_casa', $$Slides 17, 18 e 19.$$
  )),
  ('a1', 35, $$Past Simple regular — formação e regras$$, jsonb_build_object(
    'habilidades', jsonb_build_array('Speaking','Listening','Reading','Writing'),
    'tarefa_comunicativa', $$Contar os fatos principais de uma viagem passada usando o past simple regular.$$,
    'estrutura_gramatical', $$Past simple regular (+ed/-d/-ied, dobra de consoante) nas 3 formas, com o auxiliar did.$$,
    'pontos_atencao', jsonb_build_array($$Regras ortográficas do -ed são o núcleo técnico desta aula.$$, $$Negativa/interrogativa com 'did' + verbo na forma base é padrão novo que precisa de reforço.$$),
    'foco_fonetico_som', $$As três pronúncias do -ed: /t/, /d/, /ɪd/ conforme o som final do verbo.$$,
    'foco_fonetico_erro', $$Conjugar o verbo principal mesmo depois de 'did'; pronunciar todos os -ed como /ɪd/.$$,
    'foco_fonetico_correcao', $$Reforçar que 'did' já carrega o passado; drilling das 3 pronúncias do -ed com os verbos do deck.$$,
    'tarefa_de_casa', $$Slides 10, 11 e 12.$$
  )),
  ('a1', 36, $$Pronúncia do -ed + vocabulário de férias$$, jsonb_build_object(
    'habilidades', jsonb_build_array('Speaking','Listening','Writing'),
    'tarefa_comunicativa', $$Narrar uma história de viagem com pronúncia correta do passado (-ed) e vocabulário de férias.$$,
    'estrutura_gramatical', $$Consolidação da pronúncia do -ed (/t/, /d/, /ɪd/) e expressões de viagem (pack bags, book flight, enjoy the trip).$$,
    'pontos_atencao', jsonb_build_array($$Aula 'gêmea' da 35, dedicada à automatização da pronúncia — não introduzir gramática nova.$$, $$Expressões de viagem tendem a ser traduzidas literalmente — reforçar como blocos fixos.$$),
    'foco_fonetico_som', $$Consolidação das 3 pronúncias do -ed em fala corrida (narrativa).$$,
    'foco_fonetico_erro', $$Persistência de pronunciar todo -ed como /ɪd/ sob pressão de fala espontânea.$$,
    'foco_fonetico_correcao', $$Feedback fonético específico durante a narrativa da Tarefa Final, sem interromper o fluxo.$$,
    'tarefa_de_casa', $$Flexge.$$
  )),
  ('a1', 37, $$Past Simple irregular — verbos centrais$$, jsonb_build_object(
    'habilidades', jsonb_build_array('Speaking','Listening','Reading','Writing'),
    'tarefa_comunicativa', $$Contar o que fez/comeu/bebeu em um evento recente usando verbos irregulares centrais no past simple.$$,
    'estrutura_gramatical', $$Past simple irregular (find→found, make→made, spend→spent, have→had, do→did, give→gave, eat→ate, drink→drank) e could/couldn't.$$,
    'pontos_atencao', jsonb_build_array($$Verbos irregulares exigem memorização direta — 'não tem regra, é decorar'.$$, $$'Could' como passado de 'can' não usa did/didn't — mesma exceção do próprio can.$$),
    'foco_fonetico_som', $$Pronúncia específica: /faʊnd/ (found), /meɪd/ (made), /spɛnt/ (spent), /eɪt/ (ate), /dræŋk/ (drank).$$,
    'foco_fonetico_erro', $$Regularizar verbos irregulares ('eated' em vez de 'ate'); usar didn't + could em vez de couldn't.$$,
    'foco_fonetico_correcao', $$Jogos de memorização rápida (presente→passado) antes da produção livre.$$,
    'tarefa_de_casa', $$Slides 13 e 14.$$
  )),
  ('a1', 38, $$Vocabulário de aniversário + prática extra$$, jsonb_build_object(
    'habilidades', jsonb_build_array('Speaking','Listening','Writing'),
    'tarefa_comunicativa', $$Entrevistar um colega sobre um aniversário memorável e escrever sobre o próprio, consolidando past simple regular e irregular.$$,
    'estrutura_gramatical', $$Consolidação do past simple (regular + irregular) aplicado a aniversários (lugares, comidas, presentes, atividades).$$,
    'pontos_atencao', jsonb_build_array($$Mistura perguntas com was/were e com did no mesmo bloco — ótimo teste de consolidação.$$, $$Vocabulário de festa é extenso; priorizar a gramática sobre 100% do vocabulário.$$),
    'foco_fonetico_som', $$Revisão consolidada das pronúncias do -ed e verbos irregulares centrais (Aulas 35-37).$$,
    'foco_fonetico_erro', $$Confundir was/were (estado/lugar) e did (ações) na mesma sequência.$$,
    'foco_fonetico_correcao', $$Não interromper a entrevista — anotar no Registro de Classe e reforçar pontualmente ao final.$$,
    'tarefa_de_casa', $$Slides 25, 26 e 27.$$
  )),
  ('a1', 39, $$Past Simple regular + irregular combinados$$, jsonb_build_object(
    'habilidades', jsonb_build_array('Speaking','Listening','Reading','Writing'),
    'tarefa_comunicativa', $$Escrever e narrar um roteiro de 'um dia na minha vida' combinando past simple regular e irregular.$$,
    'estrutura_gramatical', $$Consolidação final do past simple (regular + irregular + was/were + could) via a história de vida de uma influenciadora.$$,
    'pontos_atencao', jsonb_build_array($$Aula de fechamento do bloco de passado (Aulas 32-39) antes da grande revisão (Aula 40).$$, $$Narrativa de vida real ajuda o aluno a perceber a função comunicativa do passado.$$),
    'foco_fonetico_som', $$Consolidação geral de todos os padrões fonéticos do passado trabalhados até aqui.$$,
    'foco_fonetico_erro', $$Mistura ocasional de regular/irregular; perda de consistência temporal ao narrar.$$,
    'foco_fonetico_correcao', $$Sugerir que o aluno rascunhe o roteiro por escrito antes de narrar oralmente.$$,
    'tarefa_de_casa', $$Slide 9.$$
  )),
  ('a1', 40, $$Revisão 31-39$$, jsonb_build_object(
    'habilidades', jsonb_build_array('Speaking','Writing'),
    'tarefa_comunicativa', $$Checklist de autoavaliação (can-do) com um colega, cobrindo casa/móveis, passado do to be, datas/zodíaco, férias e aniversário.$$,
    'estrutura_gramatical', $$Revisão integrada de todo o bloco das Aulas 31-39: there is/are + some/any, was/were, datas/ordinais, past simple, could.$$,
    'pontos_atencao', jsonb_build_array($$Penúltima revisão antes do bloco final — o checklist alimenta o Registro de Classe e prepara a Aula 44.$$, $$Observar a consistência do passado, já que será revisitado comparando com o futuro.$$),
    'foco_fonetico_som', $$Revisão consolidada de todos os padrões fonéticos do bloco 31-39.$$,
    'foco_fonetico_erro', $$Itens do checklist marcados 'não consigo ainda' devem virar dado real pro planejamento, não falha a esconder.$$,
    'foco_fonetico_correcao', $$Usar os itens marcados pra montar reforço/repescagem se necessário.$$,
    'tarefa_de_casa', $$Google Forms de revisão gramatical (se não concluído em sala).$$
  )),
  ('a1', 41, $$Present Continuous p/ futuro (compromissos)$$, jsonb_build_object(
    'habilidades', jsonb_build_array('Speaking','Listening','Reading','Writing'),
    'tarefa_comunicativa', $$Role-play: marcar um encontro com um colega, encontrando um dia/horário livre em comum.$$,
    'estrutura_gramatical', $$Present continuous para futuro combinado/compromissos (What are you doing tonight?), com marcadores (tonight, tomorrow, next week).$$,
    'pontos_atencao', jsonb_build_array($$Segunda função do present continuous (depois de 'agora', Aulas 27-28) — reforçar que o marcador temporal muda o sentido.$$, $$Aluno pode tentar usar 'will' por transferência — redirecionar gentilmente.$$),
    'foco_fonetico_som', $$Entonação de convite/negociação ('Would you like to meet for lunch?').$$,
    'foco_fonetico_erro', $$Confundir futuro combinado com ação em andamento agora, sem o marcador temporal.$$,
    'foco_fonetico_correcao', $$Reforçar que o marcador temporal (tonight, next week) sinaliza 'futuro combinado', com contraste direto com a Aula 28.$$,
    'tarefa_de_casa', $$Google Forms + escrever a própria agenda da semana com 3 compromissos reais.$$
  )),
  ('a1', 42, $$Present Continuous p/ futuro (viagens)$$, jsonb_build_object(
    'habilidades', jsonb_build_array('Speaking','Listening','Reading','Writing'),
    'tarefa_comunicativa', $$Planejar e apresentar uma viagem dos sonhos, usando o present continuous para futuro combinado.$$,
    'estrutura_gramatical', $$Consolidação do present continuous para futuro (Aula 41), aplicado a planos de viagem (pack bags, book flight, exchange money).$$,
    'pontos_atencao', jsonb_build_array($$Amplia o uso da Aula 41 para um contexto mais extenso — bom teste de transferência.$$, $$Vocabulário de preparativos é extenso; priorizar a estrutura gramatical.$$),
    'foco_fonetico_som', $$Entonação de entusiasmo/expectativa ao falar de planos de viagem ('I'm so excited!').$$,
    'foco_fonetico_erro', $$Voltar ao present simple ou usar 'will' ao descrever planos já combinados.$$,
    'foco_fonetico_correcao', $$Reforçar, com exemplos lado a lado, que planos já decididos pedem present continuous, não will.$$,
    'tarefa_de_casa', $$Google Forms + parágrafo sobre a viagem dos sonhos com pelo menos 4 frases no present continuous de futuro.$$
  )),
  ('a1', 43, $$Revisão GRANDE de todos os tempos verbais$$, jsonb_build_object(
    'habilidades', jsonb_build_array('Speaking','Listening'),
    'tarefa_comunicativa', $$Entrevista com perguntas variadas cobrindo o curso inteiro, incluindo comparação de objetos antigos vs. tecnologia atual.$$,
    'estrutura_gramatical', $$Revisão integrada de todos os tempos verbais do A1: to be, present simple, present continuous (agora e futuro), passado.$$,
    'pontos_atencao', jsonb_build_array($$Revisão mais ampla do nível — ensaio geral pra Apresentação Final (Aula 44) e Avaliação Final de Nível.$$, $$Observar com atenção a escolha correta do tempo verbal em conversa livre e extensa.$$),
    'foco_fonetico_som', $$Revisão consolidada de todos os padrões fonéticos centrais do curso.$$,
    'foco_fonetico_erro', $$Mistura ocasional de tempos verbais em conversa longa e espontânea.$$,
    'foco_fonetico_correcao', $$Não interromper — usar o Registro de Classe pra consolidar um panorama final de cada aluno antes da Aula 44.$$,
    'tarefa_de_casa', $$Google Forms de revisão gramatical (se não concluído em sala).$$
  )),
  ('a1', 44, $$Apresentação Final de Nível — "Minha história até aqui — e minha próxima viagem"$$, jsonb_build_object(
    'habilidades', jsonb_build_array('Speaking','Listening'),
    'tarefa_comunicativa', $$Parte A — apresentação individual (3-4 min): quem eu sou, rotina, viagem/evento marcante, lugar/pessoa importante, próximo destino dos sonhos. Parte B (1-2 min): interação espontânea com o professor numa situação sorteada (hotel/restaurante/loja).$$,
    'estrutura_gramatical', $$To be/possessivos/genitivo 's (Bloco 1) · Present simple e advérbios (Bloco 2) · Past simple (Bloco 3) · Adjetivos e there is/are (Bloco 4) · Present continuous para futuro (Bloco 5).$$,
    'pontos_atencao', jsonb_build_array($$Prioridade 100% da aula é a Apresentação Final — não cortar tempo de apresentação por revisão extra.$$, $$Usar o Registro de Classe desta aula + revisões-teste anteriores (15/30/40/43) como base pro Report Card semestral.$$),
    'foco_fonetico_som', $$Fluência e entonação natural na fala espontânea, integrando os padrões fonéticos de todo o curso.$$,
    'foco_fonetico_erro', $$Sob pressão da apresentação, padrões de erro já mapeados podem reaparecer pontualmente — não é reprovação automática.$$,
    'foco_fonetico_correcao', $$Não corrigir durante a apresentação — reservar observações pro feedback individual após a atividade.$$,
    'tarefa_de_casa', $$Nenhuma — ao final, o professor agenda a Avaliação Final de Nível (evento formal, fora da grade).$$
  ))
on conflict (materia_slug, numero) do nothing;

-- ----------------------------------------------------------------------
-- 13) REPORT CARD — geração a partir do Registro de Classe, com fluxo de
--     aprovação em 3 etapas (Gestão gera → libera pro Professor →
--     Professor revisa/completa → libera pro Aluno). O aluno NUNCA vê um
--     Report Card em rascunho; o professor só vê depois de liberado.
-- ----------------------------------------------------------------------

-- 13.1) O Report Card pede 5 eixos (Speaking/Listening/Reading/Writing/
--       Gramática), mas o Registro de Classe do A1 só tinha 4 (sem
--       Gramática, com Reading/Writing combinados em "Read./Writ."). Em
--       vez de deixar 3 eixos permanentemente sem fonte de dado, expande
--       os eixos do A1 pra bater com o Report Card — dirigido só por
--       config (materias.eixos_avaliacao), sem mudar código do Registro
--       de Classe. Idempotente: só migra quem ainda está no default
--       antigo, não sobrescreve customização manual feita depois.
update public.materias
set eixos_avaliacao = '["Tarefa Final","Speaking","Listening","Reading","Writing","Gramática"]'::jsonb
where slug = 'a1'
  and eixos_avaliacao = '["Tarefa Final","Speaking","Listening","Read./Writ."]'::jsonb;

-- 13.2) Um Report Card por (aluno, matéria/nível, semestre) — igual
--       Registro de Classe, vinculado ao ALUNO (não à turma), então
--       sobrevive a troca de turma/professor. "dados" em JSONB guarda os
--       blocos B-I (frequência, avaliação por eixo, revisões-teste,
--       apresentação final, pontos fortes/fracos, considerações,
--       encaminhamento) — estrutura pode evoluir por nível sem migração.
create table if not exists public.report_cards (
  id bigint generated always as identity primary key,
  aluno_id uuid not null references auth.users(id) on delete cascade,
  materia_slug text not null references public.materias(slug) on delete restrict,
  semestre int not null check (semestre in (1,2)),
  aula_inicio int not null,
  aula_fim int not null,
  status text not null default 'rascunho' check (status in ('rascunho','liberado_professor','liberado_aluno')),
  dados jsonb not null default '{}'::jsonb,
  turma_id uuid references public.turmas(id) on delete set null,
  professor_id uuid references auth.users(id) on delete set null,
  gerado_por uuid references auth.users(id),
  gerado_em timestamptz,
  liberado_professor_por uuid references auth.users(id),
  liberado_professor_em timestamptz,
  revisado_por uuid references auth.users(id),
  revisado_em timestamptz,
  liberado_aluno_por uuid references auth.users(id),
  liberado_aluno_em timestamptz,
  atualizado_em timestamptz default now()
);

alter table public.report_cards drop constraint if exists report_cards_aluno_materia_semestre_key;
alter table public.report_cards add constraint report_cards_aluno_materia_semestre_key unique (aluno_id, materia_slug, semestre);

create index if not exists idx_report_cards_aluno on public.report_cards (aluno_id);

alter table public.report_cards enable row level security;

-- Professor: só enxerga depois de liberado (nunca rascunho), mesmo padrão
-- de registros_classe — visibilidade pela turma ATUAL do aluno.
drop policy if exists "professoras veem report cards liberados dos alunos atuais" on public.report_cards;
create policy "professoras veem report cards liberados dos alunos atuais"
  on public.report_cards for select
  using (
    status <> 'rascunho'
    and exists (
      select 1 from public.profiles p
      where p.id = public.report_cards.aluno_id
        and p.turma_id is not null
        and public.teacher_can_see_turma(p.turma_id)
    )
  );

drop policy if exists "professoras atualizam report cards liberados dos alunos atuais" on public.report_cards;
create policy "professoras atualizam report cards liberados dos alunos atuais"
  on public.report_cards for update
  using (
    status <> 'rascunho'
    and exists (
      select 1 from public.profiles p
      where p.id = public.report_cards.aluno_id
        and p.turma_id is not null
        and public.teacher_can_see_turma(p.turma_id)
    )
  )
  with check (
    exists (
      select 1 from public.profiles p
      where p.id = public.report_cards.aluno_id
        and p.turma_id is not null
        and public.teacher_can_see_turma(p.turma_id)
    )
  );

-- Aluno: só o próprio, só depois de liberado pra ele.
drop policy if exists "aluno ve o proprio report card liberado" on public.report_cards;
create policy "aluno ve o proprio report card liberado"
  on public.report_cards for select
  using (aluno_id = auth.uid() and status = 'liberado_aluno');

drop policy if exists "admins gerenciam todos os report cards" on public.report_cards;
create policy "admins gerenciam todos os report cards"
  on public.report_cards for all
  using (public.is_admin())
  with check (public.is_admin());

drop trigger if exists trg_audit_report_cards on public.report_cards;
create trigger trg_audit_report_cards
  after insert or update or delete on public.report_cards
  for each row execute procedure public.log_financeiro_auditoria();

-- ----------------------------------------------------------------------
-- 14) MATERIAL DIDÁTICO — link do PowerPoint/Slides de cada aula
--     Cada aula de uma matéria-com-currículo (nivel_aulas) ganha um link
--     externo (Google Slides/Drive) pro material usado em sala. A gestão
--     cadastra o link (gestao.html, aba Matérias → botão "Material"); a
--     professora consulta no Plano da Aula, dentro do Registro de Classe
--     (professora.html); o aluno vê o link das aulas que já tiverem
--     Registro de Classe lançado em nome dele — SEM enxergar o Registro de
--     Classe em si (é anotação interna da professora, ver 14.1). A RLS
--     abaixo cobre a LEITURA de nivel_aulas por aluno (mesma regra de
--     acesso de turma_materias); o filtro "só aulas já dadas" fica na
--     tela (area-do-aluno.html), usando a função de 14.1 pra saber quais
--     aulas já foram registradas sem ler o conteúdo do registro.
-- ----------------------------------------------------------------------
alter table public.nivel_aulas add column if not exists material_url text;

drop policy if exists "alunos veem aulas do nivel da propria turma" on public.nivel_aulas;
create policy "alunos veem aulas do nivel da propria turma"
  on public.nivel_aulas for select
  using (
    exists (
      select 1 from public.profiles p
      join public.turma_materias tm on tm.turma_id = p.turma_id
      where p.id = auth.uid() and tm.materia_slug = public.nivel_aulas.materia_slug
    )
  );

-- 14.1) Pré-requisito pra tela de Material filtrar "só aulas já dadas" —
--       SEM abrir leitura de registros_classe pro aluno: aquela tabela é
--       anotação INTERNA da professora (avaliações por eixo, observações),
--       nunca deve ser lida pelo aluno, nem em parte. Por isso não existe
--       (e não deve existir) uma policy de SELECT com aluno_id = auth.uid()
--       nela — em vez disso, esta função "security definer" devolve só os
--       IDs de aula já registrados pro aluno logado, sem expor nenhum
--       outro campo da linha.
create or replace function public.minhas_aulas_registradas(check_materia_slug text)
returns table(nivel_aula_id uuid) -- "table(...)" (não "setof uuid") pra a resposta via API sair sempre como
                                   -- [{"nivel_aula_id": "..."}], sem ambiguidade de formato de array escalar
language sql
stable
security definer set search_path = public
as $$
  -- "distinct": uma aula pode ter mais de um registro (um por data),
  -- mas aqui só interessa se ela já foi dada — um id por aula.
  select distinct rc.nivel_aula_id
  from public.registros_classe rc
  join public.nivel_aulas na on na.id = rc.nivel_aula_id
  where rc.aluno_id = auth.uid() and na.materia_slug = check_materia_slug;
$$;

grant execute on function public.minhas_aulas_registradas(text) to authenticated;

-- ----------------------------------------------------------------------
-- 15) ATIVIDADES POR AULA — rework do módulo de atividades complementares
--     (piloto A1). Até aqui, "published_activities"/"materia_activities"/
--     "activity_results" identificavam uma atividade só por
--     (course, activity_num) — funcionava enquanto só existia a Aula 01 do
--     A1, mas colide assim que a Aula 02 é cadastrada (ambas teriam uma
--     "activity_num=1", "activity_num=2"...). A coluna "aula" abaixo
--     resolve isso; "default 1" faz o backfill sozinho (linhas existentes
--     do A1 são todas da Aula 01; o TOEFL não tem conceito de aula — fica
--     fixo em aula=1 pra sempre, é uma trilha linear de 16 atividades).
-- ----------------------------------------------------------------------

-- 15.1) published_activities — liberação visível pro aluno
alter table public.published_activities add column if not exists aula int not null default 1;
alter table public.published_activities drop constraint if exists published_activities_course_activity_num_key;
alter table public.published_activities add constraint published_activities_course_aula_activity_num_key
  unique (course, aula, activity_num);
create index if not exists idx_published_activities_course_aula on public.published_activities (course, aula);

-- Seed da seção 7 (movido pra cá — ver comentário lá): libera as 16
-- atividades do TOEFL (aula=1, sua única aula) de uma vez, sem "sumir"
-- com escolha manual já feita. Só roda depois da chave única (course,
-- aula, activity_num) acima existir, senão o "on conflict" não bate.
insert into public.published_activities (course, aula, activity_num, is_published)
select 'toefl', 1, n, true
from generate_series(1, 16) as n
on conflict (course, aula, activity_num) do nothing;

-- 15.2) materia_activities — liberação gestão→professor (mesmo problema, mesma solução)
alter table public.materia_activities add column if not exists aula int not null default 1;
alter table public.materia_activities drop constraint if exists materia_activities_pkey;
alter table public.materia_activities add constraint materia_activities_pkey primary key (materia_slug, aula, activity_num);

-- Seed da seção 8.2.1 (movido pra cá — mesmo motivo do de cima).
insert into public.materia_activities (materia_slug, aula, activity_num, released_to_teachers)
select 'toefl', 1, n, true
from generate_series(1, 16) as n
on conflict (materia_slug, aula, activity_num) do nothing;

-- Atualiza a função de checagem (usada pela policy de published_activities
-- logo abaixo) pra levar "aula" em conta. "check_aula int default 1" evita
-- quebrar qualquer chamada antiga que ainda não passe esse argumento.
--
-- "create or replace" não basta aqui: como a assinatura muda (2 → 3
-- parâmetros), o Postgres trata como uma função NOVA em vez de substituir
-- a de cima (seção 8.2.1) — ficam as duas ao mesmo tempo, e qualquer
-- chamada com 2 argumentos vira ambígua entre elas ("function ... is not
-- unique"). Por isso precisa apagar a versão antiga primeiro.
drop function if exists public.activity_released_to_teachers(text, int);
create or replace function public.activity_released_to_teachers(check_course text, check_activity_num int, check_aula int default 1)
returns boolean
language sql
stable
security definer set search_path = public
as $$
  select coalesce(
    (select released_to_teachers from public.materia_activities
     where materia_slug = check_course and activity_num = check_activity_num and aula = check_aula),
    true
  );
$$;

drop policy if exists "professoras podem liberar/ocultar atividades" on public.published_activities;
create policy "professoras podem liberar/ocultar atividades"
  on public.published_activities for all
  using (public.is_teacher())
  with check (public.is_teacher() and public.activity_released_to_teachers(course, activity_num, aula));

-- 15.3) activity_results — mesma coluna "aula" + modelo de progresso de 5 estados.
--       "Bloqueada"/"Disponível" nunca são gravados aqui — são sempre calculados
--       no cliente comparando published_activities com a ausência/presença de
--       linha nesta tabela (evita uma segunda fonte de verdade que poderia
--       desincronizar). Só os 3 estados que dependem de uma AÇÃO do aluno
--       viram uma linha de verdade: em_andamento (autosave parcial),
--       concluida (clicou "Concluir") e pulada (clicou "Pular atividade").
alter table public.activity_results add column if not exists aula int not null default 1;
alter table public.activity_results drop constraint if exists activity_results_user_course_activity_key;
alter table public.activity_results add constraint activity_results_user_course_aula_activity_key
  unique (user_id, course, aula, activity_num);
create index if not exists idx_activity_results_course_aula on public.activity_results (course, aula);

alter table public.activity_results add column if not exists status text not null default 'em_andamento';
alter table public.activity_results drop constraint if exists activity_results_status_check;
alter table public.activity_results add constraint activity_results_status_check
  check (status in ('em_andamento','concluida','pulada'));
alter table public.activity_results add column if not exists skipped_at timestamptz;

-- Backfill: linhas que já existiam antes desta coluna existir e já
-- representam uma atividade CONCLUÍDA (não só iniciada) — inferido do
-- formato de "meta" que cada engine já gravava. Sem isso, todo progresso
-- salvo antes de hoje apareceria como "em andamento" na nova tela.
update public.activity_results set status = 'concluida'
where status = 'em_andamento' and (
  (meta ? 'acertos') -- padrão A1 (quiz simples: {acertos, total})
  or (
    meta->'progress' is not null
    and coalesce((meta->'progress'->>'reading')::boolean, false)
    and coalesce((meta->'progress'->>'listening')::boolean, false)
    and coalesce((meta->'progress'->>'writing')::boolean, false)
    and coalesce((meta->'progress'->>'speaking')::boolean, false)
    and coalesce((meta->'progress'->>'grammar')::boolean, false)
  )
);

-- 15.4) Segurança na gravação — reforço no banco (não só na tela): mesmo
--       que alguém chame a API do Supabase direto pelo console do
--       navegador tentando gravar progresso numa atividade que a
--       professora não liberou, o Postgres rejeita. Professora/gestão
--       continuam sem essa trava (mesma lógica de "revisar antes de
--       liberar" que já existe em dyseRequirePublished).
create or replace function public.enforce_activity_published()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if public.is_teacher() or public.is_admin() then
    return new;
  end if;
  if not exists (
    select 1 from public.published_activities pa
    where pa.course = new.course and pa.aula = new.aula
      and pa.activity_num = new.activity_num and pa.is_published = true
  ) then
    raise exception 'Atividade não liberada para este aluno.';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_enforce_activity_published on public.activity_results;
create trigger trg_enforce_activity_published
  before insert or update on public.activity_results
  for each row execute procedure public.enforce_activity_published();

-- 15.5) Currículo do TOEFL — só o suficiente pra ele aparecer como opção
--       no Registro de Classe (mesma trava de "total_aulas preenchido"
--       usada pelo A1, seção 12.1). 3 linhas de exemplo: a gestão adiciona
--       o resto pela tela (botão "+ Adicionar aula" no modal de Material,
--       gestao.html — funciona pra qualquer matéria, não só o TOEFL).
update public.materias
set total_aulas = coalesce(total_aulas, 3),
    eixos_avaliacao = coalesce(eixos_avaliacao, '["Reading","Listening","Writing","Speaking","Grammar"]'::jsonb)
where slug = 'toefl';

insert into public.nivel_aulas (materia_slug, numero, topico, conteudo)
values
  ('toefl', 1, 'Rotina Diária (A2)', '{}'::jsonb),
  ('toefl', 2, 'Viagens e Turismo (A2)', '{}'::jsonb),
  ('toefl', 3, 'Alimentação e Saúde (B1)', '{}'::jsonb)
on conflict (materia_slug, numero) do nothing;

-- ----------------------------------------------------------------------
-- 16) Ativar/desativar e excluir aula (modal de Material, gestao.html).
--     "ativo=false" tira a aula das telas de USO (professora escolhendo
--     aula pra registrar classe, aluno vendo o Material, catálogo de
--     cursos) sem apagar nada — histórico (registros_classe, report cards)
--     continua enxergando a aula normalmente, porque essas duas telas
--     pedem "incluir inativas" explicitamente (ver dyseListNivelAulas).
--     Excluir de verdade é bloqueado pelo próprio banco quando já existe
--     registro_classe pra essa aula (nivel_aula_id ... on delete restrict,
--     seção 12.4) — a tela mostra uma mensagem amigável nesse caso, em vez
--     de deixar a exclusão "sumir" com histórico.
-- ----------------------------------------------------------------------
alter table public.nivel_aulas add column if not exists ativo boolean not null default true;

-- ----------------------------------------------------------------------
-- 17) CALENDÁRIO LETIVO
--     Calendário anual da escola. A gestão (is_admin() — inclui
--     "financeiro") marca cada dia clicando nele em /calendario-letivo.html
--     (feriado, recesso/férias, reposição de aulas, retorno das aulas de
--     conversação, início de semestre) e preenche à mão o quadro de
--     "informações importantes" (início/fim do ano letivo, total de dias e
--     de semanas letivas). Aluno e professor abrem a MESMA página, só
--     leitura, e só enxergam um ano depois que a gestão marca
--     calendario_letivo.publicado = true pra aquele ano.
-- ----------------------------------------------------------------------
create table if not exists public.calendario_letivo (
  ano_letivo int primary key,
  publicado boolean not null default false,
  inicio_ano text,
  fim_ano text,
  total_dias_letivos text,
  total_semanas_letivas text,
  observacao text,
  atualizado_por uuid references auth.users(id),
  atualizado_em timestamptz default now()
);

alter table public.calendario_letivo enable row level security;

drop policy if exists "calendario: leitura do ano publicado" on public.calendario_letivo;
create policy "calendario: leitura do ano publicado"
  on public.calendario_letivo for select
  using (publicado or public.is_admin());

drop policy if exists "calendario: gestao gerencia" on public.calendario_letivo;
create policy "calendario: gestao gerencia"
  on public.calendario_letivo for all
  using (public.is_admin())
  with check (public.is_admin());

create table if not exists public.calendario_letivo_dias (
  id bigint generated always as identity primary key,
  ano_letivo int not null references public.calendario_letivo(ano_letivo) on delete cascade,
  data date not null unique,
  tipo text not null check (tipo in ('recesso','feriado','reposicao','retorno_conversacao','inicio_semestre')),
  titulo text,
  atualizado_por uuid references auth.users(id),
  atualizado_em timestamptz default now()
);

create index if not exists idx_calendario_dias_ano on public.calendario_letivo_dias (ano_letivo, data);

alter table public.calendario_letivo_dias enable row level security;

drop policy if exists "calendario dias: leitura do ano publicado" on public.calendario_letivo_dias;
create policy "calendario dias: leitura do ano publicado"
  on public.calendario_letivo_dias for select
  using (
    public.is_admin()
    or exists (
      select 1 from public.calendario_letivo c
      where c.ano_letivo = calendario_letivo_dias.ano_letivo and c.publicado
    )
  );

drop policy if exists "calendario dias: gestao gerencia" on public.calendario_letivo_dias;
create policy "calendario dias: gestao gerencia"
  on public.calendario_letivo_dias for all
  using (public.is_admin())
  with check (public.is_admin());

-- ----------------------------------------------------------------------
-- 18) AVISOS DA COORDENAÇÃO + espelho da situação financeira no perfil
--
--     18.1) profiles.situacao_financeira — cópia da situação do período
--     financeiro ABERTO do aluno ('ativo'|'pausado'|'cancelado'|
--     'encerrado'), escrita por dyseSetAlunoFinanceiro. Existe só pra que
--     o PROFESSOR (que não enxerga aluno_financeiro_historico de aluno de
--     quem ele não é o responsável) consiga ver "(pausado)" na chamada e
--     bloquear a presença. A verdade continua sendo o histórico.
alter table public.profiles add column if not exists situacao_financeira text not null default 'ativo';

--     18.2) avisos — mural da coordenação (admin + financeiro). Hoje só o
--     evento "aluno pausado" cria aviso; a tabela é genérica pra reaproveito.
create table if not exists public.avisos (
  id bigint generated always as identity primary key,
  tipo text not null,
  titulo text not null,
  corpo text,
  aluno_id uuid references public.profiles(id) on delete set null,
  criado_por uuid references public.profiles(id) on delete set null,
  criado_em timestamptz not null default now()
);
create index if not exists idx_avisos_criado_em on public.avisos (criado_em desc);

alter table public.avisos enable row level security;

drop policy if exists "avisos: gestao le" on public.avisos;
create policy "avisos: gestao le"
  on public.avisos for select
  using (public.is_admin());

drop policy if exists "avisos: gestao cria" on public.avisos;
create policy "avisos: gestao cria"
  on public.avisos for insert
  with check (public.is_admin());

drop policy if exists "avisos: professor ve dos proprios alunos" on public.avisos;
create policy "avisos: professor ve dos proprios alunos"
  on public.avisos for select
  using (
    aluno_id is not null and exists (
      select 1 from public.profiles p
      where p.id = avisos.aluno_id
        and p.turma_id is not null
        and public.teacher_can_see_turma(p.turma_id)
    )
  );

--     18.3) avisos_lidos — estado de leitura por usuário (cada pessoa da
--     coordenação marca os seus como lidos).
create table if not exists public.avisos_lidos (
  aviso_id bigint not null references public.avisos(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  lido_em timestamptz not null default now(),
  primary key (aviso_id, user_id)
);

alter table public.avisos_lidos enable row level security;

drop policy if exists "avisos_lidos: cada um gerencia o proprio" on public.avisos_lidos;
create policy "avisos_lidos: cada um gerencia o proprio"
  on public.avisos_lidos for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ----------------------------------------------------------------------
-- 19) MATERIAL POR TURMA
--     nivel_aulas.material_url é o material BASE (modelo) de cada aula do
--     nível, cadastrado pela gestão. turma_aula_material é o override por
--     turma: o professor faz uma cópia do material base no Drive dele (com
--     as anotações da turma) e cola o link aqui, na tela do Registro de
--     Classe. O professor e os alunos DAQUELA turma passam a ver a cópia;
--     turma sem cópia continua vendo o material base. URL vazia apaga a
--     linha (volta pro base).
-- ----------------------------------------------------------------------
create table if not exists public.turma_aula_material (
  turma_id uuid not null references public.turmas(id) on delete cascade,
  nivel_aula_id uuid not null references public.nivel_aulas(id) on delete cascade,
  material_url text not null,
  atualizado_por uuid references public.profiles(id) on delete set null,
  atualizado_em timestamptz not null default now(),
  primary key (turma_id, nivel_aula_id)
);

alter table public.turma_aula_material enable row level security;

drop policy if exists "turma_aula_material: gestao gerencia" on public.turma_aula_material;
create policy "turma_aula_material: gestao gerencia"
  on public.turma_aula_material for all
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "turma_aula_material: professor da turma" on public.turma_aula_material;
create policy "turma_aula_material: professor da turma"
  on public.turma_aula_material for all
  using (public.teacher_can_see_turma(turma_id))
  with check (public.teacher_can_see_turma(turma_id));

drop policy if exists "turma_aula_material: aluno da propria turma" on public.turma_aula_material;
create policy "turma_aula_material: aluno da propria turma"
  on public.turma_aula_material for select
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.turma_id = turma_aula_material.turma_id
    )
  );

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


-- ----------------------------------------------------------------------
-- 20) MÓDULO ASAAS — conciliação de cobranças do gateway de pagamento
--
--     A DYSE já cobra as mensalidades pelo Asaas (produção): os clientes
--     e as assinaturas recorrentes JÁ EXISTEM lá. Este módulo NÃO cria
--     cobrança recorrente — ele:
--       a) casa cada aluno do sistema com o cliente do Asaas (por CPF e
--          por e-mail; quem não casar fica pra vínculo manual);
--       b) traz pra dentro do painel as assinaturas e cobranças de lá
--          (cache em asaas_assinaturas / asaas_cobrancas);
--       c) deixa a gestão gerar cobrança avulsa e emitir nota fiscal, e o
--          aluno ver as próprias cobranças / baixar boleto-PIX / emitir a
--          NF (só de boleto já pago);
--       d) concilia sozinho: o webhook do Asaas atualiza o status e o cron
--          diário suspende quem tem cobrança vencida há mais de 14 dias e
--          reativa quem regulariza (só se a pausa foi automática — ver a
--          coluna aluno_financeiro_historico.pausa_automatica em 20.5).
--
--     Escrita nas tabelas de cache é feita SÓ pelas funções serverless
--     (api/asaas-*.js) com a service_role; a RLS abaixo é de LEITURA:
--     is_financeiro() vê tudo, e o aluno vê só as próprias linhas.
-- ----------------------------------------------------------------------

-- 20.1) Vínculo aluno <-> cliente Asaas + dados fiscais do aluno.
--       Pode existir antes de casar (asaas_customer_id nulo) — a gestão
--       cadastra o CPF no modal "Editar financeiro" e o sync tenta casar.
create table if not exists public.aluno_asaas (
  aluno_id uuid primary key references auth.users(id) on delete cascade,
  cpf_cnpj text,                        -- só dígitos; da gestão OU backfill do Asaas
  asaas_customer_id text unique,        -- cus_xxx; nulo = ainda não casado
  match_metodo text not null default 'pendente'
    check (match_metodo in ('pendente','cpf','email','manual','nao_encontrado')),
  nome_asaas text,
  email_asaas text,
  sincronizado_em timestamptz,
  atualizado_em timestamptz not null default now()
);
create index if not exists idx_aluno_asaas_customer on public.aluno_asaas (asaas_customer_id);

alter table public.aluno_asaas enable row level security;

drop policy if exists "aluno_asaas: financeiro gerencia" on public.aluno_asaas;
create policy "aluno_asaas: financeiro gerencia"
  on public.aluno_asaas for all
  using (public.is_financeiro())
  with check (public.is_financeiro());

drop policy if exists "aluno_asaas: aluno le o proprio" on public.aluno_asaas;
create policy "aluno_asaas: aluno le o proprio"
  on public.aluno_asaas for select
  using (aluno_id = auth.uid());

-- 20.2) Cache das assinaturas (subscriptions) do Asaas.
create table if not exists public.asaas_assinaturas (
  id text primary key,                  -- sub_xxx
  aluno_id uuid references auth.users(id) on delete set null,
  asaas_customer_id text,
  valor numeric(10,2),
  ciclo text,                           -- MONTHLY, etc.
  status text,                          -- ACTIVE, INACTIVE, EXPIRED
  proximo_vencimento date,
  descricao text,
  sincronizado_em timestamptz not null default now(),
  raw jsonb
);
create index if not exists idx_asaas_assin_aluno on public.asaas_assinaturas (aluno_id);

alter table public.asaas_assinaturas enable row level security;

drop policy if exists "asaas_assinaturas: financeiro le" on public.asaas_assinaturas;
create policy "asaas_assinaturas: financeiro le"
  on public.asaas_assinaturas for select
  using (public.is_financeiro());

drop policy if exists "asaas_assinaturas: aluno le a propria" on public.asaas_assinaturas;
create policy "asaas_assinaturas: aluno le a propria"
  on public.asaas_assinaturas for select
  using (aluno_id = auth.uid());

-- 20.3) Cache das cobranças (payments) do Asaas. É desta tabela que o
--       painel do aluno e o cron leem — nunca da API direto no navegador.
create table if not exists public.asaas_cobrancas (
  id text primary key,                  -- pay_xxx
  aluno_id uuid references auth.users(id) on delete set null,
  asaas_customer_id text,
  subscription_id text,
  valor numeric(10,2),
  valor_liquido numeric(10,2),
  status text,                          -- PENDING, RECEIVED, CONFIRMED, OVERDUE, REFUNDED, ...
  billing_type text,                    -- BOLETO, PIX, CREDIT_CARD, UNDEFINED
  vencimento date,
  pago_em date,
  invoice_url text,                     -- página de pagamento do Asaas
  bank_slip_url text,                   -- PDF do boleto
  pix_payload text,                     -- copia-e-cola do PIX
  nota_fiscal_id text,
  nota_fiscal_status text,              -- SCHEDULED, AUTHORIZED, PROCESSING_CANCELLATION, CANCELED, ERROR
  nota_fiscal_url text,
  descricao text,
  avulsa boolean not null default false, -- true = gerada pelo botão "Cobrança avulsa" da gestão
  sincronizado_em timestamptz not null default now(),
  raw jsonb
);
create index if not exists idx_asaas_cobr_aluno on public.asaas_cobrancas (aluno_id, vencimento desc);
create index if not exists idx_asaas_cobr_status on public.asaas_cobrancas (status, vencimento);
create index if not exists idx_asaas_cobr_customer on public.asaas_cobrancas (asaas_customer_id);

alter table public.asaas_cobrancas enable row level security;

drop policy if exists "asaas_cobrancas: financeiro le" on public.asaas_cobrancas;
create policy "asaas_cobrancas: financeiro le"
  on public.asaas_cobrancas for select
  using (public.is_financeiro());

drop policy if exists "asaas_cobrancas: aluno le as proprias" on public.asaas_cobrancas;
create policy "asaas_cobrancas: aluno le as proprias"
  on public.asaas_cobrancas for select
  using (aluno_id = auth.uid());

-- 20.4) Log de eventos do webhook — idempotência (o Asaas reenvia em erro
--       ou timeout; asaas_event_id unique corta a duplicação).
create table if not exists public.asaas_eventos (
  id bigint generated always as identity primary key,
  asaas_event_id text unique,
  evento text,
  payment_id text,
  recebido_em timestamptz not null default now(),
  processado boolean not null default false,
  payload jsonb
);
create index if not exists idx_asaas_eventos_payment on public.asaas_eventos (payment_id);

alter table public.asaas_eventos enable row level security;

drop policy if exists "asaas_eventos: financeiro le" on public.asaas_eventos;
create policy "asaas_eventos: financeiro le"
  on public.asaas_eventos for select
  using (public.is_financeiro());

-- 20.5) Marca os períodos financeiros abertos por SUSPENSÃO AUTOMÁTICA
--       (cron dos 14 dias). A reativação automática só toca nesses — se a
--       gestão pausou à mão por outro motivo, o cron não reverte.
alter table public.aluno_financeiro_historico
  add column if not exists pausa_automatica boolean not null default false;

-- 20.6) RPCs de suspensão/reativação automática — replicam em SQL, de
--       forma atômica, o que dyseSetAlunoFinanceiro faz no app: fecham o
--       período aberto (data_fim = ontem), abrem um novo idêntico com a
--       nova situação, registram a observação datada, espelham em
--       profiles.situacao_financeira e criam o aviso da coordenação.
--       security definer: o cron chama com a service_role, mas manter
--       definer deixa a lógica num lugar só e imune à RLS por dentro.
create or replace function public.fn_asaas_suspender(p_aluno_id uuid, p_motivo text)
returns void
language plpgsql
security definer set search_path = public
as $$
declare
  aberto public.aluno_financeiro_historico%rowtype;
  novo_id bigint;
  nome text;
begin
  select * into aberto
  from public.aluno_financeiro_historico
  where aluno_id = p_aluno_id and data_fim is null
  order by data_inicio desc
  limit 1;

  if not found then return; end if;            -- sem vínculo financeiro aberto
  if aberto.situacao = 'pausado' then return; end if;  -- já pausado

  update public.aluno_financeiro_historico
    set data_fim = current_date - 1
    where id = aberto.id;

  insert into public.aluno_financeiro_historico
    (aluno_id, professor_id, modalidade_id, valor_mensal_aluno, valor_professor_customizado,
     situacao, data_inicio, quantidade_parcelas, observacao, contrato_inicio, contrato_fim,
     pausa_automatica, criado_por)
  values
    (aberto.aluno_id, aberto.professor_id, aberto.modalidade_id, aberto.valor_mensal_aluno,
     aberto.valor_professor_customizado, 'pausado', current_date, aberto.quantidade_parcelas,
     aberto.observacao, aberto.contrato_inicio, aberto.contrato_fim, true, null)
  returning id into novo_id;

  insert into public.aluno_financeiro_observacoes (aluno_id, periodo_id, observacao, registrado_por)
  values (p_aluno_id, novo_id, coalesce(p_motivo, 'Suspensão automática por inadimplência (Asaas).'), null);

  update public.profiles set situacao_financeira = 'pausado' where id = p_aluno_id;

  select full_name into nome from public.profiles where id = p_aluno_id;
  insert into public.avisos (tipo, titulo, corpo, aluno_id, criado_por)
  values ('aluno_pausado', 'Aluno pausado (mensalidade atrasada)',
          coalesce(nome, 'O aluno') || ' foi pausado automaticamente por cobrança do Asaas vencida há mais de 14 dias. O acesso ao painel do aluno fica bloqueado e a professora não faz a chamada dele até regularizar. A cobrança da mensalidade continua sendo gerada normalmente.',
          p_aluno_id, null);
end;
$$;

create or replace function public.fn_asaas_reativar(p_aluno_id uuid, p_motivo text)
returns void
language plpgsql
security definer set search_path = public
as $$
declare
  aberto public.aluno_financeiro_historico%rowtype;
  novo_id bigint;
  nome text;
begin
  select * into aberto
  from public.aluno_financeiro_historico
  where aluno_id = p_aluno_id and data_fim is null
  order by data_inicio desc
  limit 1;

  if not found then return; end if;
  if aberto.situacao <> 'pausado' or aberto.pausa_automatica is not true then return; end if;

  update public.aluno_financeiro_historico
    set data_fim = current_date - 1
    where id = aberto.id;

  insert into public.aluno_financeiro_historico
    (aluno_id, professor_id, modalidade_id, valor_mensal_aluno, valor_professor_customizado,
     situacao, data_inicio, quantidade_parcelas, observacao, contrato_inicio, contrato_fim,
     pausa_automatica, criado_por)
  values
    (aberto.aluno_id, aberto.professor_id, aberto.modalidade_id, aberto.valor_mensal_aluno,
     aberto.valor_professor_customizado, 'ativo', current_date, aberto.quantidade_parcelas,
     aberto.observacao, aberto.contrato_inicio, aberto.contrato_fim, false, null)
  returning id into novo_id;

  insert into public.aluno_financeiro_observacoes (aluno_id, periodo_id, observacao, registrado_por)
  values (p_aluno_id, novo_id, coalesce(p_motivo, 'Reativação automática: cobranças do Asaas regularizadas.'), null);

  update public.profiles set situacao_financeira = 'ativo' where id = p_aluno_id;

  select full_name into nome from public.profiles where id = p_aluno_id;
  insert into public.avisos (tipo, titulo, corpo, aluno_id, criado_por)
  values ('aluno_reativado', 'Aluno reativado (pagamento regularizado)',
          coalesce(nome, 'O aluno') || ' voltou para "ativo" automaticamente: não há mais cobrança do Asaas vencida. O acesso ao painel foi liberado.',
          p_aluno_id, null);
end;
$$;

revoke all on function public.fn_asaas_suspender(uuid, text) from public;
revoke all on function public.fn_asaas_reativar(uuid, text) from public;
grant execute on function public.fn_asaas_suspender(uuid, text) to service_role;
grant execute on function public.fn_asaas_reativar(uuid, text) to service_role;

-- 20.7) Varredura diária de inadimplência. Roda no Supabase via pg_cron
--       (o plano Hobby da Vercel não deixa agendar cron lá, nem comporta
--       mais funções serverless). api/asaas.js?action=cron é só um gatilho
--       manual da MESMA lógica.
--       Suspende quem tem cobrança OVERDUE vencida há > 14 dias; reativa
--       quem foi pausado automaticamente e não tem mais OVERDUE.
create or replace function public.fn_asaas_cron_inadimplencia()
returns jsonb
language plpgsql
security definer set search_path = public
as $$
declare
  r record;
  v_suspensos int := 0;
  v_reativados int := 0;
begin
  for r in
    select h.aluno_id
    from public.aluno_financeiro_historico h
    where h.data_fim is null and h.situacao = 'ativo'
      and exists (
        select 1 from public.asaas_cobrancas c
        where c.aluno_id = h.aluno_id
          and c.status = 'OVERDUE'
          and c.vencimento <= current_date - 14
      )
  loop
    perform public.fn_asaas_suspender(r.aluno_id, 'Suspensão automática: cobrança do Asaas vencida há mais de 14 dias.');
    v_suspensos := v_suspensos + 1;
  end loop;

  for r in
    select h.aluno_id
    from public.aluno_financeiro_historico h
    where h.data_fim is null and h.situacao = 'pausado' and h.pausa_automatica = true
      and not exists (
        select 1 from public.asaas_cobrancas c
        where c.aluno_id = h.aluno_id and c.status = 'OVERDUE'
      )
  loop
    perform public.fn_asaas_reativar(r.aluno_id, 'Reativação automática: cobranças do Asaas regularizadas.');
    v_reativados := v_reativados + 1;
  end loop;

  return jsonb_build_object('suspensos', v_suspensos, 'reativados', v_reativados, 'rodou_em', now());
end;
$$;

revoke all on function public.fn_asaas_cron_inadimplencia() from public;
grant execute on function public.fn_asaas_cron_inadimplencia() to service_role, postgres;

-- Agendamento (pg_cron). Requer a extensão habilitada:
--   create extension if not exists pg_cron;
-- Depois, agende (idempotente — desagenda antes de reagendar):
--   select cron.unschedule('asaas-inadimplencia-diaria')
--     where exists (select 1 from cron.job where jobname = 'asaas-inadimplencia-diaria');
--   select cron.schedule('asaas-inadimplencia-diaria', '0 9 * * *',
--     $$ select public.fn_asaas_cron_inadimplencia(); $$);

-- ======================================================================
-- 21) EXCLUSÃO DE USUÁRIO — nenhuma coluna de "autor" pode travar o delete
--     Colunas de autoria anuláveis (criado_por, registrado_por, gerado_por,
--     financeiro_auditoria.usuario_id, etc.) que apontam pra auth.users /
--     public.profiles devem ser ON DELETE SET NULL: o registro histórico
--     fica, só perde o "quem fez". Sem isso, apagar um aluno/professor pela
--     gestão dá "Database error deleting user". Idempotente.
--     (Mesmo conteúdo de migracao-fk-exclusao-usuario.sql.)
-- ======================================================================
do $$
declare
  r record;
begin
  for r in
    select con.conname,
           con.conrelid::regclass::text  as tbl,
           att.attname                   as col,
           con.confrelid::regclass::text as ref_tbl
    from pg_constraint con
    join pg_attribute  att
      on att.attrelid = con.conrelid and att.attnum = con.conkey[1]
    where con.contype = 'f'
      and con.connamespace = 'public'::regnamespace
      and array_length(con.conkey, 1) = 1
      and con.confrelid in ('auth.users'::regclass, 'public.profiles'::regclass)
      and con.confdeltype in ('a', 'r')
      and not att.attnotnull
  loop
    execute format('alter table %s drop constraint %I', r.tbl, r.conname);
    execute format(
      'alter table %s add constraint %I foreign key (%I) references %s(id) on delete set null',
      r.tbl, r.conname, r.col, r.ref_tbl
    );
  end loop;
end $$;

alter table public.horario_sugestoes drop constraint if exists horario_sugestoes_criado_por_fkey;
alter table public.horario_sugestoes
  add constraint horario_sugestoes_criado_por_fkey
  foreign key (criado_por) references auth.users(id) on delete cascade;

-- ======================================================================
-- 22) SUBSTITUIÇÃO DE PROFESSOR num dia específico
--     Um professor cobre a aula de outro num dia. A fatia daquele dia
--     (1 de N aulas do mês) sai do pagamento do titular e vai pro
--     substituto no rateio (dyseGerarMensalidadesDoMes lê esta tabela).
--     (Mesmo conteúdo de migracao-substituicoes-professor.sql.)
-- ======================================================================
create table if not exists public.substituicoes_professor (
  id bigint generated always as identity primary key,
  turma_id uuid not null references public.turmas(id) on delete cascade,
  data_aula date not null,
  professor_substituto_id uuid not null references auth.users(id) on delete cascade,
  observacao text,
  criado_por uuid references auth.users(id) on delete set null,
  criado_em timestamptz default now(),
  unique (turma_id, data_aula)
);

create index if not exists idx_substituicoes_professor_data
  on public.substituicoes_professor (data_aula);

alter table public.substituicoes_professor enable row level security;

drop policy if exists "gestao gerencia substituicoes" on public.substituicoes_professor;
create policy "gestao gerencia substituicoes"
  on public.substituicoes_professor for all
  using (public.is_financeiro())
  with check (public.is_financeiro());

drop policy if exists "professor ve substituicoes onde e o substituto" on public.substituicoes_professor;
drop policy if exists "professor ve substituicoes das turmas dele" on public.substituicoes_professor;
create policy "professor ve substituicoes das turmas dele"
  on public.substituicoes_professor for select
  using (
    professor_substituto_id = auth.uid()
    or public.teacher_can_see_turma(turma_id)
  );

drop trigger if exists trg_audit_substituicoes on public.substituicoes_professor;
create trigger trg_audit_substituicoes
  after insert or update or delete on public.substituicoes_professor
  for each row execute procedure public.log_financeiro_auditoria();

-- ======================================================================
-- 23) DESCONTOS no pagamento do professor (ex.: plano de saúde)
--     Lançados pela gestão por professor + mês. Colunas "Descontos"/
--     "Descrição" da aba Pagamentos; "A pagar" = Total previsto − Descontos.
--     (Mesmo conteúdo de migracao-descontos-professor.sql.)
-- ======================================================================
create table if not exists public.descontos_professor (
  id bigint generated always as identity primary key,
  professor_id uuid not null references auth.users(id) on delete cascade,
  mes_competencia date not null,
  tipo text not null default 'outro' check (tipo in ('plano_saude','substituicao_aulas','outro')),
  valor numeric(10,2) not null check (valor >= 0),
  descricao text,
  criado_por uuid references auth.users(id) on delete set null,
  criado_em timestamptz default now()
);

create index if not exists idx_descontos_professor_prof_mes
  on public.descontos_professor (professor_id, mes_competencia);

alter table public.descontos_professor enable row level security;

drop policy if exists "gestao gerencia descontos professor" on public.descontos_professor;
create policy "gestao gerencia descontos professor"
  on public.descontos_professor for all
  using (public.is_financeiro())
  with check (public.is_financeiro());

drop policy if exists "professor ve os proprios descontos" on public.descontos_professor;
create policy "professor ve os proprios descontos"
  on public.descontos_professor for select
  using (professor_id = auth.uid());

drop trigger if exists trg_audit_descontos_professor on public.descontos_professor;
create trigger trg_audit_descontos_professor
  after insert or update or delete on public.descontos_professor
  for each row execute procedure public.log_financeiro_auditoria();

-- ======================================================================

-- ======================================================================
-- 24) NÍVEL A2 — matéria "A2" e as aulas 1 a 43 do Registro de Classe
--     (extraído de "Registro de Classe & Planner Pedagógico A2 · Modelo
--     Institucional"). Mesma estrutura do A1 (seção 12.6): mesmos eixos de
--     avaliação, mesmos campos de "conteudo". A aula 44 (Apresentação Final
--     de Nível) fica de fora de propósito — será cadastrada depois, com
--     conteúdo diferente. Idempotente (ON CONFLICT DO NOTHING): nunca
--     sobrescreve edição manual feita depois. O material base (slides) de
--     cada aula é preenchido pela gestão no modal de Material.
-- ======================================================================
insert into public.materias (slug, name, description, total_aulas, eixos_avaliacao)
values ('a2', 'A2', 'Currículo do nível A2 — 44 aulas.', 44, '["Tarefa Final","Speaking","Listening","Reading","Writing","Gramática"]'::jsonb)
on conflict (slug) do nothing;

insert into public.nivel_aulas (materia_slug, numero, topico, conteudo) values
  ('a2', 1, $$Acolhimento — revisão diagnóstica do A1 ("How much do you remember?") + entrevista pessoal$$, jsonb_build_object(
    'habilidades', jsonb_build_array('Speaking','Listening','Vocabulário funcional'),
    'tarefa_comunicativa', $$Entrevistar um colega com perguntas pessoais que cobrem todo o A1 (rotina, trabalho, hobbies, roupas, clima, casa, ontem, aniversário) e reportar à turma o que descobriu.$$,
    'estrutura_gramatical', $$Revisão diagnóstica das estruturas do A1 em perguntas reais: present simple (do/does), can, present continuous, was/were e past simple. Não sistematizar nada novo — a aula serve para mapear o ponto de partida da turma no A2.$$,
    'pontos_atencao', jsonb_build_array($$Primeiros 10 min: acolhimento dos alunos + apresentação da Trilha Pedagógica do A2 (de onde o aluno sai e onde chega — can-do de saída, seção 5 do currículo). Bloco obrigatório, não deve ser cortado. Nesta aula também se apresenta o Flexge (seção 6.6), que será a primeira tarefa de casa do nível.$$, $$Aula diagnóstica: anotar no Registro de Classe quais estruturas do A1 ainda estão instáveis (3ª pessoa do present simple, did nas perguntas do passado, was/were) — serão retomadas ao longo do 1º bloco do A2.$$, $$Se faltar tempo, reduzir o número de perguntas da entrevista (priorizar as do slide 8, que misturam tempos verbais).$$),
    'foco_fonetico_som', $$Entonação das perguntas: descendente em Wh-questions (Where do you live? ↘) e ascendente em yes/no questions (Do you like your job? ↗).$$,
    'foco_fonetico_erro', $$Aplicar a mesma entonação em todas as perguntas (subida em Wh-questions por analogia com as de sim/não) ou entonação plana, soando como afirmação.$$,
    'foco_fonetico_correcao', $$Marcar setas de entonação no quadro ao lado de 2-3 perguntas do slide 7 e fazer drilling contrastivo (uma Wh, uma yes/no) antes da entrevista.$$,
    'tarefa_de_casa', $$Flexge: iniciar a trilha do nível na plataforma (atividades atribuídas pelo professor), priorizando os exercícios de speaking e listening.$$
  )),
  ('a2', 2, $$To be (revisão) + possessive adjectives — perfil de Matthew Encina$$, jsonb_build_object(
    'habilidades', jsonb_build_array('Speaking','Listening','Writing'),
    'tarefa_comunicativa', $$Apresentar à turma o próprio perfil (nome, nacionalidade, ocupação, paixão, hobbies e o objeto sem o qual não vive) usando to be e possessive adjectives.$$,
    'estrutura_gramatical', $$Revisão do to be nas três formas + possessive adjectives (my, your, his, her, its, our, their) e o contraste entre contração e possessivo (he's/his, it's/its, they're/their, you're/your).$$,
    'pontos_atencao', jsonb_build_array($$Os pares homófonos (they're/their, it's/its, you're/your) quase não geram erro na fala, mas geram muito na escrita — observar a tarefa de casa.$$, $$Interferência do português 'seu/sua': o aluno escolhe his/her pelo gênero do objeto possuído, e não do possuidor ('She loves his dog' querendo dizer o cachorro dela).$$),
    'foco_fonetico_som', $$Diferença de vogal entre he's /hiːz/ (longa) e his /hɪz/ (curta); /h/ aspirado de his/her.$$,
    'foco_fonetico_erro', $$He's e his pronunciados de forma idêntica; 'her' e 'his' com o 'r' gutural do português (/rɪz/).$$,
    'foco_fonetico_correcao', $$Drilling em pares mínimos he's/his com frases do slide 4 (His name is Matthew. He's a creative professional.). Modelar o /h/ como um sopro suave, sem fricção na garganta.$$,
    'tarefa_de_casa', $$Slides 10, 11 e 12.$$
  )),
  ('a2', 3, $$Casa e quartos famosos — reading (Mean Girls, Toy Story, Stranger Things, Harry Potter)$$, jsonb_build_object(
    'habilidades', jsonb_build_array('Speaking','Reading','Vocabulário funcional'),
    'tarefa_comunicativa', $$Descrever e opinar sobre quartos famosos de filmes e séries, dizendo de qual gosta ou não gosta e por quê.$$,
    'estrutura_gramatical', $$There is / there are + vocabulário de móveis e objetos da casa (pillows, shelves, blankets, bunk bed, cupboard) em descrições. As preposições de lugar em negrito no texto só são notadas aqui — a sistematização é na Aula 04.$$,
    'pontos_atencao', jsonb_build_array($$Os textos trazem passado (was, lived, put) — tratar apenas como reconhecimento, sem sistematizar.$$, $$O vocabulário é denso: priorizar os itens de mobília que serão reutilizados na Aula 04 (bed, shelves, pillows, sofa, cupboard, window).$$),
    'foco_fonetico_som', $$Palavras da casa com pronúncia distante da escrita: cupboard /ˈkʌbəd/ (p mudo), shelf/shelves (/f/ → /v/ no plural), pillow /ˈpɪləʊ/.$$,
    'foco_fonetico_erro', $$Pronunciar o 'p' de cupboard ('cup-board'); dizer 'shelfs'; 'pillow' com vogal longa (/piː/).$$,
    'foco_fonetico_correcao', $$Modelar e fazer drilling isolado das palavras-problema antes da leitura em voz alta. Destacar no quadro o plural irregular shelf → shelves.$$,
    'tarefa_de_casa', $$Sem tarefa de slides nesta aula — o deck continua na Aula 04.$$
  )),
  ('a2', 4, $$Preposições de lugar (in, on, under, behind, between, over) + descrevendo quartos$$, jsonb_build_object(
    'habilidades', jsonb_build_array('Speaking','Listening','Writing','Vocabulário funcional'),
    'tarefa_comunicativa', $$Descrever o próprio quarto dizendo onde estão os móveis e objetos, usando preposições de lugar e adjetivos (comfortable, modern, cool).$$,
    'estrutura_gramatical', $$Prepositions of place (in, on, under, behind, between... and..., over) + there is/are + adjetivos para descrever ambientes.$$,
    'pontos_atencao', jsonb_build_array($$Over (acima, sem contato) x on (em cima, com contato) é confusão recorrente, porque o português usa 'em cima' para os dois.$$, $$Between exige 'and' (between the sofa and the armchair). Behind costuma ser confundido com in front of.$$),
    'foco_fonetico_som', $$Acento na segunda sílaba de behind /bɪˈhaɪnd/ e between /bɪˈtwiːn/; /ð/ de the e there.$$,
    'foco_fonetico_erro', $$Acentuar a primeira sílaba ('BE-hind', 'BE-tween'); pronunciar o /ð/ de 'the/there' como /d/.$$,
    'foco_fonetico_correcao', $$Bater palmas na sílaba tônica; drilling de frase inteira (The lamp is between the bed and the window). Para o /ð/, mostrar a posição da língua entre os dentes.$$,
    'tarefa_de_casa', $$Slide 15 (escrever a descrição do próprio quarto e apresentá-la à turma na próxima aula).$$
  )),
  ('a2', 5, $$Adjetivos de aparência física + modifiers (very/really/quite) + alturas$$, jsonb_build_object(
    'habilidades', jsonb_build_array('Speaking','Listening','Reading','Vocabulário funcional'),
    'tarefa_comunicativa', $$Perguntar e dizer alturas (How tall is...? / How tall are you?) e descrever a aparência de colegas e celebridades com adjetivos e modifiers.$$,
    'estrutura_gramatical', $$Posição do adjetivo (antes do substantivo e depois do be), a/an diante de adjetivo iniciado por vogal, adjetivo invariável no plural, modifiers very/really/quite antes do adjetivo; How tall...? e a forma de dizer alturas (feet/inches e metros).$$,
    'pontos_atencao', jsonb_build_array($$Pré-aula: slides 4 e 5 (leitura do post sobre Olivier Rioux e respostas às perguntas).$$, $$Interferência direta do português: adjetivo depois do substantivo ('hair curly') e concordância no plural ('cheaps hotels').$$, $$'Quite' significa 'razoavelmente' e é confundido com 'quiet'. 'The tallest/the shortest' aparece aqui só como chunk — os superlativos serão sistematizados na Aula 34.$$),
    'foco_fonetico_som', $$Leitura de medidas e decimais: two point three six meters; seven feet nine inches.$$,
    'foco_fonetico_erro', $$Dizer 'two comma three six' ou 'two meters and thirty-six'; confundir feet /fiːt/ com fit /fɪt/.$$,
    'foco_fonetico_correcao', $$Drilling com alturas de 3-4 celebridades; par mínimo feet/fit. Reforçar que em inglês se usa 'point' para a vírgula decimal.$$,
    'tarefa_de_casa', $$Slides 12 e 13.$$
  )),
  ('a2', 6, $$Sentimentos + imperativos e sugestões com Let's — "Feeding your feelings"$$, jsonb_build_object(
    'habilidades', jsonb_build_array('Speaking','Listening','Reading','Writing','Vocabulário funcional'),
    'tarefa_comunicativa', $$Em pares, reagir a situações e sentimentos do colega (stressed, bored, anxious...) com conselhos no imperativo e sugestões com Let's / Let's not.$$,
    'estrutura_gramatical', $$Imperativo afirmativo (verbo) e negativo (Don't + verbo), uso de please para suavizar; Let's + verbo / Let's not + verbo para sugestões; adjetivos de sentimentos (stressed, anxious, relaxed, bored, excited, worried, disappointed, angry).$$,
    'pontos_atencao', jsonb_build_array($$Pré-aula: slides 4, 5, 6 e 7 (leitura do blog post "Feeding Your Feelings").$$, $$'Don't be stressed/worried' — o aluno tende a omitir o be ('Don't stressed').$$, $$O imperativo pode soar rude para brasileiros acostumados a pedidos indiretos; mostrar o papel de please e da entonação.$$, $$O texto trata de alimentação e emoções: conduzir o tema com leveza, focado nas estratégias do blog.$$),
    'foco_fonetico_som', $$Entonação de sugestão amigável (Let's go for a walk! com subida suave) em contraste com ordem seca; contração Let's /lets/.$$,
    'foco_fonetico_erro', $$Imperativo com entonação plana e descendente, soando como ordem ríspida; dizer 'Let us' por extenso na fala informal.$$,
    'foco_fonetico_correcao', $$Modelar a mesma frase em duas versões (ríspida x gentil) e pedir que o aluno repita a gentil; acrescentar please nas ordens.$$,
    'tarefa_de_casa', $$Slides 16, 17 e 18.$$
  )),
  ('a2', 7, $$Rotina + preposições de tempo (at/in/on) — "A day in the life" de Anthony em Harvard$$, jsonb_build_object(
    'habilidades', jsonb_build_array('Speaking','Listening','Vocabulário funcional'),
    'tarefa_comunicativa', $$Entrevistar um colega sobre a rotina usando preposições de tempo corretamente e reportar as respostas à turma (E.g. Amanda relaxes at weekends).$$,
    'estrutura_gramatical', $$Preposições de tempo: at (horas, night, the weekend, Christmas), in (partes do dia, meses, estações, anos), on (dias, datas); go to + lugar e go home (sem to); verbos de rotina (wake up, hang out, eat breakfast).$$,
    'pontos_atencao', jsonb_build_array($$At night x in the morning; at the weekend (BrE) x on weekends (AmE) — aceitar as duas variantes.$$, $$'Go to home' é erro muito frequente.$$, $$Usar a rotina de Anthony como gancho, mas priorizar a rotina real dos alunos na tarefa final.$$),
    'foco_fonetico_som', $$Formas fracas de at /ət/ e to /tə/ na fala conectada (at seven, go to the gym).$$,
    'foco_fonetico_erro', $$Pronunciar as preposições com a forma forte e isoladas, deixando a fala 'robotizada' ('go TÚ the gym AT seven').$$,
    'foco_fonetico_correcao', $$Backchaining: gym → to the gym → go to the gym → I go to the gym at seven, mantendo to e at reduzidos.$$,
    'tarefa_de_casa', $$Slide 12.$$
  )),
  ('a2', 8, $$Present simple (afirmativa, negativa, interrogativa) — rotina de estudo em Cambridge$$, jsonb_build_object(
    'habilidades', jsonb_build_array('Speaking','Reading','Writing'),
    'tarefa_comunicativa', $$Descrever a própria rotina de estudo/trabalho e perguntar sobre a do colega usando o present simple nas três formas (Do you have a study routine? Does your boss give you a lot of things to do?).$$,
    'estrutura_gramatical', $$Present simple consolidado: afirmativa com regras de 3ª pessoa (-s, -es, -ies, has, does, goes), negativa com don't/doesn't + verbo base, interrogativa com do/does.$$,
    'pontos_atencao', jsonb_build_array($$No A2 o present simple é consolidação: espera-se menos erro de 3ª pessoa do que no A1, mas ainda aparecem 'doesn't likes' e 'Does he goes?' — verbo base depois de does/doesn't.$$, $$Usar o Registro da Aula 01 para saber quais alunos precisam de mais atenção aqui.$$),
    'foco_fonetico_som', $$As três pronúncias do -s/-es da 3ª pessoa: /s/ (works), /z/ (goes, has) e /ɪz/ (relaxes, watches).$$,
    'foco_fonetico_erro', $$Pronunciar todo -es como /ɪz/ ou todo -s como /s/; 'studies' dividido em sílabas ('stu-di-es').$$,
    'foco_fonetico_correcao', $$Quadro em três colunas de som com os verbos do próprio artigo (believes, relaxes, studies, watches); drilling em pares.$$,
    'tarefa_de_casa', $$Slides 20 e 21.$$
  )),
  ('a2', 9, $$Formação de perguntas (question words + be/do) — Gifted e as perguntas das crianças$$, jsonb_build_object(
    'habilidades', jsonb_build_array('Speaking','Listening','Writing'),
    'tarefa_comunicativa', $$Entrevistar um colega com Wh-questions sobre a vida pessoal e os gostos (Where do you work? What kind of music do you listen to? Who is your favorite celebrity?) usando a ordem correta.$$,
    'estrutura_gramatical', $$Ordem das perguntas: (question word) + be + sujeito; (question word) + do/does + sujeito + verbo; preposição no final da pergunta (What is air made of? What music do you listen to?).$$,
    'pontos_atencao', jsonb_build_array($$Omissão do auxiliar ('Where you live?') e escolha errada entre be e do ('Where are you live?').$$, $$Preposição no fim da pergunta é estranha para o brasileiro, que tende a colocá-la no início ('To what music...?').$$),
    'foco_fonetico_som', $$Entonação descendente em Wh-questions; redução de do you para /djə/ na fala rápida.$$,
    'foco_fonetico_erro', $$Subir o tom no final de Wh-questions por analogia com as perguntas de sim/não; pronunciar 'do you' separado e forte.$$,
    'foco_fonetico_correcao', $$Setas de entonação no quadro; drilling em cadeia (cada aluno faz uma pergunta ao seguinte) cuidando da redução /djə/.$$,
    'tarefa_de_casa', $$Slides 11 e 12.$$
  )),
  ('a2', 10, $$Preposições de lugar in/on/at (cidade, casa, transporte) + quiz "Are you a genius?"$$, jsonb_build_object(
    'habilidades', jsonb_build_array('Speaking','Listening','Reading'),
    'tarefa_comunicativa', $$Aplicar o quiz "Are you a Genius?" a um colega (perguntas de conhecimentos gerais) e descobrir o 'gênio' da turma, reutilizando question words e in/on/at.$$,
    'estrutura_gramatical', $$In/on/at para lugares: in + país, cidade, cômodo, prédio, parque; on + transporte e superfícies (exceção: in a car); at + home, work, school, university e lugares da cidade (at the airport, at a bus station).$$,
    'pontos_atencao', jsonb_build_array($$'In home' e 'in the work' (interferência de 'em casa', 'no trabalho'); on the bus x in the car.$$, $$'In school' é possível no inglês americano, mas ensinar at school como padrão.$$),
    'foco_fonetico_som', $$Linking consoante + vogal: at_home, on_a plane, in_a hotel.$$,
    'foco_fonetico_erro', $$Inserir vogal de apoio após a consoante final ('atchi home', 'oni a plane').$$,
    'foco_fonetico_correcao', $$Drilling de chunks com linking, marcando a ligação com um arco no quadro.$$,
    'tarefa_de_casa', $$Sem tarefa de slides nesta aula — deck compartilhado com a Aula 09.$$
  )),
  ('a2', 11, $$Tarefas domésticas + advérbios e expressões de frequência$$, jsonb_build_object(
    'habilidades', jsonb_build_array('Speaking','Listening','Reading','Vocabulário funcional'),
    'tarefa_comunicativa', $$Entrevistar um colega sobre com que frequência ele faz cada tarefa doméstica e calcular aproximadamente quantas calorias ele queima por semana.$$,
    'estrutura_gramatical', $$Adverbs of frequency (always, usually, often, sometimes, hardly ever, never): antes do verbo principal, depois do be e entre don't/doesn't e o verbo; expressions of frequency (every day, once/twice/three times a week) no fim da frase. Vocabulário de housework (do the laundry, iron clothes, mop/sweep/vacuum the floor).$$,
    'pontos_atencao', jsonb_build_array($$Pré-aula: slides 7 e 8 (vocabulário de tarefas domésticas).$$, $$Do x make (do the laundry, make the bed) é confusão frequente. 'Hardly ever' não tem relação com 'hard'.$$, $$A posição do advérbio com o be (I'm hardly ever stressed) costuma sair invertida. Esta aula retoma e aprofunda o que foi visto no A1 — observar quem já posiciona o advérbio com autonomia.$$),
    'foco_fonetico_som', $$Palavras de housework com pronúncia enganosa: ironing /ˈaɪənɪŋ/ (r mudo), vacuum /ˈvækjuːm/, laundry /ˈlɔːndri/.$$,
    'foco_fonetico_erro', $$Pronunciar o 'r' de iron/ironing ('ai-RON-ing'); ler vacuum 'à portuguesa'.$$,
    'foco_fonetico_correcao', $$Modelar e fazer drilling isolado das três palavras antes do Speaking; pedir que o aluno repita dentro de uma frase completa (I hardly ever iron clothes).$$,
    'tarefa_de_casa', $$Slides 16, 17 e 18.$$
  )),
  ('a2', 12, $$Família + genitivo 's + who/whose — a árvore genealógica de George Clooney$$, jsonb_build_object(
    'habilidades', jsonb_build_array('Speaking','Listening','Writing','Vocabulário funcional'),
    'tarefa_comunicativa', $$Apresentar a própria família (foto ou nomes) a um colega, que pergunta Who is...? e Whose...? para descobrir o parentesco e a quem pertencem as coisas.$$,
    'estrutura_gramatical', $$Genitivo 's (person + 's; plural regular s'; plural irregular children's; nomes compostos Ella and Alexander's; nomes terminados em s); diferença entre 's possessivo e 's = is; who x whose; vocabulário de família (grandparents, aunt, cousin, in-laws).$$,
    'pontos_atencao', jsonb_build_array($$Interferência do português: 'the car of my father' em vez de my father's car.$$, $$Whose e who's são homófonos — erro aparece na escrita. Parent's x parents' confunde no plural.$$),
    'foco_fonetico_som', $$As três pronúncias do 's: /s/ (Mike's), /z/ (George's, Amal's) e /ɪz/ (James's, Alice's).$$,
    'foco_fonetico_erro', $$Pronunciar sempre /s/ ou omitir o 's na fala rápida ('my brother car').$$,
    'foco_fonetico_correcao', $$Usar nomes reais dos alunos da turma para montar a tabela de três sons; drilling de frases com possessivo.$$,
    'tarefa_de_casa', $$Slides 14 e 15.$$
  )),
  ('a2', 13, $$Revisão 1-12$$, jsonb_build_object(
    'habilidades', jsonb_build_array('Speaking'),
    'tarefa_comunicativa', $$Checklist de autoavaliação (can-do) com um colega: apresentar-se, descrever o quarto e onde as coisas estão, descrever aparência, dar sugestões, falar da rotina com preposições, fazer Wh-questions, dizer a frequência das tarefas domésticas e falar da árvore genealógica.$$,
    'estrutura_gramatical', $$Revisão integrada das Aulas 1-12: to be + possessive adjectives, preposições de lugar (in/on/under/between...; in/on/at), adjetivos + modifiers, imperativos e Let's, preposições de tempo, present simple, formação de perguntas, advérbios de frequência, genitivo 's e who/whose.$$,
    'pontos_atencao', jsonb_build_array($$O link do Google Forms só deve ser enviado DEPOIS desta aula: a prática oral com correção ao vivo vem primeiro e o Forms feito depois é o dado que conta oficialmente para a progressão (seção 6.3 do currículo — ordem obrigatória).$$, $$Primeira revisão-teste do A2 (seção 6.3): usar o desempenho oral desta aula e o resultado do Forms feito em casa como dado para o Registro de Classe e o critério de progressão.$$, $$Itens marcados como 'não consigo ainda' são dado real para o planejamento (Bloco C), não falha a esconder — reforçar esse princípio com a turma (seção 2.2).$$),
    'foco_fonetico_som', $$Revisão consolidada: entonação de Wh x yes/no questions, -s da 3ª pessoa, 's possessivo, acento de behind/between.$$,
    'foco_fonetico_erro', $$Reincidência pontual dos padrões já mapeados (3ª pessoa, auxiliar omitido nas perguntas, his/her) sob a pressão de uma conversa longa.$$,
    'foco_fonetico_correcao', $$Não interromper as atividades para corrigir — anotar no Registro de Classe e fazer, ao final, uma rodada coletiva rápida apenas com os 2-3 erros mais recorrentes da turma.$$,
    'tarefa_de_casa', $$Google Forms de revisão gramatical (link no slide 2: https://forms.gle/zigh92UWv6KRaAK17), feito em casa após a aula (seção 6.3 do currículo).$$
  )),
  ('a2', 14, $$Can / can't (habilidade, permissão, possibilidade e pedido) — exames e o Mr. Bean$$, jsonb_build_object(
    'habilidades', jsonb_build_array('Speaking','Listening','Writing'),
    'tarefa_comunicativa', $$Entrevistar um colega sobre o que ele pode ou consegue fazer no trabalho, na escola/universidade e em casa (Can you have a break when you want to?) e reportar à turma.$$,
    'estrutura_gramatical', $$Can/can't + infinitivo para habilidade, permissão, possibilidade e pedido educado (mesma forma para todas as pessoas); formas informais equivalentes: I have no idea how to..., There's no way I can...$$,
    'pontos_atencao', jsonb_build_array($$No A2, as várias funções de can aparecem num mesmo ponto — nomear a função de cada exemplo (habilidade, permissão, possibilidade, pedido).$$, $$Erros típicos: 'Do you can...?' e 'can to go'. As formas informais (There's no way I can...) são novidade útil para soar mais natural.$$),
    'foco_fonetico_som', $$Can forte /kæn/ em perguntas, respostas curtas e negativas; can fraco /kən/ em afirmativas; can't /kɑːnt/ (BrE) ou /kænt/ (AmE).$$,
    'foco_fonetico_erro', $$Can e can't pronunciados de forma quase idêntica — o ouvinte entende o oposto do que o aluno quis dizer.$$,
    'foco_fonetico_correcao', $$Exercício rápido de discriminação auditiva (o professor diz frases e a turma levanta a mão para can ou can't); mostrar que na afirmativa o acento vai para o verbo principal (I can SWIM).$$,
    'tarefa_de_casa', $$Slides 11 e 12.$$
  )),
  ('a2', 15, $$Present continuous — trabalhar de casa$$, jsonb_build_object(
    'habilidades', jsonb_build_array('Speaking','Listening','Writing'),
    'tarefa_comunicativa', $$Information gap: descrever ao colega o que as pessoas estão fazendo em uma imagem de casa e encontrar juntos as sete diferenças (In my house, the woman is playing with the dog).$$,
    'estrutura_gramatical', $$Present continuous nas três formas (am/is/are + verbo -ing) e regras de ortografia (-e: making; consoante dobrada: getting, running, swimming).$$,
    'pontos_atencao', jsonb_build_array($$Omissão do be ('She working') é o erro mais frequente.$$, $$Verbos de estado (like, know, want) não vão para o -ing ('I'm liking') — fazer um alerta pontual, sem sistematizar.$$, $$Ortografia do -ing (dobrar consoante) aparece na tarefa de casa.$$),
    'foco_fonetico_som', $$Terminação -ing /ɪŋ/ sem vogal final; contrações I'm, she's, they're.$$,
    'foco_fonetico_erro', $$Acrescentar uma vogal depois do -ing ('workingui') e não contrair o be ('She is working' lento e separado).$$,
    'foco_fonetico_correcao', $$Modelar o /ŋ/ como som nasal que termina 'no nariz'; drilling de frases com contração a partir das diferenças encontradas na imagem.$$,
    'tarefa_de_casa', $$Slides 11, 12, 13 e 14.$$
  )),
  ('a2', 16, $$Present simple x present continuous — os alemães nas férias$$, jsonb_build_object(
    'habilidades', jsonb_build_array('Speaking','Listening','Writing','Vocabulário funcional'),
    'tarefa_comunicativa', $$Entrevistar um colega sobre hábitos (present simple) e sobre o que ele está fazendo ou planejando neste momento (present continuous), recontar as respostas à turma e escrever um parágrafo curto sobre si.$$,
    'estrutura_gramatical', $$Contraste present simple (hábitos, rotina, fatos) x present continuous (ações acontecendo agora ou em torno de agora); marcadores (usually, every summer x now, today, this week); vocabulário de viagem (go sightseeing, pack bags, buy souvenirs, lie on the beach).$$,
    'pontos_atencao', jsonb_build_array($$Pré-aula: slides 6 e 7 (vocabulário de viagem).$$, $$Os marcadores de tempo são o principal apoio para a escolha do tempo verbal — ensinar o aluno a procurá-los.$$, $$'I'm going on holiday' (plano) aparece como uso de futuro do continuous, já visto no A1 — só reconhecer. Retomar o Registro da Aula 15 para quem ainda omite o be.$$),
    'foco_fonetico_som', $$Acento contrastivo: I USUALLY travel for WORK, but TODAY I'm going on HOLIDAY.$$,
    'foco_fonetico_erro', $$Entonação plana que não destaca o contraste entre hábito e momento, deixando a frase sem ênfase.$$,
    'foco_fonetico_correcao', $$Ler em voz alta as frases do slide 11 marcando em negrito as palavras que carregam o contraste; drilling por imitação.$$,
    'tarefa_de_casa', $$Slides 18 e 19.$$
  )),
  ('a2', 17, $$Object pronouns — escolhendo a roupa do dia$$, jsonb_build_object(
    'habilidades', jsonb_build_array('Speaking','Reading','Writing','Vocabulário funcional'),
    'tarefa_comunicativa', $$Conversar sobre como escolhe a roupa do dia e opinar sobre peças de roupa usando object pronouns (I love it. / I don't like them. / Can you help me?).$$,
    'estrutura_gramatical', $$Subject pronouns x object pronouns (me, you, him, her, it, us, them) depois de verbos e preposições; vocabulário do infográfico (match, lay out, change your mind, look right, go out, pick, look good, comfy).$$,
    'pontos_atencao', jsonb_build_array($$Omissão do objeto ('I love!', 'I want to buy.') por interferência do português, que omite o pronome.$$, $$Them x they e him x he se confundem. Esta aula retoma um ponto visto no A1 — o foco do A2 é o uso automático em conversa.$$),
    'foco_fonetico_som', $$Redução de pronomes objeto na fala conectada: help her /ˈhelpə/, like them /ˈlaɪkðəm/.$$,
    'foco_fonetico_erro', $$Pronunciar him/her com o 'r' gutural do português (/rɪm/, /rɛr/) e sempre na forma forte.$$,
    'foco_fonetico_correcao', $$Modelar o /h/ suave e trabalhar reconhecimento auditivo das formas reduzidas; na produção, aceitar a forma plena desde que o /h/ esteja correto.$$,
    'tarefa_de_casa', $$Slides 11 e 12.$$
  )),
  ('a2', 18, $$Números ordinais, datas e celebrações pelo mundo$$, jsonb_build_object(
    'habilidades', jsonb_build_array('Speaking','Listening','Reading','Vocabulário funcional'),
    'tarefa_comunicativa', $$Perguntar e dizer as datas de feriados e celebrações do próprio país, explicando como as pessoas os celebram.$$,
    'estrutura_gramatical', $$Ordinal numbers (first to thirty-first), como dizer datas (January first / the first of January) e anos (twenty twenty-four), formatos britânico e americano, in + mês e on + data.$$,
    'pontos_atencao', jsonb_build_array($$Ordinais irregulares (first, second, third, fifth, eighth, ninth, twelfth) precisam de destaque.$$, $$A ordem dia/mês muda entre inglês britânico e americano (12/1 é ambíguo) — ponto prático importante para viagens e documentos.$$, $$On + data (on 27th November) x in + mês (in November).$$),
    'foco_fonetico_som', $$Som /θ/ nos ordinais: fifth, sixth, eighth, twelfth, twentieth.$$,
    'foco_fonetico_erro', $$Trocar o /θ/ por /f/ ou /t/ ('fift', 'twelf', 'eight' no lugar de 'eighth').$$,
    'foco_fonetico_correcao', $$Mostrar a língua entre os dentes; drilling de ordinais em cadeia pela turma (cada aluno diz o seguinte) e com as datas de aniversário dos alunos.$$,
    'tarefa_de_casa', $$Slide 8.$$
  )),
  ('a2', 19, $$Love / like / don't mind / hate + -ing — Christmas na Austrália$$, jsonb_build_object(
    'habilidades', jsonb_build_array('Speaking','Listening','Writing'),
    'tarefa_comunicativa', $$Dizer o que ama, gosta, não se importa e odeia fazer em celebrações (Christmas, New Year's Eve, Halloween) usando verbo + -ing e comparar as preferências com as do colega.$$,
    'estrutura_gramatical', $$Verbs of preference (love, like, enjoy, don't mind, prefer, hate) + verbo com -ing; 3ª pessoa (She likes having...; He doesn't mind cleaning...).$$,
    'pontos_atencao', jsonb_build_array($$'I like to...' também é possível, mas o foco da aula é o -ing.$$, $$'Don't mind' significa 'não me importo' (aceitação), não 'não ligo' no sentido de desinteresse.$$, $$Retomar a 3ª pessoa do present simple (She likes, He doesn't mind).$$),
    'foco_fonetico_som', $$Elisão do /t/ em don't mind /dəʊn(t) maɪnd/ e ligação suave entre as palavras.$$,
    'foco_fonetico_erro', $$Inserir vogal de apoio após o t ('donchi mind'), quebrando o ritmo da frase.$$,
    'foco_fonetico_correcao', $$Drilling de chunks (I don't mind cleaning / She doesn't mind cooking) com ritmo contínuo, sem pausa entre as palavras.$$,
    'tarefa_de_casa', $$Slide 25.$$
  )),
  ('a2', 20, $$Passado do be (was/were) — mulheres no espaço$$, jsonb_build_object(
    'habilidades', jsonb_build_array('Speaking','Listening','Writing'),
    'tarefa_comunicativa', $$Perguntar e responder sobre o próprio passado (Where were you born? Where were you last weekend? Were you tired yesterday?) e comentar mulheres importantes da história da ciência usando was/were.$$,
    'estrutura_gramatical', $$Past simple do be: was/were nas três formas + short answers; was/were born; expressões de tempo passado (yesterday, last year, in 1963).$$,
    'pontos_atencao', jsonb_build_array($$Pré-aula: slides 4 e 5 (assistir ao vídeo sobre mulheres no espaço: associar cada mulher a um fato e marcar verdadeiro/falso).$$, $$'I was born' é erro muito frequente ('I born', 'I am born') por interferência de 'eu nasci'.$$, $$Was x were por pessoa costuma estar razoável desde o A1 — observar sobretudo a interrogativa com inversão (Were you...?).$$),
    'foco_fonetico_som', $$Formas fracas /wəz/ e /wə/ no meio da frase x formas fortes /wɒz/ e /wɜː/ nas short answers.$$,
    'foco_fonetico_erro', $$Pronunciar sempre a forma forte ('She WAS a pilot'), o que soa artificial.$$,
    'foco_fonetico_correcao', $$Drilling contrastivo: She was /wəz/ a pilot. — Was she? — Yes, she WAS.$$,
    'tarefa_de_casa', $$Slides 10, 11 e 12.$$
  )),
  ('a2', 21, $$Biografias de mulheres famosas + profissões (-er, -or, -ist, -ian)$$, jsonb_build_object(
    'habilidades', jsonb_build_array('Speaking','Reading','Writing','Vocabulário funcional'),
    'tarefa_comunicativa', $$Montar uma lista de mulheres importantes em diferentes profissões e apresentá-las ao colega combinando presente e passado do be (Sally Ride was an astronaut and a physicist).$$,
    'estrutura_gramatical', $$Formação de profissões a partir de verbos (-er/-or: painter, inventor) e substantivos (-ist/-ian: artist, politician); present e past do be em biografias (vivas x falecidas).$$,
    'pontos_atencao', jsonb_build_array($$Escolher is ou was conforme a pessoa esteja viva ou não (Malala is / Frida was).$$, $$'Physicist' (físico) é confundido com 'physician' (médico).$$, $$Os textos têm past simple regular (died, loved, created) — só reconhecimento, a sistematização é na Aula 22.$$),
    'foco_fonetico_som', $$Mudança de acento nas profissões derivadas: POLitics → poliTIcian, MATHS → mathemaTIcian, SCIence → SCIentist.$$,
    'foco_fonetico_erro', $$Manter o acento da palavra de origem ('POli-tician') ou acentuar a última sílaba por analogia com o português ('politiCIAN').$$,
    'foco_fonetico_correcao', $$Marcar a sílaba tônica de cada profissão no quadro e fazer drilling com batidas de palma.$$,
    'tarefa_de_casa', $$Slide 21.$$
  )),
  ('a2', 22, $$Past simple — verbos regulares (holiday disasters)$$, jsonb_build_object(
    'habilidades', jsonb_build_array('Speaking','Listening','Reading','Writing'),
    'tarefa_comunicativa', $$Contar oralmente uma história (real ou inventada) de desastre nas férias usando o past simple, e escrevê-la em casa.$$,
    'estrutura_gramatical', $$Past simple dos verbos regulares nas três formas (-ed; didn't + verbo base; Did + sujeito + verbo base?) e regras de ortografia (-d, -ied, consoante dobrada).$$,
    'pontos_atencao', jsonb_build_array($$Pré-aula: slides 4, 5, 6, 7 e 8 (as quatro histórias de desastres de férias e as morais).$$, $$Erros típicos: 'didn't went', 'Did you went?' (passado depois de did).$$, $$Os textos trazem irregulares (had, went, got) — reconhecer sem sistematizar (foco da Aula 23). A pronúncia do -ed está nos slides de tarefa de casa, mas vale modelar rapidamente em sala.$$),
    'foco_fonetico_som', $$As três pronúncias do -ed: /t/ (looked, booked), /d/ (stayed, loved), /ɪd/ (needed, decided).$$,
    'foco_fonetico_erro', $$Pronunciar o -ed sempre como sílaba extra ('loo-ked', 'sta-yed'), por influência da escrita.$$,
    'foco_fonetico_correcao', $$Regra prática: só há sílaba extra quando o verbo termina em t ou d; demonstrar com os verbos das histórias antes de o aluno narrar.$$,
    'tarefa_de_casa', $$Slides 18, 19 e 20.$$
  )),
  ('a2', 23, $$Past simple — verbos irregulares + could — festivais de música$$, jsonb_build_object(
    'habilidades', jsonb_build_array('Speaking','Listening','Writing','Vocabulário funcional'),
    'tarefa_comunicativa', $$Entrevistar um colega sobre um festival de música ou show a que ele foi (história real ou inventada) e descobrir se a história é verdadeira.$$,
    'estrutura_gramatical', $$Past simple dos verbos irregulares (went, bought, saw, wore, ate, drank, felt, said) nas três formas; could/couldn't como passado de can.$$,
    'pontos_atencao', jsonb_build_array($$Regularização dos irregulares ('buyed', 'wented') e passado depois de did ('Did you went?').$$, $$Could aparece como passado de can — retomar a Aula 14.$$, $$A escrita do parágrafo (slide 12) pode ficar como extra se faltar tempo.$$),
    'foco_fonetico_som', $$Irregulares com 'gh' mudo e vogal /ɔː/: bought /bɔːt/, thought, caught; saw /sɔː/, wore /wɔː/.$$,
    'foco_fonetico_erro', $$Pronunciar o 'gh' ou ler bought 'à portuguesa'; confundir bought (comprei) com brought (trouxe).$$,
    'foco_fonetico_correcao', $$Agrupar os irregulares por som no quadro (bought/thought/caught; saw/wore) e fazer drilling em grupo.$$,
    'tarefa_de_casa', $$Slides 13, 14 e 15.$$
  )),
  ('a2', 24, $$Revisão 14-23$$, jsonb_build_object(
    'habilidades', jsonb_build_array('Speaking'),
    'tarefa_comunicativa', $$Checklist de autoavaliação (can-do) com um colega: can/can't no trabalho/escola, o que está fazendo agora, o que a família está fazendo, rotina x esta semana, do que gosta e não gosta de fazer, 2 pessoas famosas do passado e um festival de música.$$,
    'estrutura_gramatical', $$Revisão integrada das Aulas 14-23: can (4 funções), present continuous, contraste simple x continuous, object pronouns, ordinais e datas, love/like/don't mind/hate + -ing, was/were, past simple regular e irregular, could.$$,
    'pontos_atencao', jsonb_build_array($$O link do Google Forms só deve ser enviado DEPOIS desta aula: a prática oral com correção ao vivo vem primeiro e o Forms feito depois é o dado que conta oficialmente para a progressão (seção 6.3 do currículo — ordem obrigatória).$$, $$Segunda revisão-teste do A2 — usar a fluência oral e o Forms como dado para o Registro de Classe e o critério de progressão (seção 6.4).$$, $$O item do checklist 'describe your personality and a friend's personality' corresponde a uma aula retirada da grade: pular este item.$$, $$Observar com atenção a escolha simple x continuous e regular x irregular em fala espontânea.$$),
    'foco_fonetico_som', $$Revisão consolidada: can forte/fraco, -ing, /θ/ dos ordinais, was/were fracos e as três pronúncias do -ed.$$,
    'foco_fonetico_erro', $$Reincidência pontual dos padrões já mapeados no Registro de Classe sob a pressão de uma conversa longa que mistura vários tempos verbais.$$,
    'foco_fonetico_correcao', $$Não interromper as atividades para corrigir — anotar no Registro de Classe e fazer, ao final, uma rodada coletiva rápida apenas com os 2-3 erros mais recorrentes da turma.$$,
    'tarefa_de_casa', $$Google Forms de revisão gramatical (link no slide 2: https://forms.gle/bmzrPSqBaVzxYAjS9), feito em casa após a aula (seção 6.3 do currículo).$$
  )),
  ('a2', 25, $$Past continuous + time sequencers — a mensagem na garrafa$$, jsonb_build_object(
    'habilidades', jsonb_build_array('Speaking','Listening','Writing'),
    'tarefa_comunicativa', $$Dizer o que estava fazendo em momentos específicos do passado (What were you doing at 8 p.m. yesterday?) e recontar a história da garrafa em sequência usando time sequencers.$$,
    'estrutura_gramatical', $$Past continuous (was/were + verbo -ing) nas três formas: ação em progresso num momento do passado, ação longa interrompida e cenário de uma história; time sequencers (then, after that, the next day, years later, when, while).$$,
    'pontos_atencao', jsonb_build_array($$'After' sozinho para ligar ações consecutivas ('After I threw it.') — usar then/after that.$$, $$Esquecer o be ('I sleeping at 8 p.m.').$$, $$O contraste com o past simple (when/while) será sistematizado na Aula 26 — aqui só reconhecimento.$$),
    'foco_fonetico_som', $$Formas fracas de was /wəz/ e were /wə/ antes do verbo -ing (I was /wəz/ sleeping).$$,
    'foco_fonetico_erro', $$Pronunciar was/were fortes e separados, deixando a frase lenta e artificial.$$,
    'foco_fonetico_correcao', $$Drilling de frases curtas com ritmo (I was watching TV. They were cleaning the beach.), com o acento no verbo principal.$$,
    'tarefa_de_casa', $$Slide 11.$$
  )),
  ('a2', 26, $$Past simple x past continuous + when/while — histórias por trás de fotos$$, jsonb_build_object(
    'habilidades', jsonb_build_array('Speaking','Reading','Writing'),
    'tarefa_comunicativa', $$Descrever uma foto favorita contando onde e quando foi tirada e o que estava acontecendo naquele momento (My brother took the photo when we were on a hiking trip).$$,
    'estrutura_gramatical', $$Past continuous (ação longa, em andamento, cenário) + past simple (ação curta que interrompe); when + past simple x while + past continuous.$$,
    'pontos_atencao', jsonb_build_array($$Pré-aula: slides 3, 4 e 5 (artigo "Telling Stories in Photography" e associação histórias x fotos).$$, $$While + past continuous ('While I took photos' é erro). 'I was see' mistura as estruturas.$$, $$Pedir aos alunos que tenham uma foto pessoal no celular — a tarefa ganha autenticidade.$$),
    'foco_fonetico_som', $$Entonação de narrativa: pausa curta depois da oração de fundo (I was walking on the beach | when I saw the sunset).$$,
    'foco_fonetico_erro', $$Frase corrida sem pausa, ou entonação de lista, sem destacar a ação que interrompe.$$,
    'foco_fonetico_correcao', $$Marcar a pausa com uma barra no quadro e modelar a subida na primeira oração e a descida na segunda.$$,
    'tarefa_de_casa', $$Slides 14 e 15.$$
  )),
  ('a2', 27, $$There is / there are + a/an/some/any — o restaurante de Gordon Ramsay$$, jsonb_build_object(
    'habilidades', jsonb_build_array('Speaking','Listening','Writing','Vocabulário funcional'),
    'tarefa_comunicativa', $$Role-play telefônico: o cliente pergunta sobre um restaurante (Is there a large dining room? Are there any vegetarian options?) e o gerente responde a partir do anúncio.$$,
    'estrutura_gramatical', $$There is/there are nas três formas + short answers; a/an com singular, some em afirmativas e any em negativas e perguntas; vocabulário de restaurante (starters, bill, tip, napkin, tray, staff, dining room).$$,
    'pontos_atencao', jsonb_build_array($$Interferência de 'tem': 'Have a table by the window?' em vez de Is there...$$, $$'Some' em pergunta só em ofertas e pedidos (Would you like some...?).$$, $$O texto escrito do slide 15 (restaurante favorito) pode ser extra se sobrar tempo.$$),
    'foco_fonetico_som', $$There's /ðeəz/ e there are com linking /ðeərə/; /ð/ inicial.$$,
    'foco_fonetico_erro', $$Trocar o /ð/ por /d/ ('dér is') e separar 'there are' em duas palavras fortes.$$,
    'foco_fonetico_correcao', $$Posição da língua entre os dentes para o /ð/; drilling de perguntas completas do role-play (Are there any tables outside?).$$,
    'tarefa_de_casa', $$Slides 17, 18 e 19.$$
  )),
  ('a2', 28, $$There was / there were + lugares da cidade + números altos — Paris e Londres$$, jsonb_build_object(
    'habilidades', jsonb_build_array('Speaking','Listening','Reading','Writing','Vocabulário funcional'),
    'tarefa_comunicativa', $$Comparar uma cidade no passado e hoje (There were only two schools... Today there are five), usando lugares da cidade e números altos.$$,
    'estrutura_gramatical', $$There was/there were nas três formas + a/an/some/any; contraste com there is/are; números altos (hundreds, thousands, millions) na fala e na escrita.$$,
    'pontos_atencao', jsonb_build_array($$Pré-aula: slides 3 e 4 (vocabulário de lugares da cidade).$$, $$'There was many parks' (was com plural).$$, $$Números: o inglês usa vírgula para milhar e ponto para decimal (1,400 x 1.400 em português); 'and' em 'one hundred and thirty-four' (BrE). Chemist = farmácia (BrE).$$),
    'foco_fonetico_som', $$Contraste de acento entre -teen e -ty: thirTEEN x THIRty, fourTEEN x FORty.$$,
    'foco_fonetico_erro', $$Confundir 13/30, 14/40 etc. na escuta e na fala.$$,
    'foco_fonetico_correcao', $$Discriminação auditiva rápida (o professor diz um número e os alunos escrevem) seguida de drilling dos pares.$$,
    'tarefa_de_casa', $$Slides 17 e 18.$$
  )),
  ('a2', 29, $$Contáveis e incontáveis + a/an/some/any — a alimentação dos atletas$$, jsonb_build_object(
    'habilidades', jsonb_build_array('Speaking','Listening','Reading','Writing','Vocabulário funcional'),
    'tarefa_comunicativa', $$Role-play atleta x nutricionista: montar um plano alimentar para um dia e discutir as refeições (What do I have for breakfast? — I think you need some scrambled eggs and a bagel).$$,
    'estrutura_gramatical', $$Substantivos contáveis e incontáveis; a/an com singular contável; some em afirmativas (e em ofertas/pedidos); any em negativas e perguntas; substantivos que podem ser das duas classes (an ice cream / some ice cream).$$,
    'pontos_atencao', jsonb_build_array($$Erros por interferência do português: 'a bread', 'rices', 'some informations'.$$, $$Chicken, ice cream e cake mudam de classe conforme o uso.$$, $$Aproveitar para retomar there is/are + some/any da Aula 27.$$),
    'foco_fonetico_som', $$Formas fracas de some /səm/ e linking an + vogal (an_apple, an_egg).$$,
    'foco_fonetico_erro', $$Pronunciar some sempre forte (/sʌm/) e separar 'an apple' com pausa ou vogal de apoio.$$,
    'foco_fonetico_correcao', $$Drilling de chunks de pedido (Can I have some water? I'd like an apple) com ritmo natural.$$,
    'tarefa_de_casa', $$Slide 17.$$
  )),
  ('a2', 30, $$How much / how many + quantificadores + recipientes — quanto açúcar consumimos?$$, jsonb_build_object(
    'habilidades', jsonb_build_array('Speaking','Listening','Writing','Vocabulário funcional'),
    'tarefa_comunicativa', $$Jogo de tabuleiro: perguntar e responder sobre hábitos alimentares com How much/How many e quantificadores (I don't eat many sweets. I drink a lot of water.).$$,
    'estrutura_gramatical', $$How much (incontáveis) x How many (contáveis); quantificadores a lot of, a few, a little, not many, not much, not any; recipientes e porções (a can of, a slice of, a bowl of, a jar of, a carton of).$$,
    'pontos_atencao', jsonb_build_array($$'Much' em frases afirmativas soa formal ('I eat much sugar') — preferir a lot of.$$, $$A few (contável) x a little (incontável). Fruit é normalmente incontável (How much fruit...).$$),
    'foco_fonetico_som', $$Redução de of /əv/ ou /ə/ nas expressões de recipiente: a can of Coke /əˈkænəv/, a cup of tea /əˈkʌpə/.$$,
    'foco_fonetico_erro', $$Pronunciar 'of' forte e separado ('a can ÓF Coke').$$,
    'foco_fonetico_correcao', $$Backchaining com os recipientes: Coke → of Coke → a can of Coke, mantendo o of reduzido.$$,
    'tarefa_de_casa', $$Slides 14, 15 e 16.$$
  )),
  ('a2', 31, $$Adverbs of manner + modifiers — choque cultural$$, jsonb_build_object(
    'habilidades', jsonb_build_array('Speaking','Listening','Reading','Writing'),
    'tarefa_comunicativa', $$Falar e escrever sobre coisas do próprio país que podem surpreender um estrangeiro, usando adjetivos e advérbios (In Brazil, people greet each other warmly).$$,
    'estrutura_gramatical', $$Adverbs of manner (adjetivo + -ly; irregulares fast, hard, well), posição depois do verbo ou do complemento; adjetivo (descreve substantivo) x advérbio (descreve verbo, adjetivo ou outro advérbio); modifiers (very, quite, really).$$,
    'pontos_atencao', jsonb_build_array($$Good x well ('She speaks English very good') é o erro mais recorrente.$$, $$Hardly não é o advérbio de hard. Friendly e lovely terminam em -ly mas são adjetivos.$$, $$Tratar os estereótipos culturais do texto com cuidado — são relatos pessoais, não verdades sobre os países.$$),
    'foco_fonetico_som', $$Sufixo -ly átono e acento da palavra base preservado: inCREDibly, SURprisingly, DANgerously, PERfectly.$$,
    'foco_fonetico_erro', $$Acentuar o sufixo ('perfectLY') por influência do '-mente' do português.$$,
    'foco_fonetico_correcao', $$Marcar a sílaba tônica de cada advérbio no quadro; drilling adjetivo → advérbio mantendo o mesmo acento (careful → CAREfully).$$,
    'tarefa_de_casa', $$Slides 18 e 19.$$
  )),
  ('a2', 32, $$Comparativos de adjetivos e advérbios — cardio x strength training$$, jsonb_build_object(
    'habilidades', jsonb_build_array('Speaking','Listening','Writing','Vocabulário funcional'),
    'tarefa_comunicativa', $$Debater com o colega preferências de exercício e hábitos de saúde, comparando as opções e justificando (Which one do you prefer and why? / Who do you think is healthier?).$$,
    'estrutura_gramatical', $$Comparative adjectives (-er; more/less + adjetivo longo; -y → -ier; consoante dobrada: bigger, hotter; irregulares better, worse, farther/further) + than; comparative adverbs (more quickly, faster, harder, better, worse).$$,
    'pontos_atencao', jsonb_build_array($$'More better', 'more big' e 'than' confundido com 'that' ou 'then'.$$, $$Advérbios comparativos (more quickly) retomam diretamente a Aula 31.$$, $$Tema de saúde e corpo: manter o foco em hábitos e preferências, sem comentários sobre peso de pessoas.$$),
    'foco_fonetico_som', $$Than na forma fraca /ðən/ e o -er átono /ə/ (bigger /ˈbɪɡə/).$$,
    'foco_fonetico_erro', $$Pronunciar than forte (/ðæn/ ou /dan/) e o -er com 'r' carregado e acentuado ('big-GÉR').$$,
    'foco_fonetico_correcao', $$Drilling de frases completas com ritmo (Running is HARDer than WALKing), mantendo than e -er reduzidos.$$,
    'tarefa_de_casa', $$Slides 15 e 16.$$
  )),
  ('a2', 33, $$Revisão 25-32$$, jsonb_build_object(
    'habilidades', jsonb_build_array('Speaking'),
    'tarefa_comunicativa', $$Checklist de autoavaliação (can-do) com um colega: contar as últimas férias em sequência, dizer o que fazia às 8 p.m. de ontem, descrever uma foto, perguntar sobre um restaurante, falar da cidade no passado, da alimentação, de uma surpresa cultural e comparar pessoas e modos de fazer as coisas.$$,
    'estrutura_gramatical', $$Revisão integrada das Aulas 25-32: past continuous, past simple x continuous (when/while), time sequencers, there is/are e there was/were + a/an/some/any, contáveis/incontáveis, How much/How many + quantificadores, adverbs of manner, comparativos de adjetivos e advérbios.$$,
    'pontos_atencao', jsonb_build_array($$O link do Google Forms só deve ser enviado DEPOIS desta aula: a prática oral com correção ao vivo vem primeiro e o Forms feito depois é o dado que conta oficialmente para a progressão (seção 6.3 do currículo — ordem obrigatória).$$, $$Terceira revisão-teste do A2 — observar sobretudo a narrativa com past simple + past continuous, que é o can-do 'narra experiências passadas conectando eventos em sequência lógica' (seção 5).$$, $$O item do checklist sobre a história 'The 99 gold coins' corresponde a uma aula retirada da grade: pular este item.$$),
    'foco_fonetico_som', $$Revisão consolidada: was/were fracos, pausa de narrativa, /ð/ de there, -teen x -ty, of reduzido, than fraco.$$,
    'foco_fonetico_erro', $$Reincidência pontual dos padrões já mapeados no Registro de Classe sob a pressão de uma conversa longa que mistura vários tempos verbais.$$,
    'foco_fonetico_correcao', $$Não interromper as atividades para corrigir — anotar no Registro de Classe e fazer, ao final, uma rodada coletiva rápida apenas com os 2-3 erros mais recorrentes da turma.$$,
    'tarefa_de_casa', $$Google Forms de revisão gramatical (link no slide 2: https://forms.gle/F2kVBgoZYzXkxLqQ7), feito em casa após a aula (seção 6.3 do currículo).$$
  )),
  ('a2', 34, $$Superlativos — Burj Khalifa e landmarks pelo mundo$$, jsonb_build_object(
    'habilidades', jsonb_build_array('Speaking','Listening','Writing'),
    'tarefa_comunicativa', $$Role-play: um aluno é turista e o outro, morador, indica os melhores lugares da cidade usando superlativos (What's the most beautiful park? What's the cheapest place to go shopping?).$$,
    'estrutura_gramatical', $$Superlative adjectives (the + -est; the most/the least + adjetivo longo; -y → -iest; consoante dobrada; irregulares the best, the worst, the farthest) + in the world / in the city / of all; contraste comparativo (dois itens) x superlativo (um em um grupo).$$,
    'pontos_atencao', jsonb_build_array($$Omissão do 'the' ('It's tallest building') e dupla marcação ('the most tallest').$$, $$In x of: the tallest building in the world (não 'of the world').$$, $$Retomar os comparativos da Aula 32 para marcar o contraste.$$),
    'foco_fonetico_som', $$Terminação -est átona /ɪst/ e the /ði/ antes de vogal (the oldest, the easiest).$$,
    'foco_fonetico_erro', $$Acentuar o -est ('tall-EST') e pronunciar sempre /ðə/ antes de vogal.$$,
    'foco_fonetico_correcao', $$Drilling de pares comparativo → superlativo (older → the oldest) com acento na raiz; destacar o /ði/ antes de vogal (retomado na Aula 37).$$,
    'tarefa_de_casa', $$Slides 17 e 18.$$
  )),
  ('a2', 35, $$Be going to (planos e previsões) — morar e estudar fora$$, jsonb_build_object(
    'habilidades', jsonb_build_array('Speaking','Listening','Reading','Writing','Vocabulário funcional'),
    'tarefa_comunicativa', $$Entrevistar um colega sobre planos futuros — morar, trabalhar ou estudar fora, ou planos mais próximos (What are you going to do on your next vacation?) — usando be going to.$$,
    'estrutura_gramatical', $$Be going to + verbo base para planos e intenções e para previsões com evidência; forma afirmativa, negativa e interrogativa; vocabulário de bagagem (hoodie, toiletries, valuables, documents, footwear).$$,
    'pontos_atencao', jsonb_build_array($$Pré-aula: slides 11 e 12 (o que é o Workaway e a pergunta sobre a experiência de Merilin).$$, $$Omissão do be ('I going to travel'). 'Gonna' é comum na fala nativa — ensinar como reconhecimento.$$, $$Diferença sutil em relação ao present continuous para compromissos marcados (visto no A1) — não aprofundar.$$, $$Os alunos que não pensam em morar fora seguem o lado NO dos cartões, sem prejuízo da tarefa.$$),
    'foco_fonetico_som', $$Going to reduzido para /ˈɡəʊɪŋ tə/ ou /ˈɡənə/ (gonna) na fala informal.$$,
    'foco_fonetico_erro', $$Pronunciar 'going to' lento e forte, com o to acentuado ('go-ing TÚ').$$,
    'foco_fonetico_correcao', $$Modelar a forma com to reduzido para produção e mostrar 'gonna' em áudio para reconhecimento, sem exigir sua produção.$$,
    'tarefa_de_casa', $$Slides 19 e 20.$$
  )),
  ('a2', 36, $$Would like / verbo + to-infinitive — bucket list$$, jsonb_build_object(
    'habilidades', jsonb_build_array('Speaking','Listening','Writing'),
    'tarefa_comunicativa', $$Compartilhar com um colega sonhos e planos da própria bucket list usando would like to, want to, hope to, plan to (I'd really like to visit Japan. — Oh really? Why Japan?).$$,
    'estrutura_gramatical', $$Would like + to + infinitivo (desejo agora/no futuro) x like + -ing (gosto em geral); outros verbos + to-infinitive: want, need, learn, decide, plan, choose, expect, try, promise, forget, hope.$$,
    'pontos_atencao', jsonb_build_array($$I'd like to (quero) x I like -ing (gosto) — confusão central da aula; retomar a Aula 19.$$, $$Interferência 'I want that you...' ('quero que você'). 'Decide for' em vez de decide to.$$),
    'foco_fonetico_som', $$Contração 'd em I'd like /aɪd laɪk/ e want to reduzido /ˈwɒntə/ ou /ˈwɒnə/ (wanna, reconhecimento).$$,
    'foco_fonetico_erro', $$Omitir o 'd na fala ('I like to visit' querendo dizer 'I'd like to'), mudando o sentido da frase.$$,
    'foco_fonetico_correcao', $$Par mínimo de sentido: I like traveling x I'd like to travel — o professor diz uma e a turma identifica se é gosto ou desejo.$$,
    'tarefa_de_casa', $$Slide 15.$$
  )),
  ('a2', 37, $$Artigos the / a-an / zero article — tecnologia e casa inteligente (IoT)$$, jsonb_build_object(
    'habilidades', jsonb_build_array('Speaking','Listening','Vocabulário funcional'),
    'tarefa_comunicativa', $$Conversar sobre os gadgets que usa, os que gostaria de ter e se casas inteligentes são uma boa ideia, usando os artigos corretamente.$$,
    'estrutura_gramatical', $$The (algo específico ou único, superlativos: the internet, the Sun, the best); zero article (generalizações, refeições, home/work/school/bed, by car/by email); a/an na primeira menção e the depois.$$,
    'pontos_atencao', jsonb_build_array($$Interferência forte do português, que usa artigo em generalizações: 'The people spend hours on their phones' (as pessoas...). 'Go to the home', 'have the lunch'.$$, $$A letra da música é material do deck: usar apenas como atividade de listening/rima.$$),
    'foco_fonetico_som', $$The pronunciado /ðə/ antes de consoante e /ðiː/ (ou /ði/) antes de vogal (the phone x the email).$$,
    'foco_fonetico_erro', $$Pronunciar the sempre da mesma forma, ou como /de/ ('dê').$$,
    'foco_fonetico_correcao', $$Exercício do slide 16 (mesmo/diferente) seguido de drilling com gadgets da aula (the smartwatch x the app).$$,
    'tarefa_de_casa', $$Slides 17 e 18.$$
  )),
  ('a2', 38, $$Present perfect — introdução (a família Goy viajando o mundo)$$, jsonb_build_object(
    'habilidades', jsonb_build_array('Speaking','Listening'),
    'tarefa_comunicativa', $$Discutir a experiência da família que viaja o mundo — o que eles já fizeram e o que aprenderam — e opinar sobre fazer uma viagem longa.$$,
    'estrutura_gramatical', $$Present perfect (have/has + past participle) para experiências de vida e ações sem tempo definido; ever/never; formas afirmativa, negativa e interrogativa com short answers (introdução).$$,
    'pontos_atencao', jsonb_build_array($$Primeiro contato com o present perfect: foco em reconhecimento de forma e de uso (experiência, sem tempo definido).$$, $$A tradução 'tenho feito' engana — evitar.$$, $$O contraste com o past simple será sistematizado na Aula 41; aqui, só notar que as perguntas de follow-up (When? Where?) vão para o passado.$$),
    'foco_fonetico_som', $$Contrações 've e 's (they've, she's visited); 's pode ser is ou has.$$,
    'foco_fonetico_erro', $$Não contrair ('They have visited' lento e forte) ou pronunciar o have como /rév/.$$,
    'foco_fonetico_correcao', $$Drilling de frases do vídeo com contração (They've created incredible experiences. I've booked the tickets.).$$,
    'tarefa_de_casa', $$Sem tarefa de slides nesta aula — deck compartilhado com a Aula 39.$$
  )),
  ('a2', 39, $$Present perfect — prática + particípios irregulares (Have you ever...?)$$, jsonb_build_object(
    'habilidades', jsonb_build_array('Speaking','Writing','Vocabulário funcional'),
    'tarefa_comunicativa', $$Perguntar ao colega Have you ever...? sobre experiências de viagem e aprofundar com follow-up questions (When? Where? With who? How was it? / Would you like to?).$$,
    'estrutura_gramatical', $$Present perfect nas três formas com contrações; particípios regulares (= past simple) e irregulares (been, gone, seen, taken, eaten, made, bought, gotten, had, driven).$$,
    'pontos_atencao', jsonb_build_array($$Uso do passado no lugar do particípio ('Have you ever went/saw...?'). Gotten (AmE) x got (BrE) — aceitar os dois.$$, $$As follow-up questions (When did you go?) exigem past simple — observar, mas não sistematizar (Aula 41).$$),
    'foco_fonetico_som', $$Particípios em -en com vogal reduzida ou 'n' silábico: taken /ˈteɪkən/, eaten /ˈiːtn/, driven /ˈdrɪvn/; been /biːn/ (BrE) ou /bɪn/ (AmE).$$,
    'foco_fonetico_erro', $$Acentuar a terminação ('ta-KEN', 'ea-TEN') e pronunciar o -en como 'ém' pleno.$$,
    'foco_fonetico_correcao', $$Drilling das três colunas (eat – ate – eaten) com acento sempre na primeira sílaba do particípio.$$,
    'tarefa_de_casa', $$Slide 27.$$
  )),
  ('a2', 40, $$Vocabulário de compras + Amazon Go (grab and go)$$, jsonb_build_object(
    'habilidades', jsonb_build_array('Speaking','Listening','Vocabulário funcional'),
    'tarefa_comunicativa', $$Explicar ao colega como funciona uma compra na Amazon Go e contar as próprias preferências e experiências de compra (online x loja física).$$,
    'estrutura_gramatical', $$Verb phrases de compras (shop, grab, pick up, put back, put in your bag, walk out) e vocabulário de loja (checkout, line, receipt, basket, fitting rooms, price tag, virtual cart); present simple para descrever um processo.$$,
    'pontos_atencao', jsonb_build_array($$Phrasal verbs separáveis com pronome: put it back (não 'put back it').$$, $$A pergunta 'Have you ever been to an Amazon Go store?' (slide 8) antecipa a Aula 41 — aceitar respostas simples.$$, $$Grab e pick up são quase sinônimos; grab indica rapidez.$$),
    'foco_fonetico_som', $$Receipt /rɪˈsiːt/ com p mudo; acento em CHECKout e SHOPping bag.$$,
    'foco_fonetico_erro', $$Pronunciar o 'p' de receipt ('re-cei-pt') e acentuar a segunda parte de checkout.$$,
    'foco_fonetico_correcao', $$Modelar e fazer drilling isolado; usar a sequência de passos da Amazon Go como fala contínua para praticar.$$,
    'tarefa_de_casa', $$Sem tarefa de slides nesta aula — deck compartilhado com a Aula 41.$$
  )),
  ('a2', 41, $$Present perfect x past simple + been/gone — experiências de compra$$, jsonb_build_object(
    'habilidades', jsonb_build_array('Speaking','Listening','Writing'),
    'tarefa_comunicativa', $$Entrevistar um colega com Have you ever...? sobre experiências de compra e aprofundar cada resposta com perguntas no past simple (When did you...? What did you buy?).$$,
    'estrutura_gramatical', $$Present perfect (experiência, sem tempo definido) x past simple (tempo definido: yesterday, last week, in 2023); proibição do present perfect com expressões de tempo passado; been (foi e voltou) x gone (ainda está lá).$$,
    'pontos_atencao', jsonb_build_array($$'I have bought a snack yesterday' — erro central da aula, porque o português usa o mesmo tempo nos dois casos.$$, $$Been x gone confunde muito.$$, $$Esta aula fecha o bloco de present perfect: usar o Registro das Aulas 38-39 para ver quem ainda não domina a forma.$$),
    'foco_fonetico_som', $$Forma fraca de have em perguntas: Have you ever /həvjuˈevə/...? e resposta curta forte: Yes, I HAVE.$$,
    'foco_fonetico_erro', $$Pronunciar 'Have you ever' separado e forte ou com 'r' inicial (/rév/).$$,
    'foco_fonetico_correcao', $$Drilling de pergunta + short answer em cadeia pela turma, com a pergunta rápida e a resposta enfática.$$,
    'tarefa_de_casa', $$Slides 19 e 20.$$
  )),
  ('a2', 42, $$Perguntas em todos os tempos verbais — Q&A com Millie Bobby Brown$$, jsonb_build_object(
    'habilidades', jsonb_build_array('Speaking','Listening','Writing'),
    'tarefa_comunicativa', $$Role-play de entrevista com um influencer: formular perguntas em diferentes tempos verbais para o colega e responder a elas (com short answers e detalhes).$$,
    'estrutura_gramatical', $$Revisão da formação de perguntas em todos os tempos do A2: be (presente e passado), present simple, can, present continuous, past continuous, past simple, present perfect e be going to; question words (what, when, how often, how many, whose...) e short answers.$$,
    'pontos_atencao', jsonb_build_array($$Aula-ponte para as revisões finais: observar se o aluno escolhe o auxiliar certo para cada tempo (do/does, did, have/has, am/is/are, was/were).$$, $$Short answers com o auxiliar correto (Yes, I have. / No, I didn't.).$$),
    'foco_fonetico_som', $$Entonação: descendente em Wh-questions e ascendente em yes/no questions — retomada da Aula 01, fechando o ciclo.$$,
    'foco_fonetico_erro', $$Entonação única para todas as perguntas, que fica mais evidente quando o aluno alterna tempos verbais.$$,
    'foco_fonetico_correcao', $$No role-play, o professor anota 2-3 perguntas com entonação inadequada e faz uma rodada coletiva de repetição ao final.$$,
    'tarefa_de_casa', $$Slides 14 e 15.$$
  )),
  ('a2', 43, $$Revisão 34-42$$, jsonb_build_object(
    'habilidades', jsonb_build_array('Speaking'),
    'tarefa_comunicativa', $$Checklist de autoavaliação (can-do) com um colega: falar de lugares famosos com superlativos, dizer planos com be going to, sonhos com would like/want/hope, falar da tecnologia que usa, fazer perguntas Have you ever...? e perguntas em vários tempos.$$,
    'estrutura_gramatical', $$Revisão integrada das Aulas 34-42: superlativos, be going to, would like + verbos + to-infinitive, artigos (the/a/zero), present perfect (experiências, particípios irregulares), present perfect x past simple, been/gone e perguntas em todos os tempos.$$,
    'pontos_atencao', jsonb_build_array($$O link do Google Forms só deve ser enviado DEPOIS desta aula: a prática oral com correção ao vivo vem primeiro e o Forms feito depois é o dado que conta oficialmente para a progressão (seção 6.3 do currículo — ordem obrigatória).$$, $$Quarta revisão-teste do A2 e penúltimo dado antes do fechamento do nível. Observar especialmente o contraste present perfect x past simple, que é o conteúdo novo mais delicado do semestre.$$, $$O item do checklist 'make a polite request using Could...?' corresponde a uma aula retirada da grade: pular este item.$$),
    'foco_fonetico_som', $$Revisão consolidada: superlativos com -est átono, gonna (reconhecimento), I'd like, the /ðə/ x /ðiː/, particípios em -en, entonação de perguntas.$$,
    'foco_fonetico_erro', $$Reincidência pontual dos padrões já mapeados no Registro de Classe sob a pressão de uma conversa longa que mistura vários tempos verbais.$$,
    'foco_fonetico_correcao', $$Não interromper as atividades para corrigir — anotar no Registro de Classe e fazer, ao final, uma rodada coletiva rápida apenas com os 2-3 erros mais recorrentes da turma.$$,
    'tarefa_de_casa', $$Google Forms de revisão gramatical (link no slide 2: https://forms.gle/AVy1wkHH34WVRcDG9), feito em casa após a aula (seção 6.3 do currículo). Preparar o roteiro da Apresentação Final de Nível (Aula 44) com o Guia do Aluno "Meu Ano em Inglês" (cinco blocos).$$
  ))
on conflict (materia_slug, numero) do nothing;

-- ======================================================================
-- 25) A2 — AULA 44 (Apresentação Final de Nível), com critérios próprios.
--     Diferente das demais aulas: o Bloco B avalia os 5 blocos da Parte A e
--     os 5 eixos da rubrica (seção 6.4.2 do currículo) na escala Bem / No
--     processo / Não atingiu, e o resultado (Aprovado / Encaminhar 6.5.1) é
--     calculado na tela. Isso vem do próprio "conteudo" da aula:
--       eixos_avaliacao   → colunas da avaliação (no lugar dos eixos do nível)
--       escala_avaliacao  → rótulos de sim/parcial/nao (Bem = PP, No processo
--                           = P, Não atingiu = R — os valores gravados seguem
--                           sim/parcial/nao, então Report Card e histórico
--                           continuam funcionando)
--       rubrica_eixos / rubrica_obrigatorio / rubrica_minimo → regra de
--                           aprovação: "Bem"/"No processo" em pelo menos 4 dos
--                           5 eixos, sem "Não atingiu" em Cumprimento da Tarefa.
--     Idempotente (ON CONFLICT DO NOTHING).
-- ======================================================================
insert into public.nivel_aulas (materia_slug, numero, topico, conteudo) values
  ('a2', 44, $$Apresentação Final de Nível — "Meu ano em inglês: de onde vim, o que vivi e para onde vou"$$, jsonb_build_object(
    'habilidades', jsonb_build_array('Speaking','Listening'),
    'tarefa_comunicativa', $$Parte A — apresentação individual (4-5 min) em cinco blocos, conectando as ideias com then, after that, because, but: (1) minha vida hoje — rotina e hábitos; (2) uma experiência marcante do passado, contada em sequência (o que aconteceu e o que estava acontecendo); (3) um lugar que conheço comparado a outro (o melhor, o mais bonito...); (4) experiências de vida (coisas que já fiz / nunca fiz); (5) meus planos e sonhos para o próximo ano. Parte B — interação espontânea com o professor (2-3 min): situação cotidiana sorteada na hora (restaurante, loja/compras ou pedindo direções na cidade), com 4-5 perguntas não roteirizadas e um pequeno imprevisto a resolver.$$,
    'estrutura_gramatical', $$Bloco 1: present simple + advérbios de frequência · Bloco 2: past simple (regular/irregular) + past continuous + time sequencers · Bloco 3: comparativos e superlativos (+ there is/was) · Bloco 4: present perfect com ever/never · Bloco 5: be going to + would like / want / hope to. Ver seção 6.4.2 do currículo (v0.6).$$,
    'pontos_atencao', jsonb_build_array($$Nota da coordenação: pela seção 6.4 do currículo (critério 3), a Apresentação Final de Nível acontece na última aula regular do módulo, dentro das 44 aulas. Rubrica de 5 eixos (seção 6.4.2): Cumprimento da Tarefa, Gramática do Nível, Coesão e Fluência, Interação (Listening) e Vocabulário. Aprovação com "Bem" ou "No processo" em pelo menos 4 eixos, sem "Não atingiu" em Cumprimento da Tarefa. A avaliação é registrada por aluno, por bloco da Parte A e por eixo da rubrica, na escala Bem / No processo / Não atingiu (equivalente a PP / P / R). Ao final da aula, agendar a Avaliação Final de Nível (evento fora da grade, critério 4).$$, $$Pré-aula: na Aula 43, enviar o Guia do Aluno "Meu Ano em Inglês" e orientar cada aluno a preparar a apresentação nos cinco blocos, com um pequeno roteiro de apoio (tópicos, não texto para ler). Sugerir usar as próprias produções do ano (descrição de foto, história de férias, bucket list) como material de base.$$, $$Condução (50 min): abertura (5 min) recapitulando o propósito da tarefa e sorteando a ordem; apresentações individuais (35 min, tempo ajustável ao número de alunos — Parte A de 4-5 min seguida da Parte B de 2-3 min; prioridade absoluta da aula); perguntas dos colegas (5 min) após algumas apresentações; fechamento (5 min) com feedback geral celebrando o percurso do A2, retomando a Trilha Pedagógica da Aula 01 e comunicando a data da Avaliação Final de Nível e do Forms.$$, $$A prioridade é 100% a Apresentação Final — não cortar tempo de apresentação para revisar. O deck (checklist can-do, slides 3-6) só é usado se sobrar tempo, nunca como atividade principal. Itens do checklist que correspondem a aulas retiradas da grade (personalidade, 'The 99 Gold Coins', último filme/série, pedido com Could) devem ser pulados.$$, $$Em turma de 5 alunos o tempo fica justo: controlar o relógio e, se necessário, dispensar a rodada de perguntas dos colegas. Em aula individual (VIP), a Parte A pode se estender (6-7 min) e a Parte B ter mais perguntas.$$),
    'foco_fonetico_som', $$Fluência e entonação natural na fala espontânea, integrando os padrões fonéticos trabalhados no ano (-s/-es, -ed, -ing, was/were fracos, can forte/fraco, /θ/ e /ð/, formas fracas de than, of, to, contrações 've/'s).$$,
    'foco_fonetico_erro', $$Sob a pressão de uma apresentação, é esperado que padrões já mapeados ao longo do ano reapareçam pontualmente — isso não deve ser tratado como reprovação automática, mas registrado com cuidado.$$,
    'foco_fonetico_correcao', $$Não corrigir durante a apresentação — reservar observações para o feedback individual após a atividade, preservando a confiança do aluno. Usar o Registro desta aula, somado às revisões-teste (Aulas 13, 24, 33 e 43), como base para o Report Card (seção 6.2) e, se necessário, para o protocolo da seção 6.5.1.$$,
    'tarefa_de_casa', $$Google Forms de revisão gramatical final (link no slide 2: https://forms.gle/jxLnERf9t6HHFiwW7), preenchido pelo aluno em casa após a aula. O professor agenda a Avaliação Final de Nível (fora da grade) e, em caso de desempenho insatisfatório na Apresentação, aciona o protocolo da seção 6.5.1 do currículo.$$,
    'eixos_avaliacao', jsonb_build_array(
      $$Bloco 1 · Minha vida hoje$$, $$Bloco 2 · Uma história que vivi$$, $$Bloco 3 · Lugares que comparo$$,
      $$Bloco 4 · Coisas que já fiz$$, $$Bloco 5 · Meus planos e sonhos$$,
      $$Cumprimento da Tarefa$$, $$Gramática do Nível$$, $$Coesão e Fluência$$, $$Interação (Parte B)$$, $$Vocabulário do nível$$
    ),
    'escala_avaliacao', jsonb_build_object('sim', 'Bem', 'parcial', 'No processo', 'nao', 'Não atingiu', 'nao_participou', 'Não participou'),
    'rubrica_eixos', jsonb_build_array($$Cumprimento da Tarefa$$, $$Gramática do Nível$$, $$Coesão e Fluência$$, $$Interação (Parte B)$$, $$Vocabulário do nível$$),
    'rubrica_obrigatorio', $$Cumprimento da Tarefa$$,
    'rubrica_minimo', 4
  ))
on conflict (materia_slug, numero) do nothing;

-- ======================================================================
-- 26) CRITÉRIOS PADRÃO DO REGISTRO DE CLASSE — A1 ao C1
--     Todo nível avalia os mesmos 6 critérios: Tarefa Final, Speaking,
--     Listening, Reading, Writing e Gramática (os mesmos que o Report Card
--     usa). O A1 já foi migrado na seção 13.1; aqui:
--       a) o A2 (seed da seção 24 entrou com os 4 eixos antigos) e
--          qualquer nível A1..C1 ainda no default antigo passam pros 6;
--       b) esses 6 viram o DEFAULT da coluna, então B1, B2, C1 (e qualquer
--          matéria com currículo criada depois) já nascem com eles.
--     Não mexe em eixos customizados à mão (só troca quem está no default
--     antigo ou sem eixos). A aula 44 do A2 tem critérios próprios (seção 25).
-- ======================================================================
update public.materias
set eixos_avaliacao = '["Tarefa Final","Speaking","Listening","Reading","Writing","Gramática"]'::jsonb
where slug in ('a1','a2','b1','b2','c1')
  and (eixos_avaliacao is null
       or eixos_avaliacao = '["Tarefa Final","Speaking","Listening","Read./Writ."]'::jsonb);

alter table public.materias
  alter column eixos_avaliacao set default '["Tarefa Final","Speaking","Listening","Reading","Writing","Gramática"]'::jsonb;
