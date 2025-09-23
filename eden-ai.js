// eden-ai.js - Integração com a API da Eden AI
// Nota: Para este projeto, a chave e URL são fixas, pois é um projeto de TCC
// usando o ambiente de desenvolvimento do GitHub Workspaces.

// Importa a instância do cliente Supabase do arquivo supabase-client.js
import { supabase } from './supabase-client.js';

// ✅ CONFIGURAÇÃO DA API
const EDEN_AI_API_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiZTNjNGNjZGUtNjE5YS00OWI5LTg4NWUtNTdmZGE5YzViNzFjIiwidHlwZSI6ImFwaV90b2tlbiJ9.RNVXFPhNnq3ADj9knGTuyVPjdFIzCUkRpyVsVJSZMuM";
const EDEN_AI_BASE_URL = "https://api.edenai.run/v2/aiproducts/askyoda/v2/clj73x39a0000jl0817h52c1x/add_text"; // URL do seu projeto

// ✅ EXPORTAÇÃO DAS FUNÇÕES
// Função principal para fazer perguntas à IA
export async function askEdenAI(question, provider = 'openai') {
  try {
    // Validar se a pergunta é sobre estudos/curiosidades
    if (!isEducationalQuestion(question)) {
      return { success: false, error: 'Desculpe, só posso responder perguntas sobre estudos e curiosidades.' };
    }

    const options = {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${EDEN_AI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        providers: [provider],
        text: question,
        temperature: 0.7,
        max_tokens: 500,
        fallback_providers: ['google']
      })
    };

    const response = await fetch(EDEN_AI_BASE_URL, options);
    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || 'Erro na resposta da API');
    }
    
    // Extrai a resposta da IA
    let aiResponse = '';
    const responseProvider = data[provider];
    const fallbackProvider = data.google;
    
    if (responseProvider && responseProvider.generated_text) {
      aiResponse = responseProvider.generated_text;
    } else if (fallbackProvider && fallbackProvider.generated_text) {
      aiResponse = fallbackProvider.generated_text;
    } else {
      aiResponse = 'Desculpe, não consegui processar sua pergunta.';
    }
    
    // Salva a interação no Supabase
    const saved = await saveEdenInteraction(question, aiResponse, provider);
    
    return {
      success: true,
      data: aiResponse,
      provider: provider,
      savedToDB: saved
    };
  } catch (error) {
    console.error('Erro ao chamar Eden AI:', error);
    
    return {
      success: false,
      error: error.message,
      suggestion: 'Tente reformular sua pergunta.'
    };
  }
}

// Função para análise de sentimentos
export async function analyzeSentiment(text, provider = 'google') {
  try {
    const options = {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${EDEN_AI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        providers: [provider],
        text: text,
        language: 'pt'
      })
    };

    const response = await fetch(`${EDEN_AI_BASE_URL}/text/sentiment_analysis`, options);
    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || 'Erro na resposta da API');
    }
    
    return { success: true, data };
  } catch (error) {
    console.error('Erro na análise de sentimentos:', error);
    return { success: false, error: error.message };
  }
}

// Função para validação de perguntas educacionais
function isEducationalQuestion(question) {
  const educationalTopics = [
    'estudo', 'aprendizagem', 'educação', 'curso', 'escola', 
    'universidade', 'matéria', 'disciplina', 'conceito', 'teoria',
    'história', 'ciência', 'matemática', 'física', 'química',
    'biologia', 'literatura', 'curiosidade', 'como funciona',
    'explique', 'o que é', 'defina', 'pesquisa', 'científico',
    'tecnologia', 'programação', 'linguagem', 'cultura', 'arte',
    'música', 'filosofia', 'psicologia', 'economia', 'geografia'
  ];
  
  const lowerQuestion = question.toLowerCase();
  return educationalTopics.some(topic => lowerQuestion.includes(topic));
}

// Função para salvar interação no Supabase
export async function saveEdenInteraction(question, aiResponse, provider) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
      const { data: questionData, error: questionError } = await supabase
        .from('user_questions')
        .insert({
          user_id: user.id,
          question: question,
          category: detectCategory(question),
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (questionError) throw questionError;

      const { error: responseError } = await supabase
        .from('ai_responses')
        .insert({
          question_id: questionData.id,
          response: aiResponse,
          provider: provider,
          created_at: new Date().toISOString()
        });

      if (responseError) throw responseError;
      
      return true;
    }
    return false;
  } catch (error) {
    console.error('Erro ao salvar interação:', error);
    return false;
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

// Função para buscar histórico de interações do usuário
export async function getEdenAIHistory() {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
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
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return { success: true, data };
  } catch (error) {
    console.error('Erro ao buscar histórico:', error);
    return { success: false, error: error.message };
  }
}
