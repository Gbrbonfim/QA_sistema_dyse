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
        atividades: [
          { num: 1, titulo: 'Countries', tipo: 'Escute e escolha', treina: 'Escuta · Vocabulário', minutos: '4 - 6', questoes: 10 },
          { num: 2, titulo: 'Where are you from?', tipo: 'Monte a frase', treina: 'Escrita · Estrutura', minutos: '5 - 7', questoes: 10 },
          { num: 3, titulo: 'Ana and Tom', tipo: 'Qual é a próxima fala?', treina: 'Leitura · Diálogo', minutos: '5 - 7', questoes: 10 },
          { num: 4, titulo: 'Pronunciation', tipo: 'Escute e grave', treina: 'Fala · Pronúncia', minutos: '6 - 8', questoes: 10, microfone: true },
          { num: 5, titulo: 'Verb to be', tipo: 'Make a Choice', treina: 'Gramática', minutos: '4 - 6', questoes: 10 }
        ]
      }
    ]
  }
};

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