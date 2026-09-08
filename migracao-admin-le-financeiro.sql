-- ======================================================================
-- Migração: admin comum passa a LER o histórico financeiro do aluno
-- Rodar no Supabase (QA e produção). Seguro rodar mais de uma vez.
--
-- Motivo: os filtros da aba Alunos em gestao.html (modalidade / professor
-- responsável / situação / contrato vencendo) e os selinhos de cada linha
-- precisam ler public.aluno_financeiro_historico. Até agora só a role
-- 'financeiro' lia (is_financeiro()); agora qualquer 'admin' também lê.
--
-- É SÓ SELECT. Editar valor/modalidade/professor/situação continua
-- exclusivo de is_financeiro() pela política já existente
-- "admins gerenciam historico financeiro dos alunos".
-- (Mesmo conteúdo da seção 9.3 de supabase-schema.sql.)
-- ======================================================================

drop policy if exists "admin comum le historico financeiro" on public.aluno_financeiro_historico;
create policy "admin comum le historico financeiro"
  on public.aluno_financeiro_historico for select
  using (public.is_admin());
