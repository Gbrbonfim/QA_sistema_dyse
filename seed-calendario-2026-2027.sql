-- ======================================================================
-- DYSE · Seed do Calendário Letivo 2026 e 2027
-- ----------------------------------------------------------------------
-- Popula calendario_letivo_dias com os feriados/recessos/reposições dos
-- calendários impressos de 2026 e 2027. Idempotente: pode rodar de novo
-- (ON CONFLICT (data) DO UPDATE). NÃO publica os anos — a gestão revisa em
-- /calendario-letivo.html e clica "Liberar <ano>" quando quiser.
--
-- Rodar DEPOIS da seção 17 do supabase-schema.sql, em QA e em produção.
--
-- Convenções desta transcrição:
--   * intervalos de RECESSO = todos os dias corridos (inclui fim de semana);
--   * intervalos de REPOSIÇÃO = dias de aula (pula domingo);
--   * quando um feriado cai dentro de um recesso, vale o feriado.
-- ======================================================================

-- Garante a linha-pai de cada ano (FK), sem mexer em "publicado" se já existir.
insert into public.calendario_letivo (ano_letivo) values (2026), (2027)
  on conflict (ano_letivo) do nothing;

-- ----------------------------------------------------------------------
-- RECESSOS (rodam primeiro; feriados abaixo sobrescrevem os dias que coincidem)
-- ----------------------------------------------------------------------
-- 2026
insert into public.calendario_letivo_dias (ano_letivo, data, tipo, titulo)
select 2026, d::date, 'recesso', 'Recesso'
from generate_series('2026-07-20'::date, '2026-08-01'::date, interval '1 day') d
on conflict (data) do update set
  ano_letivo = excluded.ano_letivo, tipo = excluded.tipo, titulo = excluded.titulo, atualizado_em = now();

insert into public.calendario_letivo_dias (ano_letivo, data, tipo, titulo)
select 2026, d::date, 'recesso', 'Recesso administrativo'
from generate_series('2026-10-11'::date, '2026-10-17'::date, interval '1 day') d
on conflict (data) do update set
  ano_letivo = excluded.ano_letivo, tipo = excluded.tipo, titulo = excluded.titulo, atualizado_em = now();

-- 2027
insert into public.calendario_letivo_dias (ano_letivo, data, tipo, titulo)
select 2027, d::date, 'recesso', 'Recesso'
from (values
  ('2027-01-02'::date), ('2027-01-05'), ('2027-01-06'), ('2027-01-07'), ('2027-01-09'),
  ('2027-02-05'), ('2027-02-06'),
  ('2027-03-27'),
  ('2027-08-02'), ('2027-08-04'), ('2027-08-06')
) v(d)
on conflict (data) do update set
  ano_letivo = excluded.ano_letivo, tipo = excluded.tipo, titulo = excluded.titulo, atualizado_em = now();

insert into public.calendario_letivo_dias (ano_letivo, data, tipo, titulo)
select 2027, d::date, 'recesso', 'Recesso'
from generate_series('2027-07-19'::date, '2027-07-31'::date, interval '1 day') d
on conflict (data) do update set
  ano_letivo = excluded.ano_letivo, tipo = excluded.tipo, titulo = excluded.titulo, atualizado_em = now();

insert into public.calendario_letivo_dias (ano_letivo, data, tipo, titulo)
select 2027, d::date, 'recesso', 'Recesso'
from generate_series('2027-12-20'::date, '2027-12-31'::date, interval '1 day') d
on conflict (data) do update set
  ano_letivo = excluded.ano_letivo, tipo = excluded.tipo, titulo = excluded.titulo, atualizado_em = now();

-- ----------------------------------------------------------------------
-- REPOSIÇÕES (pulam domingo)
-- ----------------------------------------------------------------------
-- 2026
insert into public.calendario_letivo_dias (ano_letivo, data, tipo, titulo)
select 2026, d::date, 'reposicao', 'Reposição aulas 2º sem. 2025'
from (values ('2026-01-16'::date), ('2026-01-17')) v(d)
on conflict (data) do update set
  ano_letivo = excluded.ano_letivo, tipo = excluded.tipo, titulo = excluded.titulo, atualizado_em = now();

insert into public.calendario_letivo_dias (ano_letivo, data, tipo, titulo)
values (2026, '2026-12-14', 'reposicao', 'Reposição de aula 2º semestre')
on conflict (data) do update set
  ano_letivo = excluded.ano_letivo, tipo = excluded.tipo, titulo = excluded.titulo, atualizado_em = now();

-- 2027
insert into public.calendario_letivo_dias (ano_letivo, data, tipo, titulo)
select 2027, d::date, 'reposicao', 'Reposição 2º sem. 2026'
from (values ('2027-01-04'::date), ('2027-01-08'),
             ('2027-02-01'), ('2027-02-02'), ('2027-02-03'), ('2027-02-04')) v(d)
on conflict (data) do update set
  ano_letivo = excluded.ano_letivo, tipo = excluded.tipo, titulo = excluded.titulo, atualizado_em = now();

insert into public.calendario_letivo_dias (ano_letivo, data, tipo, titulo)
select 2027, d::date, 'reposicao', 'Reposição 2º sem. 2026'
from generate_series('2027-01-11'::date, '2027-01-30'::date, interval '1 day') d
where extract(dow from d) <> 0
on conflict (data) do update set
  ano_letivo = excluded.ano_letivo, tipo = excluded.tipo, titulo = excluded.titulo, atualizado_em = now();

insert into public.calendario_letivo_dias (ano_letivo, data, tipo, titulo)
select 2027, d::date, 'reposicao', 'Reposição 1º semestre 2027'
from (values ('2027-08-03'::date), ('2027-08-05'), ('2027-08-07')) v(d)
on conflict (data) do update set
  ano_letivo = excluded.ano_letivo, tipo = excluded.tipo, titulo = excluded.titulo, atualizado_em = now();

-- ----------------------------------------------------------------------
-- RETORNO DAS AULAS DE CONVERSAÇÃO
-- ----------------------------------------------------------------------
insert into public.calendario_letivo_dias (ano_letivo, data, tipo, titulo)
values (2026, '2026-01-12', 'retorno_conversacao', 'Retorno das aulas de conversação')
on conflict (data) do update set
  ano_letivo = excluded.ano_letivo, tipo = excluded.tipo, titulo = excluded.titulo, atualizado_em = now();

-- ----------------------------------------------------------------------
-- INÍCIO DE SEMESTRE
-- ----------------------------------------------------------------------
insert into public.calendario_letivo_dias (ano_letivo, data, tipo, titulo)
values
  (2026, '2026-02-09', 'inicio_semestre', 'Início 1º semestre de 2026'),
  (2026, '2026-08-03', 'inicio_semestre', 'Início 2º semestre de 2026'),
  (2027, '2027-02-11', 'inicio_semestre', 'Início 1º semestre de 2027'),
  (2027, '2027-08-09', 'inicio_semestre', 'Início 2º semestre de 2027')
on conflict (data) do update set
  ano_letivo = excluded.ano_letivo, tipo = excluded.tipo, titulo = excluded.titulo, atualizado_em = now();

-- ----------------------------------------------------------------------
-- FERIADOS (rodam por último; vencem qualquer recesso no mesmo dia)
-- ----------------------------------------------------------------------
insert into public.calendario_letivo_dias (ano_letivo, data, tipo, titulo)
values
  -- 2026
  (2026, '2026-02-14', 'feriado', 'Carnaval'),
  (2026, '2026-02-15', 'feriado', 'Carnaval'),
  (2026, '2026-02-16', 'feriado', 'Carnaval'),
  (2026, '2026-02-17', 'feriado', 'Carnaval'),
  (2026, '2026-02-18', 'feriado', 'Quarta-feira de Cinzas'),
  (2026, '2026-04-03', 'feriado', 'Sexta-feira Santa'),
  (2026, '2026-04-21', 'feriado', 'Tiradentes'),
  (2026, '2026-05-01', 'feriado', 'Dia do Trabalho'),
  (2026, '2026-06-04', 'feriado', 'Corpus Christi'),
  (2026, '2026-09-07', 'feriado', 'Independência do Brasil'),
  (2026, '2026-10-12', 'feriado', 'N. Sra. Aparecida / Dia das Crianças'),
  (2026, '2026-10-15', 'feriado', 'Dia do Professor'),
  (2026, '2026-11-02', 'feriado', 'Finados'),
  (2026, '2026-11-15', 'feriado', 'Proclamação da República'),
  (2026, '2026-11-20', 'feriado', 'Consciência Negra'),
  (2026, '2026-12-25', 'feriado', 'Natal'),
  -- 2027
  (2027, '2027-01-01', 'feriado', 'Confraternização Universal'),
  (2027, '2027-02-08', 'feriado', 'Carnaval'),
  (2027, '2027-02-09', 'feriado', 'Carnaval'),
  (2027, '2027-02-10', 'feriado', 'Carnaval'),
  (2027, '2027-03-26', 'feriado', 'Sexta-feira Santa'),
  (2027, '2027-03-28', 'feriado', 'Páscoa'),
  (2027, '2027-03-29', 'feriado', 'Aniversário de Curitiba'),
  (2027, '2027-04-21', 'feriado', 'Tiradentes'),
  (2027, '2027-05-01', 'feriado', 'Dia do Trabalho'),
  (2027, '2027-05-09', 'feriado', 'Dia das Mães'),
  (2027, '2027-05-27', 'feriado', 'Corpus Christi'),
  (2027, '2027-09-07', 'feriado', 'Independência do Brasil'),
  (2027, '2027-09-08', 'feriado', 'Feriado municipal de Curitiba'),
  (2027, '2027-10-12', 'feriado', 'N. Sra. Aparecida / Dia das Crianças'),
  (2027, '2027-10-15', 'feriado', 'Dia do Professor'),
  (2027, '2027-11-02', 'feriado', 'Finados'),
  (2027, '2027-11-15', 'feriado', 'Proclamação da República'),
  (2027, '2027-11-20', 'feriado', 'Consciência Negra'),
  (2027, '2027-12-25', 'feriado', 'Natal')
on conflict (data) do update set
  ano_letivo = excluded.ano_letivo, tipo = excluded.tipo, titulo = excluded.titulo, atualizado_em = now();
