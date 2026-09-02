-- ======================================================================
-- Migração: material por turma (override do material base de cada aula)
-- Rodar no Supabase (QA e produção). Seguro rodar mais de uma vez.
-- (Mesmo conteúdo da seção 19 de supabase-schema.sql.)
-- ======================================================================

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
