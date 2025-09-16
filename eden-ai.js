// eden-ai.js - Integração com API da Eden AI

import { supabase } from './supabase-client.js';

// Configuração da API Eden AI
const EDEN_AI_API_KEY = import.meta.env.VITE_EDEN_AI_API_KEY;
const EDEN_AI_BASE_URL = 'https://api.edenai.run/v2';

// Lista de provedores disponíveis para diferentes funcionalidades
const PROVIDERS = {
  TEXT: ['openai', 'google', 'microsoft'],
  IMAGE: ['openai', 'stabilityai', 'deepai'],
  TRANSLATION: ['google', 'microsoft', 'amazon']
};

// Função principal para fazer perguntas à IA
export async function askEdenAI(question, provider = 'openai') {
  try {
    // Validar se a pergunta é sobre estudos/curiosidades
    if (!isEducationalQuestion(question)) {
      throw new Error('Desculpe, só posso responder perguntas sobre estudos e curiosidades.');
    }

    // Verificar se o provider é válido
    if (!PROVIDERS.TEXT.includes(provider)) {
      provider = 'openai'; // Fallback para OpenAI
    }

    const options = {
      method: 'POST',
      url: `${EDEN_AI_BASE_URL}/text/chat`,
      headers: {
        'Authorization': `Bearer ${EDEN_AI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      data: {
        providers: provider,
        text: question,
        temperature: 0.7,
        max_tokens: 500,
        fallback_providers: 'google' // Fallback caso o provider principal falhe
      }
    };

    const response = await axios.request(options);
    
    // Salvar a interação no Supabase
    await saveInteraction(question, response.data, provider);
    
    return {
      success: true,
      data: response.data,
      provider: provider
    };
  } catch (error) {
    console.error('Erro ao chamar Eden AI:', error);
    
    // Tentar com fallback provider em caso de erro
    if (provider !== 'google') {
      console.log('Tentando com fallback provider...');
      return askEdenAI(question, 'google');
    }
    
    return {
      success: false,
      error: error.message,
      suggestion: 'Tente reformular sua pergunta ou tente novamente em alguns instantes.'
    };
  }
}

// Função para análise de sentimentos/emoções no texto
export async function analyzeSentiment(text, provider = 'google') {
  try {
    const options = {
      method: 'POST',
      url: `${EDEN_AI_BASE_URL}/text/sentiment_analysis`,
      headers: {
        'Authorization': `Bearer ${EDEN_AI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      data: {
        providers: provider,
        text: text,
        language: 'pt'
      }
    };

    const response = await axios.request(options);
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    console.error('Erro na análise de sentimentos:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Função para resumo de texto
export async function summarizeText(text, provider = 'microsoft') {
  try {
    const options = {
      method: 'POST',
      url: `${EDEN_AI_BASE_URL}/text/summarize`,
      headers: {
        'Authorization': `Bearer ${EDEN_AI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      data: {
        providers: provider,
        text: text,
        output_sentences: 3
      }
    };

    const response = await axios.request(options);
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    console.error('Erro ao resumir texto:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Função para validação de perguntas educacionais
function isEducationalQuestion(question) {
  const educationalTopics = [
    'estudo', 'aprendizagem', 'educação', 'curso', 'escola', 
    'universidade', 'matéria', 'disciplina', 'conceito', 'teoria',
    'história', 'ciência', 'matemática', 'física', 'química',
    'biologia', 'literatura', 'filme', 'curiosidade', 'como funciona',
    'explique', 'o que é', 'defina', 'pesquisa', 'científico',
    'tecnologia', 'programação', 'linguagem', 'cultura', 'arte',
    'musica', ' filosofia', 'psicologia', 'economia', 'geografia'
  ];
  
  const lowerQuestion = question.toLowerCase();
  return educationalTopics.some(topic => lowerQuestion.includes(topic));
}

// Função para salvar interação no Supabase
async function saveInteraction(question, response, provider) {
  try {
    const user = await supabase.auth.getUser();
    
    if (user.data.user) {
      // Salvar pergunta do usuário
      const { data: questionData, error: questionError } = await supabase
        .from('user_questions')
        .insert([
          {
            user_id: user.data.user.id,
            question: question,
            category: detectCategory(question),
            created_at: new Date()
          }
        ])
        .select();

      if (questionError) throw questionError;

      // Salvar resposta da IA
      const aiResponse = extractAIResponse(response, provider);
      
      const { error: responseError } = await supabase
        .from('ai_responses')
        .insert([
          {
            question_id: questionData[0].id,
            response: aiResponse,
            provider: provider,
            created_at: new Date()
          }
        ]);

      if (responseError) throw responseError;
    }
  } catch (error) {
    console.error('Erro ao salvar interação:', error);
  }
}

// Função para extrair resposta da IA da resposta da API
function extractAIResponse(response, provider) {
  try {
    // A estrutura da resposta varia por provider
    if (response[provider] && response[provider].generated_text) {
      return response[provider].generated_text;
    }
    
    // Fallback para estrutura alternativa
    for (const key in response) {
      if (response[key] && response[key].generated_text) {
        return response[key].generated_text;
      }
    }
    
    return JSON.stringify(response); // Fallback extremo
  } catch (error) {
    return 'Resposta não disponível';
  }
}

// Função para detectar categoria da pergunta
function detectCategory(question) {
  const categories = {
    'ciência': ['ciência', 'científico', 'física', 'química', 'biologia'],
    'tecnologia': ['tecnologia', 'programação', 'computador', 'software', 'aplicativo'],
    'história': ['história', 'histórico', 'passado', 'antigo'],
    'arte': ['arte', 'música', 'filme', 'literatura', 'pintura'],
    'educação': ['estudo', 'escola', 'universidade', 'curso', 'aprender']
  };

  const lowerQuestion = question.toLowerCase();
  
  for (const [category, keywords] of Object.entries(categories)) {
    if (keywords.some(keyword => lowerQuestion.includes(keyword))) {
      return category;
    }
  }
  
  return 'geral';
}

// Função para obter histórico de interações do usuário
export async function getUserHistory() {
  try {
    const user = await supabase.auth.getUser();
    
    if (!user.data.user) {
      return { success: false, error: 'Usuário não autenticado' };
    }

    const { data, error } = await supabase
      .from('user_questions')
      .select(`
        id,
        question,
        category,
        created_at,
        ai_responses (
          response,
          provider,
          created_at
        )
      `)
      .eq('user_id', user.data.user.id)
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) throw error;

    return { success: true, data };
  } catch (error) {
    console.error('Erro ao buscar histórico:', error);
    return { success: false, error: error.message };
  }
}

// Função para obter sugestões baseadas no histórico
export async function getSuggestions() {
  try {
    const history = await getUserHistory();
    
    if (!history.success) {
      return getDefaultSuggestions();
    }

    // Analisar histórico para sugerir tópicos relacionados
    const categories = {};
    history.data?.forEach(interaction => {
      if (interaction.category) {
        categories[interaction.category] = (categories[interaction.category] || 0) + 1;
      }
    });

    // Ordenar categorias por frequência
    const sortedCategories = Object.entries(categories)
      .sort((a, b) => b[1] - a[1])
      .map(([category]) => category);

    return generateSuggestions(sortedCategories);
  } catch (error) {
    console.error('Erro ao gerar sugestões:', error);
    return getDefaultSuggestions();
  }
}

// Sugestões padrão
function getDefaultSuggestions() {
  return [
    'Explique a teoria da relatividade de Einstein',
    'Como funciona a fotossíntese?',
    'Qual a história da Segunda Guerra Mundial?',
    'Como aprender programação mais eficientemente?',
    'Quais são os principais movimentos artísticos do século XX?'
  ];
}

// Gerar sugestões baseadas nas categorias
function generateSuggestions(categories) {
  const suggestionsMap = {
    'ciência': [
      'Explique a teoria da relatividade',
      'Como funciona a fotossíntese?',
      'O que são buracos negros?'
    ],
    'tecnologia': [
      'Como começar com inteligência artificial?',
      'Quais as linguagens de programação mais populares?',
      'Explique o que é blockchain'
    ],
    'história': [
      'Resuma a Revolução Francesa',
      'Quais foram as causas da Primeira Guerra Mundial?',
      'Conte sobre o Império Romano'
    ],
    'arte': [
      'Quais são os principais movimentos artísticos?',
      'Explique o impressionismo',
      'Quem foram os maiores compositores clássicos?'
    ],
    'educação': [
      'Como melhorar minha concentração nos estudos?',
      'Quais técnicas de memorização são mais eficazes?',
      'Como criar um cronograma de estudos eficiente?'
    ],
    'geral': getDefaultSuggestions()
  };

  const suggestions = [];
  
  // Adicionar sugestões das categorias mais frequentes
  categories.forEach(category => {
    if (suggestionsMap[category] && suggestions.length < 5) {
      suggestions.push(...suggestionsMap[category].slice(0, 2));
    }
  });

  // Completar com sugestões gerais se necessário
  if (suggestions.length < 5) {
    suggestions.push(...getDefaultSuggestions().slice(0, 5 - suggestions.length));
  }

  return suggestions.slice(0, 5);
}

export default {
  askEdenAI,
  analyzeSentiment,
  summarizeText,
  getUserHistory,
  getSuggestions
};