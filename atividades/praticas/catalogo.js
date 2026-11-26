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
      },
      {
        aula: 40,
        titulo: 'Class 40 · Review',
        atividades: [
          { num: 1, titulo: 'Review: listen', tipo: 'Escute e escolha', treina: 'Escuta · Revisão', minutos: '10 - 12', questoes: 24 },
          { num: 2, titulo: 'Review: write', tipo: 'Monte a frase', treina: 'Escrita · Revisão', minutos: '10 - 12', questoes: 20 },
          { num: 3, titulo: 'Review: read', tipo: 'Qual é a próxima fala?', treina: 'Leitura · Diálogo', minutos: '10 - 12', questoes: 20 },
          { num: 4, titulo: 'Review: speak', tipo: 'Escute e grave', treina: 'Fala · Revisão', minutos: '12 - 15', questoes: 20, microfone: true },
          { num: 5, titulo: 'Review: grammar', tipo: 'Make a Choice', treina: 'Gramática', minutos: '10 - 12', questoes: 24 }
        ]
      },
      {
        aula: 41,
        titulo: "Class 41 · I'm Busy",
        atividades: [
          { num: 1, titulo: 'Appointments', tipo: 'Escute e escolha', treina: 'Escuta · Compromissos', minutos: '10 - 12', questoes: 24 },
          { num: 2, titulo: 'My busy week', tipo: 'Monte a frase', treina: 'Escrita · Futuro', minutos: '10 - 12', questoes: 20 },
          { num: 3, titulo: "Let's meet!", tipo: 'Qual é a próxima fala?', treina: 'Leitura · Diálogo', minutos: '10 - 12', questoes: 20 },
          { num: 4, titulo: 'What are you doing tomorrow?', tipo: 'Escute e grave', treina: 'Fala · Futuro', minutos: '12 - 15', questoes: 20, microfone: true },
          { num: 5, titulo: 'Present continuous for the future', tipo: 'Make a Choice', treina: 'Gramática', minutos: '10 - 12', questoes: 24 }
        ]
      },
      {
        aula: 42,
        titulo: "Class 42 · Let's Travel",
        atividades: [
          { num: 1, titulo: 'Travel plans', tipo: 'Escute e escolha', treina: 'Escuta · Viagem', minutos: '10 - 12', questoes: 24 },
          { num: 2, titulo: 'My travel arrangements', tipo: 'Monte a frase', treina: 'Escrita · Futuro', minutos: '10 - 12', questoes: 20 },
          { num: 3, titulo: 'Where are you going?', tipo: 'Qual é a próxima fala?', treina: 'Leitura · Diálogo', minutos: '10 - 12', questoes: 20 },
          { num: 4, titulo: 'My dream vacation', tipo: 'Escute e grave', treina: 'Fala · Futuro', minutos: '12 - 15', questoes: 20, microfone: true },
          { num: 5, titulo: "Let's travel: grammar", tipo: 'Make a Choice', treina: 'Gramática', minutos: '10 - 12', questoes: 24 }
        ]
      },
      {
        aula: 43,
        titulo: 'Class 43 · Review',
        atividades: [
          { num: 1, titulo: 'Past, present or future?', tipo: 'Escute e escolha', treina: 'Escuta · Tempos verbais', minutos: '10 - 12', questoes: 24 },
          { num: 2, titulo: 'Ask your partner', tipo: 'Monte a frase', treina: 'Escrita · Perguntas', minutos: '10 - 12', questoes: 20 },
          { num: 3, titulo: 'Getting to know you', tipo: 'Qual é a próxima fala?', treina: 'Leitura · Diálogo', minutos: '10 - 12', questoes: 20 },
          { num: 4, titulo: 'Talk about you', tipo: 'Escute e grave', treina: 'Fala · Revisão', minutos: '12 - 15', questoes: 20, microfone: true },
          { num: 5, titulo: 'All the tenses', tipo: 'Make a Choice', treina: 'Gramática', minutos: '10 - 12', questoes: 24 }
        ]
      }
    ]
  },
  a2: {
    course: 'ativ-a2',
    nome: 'A2',
    aulas: [
      {
        aula: 1,
        titulo: 'Class 01 · Welcome Class',
        atividades: [
          { num: 1, titulo: 'What is it about?', tipo: 'Escute e escolha', treina: 'Escuta · Vocabulário', minutos: '10 - 12', questoes: 24 },
          { num: 2, titulo: 'Interview questions', tipo: 'Monte a frase', treina: 'Escrita · Perguntas', minutos: '10 - 12', questoes: 20 },
          { num: 3, titulo: 'A day in the life of a baker', tipo: 'Qual é a próxima fala?', treina: 'Leitura · Diálogo', minutos: '10 - 12', questoes: 20 },
          { num: 4, titulo: 'All about me', tipo: 'Escute e grave', treina: 'Fala · Entrevista', minutos: '12 - 15', questoes: 20, microfone: true },
          { num: 5, titulo: 'How much do you remember?', tipo: 'Make a Choice', treina: 'Gramática · Revisão do A1', minutos: '10 - 12', questoes: 24 }
        ]
      },
      {
        aula: 2,
        titulo: 'Class 02 · This is ME in a minute',
        atividades: [
          { num: 1, titulo: "He's or his?", tipo: 'Escute e escolha', treina: 'Escuta · Sons parecidos', minutos: '10 - 12', questoes: 24 },
          { num: 2, titulo: 'My profile', tipo: 'Monte a frase', treina: 'Escrita · Be e possessivos', minutos: '10 - 12', questoes: 20 },
          { num: 3, titulo: 'Tom in a minute', tipo: 'Qual é a próxima fala?', treina: 'Leitura · Diálogo', minutos: '10 - 12', questoes: 20 },
          { num: 4, titulo: 'This is me in a minute', tipo: 'Escute e grave', treina: 'Fala · Apresentação', minutos: '12 - 15', questoes: 20, microfone: true },
          { num: 5, titulo: 'Possessive adjectives', tipo: 'Make a Choice', treina: 'Gramática', minutos: '10 - 12', questoes: 24 }
        ]
      },
      {
        aula: 3,
        titulo: 'Class 03 and 04 · Famous Bedrooms',
        atividades: [
          { num: 1, parte: 'Class 03', titulo: 'Which room is it?', tipo: 'Escute e escolha', treina: 'Escuta · Casa', minutos: '10 - 12', questoes: 24 },
          { num: 2, parte: 'Class 03', titulo: 'Dream bedrooms', tipo: 'Monte a frase', treina: 'Escrita · Descrição', minutos: '10 - 12', questoes: 20 },
          { num: 3, parte: 'Class 03', titulo: "Lucas's new bedroom", tipo: 'Qual é a próxima fala?', treina: 'Leitura · Diálogo', minutos: '10 - 12', questoes: 20 },
          { num: 4, parte: 'Class 03', titulo: 'Things in my house', tipo: 'Escute e grave', treina: 'Fala · Vocabulário', minutos: '12 - 15', questoes: 20, microfone: true },
          { num: 5, parte: 'Class 03', titulo: 'Rooms and furniture', tipo: 'Make a Choice', treina: 'Gramática · Vocabulário', minutos: '10 - 12', questoes: 24 },
          { num: 6, parte: 'Class 04', titulo: 'Where is it?', tipo: 'Escute e escolha', treina: 'Escuta · Preposições', minutos: '10 - 12', questoes: 24 },
          { num: 7, parte: 'Class 04', titulo: 'In, on, under...', tipo: 'Monte a frase', treina: 'Escrita · Preposições', minutos: '10 - 12', questoes: 20 },
          { num: 8, parte: 'Class 04', titulo: 'Show me your bedroom', tipo: 'Qual é a próxima fala?', treina: 'Leitura · Diálogo', minutos: '10 - 12', questoes: 20 },
          { num: 9, parte: 'Class 04', titulo: 'Describe your bedroom', tipo: 'Escute e grave', treina: 'Fala · Descrição', minutos: '12 - 15', questoes: 20, microfone: true },
          { num: 10, parte: 'Class 04', titulo: 'Prepositions of place', tipo: 'Make a Choice', treina: 'Gramática', minutos: '10 - 12', questoes: 24 }
        ]
      },
      {
        aula: 5,
        titulo: "Class 05 · They're Really Tall!",
        atividades: [
          { num: 1, titulo: 'What do they look like?', tipo: 'Escute e escolha', treina: 'Escuta · Aparência', minutos: '10 - 12', questoes: 24 },
          { num: 2, titulo: 'Very, really, quite', tipo: 'Monte a frase', treina: 'Escrita · Adjetivos', minutos: '10 - 12', questoes: 20 },
          { num: 3, titulo: 'At the airport', tipo: 'Qual é a próxima fala?', treina: 'Leitura · Diálogo', minutos: '10 - 12', questoes: 20 },
          { num: 4, titulo: 'How tall is he?', tipo: 'Escute e grave', treina: 'Fala · Alturas', minutos: '12 - 15', questoes: 20, microfone: true },
          { num: 5, titulo: 'Adjectives and modifiers', tipo: 'Make a Choice', treina: 'Gramática', minutos: '10 - 12', questoes: 24 }
        ]
      },
      {
        aula: 6,
        titulo: 'Class 06 · How do you feel? What do you eat?',
        atividades: [
          { num: 1, titulo: 'How do they feel?', tipo: 'Escute e escolha', treina: 'Escuta · Sentimentos', minutos: '10 - 12', questoes: 24 },
          { num: 2, titulo: "Don't worry, let's go!", tipo: 'Monte a frase', treina: 'Escrita · Imperativo', minutos: '10 - 12', questoes: 20 },
          { num: 3, titulo: 'Feeding your feelings', tipo: 'Qual é a próxima fala?', treina: 'Leitura · Diálogo', minutos: '10 - 12', questoes: 20 },
          { num: 4, titulo: 'Give advice', tipo: 'Escute e grave', treina: 'Fala · Conselhos', minutos: '12 - 15', questoes: 20, microfone: true },
          { num: 5, titulo: "Imperatives and Let's", tipo: 'Make a Choice', treina: 'Gramática', minutos: '10 - 12', questoes: 24 }
        ]
      },
      {
        aula: 7,
        titulo: "Class 07 and 08 · It's my life",
        atividades: [
          { num: 1, parte: 'Class 07', titulo: 'At, in, on or to?', tipo: 'Escute e escolha', treina: 'Escuta · Preposições de tempo', minutos: '10 - 12', questoes: 24 },
          { num: 2, parte: 'Class 07', titulo: 'My weekly routine', tipo: 'Monte a frase', treina: 'Escrita · Rotina', minutos: '10 - 12', questoes: 20 },
          { num: 3, parte: 'Class 07', titulo: 'A day in the life of a freshman', tipo: 'Qual é a próxima fala?', treina: 'Leitura · Diálogo', minutos: '10 - 12', questoes: 20 },
          { num: 4, parte: 'Class 07', titulo: 'Ask and answer', tipo: 'Escute e grave', treina: 'Fala · Rotina', minutos: '12 - 15', questoes: 20, microfone: true },
          { num: 5, parte: 'Class 07', titulo: 'Prepositions of time', tipo: 'Make a Choice', treina: 'Gramática', minutos: '10 - 12', questoes: 24 },
          { num: 6, parte: 'Class 08', titulo: 'Affirmative, negative or question?', tipo: 'Escute e escolha', treina: 'Escuta · Present simple', minutos: '10 - 12', questoes: 24 },
          { num: 7, parte: 'Class 08', titulo: 'Her study routine', tipo: 'Monte a frase', treina: 'Escrita · Present simple', minutos: '10 - 12', questoes: 20 },
          { num: 8, parte: 'Class 08', titulo: "Lena's study routine", tipo: 'Qual é a próxima fala?', treina: 'Leitura · Diálogo', minutos: '10 - 12', questoes: 20 },
          { num: 9, parte: 'Class 08', titulo: 'Talk about her day', tipo: 'Escute e grave', treina: 'Fala · 3ª pessoa', minutos: '12 - 15', questoes: 20, microfone: true },
          { num: 10, parte: 'Class 08', titulo: 'Simple present', tipo: 'Make a Choice', treina: 'Gramática', minutos: '10 - 12', questoes: 24 }
        ]
      },
      {
        aula: 9,
        titulo: 'Class 09 and 10 · What is the answer?',
        atividades: [
          { num: 1, parte: 'Class 09', titulo: 'Question words', tipo: 'Escute e escolha', treina: 'Escuta · Perguntas', minutos: '10 - 12', questoes: 24 },
          { num: 2, parte: 'Class 09', titulo: 'Make the question', tipo: 'Monte a frase', treina: 'Escrita · Perguntas', minutos: '10 - 12', questoes: 20 },
          { num: 3, parte: 'Class 09', titulo: 'Kids ask, Aunt Sara answers', tipo: 'Qual é a próxima fala?', treina: 'Leitura · Diálogo', minutos: '10 - 12', questoes: 20 },
          { num: 4, parte: 'Class 09', titulo: 'Ask your partner', tipo: 'Escute e grave', treina: 'Fala · Perguntas', minutos: '12 - 15', questoes: 20, microfone: true },
          { num: 5, parte: 'Class 09', titulo: 'Question forms', tipo: 'Make a Choice', treina: 'Gramática', minutos: '10 - 12', questoes: 24 },
          { num: 6, parte: 'Class 10', titulo: 'In, on or at?', tipo: 'Escute e escolha', treina: 'Escuta · Preposições de lugar', minutos: '10 - 12', questoes: 24 },
          { num: 7, parte: 'Class 10', titulo: 'Where are they?', tipo: 'Monte a frase', treina: 'Escrita · Preposições de lugar', minutos: '10 - 12', questoes: 20 },
          { num: 8, parte: 'Class 10', titulo: 'Are you a genius?', tipo: 'Make a Choice', treina: 'Leitura · Cultura geral', minutos: '10 - 12', questoes: 20 },
          { num: 9, parte: 'Class 10', titulo: 'Where are you now?', tipo: 'Escute e grave', treina: 'Fala · Lugares', minutos: '12 - 15', questoes: 20, microfone: true },
          { num: 10, parte: 'Class 10', titulo: 'Prepositions of place: in, on, at', tipo: 'Make a Choice', treina: 'Gramática', minutos: '10 - 12', questoes: 24 }
        ]
      },
      {
        aula: 11,
        titulo: 'Class 11 · Housework and Exercise',
        atividades: [
          { num: 1, titulo: 'What housework is it?', tipo: 'Escute e escolha', treina: 'Escuta · Tarefas domésticas', minutos: '10 - 12', questoes: 24 },
          { num: 2, titulo: 'How often?', tipo: 'Monte a frase', treina: 'Escrita · Frequência', minutos: '10 - 12', questoes: 20 },
          { num: 3, titulo: 'Who does the housework?', tipo: 'Qual é a próxima fala?', treina: 'Leitura · Diálogo', minutos: '10 - 12', questoes: 20 },
          { num: 4, titulo: 'My housework routine', tipo: 'Escute e grave', treina: 'Fala · Frequência', minutos: '12 - 15', questoes: 20, microfone: true },
          { num: 5, titulo: 'Adverbs of frequency', tipo: 'Make a Choice', treina: 'Gramática', minutos: '10 - 12', questoes: 24 }
        ]
      },
      {
        aula: 12,
        titulo: 'Class 12 · Family Stories',
        atividades: [
          { num: 1, titulo: 'Who is she?', tipo: 'Escute e escolha', treina: 'Escuta · Família', minutos: '10 - 12', questoes: 24 },
          { num: 2, titulo: 'My family tree', tipo: 'Monte a frase', treina: "Escrita · Genitivo 's", minutos: '10 - 12', questoes: 20 },
          { num: 3, titulo: 'Family photo', tipo: 'Qual é a próxima fala?', treina: 'Leitura · Diálogo', minutos: '10 - 12', questoes: 20 },
          { num: 4, titulo: 'Talk about your family', tipo: 'Escute e grave', treina: 'Fala · Família', minutos: '12 - 15', questoes: 20, microfone: true },
          { num: 5, titulo: "Possessive 's, who and whose", tipo: 'Make a Choice', treina: 'Gramática', minutos: '10 - 12', questoes: 24 }
        ]
      },
      {
        aula: 13,
        titulo: 'Class 13 · Review Classes 1-12',
        atividades: [
          { num: 1, titulo: 'What are they talking about?', tipo: 'Escute e escolha', treina: 'Escuta · Revisão', minutos: '10 - 12', questoes: 24 },
          { num: 2, titulo: 'Can you do it?', tipo: 'Monte a frase', treina: 'Escrita · Revisão', minutos: '10 - 12', questoes: 20 },
          { num: 3, titulo: 'The new neighbor', tipo: 'Qual é a próxima fala?', treina: 'Leitura · Diálogo', minutos: '10 - 12', questoes: 20 },
          { num: 4, titulo: 'I can do it!', tipo: 'Escute e grave', treina: 'Fala · Revisão', minutos: '12 - 15', questoes: 20, microfone: true },
          { num: 5, titulo: 'Review 1-12', tipo: 'Make a Choice', treina: 'Gramática · Revisão', minutos: '10 - 12', questoes: 24 }
        ]
      },
      {
        aula: 14,
        titulo: 'Class 14 · Exams Be Like',
        atividades: [
          { num: 1, titulo: 'What does "can" mean here?', tipo: 'Escute e escolha', treina: 'Escuta · Can', minutos: '10 - 12', questoes: 24 },
          { num: 2, titulo: 'Can I use a calculator?', tipo: 'Monte a frase', treina: 'Escrita · Can', minutos: '10 - 12', questoes: 20 },
          { num: 3, titulo: 'The night before the exam', tipo: 'Qual é a próxima fala?', treina: 'Leitura · Diálogo', minutos: '10 - 12', questoes: 20 },
          { num: 4, titulo: 'Can you...?', tipo: 'Escute e grave', treina: 'Fala · Can', minutos: '12 - 15', questoes: 20, microfone: true },
          { num: 5, titulo: "Can and can't", tipo: 'Make a Choice', treina: 'Gramática', minutos: '10 - 12', questoes: 24 }
        ]
      },
      {
        aula: 15,
        titulo: "Class 15 · We're Working From Home",
        atividades: [
          { num: 1, titulo: 'Where are they?', tipo: 'Escute e escolha', treina: 'Escuta · Cômodos da casa', minutos: '10 - 12', questoes: 24 },
          { num: 2, titulo: 'Working from home', tipo: 'Monte a frase', treina: 'Escrita · Present continuous', minutos: '10 - 12', questoes: 20 },
          { num: 3, titulo: 'A busy day at home', tipo: 'Qual é a próxima fala?', treina: 'Leitura · Diálogo', minutos: '10 - 12', questoes: 20 },
          { num: 4, titulo: "What's happening at home?", tipo: 'Escute e grave', treina: 'Fala · Present continuous', minutos: '12 - 15', questoes: 20, microfone: true },
          { num: 5, titulo: 'Present continuous', tipo: 'Make a Choice', treina: 'Gramática · Present continuous', minutos: '10 - 12', questoes: 24 }
        ]
      },
      {
        aula: 16,
        titulo: 'Class 16 · Holidays in Spain',
        atividades: [
          { num: 1, titulo: 'Holiday activities', tipo: 'Escute e escolha', treina: 'Escuta · Férias', minutos: '10 - 12', questoes: 24 },
          { num: 2, titulo: 'Usually... but today', tipo: 'Monte a frase', treina: 'Escrita · Simple x continuous', minutos: '10 - 12', questoes: 20 },
          { num: 3, titulo: 'Hannah on holiday', tipo: 'Qual é a próxima fala?', treina: 'Leitura · Diálogo', minutos: '10 - 12', questoes: 20 },
          { num: 4, titulo: 'Your holidays', tipo: 'Escute e grave', treina: 'Fala · Férias', minutos: '12 - 15', questoes: 20, microfone: true },
          { num: 5, titulo: 'Present simple or continuous?', tipo: 'Make a Choice', treina: 'Gramática', minutos: '10 - 12', questoes: 24 }
        ]
      },
      {
        aula: 17,
        titulo: "Class 17 · Today's Outfit",
        atividades: [
          { num: 1, titulo: 'What are they talking about?', tipo: 'Escute e escolha', treina: 'Escuta · Pronomes', minutos: '10 - 12', questoes: 24 },
          { num: 2, titulo: 'I love it!', tipo: 'Monte a frase', treina: 'Escrita · Object pronouns', minutos: '10 - 12', questoes: 20 },
          { num: 3, titulo: 'What should I wear?', tipo: 'Qual é a próxima fala?', treina: 'Leitura · Diálogo', minutos: '10 - 12', questoes: 20 },
          { num: 4, titulo: "Today I'm wearing...", tipo: 'Escute e grave', treina: 'Fala · Roupas', minutos: '12 - 15', questoes: 20, microfone: true },
          { num: 5, titulo: 'Object pronouns', tipo: 'Make a Choice', treina: 'Gramática', minutos: '10 - 12', questoes: 24 }
        ]
      },
      {
        aula: 18,
        titulo: 'Class 18 and 19 · I Love Cooking on This Day!',
        atividades: [
          { num: 1, parte: 'Class 18', titulo: 'Which date do you hear?', tipo: 'Escute e escolha', treina: 'Escuta · Datas', minutos: '10 - 12', questoes: 24 },
          { num: 2, parte: 'Class 18', titulo: 'When is it?', tipo: 'Monte a frase', treina: 'Escrita · Datas', minutos: '10 - 12', questoes: 20 },
          { num: 3, parte: 'Class 18', titulo: 'Holidays here and there', tipo: 'Qual é a próxima fala?', treina: 'Leitura · Diálogo', minutos: '10 - 12', questoes: 20 },
          { num: 4, parte: 'Class 18', titulo: 'Say the date', tipo: 'Escute e grave', treina: 'Fala · Datas', minutos: '12 - 15', questoes: 20, microfone: true },
          { num: 5, parte: 'Class 18', titulo: 'Ordinal numbers and dates', tipo: 'Make a Choice', treina: 'Gramática', minutos: '10 - 12', questoes: 24 },
          { num: 6, parte: 'Class 19', titulo: 'Love it or hate it?', tipo: 'Escute e escolha', treina: 'Escuta · Gostos', minutos: '10 - 12', questoes: 24 },
          { num: 7, parte: 'Class 19', titulo: 'I love cooking!', tipo: 'Monte a frase', treina: 'Escrita · Verbo + ing', minutos: '10 - 12', questoes: 20 },
          { num: 8, parte: 'Class 19', titulo: 'Christmas in Australia', tipo: 'Qual é a próxima fala?', treina: 'Leitura · Diálogo', minutos: '10 - 12', questoes: 20 },
          { num: 9, parte: 'Class 19', titulo: 'What do you love doing?', tipo: 'Escute e grave', treina: 'Fala · Gostos', minutos: '12 - 15', questoes: 20, microfone: true },
          { num: 10, parte: 'Class 19', titulo: 'Verbs + ing', tipo: 'Make a Choice', treina: 'Gramática', minutos: '10 - 12', questoes: 24 }
        ]
      },
      {
        aula: 20,
        titulo: 'Class 20 and 21 · They Were Fantastic!',
        atividades: [
          { num: 1, parte: 'Class 20', titulo: 'Was or were?', tipo: 'Escute e escolha', treina: 'Escuta · Was / were', minutos: '10 - 12', questoes: 24 },
          { num: 2, parte: 'Class 20', titulo: 'Women in history', tipo: 'Monte a frase', treina: 'Escrita · Was / were', minutos: '10 - 12', questoes: 20 },
          { num: 3, parte: 'Class 20', titulo: 'At the science museum', tipo: 'Qual é a próxima fala?', treina: 'Leitura · Diálogo', minutos: '10 - 12', questoes: 20 },
          { num: 4, parte: 'Class 20', titulo: 'Where were you?', tipo: 'Escute e grave', treina: 'Fala · Was / were', minutos: '12 - 15', questoes: 20, microfone: true },
          { num: 5, parte: 'Class 20', titulo: 'Past of be', tipo: 'Make a Choice', treina: 'Gramática', minutos: '10 - 12', questoes: 24 },
          { num: 6, parte: 'Class 21', titulo: 'What was her job?', tipo: 'Escute e escolha', treina: 'Escuta · Profissões', minutos: '10 - 12', questoes: 24 },
          { num: 7, parte: 'Class 21', titulo: 'Write her biography', tipo: 'Monte a frase', treina: 'Escrita · Biografias', minutos: '10 - 12', questoes: 20 },
          { num: 8, parte: 'Class 21', titulo: 'Our presentation', tipo: 'Qual é a próxima fala?', treina: 'Leitura · Diálogo', minutos: '10 - 12', questoes: 20 },
          { num: 9, parte: 'Class 21', titulo: 'Famous women', tipo: 'Escute e grave', treina: 'Fala · Biografias', minutos: '12 - 15', questoes: 20, microfone: true },
          { num: 10, parte: 'Class 21', titulo: 'Jobs: -er, -or, -ist, -ian', tipo: 'Make a Choice', treina: 'Gramática · Profissões', minutos: '10 - 12', questoes: 24 }
        ]
      },
      {
        aula: 22,
        titulo: 'Class 22 · My Holiday Disaster',
        atividades: [
          { num: 1, titulo: 'How do you say -ed?', tipo: 'Escute e escolha', treina: 'Escuta · Pronúncia do -ed', minutos: '10 - 12', questoes: 24 },
          { num: 2, titulo: 'What happened?', tipo: 'Monte a frase', treina: 'Escrita · Past simple', minutos: '10 - 12', questoes: 20 },
          { num: 3, titulo: "Ben's holiday disaster", tipo: 'Qual é a próxima fala?', treina: 'Leitura · Diálogo', minutos: '10 - 12', questoes: 20 },
          { num: 4, titulo: 'Tell your holiday story', tipo: 'Escute e grave', treina: 'Fala · Past simple', minutos: '12 - 15', questoes: 20, microfone: true },
          { num: 5, titulo: 'Past simple: regular verbs', tipo: 'Make a Choice', treina: 'Gramática', minutos: '10 - 12', questoes: 24 }
        ]
      },
      {
        aula: 23,
        titulo: 'Class 23 · Did You Like the Music?',
        atividades: [
          { num: 1, titulo: 'Where do you go?', tipo: 'Escute e escolha', treina: 'Escuta · Festivais', minutos: '10 - 12', questoes: 24 },
          { num: 2, titulo: 'I went to a festival', tipo: 'Monte a frase', treina: 'Escrita · Past simple irregular', minutos: '10 - 12', questoes: 20 },
          { num: 3, titulo: 'Back from the festival', tipo: 'Qual é a próxima fala?', treina: 'Leitura · Diálogo', minutos: '10 - 12', questoes: 20 },
          { num: 4, titulo: 'My festival story', tipo: 'Escute e grave', treina: 'Fala · Past simple', minutos: '12 - 15', questoes: 20, microfone: true },
          { num: 5, titulo: 'Irregular verbs and could', tipo: 'Make a Choice', treina: 'Gramática', minutos: '10 - 12', questoes: 24 }
        ]
      },
      {
        aula: 24,
        titulo: 'Class 24 · Review Classes 14-23',
        atividades: [
          { num: 1, titulo: 'Now, usually, past or can?', tipo: 'Escute e escolha', treina: 'Escuta · Revisão', minutos: '10 - 12', questoes: 24 },
          { num: 2, titulo: 'Review: make the sentence', tipo: 'Monte a frase', treina: 'Escrita · Revisão', minutos: '10 - 12', questoes: 20 },
          { num: 3, titulo: 'Catching up', tipo: 'Qual é a próxima fala?', treina: 'Leitura · Diálogo', minutos: '10 - 12', questoes: 20 },
          { num: 4, titulo: 'Can you talk about it?', tipo: 'Escute e grave', treina: 'Fala · Revisão', minutos: '12 - 15', questoes: 20, microfone: true },
          { num: 5, titulo: 'Review: grammar', tipo: 'Make a Choice', treina: 'Gramática · Revisão', minutos: '10 - 12', questoes: 24 }
        ]
      },
      {
        aula: 25,
        titulo: 'Class 25 · A Childhood Story',
        atividades: [
          { num: 1, titulo: 'What was happening?', tipo: 'Escute e escolha', treina: 'Escuta · Past continuous', minutos: '10 - 12', questoes: 24 },
          { num: 2, titulo: 'I was walking when...', tipo: 'Monte a frase', treina: 'Escrita · Past continuous', minutos: '10 - 12', questoes: 20 },
          { num: 3, titulo: 'A message in a bottle', tipo: 'Qual é a próxima fala?', treina: 'Leitura · Diálogo', minutos: '10 - 12', questoes: 20 },
          { num: 4, titulo: 'What were you doing?', tipo: 'Escute e grave', treina: 'Fala · Past continuous', minutos: '12 - 15', questoes: 20, microfone: true },
          { num: 5, titulo: 'Past continuous and sequencers', tipo: 'Make a Choice', treina: 'Gramática', minutos: '10 - 12', questoes: 24 }
        ]
      },
      {
        aula: 26,
        titulo: 'Class 26 · Photos That Tell Stories',
        atividades: [
          { num: 1, titulo: 'What interrupted the photo?', tipo: 'Escute e escolha', treina: 'Escuta · Past simple x continuous', minutos: '10 - 12', questoes: 24 },
          { num: 2, titulo: 'While I was taking photos...', tipo: 'Monte a frase', treina: 'Escrita · When / while', minutos: '10 - 12', questoes: 20 },
          { num: 3, titulo: 'The story behind the photo', tipo: 'Qual é a próxima fala?', treina: 'Leitura · Diálogo', minutos: '10 - 12', questoes: 20 },
          { num: 4, titulo: 'Describe your favorite photo', tipo: 'Escute e grave', treina: 'Fala · Descrever uma foto', minutos: '12 - 15', questoes: 20, microfone: true },
          { num: 5, titulo: 'Past simple or past continuous?', tipo: 'Make a Choice', treina: 'Gramática', minutos: '10 - 12', questoes: 24 }
        ]
      },
      {
        aula: 27,
        titulo: "Class 27 · There's a Restaurant",
        atividades: [
          { num: 1, titulo: 'What is it?', tipo: 'Escute e escolha', treina: 'Escuta · Restaurante', minutos: '10 - 12', questoes: 24 },
          { num: 2, titulo: 'There is, there are', tipo: 'Monte a frase', treina: 'Escrita · There is / there are', minutos: '10 - 12', questoes: 20 },
          { num: 3, titulo: 'Calling a restaurant', tipo: 'Qual é a próxima fala?', treina: 'Leitura · Diálogo', minutos: '10 - 12', questoes: 20 },
          { num: 4, titulo: 'My favorite restaurant', tipo: 'Escute e grave', treina: 'Fala · There is / there are', minutos: '12 - 15', questoes: 20, microfone: true },
          { num: 5, titulo: 'There is / there are + some / any', tipo: 'Make a Choice', treina: 'Gramática', minutos: '10 - 12', questoes: 24 }
        ]
      },
      {
        aula: 28,
        titulo: 'Class 28 · Two Cities, Two Worlds',
        atividades: [
          { num: 1, titulo: 'Which number do you hear?', tipo: 'Escute e escolha', treina: 'Escuta · Números altos', minutos: '10 - 12', questoes: 24 },
          { num: 2, titulo: 'There was, there were', tipo: 'Monte a frase', treina: 'Escrita · There was / were', minutos: '10 - 12', questoes: 20 },
          { num: 3, titulo: 'My town then and now', tipo: 'Qual é a próxima fala?', treina: 'Leitura · Diálogo', minutos: '10 - 12', questoes: 20 },
          { num: 4, titulo: 'Then and now', tipo: 'Escute e grave', treina: 'Fala · Lugares da cidade', minutos: '12 - 15', questoes: 20, microfone: true },
          { num: 5, titulo: 'There was / there were', tipo: 'Make a Choice', treina: 'Gramática', minutos: '10 - 12', questoes: 24 }
        ]
      },
      {
        aula: 29,
        titulo: 'Class 29 · Eat as an Athlete',
        atividades: [
          { num: 1, titulo: 'A, an or some?', tipo: 'Escute e escolha', treina: 'Escuta · Comidas', minutos: '10 - 12', questoes: 24 },
          { num: 2, titulo: 'Some eggs and an apple', tipo: 'Monte a frase', treina: 'Escrita · A / an / some / any', minutos: '10 - 12', questoes: 20 },
          { num: 3, titulo: 'Talking to a nutritionist', tipo: 'Qual é a próxima fala?', treina: 'Leitura · Diálogo', minutos: '10 - 12', questoes: 20 },
          { num: 4, titulo: 'My food plan', tipo: 'Escute e grave', treina: 'Fala · Alimentação', minutos: '12 - 15', questoes: 20, microfone: true },
          { num: 5, titulo: 'Countable and uncountable', tipo: 'Make a Choice', treina: 'Gramática', minutos: '10 - 12', questoes: 24 }
        ]
      },
      {
        aula: 30,
        titulo: "Class 30 · That's Sweet!",
        atividades: [
          { num: 1, titulo: 'Which container?', tipo: 'Escute e escolha', treina: 'Escuta · Embalagens', minutos: '10 - 12', questoes: 24 },
          { num: 2, titulo: 'How much sugar?', tipo: 'Monte a frase', treina: 'Escrita · How much / many', minutos: '10 - 12', questoes: 20 },
          { num: 3, titulo: 'Are you healthy?', tipo: 'Qual é a próxima fala?', treina: 'Leitura · Diálogo', minutos: '10 - 12', questoes: 20 },
          { num: 4, titulo: 'How much? How many?', tipo: 'Escute e grave', treina: 'Fala · Quantidades', minutos: '12 - 15', questoes: 20, microfone: true },
          { num: 5, titulo: 'Much, many, a few, a little', tipo: 'Make a Choice', treina: 'Gramática', minutos: '10 - 12', questoes: 24 }
        ]
      },
      {
        aula: 31,
        titulo: "Class 31 · Travelers' Culture Shocks",
        atividades: [
          { num: 1, titulo: 'How do they do it?', tipo: 'Escute e escolha', treina: 'Escuta · Adverbs of manner', minutos: '10 - 12', questoes: 24 },
          { num: 2, titulo: 'Surprising habits', tipo: 'Monte a frase', treina: 'Escrita · Adverbs of manner', minutos: '10 - 12', questoes: 20 },
          { num: 3, titulo: 'Back from Buenos Aires', tipo: 'Qual é a próxima fala?', treina: 'Leitura · Diálogo', minutos: '10 - 12', questoes: 20 },
          { num: 4, titulo: 'Surprises in my country', tipo: 'Escute e grave', treina: 'Fala · Adjetivos e advérbios', minutos: '12 - 15', questoes: 20, microfone: true },
          { num: 5, titulo: 'Adjective or adverb?', tipo: 'Make a Choice', treina: 'Gramática · Adjetivo x advérbio', minutos: '10 - 12', questoes: 24 }
        ]
      },
      {
        aula: 32,
        titulo: 'Class 32 · Get Fit',
        atividades: [
          { num: 1, titulo: 'Body and exercise', tipo: 'Escute e escolha', treina: 'Escuta · Corpo e exercícios', minutos: '10 - 12', questoes: 24 },
          { num: 2, titulo: 'Harder than walking', tipo: 'Monte a frase', treina: 'Escrita · Comparativos', minutos: '10 - 12', questoes: 20 },
          { num: 3, titulo: 'Gym or park?', tipo: 'Qual é a próxima fala?', treina: 'Leitura · Diálogo', minutos: '10 - 12', questoes: 20 },
          { num: 4, titulo: 'Which one do you prefer?', tipo: 'Escute e grave', treina: 'Fala · Comparativos', minutos: '12 - 15', questoes: 20, microfone: true },
          { num: 5, titulo: 'Comparatives', tipo: 'Make a Choice', treina: 'Gramática', minutos: '10 - 12', questoes: 24 }
        ]
      },
      {
        aula: 33,
        titulo: 'Class 33 · Review Classes 25-32',
        atividades: [
          { num: 1, titulo: 'What is it about?', tipo: 'Escute e escolha', treina: 'Escuta · Revisão', minutos: '10 - 12', questoes: 24 },
          { num: 2, titulo: 'Review: make the sentence', tipo: 'Monte a frase', treina: 'Escrita · Revisão', minutos: '10 - 12', questoes: 20 },
          { num: 3, titulo: 'A trip to Lisbon', tipo: 'Qual é a próxima fala?', treina: 'Leitura · Diálogo', minutos: '10 - 12', questoes: 20 },
          { num: 4, titulo: 'Can you do it?', tipo: 'Escute e grave', treina: 'Fala · Revisão', minutos: '12 - 15', questoes: 20, microfone: true },
          { num: 5, titulo: 'Review: grammar', tipo: 'Make a Choice', treina: 'Gramática · Revisão', minutos: '10 - 12', questoes: 24 }
        ]
      },
      {
        aula: 34,
        titulo: 'Class 34 · Can You Go on Top of the Burj Khalifa?',
        atividades: [
          { num: 1, titulo: 'Taller or the tallest?', tipo: 'Escute e escolha', treina: 'Escuta · Superlativos', minutos: '10 - 12', questoes: 24 },
          { num: 2, titulo: 'The tallest building in the world', tipo: 'Monte a frase', treina: 'Escrita · Superlativos', minutos: '10 - 12', questoes: 20 },
          { num: 3, titulo: 'Tourist in my town', tipo: 'Qual é a próxima fala?', treina: 'Leitura · Diálogo', minutos: '10 - 12', questoes: 20 },
          { num: 4, titulo: 'Famous landmarks', tipo: 'Escute e grave', treina: 'Fala · Superlativos', minutos: '12 - 15', questoes: 20, microfone: true },
          { num: 5, titulo: 'Superlatives', tipo: 'Make a Choice', treina: 'Gramática', minutos: '10 - 12', questoes: 24 }
        ]
      },
      {
        aula: 35,
        titulo: 'Class 35 · Study Abroad: How to Pack',
        atividades: [
          { num: 1, titulo: 'What are you going to pack?', tipo: 'Escute e escolha', treina: 'Escuta · Mala de viagem', minutos: '10 - 12', questoes: 24 },
          { num: 2, titulo: "I'm going to study abroad", tipo: 'Monte a frase', treina: 'Escrita · Be going to', minutos: '10 - 12', questoes: 20 },
          { num: 3, titulo: 'Packing for Canada', tipo: 'Qual é a próxima fala?', treina: 'Leitura · Diálogo', minutos: '10 - 12', questoes: 20 },
          { num: 4, titulo: 'My plans', tipo: 'Escute e grave', treina: 'Fala · Be going to', minutos: '12 - 15', questoes: 20, microfone: true },
          { num: 5, titulo: 'Be going to', tipo: 'Make a Choice', treina: 'Gramática', minutos: '10 - 12', questoes: 24 }
        ]
      },
      {
        aula: 36,
        titulo: 'Class 36 · What Is Your Dream?',
        atividades: [
          { num: 1, titulo: 'Dream, enjoy or need?', tipo: 'Escute e escolha', treina: 'Escuta · Sonhos', minutos: '10 - 12', questoes: 24 },
          { num: 2, titulo: "I'd like to travel the world", tipo: 'Monte a frase', treina: 'Escrita · Verbo + to', minutos: '10 - 12', questoes: 20 },
          { num: 3, titulo: 'Our bucket lists', tipo: 'Qual é a próxima fala?', treina: 'Leitura · Diálogo', minutos: '10 - 12', questoes: 20 },
          { num: 4, titulo: 'My bucket list', tipo: 'Escute e grave', treina: 'Fala · Sonhos e planos', minutos: '12 - 15', questoes: 20, microfone: true },
          { num: 5, titulo: 'Verb + to + infinitive', tipo: 'Make a Choice', treina: 'Gramática', minutos: '10 - 12', questoes: 24 }
        ]
      },
      {
        aula: 37,
        titulo: 'Class 37 · The Internet of Things',
        atividades: [
          { num: 1, titulo: 'Smart gadgets', tipo: 'Escute e escolha', treina: 'Escuta · Gadgets', minutos: '10 - 12', questoes: 24 },
          { num: 2, titulo: 'The, a or nothing?', tipo: 'Monte a frase', treina: 'Escrita · Artigos', minutos: '10 - 12', questoes: 20 },
          { num: 3, titulo: 'A smart home', tipo: 'Qual é a próxima fala?', treina: 'Leitura · Diálogo', minutos: '10 - 12', questoes: 20 },
          { num: 4, titulo: 'Technology in my life', tipo: 'Escute e grave', treina: 'Fala · Tecnologia', minutos: '12 - 15', questoes: 20, microfone: true },
          { num: 5, titulo: 'Articles: the, a, an', tipo: 'Make a Choice', treina: 'Gramática', minutos: '10 - 12', questoes: 24 }
        ]
      },
      {
        aula: 38,
        titulo: 'Class 38 and 39 · Family on Tour',
        atividades: [
          { num: 1, parte: 'Class 38', titulo: 'When did it happen?', tipo: 'Escute e escolha', treina: 'Escuta · Tempos verbais', minutos: '10 - 12', questoes: 24 },
          { num: 2, parte: 'Class 38', titulo: "We've visited 50 countries", tipo: 'Monte a frase', treina: 'Escrita · Present perfect', minutos: '10 - 12', questoes: 20 },
          { num: 3, parte: 'Class 38', titulo: 'A family on tour', tipo: 'Qual é a próxima fala?', treina: 'Leitura · Diálogo', minutos: '10 - 12', questoes: 20 },
          { num: 4, parte: 'Class 38', titulo: 'What have you done?', tipo: 'Escute e grave', treina: 'Fala · Present perfect', minutos: '12 - 15', questoes: 20, microfone: true },
          { num: 5, parte: 'Class 38', titulo: 'Present perfect', tipo: 'Make a Choice', treina: 'Gramática', minutos: '10 - 12', questoes: 24 },
          { num: 6, parte: 'Class 39', titulo: 'Which participle?', tipo: 'Escute e escolha', treina: 'Escuta · Particípios', minutos: '10 - 12', questoes: 24 },
          { num: 7, parte: 'Class 39', titulo: 'Have you ever...?', tipo: 'Monte a frase', treina: 'Escrita · Ever / never', minutos: '10 - 12', questoes: 20 },
          { num: 8, parte: 'Class 39', titulo: 'Travel experiences', tipo: 'Qual é a próxima fala?', treina: 'Leitura · Diálogo', minutos: '10 - 12', questoes: 20 },
          { num: 9, parte: 'Class 39', titulo: 'Have you ever been there?', tipo: 'Escute e grave', treina: 'Fala · Experiências', minutos: '12 - 15', questoes: 20, microfone: true },
          { num: 10, parte: 'Class 39', titulo: 'Irregular past participles', tipo: 'Make a Choice', treina: 'Gramática · Particípios', minutos: '10 - 12', questoes: 24 }
        ]
      },
      {
        aula: 40,
        titulo: 'Class 40 and 41 · Grab and Go!',
        atividades: [
          { num: 1, parte: 'Class 40', titulo: 'At the store', tipo: 'Escute e escolha', treina: 'Escuta · Compras', minutos: '10 - 12', questoes: 24 },
          { num: 2, parte: 'Class 40', titulo: 'Grab it and go', tipo: 'Monte a frase', treina: 'Escrita · Compras', minutos: '10 - 12', questoes: 20 },
          { num: 3, parte: 'Class 40', titulo: 'A new way to shop', tipo: 'Qual é a próxima fala?', treina: 'Leitura · Diálogo', minutos: '10 - 12', questoes: 20 },
          { num: 4, parte: 'Class 40', titulo: 'How do you shop?', tipo: 'Escute e grave', treina: 'Fala · Compras', minutos: '12 - 15', questoes: 20, microfone: true },
          { num: 5, parte: 'Class 40', titulo: 'Shopping words', tipo: 'Make a Choice', treina: 'Gramática · Vocabulário', minutos: '10 - 12', questoes: 24 },
          { num: 6, parte: 'Class 41', titulo: 'Been, gone or when?', tipo: 'Escute e escolha', treina: 'Escuta · Been / gone', minutos: '10 - 12', questoes: 24 },
          { num: 7, parte: 'Class 41', titulo: 'Have you or did you?', tipo: 'Monte a frase', treina: 'Escrita · Present perfect x past', minutos: '10 - 12', questoes: 20 },
          { num: 8, parte: 'Class 41', titulo: 'Have you ever shopped online?', tipo: 'Qual é a próxima fala?', treina: 'Leitura · Diálogo', minutos: '10 - 12', questoes: 20 },
          { num: 9, parte: 'Class 41', titulo: 'My shopping experiences', tipo: 'Escute e grave', treina: 'Fala · Experiências', minutos: '12 - 15', questoes: 20, microfone: true },
          { num: 10, parte: 'Class 41', titulo: 'Present perfect or past simple?', tipo: 'Make a Choice', treina: 'Gramática', minutos: '10 - 12', questoes: 24 }
        ]
      },
      {
        aula: 42,
        titulo: 'Class 42 · Ask Me a Question',
        atividades: [
          { num: 1, titulo: 'Short answers', tipo: 'Escute e escolha', treina: 'Escuta · Short answers', minutos: '10 - 12', questoes: 24 },
          { num: 2, titulo: 'Questions for an influencer', tipo: 'Monte a frase', treina: 'Escrita · Perguntas', minutos: '10 - 12', questoes: 20 },
          { num: 3, titulo: 'Q&A with a travel influencer', tipo: 'Qual é a próxima fala?', treina: 'Leitura · Diálogo', minutos: '10 - 12', questoes: 20 },
          { num: 4, titulo: 'Ask me a question', tipo: 'Escute e grave', treina: 'Fala · Perguntas e entonação', minutos: '12 - 15', questoes: 20, microfone: true },
          { num: 5, titulo: 'Questions in all tenses', tipo: 'Make a Choice', treina: 'Gramática · Perguntas em todos os tempos', minutos: '10 - 12', questoes: 24 }
        ]
      },
      {
        aula: 43,
        titulo: 'Class 43 · Review Classes 34-43',
        atividades: [
          { num: 1, titulo: 'What kind of sentence?', tipo: 'Escute e escolha', treina: 'Escuta · Revisão', minutos: '10 - 12', questoes: 24 },
          { num: 2, titulo: 'Review: make the sentence', tipo: 'Monte a frase', treina: 'Escrita · Revisão', minutos: '10 - 12', questoes: 20 },
          { num: 3, titulo: 'End of the course', tipo: 'Qual é a próxima fala?', treina: 'Leitura · Diálogo', minutos: '10 - 12', questoes: 20 },
          { num: 4, titulo: 'Can you do it?', tipo: 'Escute e grave', treina: 'Fala · Revisão', minutos: '12 - 15', questoes: 20, microfone: true },
          { num: 5, titulo: 'Review: grammar', tipo: 'Make a Choice', treina: 'Gramática · Revisão', minutos: '10 - 12', questoes: 24 }
        ]
      }
    ]
  },
  'pre-a1-black': {
    course: 'ativ-pre-a1-black',
    nome: 'Pre-A1 BLACK',
    extra: true,
    aulas: [
      {
        aula: 1,
        titulo: 'Class 01 and 02 · Meet a Pop Group',
        atividades: [
          { num: 1, titulo: 'Where are they from?', tipo: 'Escute e escolha', treina: 'Escuta · Países', minutos: '10 - 12', questoes: 24 },
          { num: 2, titulo: 'How old are they?', tipo: 'Escute e escolha', treina: 'Escuta · Números 1-20', minutos: '10 - 12', questoes: 24 },
          { num: 3, titulo: 'Introduce yourself', tipo: 'Monte a frase', treina: 'Escrita · Nome, país e idade', minutos: '10 - 12', questoes: 20 },
          { num: 4, titulo: 'He, she, we, they', tipo: 'Monte a frase', treina: 'Escrita · Pronomes', minutos: '10 - 12', questoes: 20 },
          { num: 5, titulo: "Hello, I'm Mei!", tipo: 'Qual é a próxima fala?', treina: 'Leitura · Diálogo', minutos: '10 - 12', questoes: 20 },
          { num: 6, titulo: 'Meet Star Five', tipo: 'Qual é a próxima fala?', treina: 'Leitura · Diálogo', minutos: '10 - 12', questoes: 20 },
          { num: 7, titulo: 'This is me!', tipo: 'Escute e grave', treina: 'Fala · Apresentação', minutos: '12 - 15', questoes: 20, microfone: true },
          { num: 8, titulo: 'Famous friends', tipo: 'Escute e grave', treina: 'Fala · Pronomes', minutos: '12 - 15', questoes: 20, microfone: true },
          { num: 9, titulo: 'Am, is, are', tipo: 'Make a Choice', treina: 'Gramática · To be', minutos: '10 - 12', questoes: 24 },
          { num: 10, titulo: 'Subject pronouns', tipo: 'Make a Choice', treina: 'Gramática · Pronomes', minutos: '10 - 12', questoes: 24 }
        ]
      },
      {
        aula: 3,
        titulo: 'Class 03 · Guess the Country!',
        atividades: [
          { num: 1, titulo: 'What nationality?', tipo: 'Escute e escolha', treina: 'Escuta · Nacionalidades', minutos: '10 - 12', questoes: 24 },
          { num: 2, titulo: 'Is or isn\'t?', tipo: 'Escute e escolha', treina: 'Escuta · To be negativo', minutos: '10 - 12', questoes: 24 },
          { num: 3, titulo: "You're Brazilian!", tipo: 'Monte a frase', treina: 'Escrita · Nacionalidades', minutos: '10 - 12', questoes: 20 },
          { num: 4, titulo: 'Not true!', tipo: 'Monte a frase', treina: 'Escrita · To be negativo', minutos: '10 - 12', questoes: 20 },
          { num: 5, titulo: 'Guess the nationality!', tipo: 'Qual é a próxima fala?', treina: 'Leitura · Diálogo', minutos: '10 - 12', questoes: 20 },
          { num: 6, titulo: 'An international class', tipo: 'Qual é a próxima fala?', treina: 'Leitura · Diálogo', minutos: '10 - 12', questoes: 20 },
          { num: 7, titulo: "I'm from Brazil. I'm Brazilian.", tipo: 'Escute e grave', treina: 'Fala · Nacionalidades', minutos: '12 - 15', questoes: 20, microfone: true },
          { num: 8, titulo: "That's not right!", tipo: 'Escute e grave', treina: 'Fala · To be negativo', minutos: '12 - 15', questoes: 20, microfone: true },
          { num: 9, titulo: 'Country or nationality?', tipo: 'Make a Choice', treina: 'Gramática · País x nacionalidade', minutos: '10 - 12', questoes: 24 },
          { num: 10, titulo: 'Negative form', tipo: 'Make a Choice', treina: 'Gramática · To be negativo', minutos: '10 - 12', questoes: 24 }
        ]
      },
      {
        aula: 4,
        titulo: 'Class 04 · Changing Nationalities?',
        atividades: [
          { num: 1, titulo: 'Yes, he is!', tipo: 'Escute e escolha', treina: 'Escuta · Short answers', minutos: '10 - 12', questoes: 24 },
          { num: 2, titulo: 'Which question?', tipo: 'Escute e escolha', treina: 'Escuta · Perguntas com to be', minutos: '10 - 12', questoes: 24 },
          { num: 3, titulo: 'Make the question', tipo: 'Monte a frase', treina: 'Escrita · Perguntas com to be', minutos: '10 - 12', questoes: 20 },
          { num: 4, titulo: 'Short answers', tipo: 'Monte a frase', treina: 'Escrita · Short answers', minutos: '10 - 12', questoes: 20 },
          { num: 5, titulo: 'From Brazil, but Italian!', tipo: 'Qual é a próxima fala?', treina: 'Leitura · Diálogo', minutos: '10 - 12', questoes: 20 },
          { num: 6, titulo: 'Are you from Mexico?', tipo: 'Qual é a próxima fala?', treina: 'Leitura · Diálogo', minutos: '10 - 12', questoes: 20 },
          { num: 7, titulo: 'Ask the question', tipo: 'Escute e grave', treina: 'Fala · Perguntas', minutos: '12 - 15', questoes: 20, microfone: true },
          { num: 8, titulo: 'Answer the question', tipo: 'Escute e grave', treina: 'Fala · Short answers', minutos: '12 - 15', questoes: 20, microfone: true },
          { num: 9, titulo: 'Am, is or are?', tipo: 'Make a Choice', treina: 'Gramática · Perguntas com to be', minutos: '10 - 12', questoes: 24 },
          { num: 10, titulo: 'Choose the short answer', tipo: 'Make a Choice', treina: 'Gramática · Short answers', minutos: '10 - 12', questoes: 24 }
        ]
      },
      {
        aula: 5,
        titulo: 'Class 05 · Wave your Flag! (Review)',
        atividades: [
          { num: 1, titulo: 'Guess the flag!', tipo: 'Escute e escolha', treina: 'Escuta · Cores e bandeiras', minutos: '10 - 12', questoes: 24 },
          { num: 2, titulo: 'Words from the song', tipo: 'Escute e escolha', treina: 'Escuta · Vocabulário', minutos: '10 - 12', questoes: 24 },
          { num: 3, titulo: 'Flags and colors', tipo: 'Monte a frase', treina: 'Escrita · Cores', minutos: '10 - 12', questoes: 20 },
          { num: 4, titulo: 'Review: to be', tipo: 'Monte a frase', treina: 'Escrita · Revisão', minutos: '10 - 12', questoes: 20 },
          { num: 5, titulo: 'Interview a classmate', tipo: 'Qual é a próxima fala?', treina: 'Leitura · Diálogo', minutos: '10 - 12', questoes: 20 },
          { num: 6, titulo: 'Design your flag', tipo: 'Qual é a próxima fala?', treina: 'Leitura · Diálogo', minutos: '10 - 12', questoes: 20 },
          { num: 7, titulo: 'Describe the flag', tipo: 'Escute e grave', treina: 'Fala · Cores', minutos: '12 - 15', questoes: 20, microfone: true },
          { num: 8, titulo: 'All about me', tipo: 'Escute e grave', treina: 'Fala · Revisão', minutos: '12 - 15', questoes: 20, microfone: true },
          { num: 9, titulo: 'Review: positive, negative, question', tipo: 'Make a Choice', treina: 'Gramática · To be (revisão)', minutos: '10 - 12', questoes: 24 },
          { num: 10, titulo: 'Review: countries, numbers and colors', tipo: 'Make a Choice', treina: 'Gramática · Revisão', minutos: '10 - 12', questoes: 24 }
        ]
      },
      {
        aula: 6,
        titulo: 'Class 06 and 07 · In a Hotel',
        atividades: [
          { num: 1, titulo: 'At the hotel', tipo: 'Escute e escolha', treina: 'Escuta · Vocabulário do hotel', minutos: '10 - 12', questoes: 24 },
          { num: 2, titulo: 'How do you spell it?', tipo: 'Escute e escolha', treina: 'Escuta · Alfabeto', minutos: '10 - 12', questoes: 24 },
          { num: 3, titulo: 'Registration form', tipo: 'Monte a frase', treina: 'Escrita · Perguntas da ficha', minutos: '10 - 12', questoes: 20 },
          { num: 4, titulo: 'My hotel room', tipo: 'Monte a frase', treina: 'Escrita · Vocabulário do hotel', minutos: '10 - 12', questoes: 20 },
          { num: 5, titulo: 'Check-in', tipo: 'Qual é a próxima fala?', treina: 'Leitura · Diálogo', minutos: '10 - 12', questoes: 20 },
          { num: 6, titulo: 'Calling reception', tipo: 'Qual é a próxima fala?', treina: 'Leitura · Diálogo', minutos: '10 - 12', questoes: 20 },
          { num: 7, titulo: 'Hotel words', tipo: 'Escute e grave', treina: 'Fala · Vocabulário do hotel', minutos: '12 - 15', questoes: 20, microfone: true },
          { num: 8, titulo: 'At the reception desk', tipo: 'Escute e grave', treina: 'Fala · Check-in', minutos: '12 - 15', questoes: 20, microfone: true },
          { num: 9, titulo: 'The registration form', tipo: 'Make a Choice', treina: 'Gramática · Perguntas e respostas', minutos: '10 - 12', questoes: 24 },
          { num: 10, titulo: 'Is or are?', tipo: 'Make a Choice', treina: 'Gramática · To be (singular e plural)', minutos: '10 - 12', questoes: 24 }
        ]
      }
    ]
  },
  'a1-black': {
    course: 'ativ-a1-black',
    nome: 'A1 BLACK',
    extra: true,
    aulas: [
      {
        aula: 1,
        titulo: 'Class 01 · Functional Plus: Meeting Someone New',
        atividades: [
          { num: 1, titulo: 'What do you say?', tipo: 'Escute e escolha', treina: 'Escuta · Respostas', minutos: '10 - 12', questoes: 24 },
          { num: 2, titulo: 'Which country?', tipo: 'Escute e escolha', treina: 'Escuta · Países e cidades', minutos: '10 - 12', questoes: 24 },
          { num: 3, titulo: 'Nice to meet you!', tipo: 'Monte a frase', treina: 'Escrita · Apresentações', minutos: '10 - 12', questoes: 20 },
          { num: 4, titulo: 'Where are you from?', tipo: 'Monte a frase', treina: 'Escrita · País e cidade', minutos: '10 - 12', questoes: 20 },
          { num: 5, titulo: 'At a birthday party', tipo: 'Qual é a próxima fala?', treina: 'Leitura · Diálogo', minutos: '10 - 12', questoes: 20 },
          { num: 6, titulo: 'First day of class', tipo: 'Qual é a próxima fala?', treina: 'Leitura · Diálogo', minutos: '10 - 12', questoes: 20 },
          { num: 7, titulo: 'Introduce yourself', tipo: 'Escute e grave', treina: 'Fala · Apresentações', minutos: '12 - 15', questoes: 20, microfone: true },
          { num: 8, titulo: 'Countries and cities', tipo: 'Escute e grave', treina: 'Fala · País e cidade', minutos: '12 - 15', questoes: 20, microfone: true },
          { num: 9, titulo: 'Complete the conversation', tipo: 'Make a Choice', treina: 'Gramática · Diálogos', minutos: '10 - 12', questoes: 24 },
          { num: 10, titulo: 'Questions and answers', tipo: 'Make a Choice', treina: 'Gramática · To be e possessivos', minutos: '10 - 12', questoes: 24 }
        ]
      },
      {
        aula: 2,
        titulo: 'Class 02 · Functional Plus: Everyday Small Talk with Strangers',
        atividades: [
          { num: 1, titulo: 'Small talk replies', tipo: 'Escute e escolha', treina: 'Escuta · Respostas', minutos: '10 - 12', questoes: 24 },
          { num: 2, titulo: "What's the topic?", tipo: 'Escute e escolha', treina: 'Escuta · Tópicos', minutos: '10 - 12', questoes: 24 },
          { num: 3, titulo: 'Start a conversation', tipo: 'Monte a frase', treina: 'Escrita · Small talk', minutos: '10 - 12', questoes: 20 },
          { num: 4, titulo: 'Answer and finish', tipo: 'Monte a frase', treina: 'Escrita · Respostas e despedidas', minutos: '10 - 12', questoes: 20 },
          { num: 5, titulo: 'At the bus stop', tipo: 'Qual é a próxima fala?', treina: 'Leitura · Diálogo', minutos: '10 - 12', questoes: 20 },
          { num: 6, titulo: 'In the coffee line', tipo: 'Qual é a próxima fala?', treina: 'Leitura · Diálogo', minutos: '10 - 12', questoes: 20 },
          { num: 7, titulo: 'Talk about the weather', tipo: 'Escute e grave', treina: 'Fala · Tempo', minutos: '12 - 15', questoes: 20, microfone: true },
          { num: 8, titulo: 'Busy day, good luck!', tipo: 'Escute e grave', treina: 'Fala · Rotina e despedidas', minutos: '12 - 15', questoes: 20, microfone: true },
          { num: 9, titulo: 'Complete the small talk', tipo: 'Make a Choice', treina: 'Gramática · Small talk', minutos: '10 - 12', questoes: 24 },
          { num: 10, titulo: 'Questions and reactions', tipo: 'Make a Choice', treina: 'Gramática · Perguntas e reações', minutos: '10 - 12', questoes: 24 }
        ]
      },
      {
        aula: 3,
        titulo: 'Class 03 · Functional Plus: At the Hair Salon / Barber Shop',
        atividades: [
          { num: 1, titulo: 'What would you like?', tipo: 'Escute e escolha', treina: 'Escuta · Serviços', minutos: '10 - 12', questoes: 24 },
          { num: 2, titulo: 'Hair words', tipo: 'Escute e escolha', treina: 'Escuta · Vocabulário', minutos: '10 - 12', questoes: 24 },
          { num: 3, titulo: "I'd like a haircut", tipo: 'Monte a frase', treina: 'Escrita · Falas do cliente', minutos: '10 - 12', questoes: 20 },
          { num: 4, titulo: "The stylist's questions", tipo: 'Monte a frase', treina: 'Escrita · Falas do cabeleireiro', minutos: '10 - 12', questoes: 20 },
          { num: 5, titulo: 'At the hair salon', tipo: 'Qual é a próxima fala?', treina: 'Leitura · Diálogo', minutos: '10 - 12', questoes: 20 },
          { num: 6, titulo: 'At the barber shop', tipo: 'Qual é a próxima fala?', treina: 'Leitura · Diálogo', minutos: '10 - 12', questoes: 20 },
          { num: 7, titulo: "I'm the customer", tipo: 'Escute e grave', treina: 'Fala · Cliente', minutos: '12 - 15', questoes: 20, microfone: true },
          { num: 8, titulo: "I'm the stylist", tipo: 'Escute e grave', treina: 'Fala · Cabeleireiro', minutos: '12 - 15', questoes: 20, microfone: true },
          { num: 9, titulo: 'Would you like...?', tipo: 'Make a Choice', treina: 'Gramática · Would like', minutos: '10 - 12', questoes: 24 },
          { num: 10, titulo: 'Salon vocabulary', tipo: 'Make a Choice', treina: 'Gramática · Vocabulário', minutos: '10 - 12', questoes: 24 }
        ]
      },
      {
        aula: 4,
        titulo: 'Class 04 · Functional Plus: Ordering Food - Drive-Thru',
        atividades: [
          { num: 1, titulo: 'Main, side, drink or dessert?', tipo: 'Escute e escolha', treina: 'Escuta · Partes do menu', minutos: '10 - 12', questoes: 24 },
          { num: 2, titulo: 'Small, medium or large?', tipo: 'Escute e escolha', treina: 'Escuta · Tamanhos', minutos: '10 - 12', questoes: 24 },
          { num: 3, titulo: "I'll have...", tipo: 'Monte a frase', treina: 'Escrita · Pedidos', minutos: '10 - 12', questoes: 20 },
          { num: 4, titulo: 'The cashier says...', tipo: 'Monte a frase', treina: 'Escrita · Falas do atendente', minutos: '10 - 12', questoes: 20 },
          { num: 5, titulo: 'At the drive-thru', tipo: 'Qual é a próxima fala?', treina: 'Leitura · Diálogo', minutos: '10 - 12', questoes: 20 },
          { num: 6, titulo: 'A family order', tipo: 'Qual é a próxima fala?', treina: 'Leitura · Diálogo', minutos: '10 - 12', questoes: 20 },
          { num: 7, titulo: 'Place your order', tipo: 'Escute e grave', treina: 'Fala · Pedidos', minutos: '12 - 15', questoes: 20, microfone: true },
          { num: 8, titulo: 'You are the cashier', tipo: 'Escute e grave', treina: 'Fala · Atendente', minutos: '12 - 15', questoes: 20, microfone: true },
          { num: 9, titulo: "I'll have, I'd like, Can I have?", tipo: 'Make a Choice', treina: "Gramática · I'll have / a, an", minutos: '10 - 12', questoes: 24 },
          { num: 10, titulo: 'Drive-thru talk', tipo: 'Make a Choice', treina: 'Gramática · Perguntas e respostas', minutos: '10 - 12', questoes: 24 }
        ]
      },
      {
        aula: 5,
        titulo: 'Class 05 and 06 · Functional Plus: Buying Clothes at a Store',
        atividades: [
          { num: 1, titulo: 'What are they wearing?', tipo: 'Escute e escolha', treina: 'Escuta · Roupas e cores', minutos: '10 - 12', questoes: 24 },
          { num: 2, titulo: 'What does the customer want?', tipo: 'Escute e escolha', treina: 'Escuta · Funções', minutos: '10 - 12', questoes: 24 },
          { num: 3, titulo: 'The customer asks', tipo: 'Monte a frase', treina: 'Escrita · Falas do cliente', minutos: '10 - 12', questoes: 20 },
          { num: 4, titulo: 'The shop assistant answers', tipo: 'Monte a frase', treina: 'Escrita · Falas do vendedor', minutos: '10 - 12', questoes: 20 },
          { num: 5, titulo: 'At the clothing store', tipo: 'Qual é a próxima fala?', treina: 'Leitura · Diálogo', minutos: '10 - 12', questoes: 20 },
          { num: 6, titulo: 'Shopping for sneakers', tipo: 'Qual é a próxima fala?', treina: 'Leitura · Diálogo', minutos: '10 - 12', questoes: 20 },
          { num: 7, titulo: "I'm the customer", tipo: 'Escute e grave', treina: 'Fala · Cliente', minutos: '12 - 15', questoes: 20, microfone: true },
          { num: 8, titulo: "I'm the shop assistant", tipo: 'Escute e grave', treina: 'Fala · Vendedor', minutos: '12 - 15', questoes: 20, microfone: true },
          { num: 9, titulo: 'It or them? This or these?', tipo: 'Make a Choice', treina: 'Gramática · it/them, this/these', minutos: '10 - 12', questoes: 24 },
          { num: 10, titulo: 'What can you say?', tipo: 'Make a Choice', treina: 'Gramática · Situações', minutos: '10 - 12', questoes: 24 }
        ]
      },
      {
        aula: 7,
        titulo: 'Class 07 · Functional Plus: Health & Emergency Basics',
        atividades: [
          { num: 1, titulo: "What's wrong?", tipo: 'Escute e escolha', treina: 'Escuta · Problemas de saúde', minutos: '10 - 12', questoes: 24 },
          { num: 2, titulo: 'Choose the best response', tipo: 'Escute e escolha', treina: 'Escuta · Respostas', minutos: '10 - 12', questoes: 24 },
          { num: 3, titulo: 'I have a headache', tipo: 'Monte a frase', treina: 'Escrita · Problemas de saúde', minutos: '10 - 12', questoes: 20 },
          { num: 4, titulo: 'Asking for help', tipo: 'Monte a frase', treina: 'Escrita · Pedir ajuda', minutos: '10 - 12', questoes: 20 },
          { num: 5, titulo: 'At the pharmacy', tipo: 'Qual é a próxima fala?', treina: 'Leitura · Diálogo', minutos: '10 - 12', questoes: 20 },
          { num: 6, titulo: 'At the hotel reception', tipo: 'Qual é a próxima fala?', treina: 'Leitura · Diálogo', minutos: '10 - 12', questoes: 20 },
          { num: 7, titulo: "Say what's wrong", tipo: 'Escute e grave', treina: 'Fala · Problemas de saúde', minutos: '12 - 15', questoes: 20, microfone: true },
          { num: 8, titulo: 'Ask for help', tipo: 'Escute e grave', treina: 'Fala · Pedir ajuda', minutos: '12 - 15', questoes: 20, microfone: true },
          { num: 9, titulo: 'Have or hurt?', tipo: 'Make a Choice', treina: 'Gramática · have / hurts', minutos: '10 - 12', questoes: 24 },
          { num: 10, titulo: 'Help in every place', tipo: 'Make a Choice', treina: 'Gramática · Situações', minutos: '10 - 12', questoes: 24 }
        ]
      }
    ]
  },
  'a2-black': {
    course: 'ativ-a2-black',
    nome: 'A2 BLACK',
    extra: true,
    aulas: [
      {
        aula: 1,
        titulo: 'Class 01 · Who am I?',
        atividades: [
          { num: 1, titulo: "What's your zodiac sign?", tipo: 'Escute e escolha', treina: 'Escuta · Datas e signos', minutos: '10 - 12', questoes: 24 },
          { num: 2, titulo: 'When were you born?', tipo: 'Escute e escolha', treina: 'Escuta · Datas', minutos: '10 - 12', questoes: 24 },
          { num: 3, titulo: 'Self-introduction questions', tipo: 'Monte a frase', treina: 'Escrita · Perguntas', minutos: '10 - 12', questoes: 20 },
          { num: 4, titulo: 'This is me!', tipo: 'Monte a frase', treina: 'Escrita · Apresentação', minutos: '10 - 12', questoes: 20 },
          { num: 5, titulo: 'Meet the new student', tipo: 'Qual é a próxima fala?', treina: 'Leitura · Diálogo', minutos: '10 - 12', questoes: 20 },
          { num: 6, titulo: 'A self-introduction video', tipo: 'Qual é a próxima fala?', treina: 'Leitura · Diálogo', minutos: '10 - 12', questoes: 20 },
          { num: 7, titulo: 'My self-introduction', tipo: 'Escute e grave', treina: 'Fala · Apresentação', minutos: '12 - 15', questoes: 20, microfone: true },
          { num: 8, titulo: 'Ask about you', tipo: 'Escute e grave', treina: 'Fala · Perguntas e respostas', minutos: '12 - 15', questoes: 20, microfone: true },
          { num: 9, titulo: 'Born on, interested in', tipo: 'Make a Choice', treina: 'Gramática · Estruturas da apresentação', minutos: '10 - 12', questoes: 24 },
          { num: 10, titulo: 'Self-introduction ideas', tipo: 'Make a Choice', treina: 'Gramática · Vocabulário', minutos: '10 - 12', questoes: 24 }
        ]
      },
      {
        aula: 2,
        titulo: 'Class 02 · I Want It That Way - Backstreet Boys',
        atividades: [
          { num: 1, titulo: 'Find the rhyme', tipo: 'Escute e escolha', treina: 'Escuta · Rimas', minutos: '10 - 12', questoes: 24 },
          { num: 2, titulo: 'Song words', tipo: 'Escute e escolha', treina: 'Escuta · Vocabulário', minutos: '10 - 12', questoes: 24 },
          { num: 3, titulo: 'Famous bands', tipo: 'Monte a frase', treina: 'Escrita · To be', minutos: '10 - 12', questoes: 20 },
          { num: 4, titulo: 'Am I? Is she? Are they?', tipo: 'Monte a frase', treina: 'Escrita · Perguntas e negativas', minutos: '10 - 12', questoes: 20 },
          { num: 5, titulo: 'My favourite boy band', tipo: 'Qual é a próxima fala?', treina: 'Leitura · Diálogo', minutos: '10 - 12', questoes: 20 },
          { num: 6, titulo: 'Music quiz night', tipo: 'Qual é a próxima fala?', treina: 'Leitura · Diálogo', minutos: '10 - 12', questoes: 20 },
          { num: 7, titulo: 'My favourite band', tipo: 'Escute e grave', treina: 'Fala · To be', minutos: '12 - 15', questoes: 20, microfone: true },
          { num: 8, titulo: 'Words and rhymes', tipo: 'Escute e grave', treina: 'Fala · Vocabulário e pronúncia', minutos: '12 - 15', questoes: 20, microfone: true },
          { num: 9, titulo: 'Am, is or are?', tipo: 'Make a Choice', treina: 'Gramática · To be', minutos: '10 - 12', questoes: 24 },
          { num: 10, titulo: 'Song vocabulary', tipo: 'Make a Choice', treina: 'Gramática · Vocabulário e perguntas', minutos: '10 - 12', questoes: 24 }
        ]
      },
      {
        aula: 3,
        titulo: 'Class 03 · No Foundation/Concealer Makeup Look for Summers',
        atividades: [
          { num: 1, titulo: 'Where do you apply it?', tipo: 'Escute e escolha', treina: 'Escuta · Vocabulário de maquiagem', minutos: '10 - 12', questoes: 24 },
          { num: 2, titulo: 'Apply or applies?', tipo: 'Escute e escolha', treina: 'Escuta · Present simple', minutos: '10 - 12', questoes: 24 },
          { num: 3, titulo: 'My makeup routine', tipo: 'Monte a frase', treina: 'Escrita · Rotina', minutos: '10 - 12', questoes: 20 },
          { num: 4, titulo: 'She applies, he uses', tipo: 'Monte a frase', treina: 'Escrita · Terceira pessoa', minutos: '10 - 12', questoes: 20 },
          { num: 5, titulo: 'A natural look', tipo: 'Qual é a próxima fala?', treina: 'Leitura · Diálogo', minutos: '10 - 12', questoes: 20 },
          { num: 6, titulo: "My brother's skincare routine", tipo: 'Qual é a próxima fala?', treina: 'Leitura · Diálogo', minutos: '10 - 12', questoes: 20 },
          { num: 7, titulo: 'Describe your routine', tipo: 'Escute e grave', treina: 'Fala · Rotina', minutos: '12 - 15', questoes: 20, microfone: true },
          { num: 8, titulo: 'Her routine, his routine', tipo: 'Escute e grave', treina: 'Fala · Terceira pessoa', minutos: '12 - 15', questoes: 20, microfone: true },
          { num: 9, titulo: 'Third person spelling', tipo: 'Make a Choice', treina: 'Gramática · -s, -es, -ies', minutos: '10 - 12', questoes: 24 },
          { num: 10, titulo: 'What is it for?', tipo: 'Make a Choice', treina: 'Gramática · Vocabulário', minutos: '10 - 12', questoes: 24 }
        ]
      },
      {
        aula: 4,
        titulo: "Class 04 and 05 · A Celebrity's Routine",
        atividades: [
          { num: 1, titulo: 'Daily routine', tipo: 'Escute e escolha', treina: 'Escuta · Rotina', minutos: '10 - 12', questoes: 24 },
          { num: 2, titulo: 'Positive, negative or question?', tipo: 'Escute e escolha', treina: 'Escuta · Present simple', minutos: '10 - 12', questoes: 24 },
          { num: 3, titulo: 'Positive and negative', tipo: 'Monte a frase', treina: 'Escrita · Afirmativa e negativa', minutos: '10 - 12', questoes: 20 },
          { num: 4, titulo: 'Do you...? Does she...?', tipo: 'Monte a frase', treina: 'Escrita · Perguntas', minutos: '10 - 12', questoes: 20 },
          { num: 5, titulo: 'Interview with a pop star', tipo: 'Qual é a próxima fala?', treina: 'Leitura · Diálogo', minutos: '10 - 12', questoes: 20 },
          { num: 6, titulo: 'Our routines', tipo: 'Qual é a próxima fala?', treina: 'Leitura · Diálogo', minutos: '10 - 12', questoes: 20 },
          { num: 7, titulo: 'My routine', tipo: 'Escute e grave', treina: 'Fala · Rotina', minutos: '12 - 15', questoes: 20, microfone: true },
          { num: 8, titulo: 'Her routine', tipo: 'Escute e grave', treina: 'Fala · Terceira pessoa', minutos: '12 - 15', questoes: 20, microfone: true },
          { num: 9, titulo: "Do, does, don't, doesn't", tipo: 'Make a Choice', treina: 'Gramática · Present simple', minutos: '10 - 12', questoes: 24 },
          { num: 10, titulo: 'Routine words and facts', tipo: 'Make a Choice', treina: 'Gramática · Vocabulário e frequência', minutos: '10 - 12', questoes: 24 }
        ]
      },
      {
        aula: 6,
        titulo: "Class 06 · You've Got a Friend in Me",
        atividades: [
          { num: 1, titulo: 'Toys', tipo: 'Escute e escolha', treina: 'Escuta · Brinquedos', minutos: '10 - 12', questoes: 24 },
          { num: 2, titulo: 'Where is it?', tipo: 'Escute e escolha', treina: 'Escuta · Preposições de lugar', minutos: '10 - 12', questoes: 24 },
          { num: 3, titulo: 'In, on, under', tipo: 'Monte a frase', treina: 'Escrita · Preposições de lugar', minutos: '10 - 12', questoes: 20 },
          { num: 4, titulo: 'My bedroom, my favorites', tipo: 'Monte a frase', treina: 'Escrita · Quarto e favoritos', minutos: '10 - 12', questoes: 20 },
          { num: 5, titulo: 'Where is my robot?', tipo: 'Qual é a próxima fala?', treina: 'Leitura · Diálogo', minutos: '10 - 12', questoes: 20 },
          { num: 6, titulo: 'Toy Story fans', tipo: 'Qual é a próxima fala?', treina: 'Leitura · Diálogo', minutos: '10 - 12', questoes: 20 },
          { num: 7, titulo: 'Describe your bedroom', tipo: 'Escute e grave', treina: 'Fala · Preposições de lugar', minutos: '12 - 15', questoes: 20, microfone: true },
          { num: 8, titulo: 'My favorite toy', tipo: 'Escute e grave', treina: 'Fala · Brinquedos e favoritos', minutos: '12 - 15', questoes: 20, microfone: true },
          { num: 9, titulo: 'Prepositions of place', tipo: 'Make a Choice', treina: 'Gramática · in, on, under, next to, behind', minutos: '10 - 12', questoes: 24 },
          { num: 10, titulo: 'Toys and bedroom objects', tipo: 'Make a Choice', treina: 'Gramática · Vocabulário', minutos: '10 - 12', questoes: 24 }
        ]
      },
      {
        aula: 7,
        titulo: 'Class 07 · Queen Charlotte',
        atividades: [
          { num: 1, titulo: 'How do they do it?', tipo: 'Escute e escolha', treina: 'Escuta · Advérbios', minutos: '10 - 12', questoes: 24 },
          { num: 2, titulo: 'Formal or informal?', tipo: 'Escute e escolha', treina: 'Escuta · Vocabulário formal e informal', minutos: '10 - 12', questoes: 24 },
          { num: 3, titulo: 'Adverbs in sentences', tipo: 'Monte a frase', treina: 'Escrita · Advérbios', minutos: '10 - 12', questoes: 20 },
          { num: 4, titulo: 'Advice and favorites', tipo: 'Monte a frase', treina: 'Escrita · Conselhos e vocabulário', minutos: '10 - 12', questoes: 20 },
          { num: 5, titulo: 'Talking about Queen Charlotte', tipo: 'Qual é a próxima fala?', treina: 'Leitura · Diálogo', minutos: '10 - 12', questoes: 20 },
          { num: 6, titulo: 'At the royal ball', tipo: 'Qual é a próxima fala?', treina: 'Leitura · Diálogo', minutos: '10 - 12', questoes: 20 },
          { num: 7, titulo: 'Things I do well', tipo: 'Escute e grave', treina: 'Fala · Advérbios', minutos: '12 - 15', questoes: 20, microfone: true },
          { num: 8, titulo: 'Advice and formal words', tipo: 'Escute e grave', treina: 'Fala · Conselhos e vocabulário', minutos: '12 - 15', questoes: 20, microfone: true },
          { num: 9, titulo: 'Adjective to adverb', tipo: 'Make a Choice', treina: 'Gramática · Formação de advérbios', minutos: '10 - 12', questoes: 24 },
          { num: 10, titulo: 'Using adverbs', tipo: 'Make a Choice', treina: 'Gramática · Uso dos advérbios', minutos: '10 - 12', questoes: 24 }
        ]
      }
    ]
  },
  b1: {
    course: 'ativ-b1',
    nome: 'B1',
    aulas: [
      {
        aula: 1,
        titulo: 'Class 01 · Are you a language learner?',
        atividades: [
          { num: 1, titulo: "What's the best answer?", tipo: 'Escute e escolha', treina: 'Escuta · Perguntas pessoais', minutos: '10 - 12', questoes: 24 },
          { num: 2, titulo: 'Questions in the right order', tipo: 'Monte a frase', treina: 'Escrita · Ordem das palavras', minutos: '10 - 12', questoes: 20 },
          { num: 3, titulo: 'Meet a language lover', tipo: 'Qual é a próxima fala?', treina: 'Leitura · Diálogo', minutos: '10 - 12', questoes: 20 },
          { num: 4, titulo: 'Questions and answers about you', tipo: 'Escute e grave', treina: 'Fala · Perguntas e respostas', minutos: '12 - 15', questoes: 20, microfone: true },
          { num: 5, titulo: 'Word order in questions', tipo: 'Make a Choice', treina: 'Gramática · Perguntas', minutos: '10 - 12', questoes: 24 }
        ]
      },
      {
        aula: 2,
        titulo: 'Class 02 and 03 · An important decision',
        atividades: [
          { num: 1, parte: 'Class 02', titulo: 'In, on or at: what kind?', tipo: 'Escute e escolha', treina: 'Escuta · Preposições', minutos: '10 - 12', questoes: 24 },
          { num: 2, parte: 'Class 02', titulo: 'Living abroad with in, on, at', tipo: 'Monte a frase', treina: 'Escrita · Preposições', minutos: '10 - 12', questoes: 20 },
          { num: 3, parte: 'Class 02', titulo: 'A new life in Dublin', tipo: 'Qual é a próxima fala?', treina: 'Leitura · Diálogo', minutos: '10 - 12', questoes: 20 },
          { num: 4, parte: 'Class 02', titulo: 'Talking about living abroad', tipo: 'Escute e grave', treina: 'Fala · Morar fora', minutos: '12 - 15', questoes: 20, microfone: true },
          { num: 5, parte: 'Class 02', titulo: 'In, on or at?', tipo: 'Make a Choice', treina: 'Gramática · Preposições', minutos: '10 - 12', questoes: 24 },
          { num: 6, parte: 'Class 03', titulo: 'What interrupted the action?', tipo: 'Escute e escolha', treina: 'Escuta · Past continuous', minutos: '10 - 12', questoes: 24 },
          { num: 7, parte: 'Class 03', titulo: 'When and while', tipo: 'Monte a frase', treina: 'Escrita · Past simple e continuous', minutos: '10 - 12', questoes: 20 },
          { num: 8, parte: 'Class 03', titulo: 'The moment that changed my life', tipo: 'Qual é a próxima fala?', treina: 'Leitura · Diálogo', minutos: '10 - 12', questoes: 20 },
          { num: 9, parte: 'Class 03', titulo: 'Tell your story', tipo: 'Escute e grave', treina: 'Fala · Past simple e continuous', minutos: '12 - 15', questoes: 20, microfone: true },
          { num: 10, parte: 'Class 03', titulo: 'Past simple or past continuous?', tipo: 'Make a Choice', treina: 'Gramática · Past simple e continuous', minutos: '10 - 12', questoes: 24 }
        ]
      },
      {
        aula: 4,
        titulo: 'Class 04 and 05 · Food, facts and fun',
        atividades: [
          { num: 1, parte: 'Class 04', titulo: 'Which sense is it?', tipo: 'Escute e escolha', treina: 'Escuta · Verbos de sentido', minutos: '10 - 12', questoes: 24 },
          { num: 2, parte: 'Class 04', titulo: 'It looks, it tastes, it smells', tipo: 'Monte a frase', treina: 'Escrita · Verbos de sentido', minutos: '10 - 12', questoes: 20 },
          { num: 3, parte: 'Class 04', titulo: 'Breakfasts around the world', tipo: 'Qual é a próxima fala?', treina: 'Leitura · Diálogo', minutos: '10 - 12', questoes: 20 },
          { num: 4, parte: 'Class 04', titulo: 'Describing food', tipo: 'Escute e grave', treina: 'Fala · Comida e sentidos', minutos: '12 - 15', questoes: 20, microfone: true },
          { num: 5, parte: 'Class 04', titulo: 'Verbs of senses', tipo: 'Make a Choice', treina: 'Gramática · Verbos de sentido', minutos: '10 - 12', questoes: 24 },
          { num: 6, parte: 'Class 05', titulo: 'Have they done it?', tipo: 'Escute e escolha', treina: 'Escuta · Present perfect', minutos: '10 - 12', questoes: 24 },
          { num: 7, parte: 'Class 05', titulo: 'My food experiences', tipo: 'Monte a frase', treina: 'Escrita · Present perfect', minutos: '10 - 12', questoes: 20 },
          { num: 8, parte: 'Class 05', titulo: 'My food experience passport', tipo: 'Qual é a próxima fala?', treina: 'Leitura · Diálogo', minutos: '10 - 12', questoes: 20 },
          { num: 9, parte: 'Class 05', titulo: 'Have you ever...?', tipo: 'Escute e grave', treina: 'Fala · Experiências', minutos: '12 - 15', questoes: 20, microfone: true },
          { num: 10, parte: 'Class 05', titulo: 'Present perfect for experiences', tipo: 'Make a Choice', treina: 'Gramática · Present perfect', minutos: '10 - 12', questoes: 24 }
        ]
      },
      {
        aula: 6,
        titulo: 'Class 06 · Unlock your cleaning motivation',
        atividades: [
          { num: 1, titulo: 'Which chore is it?', tipo: 'Escute e escolha', treina: 'Escuta · Tarefas domésticas', minutos: '10 - 12', questoes: 24 },
          { num: 2, titulo: 'Just, already, yet', tipo: 'Monte a frase', treina: 'Escrita · Present perfect', minutos: '10 - 12', questoes: 20 },
          { num: 3, titulo: 'Saturday cleaning', tipo: 'Qual é a próxima fala?', treina: 'Leitura · Diálogo', minutos: '10 - 12', questoes: 20 },
          { num: 4, titulo: 'What have you done today?', tipo: 'Escute e grave', treina: 'Fala · Tarefas e present perfect', minutos: '12 - 15', questoes: 20, microfone: true },
          { num: 5, titulo: 'Housework and the present perfect', tipo: 'Make a Choice', treina: 'Gramática · Just, already, yet', minutos: '10 - 12', questoes: 24 }
        ]
      },
      {
        aula: 7,
        titulo: "Class 07 and 08 · There's nothing like it!",
        atividades: [
          { num: 1, parte: 'Class 07', titulo: 'Nobody, nowhere or nothing?', tipo: 'Escute e escolha', treina: 'Escuta · Pronomes indefinidos', minutos: '10 - 12', questoes: 24 },
          { num: 2, parte: 'Class 07', titulo: 'Somebody, anything, nowhere', tipo: 'Monte a frase', treina: 'Escrita · Pronomes indefinidos', minutos: '10 - 12', questoes: 20 },
          { num: 3, parte: 'Class 07', titulo: 'The forgotten birthday', tipo: 'Qual é a próxima fala?', treina: 'Leitura · Diálogo', minutos: '10 - 12', questoes: 20 },
          { num: 4, parte: 'Class 07', titulo: 'Somebody, anybody, nobody', tipo: 'Escute e grave', treina: 'Fala · Pronomes indefinidos', minutos: '12 - 15', questoes: 20, microfone: true },
          { num: 5, parte: 'Class 07', titulo: 'Indefinite pronouns', tipo: 'Make a Choice', treina: 'Gramática · Pronomes indefinidos', minutos: '10 - 12', questoes: 24 },
          { num: 6, parte: 'Class 08', titulo: 'Did the plan happen?', tipo: 'Escute e escolha', treina: 'Escuta · Be going to', minutos: '10 - 12', questoes: 24 },
          { num: 7, parte: 'Class 08', titulo: 'I was going to...', tipo: 'Monte a frase', treina: 'Escrita · Was going to', minutos: '10 - 12', questoes: 20 },
          { num: 8, parte: 'Class 08', titulo: 'My first day at work', tipo: 'Qual é a próxima fala?', treina: 'Leitura · Diálogo', minutos: '10 - 12', questoes: 20 },
          { num: 9, parte: 'Class 08', titulo: 'Feelings and plans', tipo: 'Escute e grave', treina: 'Fala · Adjetivos e planos', minutos: '12 - 15', questoes: 20, microfone: true },
          { num: 10, parte: 'Class 08', titulo: '-ed or -ing? Going to', tipo: 'Make a Choice', treina: 'Gramática · Adjetivos -ed/-ing', minutos: '10 - 12', questoes: 24 }
        ]
      },
      {
        aula: 9,
        titulo: 'Class 09 · Review Classes 1-8',
        atividades: [
          { num: 1, titulo: 'Review: what does it mean?', tipo: 'Escute e escolha', treina: 'Escuta · Revisão 1-8', minutos: '10 - 12', questoes: 24 },
          { num: 2, titulo: 'Review: build the sentence', tipo: 'Monte a frase', treina: 'Escrita · Revisão 1-8', minutos: '10 - 12', questoes: 20 },
          { num: 3, titulo: 'Back from Lisbon', tipo: 'Qual é a próxima fala?', treina: 'Leitura · Diálogo', minutos: '10 - 12', questoes: 20 },
          { num: 4, titulo: 'Review: say it!', tipo: 'Escute e grave', treina: 'Fala · Revisão 1-8', minutos: '12 - 15', questoes: 20, microfone: true },
          { num: 5, titulo: 'Review: grammar and vocabulary', tipo: 'Make a Choice', treina: 'Gramática · Revisão 1-8', minutos: '10 - 12', questoes: 24 }
        ]
      },
      {
        aula: 10,
        titulo: 'Class 10 · Why Is It Always Raining?',
        atividades: [
          { num: 1, titulo: "What's the weather like?", tipo: 'Escute e escolha', treina: 'Escuta · Clima e previsão', minutos: '10 - 12', questoes: 24 },
          { num: 2, titulo: "Will or won't?", tipo: 'Monte a frase', treina: "Escrita · Will / won't", minutos: '10 - 12', questoes: 20 },
          { num: 3, titulo: 'A trip to the mountains', tipo: 'Qual é a próxima fala?', treina: 'Leitura · Diálogo', minutos: '10 - 12', questoes: 20 },
          { num: 4, titulo: 'You are the weather reporter', tipo: 'Escute e grave', treina: 'Fala · Previsão do tempo', minutos: '12 - 15', questoes: 20, microfone: true },
          { num: 5, titulo: 'Weather and predictions', tipo: 'Make a Choice', treina: "Gramática · Will / won't", minutos: '10 - 12', questoes: 24 }
        ]
      },
      {
        aula: 11,
        titulo: 'Class 11 · Scenes You Will Never Forget',
        atividades: [
          { num: 1, titulo: "I'll help you!", tipo: 'Escute e escolha', treina: 'Escuta · Ofertas e promessas', minutos: '10 - 12', questoes: 24 },
          { num: 2, titulo: 'Offers and promises', tipo: 'Monte a frase', treina: 'Escrita · Will / Shall', minutos: '10 - 12', questoes: 20 },
          { num: 3, titulo: 'Movie night', tipo: 'Qual é a próxima fala?', treina: 'Leitura · Diálogo', minutos: '10 - 12', questoes: 20 },
          { num: 4, titulo: "Don't worry, I'll...", tipo: 'Escute e grave', treina: 'Fala · Ofertas e promessas', minutos: '12 - 15', questoes: 20, microfone: true },
          { num: 5, titulo: 'Decisions, offers and promises', tipo: 'Make a Choice', treina: 'Gramática · Will / Shall', minutos: '10 - 12', questoes: 24 }
        ]
      },
      {
        aula: 12,
        titulo: 'Class 12 and 13 · Campaign Catastrophes',
        atividades: [
          { num: 1, parte: 'Class 12', titulo: 'False friends', tipo: 'Escute e escolha', treina: 'Escuta · Falsos cognatos', minutos: '10 - 12', questoes: 24 },
          { num: 2, parte: 'Class 12', titulo: "Don't fall for false friends", tipo: 'Monte a frase', treina: 'Escrita · Falsos cognatos', minutos: '10 - 12', questoes: 20 },
          { num: 3, parte: 'Class 12', titulo: 'Lost in translation', tipo: 'Qual é a próxima fala?', treina: 'Leitura · Diálogo', minutos: '10 - 12', questoes: 20 },
          { num: 4, parte: 'Class 12', titulo: 'Actually, I intend to...', tipo: 'Escute e grave', treina: 'Fala · Falsos cognatos', minutos: '12 - 15', questoes: 20, microfone: true },
          { num: 5, parte: 'Class 12', titulo: 'Confusing words', tipo: 'Make a Choice', treina: 'Gramática · Falsos cognatos', minutos: '10 - 12', questoes: 24 },
          { num: 6, parte: 'Class 13', titulo: 'Which tense is it?', tipo: 'Escute e escolha', treina: 'Escuta · Tempos verbais', minutos: '10 - 12', questoes: 24 },
          { num: 7, parte: 'Class 13', titulo: 'Tenses review', tipo: 'Monte a frase', treina: 'Escrita · Tempos verbais', minutos: '10 - 12', questoes: 20 },
          { num: 8, parte: 'Class 13', titulo: 'The BlueBite disaster', tipo: 'Qual é a próxima fala?', treina: 'Leitura · Diálogo', minutos: '10 - 12', questoes: 20 },
          { num: 9, parte: 'Class 13', titulo: 'Pitch your campaign', tipo: 'Escute e grave', treina: 'Fala · Tempos verbais', minutos: '12 - 15', questoes: 20, microfone: true },
          { num: 10, parte: 'Class 13', titulo: 'One word: does, did, have...', tipo: 'Make a Choice', treina: 'Gramática · Tempos verbais', minutos: '10 - 12', questoes: 24 }
        ]
      },
      {
        aula: 14,
        titulo: 'Class 14 · On The Same Page',
        atividades: [
          { num: 1, titulo: 'Reading habits', tipo: 'Escute e escolha', treina: 'Escuta · Hábitos de leitura', minutos: '10 - 12', questoes: 24 },
          { num: 2, titulo: 'I enjoy reading', tipo: 'Monte a frase', treina: 'Escrita · Gerúndio', minutos: '10 - 12', questoes: 20 },
          { num: 3, titulo: 'What are you reading?', tipo: 'Qual é a próxima fala?', treina: 'Leitura · Diálogo', minutos: '10 - 12', questoes: 20 },
          { num: 4, titulo: 'Do you enjoy reading?', tipo: 'Escute e grave', treina: 'Fala · Gerúndio', minutos: '12 - 15', questoes: 20, microfone: true },
          { num: 5, titulo: 'Gerund or infinitive?', tipo: 'Make a Choice', treina: 'Gramática · Gerúndio e infinitivo', minutos: '10 - 12', questoes: 24 }
        ]
      },
      {
        aula: 15,
        titulo: 'Class 15 · A Dose of Good Advice',
        atividades: [
          { num: 1, titulo: "What's the matter?", tipo: 'Escute e escolha', treina: 'Escuta · Saúde e conselhos', minutos: '10 - 12', questoes: 24 },
          { num: 2, titulo: 'You should rest', tipo: 'Monte a frase', treina: "Escrita · Should / shouldn't", minutos: '10 - 12', questoes: 20 },
          { num: 3, titulo: "At the doctor's", tipo: 'Qual é a próxima fala?', treina: 'Leitura · Diálogo', minutos: '10 - 12', questoes: 20 },
          { num: 4, titulo: 'Give good advice', tipo: 'Escute e grave', treina: 'Fala · Saúde e conselhos', minutos: '12 - 15', questoes: 20, microfone: true },
          { num: 5, titulo: "Should or shouldn't?", tipo: 'Make a Choice', treina: "Gramática · Should / shouldn't", minutos: '10 - 12', questoes: 24 }
        ]
      },
      {
        aula: 16,
        titulo: 'Class 16 · From TikTok to Time Clock',
        atividades: [
          { num: 1, titulo: 'Office rules', tipo: 'Escute e escolha', treina: 'Escuta · Regras e obrigações', minutos: '10 - 12', questoes: 24 },
          { num: 2, titulo: 'You have to arrive at nine', tipo: 'Monte a frase', treina: 'Escrita · Have to / must', minutos: '10 - 12', questoes: 20 },
          { num: 3, titulo: 'First day at work', tipo: 'Qual é a próxima fala?', treina: 'Leitura · Diálogo', minutos: '10 - 12', questoes: 20 },
          { num: 4, titulo: 'Generations at work', tipo: 'Escute e grave', treina: 'Fala · Regras e obrigações', minutos: '12 - 15', questoes: 20, microfone: true },
          { num: 5, titulo: "Mustn't or don't have to?", tipo: 'Make a Choice', treina: 'Gramática · Must / have to', minutos: '10 - 12', questoes: 24 }
        ]
      },
      {
        aula: 17,
        titulo: 'Class 17 · Shall We Eat Out?',
        atividades: [
          { num: 1, titulo: "Yes, let's!", tipo: 'Escute e escolha', treina: 'Escuta · Sugestões e respostas', minutos: '10 - 12', questoes: 24 },
          { num: 2, titulo: 'How about pizza?', tipo: 'Monte a frase', treina: 'Escrita · Fazer sugestões', minutos: '10 - 12', questoes: 20 },
          { num: 3, titulo: 'Where shall we eat?', tipo: 'Qual é a próxima fala?', treina: 'Leitura · Diálogo', minutos: '10 - 12', questoes: 20 },
          { num: 4, titulo: "I'm starving!", tipo: 'Escute e grave', treina: 'Fala · Sugestões e gírias', minutos: '12 - 15', questoes: 20, microfone: true },
          { num: 5, titulo: 'Shall we or how about?', tipo: 'Make a Choice', treina: 'Gramática · Sugestões', minutos: '10 - 12', questoes: 24 }
        ]
      },
      {
        aula: 18,
        titulo: 'Class 18 and 19 · How to Make Better Decisions',
        atividades: [
          { num: 1, parte: 'Class 18', titulo: 'Possible or certain?', tipo: 'Escute e escolha', treina: 'Escuta · May / might', minutos: '10 - 12', questoes: 24 },
          { num: 2, parte: 'Class 18', titulo: 'I might change my mind', tipo: 'Monte a frase', treina: 'Escrita · May / might', minutos: '10 - 12', questoes: 20 },
          { num: 3, parte: 'Class 18', titulo: 'The job in Lisbon', tipo: 'Qual é a próxima fala?', treina: 'Leitura · Diálogo', minutos: '10 - 12', questoes: 20 },
          { num: 4, parte: 'Class 18', titulo: 'Decisive or indecisive?', tipo: 'Escute e grave', treina: 'Fala · Decisões', minutos: '12 - 15', questoes: 20, microfone: true },
          { num: 5, parte: 'Class 18', titulo: 'May or might?', tipo: 'Make a Choice', treina: 'Gramática · May / might', minutos: '10 - 12', questoes: 24 },
          { num: 6, parte: 'Class 19', titulo: 'Do your best', tipo: 'Escute e escolha', treina: 'Escuta · Do x make', minutos: '10 - 12', questoes: 24 },
          { num: 7, parte: 'Class 19', titulo: 'Make a decision', tipo: 'Monte a frase', treina: 'Escrita · Do x make', minutos: '10 - 12', questoes: 20 },
          { num: 8, parte: 'Class 19', titulo: 'The bakery decision', tipo: 'Qual é a próxima fala?', treina: 'Leitura · Diálogo', minutos: '10 - 12', questoes: 20 },
          { num: 9, parte: 'Class 19', titulo: 'Make a difference', tipo: 'Escute e grave', treina: 'Fala · Do x make', minutos: '12 - 15', questoes: 20, microfone: true },
          { num: 10, parte: 'Class 19', titulo: 'Do or make?', tipo: 'Make a Choice', treina: 'Gramática · Do x make', minutos: '10 - 12', questoes: 24 }
        ]
      },
      {
        aula: 20,
        titulo: 'Class 20 · Review Classes 10-19',
        atividades: [
          { num: 1, titulo: 'Review: listen and choose', tipo: 'Escute e escolha', treina: 'Escuta · Revisão 10-19', minutos: '10 - 12', questoes: 24 },
          { num: 2, titulo: 'Review: build it', tipo: 'Monte a frase', treina: 'Escrita · Revisão 10-19', minutos: '10 - 12', questoes: 20 },
          { num: 3, titulo: 'Weekend plans', tipo: 'Qual é a próxima fala?', treina: 'Leitura · Diálogo', minutos: '10 - 12', questoes: 20 },
          { num: 4, titulo: 'Can you do it?', tipo: 'Escute e grave', treina: 'Fala · Revisão 10-19', minutos: '12 - 15', questoes: 20, microfone: true },
          { num: 5, titulo: 'Review: choose the right one', tipo: 'Make a Choice', treina: 'Gramática · Revisão 10-19', minutos: '10 - 12', questoes: 24 }
        ]
      },
      {
        aula: 21,
        titulo: 'Class 21 · Weird But True!',
        atividades: [
          { num: 1, titulo: 'What happens if...?', tipo: 'Escute e escolha', treina: 'Escuta · Zero conditional', minutos: '10 - 12', questoes: 24 },
          { num: 2, titulo: 'If you heat ice, it melts', tipo: 'Monte a frase', treina: 'Escrita · Zero conditional', minutos: '10 - 12', questoes: 20 },
          { num: 3, titulo: 'The Weird Science room', tipo: 'Qual é a próxima fala?', treina: 'Leitura · Diálogo', minutos: '10 - 12', questoes: 20 },
          { num: 4, titulo: 'Science facts', tipo: 'Escute e grave', treina: 'Fala · Zero conditional', minutos: '12 - 15', questoes: 20, microfone: true },
          { num: 5, titulo: 'Facts that are always true', tipo: 'Make a Choice', treina: 'Gramática · Zero conditional', minutos: '10 - 12', questoes: 24 }
        ]
      },
      {
        aula: 22,
        titulo: 'Class 22 · The Green Wardrobe',
        atividades: [
          { num: 1, titulo: 'Swap, donate, reuse', tipo: 'Escute e escolha', treina: 'Escuta · Moda sustentável', minutos: '10 - 12', questoes: 24 },
          { num: 2, titulo: "If you swap, you'll save", tipo: 'Monte a frase', treina: 'Escrita · First conditional', minutos: '10 - 12', questoes: 20 },
          { num: 3, titulo: 'The clothes swap', tipo: 'Qual é a próxima fala?', treina: 'Leitura · Diálogo', minutos: '10 - 12', questoes: 20 },
          { num: 4, titulo: 'A greener wardrobe', tipo: 'Escute e grave', treina: 'Fala · First conditional', minutos: '12 - 15', questoes: 20, microfone: true },
          { num: 5, titulo: 'If it rains, we will...', tipo: 'Make a Choice', treina: 'Gramática · First conditional', minutos: '10 - 12', questoes: 24 }
        ]
      },
      {
        aula: 23,
        titulo: 'Class 23 · Is It Really a Dream Job?',
        atividades: [
          { num: 1, titulo: 'Dream jobs', tipo: 'Escute e escolha', treina: 'Escuta · Second conditional', minutos: '10 - 12', questoes: 24 },
          { num: 2, titulo: 'If I won the lottery...', tipo: 'Monte a frase', treina: 'Escrita · Second conditional', minutos: '10 - 12', questoes: 20 },
          { num: 3, titulo: 'Not just playing', tipo: 'Qual é a próxima fala?', treina: 'Leitura · Diálogo', minutos: '10 - 12', questoes: 20 },
          { num: 4, titulo: 'If I were you...', tipo: 'Escute e grave', treina: 'Fala · Second conditional', minutos: '12 - 15', questoes: 20, microfone: true },
          { num: 5, titulo: 'Would or will?', tipo: 'Make a Choice', treina: 'Gramática · Second conditional', minutos: '10 - 12', questoes: 24 }
        ]
      },
      {
        aula: 24,
        titulo: 'Class 24 · From Clicks to Causes',
        atividades: [
          { num: 1, titulo: 'How long?', tipo: 'Escute e escolha', treina: 'Escuta · Present perfect', minutos: '10 - 12', questoes: 24 },
          { num: 2, titulo: "I've lived here since...", tipo: 'Monte a frase', treina: 'Escrita · For / since', minutos: '10 - 12', questoes: 20 },
          { num: 3, titulo: 'From games to clean beaches', tipo: 'Qual é a próxima fala?', treina: 'Leitura · Diálogo', minutos: '10 - 12', questoes: 20 },
          { num: 4, titulo: 'Fame for good causes', tipo: 'Escute e grave', treina: 'Fala · Present perfect', minutos: '12 - 15', questoes: 20, microfone: true },
          { num: 5, titulo: 'For or since?', tipo: 'Make a Choice', treina: 'Gramática · Present perfect', minutos: '10 - 12', questoes: 24 }
        ]
      },
      {
        aula: 25,
        titulo: 'Class 25 · City Battles',
        atividades: [
          { num: 1, titulo: 'Crowded or peaceful?', tipo: 'Escute e escolha', treina: 'Escuta · Cidades e comparações', minutos: '10 - 12', questoes: 24 },
          { num: 2, titulo: 'Cheaper than London', tipo: 'Monte a frase', treina: 'Escrita · Comparativos e preposições', minutos: '10 - 12', questoes: 20 },
          { num: 3, titulo: 'Rome or Amsterdam?', tipo: 'Qual é a próxima fala?', treina: 'Leitura · Diálogo', minutos: '10 - 12', questoes: 20 },
          { num: 4, titulo: 'My favourite city', tipo: 'Escute e grave', treina: 'Fala · Cidades e viagens', minutos: '12 - 15', questoes: 20, microfone: true },
          { num: 5, titulo: 'The best, the worst', tipo: 'Make a Choice', treina: 'Gramática · Comparativos e superlativos', minutos: '10 - 12', questoes: 24 }
        ]
      },
      {
        aula: 26,
        titulo: 'Class 26 · The Most Important People in My Life',
        atividades: [
          { num: 1, titulo: 'Reliable or creative?', tipo: 'Escute e escolha', treina: 'Escuta · Personalidade', minutos: '10 - 12', questoes: 24 },
          { num: 2, titulo: 'The person who helps me', tipo: 'Monte a frase', treina: 'Escrita · Relative clauses', minutos: '10 - 12', questoes: 20 },
          { num: 3, titulo: 'My speech', tipo: 'Qual é a próxima fala?', treina: 'Leitura · Diálogo', minutos: '10 - 12', questoes: 20 },
          { num: 4, titulo: 'People who make my life work', tipo: 'Escute e grave', treina: 'Fala · Personalidade', minutos: '12 - 15', questoes: 20, microfone: true },
          { num: 5, titulo: 'Who, which or where?', tipo: 'Make a Choice', treina: 'Gramática · Relative clauses', minutos: '10 - 12', questoes: 24 }
        ]
      },
      {
        aula: 27,
        titulo: 'Class 27 · Then vs. Now',
        atividades: [
          { num: 1, titulo: 'Then or now?', tipo: 'Escute e escolha', treina: 'Escuta · Used to e aparência', minutos: '10 - 12', questoes: 24 },
          { num: 2, titulo: 'I used to have long hair', tipo: 'Monte a frase', treina: 'Escrita · Used to', minutos: '10 - 12', questoes: 20 },
          { num: 3, titulo: "Grandpa's old photos", tipo: 'Qual é a próxima fala?', treina: 'Leitura · Diálogo', minutos: '10 - 12', questoes: 20 },
          { num: 4, titulo: 'Growing up in the 90s', tipo: 'Escute e grave', treina: 'Fala · Used to', minutos: '12 - 15', questoes: 20, microfone: true },
          { num: 5, titulo: "Used to or didn't use to?", tipo: 'Make a Choice', treina: 'Gramática · Used to', minutos: '10 - 12', questoes: 24 }
        ]
      },
      {
        aula: 28,
        titulo: 'Class 28 and 29 · Same Here!',
        atividades: [
          { num: 1, parte: 'Class 28', titulo: 'So do I!', tipo: 'Escute e escolha', treina: 'Escuta · So / neither', minutos: '10 - 12', questoes: 24 },
          { num: 2, parte: 'Class 28', titulo: 'Neither can I', tipo: 'Monte a frase', treina: 'Escrita · So / neither', minutos: '10 - 12', questoes: 20 },
          { num: 3, parte: 'Class 28', titulo: 'Friend speed dating', tipo: 'Qual é a próxima fala?', treina: 'Leitura · Diálogo', minutos: '10 - 12', questoes: 20 },
          { num: 4, parte: 'Class 28', titulo: 'Making friends', tipo: 'Escute e grave', treina: 'Fala · So / neither', minutos: '12 - 15', questoes: 20, microfone: true },
          { num: 5, parte: 'Class 28', titulo: 'So am I or so do I?', tipo: 'Make a Choice', treina: 'Gramática · So / neither', minutos: '10 - 12', questoes: 24 },
          { num: 6, parte: 'Class 29', titulo: 'Neither did I', tipo: 'Escute e escolha', treina: 'Escuta · So / neither e semelhanças', minutos: '10 - 12', questoes: 24 },
          { num: 7, parte: 'Class 29', titulo: 'We have a lot in common', tipo: 'Monte a frase', treina: 'Escrita · Semelhanças', minutos: '10 - 12', questoes: 20 },
          { num: 8, parte: 'Class 29', titulo: 'After the event', tipo: 'Qual é a próxima fala?', treina: 'Leitura · Diálogo', minutos: '10 - 12', questoes: 20 },
          { num: 9, parte: 'Class 29', titulo: 'Same here!', tipo: 'Escute e grave', treina: 'Fala · So / neither e semelhanças', minutos: '12 - 15', questoes: 20, microfone: true },
          { num: 10, parte: 'Class 29', titulo: 'Did, have, would or will?', tipo: 'Make a Choice', treina: 'Gramática · So / neither e semelhanças', minutos: '10 - 12', questoes: 24 }
        ]
      },
      {
        aula: 30,
        titulo: 'Class 30 · Review Classes 21-29',
        atividades: [
          { num: 1, titulo: 'Review: listen and choose', tipo: 'Escute e escolha', treina: 'Escuta · Revisão 21-29', minutos: '10 - 12', questoes: 24 },
          { num: 2, titulo: 'Review: build it', tipo: 'Monte a frase', treina: 'Escrita · Revisão 21-29', minutos: '10 - 12', questoes: 20 },
          { num: 3, titulo: 'Old school friends', tipo: 'Qual é a próxima fala?', treina: 'Leitura · Diálogo', minutos: '10 - 12', questoes: 20 },
          { num: 4, titulo: 'Can you do it?', tipo: 'Escute e grave', treina: 'Fala · Revisão 21-29', minutos: '12 - 15', questoes: 20, microfone: true },
          { num: 5, titulo: 'Review: choose the right one', tipo: 'Make a Choice', treina: 'Gramática · Revisão 21-29', minutos: '10 - 12', questoes: 24 }
        ]
      },
      {
        aula: 31,
        titulo: 'Class 31 and 32 · The Case of the Missing Contract',
        atividades: [
          { num: 1, parte: 'Class 31', titulo: 'The missing necklace', tipo: 'Escute e escolha', treina: 'Escuta · História de detetive', minutos: '10 - 12', questoes: 24 },
          { num: 2, parte: 'Class 31', titulo: 'Nothing looked broken', tipo: 'Monte a frase', treina: 'Escrita · Passado e vocabulário', minutos: '10 - 12', questoes: 20 },
          { num: 3, parte: 'Class 31', titulo: 'Inspector Ray', tipo: 'Qual é a próxima fala?', treina: 'Leitura · Diálogo', minutos: '10 - 12', questoes: 20 },
          { num: 4, parte: 'Class 31', titulo: 'A good detective story', tipo: 'Escute e grave', treina: 'Fala · História de detetive', minutos: '12 - 15', questoes: 20, microfone: true },
          { num: 5, parte: 'Class 31', titulo: 'Suspects and clues', tipo: 'Make a Choice', treina: 'Gramática · Vocabulário de investigação', minutos: '10 - 12', questoes: 24 },
          { num: 6, parte: 'Class 32', titulo: 'Who called you?', tipo: 'Escute e escolha', treina: 'Escuta · Perguntas sujeito x objeto', minutos: '10 - 12', questoes: 24 },
          { num: 7, parte: 'Class 32', titulo: 'Who entered the office?', tipo: 'Monte a frase', treina: 'Escrita · Perguntas sujeito x objeto', minutos: '10 - 12', questoes: 20 },
          { num: 8, parte: 'Class 32', titulo: 'The missing phone', tipo: 'Qual é a próxima fala?', treina: 'Leitura · Diálogo', minutos: '10 - 12', questoes: 20 },
          { num: 9, parte: 'Class 32', titulo: 'Ask the right questions', tipo: 'Escute e grave', treina: 'Fala · Perguntas sujeito x objeto', minutos: '12 - 15', questoes: 20, microfone: true },
          { num: 10, parte: 'Class 32', titulo: 'With or without did?', tipo: 'Make a Choice', treina: 'Gramática · Perguntas sujeito x objeto', minutos: '10 - 12', questoes: 24 }
        ]
      },
      {
        aula: 33,
        titulo: 'Class 33 and 34 · The 5 a.m. Club',
        atividades: [
          { num: 1, parte: 'Class 33', titulo: 'A year of early mornings', tipo: 'Escute e escolha', treina: 'Escuta · Hábitos e phrasal verbs', minutos: '10 - 12', questoes: 24 },
          { num: 2, parte: 'Class 33', titulo: 'Wake up and get up', tipo: 'Monte a frase', treina: 'Escrita · Phrasal verbs de rotina', minutos: '10 - 12', questoes: 20 },
          { num: 3, parte: 'Class 33', titulo: 'Joining the club', tipo: 'Qual é a próxima fala?', treina: 'Leitura · Diálogo', minutos: '10 - 12', questoes: 20 },
          { num: 4, parte: 'Class 33', titulo: 'My morning routine', tipo: 'Escute e grave', treina: 'Fala · Phrasal verbs de rotina', minutos: '12 - 15', questoes: 20, microfone: true },
          { num: 5, parte: 'Class 33', titulo: 'Habits and phrasal verbs', tipo: 'Make a Choice', treina: 'Gramática · Significado dos phrasal verbs', minutos: '10 - 12', questoes: 24 },
          { num: 6, parte: 'Class 34', titulo: 'Turn it down, please', tipo: 'Escute e escolha', treina: 'Escuta · Podcast e phrasal verbs', minutos: '10 - 12', questoes: 24 },
          { num: 7, parte: 'Class 34', titulo: 'Put it away', tipo: 'Monte a frase', treina: 'Escrita · Phrasal verbs separáveis', minutos: '10 - 12', questoes: 20 },
          { num: 8, parte: 'Class 34', titulo: 'Sleep Talk', tipo: 'Qual é a próxima fala?', treina: 'Leitura · Diálogo', minutos: '10 - 12', questoes: 20 },
          { num: 9, parte: 'Class 34', titulo: 'Can you join the 5 a.m. club?', tipo: 'Escute e grave', treina: 'Fala · Phrasal verbs separáveis', minutos: '12 - 15', questoes: 20, microfone: true },
          { num: 10, parte: 'Class 34', titulo: 'Turn it off, not off it', tipo: 'Make a Choice', treina: 'Gramática · Tipos de phrasal verbs', minutos: '10 - 12', questoes: 24 }
        ]
      },
      {
        aula: 35,
        titulo: 'Class 35 and 36 · Before You Share',
        atividades: [
          { num: 1, parte: 'Class 35', titulo: 'Real or fake?', tipo: 'Escute e escolha', treina: 'Escuta · Fake news e vocabulário de mídia', minutos: '10 - 12', questoes: 24 },
          { num: 2, parte: 'Class 35', titulo: 'Check the source', tipo: 'Monte a frase', treina: 'Escrita · Vocabulário de mídia', minutos: '10 - 12', questoes: 20 },
          { num: 3, parte: 'Class 35', titulo: 'A shark in the street?', tipo: 'Qual é a próxima fala?', treina: 'Leitura · Diálogo', minutos: '10 - 12', questoes: 20 },
          { num: 4, parte: 'Class 35', titulo: 'Before you share', tipo: 'Escute e grave', treina: 'Fala · Vocabulário de mídia', minutos: '12 - 15', questoes: 20, microfone: true },
          { num: 5, parte: 'Class 35', titulo: 'Media and the news', tipo: 'Make a Choice', treina: 'Gramática · Vocabulário de mídia', minutos: '10 - 12', questoes: 24 },
          { num: 6, parte: 'Class 36', titulo: 'It was shared by millions', tipo: 'Escute e escolha', treina: 'Escuta · Voz passiva', minutos: '10 - 12', questoes: 24 },
          { num: 7, parte: 'Class 36', titulo: 'The story was published', tipo: 'Monte a frase', treina: 'Escrita · Voz passiva', minutos: '10 - 12', questoes: 20 },
          { num: 8, parte: 'Class 36', titulo: 'In the newsroom', tipo: 'Qual é a próxima fala?', treina: 'Leitura · Diálogo', minutos: '10 - 12', questoes: 20 },
          { num: 9, parte: 'Class 36', titulo: 'Fake or real? Say it in the passive', tipo: 'Escute e grave', treina: 'Fala · Voz passiva', minutos: '12 - 15', questoes: 20, microfone: true },
          { num: 10, parte: 'Class 36', titulo: 'Is, are, was or were?', tipo: 'Make a Choice', treina: 'Gramática · Voz passiva', minutos: '10 - 12', questoes: 24 }
        ]
      },
      {
        aula: 37,
        titulo: "Class 37 · That's Small Talk, Isn't It?",
        atividades: [
          { num: 1, titulo: 'Small talk tips', tipo: 'Escute e escolha', treina: 'Escuta · Small talk e question tags', minutos: '10 - 12', questoes: 24 },
          { num: 2, titulo: "Cold today, isn't it?", tipo: 'Monte a frase', treina: 'Escrita · Question tags', minutos: '10 - 12', questoes: 20 },
          { num: 3, titulo: 'At the coffee machine', tipo: 'Qual é a próxima fala?', treina: 'Leitura · Diálogo', minutos: '10 - 12', questoes: 20 },
          { num: 4, titulo: 'Make small talk', tipo: 'Escute e grave', treina: 'Fala · Small talk e question tags', minutos: '12 - 15', questoes: 20, microfone: true },
          { num: 5, titulo: 'Question tags', tipo: 'Make a Choice', treina: 'Gramática · Question tags', minutos: '10 - 12', questoes: 24 }
        ]
      },
      {
        aula: 38,
        titulo: "Class 38 · Lessons I've Learned",
        atividades: [
          { num: 1, titulo: 'School memories', tipo: 'Escute e escolha', treina: 'Escuta · Escola e particípios', minutos: '10 - 12', questoes: 24 },
          { num: 2, titulo: "I've never seen you give up", tipo: 'Monte a frase', treina: 'Escrita · Present perfect x past simple', minutos: '10 - 12', questoes: 20 },
          { num: 3, titulo: 'The school reunion', tipo: 'Qual é a próxima fala?', treina: 'Leitura · Diálogo', minutos: '10 - 12', questoes: 20 },
          { num: 4, titulo: "Lessons I've learned", tipo: 'Escute e grave', treina: 'Fala · Memórias da escola', minutos: '12 - 15', questoes: 20, microfone: true },
          { num: 5, titulo: 'Have you ever or did you?', tipo: 'Make a Choice', treina: 'Gramática · Present perfect x past simple', minutos: '10 - 12', questoes: 24 }
        ]
      },
      {
        aula: 39,
        titulo: 'Class 39 and 40 · The Story Behind the Lyrics',
        atividades: [
          { num: 1, parte: 'Class 39', titulo: 'The song from the street', tipo: 'Escute e escolha', treina: 'Escuta · Histórias e expressões de tempo', minutos: '10 - 12', questoes: 24 },
          { num: 2, parte: 'Class 39', titulo: 'At first, suddenly, eventually', tipo: 'Monte a frase', treina: 'Escrita · Expressões de tempo', minutos: '10 - 12', questoes: 20 },
          { num: 3, parte: 'Class 39', titulo: 'The last train home', tipo: 'Qual é a próxima fala?', treina: 'Leitura · Diálogo', minutos: '10 - 12', questoes: 20 },
          { num: 4, parte: 'Class 39', titulo: 'Tell the story', tipo: 'Escute e grave', treina: 'Fala · Contar uma história', minutos: '12 - 15', questoes: 20, microfone: true },
          { num: 5, parte: 'Class 39', titulo: 'Time expressions', tipo: 'Make a Choice', treina: 'Gramática · Expressões de tempo e música', minutos: '10 - 12', questoes: 24 },
          { num: 6, parte: 'Class 40', titulo: 'What had happened first?', tipo: 'Escute e escolha', treina: 'Escuta · Past perfect', minutos: '10 - 12', questoes: 24 },
          { num: 7, parte: 'Class 40', titulo: 'It had already burned down', tipo: 'Monte a frase', treina: 'Escrita · Past perfect', minutos: '10 - 12', questoes: 20 },
          { num: 8, parte: 'Class 40', titulo: 'What a night!', tipo: 'Qual é a próxima fala?', treina: 'Leitura · Diálogo', minutos: '10 - 12', questoes: 20 },
          { num: 9, parte: 'Class 40', titulo: 'What had happened before?', tipo: 'Escute e grave', treina: 'Fala · Past perfect', minutos: '12 - 15', questoes: 20, microfone: true },
          { num: 10, parte: 'Class 40', titulo: 'Had or did?', tipo: 'Make a Choice', treina: 'Gramática · Past perfect x past simple', minutos: '10 - 12', questoes: 24 }
        ]
      },
      {
        aula: 41,
        titulo: 'Class 41 and 42 · "I Almost Agree With You"',
        atividades: [
          { num: 1, parte: 'Class 41', titulo: 'What they say vs what they mean', tipo: 'Escute e escolha', treina: 'Escuta · Reported speech', minutos: '10 - 12', questoes: 24 },
          { num: 2, parte: 'Class 41', titulo: 'She said she almost agreed', tipo: 'Monte a frase', treina: 'Escrita · Reported speech', minutos: '10 - 12', questoes: 20 },
          { num: 3, parte: 'Class 41', titulo: '"Quite good"?', tipo: 'Qual é a próxima fala?', treina: 'Leitura · Diálogo', minutos: '10 - 12', questoes: 20 },
          { num: 4, parte: 'Class 41', titulo: 'Report what they said', tipo: 'Escute e grave', treina: 'Fala · Reported speech', minutos: '12 - 15', questoes: 20, microfone: true },
          { num: 5, parte: 'Class 41', titulo: 'Reported speech', tipo: 'Make a Choice', treina: 'Gramática · Reported speech', minutos: '10 - 12', questoes: 24 },
          { num: 6, parte: 'Class 42', titulo: 'Flat or apartment?', tipo: 'Escute e escolha', treina: 'Escuta · Inglês britânico x americano', minutos: '10 - 12', questoes: 24 },
          { num: 7, parte: 'Class 42', titulo: 'Say or tell?', tipo: 'Monte a frase', treina: 'Escrita · Say x tell e vocabulário', minutos: '10 - 12', questoes: 20 },
          { num: 8, parte: 'Class 42', titulo: 'A New Yorker in London', tipo: 'Qual é a próxima fala?', treina: 'Leitura · Diálogo', minutos: '10 - 12', questoes: 20 },
          { num: 9, parte: 'Class 42', titulo: 'London or New York?', tipo: 'Escute e grave', treina: 'Fala · Inglês britânico x americano', minutos: '12 - 15', questoes: 20, microfone: true },
          { num: 10, parte: 'Class 42', titulo: 'Bill or check?', tipo: 'Make a Choice', treina: 'Gramática · Say x tell e BrE x AmE', minutos: '10 - 12', questoes: 24 }
        ]
      },
      {
        aula: 43,
        titulo: 'Class 43 · Review Classes 31-42',
        atividades: [
          { num: 1, titulo: 'Review: listen and choose', tipo: 'Escute e escolha', treina: 'Escuta · Revisão 31-42', minutos: '10 - 12', questoes: 24 },
          { num: 2, titulo: 'Review: build the sentence', tipo: 'Monte a frase', treina: 'Escrita · Revisão 31-42', minutos: '10 - 12', questoes: 20 },
          { num: 3, titulo: 'The museum mystery', tipo: 'Qual é a próxima fala?', treina: 'Leitura · Diálogo', minutos: '10 - 12', questoes: 20 },
          { num: 4, titulo: 'Review: what I can do', tipo: 'Escute e grave', treina: 'Fala · Revisão 31-42', minutos: '12 - 15', questoes: 20, microfone: true },
          { num: 5, titulo: 'Review: make a choice', tipo: 'Make a Choice', treina: 'Gramática · Revisão 31-42', minutos: '10 - 12', questoes: 24 }
        ]
      }
    ]
  },
  b2: {
    course: 'ativ-b2',
    nome: 'B2',
    aulas: [
      {
        aula: 1,
        titulo: 'Class 01 · Welcome Class',
        atividades: [
          { num: 1, titulo: 'How much do you remember?', tipo: 'Escute e escolha', treina: 'Escuta · Revisão e aprender idiomas', minutos: '10 - 12', questoes: 24 },
          { num: 2, titulo: 'Back to English', tipo: 'Monte a frase', treina: 'Escrita · Tempos verbais e metas', minutos: '10 - 12', questoes: 20 },
          { num: 3, titulo: 'First day in B2', tipo: 'Qual é a próxima fala?', treina: 'Leitura · Diálogo', minutos: '10 - 12', questoes: 20 },
          { num: 4, titulo: 'My goals for B2', tipo: 'Escute e grave', treina: 'Fala · Rotina, experiências e metas', minutos: '12 - 15', questoes: 20, microfone: true },
          { num: 5, titulo: 'Ready for B2?', tipo: 'Make a Choice', treina: 'Gramática · Collocations e tempos verbais', minutos: '10 - 12', questoes: 24 }
        ]
      },
      {
        aula: 2,
        titulo: 'Class 02 · Why Are These Monkeys Stealing from Tourists?',
        atividades: [
          { num: 1, titulo: 'The sunglasses thief', tipo: 'Escute e escolha', treina: 'Escuta · Crime e past continuous', minutos: '10 - 12', questoes: 24 },
          { num: 2, titulo: 'I was walking when...', tipo: 'Monte a frase', treina: 'Escrita · Past continuous x past simple', minutos: '10 - 12', questoes: 20 },
          { num: 3, titulo: 'Robbed by a monkey!', tipo: 'Qual é a próxima fala?', treina: 'Leitura · Diálogo', minutos: '10 - 12', questoes: 20 },
          { num: 4, titulo: 'Tell the story', tipo: 'Escute e grave', treina: 'Fala · Contar uma história', minutos: '12 - 15', questoes: 20, microfone: true },
          { num: 5, titulo: 'Was walking, stole', tipo: 'Make a Choice', treina: 'Gramática · Past continuous e vocabulário de crime', minutos: '10 - 12', questoes: 24 }
        ]
      },
      {
        aula: 5,
        titulo: 'Class 05 and 06 · Welcome to the Future',
        atividades: [
          { num: 1, parte: 'Class 05', titulo: 'Meet Neo', tipo: 'Escute e escolha', treina: 'Escuta · Formas de futuro', minutos: '10 - 12', questoes: 24 },
          { num: 2, parte: 'Class 05', titulo: 'Robots will become part of life', tipo: 'Monte a frase', treina: 'Escrita · Formas de futuro', minutos: '10 - 12', questoes: 20 },
          { num: 3, parte: 'Class 05', titulo: 'Should we buy a robot?', tipo: 'Qual é a próxima fala?', treina: 'Leitura · Diálogo', minutos: '10 - 12', questoes: 20 },
          { num: 4, parte: 'Class 05', titulo: 'Talking about the future', tipo: 'Escute e grave', treina: 'Fala · Formas de futuro', minutos: '12 - 15', questoes: 20, microfone: true },
          { num: 5, parte: 'Class 05', titulo: 'Future tenses review', tipo: 'Make a Choice', treina: 'Gramática · Will, going to, presente', minutos: '10 - 12', questoes: 24 },
          { num: 6, parte: 'Class 06', titulo: 'Trends and opinions', tipo: 'Escute e escolha', treina: 'Escuta · Tendências e artigo', minutos: '10 - 12', questoes: 24 },
          { num: 7, parte: 'Class 06', titulo: 'Increasingly common', tipo: 'Monte a frase', treina: 'Escrita · Vocabulário de tendências', minutos: '10 - 12', questoes: 20 },
          { num: 8, parte: 'Class 06', titulo: 'Is Neo really the future?', tipo: 'Qual é a próxima fala?', treina: 'Leitura · Diálogo', minutos: '10 - 12', questoes: 20 },
          { num: 9, parte: 'Class 06', titulo: 'Would you have a robot at home?', tipo: 'Escute e grave', treina: 'Fala · Opinião e previsões', minutos: '12 - 15', questoes: 20, microfone: true },
          { num: 10, parte: 'Class 06', titulo: 'Describing trends', tipo: 'Make a Choice', treina: 'Gramática · Tendências e leitura', minutos: '10 - 12', questoes: 24 }
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