/* ======================================================================
   DYSE · Função serverless (Vercel) — análise de Report Card por IA (Claude)
   ----------------------------------------------------------------------
   Recebe { aluno_id, materia_slug, semestre, aula_inicio, aula_fim },
   confirma que quem chama é gestão ou professor(a), junta o plano de cada
   aula do intervalo (referência da coordenação) + o que o professor lançou
   no Registro de Classe daquele aluno (avaliações por eixo + observações) +
   a frequência, e pede pro Claude escrever a análise de desenvolvimento do
   aluno no período. A resposta volta pro navegador, que grava em
   report_cards.dados.analise_ia (via dyseGerarAnaliseReportCardIA).

   Variáveis de ambiente necessárias na Vercel:
     SUPABASE_SERVICE_ROLE_KEY  (já usada pelas outras funções)
     ANTHROPIC_API_KEY          (console.anthropic.com → API keys)
     REPORT_CARD_IA_MODEL       (opcional; padrão claude-sonnet-5)
   ====================================================================== */

const SUPABASE_URL = "https://vnpjsjrqghttsagbssxx.supabase.co";
const MODEL = process.env.REPORT_CARD_IA_MODEL || 'claude-sonnet-5';
const AVAL_LABEL = { sim: 'foi bem', parcial: 'precisou de apoio', nao: 'teve dificuldade', nao_participou: 'não participou dessa parte' };

async function run(req, res){
  if(req.method !== 'POST'){ res.status(405).json({ error: 'Método não permitido.' }); return; }

  const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if(!SERVICE_ROLE_KEY){ res.status(500).json({ error: 'SUPABASE_SERVICE_ROLE_KEY não configurada na Vercel.' }); return; }
  if(!process.env.ANTHROPIC_API_KEY){ res.status(500).json({ error: 'ANTHROPIC_API_KEY não configurada na Vercel (Settings → Environment Variables → Redeploy).' }); return; }

  let createClient, Anthropic;
  try{
    createClient = require('@supabase/supabase-js').createClient;
  }catch(e){ res.status(500).json({ error: '@supabase/supabase-js não instalou no build: ' + (e && e.message || e) }); return; }
  try{
    const pkg = require('@anthropic-ai/sdk');
    Anthropic = pkg.Anthropic || pkg.default || pkg;
  }catch(e){ res.status(500).json({ error: '@anthropic-ai/sdk não instalou no build da Vercel: ' + (e && e.message || e) }); return; }

  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if(!token){ res.status(401).json({ error: 'Não autenticado.' }); return; }

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { auth: { autoRefreshToken: false, persistSession: false } });

  const { data: userData, error: userError } = await admin.auth.getUser(token);
  if(userError || !userData || !userData.user){ res.status(401).json({ error: 'Sessão inválida ou expirada.' }); return; }

  const { data: profile } = await admin.from('profiles').select('role').eq('id', userData.user.id).maybeSingle();
  const role = profile ? String(profile.role || '').trim().toLowerCase() : '';
  if(role !== 'admin' && role !== 'financeiro' && role !== 'teacher'){
    res.status(403).json({ error: 'Só gestão ou professor(a) pode gerar a análise.' });
    return;
  }

  let body = req.body || {};
  if(typeof body === 'string'){ try{ body = JSON.parse(body); }catch(e){ body = {}; } }
  const alunoId = body.aluno_id;
  const materiaSlug = body.materia_slug;
  const semestre = body.semestre;
  const aulaInicio = Number(body.aula_inicio);
  const aulaFim = Number(body.aula_fim);
  if(!alunoId || !materiaSlug || !aulaInicio || !aulaFim){
    res.status(400).json({ error: 'Faltam parâmetros (aluno_id, materia_slug, aula_inicio, aula_fim).' });
    return;
  }

  const [aulasResp, materiaResp, alunoResp] = await Promise.all([
    admin.from('nivel_aulas').select('id, numero, topico, conteudo').eq('materia_slug', materiaSlug)
      .gte('numero', aulaInicio).lte('numero', aulaFim).order('numero', { ascending: true }),
    admin.from('materias').select('name, eixos_avaliacao, total_aulas').eq('slug', materiaSlug).maybeSingle(),
    admin.from('profiles').select('full_name').eq('id', alunoId).maybeSingle()
  ]);
  if(aulasResp.error){ res.status(500).json({ error: 'Erro lendo nivel_aulas: ' + aulasResp.error.message }); return; }
  const aulas = aulasResp.data || [];
  if(!aulas.length){ res.status(400).json({ error: 'Nenhuma aula cadastrada no intervalo ' + aulaInicio + '-' + aulaFim + ' para "' + materiaSlug + '".' }); return; }

  const aulaIds = aulas.map(a => a.id);
  const { data: registros } = await admin.from('registros_classe')
    .select('nivel_aula_id, avaliacoes, observacoes')
    .eq('aluno_id', alunoId).in('nivel_aula_id', aulaIds);
  const regPorAula = {};
  (registros || []).forEach(r => { regPorAula[r.nivel_aula_id] = r; });

  const eixos = (materiaResp.data && materiaResp.data.eixos_avaliacao) || [];
  const nomeNivel = (materiaResp.data && materiaResp.data.name) || materiaSlug;
  const nomeAluno = (alunoResp.data && alunoResp.data.full_name) || 'o aluno';
  const totalAulasNivel = (materiaResp.data && materiaResp.data.total_aulas) || aulas.length;

  let comRegistro = 0;
  const aulasTexto = aulas.map(a => {
    const c = a.conteudo || {};
    const reg = regPorAula[a.id];
    const participou = reg && Object.values(reg.avaliacoes || {}).some(v => v && v !== 'nao_participou');
    if(participou) comRegistro++;
    const plano = [
      c.habilidades && c.habilidades.length ? 'Habilidades foco: ' + c.habilidades.join(', ') : null,
      c.tarefa_comunicativa ? 'Tarefa comunicativa: ' + c.tarefa_comunicativa : null,
      c.estrutura_gramatical ? 'Gramática: ' + c.estrutura_gramatical : null,
      c.foco_fonetico_som ? 'Foco fonético: ' + c.foco_fonetico_som : null,
      (c.pontos_atencao && c.pontos_atencao.length) ? 'Pontos de atenção do plano: ' + c.pontos_atencao.join(' | ') : null
    ].filter(Boolean).join('\n    ');
    let registroTexto;
    if(!reg){
      registroTexto = '(sem registro lançado para este aluno)';
    } else {
      const avals = Object.entries(reg.avaliacoes || {}).map(([eixo, v]) => eixo + ': ' + (AVAL_LABEL[v] || v)).join('; ');
      registroTexto = (avals || '(sem avaliação por eixo)') + (reg.observacoes ? '\n    Observações do professor: ' + reg.observacoes : '');
    }
    return 'Aula ' + a.numero + ' — ' + a.topico + '\n    ' + (plano || '(plano não detalhado)') + '\n    REGISTRO DO ALUNO: ' + registroTexto;
  }).join('\n\n');

  const coberturaPct = aulas.length ? Math.round((comRegistro / aulas.length) * 1000) / 10 : 0;
  const listaEixos = eixos.length ? eixos.join(', ') : 'Reading, Writing, Speaking, Listening, Gramática';

  const primeiroNome = String(nomeAluno).trim().split(/\s+/)[0] || 'você';
  const system =
    'Você é um(a) professor(a) da DYSE, escola de inglês, escrevendo o texto do Report Card de fim de semestre que o ALUNO e a família vão ler. Escreva em português do Brasil.\n\n' +
    'VOZ: fale DIRETAMENTE com o aluno, em segunda pessoa ("você"), pelo primeiro nome (' + primeiroNome + '). Tom caloroso, próximo e encorajador, como um professor que acompanhou de perto e torce por ele — não um relatório técnico.\n\n' +
    'REGRAS:\n' +
    '- Comece sempre reconhecendo algo concreto e verdadeiro que o aluno fez bem.\n' +
    '- Fale das dificuldades com acolhimento: enquadre como "o que a gente vai trabalhar / reforçar no próximo semestre", nunca como falha, nota baixa ou veredito. Mostre que faz parte do processo e que já dá pra ver esforço.\n' +
    '- NÃO use números, porcentagens, contagem de aulas ou de eixos, nem termos técnicos de avaliação ("parcial", "PP/P/R", "cobertura", "amostras", "eixo"). Os dados abaixo são só pra você saber O QUE dizer — não os cite.\n' +
    '- Seja honesto e específico: não esconda os pontos a melhorar e não invente qualidades sem base nos dados. Baseie tudo no que o professor registrou e no que as aulas trabalharam.\n' +
    '- Frases claras e diretas, sem jargão pedagógico. Pode citar naturalmente conteúdos concretos ("o som do TH", "o verbo to be", "se apresentar") quando ajudar o aluno a entender.\n\n' +
    'Responda SOMENTE com um objeto JSON válido (sem texto fora dele, sem cercas de código):\n' +
    '{"resumo_geral": "3-5 frases falando com o aluno sobre como foi o semestre dele — o que foi bem primeiro, depois o que vão reforçar, sempre motivando", ' +
    '"por_eixo": [{"eixo": "<nome exato do eixo>", "texto": "2-3 frases dirigidas ao aluno sobre essa habilidade — o que ele já faz bem e/ou o próximo passo, de forma encorajadora"}], ' +
    '"pontos_fortes": "1-3 frases celebrando de forma específica o que o aluno mais mandou bem", ' +
    '"pontos_desenvolvimento": "1-3 frases acolhedoras sobre o que vão trabalhar juntos no próximo semestre", ' +
    '"recomendacoes": "1-2 frases de incentivo prático pro aluno pro próximo semestre"}\n' +
    'O array "por_eixo" deve ter exatamente um item para cada um destes eixos, nesta ordem: ' + listaEixos + '.';

  const userMsg =
    'Aluno: ' + nomeAluno + ' · ' + nomeNivel + ' · ' + semestre + 'º semestre\n\n' +
    'DADOS DO PERÍODO (uso interno — não cite números nem termos técnicos):\n' +
    'Registros lançados pelo professor: ' + comRegistro + ' de ' + aulas.length + ' aulas do período.\n\n' +
    'Aula por aula (o que a aula trabalhou + como o aluno foi):\n\n' + aulasTexto;

  const anthropic = new Anthropic();
  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 8000,
    system: system,
    messages: [{ role: 'user', content: userMsg }]
  });

  if(response.stop_reason === 'refusal'){
    res.status(502).json({ error: 'O modelo recusou a solicitação. Tente novamente.' });
    return;
  }

  const texto = (response.content || []).filter(b => b.type === 'text').map(b => b.text).join('').trim();
  let parsed;
  try{
    parsed = JSON.parse(texto.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim());
  }catch(e){
    res.status(502).json({ error: 'A IA respondeu num formato inesperado. Tente de novo.', raw: texto.slice(0, 400) });
    return;
  }

  res.status(200).json({
    analise: {
      gerado_em: new Date().toISOString(),
      modelo: MODEL,
      cobertura: { aulas_com_registro: comRegistro, aulas_periodo: aulas.length, percentual: coberturaPct },
      resumo_geral: parsed.resumo_geral || '',
      por_eixo: Array.isArray(parsed.por_eixo) ? parsed.por_eixo : [],
      pontos_fortes: parsed.pontos_fortes || '',
      pontos_desenvolvimento: parsed.pontos_desenvolvimento || '',
      recomendacoes: parsed.recomendacoes || ''
    }
  });
}

async function handler(req, res){
  try{
    await run(req, res);
  }catch(err){
    const msg = err && err.message ? err.message : String(err);
    const stack = err && err.stack ? String(err.stack).split('\n').slice(1, 4).map(s => s.trim()).join(' | ') : '';
    if(!res.headersSent) res.status(500).json({ error: 'Falha na função report-card-ia: ' + msg, stack });
  }
}

module.exports = handler;
module.exports.config = { maxDuration: 60 };
