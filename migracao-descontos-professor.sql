-- ======================================================================
-- Migração: Descontos no pagamento do professor
-- Rodar no Supabase (QA e produção — banco único). Seguro rodar mais de uma vez.
--
-- Descontos lançados pela gestão por professor + mês (ex.: plano de saúde).
-- Aparecem nas colunas "Descontos" / "Descrição" da aba Pagamentos e reduzem
-- o "A pagar" (= Total previsto − Descontos). A substituição de aulas já é
-- tratada automaticamente na aba Substituições (entra no Total previsto), então
-- só lance aqui como "substituicao_aulas" se NÃO usou a aba Substituições.
-- (Mesmo conteúdo da seção 23 de supabase-schema.sql.)
-- ======================================================================

create table if not exists public.descontos_professor (
  id bigint generated always as identity primary key,
  professor_id uuid not null references auth.users(id) on delete cascade,
  mes_competencia date not null,        -- primeiro dia do mês (YYYY-MM-01)
  tipo text not null default 'outro' check (tipo in ('plano_saude','substituicao_aulas','outro')),
  valor numeric(10,2) not null check (valor >= 0),
  descricao text,
  criado_por uuid references auth.users(id) on delete set null,
  criado_em timestamptz default now()
);

create index if not exists idx_descontos_professor_prof_mes
  on public.descontos_professor (professor_id, mes_competencia);

alter table public.descontos_professor enable row level security;

drop policy if exists "gestao gerencia descontos professor" on public.descontos_professor;
create policy "gestao gerencia descontos professor"
  on public.descontos_professor for all
  using (public.is_financeiro())
  with check (public.is_financeiro());

drop policy if exists "professor ve os proprios descontos" on public.descontos_professor;
create policy "professor ve os proprios descontos"
  on public.descontos_professor for select
  using (professor_id = auth.uid());

drop trigger if exists trg_audit_descontos_professor on public.descontos_professor;
create trigger trg_audit_descontos_professor
  after insert or update or delete on public.descontos_professor
  for each row execute procedure public.log_financeiro_auditoria();
