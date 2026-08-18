-- ======================================================================
-- DYSE · Seed de teste — Registro de Classe / Report Card (A1)
-- ----------------------------------------------------------------------
-- Só serve pra ambiente de TESTE (QA). Cria/vincula uma turma de teste
-- com o nível A1, vincula uma professora e (opcionalmente) alunos a ela,
-- e gera registros_classe de aulas 1 a N com avaliações variadas —
-- assim dá pra gerar um Report Card de verdade sem preencher 22 aulas
-- uma por uma pela tela.
--
-- Como usar:
--   1. Preencha as variáveis no bloco "CONFIGURAÇÃO" logo abaixo.
--   2. Abra o SQL Editor do projeto QA no supabase.com → New query.
--   3. Cole este arquivo inteiro e clique em "Run".
--   4. Reabra professora.html — a turma de teste já aparece no seletor,
--      com aulas 1..v_aula_fim já registradas pra cada aluno listado.
--
-- Idempotente: rodar de novo só atualiza os registros (não duplica nada).
-- ======================================================================

do $$
declare
  -- ----------------------- CONFIGURAÇÃO --------------------------------
  v_professor_email text := 'PREENCHA_O_EMAIL_DA_PROFESSORA_AQUI';
  v_turma_nome      text := 'Turma Teste A1';
  -- E-mails de alunos já cadastrados (auth.users) pra matricular na turma
  -- de teste. Pode deixar vazio ('{}') se você já matriculou alunos nela
  -- pela tela de gestão — o seed usa quem já estiver na turma também.
  v_aluno_emails    text[] := array[]::text[]; -- ex: array['aluno1@teste.com','aluno2@teste.com']
  v_aula_inicio     int := 1;
  v_aula_fim        int := 22;
  -- -----------------------------------------------------------------------

  v_turma_id uuid;
  v_professor_id uuid;
  v_aluno_id uuid;
  v_aula record;
  v_niveis jsonb := '["sim","sim","sim","parcial","parcial","nao","nao_participou"]'::jsonb; -- distribuição: maioria "sim"
  v_avaliacoes jsonb;
  v_eixo text;
  v_eixos text[] := array['Tarefa Final','Speaking','Listening','Reading','Writing','Gramática'];
  v_total_alunos int := 0;
begin
  if v_professor_email = 'PREENCHA_O_EMAIL_DA_PROFESSORA_AQUI' then
    raise exception 'Preencha v_professor_email antes de rodar o script.';
  end if;

  -- 1) Turma de teste — cria se ainda não existir.
  select id into v_turma_id from public.turmas where name = v_turma_nome;
  if v_turma_id is null then
    insert into public.turmas (name, description)
    values (v_turma_nome, 'Turma criada pelo seed de teste do Registro de Classe / Report Card.')
    returning id into v_turma_id;
    raise notice 'Turma criada: % (id=%)', v_turma_nome, v_turma_id;
  else
    raise notice 'Turma já existia: % (id=%)', v_turma_nome, v_turma_id;
  end if;

  -- 2) Vincula o nível A1 (currículo) a essa turma — sem isso o Registro
  --    de Classe fica escondido em professora.html mesmo com turma vinculada.
  insert into public.turma_materias (turma_id, materia_slug)
  values (v_turma_id, 'a1')
  on conflict do nothing;

  -- 3) Vincula a professora à turma de teste.
  select id into v_professor_id from auth.users where email = v_professor_email;
  if v_professor_id is null then
    raise exception 'Nenhum usuário encontrado com o e-mail %', v_professor_email;
  end if;
  insert into public.teacher_turmas (teacher_id, turma_id)
  values (v_professor_id, v_turma_id)
  on conflict do nothing;

  -- 4) Matricula os alunos informados na turma de teste (se algum).
  if array_length(v_aluno_emails, 1) is not null then
    update public.profiles p
    set turma_id = v_turma_id
    from auth.users u
    where u.id = p.id and u.email = any(v_aluno_emails);
  end if;

  -- 5) Pra cada aluno hoje matriculado na turma de teste, gera um
  --    registro_classe por aula do intervalo configurado, com avaliações
  --    variadas (não tudo "sim", pra sugestão PP/P/R ficar realista).
  for v_aluno_id in select id from public.profiles where turma_id = v_turma_id and role = 'student' loop
    v_total_alunos := v_total_alunos + 1;

    for v_aula in
      select id, numero from public.nivel_aulas
      where materia_slug = 'a1' and numero between v_aula_inicio and v_aula_fim
      order by numero
    loop
      v_avaliacoes := '{}'::jsonb;
      foreach v_eixo in array v_eixos loop
        v_avaliacoes := v_avaliacoes || jsonb_build_object(
          v_eixo, v_niveis -> floor(random() * jsonb_array_length(v_niveis))::int
        );
      end loop;

      insert into public.registros_classe (aluno_id, nivel_aula_id, turma_id, professor_id, data_aula, avaliacoes, observacoes, criado_por)
      values (v_aluno_id, v_aula.id, v_turma_id, v_professor_id, current_date - ((v_aula_fim - v_aula.numero) * 7), v_avaliacoes, 'Registro de teste gerado por seed.', v_professor_id)
      on conflict (aluno_id, nivel_aula_id) do update
        set avaliacoes = excluded.avaliacoes,
            observacoes = excluded.observacoes,
            turma_id = excluded.turma_id,
            professor_id = excluded.professor_id,
            atualizado_por = excluded.professor_id,
            atualizado_em = now();
    end loop;
  end loop;

  if v_total_alunos = 0 then
    raise notice 'ATENÇÃO: nenhum aluno está matriculado na turma "%" ainda — preencha v_aluno_emails ou matricule alunos nela pela tela de gestão antes de rodar de novo.', v_turma_nome;
  else
    raise notice 'Seed concluído: % aluno(s), aulas % a % da A1, na turma "%".', v_total_alunos, v_aula_inicio, v_aula_fim, v_turma_nome;
  end if;
end $$;
