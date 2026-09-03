-- ======================================================================
-- Migração: varredura diária de inadimplência do Asaas via pg_cron
-- Rodar no Supabase DEPOIS de migracao-asaas.sql. Seguro rodar de novo.
--
-- Por que aqui e não na Vercel: o plano Hobby não deixa agendar cron job
-- no vercel.json (o deploy falha em "Deploying outputs..."). O pg_cron do
-- Supabase resolve sem depender de plano.
-- ======================================================================

-- 1) Função da varredura (mesma lógica de api/asaas.js?action=cron).
create or replace function public.fn_asaas_cron_inadimplencia()
returns jsonb
language plpgsql
security definer set search_path = public
as $$
declare
  r record;
  v_suspensos int := 0;
  v_reativados int := 0;
begin
  -- suspender: aluno ativo com cobrança OVERDUE vencida há mais de 14 dias
  for r in
    select h.aluno_id
    from public.aluno_financeiro_historico h
    where h.data_fim is null and h.situacao = 'ativo'
      and exists (
        select 1 from public.asaas_cobrancas c
        where c.aluno_id = h.aluno_id
          and c.status = 'OVERDUE'
          and c.vencimento <= current_date - 14
      )
  loop
    perform public.fn_asaas_suspender(r.aluno_id, 'Suspensão automática: cobrança do Asaas vencida há mais de 14 dias.');
    v_suspensos := v_suspensos + 1;
  end loop;

  -- reativar: pausado automaticamente e sem nenhuma cobrança OVERDUE
  for r in
    select h.aluno_id
    from public.aluno_financeiro_historico h
    where h.data_fim is null and h.situacao = 'pausado' and h.pausa_automatica = true
      and not exists (
        select 1 from public.asaas_cobrancas c
        where c.aluno_id = h.aluno_id and c.status = 'OVERDUE'
      )
  loop
    perform public.fn_asaas_reativar(r.aluno_id, 'Reativação automática: cobranças do Asaas regularizadas.');
    v_reativados := v_reativados + 1;
  end loop;

  return jsonb_build_object('suspensos', v_suspensos, 'reativados', v_reativados, 'rodou_em', now());
end;
$$;

revoke all on function public.fn_asaas_cron_inadimplencia() from public;
grant execute on function public.fn_asaas_cron_inadimplencia() to service_role, postgres;

-- 2) Extensão pg_cron (se ainda não estiver habilitada).
--    Também dá pra habilitar em: Dashboard -> Database -> Extensions -> pg_cron.
create extension if not exists pg_cron;

-- 3) Agenda diária às 09:00 UTC (~06:00 BRT). cron.schedule é idempotente:
--    chamar de novo com o mesmo nome só atualiza o horário/comando.
select cron.schedule(
  'asaas-inadimplencia-diaria',
  '0 9 * * *',
  $$ select public.fn_asaas_cron_inadimplencia(); $$
);

-- ---- conferências ----
-- Ver o job agendado:
--   select jobid, jobname, schedule, active from cron.job where jobname = 'asaas-inadimplencia-diaria';
-- Rodar a varredura AGORA (teste), sem esperar as 09:00:
--   select public.fn_asaas_cron_inadimplencia();
-- Ver execuções passadas:
--   select status, return_message, start_time
--   from cron.job_run_details
--   where jobid = (select jobid from cron.job where jobname = 'asaas-inadimplencia-diaria')
--   order by start_time desc limit 10;
-- Desativar/remover:
--   select cron.unschedule('asaas-inadimplencia-diaria');
