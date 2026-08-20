/* DYSE · A1 · Manifesto de atividades por aula
   Título de cada uma das 15 atividades por aula — não fica no banco porque
   é decisão de conteúdo/autoria, não dado transacional (mesmo raciocínio
   de DYSE_COURSE_META em dyse-auth.js). Usado por atividades/a1/index.html
   (aluno) e professora.html (accordion de gerenciar atividades) — fonte
   única, pra não duplicar a mesma lista nos dois lugares.
   Cresce conforme o conteúdo de cada aula é publicado; aulas sem entrada
   aqui aparecem como "em produção" nas duas telas. */
const AULAS_MANIFEST = {
  1: [
    { num:1, titulo:'Vocabulário — Países e Nacionalidades' },
    { num:2, titulo:'Complete o Diálogo de Apresentação' },
    { num:3, titulo:'Speaking — Linking' },
    { num:4, titulo:'Listening — Dois Novos Amigos' },
    { num:5, titulo:'Meu Cartão de Apresentação' },
    { num:6, titulo:'De Onde Você É?' },
    { num:7, titulo:'Estrutura — Qual Frase Está Certa?' },
    { num:8, titulo:'Monte a Pergunta' },
    { num:9, titulo:'Pronúncia — o som de "TH"' },
    { num:10, titulo:'Writing — Mensagem para um Novo Amigo' },
    { num:11, titulo:'Speaking — Grave sua Apresentação' },
    { num:12, titulo:'Leitura — Primeiro Dia de Aula' },
    { num:13, titulo:'Speaking — Ouça e Repita' },
    { num:14, titulo:'Revisão — Quiz Rápido' },
    { num:15, titulo:'Speaking — Sua Apresentação Completa' }
  ]
};

/* Aula 1 é flat em /atividades/a1/atividade_N.html (histórico); Aula 02 em
   diante mora em /atividades/a1/aula-NN/atividade_N.html. */
function dyseUrlAtividadeA1(numeroAula, num){
  return numeroAula === 1 ? '/atividades/a1/atividade_' + num + '.html' : '/atividades/a1/aula-' + String(numeroAula).padStart(2,'0') + '/atividade_' + num + '.html';
}
