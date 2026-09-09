-- ======================================================================
-- Migração: Registro de Classe — A DATA É A IDENTIDADE DO REGISTRO
-- Rodar no Supabase (QA e produção — banco único). Seguro rodar mais de uma vez.
--
-- SUBSTITUI migracao-registro-classe-dia-por-dia.sql (aquela usava
-- "sessao_ordem" = Dia 1/Dia 2 como chave; ao trocar a data de um dia já
-- salvo o registro era sobrescrito em vez de virar um registro novo).
--
-- Modelo novo: 1 linha por (aluno, aula, DATA) em registros_classe e
-- 1 linha por (turma, aula, DATA) em registro_classe_sessao. O professor
-- escolhe a data, faz o registro daquele dia e salva; outra data = outro
-- registro, com sua própria avaliação, observação e planner. Aula dada num
-- dia só = um registro. (Mesmo conteúdo das seções 12.4/12.5/14.1 de
-- supabase-schema.sql.)
-- ======================================================================

-- 1) registros_classe (Bloco B — por aluno)
--    Remove duplicatas por data (mantém a de id maior) antes da unique nova.
delete from public.registros_classe a
  using public.registros_classe b
  where a.aluno_id = b.aluno_id
    and a.nivel_aula_id = b.nivel_aula_id
    and a.data_aula = b.data_aula
    and a.id < b.id;

alter table public.registros_classe drop constraint if exists registros_classe_aluno_aula_key;
alter table public.registros_classe add constraint registros_classe_aluno_aula_key
  unique (aluno_id, nivel_aula_id, data_aula);
alter table public.registros_classe drop column if exists sessao_ordem;

-- 2) registro_classe_sessao (Bloco C — planner por turma+aula)
delete from public.registro_classe_sessao a
  using public.registro_classe_sessao b
  where a.turma_id = b.turma_id
    and a.nivel_aula_id = b.nivel_aula_id
    and a.data_aula = b.data_aula
    and a.id < b.id;

alter table public.registro_classe_sessao drop constraint if exists registro_classe_sessao_turma_aula_key;
alter table public.registro_classe_sessao add constraint registro_classe_sessao_turma_aula_key
  unique (turma_id, nivel_aula_id, data_aula);
alter table public.registro_classe_sessao drop column if exists sessao_ordem;

-- 3) Policy de DELETE da professora (apagar um registro lançado por engano
--    pelo botão "Remover"). Idempotente — recria igual à da migração anterior.
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
-- registro_classe_sessao já tem policy "for all" pro professor — DELETE ok.

-- 4) minhas_aulas_registradas: N linhas por aula (uma por data) -> distinct
create or replace function public.minhas_aulas_registradas(check_materia_slug text)
returns table(nivel_aula_id uuid)
language sql
stable
security definer set search_path = public
as $$
  select distinct rc.nivel_aula_id
  from public.registros_classe rc
  join public.nivel_aulas na on na.id = rc.nivel_aula_id
  where rc.aluno_id = auth.uid() and na.materia_slug = check_materia_slug;
$$;
grant execute on function public.minhas_aulas_registradas(text) to authenticated;

-- Conferência:
-- select column_name from information_schema.columns
--   where table_name = 'registros_classe' order by ordinal_position;   -- não deve ter sessao_ordem
-- select conname, pg_get_constraintdef(oid) from pg_constraint
--   where conrelid = 'public.registros_classe'::regclass and contype = 'u';  -- (..., data_aula)
