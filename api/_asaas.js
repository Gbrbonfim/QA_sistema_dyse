/* ======================================================================
   DYSE · Helper compartilhado das funções serverless do módulo Asaas
   ----------------------------------------------------------------------
   Não é uma rota (o prefixo "_" tira do roteamento da Vercel). Só reúne
   o que api/asaas-*.js repetem: cliente Supabase admin, checagem de
   sessão/papel, e as chamadas REST ao Asaas.

   Variáveis de ambiente (Vercel → Settings → Environment Variables):
     SUPABASE_SERVICE_ROLE_KEY  já usada pelas outras funções
     ASAAS_API_KEY              Asaas → Configurações → Integrações → API (produção)
     ASAAS_BASE_URL             opcional; padrão https://api.asaas.com/v3
     ASAAS_WEBHOOK_TOKEN        segredo do webhook (igual ao configurado no Asaas)
     CRON_SECRET                segredo do Cron Job da Vercel
   ====================================================================== */

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://vnpjsjrqghttsagbssxx.supabase.co';
const ASAAS_BASE = (process.env.ASAAS_BASE_URL || 'https://api.asaas.com/v3').replace(/\/+$/, '');

function adminClient(){
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if(!key) throw new HttpError(500, 'SUPABASE_SERVICE_ROLE_KEY não configurada na Vercel.');
  return createClient(SUPABASE_URL, key, { auth: { autoRefreshToken: false, persistSession: false } });
}

/* Erro com status HTTP — o handler externo converte em res.status().json(). */
class HttpError extends Error {
  constructor(status, message){ super(message); this.status = status; }
}

/* Lê o Bearer token do Supabase, confirma a sessão e devolve
   { user, role, profile }. Se exigirRole vier preenchido, 403 pra quem
   não estiver na lista. */
async function requireUser(req, admin, exigirRole){
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if(!token) throw new HttpError(401, 'Não autenticado.');

  const { data: userData, error } = await admin.auth.getUser(token);
  if(error || !userData || !userData.user) throw new HttpError(401, 'Sessão inválida ou expirada.');

  const { data: profile } = await admin.from('profiles').select('role').eq('id', userData.user.id).maybeSingle();
  const role = profile ? String(profile.role || '').trim().toLowerCase() : '';
  if(exigirRole && exigirRole.length && !exigirRole.includes(role)){
    throw new HttpError(403, 'Sem permissão para esta ação.');
  }
  return { user: userData.user, role, profile };
}

/* Chamada REST ao Asaas. Devolve o JSON já parseado; joga HttpError com a
   mensagem do Asaas quando o status não é 2xx. */
async function asaasFetch(path, opts){
  opts = opts || {};
  const key = process.env.ASAAS_API_KEY;
  if(!key) throw new HttpError(500, 'ASAAS_API_KEY não configurada na Vercel (Settings → Environment Variables → Redeploy).');

  const url = path.startsWith('http') ? path : ASAAS_BASE + path;
  let resp;
  try{
    resp = await fetch(url, {
      method: opts.method || 'GET',
      headers: {
        'access_token': key,
        'User-Agent': 'DYSE-Sistema',
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: opts.body != null ? JSON.stringify(opts.body) : undefined
    });
  }catch(err){
    throw new HttpError(502, 'Erro de conexão com o Asaas: ' + (err && err.message || err));
  }

  const texto = await resp.text();
  let json = null;
  try{ json = texto ? JSON.parse(texto) : null; }catch(e){ /* Asaas às vezes devolve HTML em erro de infra */ }

  if(!resp.ok){
    const msg = (json && Array.isArray(json.errors) && json.errors.length)
      ? json.errors.map(e => e.description || e.code).join(' | ')
      : ('Asaas respondeu ' + resp.status + (texto ? (': ' + texto.slice(0, 200)) : ''));
    throw new HttpError(resp.status === 401 ? 500 : 502, 'Asaas: ' + msg);
  }
  return json;
}

/* GET paginado — junta todas as páginas (limit 100) de um endpoint de
   listagem do Asaas ({ data: [...], hasMore, ... }). */
async function asaasGetAll(path, maxPaginas){
  const juntou = [];
  const sep = path.includes('?') ? '&' : '?';
  let offset = 0;
  const limite = 100;
  const teto = maxPaginas || 100;
  for(let i = 0; i < teto; i++){
    const page = await asaasFetch(path + sep + 'limit=' + limite + '&offset=' + offset);
    const linhas = (page && page.data) || [];
    juntou.push(...linhas);
    if(!page || !page.hasMore || !linhas.length) break;
    offset += limite;
  }
  return juntou;
}

function soDigitos(s){ return String(s == null ? '' : s).replace(/\D+/g, ''); }

/* Normaliza uma cobrança do Asaas pro formato da tabela asaas_cobrancas.
   pixPayload/bankSlipUrl vêm de chamadas extras (nem todo payload traz). */
function mapCobranca(p, extra){
  extra = extra || {};
  return {
    id: p.id,
    asaas_customer_id: p.customer || null,
    subscription_id: p.subscription || null,
    valor: p.value != null ? Number(p.value) : null,
    valor_liquido: p.netValue != null ? Number(p.netValue) : null,
    status: p.status || null,
    billing_type: p.billingType || null,
    vencimento: p.dueDate || null,
    pago_em: p.paymentDate || p.clientPaymentDate || null,
    invoice_url: p.invoiceUrl || null,
    bank_slip_url: p.bankSlipUrl || extra.bankSlipUrl || null,
    pix_payload: extra.pixPayload || null,
    descricao: p.description || null,
    raw: p
  };
}

function mapAssinatura(s){
  return {
    id: s.id,
    asaas_customer_id: s.customer || null,
    valor: s.value != null ? Number(s.value) : null,
    ciclo: s.cycle || null,
    status: s.status || null,
    proximo_vencimento: s.nextDueDate || null,
    descricao: s.description || null,
    raw: s
  };
}

module.exports = {
  SUPABASE_URL,
  ASAAS_BASE,
  HttpError,
  adminClient,
  requireUser,
  asaasFetch,
  asaasGetAll,
  soDigitos,
  mapCobranca,
  mapAssinatura
};
