/* ======================================================================
   DYSE · Função serverless (Vercel) — análise de Report Card por IA (Claude)
   ----------------------------------------------------------------------
   Recebe { aluno_id, materia_slug, semestre, aula_inicio, aula_fim },
   confirma que quem chama é gestão ou professor(a), junta o plano de cada
   aula do intervalo (referência da coordenação) + o que o professor lançou
   no Registro de Classe daquele aluno (avaliações por eixo + observações) +
   a frequência, e pede pro Claude escrever a análise de desenvolvimento do
   aluno no período (resumo geral, análise por eixo, pontos fortes/de
   desenvolvimento). A resposta volta pro navegador, que grava em
   report_cards.dados.analise_ia (via dyseGerarAnaliseReportCardIA).

   Variáveis de ambiente necessárias na Vercel (QA e produção):
     SUPABASE_SERVICE_ROLE_KEY  (já usada pelas outras funções)
     ANTHROPIC_API_KEY          (console.anthropic.com → API keys)

   maxDuration 60s: a chamada ao modelo pode levar 15-40s.
   ====================================================================== */

const { createClient } = require('@supabase/supabase-js');

// require preguiçoso: se o pacote não instalou no build, devolve erro JSON
// legível em vez de derrubar a função inteira com 500 genérico.
function loadAnthropic(){
  const pkg = require('@anthropic-ai/sdk');
  return pkg.Anthropic || pkg.default || pkg;
}

const SUPABASE_URL = "https://vnpjsjrqghttsagbssxx.supabase.co";
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
// Modelo configurável pela variável de ambiente REPORT_CARD_IA_MODEL
// (ex: "claude-haiku-4-5" pra testar mais rápido/barato). Padrão: Sonnet 5.
const MODEL = process.env.REPORT_CARD_IA_MODEL || 'claude-sonnet-5';

const AVAL_LABEL = { sim: 'foi bem', parcial: 'parcial', nao: 'não foi bem', nao_participou: 'não participou' };

async function handler(req, res){
  if(req.method !== 'POST'){ res.status(405).json({ error: 'Método não permitido.' }); return; }
  if(!SERVICE_ROLE_KEY){ res.status(500).json({ error: 'SUPABASE_SERVICE_ROLE_KEY não configurada.' }); return; }
  if(!process.env.ANTHROPIC_API_KEY){ res.status(500).json({ error: 'ANTHROPIC_API_KEY não configurada neste ambiente (Vercel → Settings → Environment Variables).' }); return; }

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

  const body = req.body || {};
  const alunoId = body.aluno_id;
  const materiaSlug = body.materia_slug;
  const semestre = body.semestre;
  const aulaInicio = Number(body.aula_inicio);
  const aulaFim = Number(body.aula_fim);
  if(!alunoId || !materiaSlug || !aulaInicio || !aulaFim){
    res.status(400).json({ error: 'Faltam parâmetros (aluno_id, materia_slug, aula_inicio, aula_fim).' });
    return;
  }

  try{
    const [aulasResp, materiaResp, alunoResp] = await Promise.all([
      admin.from('nivel_aulas').select('id, numero, topico, conteudo').eq('materia_slug', materiaSlug)
        .gte('numero', aulaInicio).lte('numero', aulaFim).order('numero', { ascending: true }),
      admin.from('materias').select('name, eixos_avaliacao, total_aulas').eq('slug', materiaSlug).maybeSingle(),
      admin.from('profiles').select('full_name').eq('id', alunoId).maybeSingle()
    ]);
    const aulas = aulasResp.data || [];
    if(!aulas.length){ res.status(400).json({ error: 'Nenhuma aula cadastrada nesse intervalo.' }); return; }

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

    // Cobertura: aulas do intervalo em que o aluno tem registro com participação.
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

    let anthropic;
    try{
      anthropic = new (loadAnthropic())();
    }catch(e){
      res.status(500).json({ error: 'Pacote @anthropic-ai/sdk não disponível no servidor (build da Vercel). Detalhe: ' + (e && e.message ? e.message : e) });
      return;
    }
    const listaEixos = eixos.length ? eixos.join(', ') : 'Reading, Writing, Speaking, Listening, Gramática';

    const system =
      'Você é coordenador(a) pedagógico(a) da DYSE, uma escola de inglês. Escreve a análise de desenvolvimento de um aluno para o Report Card do semestre, em português do Brasil, para a família e o próprio aluno lerem. ' +
      'Tom profissional, específico e construtivo — nada de elogio vazio nem jargão. Fundamente TUDO nos dados fornecidos (avaliações por eixo, observações do professor e o plano de cada aula). Não invente fatos, notas nem episódios que não estejam nos dados. ' +
      'Regra de cobertura: só ' + comRegistro + ' de ' + aulas.length + ' aulas do período (' + coberturaPct + '%) têm registro do aluno. Se a cobertura for baixa, diga explicitamente que a análise é parcial. ' +
      'Para cada eixo, cruze o desempenho registrado com o que o plano das aulas pedia: aponte onde o aluno correspondeu ao objetivo, onde ficou parcial e o que precisa de atenção. Um eixo em que o aluno "foi bem" em pelo menos 70% das aulas com registro é um ponto forte. ' +
      'Responda SOMENTE com um objeto JSON válido (sem texto fora dele, sem cercas de código), nesta forma exata:\n' +
      '{"resumo_geral": "2-4 frases sobre como foi o desenvolvimento geral no período", ' +
      '"por_eixo": [{"eixo": "<nome do eixo>", "texto": "2-4 frases cruzando registro x plano, dizendo onde foi bem / atenção"}], ' +
      '"pontos_fortes": "texto corrido", "pontos_desenvolvimento": "texto corrido", "recomendacoes": "1-3 frases de recomendação prática para o próximo período"}\n' +
      'O array "por_eixo" deve ter exatamente um item para cada um destes eixos, nesta ordem: ' + listaEixos + '.';

    const userMsg =
      'Aluno: ' + nomeAluno + '\n' +
      'Nível: ' + nomeNivel + ' · ' + semestre + 'º semestre · aulas ' + aulaInicio + ' a ' + aulaFim + ' (nível tem ' + totalAulasNivel + ' aulas no total)\n' +
      'Cobertura de registros: ' + comRegistro + '/' + aulas.length + ' aulas (' + coberturaPct + '%)\n\n' +
      'AULAS DO PERÍODO (plano da coordenação + registro do aluno):\n\n' + aulasTexto;

    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 8000,
      output_config: { effort: 'medium' },
      system: system,
      messages: [{ role: 'user', content: userMsg }]
    });

    const texto = (response.content || []).filter(b => b.type === 'text').map(b => b.text).join('').trim();
    let parsed;
    try{
      parsed = JSON.parse(texto.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim());
    }catch(e){
      res.status(502).json({ error: 'A IA respondeu num formato inesperado. Tente "Refazer análise".', raw: texto.slice(0, 500) });
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
  }catch(err){
    const msg = err && err.message ? err.message : String(err);
    res.status(500).json({ error: 'Erro ao gerar a análise: ' + msg });
  }
}

module.exports = handler;
module.exports.config = { maxDuration: 60 };
