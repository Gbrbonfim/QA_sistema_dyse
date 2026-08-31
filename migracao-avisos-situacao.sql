-- ======================================================================
-- Migração: espelho da situação financeira no perfil + mural de avisos
-- Rodar no Supabase (QA e produção). Seguro rodar mais de uma vez.
-- (É o mesmo conteúdo da seção 18 de supabase-schema.sql + o backfill.)
-- ======================================================================

-- 1) profiles.situacao_financeira — cópia da situação do período aberto,
--    pra professora ver "(pausado)" sem ler o histórico financeiro.
alter table public.profiles
  add column if not exists situacao_financeira text not null default 'ativo';

-- 2) Mural de avisos. Leem: gestão (admin + financeiro) e o professor da
--    turma do aluno citado no aviso. Só a gestão cria.
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

-- Professor(a) vê os avisos dos alunos das turmas dele (ex: aluno pausado).
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

-- 3) Backfill: alunos que já estão pausados/cancelados/encerrados no
--    período aberto ganham o espelho certo (o default deixou todo mundo
--    como 'ativo').
update public.profiles p
set situacao_financeira = h.situacao
from public.aluno_financeiro_historico h
where h.aluno_id = p.id
  and h.data_fim is null
  and p.situacao_financeira is distinct from h.situacao;
