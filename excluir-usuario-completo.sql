-- ======================================================================
-- Excluir um usuário (aluno ou professor) e TUDO ligado a ele — direto no banco
-- Rodar no Supabase (console SQL). Banco é único (QA = prod).
--
-- Uso: aluno de teste "Aluno teste 3" (teste3@gmail.com). Ajuste o e-mail
-- (ou o nome no fallback) para reusar.
--
-- O QUE FAZ (transacional — se algo falhar, desfaz tudo):
--   1. Acha o id do usuário pelo e-mail (fallback: nome).
--   2. Para CADA tabela que referencia auth.users/public.profiles:
--        - coluna NOT NULL  -> apaga as linhas (mensalidades, registros de
--          classe, report cards, histórico financeiro, presenças, etc.)
--        - coluna anulável  -> zera o campo (colunas de "quem criou/registrou",
--          usuario_id da auditoria…) — mantém o registro histórico.
--   3. Apaga o objeto de storage do usuário (se houver).
--   4. Apaga de auth.users — o profiles some junto (cascade).
--
-- ⚠️ Sem volta. Confirme no passo (0) que é o usuário certo.
-- ======================================================================

-- (0) CONFERIR antes:
-- select id, email, created_at from auth.users where lower(email) = lower('teste3@gmail.com');
-- select id, full_name, email, role, turma_id from public.profiles
--   where id in (select id from auth.users where lower(email) = lower('teste3@gmail.com'));

do $$
declare
  v_email text := 'teste3@gmail.com';   -- <<< ajuste aqui
  v_nome_fallback text := '%aluno teste 3%';
  v_uid uuid;
  r record;
  n bigint;
begin
  select id into v_uid from auth.users where lower(email) = lower(v_email);
  if v_uid is null then
    select id into v_uid from public.profiles where full_name ilike v_nome_fallback limit 1;
  end if;
  if v_uid is null then
    raise exception 'Usuário não encontrado (email % / nome %)', v_email, v_nome_fallback;
  end if;
  raise notice 'Excluindo usuário %', v_uid;

  -- Primeiro as FKs de coluna NOT NULL (apaga linhas), depois as anuláveis (zera).
  for r in
    select con.conrelid::regclass::text as tbl,
           att.attname                  as col,
           att.attnotnull               as notnull
    from pg_constraint con
    join pg_attribute  att
      on att.attrelid = con.conrelid and att.attnum = con.conkey[1]
    where con.contype = 'f'
      and con.connamespace = 'public'::regnamespace
      and array_length(con.conkey, 1) = 1
      and con.confrelid in ('auth.users'::regclass, 'public.profiles'::regclass)
      and con.conrelid <> 'public.profiles'::regclass   -- profiles sai por cascade de auth.users
    order by att.attnotnull desc
  loop
    if r.notnull then
      execute format('delete from %s where %I = $1', r.tbl, r.col) using v_uid;
    else
      execute format('update %s set %I = null where %I = $1', r.tbl, r.col, r.col) using v_uid;
    end if;
    get diagnostics n = row_count;
    if n > 0 then
      raise notice '  % : % linha(s) em % (%.%)',
        case when r.notnull then 'apagadas' else 'zeradas ' end, n, r.tbl, r.tbl, r.col;
    end if;
  end loop;

  -- Storage (se o projeto usar) — o owner referencia auth.users.
  begin
    execute 'delete from storage.objects where owner = $1' using v_uid;
    get diagnostics n = row_count;
    if n > 0 then raise notice '  apagados % objeto(s) de storage', n; end if;
  exception when undefined_table then null;
  end;

  -- Enfim o usuário (leva o profiles junto por cascade).
  delete from auth.users where id = v_uid;
  raise notice 'OK: auth.users % + profiles apagados.', v_uid;
end $$;

-- (4) CONFERIR depois — tudo deve voltar 0 linhas:
-- select count(*) from auth.users     where lower(email) = lower('teste3@gmail.com');
-- select count(*) from public.profiles where full_name ilike '%aluno teste 3%';
