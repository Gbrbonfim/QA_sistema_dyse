-- ======================================================================
-- Migração: Substituição de professor num dia específico
-- Rodar no Supabase (QA e produção — banco único). Seguro rodar mais de uma vez.
--
-- Caso de uso: a Pietra cobriu a aula da Thaís no dia 01/09; o resto do mês
-- continua com a Thaís. A fatia daquele dia (1 de N aulas do mês) sai do
-- pagamento do professor titular e vai pro substituto, no rateio do mês
-- (dyseGerarMensalidadesDoMes lê esta tabela). Custo total da turma não muda.
-- O substituto recebe pela mesma taxa da modalidade daquele aluno.
-- (Mesmo conteúdo da seção 22 de supabase-schema.sql.)
-- ======================================================================

create table if not exists public.substituicoes_professor (
  id bigint generated always as identity primary key,
  turma_id uuid not null references public.turmas(id) on delete cascade,
  data_aula date not null,
  professor_substituto_id uuid not null references auth.users(id) on delete cascade,
  observacao text,
  criado_por uuid references auth.users(id) on delete set null,
  criado_em timestamptz default now(),
  unique (turma_id, data_aula)   -- uma substituição por turma por dia
);

create index if not exists idx_substituicoes_professor_data
  on public.substituicoes_professor (data_aula);

alter table public.substituicoes_professor enable row level security;

drop policy if exists "gestao gerencia substituicoes" on public.substituicoes_professor;
create policy "gestao gerencia substituicoes"
  on public.substituicoes_professor for all
  using (public.is_financeiro())
  with check (public.is_financeiro());

drop policy if exists "professor ve substituicoes onde e o substituto" on public.substituicoes_professor;
create policy "professor ve substituicoes onde e o substituto"
  on public.substituicoes_professor for select
  using (professor_substituto_id = auth.uid());

drop trigger if exists trg_audit_substituicoes on public.substituicoes_professor;
create trigger trg_audit_substituicoes
  after insert or update or delete on public.substituicoes_professor
  for each row execute procedure public.log_financeiro_auditoria();
