// eden-ai.js - Integração com API da Eden AI (Versão GitHub Workspaces)

// ✅ CONFIGURAÇÃO PARA GITHUB WORKSPACES (sem variáveis de ambiente)
const EDEN_AI_API_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiZTNjNGNjZGUtNjE5YS00OWI5LTg4NWUtNTdmZGE5YzViNzFjIiwidHlwZSI6ImFwaV90b2tlbiJ9.RNVXFPhNnq3ADj9knGTuyVPjdFIzCUkRpyVsVJSZMuM"; // Cole sua chave diretamente
const EDEN_AI_BASE_URL = "https://api.edenai.run/v2/aiproducts/askyoda/v2/{project_id}/add_text";

// ✅ SUPABASE configurado para funcionar sem import (usando global)
const supabase = window.supabase;

// Lista de provedores disponíveis
const PROVIDERS = {
  TEXT: ['openai', 'google', 'microsoft'],
  IMAGE: ['openai', 'stabilityai', 'deepai'],
  TRANSLATION: ['google', 'microsoft', 'amazon']
};

// Função principal para fazer perguntas à IA
async function askEdenAI(question, provider = 'openai') {
  try {
    // Validar se a pergunta é sobre estudos/curiosidades
    if (!isEducationalQuestion(question)) {
      throw new Error('Desculpe, só posso responder perguntas sobre estudos e curiosidades.');
    }

    // Verificar se o provider é válido
    if (!PROVIDERS.TEXT.includes(provider)) {
      provider = 'openai';
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
        fallback_providers: 'google'
      }
    };

    const response = await axios.request(options);
    
    // ✅ ESTRUTURA CORRETA da resposta Eden AI
    let aiResponse = '';
    if (response.data[provider] && response.data[provider].generated_text) {
      aiResponse = response.data[provider].generated_text;
    } else if (response.data.google && response.data.google.generated_text) {
      aiResponse = response.data.google.generated_text; // Fallback
    } else {
      aiResponse = 'Desculpe, não consegui processar sua pergunta.';
    }
    
    // Salvar a interação no Supabase
    const saved = await saveEdenInteraction(question, aiResponse, provider);
    
    return {
      success: true,
      data: aiResponse, // ✅ Retorna só o texto, não o objeto completo
      provider: provider,
      savedToDB: saved
    };
  } catch (error) {
    console.error('Erro ao chamar Eden AI:', error);
    
    // Tentar com fallback provider
    if (provider !== 'google') {
      console.log('Tentando com fallback provider...');
      return askEdenAI(question, 'google');
    }
    
    return {
      success: false,
      error: error.message,
      suggestion: 'Tente reformular sua pergunta.'
    };
  }
}

// Função para análise de sentimentos
async function analyzeSentiment(text, provider = 'google') {
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

// Função para validação de perguntas educacionais
function isEducationalQuestion(question) {
  const educationalTopics = [
    'estudo', 'aprendizagem', 'educação', 'curso', 'escola', 
    'universidade', 'matéria', 'disciplina', 'conceito', 'teoria',
    'história', 'ciência', 'matemática', 'física', 'química',
    'biologia', 'literatura', 'filme', 'curiosidade', 'como funciona',
    'explique', 'o que é', 'defina', 'pesquisa', 'científico',
    'tecnologia', 'programação', 'linguagem', 'cultura', 'arte',
    'musica', 'filosofia', 'psicologia', 'economia', 'geografia'
  ];
  
  const lowerQuestion = question.toLowerCase();
  return educationalTopics.some(topic => lowerQuestion.includes(topic));
}

// Função para salvar interação
async function saveEdenInteraction(question, aiResponse, provider) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
      // 1. Salvar pergunta do usuário
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

      // 3. Salvar resposta da IA
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

// Buscar histórico
async function getEdenAIHistory() {
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
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) throw error;

    return { success: true, data };
  } catch (error) {
    console.error('Erro ao buscar histórico:', error);
    return { success: false, error: error.message };
  }
}

// ✅ EXPORTAÇÃO PARA ESCOPO GLOBAL (sem modules)
window.askEdenAI = askEdenAI;
window.getEdenAIHistory = getEdenAIHistory;
window.analyzeSentiment = analyzeSentiment;

console.log('Eden AI carregado - GitHub Workspaces Edition');