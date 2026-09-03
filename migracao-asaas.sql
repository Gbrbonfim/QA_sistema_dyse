-- ======================================================================
-- Migração: MÓDULO ASAAS — conciliação de cobranças do gateway
-- Rodar no Supabase (QA e produção). Seguro rodar mais de uma vez.
-- (É o mesmo conteúdo da seção 20 de supabase-schema.sql.)
--
-- Depois de rodar, confira:
--   select table_name from information_schema.tables
--   where table_schema='public'
--     and table_name in ('aluno_asaas','asaas_assinaturas','asaas_cobrancas','asaas_eventos');
--   -- deve listar as 4
-- ======================================================================

-- 20.1) Vínculo aluno <-> cliente Asaas + dados fiscais do aluno.
create table if not exists public.aluno_asaas (
  aluno_id uuid primary key references auth.users(id) on delete cascade,
  cpf_cnpj text,
  asaas_customer_id text unique,
  match_metodo text not null default 'pendente'
    check (match_metodo in ('pendente','cpf','email','manual','nao_encontrado')),
  nome_asaas text,
  email_asaas text,
  sincronizado_em timestamptz,
  atualizado_em timestamptz not null default now()
);
create index if not exists idx_aluno_asaas_customer on public.aluno_asaas (asaas_customer_id);

alter table public.aluno_asaas enable row level security;

drop policy if exists "aluno_asaas: financeiro gerencia" on public.aluno_asaas;
create policy "aluno_asaas: financeiro gerencia"
  on public.aluno_asaas for all
  using (public.is_financeiro())
  with check (public.is_financeiro());

drop policy if exists "aluno_asaas: aluno le o proprio" on public.aluno_asaas;
create policy "aluno_asaas: aluno le o proprio"
  on public.aluno_asaas for select
  using (aluno_id = auth.uid());

-- 20.2) Cache das assinaturas (subscriptions) do Asaas.
create table if not exists public.asaas_assinaturas (
  id text primary key,
  aluno_id uuid references auth.users(id) on delete set null,
  asaas_customer_id text,
  valor numeric(10,2),
  ciclo text,
  status text,
  proximo_vencimento date,
  descricao text,
  sincronizado_em timestamptz not null default now(),
  raw jsonb
);
create index if not exists idx_asaas_assin_aluno on public.asaas_assinaturas (aluno_id);

alter table public.asaas_assinaturas enable row level security;

drop policy if exists "asaas_assinaturas: financeiro le" on public.asaas_assinaturas;
create policy "asaas_assinaturas: financeiro le"
  on public.asaas_assinaturas for select
  using (public.is_financeiro());

drop policy if exists "asaas_assinaturas: aluno le a propria" on public.asaas_assinaturas;
create policy "asaas_assinaturas: aluno le a propria"
  on public.asaas_assinaturas for select
  using (aluno_id = auth.uid());

-- 20.3) Cache das cobranças (payments) do Asaas.
create table if not exists public.asaas_cobrancas (
  id text primary key,
  aluno_id uuid references auth.users(id) on delete set null,
  asaas_customer_id text,
  subscription_id text,
  valor numeric(10,2),
  valor_liquido numeric(10,2),
  status text,
  billing_type text,
  vencimento date,
  pago_em date,
  invoice_url text,
  bank_slip_url text,
  pix_payload text,
  nota_fiscal_id text,
  nota_fiscal_status text,
  nota_fiscal_url text,
  descricao text,
  avulsa boolean not null default false,
  sincronizado_em timestamptz not null default now(),
  raw jsonb
);
create index if not exists idx_asaas_cobr_aluno on public.asaas_cobrancas (aluno_id, vencimento desc);
create index if not exists idx_asaas_cobr_status on public.asaas_cobrancas (status, vencimento);
create index if not exists idx_asaas_cobr_customer on public.asaas_cobrancas (asaas_customer_id);

alter table public.asaas_cobrancas enable row level security;

drop policy if exists "asaas_cobrancas: financeiro le" on public.asaas_cobrancas;
create policy "asaas_cobrancas: financeiro le"
  on public.asaas_cobrancas for select
  using (public.is_financeiro());

drop policy if exists "asaas_cobrancas: aluno le as proprias" on public.asaas_cobrancas;
create policy "asaas_cobrancas: aluno le as proprias"
  on public.asaas_cobrancas for select
  using (aluno_id = auth.uid());

-- 20.4) Log de eventos do webhook — idempotência.
create table if not exists public.asaas_eventos (
  id bigint generated always as identity primary key,
  asaas_event_id text unique,
  evento text,
  payment_id text,
  recebido_em timestamptz not null default now(),
  processado boolean not null default false,
  payload jsonb
);
create index if not exists idx_asaas_eventos_payment on public.asaas_eventos (payment_id);

alter table public.asaas_eventos enable row level security;

drop policy if exists "asaas_eventos: financeiro le" on public.asaas_eventos;
create policy "asaas_eventos: financeiro le"
  on public.asaas_eventos for select
  using (public.is_financeiro());

-- 20.5) Flag de suspensão automática no histórico financeiro.
alter table public.aluno_financeiro_historico
  add column if not exists pausa_automatica boolean not null default false;

-- 20.6) RPCs de suspensão/reativação automática (chamadas pelo cron/webhook
--       com a service_role).
create or replace function public.fn_asaas_suspender(p_aluno_id uuid, p_motivo text)
returns void
language plpgsql
security definer set search_path = public
as $$
declare
  aberto public.aluno_financeiro_historico%rowtype;
  novo_id bigint;
  nome text;
begin
  select * into aberto
  from public.aluno_financeiro_historico
  where aluno_id = p_aluno_id and data_fim is null
  order by data_inicio desc
  limit 1;

  if not found then return; end if;
  if aberto.situacao = 'pausado' then return; end if;

  update public.aluno_financeiro_historico
    set data_fim = current_date - 1
    where id = aberto.id;

  insert into public.aluno_financeiro_historico
    (aluno_id, professor_id, modalidade_id, valor_mensal_aluno, valor_professor_customizado,
     situacao, data_inicio, quantidade_parcelas, observacao, contrato_inicio, contrato_fim,
     pausa_automatica, criado_por)
  values
    (aberto.aluno_id, aberto.professor_id, aberto.modalidade_id, aberto.valor_mensal_aluno,
     aberto.valor_professor_customizado, 'pausado', current_date, aberto.quantidade_parcelas,
     aberto.observacao, aberto.contrato_inicio, aberto.contrato_fim, true, null)
  returning id into novo_id;

  insert into public.aluno_financeiro_observacoes (aluno_id, periodo_id, observacao, registrado_por)
  values (p_aluno_id, novo_id, coalesce(p_motivo, 'Suspensão automática por inadimplência (Asaas).'), null);

  update public.profiles set situacao_financeira = 'pausado' where id = p_aluno_id;

  select full_name into nome from public.profiles where id = p_aluno_id;
  insert into public.avisos (tipo, titulo, corpo, aluno_id, criado_por)
  values ('aluno_pausado', 'Aluno pausado (mensalidade atrasada)',
          coalesce(nome, 'O aluno') || ' foi pausado automaticamente por cobrança do Asaas vencida há mais de 14 dias. O acesso ao painel do aluno fica bloqueado e a professora não faz a chamada dele até regularizar. A cobrança da mensalidade continua sendo gerada normalmente.',
          p_aluno_id, null);
end;
$$;

create or replace function public.fn_asaas_reativar(p_aluno_id uuid, p_motivo text)
returns void
language plpgsql
security definer set search_path = public
as $$
declare
  aberto public.aluno_financeiro_historico%rowtype;
  novo_id bigint;
  nome text;
begin
  select * into aberto
  from public.aluno_financeiro_historico
  where aluno_id = p_aluno_id and data_fim is null
  order by data_inicio desc
  limit 1;

  if not found then return; end if;
  if aberto.situacao <> 'pausado' or aberto.pausa_automatica is not true then return; end if;

  update public.aluno_financeiro_historico
    set data_fim = current_date - 1
    where id = aberto.id;

  insert into public.aluno_financeiro_historico
    (aluno_id, professor_id, modalidade_id, valor_mensal_aluno, valor_professor_customizado,
     situacao, data_inicio, quantidade_parcelas, observacao, contrato_inicio, contrato_fim,
     pausa_automatica, criado_por)
  values
    (aberto.aluno_id, aberto.professor_id, aberto.modalidade_id, aberto.valor_mensal_aluno,
     aberto.valor_professor_customizado, 'ativo', current_date, aberto.quantidade_parcelas,
     aberto.observacao, aberto.contrato_inicio, aberto.contrato_fim, false, null)
  returning id into novo_id;

  insert into public.aluno_financeiro_observacoes (aluno_id, periodo_id, observacao, registrado_por)
  values (p_aluno_id, novo_id, coalesce(p_motivo, 'Reativação automática: cobranças do Asaas regularizadas.'), null);

  update public.profiles set situacao_financeira = 'ativo' where id = p_aluno_id;

  select full_name into nome from public.profiles where id = p_aluno_id;
  insert into public.avisos (tipo, titulo, corpo, aluno_id, criado_por)
  values ('aluno_reativado', 'Aluno reativado (pagamento regularizado)',
          coalesce(nome, 'O aluno') || ' voltou para "ativo" automaticamente: não há mais cobrança do Asaas vencida. O acesso ao painel foi liberado.',
          p_aluno_id, null);
end;
$$;

revoke all on function public.fn_asaas_suspender(uuid, text) from public;
revoke all on function public.fn_asaas_reativar(uuid, text) from public;
grant execute on function public.fn_asaas_suspender(uuid, text) to service_role;
grant execute on function public.fn_asaas_reativar(uuid, text) to service_role;
