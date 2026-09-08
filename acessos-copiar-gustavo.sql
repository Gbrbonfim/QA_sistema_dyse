-- ======================================================================
-- Copiar os acessos do Gustavo para Kauanna e Letícia
-- Rodar no Supabase (QA e produção). NÃO é migração de schema — é
-- operação de dados pontual. Seguro rodar mais de uma vez.
--
-- Depois de rodar, as contas precisam SAIR e ENTRAR de novo pra sessão
-- pegar o papel novo.
-- ======================================================================

-- 1) CONFERIR: o que o Gustavo tem hoje e achar as 3 contas.
--    Ajuste os filtros se algum nome não aparecer.
select id, full_name, email, role, also_teacher, also_student, turma_id
from public.profiles
where email ilike any (array['%gustavo%', '%kaua%', '%leti%', '%letícia%'])
order by full_name;

-- ----------------------------------------------------------------------
-- 2) COPIAR papel + flags (role / also_teacher / also_student).
--    Troque os 3 e-mails pelos valores exatos vistos no passo 1.
-- ----------------------------------------------------------------------
update public.profiles p
set role         = g.role,
    also_teacher = g.also_teacher,
    also_student = g.also_student
from public.profiles g
where g.email = 'EMAIL_DO_GUSTAVO'
  and p.email in ('EMAIL_DA_KAUANNA', 'EMAIL_DA_LETICIA');

-- ----------------------------------------------------------------------
-- 3) OPCIONAL — acesso às MESMAS turmas como professora (teacher_turmas).
--    Só rode se o Gustavo for professor de turmas específicas e você
--    quiser que Kauanna/Letícia também sejam.
-- ----------------------------------------------------------------------
insert into public.teacher_turmas (teacher_id, turma_id)
select p.id, tt.turma_id
from public.teacher_turmas tt
join public.profiles g on g.id = tt.teacher_id and g.email = 'EMAIL_DO_GUSTAVO'
cross join public.profiles p
where p.email in ('EMAIL_DA_KAUANNA', 'EMAIL_DA_LETICIA')
on conflict do nothing;

-- ----------------------------------------------------------------------
-- 4) OPCIONAL — turma em que ele é ALUNO (profiles.turma_id). É vínculo
--    pessoal (acesso ao conteúdo daquela turma). Só rode se quiser mesmo.
-- ----------------------------------------------------------------------
-- update public.profiles p
-- set turma_id = g.turma_id
-- from public.profiles g
-- where g.email = 'EMAIL_DO_GUSTAVO'
--   and p.email in ('EMAIL_DA_KAUANNA', 'EMAIL_DA_LETICIA');

-- 5) CONFERIR de novo:
-- select full_name, email, role, also_teacher, also_student, turma_id
-- from public.profiles
-- where email in ('EMAIL_DO_GUSTAVO', 'EMAIL_DA_KAUANNA', 'EMAIL_DA_LETICIA');
