-- ======================================================================
-- Migração: excluir usuário não pode ser travado por FK de "autor"
-- Rodar no Supabase (QA e produção — banco único). Seguro rodar mais de uma vez.
--
-- Sintoma: ao excluir um aluno (ou professor) pela gestão aparece
--   "Não foi possível excluir: Database error deleting user".
-- Causa: alguma tabela tem uma coluna de autoria (criado_por, registrado_por,
--   gerado_por, usuario_id da auditoria, etc.) apontando pra auth.users /
--   public.profiles SEM "on delete" — então o Postgres recusa apagar a
--   pessoa enquanto existir 1 registro histórico feito por ela.
-- Correção: toda FK de coluna ANULÁVEL que aponta pra auth.users ou
--   public.profiles e hoje é NO ACTION/RESTRICT passa a ser ON DELETE SET NULL.
--   O registro histórico continua existindo, só perde o "quem fez".
--   Colunas NOT NULL (aluno_id, teacher_id, user_id…) não são tocadas — essas
--   já são "on delete cascade" e é o comportamento certo.
-- ======================================================================

do $$
declare
  r record;
begin
  for r in
    select con.conname,
           con.conrelid::regclass::text as tbl,
           att.attname                  as col,
           con.confrelid::regclass::text as ref_tbl
    from pg_constraint con
    join pg_attribute  att
      on att.attrelid = con.conrelid
     and att.attnum   = con.conkey[1]
    where con.contype = 'f'
      and con.connamespace = 'public'::regnamespace
      and array_length(con.conkey, 1) = 1
      and con.confrelid in ('auth.users'::regclass, 'public.profiles'::regclass)
      and con.confdeltype in ('a', 'r')      -- NO ACTION / RESTRICT
      and not att.attnotnull                  -- só colunas que aceitam null
  loop
    execute format('alter table %s drop constraint %I', r.tbl, r.conname);
    execute format(
      'alter table %s add constraint %I foreign key (%I) references %s(id) on delete set null',
      r.tbl, r.conname, r.col, r.ref_tbl
    );
    raise notice 'SET NULL aplicado: %.% -> %', r.tbl, r.col, r.ref_tbl;
  end loop;
end $$;

-- horario_sugestoes.criado_por é NOT NULL (não dá pra SET NULL) e só liga
-- gestão<->professor; se o autor sumir, a sugestão perde o sentido -> cascade.
alter table public.horario_sugestoes drop constraint if exists horario_sugestoes_criado_por_fkey;
alter table public.horario_sugestoes
  add constraint horario_sugestoes_criado_por_fkey
  foreign key (criado_por) references auth.users(id) on delete cascade;

-- Conferência — deve voltar ZERO linhas:
-- select con.conrelid::regclass as tabela, att.attname as coluna
-- from pg_constraint con
-- join pg_attribute att on att.attrelid = con.conrelid and att.attnum = con.conkey[1]
-- where con.contype = 'f' and con.connamespace = 'public'::regnamespace
--   and con.confrelid in ('auth.users'::regclass, 'public.profiles'::regclass)
--   and con.confdeltype in ('a','r') and not att.attnotnull;
