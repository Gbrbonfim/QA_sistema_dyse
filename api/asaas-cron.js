/* ======================================================================
   DYSE · Função serverless (Vercel) — cron diário de inadimplência (Asaas)
   ----------------------------------------------------------------------
   Chamada 1x/dia pelo Cron Job da Vercel (ver vercel.json). A Vercel
   injeta "Authorization: Bearer <CRON_SECRET>" automaticamente.

   - Suspende o aluno ATIVO com alguma cobrança do Asaas vencida há mais
     de 14 dias (status OVERDUE, vencimento <= hoje-14).
   - Reativa o aluno PAUSADO por suspensão automática (pausa_automatica)
     que não tem mais nenhuma cobrança OVERDUE.

   Lê do cache asaas_cobrancas, que o webhook mantém atualizado; a
   sincronização completa é o botão "Sincronizar com Asaas" na gestão.

   Env: SUPABASE_SERVICE_ROLE_KEY, CRON_SECRET
   ====================================================================== */

const { adminClient } = require('./_asaas');

async function run(req, res){
  const secret = process.env.CRON_SECRET;
  if(!secret){ res.status(500).json({ error: 'CRON_SECRET não configurado.' }); return; }
  if((req.headers.authorization || '') !== 'Bearer ' + secret){ res.status(401).json({ error: 'Não autorizado.' }); return; }

  const admin = adminClient();

  const limite = new Date();
  limite.setDate(limite.getDate() - 14);
  const limiteStr = limite.toISOString().slice(0, 10);

  const [{ data: periodos }, { data: overdue }] = await Promise.all([
    admin.from('aluno_financeiro_historico').select('aluno_id, situacao, pausa_automatica').is('data_fim', null),
    admin.from('asaas_cobrancas').select('aluno_id, vencimento').eq('status', 'OVERDUE').not('aluno_id', 'is', null)
  ]);

  const temVencida = new Set();
  const temVencida14 = new Set();
  for(const c of (overdue || [])){
    temVencida.add(c.aluno_id);
    if(c.vencimento && c.vencimento <= limiteStr) temVencida14.add(c.aluno_id);
  }

  let suspensos = 0, reativados = 0;
  const erros = [];

  for(const p of (periodos || [])){
    try{
      if(p.situacao === 'ativo' && temVencida14.has(p.aluno_id)){
        const { error } = await admin.rpc('fn_asaas_suspender', {
          p_aluno_id: p.aluno_id,
          p_motivo: 'Suspensão automática: cobrança do Asaas vencida há mais de 14 dias.'
        });
        if(error) erros.push('suspender ' + p.aluno_id + ': ' + error.message); else suspensos++;
      } else if(p.situacao === 'pausado' && p.pausa_automatica && !temVencida.has(p.aluno_id)){
        const { error } = await admin.rpc('fn_asaas_reativar', {
          p_aluno_id: p.aluno_id,
          p_motivo: 'Reativação automática: cobranças do Asaas regularizadas.'
        });
        if(error) erros.push('reativar ' + p.aluno_id + ': ' + error.message); else reativados++;
      }
    }catch(e){ erros.push(String(e && e.message || e)); }
  }

  res.status(200).json({ ok: true, rodou_em: new Date().toISOString(), suspensos, reativados, erros });
}

module.exports = async function handler(req, res){
  try{ await run(req, res); }
  catch(err){
    const status = err && err.status ? err.status : 500;
    if(!res.headersSent) res.status(status).json({ error: (err && err.message) || String(err) });
  }
};
