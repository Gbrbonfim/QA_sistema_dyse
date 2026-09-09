-- ======================================================================
-- ⚠️ OBSOLETO — SUBSTITUÍDO POR migracao-registro-classe-dia-por-dia.sql
-- (aquela guarda cada dia da aula numa LINHA própria; esta guardava as
-- datas num array numa linha só, que perdia avaliação/observação por dia).
-- Não rode este arquivo. Mantido só como histórico. Se já foi rodado, a
-- migração nova faz "drop column if exists datas".
-- ======================================================================
-- Migração: Registro de Classe — 1 aula pode ter VÁRIAS datas
-- Rodar no Supabase (QA e produção). Seguro rodar mais de uma vez.
-- (Mesmo conteúdo já embutido nas seções 12.4 e 12.5 de supabase-schema.sql.)
--
-- Contexto: uma aula/material é ministrada às vezes em mais de um dia.
-- Antes só cabia UMA data (`data_aula`). Agora existe `datas date[]` com
-- todos os dias; `data_aula` continua como espelho do dia mais recente
-- (compatibilidade com quem lê só um campo). Continua 1 registro por
-- (aluno, aula) e 1 planner por (turma, aula) — o que é multivalorado é
-- só a data, não a avaliação.
-- ======================================================================

-- Registro por aluno (Bloco B)
alter table public.registros_classe
  add column if not exists datas date[] not null default '{}';

update public.registros_classe
  set datas = array[data_aula]
  where (datas is null or datas = '{}') and data_aula is not null;

-- Planner por turma+aula (Bloco C)
alter table public.registro_classe_sessao
  add column if not exists datas date[] not null default '{}';

update public.registro_classe_sessao
  set datas = array[data_aula]
  where (datas is null or datas = '{}') and data_aula is not null;

-- Conferência:
-- select id, data_aula, datas from public.registros_classe order by id desc limit 10;
-- select id, data_aula, datas from public.registro_classe_sessao order by id desc limit 10;
