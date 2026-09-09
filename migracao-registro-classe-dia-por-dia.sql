-- ======================================================================
-- Migração: Registro de Classe — UM REGISTRO + UMA ANOTAÇÃO POR DIA
-- Rodar no Supabase (QA e produção). Seguro rodar mais de uma vez.
--
-- SUBSTITUI migracao-registro-classe-multidata.sql (aquela guardava várias
-- datas numa linha só; o usuário precisa de registro/avaliação/observação
-- SEPARADOS por dia).
--
-- Modelo novo: 1 linha por (aluno, aula, sessao_ordem) em registros_classe
-- e 1 linha por (turma, aula, sessao_ordem) em registro_classe_sessao.
-- sessao_ordem = "Dia 1", "Dia 2"… Aula dada num dia só = sessao_ordem 1.
-- (Mesmo conteúdo das seções 12.4/12.5/14.1 de supabase-schema.sql.)
-- ======================================================================

-- 1) registros_classe (Bloco B — por aluno)
alter table public.registros_classe add column if not exists sessao_ordem smallint not null default 1;
alter table public.registros_classe drop column if exists datas;
alter table public.registros_classe drop constraint if exists registros_classe_aluno_aula_key;
alter table public.registros_classe add constraint registros_classe_aluno_aula_key
  unique (aluno_id, nivel_aula_id, sessao_ordem);

-- 2) registro_classe_sessao (Bloco C — planner por turma+aula)
alter table public.registro_classe_sessao add column if not exists sessao_ordem smallint not null default 1;
alter table public.registro_classe_sessao drop column if exists datas;
alter table public.registro_classe_sessao drop constraint if exists registro_classe_sessao_turma_aula_key;
alter table public.registro_classe_sessao add constraint registro_classe_sessao_turma_aula_key
  unique (turma_id, nivel_aula_id, sessao_ordem);

-- 3) NOVO: policy de DELETE pra professora apagar um dia lançado por engano
--    (o botão "Remover o Dia N"). Sem isso o delete não erra, só não apaga
--    nada. Mesmo critério das outras policies (turma ATUAL do aluno).
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

-- 4) minhas_aulas_registradas: agora pode haver N linhas por aula -> distinct
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
--   where table_name = 'registros_classe' order by ordinal_position;
-- select conname, pg_get_constraintdef(oid) from pg_constraint
--   where conrelid = 'public.registros_classe'::regclass and contype = 'u';
-- select polname, polcmd from pg_policy where polrelid = 'public.registros_classe'::regclass;
