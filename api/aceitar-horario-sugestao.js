/* ======================================================================
   DYSE · Função serverless (Vercel) — professor aceita sugestão de troca
   de horário de turma
   ----------------------------------------------------------------------
   Mesma chave/configuração de api/create-student.js (SUPABASE_SERVICE_ROLE_KEY
   como variável de ambiente do servidor — nunca no navegador).

   Por que precisa disso: quando o PROFESSOR aceita uma sugestão da gestão
   (status 'pendente' → 'aceito'), o horário da turma de verdade precisa
   mudar (tabela "turmas") — mas a RLS de "turmas" só permite escrita pra
   admin/financeiro, não pro professor. Este endpoint confirma que quem
   está chamando é o próprio "teacher_id" da sugestão, e só então usa a
   service_role pra aplicar o novo dia/horário na turma e marcar a
   sugestão como aceita, numa tacada só.

   (A gestão aceitando uma CONTRAPROPOSTA do professor não passa por aqui —
   ela já é admin, tem permissão direta em "turmas" e "horario_sugestoes",
   ver dyseAceitarContraproposta em assets/dyse-auth.js.)
   ====================================================================== */

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "https://vnpjsjrqghttsagbssxx.supabase.co";
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

module.exports = async function handler(req, res){
  if(req.method !== 'POST'){
    res.status(405).json({ error: 'Método não permitido.' });
    return;
  }

  if(!SERVICE_ROLE_KEY){
    res.status(500).json({ error: 'SUPABASE_SERVICE_ROLE_KEY não configurada neste ambiente. Veja as instruções no topo de api/create-student.js.' });
    return;
  }

  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if(!token){
    res.status(401).json({ error: 'Não autenticado.' });
    return;
  }

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false }
  });

  const { data: userData, error: userError } = await admin.auth.getUser(token);
  if(userError || !userData || !userData.user){
    res.status(401).json({ error: 'Sessão inválida ou expirada.' });
    return;
  }

  const body = req.body || {};
  const sugestaoId = (body.sugestao_id || '').trim();
  if(!sugestaoId){
    res.status(400).json({ error: 'sugestao_id é obrigatório.' });
    return;
  }

  const { data: sugestao, error: sugestaoError } = await admin
    .from('horario_sugestoes')
    .select('*')
    .eq('id', sugestaoId)
    .maybeSingle();
  if(sugestaoError || !sugestao){
    res.status(404).json({ error: 'Sugestão não encontrada.' });
    return;
  }
  if(sugestao.teacher_id !== userData.user.id){
    res.status(403).json({ error: 'Essa sugestão não é sua.' });
    return;
  }
  if(sugestao.status !== 'pendente'){
    res.status(400).json({ error: 'Essa sugestão já foi respondida.' });
    return;
  }

  const { error: turmaError } = await admin.from('turmas').update({
    dias_semana: sugestao.dias_semana_sugerido,
    horario: sugestao.horario_sugerido
  }).eq('id', sugestao.turma_id);
  if(turmaError){
    res.status(400).json({ error: turmaError.message });
    return;
  }

  const { error: statusError } = await admin.from('horario_sugestoes').update({
    status: 'aceito', respondido_at: new Date().toISOString()
  }).eq('id', sugestaoId);
  if(statusError){
    res.status(400).json({ error: 'Turma atualizada, mas não foi possível marcar a sugestão como aceita: ' + statusError.message });
    return;
  }

  res.status(200).json({ ok: true });
};
