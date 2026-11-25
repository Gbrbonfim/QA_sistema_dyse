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