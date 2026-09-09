-- ======================================================================
-- Limpar dados de TESTE do Registro de Classe / Report Card de um aluno
-- Rodar no Supabase (console SQL). Banco é único (QA = prod).
--
-- Uso atual: aluno "Gustavo Zocca", turma de teste. Ajuste
-- v_nome_pattern pra reusar com outro aluno de teste.
--
-- APAGA (sem volta):
--   - registros_classe do aluno (todas as aulas, todos os dias)
--   - report_cards do aluno (rascunho e liberados; a análise da IA
--     fica embutida em report_cards.dados, some junto)
--   - registro_classe_sessao (planner: pontos a retomar / ritmo / alerta)
--     das TURMAS ligadas aos registros do aluno + a turma atual dele.
--     ⚠️ O planner é por TURMA — só rode a parte (3) se a turma for de
--     teste e não tiver aluno de verdade.
-- ======================================================================

-- (0) CONFERIR antes — quem é o aluno e o que vai sumir:
-- select id, full_name, email, turma_id from public.profiles where full_name ilike '%zocca%';
-- select count(*) from public.registros_classe rc
--   join public.profiles p on p.id = rc.aluno_id where p.full_name ilike '%zocca%';
-- select count(*) from public.report_cards rc
--   join public.profiles p on p.id = rc.aluno_id where p.full_name ilike '%zocca%';

do $$
declare
  v_nome_pattern text := '%zocca%';   -- <<< troque aqui pra reusar com outro aluno
  v_aluno_id uuid;
  v_turmas uuid[];
  v_n_reg int;
  v_n_rc  int;
  v_n_pl  int;
begin
  select id into v_aluno_id
  from public.profiles
  where full_name ilike v_nome_pattern
  limit 1;

  if v_aluno_id is null then
    raise exception 'Nenhum aluno com full_name ilike %', v_nome_pattern;
  end if;

  -- turmas ligadas aos registros do aluno (retrato de onde ele estava) +
  -- a turma atual dele — usadas pra limpar o planner de teste.
  select array(
    select distinct t
    from (
      select turma_id as t from public.registros_classe where aluno_id = v_aluno_id and turma_id is not null
      union
      select turma_id as t from public.profiles where id = v_aluno_id and turma_id is not null
    ) s
  ) into v_turmas;

  -- (1) Registro de Classe do aluno
  delete from public.registros_classe where aluno_id = v_aluno_id;
  get diagnostics v_n_reg = row_count;

  -- (2) Report Cards do aluno
  delete from public.report_cards where aluno_id = v_aluno_id;
  get diagnostics v_n_rc = row_count;

  -- (3) Planner (por turma) das turmas de teste ligadas ao aluno
  if array_length(v_turmas, 1) is not null then
    delete from public.registro_classe_sessao where turma_id = any(v_turmas);
    get diagnostics v_n_pl = row_count;
  else
    v_n_pl := 0;
  end if;

  raise notice 'aluno % : % registros_classe, % report_cards, % planner (turmas %) apagados',
    v_aluno_id, v_n_reg, v_n_rc, v_n_pl, v_turmas;
end $$;

-- (4) CONFERIR depois — tudo deve voltar 0:
-- select count(*) from public.registros_classe rc
--   join public.profiles p on p.id = rc.aluno_id where p.full_name ilike '%zocca%';
-- select count(*) from public.report_cards rc
--   join public.profiles p on p.id = rc.aluno_id where p.full_name ilike '%zocca%';
