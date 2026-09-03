/* ======================================================================
   DYSE · Função serverless (Vercel) — varredura de inadimplência (Asaas)
   ----------------------------------------------------------------------
   O agendamento diário roda no Supabase (pg_cron chamando
   public.fn_asaas_cron_inadimplencia() — ver migracao-asaas-cron.sql).
   Esta função é só um GATILHO MANUAL / de teste da MESMA lógica: útil pra
   validar sem esperar o horário, ou pra um agendador externo bater aqui.

   GET/POST com header  Authorization: Bearer <CRON_SECRET>

   - Suspende o aluno ATIVO com cobrança do Asaas vencida há mais de 14
     dias (status OVERDUE, vencimento <= hoje-14).
   - Reativa o aluno PAUSADO por suspensão automática que não tem mais
     nenhuma cobrança OVERDUE.

   Env: SUPABASE_SERVICE_ROLE_KEY, CRON_SECRET
   ====================================================================== */

const { adminClient } = require('./_asaas');

async function run(req, res){
  const secret = process.env.CRON_SECRET;
  if(!secret){ res.status(500).json({ error: 'CRON_SECRET não configurado.' }); return; }
  if((req.headers.authorization || '') !== 'Bearer ' + secret){ res.status(401).json({ error: 'Não autorizado.' }); return; }

  const admin = adminClient();
  const { data, error } = await admin.rpc('fn_asaas_cron_inadimplencia');
  if(error){ res.status(500).json({ error: 'Erro na varredura: ' + error.message }); return; }

  res.status(200).json({ ok: true, ...(data || {}) });
}

module.exports = async function handler(req, res){
  try{ await run(req, res); }
  catch(err){
    const status = err && err.status ? err.status : 500;
    if(!res.headersSent) res.status(status).json({ error: (err && err.message) || String(err) });
  }
};
