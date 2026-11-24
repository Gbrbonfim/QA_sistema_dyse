/* DYSE · Atividades — catálogo por nível
   ------------------------------------------------------------------
   Fonte única do que existe: usada pela Área do Aluno (menu "Atividades"),
   pelo painel da professora (liberar por aluno) e pelas próprias páginas
   de atividade. O conteúdo de cada atividade SEMPRE segue o slide da aula
   correspondente (Google Slides do material).

   Chave do curso no banco: "ativ-<nivel>" (ex: "ativ-a1") — separada das
   atividades antigas do A1 ("a1"). Liberação: tabela
   aluno_atividades_liberadas (por aluno). */
window.DYSE_PRATICAS = {
  a1: {
    course: 'ativ-a1',
    nome: 'A1',
    aulas: [
      {
        aula: 1,
        titulo: 'Class 01 and 02 · The World of English',
        // PowerPoint que dura 2 aulas = 10 atividades: 5 por aula, uma por
        // habilidade (Escuta, Escrita, Leitura, Fala, Gramática). Mínimo 10 min cada.
        atividades: [
          { num: 1, parte: 'Class 01', titulo: 'More countries', tipo: 'Escute e escolha', treina: 'Escuta · Vocabulário', minutos: '10 - 12', questoes: 24 },
          { num: 2, parte: 'Class 01', titulo: 'Nice to meet you!', tipo: 'Monte a frase', treina: 'Escrita · Estrutura', minutos: '10 - 12', questoes: 20 },
          { num: 3, parte: 'Class 01', titulo: 'Emma and Lucas', tipo: 'Qual é a próxima fala?', treina: 'Leitura · Diálogo', minutos: '10 - 12', questoes: 20 },
          { num: 4, parte: 'Class 01', titulo: 'Say it right', tipo: 'Escute e grave', treina: 'Fala · Pronúncia', minutos: '12 - 15', questoes: 20, microfone: true },
          { num: 5, parte: 'Class 01', titulo: 'Verb to be', tipo: 'Make a Choice', treina: 'Gramática', minutos: '10 - 12', questoes: 24 },
          { num: 6, parte: 'Class 02', titulo: 'Famous people', tipo: 'Escute e escolha', treina: 'Escuta · Frases', minutos: '10 - 12', questoes: 24 },
          { num: 7, parte: 'Class 02', titulo: "He's, She's, They're", tipo: 'Monte a frase', treina: 'Escrita · Pronomes', minutos: '10 - 12', questoes: 20 },
          { num: 8, parte: 'Class 02', titulo: 'Role-Play', tipo: 'Qual é a próxima fala?', treina: 'Leitura · Diálogo', minutos: '10 - 12', questoes: 20 },
          { num: 9, parte: 'Class 02', titulo: 'Present a famous person', tipo: 'Escute e grave', treina: 'Fala · Apresentação', minutos: '12 - 15', questoes: 20, microfone: true },
          { num: 10, parte: 'Class 02', titulo: 'Subject pronouns', tipo: 'Make a Choice', treina: 'Gramática', minutos: '10 - 12', questoes: 24 }
        ]
      },
      {
        aula: 3,
        titulo: 'Class 03 · Guess the Country',
        // PowerPoint de 1 aula = 5 atividades (uma por habilidade).
        atividades: [
          { num: 1, titulo: 'Nationalities', tipo: 'Escute e escolha', treina: 'Escuta · Nacionalidades', minutos: '10 - 12', questoes: 24 },
          { num: 2, titulo: "I'm not, isn't, aren't", tipo: 'Monte a frase', treina: 'Escrita · Negativa', minutos: '10 - 12', questoes: 20 },
          { num: 3, titulo: 'Guess the country', tipo: 'Qual é a próxima fala?', treina: 'Leitura · Diálogo', minutos: '10 - 12', questoes: 20 },
          { num: 4, titulo: 'Say it right: nationalities', tipo: 'Escute e grave', treina: 'Fala · Sílaba tônica', minutos: '12 - 15', questoes: 20, microfone: true },
          { num: 5, titulo: 'Verb to be: negative', tipo: 'Make a Choice', treina: 'Gramática', minutos: '10 - 12', questoes: 24 }
        ]
      }
    ]
  }
};

/* Ordem dos materiais nas listas (painel da professora e Área do Aluno):
   Pre-A1, A1, A2, B1, B2, C1, C2; material extra sempre no fim, na mesma
   ordem entre si. Material extra = matéria com sem_registro no banco ou
   entrada do catálogo com `extra: true`. */
function dysePraticaOrdemNivel(slug){
  const s = String(slug || '').toLowerCase();
  if(/^pre/.test(s)) return 0;
  const i = ['a1', 'a2', 'b1', 'b2', 'c1', 'c2'].indexOf(s.slice(0, 2));
  return i >= 0 ? i + 1 : 50;
}
function dysePraticasOrdenar(slugs, ehExtra){
  const extra = s => !!((window.DYSE_PRATICAS[s] && window.DYSE_PRATICAS[s].extra) || (ehExtra && ehExtra(s)));
  return [...new Set(slugs)].sort((x, y) => (extra(x) - extra(y)) || (dysePraticaOrdemNivel(x) - dysePraticaOrdemNivel(y)) || String(x).localeCompare(String(y)));
}

function dysePraticaUrl(nivel, aula, num){
  return '/atividades/praticas/' + nivel + '/aula-' + String(aula).padStart(2, '0') + '/atividade_' + num + '.html';
}

/* Procura uma atividade pelo curso ("ativ-a1") + aula + número. */
function dysePraticaInfo(course, aula, num){
  for(const nivel in window.DYSE_PRATICAS){
    const n = window.DYSE_PRATICAS[nivel];
    if(n.course !== course) continue;
    const a = n.aulas.find(x => x.aula === aula);
    if(!a) return null;
    const at = a.atividades.find(x => x.num === num);
    return at ? { nivel: nivel, nivelNome: n.nome, aulaInfo: a, atividade: at } : null;
  }
  return null;
}

/* ---------- Pontuação DYSE ----------
   Critério próprio (não é o do Flexge):
   - Acerto de primeira ........ 10 pts por questão
   - Acerto na 2ª tentativa ....  5 pts (na fala: passou depois de errar
                                  ou usando a "Leitura")
   - Combo DYSE ................ +5 a cada 3 acertos de primeira seguidos
   - Atividade perfeita ........ +20 se acertar TODAS de primeira
   Errou as duas vezes / pulou = 0 naquela questão e o combo zera.
   É a soma desses pontos (meta.pontos) que alimenta o Ranking. */
const DYSE_PONTOS = { primeira: 10, segunda: 5, combo: 5, comboACada: 3, perfeita: 20 };

function dysePraticaPontosMax(questoes){
  const n = questoes || 10;
  return n * DYSE_PONTOS.primeira + Math.floor(n / DYSE_PONTOS.comboACada) * DYSE_PONTOS.combo + DYSE_PONTOS.perfeita;
}

/* Lista linear (na ordem do catálogo) das atividades de um nível — usada
   pra achar a PRÓXIMA atividade liberada depois de terminar uma. */
function dysePraticasEmOrdem(nivel){
  const n = window.DYSE_PRATICAS[nivel];
  if(!n) return [];
  return n.aulas.flatMap(a => a.atividades.map(at => ({ nivel: nivel, course: n.course, aula: a.aula, num: at.num, titulo: at.titulo })));
}