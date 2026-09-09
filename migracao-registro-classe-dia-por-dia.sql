-- ⚠️ OBSOLETO — NÃO RODE ESTE ARQUIVO.
-- ======================================================================
-- Esta migração usava "sessao_ordem" (Dia 1 / Dia 2) como identidade do
-- registro. Ao trocar a data de um dia já salvo, o registro era
-- sobrescrito em vez de virar um registro novo.
--
-- FOI SUBSTITUÍDA POR:  migracao-registro-classe-por-data.sql
-- (a DATA passou a ser a identidade — (aluno, aula, data_aula) é único).
--
-- Se você já rodou este arquivo, rode migracao-registro-classe-por-data.sql
-- por cima: ele é idempotente, remove a coluna sessao_ordem e converte as
-- constraints. O conteúdo antigo continua no histórico do git.
-- ======================================================================

do $$
begin
  raise notice 'OBSOLETO: rode migracao-registro-classe-por-data.sql em vez deste arquivo.';
end $$;
