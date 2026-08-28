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

// Rede de segurança: a escola não quer travessão/hífen como pontuação no
// texto do aluno. Troca por vírgula e limpa a pontuação resultante.
function semTraco(s){
  return String(s == null ? '' : s)
    .replace(/\s*[—–]\s*/g, ', ')
    .replace(/(\S) - (\S)/g, '$1, $2')
    .replace(/\s+,/g, ',')
    .replace(/,\s*,+/g, ',')
    .replace(/,\s*([.!?])/g, '$1')
    .trim();
}

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

  const primeiroNome = String(nomeAluno).trim().split(/\s+/)[0] || '';
  const system =
    'Você escreve, em nome da DYSE (escola de inglês), o texto do Report Card de fim de semestre que o ALUNO e a família vão ler. Português do Brasil.\n\n' +
    '# REGRA OBRIGATÓRIA: FALE DIRETAMENTE COM O ALUNO\n' +
    'Todo o texto, do início ao fim, é escrito DIRETAMENTE PARA O ALUNO, em segunda pessoa ("você"). O aluno deve sentir que a DYSE está conversando com ele, não que está lendo uma ficha escrita sobre ele.\n' +
    'Use "nós" pela escola: "Percebemos que você...", "Notamos uma evolução...", "Durante nossas aulas, você...", "Vamos continuar trabalhando...", "Nosso próximo objetivo será...", "Queremos ajudar você a...", "Estamos felizes em acompanhar a sua evolução".\n' +
    'NUNCA escreva sobre o aluno em terceira pessoa. Proibido: "' + (primeiroNome || 'O aluno') + ' apresentou...", "a aluna demonstra...", "o aluno conseguiu...", "ele ainda precisa...". Se qualquer trecho falar SOBRE o aluno, reescreva para falar COM o aluno.\n' +
    (primeiroNome ? 'Pode chamar pelo primeiro nome (' + primeiroNome + ') no começo, com carinho.\n' : '') +
    '\n# TOM\n' +
    'Caloroso, de parceria e acompanhamento. Comece sempre reconhecendo algo concreto e verdadeiro que você viu de bom. Fale das dificuldades com acolhimento, sempre como "o que vamos desenvolver juntos no próximo semestre", nunca como falha, nota baixa ou veredito. Pode encerrar com uma frase de incentivo e o emoji 💙.\n\n' +
    '# PROIBIÇÕES\n' +
    '- NÃO use travessão nem hífen como pontuação (—, –, -). Ligue as ideias com vírgula, ponto e conectivos ("e", "mas", "porque", "por isso").\n' +
    '- NÃO use números, porcentagens, contagem de aulas ou de habilidades, nem termos técnicos de avaliação ("parcial", "PP", "P", "R", "cobertura", "amostras", "eixo", "critério"). Os dados abaixo são só pra você saber O QUE dizer, não para citar.\n' +
    '- NÃO invente qualidades, episódios ou notas que não estejam nos dados. Seja honesto e específico, sem esconder o que precisa melhorar.\n' +
    '- Pode citar conteúdos concretos de forma natural ("o som do TH", "o verbo to be", "se apresentar em inglês") quando ajudar o aluno a entender.\n\n' +
    '# FORMATO DA RESPOSTA\n' +
    'Responda SOMENTE com um objeto JSON válido (sem texto fora dele, sem cercas de código). Todos os campos falam COM o aluno, em "você", sem travessão/hífen:\n' +
    '{"resumo_geral": "2 a 4 parágrafos curtos, como uma carta da escola pra você: primeiro o que foi bem neste semestre, depois com acolhimento o que vamos desenvolver juntos, fechando com incentivo pro próximo semestre (pode usar 💙)", ' +
    '"por_eixo": [{"eixo": "<nome exato da habilidade>", "nivel": "forte" quando essa habilidade já é um ponto forte seu no período, ou "desenvolvimento" quando ainda é algo que vamos trabalhar juntos, "texto": "2 a 3 frases dirigidas a você sobre essa habilidade: o que você já faz bem e/ou qual vai ser o nosso próximo passo, de forma encorajadora"}], ' +
    '"pontos_fortes": "1 a 3 frases celebrando de forma específica o que você mais mandou bem", ' +
    '"pontos_desenvolvimento": "1 a 3 frases acolhedoras sobre o que vamos trabalhar juntos no próximo semestre", ' +
    '"recomendacoes": "1 a 2 frases de incentivo prático pra você no próximo semestre"}\n' +
    'O array "por_eixo" deve ter exatamente um item para cada uma destas habilidades, nesta ordem: ' + listaEixos + '.\n\n' +
    '# REVISÃO FINAL\n' +
    'Antes de responder, releia cada campo e confirme: "Estou conversando diretamente com este aluno, ou falando sobre ele?" e "Tem algum travessão ou hífen?". Corrija o que estiver fora dessas regras.';

  const userMsg =
    'Aluno: ' + nomeAluno + ' · ' + nomeNivel + ' · ' + semestre + 'º semestre\n\n' +
    'DADOS DO PERÍODO (uso interno, não cite números nem termos técnicos):\n' +
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
      resumo_geral: semTraco(parsed.resumo_geral),
      por_eixo: (Array.isArray(parsed.por_eixo) ? parsed.por_eixo : []).map(e => ({ eixo: e.eixo, nivel: (String(e.nivel || '').toLowerCase() === 'forte' ? 'forte' : 'desenvolvimento'), texto: semTraco(e.texto) })),
      pontos_fortes: semTraco(parsed.pontos_fortes),
      pontos_desenvolvimento: semTraco(parsed.pontos_desenvolvimento),
      recomendacoes: semTraco(parsed.recomendacoes)
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
