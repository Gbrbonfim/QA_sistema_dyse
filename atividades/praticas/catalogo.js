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
      },
      {
        aula: 4,
        titulo: 'Class 04 · Changing Nationalities?',
        atividades: [
          { num: 1, titulo: 'Where are they from?', tipo: 'Escute e escolha', treina: 'Escuta · Nacionalidades', minutos: '10 - 12', questoes: 24 },
          { num: 2, titulo: 'Is he Greek?', tipo: 'Monte a frase', treina: 'Escrita · Perguntas', minutos: '10 - 12', questoes: 20 },
          { num: 3, titulo: 'Guess the nationality', tipo: 'Qual é a próxima fala?', treina: 'Leitura · Diálogo', minutos: '10 - 12', questoes: 20 },
          { num: 4, titulo: 'Ask and answer', tipo: 'Escute e grave', treina: 'Fala · Perguntas', minutos: '12 - 15', questoes: 20, microfone: true },
          { num: 5, titulo: 'Am, Is or Are?', tipo: 'Make a Choice', treina: 'Gramática', minutos: '10 - 12', questoes: 24 }
        ]
      },
      {
        aula: 5,
        titulo: 'Class 05 · Greetings From Around the World',
        atividades: [
          { num: 1, titulo: 'Greetings around the world', tipo: 'Escute e escolha', treina: 'Escuta · Cumprimentos', minutos: '10 - 12', questoes: 24 },
          { num: 2, titulo: 'Negative and question', tipo: 'Monte a frase', treina: 'Escrita · To be', minutos: '10 - 12', questoes: 20 },
          { num: 3, titulo: 'Kiss or handshake?', tipo: 'Qual é a próxima fala?', treina: 'Leitura · Diálogo', minutos: '10 - 12', questoes: 20 },
          { num: 4, titulo: 'Say it right: greetings', tipo: 'Escute e grave', treina: 'Fala · Vocabulário', minutos: '12 - 15', questoes: 20, microfone: true },
          { num: 5, titulo: 'Verb to be: review', tipo: 'Make a Choice', treina: 'Gramática', minutos: '10 - 12', questoes: 24 }
        ]
      },
      {
        aula: 6,
        titulo: 'Class 06 · In a Hotel',
        atividades: [
          { num: 1, titulo: 'In the hotel', tipo: 'Escute e escolha', treina: 'Escuta · Vocabulário', minutos: '10 - 12', questoes: 24 },
          { num: 2, titulo: 'Check-in questions', tipo: 'Monte a frase', treina: 'Escrita · Perguntas', minutos: '10 - 12', questoes: 20 },
          { num: 3, titulo: 'Hotel check-in', tipo: 'Qual é a próxima fala?', treina: 'Leitura · Diálogo', minutos: '10 - 12', questoes: 20 },
          { num: 4, titulo: 'Say it right: at the hotel', tipo: 'Escute e grave', treina: 'Fala · Vocabulário', minutos: '12 - 15', questoes: 20, microfone: true },
          { num: 5, titulo: 'Numbers, spelling and questions', tipo: 'Make a Choice', treina: 'Vocabulário · Estruturas', minutos: '10 - 12', questoes: 24 }
        ]
      },
      {
        aula: 7,
        titulo: "Class 07 · What's in my Travel Bag",
        atividades: [
          { num: 1, titulo: "What's in the bag?", tipo: 'Escute e escolha', treina: 'Escuta · Vocabulário', minutos: '10 - 12', questoes: 24 },
          { num: 2, titulo: 'A or an?', tipo: 'Monte a frase', treina: 'Escrita · Artigos', minutos: '10 - 12', questoes: 20 },
          { num: 3, titulo: 'Where are my glasses?', tipo: 'Qual é a próxima fala?', treina: 'Leitura · Diálogo', minutos: '10 - 12', questoes: 20 },
          { num: 4, titulo: 'In my bag', tipo: 'Escute e grave', treina: 'Fala · Vocabulário', minutos: '12 - 15', questoes: 20, microfone: true },
          { num: 5, titulo: 'A, an or nothing?', tipo: 'Make a Choice', treina: 'Gramática', minutos: '10 - 12', questoes: 24 }
        ]
      },
      {
        aula: 8,
        titulo: 'Class 08 · Is it cheap or expensive?',
        atividades: [
          { num: 1, titulo: 'Numbers and prices', tipo: 'Escute e escolha', treina: 'Escuta · Números', minutos: '10 - 12', questoes: 24 },
          { num: 2, titulo: 'How much is it?', tipo: 'Monte a frase', treina: 'Escrita · Preços', minutos: '10 - 12', questoes: 20 },
          { num: 3, titulo: 'At the market', tipo: 'Qual é a próxima fala?', treina: 'Leitura · Diálogo', minutos: '10 - 12', questoes: 20 },
          { num: 4, titulo: 'Say the price', tipo: 'Escute e grave', treina: 'Fala · Números', minutos: '12 - 15', questoes: 20, microfone: true },
          { num: 5, titulo: 'Plurals and prices', tipo: 'Make a Choice', treina: 'Gramática', minutos: '10 - 12', questoes: 24 }
        ]
      },
      {
        aula: 9,
        titulo: "Class 09 · What's your Favorite?",
        atividades: [
          { num: 1, titulo: 'His or her?', tipo: 'Escute e escolha', treina: 'Escuta · Possessivos', minutos: '10 - 12', questoes: 24 },
          { num: 2, titulo: 'My, his, her, their', tipo: 'Monte a frase', treina: 'Escrita · Possessivos', minutos: '10 - 12', questoes: 20 },
          { num: 3, titulo: 'Our favorite things', tipo: 'Qual é a próxima fala?', treina: 'Leitura · Diálogo', minutos: '10 - 12', questoes: 20 },
          { num: 4, titulo: 'Present your favorites', tipo: 'Escute e grave', treina: 'Fala · Apresentação', minutos: '12 - 15', questoes: 20, microfone: true },
          { num: 5, titulo: 'Possessive adjectives', tipo: 'Make a Choice', treina: 'Gramática', minutos: '10 - 12', questoes: 24 }
        ]
      },
      {
        aula: 10,
        titulo: 'Class 10 · Famous Families 1',
        atividades: [
          { num: 1, titulo: 'Family words', tipo: 'Escute e escolha', treina: 'Escuta · Família', minutos: '10 - 12', questoes: 24 },
          { num: 2, titulo: "Kate is William's wife", tipo: 'Monte a frase', treina: "Escrita · Genitivo 's", minutos: '10 - 12', questoes: 20 },
          { num: 3, titulo: 'Who is she?', tipo: 'Qual é a próxima fala?', treina: 'Leitura · Diálogo', minutos: '10 - 12', questoes: 20 },
          { num: 4, titulo: 'Talk about a family', tipo: 'Escute e grave', treina: 'Fala · Família', minutos: '12 - 15', questoes: 20, microfone: true },
          { num: 5, titulo: "Family and 's", tipo: 'Make a Choice', treina: 'Gramática', minutos: '10 - 12', questoes: 24 }
        ]
      },
      {
        aula: 11,
        titulo: 'Class 11 · Dog Lovers',
        atividades: [
          { num: 1, titulo: 'Big, fast, smart', tipo: 'Escute e escolha', treina: 'Escuta · Adjetivos', minutos: '10 - 12', questoes: 24 },
          { num: 2, titulo: 'Adjective + noun', tipo: 'Monte a frase', treina: 'Escrita · Adjetivos', minutos: '10 - 12', questoes: 20 },
          { num: 3, titulo: 'Happy Dogs', tipo: 'Qual é a próxima fala?', treina: 'Leitura · Diálogo', minutos: '10 - 12', questoes: 20 },
          { num: 4, titulo: 'Describe a dog', tipo: 'Escute e grave', treina: 'Fala · Descrição', minutos: '12 - 15', questoes: 20, microfone: true },
          { num: 5, titulo: 'Adjectives', tipo: 'Make a Choice', treina: 'Gramática', minutos: '10 - 12', questoes: 24 }
        ]
      },
      {
        aula: 12,
        titulo: 'Class 12 · Breakfast, lunch and dinner',
        atividades: [
          { num: 1, titulo: 'Food and meals', tipo: 'Escute e escolha', treina: 'Escuta · Comida', minutos: '10 - 12', questoes: 24 },
          { num: 2, titulo: 'I have, she has', tipo: 'Monte a frase', treina: 'Escrita · Have / has', minutos: '10 - 12', questoes: 20 },
          { num: 3, titulo: 'My week menu', tipo: 'Qual é a próxima fala?', treina: 'Leitura · Diálogo', minutos: '10 - 12', questoes: 20 },
          { num: 4, titulo: 'What do you have?', tipo: 'Escute e grave', treina: 'Fala · Refeições', minutos: '12 - 15', questoes: 20, microfone: true },
          { num: 5, titulo: 'Have or has?', tipo: 'Make a Choice', treina: 'Gramática', minutos: '10 - 12', questoes: 24 }
        ]
      },
      {
        aula: 13,
        titulo: 'Class 13 and 14 · Morning People',
        atividades: [
          { num: 1, parte: 'Class 13', titulo: 'Daily routine', tipo: 'Escute e escolha', treina: 'Escuta · Rotina', minutos: '10 - 12', questoes: 24 },
          { num: 2, parte: 'Class 13', titulo: 'She gets up', tipo: 'Monte a frase', treina: 'Escrita · Present simple', minutos: '10 - 12', questoes: 20 },
          { num: 3, parte: 'Class 13', titulo: 'Are you a morning person?', tipo: 'Qual é a próxima fala?', treina: 'Leitura · Diálogo', minutos: '10 - 12', questoes: 20 },
          { num: 4, parte: 'Class 13', titulo: 'My routine', tipo: 'Escute e grave', treina: 'Fala · Rotina', minutos: '12 - 15', questoes: 20, microfone: true },
          { num: 5, parte: 'Class 13', titulo: 'Present simple: he, she, it', tipo: 'Make a Choice', treina: 'Gramática', minutos: '10 - 12', questoes: 24 },
          { num: 6, parte: 'Class 14', titulo: 'What time is it?', tipo: 'Escute e escolha', treina: 'Escuta · Horas', minutos: '10 - 12', questoes: 24 },
          { num: 7, parte: 'Class 14', titulo: 'Half past, quarter to', tipo: 'Monte a frase', treina: 'Escrita · Horas', minutos: '10 - 12', questoes: 20 },
          { num: 8, parte: 'Class 14', titulo: 'What time do you get up?', tipo: 'Qual é a próxima fala?', treina: 'Leitura · Diálogo', minutos: '10 - 12', questoes: 20 },
          { num: 9, parte: 'Class 14', titulo: 'Say the time', tipo: 'Escute e grave', treina: 'Fala · Horas', minutos: '12 - 15', questoes: 20, microfone: true },
          { num: 10, parte: 'Class 14', titulo: 'Telling the time', tipo: 'Make a Choice', treina: 'Gramática', minutos: '10 - 12', questoes: 24 }
        ]
      },
      {
        aula: 15,
        titulo: 'Class 15 · Review Classes 1-14',
        atividades: [
          { num: 1, titulo: 'Questions and answers', tipo: 'Escute e escolha', treina: 'Escuta · Revisão', minutos: '10 - 12', questoes: 24 },
          { num: 2, titulo: 'Ask the right question', tipo: 'Monte a frase', treina: 'Escrita · Revisão', minutos: '10 - 12', questoes: 20 },
          { num: 3, titulo: 'A new student', tipo: 'Qual é a próxima fala?', treina: 'Leitura · Diálogo', minutos: '10 - 12', questoes: 20 },
          { num: 4, titulo: 'Talk about you', tipo: 'Escute e grave', treina: 'Fala · Revisão', minutos: '12 - 15', questoes: 20, microfone: true },
          { num: 5, titulo: 'Review: grammar', tipo: 'Make a Choice', treina: 'Gramática', minutos: '10 - 12', questoes: 24 }
        ]
      },
      {
        aula: 16,
        titulo: 'Class 16 and 17 · How Often Do You Use Your Phone?',
        atividades: [
          { num: 1, parte: 'Class 16', titulo: 'Always or never?', tipo: 'Escute e escolha', treina: 'Escuta · Frequência', minutos: '10 - 12', questoes: 24 },
          { num: 2, parte: 'Class 16', titulo: 'Where does the adverb go?', tipo: 'Monte a frase', treina: 'Escrita · Advérbios', minutos: '10 - 12', questoes: 20 },
          { num: 3, parte: 'Class 16', titulo: 'My phone and me', tipo: 'Qual é a próxima fala?', treina: 'Leitura · Diálogo', minutos: '10 - 12', questoes: 20 },
          { num: 4, parte: 'Class 16', titulo: 'How often?', tipo: 'Escute e grave', treina: 'Fala · Frequência', minutos: '12 - 15', questoes: 20, microfone: true },
          { num: 5, parte: 'Class 16', titulo: 'Adverbs of frequency', tipo: 'Make a Choice', treina: 'Gramática', minutos: '10 - 12', questoes: 24 },
          { num: 6, parte: 'Class 17', titulo: 'Yes, I do!', tipo: 'Escute e escolha', treina: 'Escuta · Respostas curtas', minutos: '10 - 12', questoes: 24 },
          { num: 7, parte: 'Class 17', titulo: 'Do or does?', tipo: 'Monte a frase', treina: 'Escrita · Perguntas', minutos: '10 - 12', questoes: 20 },
          { num: 8, parte: 'Class 17', titulo: 'Phone interview', tipo: 'Qual é a próxima fala?', treina: 'Leitura · Entrevista', minutos: '10 - 12', questoes: 20 },
          { num: 9, parte: 'Class 17', titulo: 'Ask and answer', tipo: 'Escute e grave', treina: 'Fala · Perguntas', minutos: '12 - 15', questoes: 20, microfone: true },
          { num: 10, parte: 'Class 17', titulo: 'Questions with do / does', tipo: 'Make a Choice', treina: 'Gramática', minutos: '10 - 12', questoes: 24 }
        ]
      },
      {
        aula: 18,
        titulo: 'Class 18 · A Day in the Life',
        atividades: [
          { num: 1, titulo: 'Jobs', tipo: 'Escute e escolha', treina: 'Escuta · Profissões', minutos: '10 - 12', questoes: 24 },
          { num: 2, titulo: "He doesn't work on Fridays", tipo: 'Monte a frase', treina: 'Escrita · Present simple', minutos: '10 - 12', questoes: 20 },
          { num: 3, titulo: "What's your job?", tipo: 'Qual é a próxima fala?', treina: 'Leitura · Entrevista', minutos: '10 - 12', questoes: 20 },
          { num: 4, titulo: 'Talk about jobs', tipo: 'Escute e grave', treina: 'Fala · Profissões', minutos: '12 - 15', questoes: 20, microfone: true },
          { num: 5, titulo: 'Present simple: all forms', tipo: 'Make a Choice', treina: 'Gramática', minutos: '10 - 12', questoes: 24 }
        ]
      },
      {
        aula: 19,
        titulo: 'Class 19 and 20 · Starting a New Hobby',
        atividades: [
          { num: 1, parte: 'Class 19', titulo: 'Hobbies', tipo: 'Escute e escolha', treina: 'Escuta · Hobbies', minutos: '10 - 12', questoes: 24 },
          { num: 2, parte: 'Class 19', titulo: "I think it's fun", tipo: 'Monte a frase', treina: 'Escrita · Opiniões', minutos: '10 - 12', questoes: 20 },
          { num: 3, parte: 'Class 19', titulo: 'A new hobby', tipo: 'Qual é a próxima fala?', treina: 'Leitura · Diálogo', minutos: '10 - 12', questoes: 20 },
          { num: 4, parte: 'Class 19', titulo: 'My favorite hobby', tipo: 'Escute e grave', treina: 'Fala · Opiniões', minutos: '12 - 15', questoes: 20, microfone: true },
          { num: 5, parte: 'Class 19', titulo: 'Like, want and think', tipo: 'Make a Choice', treina: 'Gramática', minutos: '10 - 12', questoes: 24 },
          { num: 6, parte: 'Class 20', titulo: 'Is it or does it?', tipo: 'Escute e escolha', treina: 'Escuta · Perguntas', minutos: '10 - 12', questoes: 24 },
          { num: 7, parte: 'Class 20', titulo: 'Make the question', tipo: 'Monte a frase', treina: 'Escrita · Perguntas', minutos: '10 - 12', questoes: 20 },
          { num: 8, parte: 'Class 20', titulo: 'Interview a partner', tipo: 'Qual é a próxima fala?', treina: 'Leitura · Entrevista', minutos: '10 - 12', questoes: 20 },
          { num: 9, parte: 'Class 20', titulo: 'Ask me anything', tipo: 'Escute e grave', treina: 'Fala · Perguntas', minutos: '12 - 15', questoes: 20, microfone: true },
          { num: 10, parte: 'Class 20', titulo: 'Be or do?', tipo: 'Make a Choice', treina: 'Gramática', minutos: '10 - 12', questoes: 24 }
        ]
      },
      {
        aula: 21,
        titulo: 'Class 21 · Breakfast sandwich',
        atividades: [
          { num: 1, titulo: 'Breakfast and instructions', tipo: 'Escute e escolha', treina: 'Escuta · Imperativo', minutos: '10 - 12', questoes: 24 },
          { num: 2, titulo: "Cook, add, don't...", tipo: 'Monte a frase', treina: 'Escrita · Imperativo', minutos: '10 - 12', questoes: 20 },
          { num: 3, titulo: 'Help, Mom!', tipo: 'Qual é a próxima fala?', treina: 'Leitura · Receita', minutos: '10 - 12', questoes: 20 },
          { num: 4, titulo: 'Give instructions', tipo: 'Escute e grave', treina: 'Fala · Instruções', minutos: '12 - 15', questoes: 20, microfone: true },
          { num: 5, titulo: 'Imperatives', tipo: 'Make a Choice', treina: 'Gramática', minutos: '10 - 12', questoes: 24 }
        ]
      },
      {
        aula: 22,
        titulo: 'Class 22 · Drama? I like it.',
        atividades: [
          { num: 1, titulo: 'Films and pronouns', tipo: 'Escute e escolha', treina: 'Escuta · Filmes', minutos: '10 - 12', questoes: 24 },
          { num: 2, titulo: 'I love her!', tipo: 'Monte a frase', treina: 'Escrita · Object pronouns', minutos: '10 - 12', questoes: 20 },
          { num: 3, titulo: 'Movie night', tipo: 'Qual é a próxima fala?', treina: 'Leitura · Diálogo', minutos: '10 - 12', questoes: 20 },
          { num: 4, titulo: 'What do you think of...?', tipo: 'Escute e grave', treina: 'Fala · Opiniões', minutos: '12 - 15', questoes: 20, microfone: true },
          { num: 5, titulo: 'Object pronouns', tipo: 'Make a Choice', treina: 'Gramática', minutos: '10 - 12', questoes: 24 }
        ]
      },
      {
        aula: 23,
        titulo: 'Class 23 · Friends in a Restaurant',
        atividades: [
          { num: 1, titulo: "What's on the menu?", tipo: 'Escute e escolha', treina: 'Escuta · Cardápio', minutos: '10 - 12', questoes: 24 },
          { num: 2, titulo: "I'll have the pasta", tipo: 'Monte a frase', treina: 'Escrita · Pedidos', minutos: '10 - 12', questoes: 20 },
          { num: 3, titulo: 'Are you ready to order?', tipo: 'Qual é a próxima fala?', treina: 'Leitura · Restaurante', minutos: '10 - 12', questoes: 20 },
          { num: 4, titulo: 'Order your food', tipo: 'Escute e grave', treina: 'Fala · Pedidos', minutos: '12 - 15', questoes: 20, microfone: true },
          { num: 5, titulo: 'Ordering food', tipo: 'Make a Choice', treina: 'Gramática · Funcional', minutos: '10 - 12', questoes: 24 }
        ]
      },
      {
        aula: 24,
        titulo: 'Class 24 · Sports and Workout',
        atividades: [
          { num: 1, titulo: "Can or can't?", tipo: 'Escute e escolha', treina: 'Escuta · Can', minutos: '10 - 12', questoes: 24 },
          { num: 2, titulo: 'She can run very fast', tipo: 'Monte a frase', treina: 'Escrita · Can', minutos: '10 - 12', questoes: 20 },
          { num: 3, titulo: 'How sporty are you?', tipo: 'Qual é a próxima fala?', treina: 'Leitura · Entrevista', minutos: '10 - 12', questoes: 20 },
          { num: 4, titulo: "I can, I can't", tipo: 'Escute e grave', treina: 'Fala · Can forte e fraco', minutos: '12 - 15', questoes: 20, microfone: true },
          { num: 5, titulo: 'Can for ability', tipo: 'Make a Choice', treina: 'Gramática', minutos: '10 - 12', questoes: 24 }
        ]
      },
      {
        aula: 25,
        titulo: 'Class 25 · Know Your Coffee',
        atividades: [
          { num: 1, titulo: 'Coffee words', tipo: 'Escute e escolha', treina: 'Escuta · Vocabulário', minutos: '10 - 12', questoes: 24 },
          { num: 2, titulo: 'Can I have a latte?', tipo: 'Monte a frase', treina: 'Escrita · Pedidos', minutos: '10 - 12', questoes: 20 },
          { num: 3, titulo: 'At the coffee shop', tipo: 'Qual é a próxima fala?', treina: 'Leitura · Diálogo', minutos: '10 - 12', questoes: 20 },
          { num: 4, titulo: 'Order a coffee', tipo: 'Escute e grave', treina: 'Fala · Pedidos', minutos: '12 - 15', questoes: 20, microfone: true },
          { num: 5, titulo: 'Polite requests', tipo: 'Make a Choice', treina: 'Gramática', minutos: '10 - 12', questoes: 24 }
        ]
      },
      {
        aula: 26,
        titulo: 'Class 26 · What Can I do Here?',
        atividades: [
          { num: 1, titulo: 'Signs and rules', tipo: 'Escute e escolha', treina: 'Escuta · Regras', minutos: '10 - 12', questoes: 24 },
          { num: 2, titulo: "You can't talk loudly", tipo: 'Monte a frase', treina: 'Escrita · Permissão', minutos: '10 - 12', questoes: 20 },
          { num: 3, titulo: 'First day at school', tipo: 'Qual é a próxima fala?', treina: 'Leitura · Diálogo', minutos: '10 - 12', questoes: 20 },
          { num: 4, titulo: 'Can we...?', tipo: 'Escute e grave', treina: 'Fala · Permissão', minutos: '12 - 15', questoes: 20, microfone: true },
          { num: 5, titulo: 'Three uses of can', tipo: 'Make a Choice', treina: 'Gramática', minutos: '10 - 12', questoes: 24 }
        ]
      },
      {
        aula: 27,
        titulo: 'Class 27 · What Are You Wearing Today?',
        atividades: [
          { num: 1, titulo: 'Clothes', tipo: 'Escute e escolha', treina: 'Escuta · Roupas', minutos: '10 - 12', questoes: 24 },
          { num: 2, titulo: "I'm wearing a jacket", tipo: 'Monte a frase', treina: 'Escrita · Present continuous', minutos: '10 - 12', questoes: 20 },
          { num: 3, titulo: 'What are you wearing?', tipo: 'Qual é a próxima fala?', treina: 'Leitura · Diálogo', minutos: '10 - 12', questoes: 20 },
          { num: 4, titulo: "Say what you're wearing", tipo: 'Escute e grave', treina: 'Fala · Roupas', minutos: '12 - 15', questoes: 20, microfone: true },
          { num: 5, titulo: 'Present continuous', tipo: 'Make a Choice', treina: 'Gramática', minutos: '10 - 12', questoes: 24 }
        ]
      },
      {
        aula: 28,
        titulo: 'Class 28 · Surviving the Weather!',
        atividades: [
          { num: 1, titulo: "What's the weather like?", tipo: 'Escute e escolha', treina: 'Escuta · Tempo', minutos: '10 - 12', questoes: 24 },
          { num: 2, titulo: 'Is it raining?', tipo: 'Monte a frase', treina: 'Escrita · Present continuous', minutos: '10 - 12', questoes: 20 },
          { num: 3, titulo: 'Weather call', tipo: 'Qual é a próxima fala?', treina: 'Leitura · Diálogo', minutos: '10 - 12', questoes: 20 },
          { num: 4, titulo: 'Talk about the weather', tipo: 'Escute e grave', treina: 'Fala · Tempo', minutos: '12 - 15', questoes: 20, microfone: true },
          { num: 5, titulo: 'Present continuous: all forms', tipo: 'Make a Choice', treina: 'Gramática', minutos: '10 - 12', questoes: 24 }
        ]
      },
      {
        aula: 29,
        titulo: "Class 29 · It's Raining!",
        atividades: [
          { num: 1, titulo: 'Usually or now?', tipo: 'Escute e escolha', treina: 'Escuta · Lugares', minutos: '10 - 12', questoes: 24 },
          { num: 2, titulo: "It rains or it's raining?", tipo: 'Monte a frase', treina: 'Escrita · Simple x continuous', minutos: '10 - 12', questoes: 20 },
          { num: 3, titulo: 'A rainy Saturday', tipo: 'Qual é a próxima fala?', treina: 'Leitura · Diálogo', minutos: '10 - 12', questoes: 20 },
          { num: 4, titulo: 'Every day or today?', tipo: 'Escute e grave', treina: 'Fala · Simple x continuous', minutos: '12 - 15', questoes: 20, microfone: true },
          { num: 5, titulo: 'Simple or continuous?', tipo: 'Make a Choice', treina: 'Gramática', minutos: '10 - 12', questoes: 24 }
        ]
      },
      {
        aula: 30,
        titulo: 'Class 30 · Review Classes 16-29',
        atividades: [
          { num: 1, titulo: 'Review: listen and answer', tipo: 'Escute e escolha', treina: 'Escuta · Revisão', minutos: '10 - 12', questoes: 24 },
          { num: 2, titulo: 'Review: build the sentence', tipo: 'Monte a frase', treina: 'Escrita · Revisão', minutos: '10 - 12', questoes: 20 },
          { num: 3, titulo: 'Review: a day with Nina', tipo: 'Qual é a próxima fala?', treina: 'Leitura · Entrevista', minutos: '10 - 12', questoes: 20 },
          { num: 4, titulo: 'Review: speak', tipo: 'Escute e grave', treina: 'Fala · Revisão', minutos: '12 - 15', questoes: 20, microfone: true },
          { num: 5, titulo: 'Review: grammar', tipo: 'Make a Choice', treina: 'Gramática', minutos: '10 - 12', questoes: 24 }
        ]
      },
      {
        aula: 31,
        titulo: 'Class 31 · Is there a kitchen?',
        atividades: [
          { num: 1, titulo: 'Rooms and furniture', tipo: 'Escute e escolha', treina: 'Escuta · Casa', minutos: '10 - 12', questoes: 24 },
          { num: 2, titulo: 'There is, there are', tipo: 'Monte a frase', treina: 'Escrita · There to be', minutos: '10 - 12', questoes: 20 },
          { num: 3, titulo: 'A new apartment', tipo: 'Qual é a próxima fala?', treina: 'Leitura · Diálogo', minutos: '10 - 12', questoes: 20 },
          { num: 4, titulo: 'Describe your house', tipo: 'Escute e grave', treina: 'Fala · Casa', minutos: '12 - 15', questoes: 20, microfone: true },
          { num: 5, titulo: 'Some or any?', tipo: 'Make a Choice', treina: 'Gramática', minutos: '10 - 12', questoes: 24 }
        ]
      },
      {
        aula: 32,
        titulo: 'Class 32 · They were just babies!',
        atividades: [
          { num: 1, titulo: 'Was or were?', tipo: 'Escute e escolha', treina: 'Escuta · Was / were', minutos: '10 - 12', questoes: 24 },
          { num: 2, titulo: 'I was at home', tipo: 'Monte a frase', treina: 'Escrita · Was / were', minutos: '10 - 12', questoes: 20 },
          { num: 3, titulo: 'Old photos', tipo: 'Qual é a próxima fala?', treina: 'Leitura · Diálogo', minutos: '10 - 12', questoes: 20 },
          { num: 4, titulo: 'Where were you?', tipo: 'Escute e grave', treina: 'Fala · Passado', minutos: '12 - 15', questoes: 20, microfone: true },
          { num: 5, titulo: 'The past of be', tipo: 'Make a Choice', treina: 'Gramática', minutos: '10 - 12', questoes: 24 }
        ]
      },
      {
        aula: 33,
        titulo: 'Class 33 and 34 · When Were You Born?',
        atividades: [
          { num: 1, parte: 'Class 33', titulo: 'Months and dates', tipo: 'Escute e escolha', treina: 'Escuta · Datas', minutos: '10 - 12', questoes: 24 },
          { num: 2, parte: 'Class 33', titulo: 'I was born on...', tipo: 'Monte a frase', treina: 'Escrita · Datas', minutos: '10 - 12', questoes: 20 },
          { num: 3, parte: 'Class 33', titulo: 'Birthdays and holidays', tipo: 'Qual é a próxima fala?', treina: 'Leitura · Diálogo', minutos: '10 - 12', questoes: 20 },
          { num: 4, parte: 'Class 33', titulo: 'Say the date', tipo: 'Escute e grave', treina: 'Fala · Ordinais', minutos: '12 - 15', questoes: 20, microfone: true },
          { num: 5, parte: 'Class 33', titulo: 'Ordinal numbers', tipo: 'Make a Choice', treina: 'Gramática', minutos: '10 - 12', questoes: 24 },
          { num: 6, parte: 'Class 34', titulo: 'Signs and short answers', tipo: 'Escute e escolha', treina: 'Escuta · Was / were', minutos: '10 - 12', questoes: 24 },
          { num: 7, parte: 'Class 34', titulo: 'Was he? Were they?', tipo: 'Monte a frase', treina: 'Escrita · Was / were', minutos: '10 - 12', questoes: 20 },
          { num: 8, parte: 'Class 34', titulo: "What's your sign?", tipo: 'Qual é a próxima fala?', treina: 'Leitura · Diálogo', minutos: '10 - 12', questoes: 20 },
          { num: 9, parte: 'Class 34', titulo: 'Were you at home?', tipo: 'Escute e grave', treina: 'Fala · Signos', minutos: '12 - 15', questoes: 20, microfone: true },
          { num: 10, parte: 'Class 34', titulo: 'Was / were: all forms', tipo: 'Make a Choice', treina: 'Gramática', minutos: '10 - 12', questoes: 24 }
        ]
      },
      {
        aula: 35,
        titulo: 'Class 35 and 36 · My Last Vacation',
        atividades: [
          { num: 1, parte: 'Class 35', titulo: 'Vacation and the past', tipo: 'Escute e escolha', treina: 'Escuta · Passado', minutos: '10 - 12', questoes: 24 },
          { num: 2, parte: 'Class 35', titulo: 'We traveled by plane', tipo: 'Monte a frase', treina: 'Escrita · Past simple', minutos: '10 - 12', questoes: 20 },
          { num: 3, parte: 'Class 35', titulo: 'A trip to Lisbon', tipo: 'Qual é a próxima fala?', treina: 'Leitura · Diálogo', minutos: '10 - 12', questoes: 20 },
          { num: 4, parte: 'Class 35', titulo: 'Tell the story', tipo: 'Escute e grave', treina: 'Fala · Past simple', minutos: '12 - 15', questoes: 20, microfone: true },
          { num: 5, parte: 'Class 35', titulo: 'Past simple regular', tipo: 'Make a Choice', treina: 'Gramática', minutos: '10 - 12', questoes: 24 },
          { num: 6, parte: 'Class 36', titulo: '/t/, /d/ or /ɪd/?', tipo: 'Escute e escolha', treina: 'Escuta · Pronúncia do -ed', minutos: '10 - 12', questoes: 24 },
          { num: 7, parte: 'Class 36', titulo: 'Holiday phrases', tipo: 'Monte a frase', treina: 'Escrita · Viagem', minutos: '10 - 12', questoes: 20 },
          { num: 8, parte: 'Class 36', titulo: 'How was your vacation?', tipo: 'Qual é a próxima fala?', treina: 'Leitura · Diálogo', minutos: '10 - 12', questoes: 20 },
          { num: 9, parte: 'Class 36', titulo: 'Say it with -ed', tipo: 'Escute e grave', treina: 'Fala · Pronúncia do -ed', minutos: '12 - 15', questoes: 20, microfone: true },
          { num: 10, parte: 'Class 36', titulo: 'Past simple review', tipo: 'Make a Choice', treina: 'Gramática', minutos: '10 - 12', questoes: 24 }
        ]
      },
      {
        aula: 37,
        titulo: "Class 37 and 38 · Let's Celebrate",
        atividades: [
          { num: 1, parte: 'Class 37', titulo: 'Irregular verbs', tipo: 'Escute e escolha', treina: 'Escuta · Passado irregular', minutos: '10 - 12', questoes: 24 },
          { num: 2, parte: 'Class 37', titulo: 'I went, I made, I found', tipo: 'Monte a frase', treina: 'Escrita · Past simple', minutos: '10 - 12', questoes: 20 },
          { num: 3, parte: 'Class 37', titulo: 'A budget party', tipo: 'Qual é a próxima fala?', treina: 'Leitura · Diálogo', minutos: '10 - 12', questoes: 20 },
          { num: 4, parte: 'Class 37', titulo: 'Say it in the past', tipo: 'Escute e grave', treina: 'Fala · Passado irregular', minutos: '12 - 15', questoes: 20, microfone: true },
          { num: 5, parte: 'Class 37', titulo: 'Past simple irregular', tipo: 'Make a Choice', treina: 'Gramática', minutos: '10 - 12', questoes: 24 },
          { num: 6, parte: 'Class 38', titulo: 'Birthday words', tipo: 'Escute e escolha', treina: 'Escuta · Vocabulário', minutos: '10 - 12', questoes: 24 },
          { num: 7, parte: 'Class 38', titulo: 'My memorable birthday', tipo: 'Monte a frase', treina: 'Escrita · Perguntas', minutos: '10 - 12', questoes: 20 },
          { num: 8, parte: 'Class 38', titulo: 'Tell me about your birthday', tipo: 'Qual é a próxima fala?', treina: 'Leitura · Diálogo', minutos: '10 - 12', questoes: 20 },
          { num: 9, parte: 'Class 38', titulo: 'Ask about a birthday', tipo: 'Escute e grave', treina: 'Fala · Perguntas', minutos: '12 - 15', questoes: 20, microfone: true },
          { num: 10, parte: 'Class 38', titulo: 'Birthday questions', tipo: 'Make a Choice', treina: 'Gramática', minutos: '10 - 12', questoes: 24 }
        ]
      },
      {
        aula: 39,
        titulo: 'Class 39 · Story of my Life',
        atividades: [
          { num: 1, titulo: 'Regular or irregular?', tipo: 'Escute e escolha', treina: 'Escuta · Passado', minutos: '10 - 12', questoes: 24 },
          { num: 2, titulo: 'The story of my life', tipo: 'Monte a frase', treina: 'Escrita · Past simple', minutos: '10 - 12', questoes: 20 },
          { num: 3, titulo: 'From the city to the countryside', tipo: 'Qual é a próxima fala?', treina: 'Leitura · Diálogo', minutos: '10 - 12', questoes: 20 },
          { num: 4, titulo: 'A day in my life', tipo: 'Escute e grave', treina: 'Fala · Past simple', minutos: '12 - 15', questoes: 20, microfone: true },
          { num: 5, titulo: 'Regular and irregular verbs', tipo: 'Make a Choice', treina: 'Gramática', minutos: '10 - 12', questoes: 24 }
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