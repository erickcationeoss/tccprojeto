// main.js - Centraliza todas as funções de autenticação e da IA.

// Importa a instância do cliente Supabase do arquivo supabase-client.js
// A variável 'supabase' já é criada pelo script CDN no index.html.
const supabaseClient = supabase.createClient(
  window.ENV.VITE_SUPABASE_URL,
  window.ENV.VITE_SUPABASE_ANON_KEY
);

// =========================================
// FUNÇÕES DE AUTENTICAÇÃO
// =========================================

/**
 * Cadastra um novo usuário no Supabase.
 * @param {string} email - Email do usuário.
 * @param {string} password - Senha do usuário.
 * @param {object} options - Opções adicionais (ex: fullName).
 * @returns {Promise<object>} - Resultado da operação.
 */
async function signUp(email, password, options = {}) {
  try {
    const { data, error } = await supabaseClient.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: options.fullName || null
        }
      }
    });

    if (error) {
      throw error;
    }

    return { success: true, data };
  } catch (error) {
    console.error('Erro no cadastro:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Autentica um usuário existente.
 * @param {string} email - Email do usuário.
 * @param {string} password - Senha do usuário.
 * @returns {Promise<object>} - Resultado da operação.
 */
async function signIn(email, password) {
  try {
    const { data, error } = await supabaseClient.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw error;
    }

    return { success: true, data };
  } catch (error) {
    console.error('Erro no login:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Realiza o logout do usuário.
 * @returns {Promise<object>} - Resultado da operação.
 */
async function signOut() {
  try {
    const { error } = await supabaseClient.auth.signOut();
    if (error) {
      throw error;
    }
    return { success: true };
  } catch (error) {
    console.error('Erro no logout:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Obtém a sessão de autenticação atual.
 * @returns {Promise<object>} - A sessão atual.
 */
async function getAuthState() {
  return supabaseClient.auth.getSession();
}

/**
 * Obtém o usuário atualmente autenticado.
 * @returns {Promise<object>} - O usuário atual.
 */
async function getCurrentUser() {
  return supabaseClient.auth.getUser();
}

/**
 * Ouve mudanças no estado de autenticação.
 * @param {function} callback - Função a ser chamada em cada mudança.
 * @returns {function} - Função para cancelar a subscrição.
 */
function onAuthStateChange(callback) {
  return supabaseClient.auth.onAuthStateChange(callback);
}

// =========================================
// FUNÇÕES DE COMUNICAÇÃO COM A IA
// =========================================

/**
 * Envia uma pergunta para a API da EdenAI.
 * @param {string} question - A pergunta a ser enviada.
 * @returns {Promise<object>} - Resultado da chamada à API.
 */
async function askEdenAI(question) {
    const apiKey = window.ENV.VITE_EDEN_AI_API_KEY;
    const apiUrl = 'https://api.edenai.run/v2/text/generation';
    
    try {
        const response = await axios.post(apiUrl, {
            providers: 'openai', // Você pode trocar o provedor se tiver outras chaves
            text: question,
            temperature: 0.2,
            max_tokens: 500,
        }, {
            headers: {
                Authorization: `Bearer ${apiKey}`
            }
        });
        
        const generatedText = response.data.openai.generated_text;
        
        // Salva a interação no Supabase
        const { error: dbError } = await supabaseClient
            .from('interactions')
            .insert({
                user_id: (await getCurrentUser()).data.user.id,
                question: question,
                ai_responses: [{ response: generatedText }]
            });
            
        if (dbError) {
            console.error('Erro ao salvar interação:', dbError);
        }
        
        return { success: true, data: generatedText };
        
    } catch (error) {
        console.error('Erro na chamada da API EdenAI:', error);
        return { success: false, error: error.response?.data?.error || error.message };
    }
}

/**
 * Obtém o histórico de interações do Supabase.
 * @returns {Promise<object>} - O histórico de interações do usuário.
 */
async function getEdenAIHistory() {
    try {
        const { data, error } = await supabaseClient
            .from('interactions')
            .select('question, ai_responses')
            .eq('user_id', (await getCurrentUser()).data.user.id)
            .order('created_at', { ascending: true });
        
        if (error) {
            throw error;
        }
        
        return { success: true, data };
        
    } catch (error) {
        console.error('Erro ao carregar histórico:', error);
        return { success: false, error: error.message };
    }
}

// =========================================
// EXPOSIÇÃO DE FUNÇÕES GLOBAIS
// =========================================

window.signIn = signIn;
window.signUp = signUp;
window.signOut = signOut;
window.getAuthState = getAuthState;
window.askEdenAI = askEdenAI;
window.getEdenAIHistory = getEdenAIHistory;

console.log('main.js carregado. Funções globais expostas.');

// auth,js - parte da autenticação

// auth.js - Funções de autenticação e gerenciamento de usuário
// Importa a instância do cliente Supabase do arquivo supabase-client.js
import { supabase } from './supabase-client.js';

// Função de cadastro de usuário
export async function signUp(email, password, options = {}) {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: options.fullName || null
        }
      }
    });

    if (error) {
      throw error;
    }

    return { success: true, data };
  } catch (error) {
    console.error('Erro no cadastro:', error);
    return { success: false, error: error.message };
  }
}

// Função de login
export async function signIn(email, password) {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw error;
    }

    return { success: true, data };
  } catch (error) {
    console.error('Erro no login:', error);
    return { success: false, error: error.message };
  }
}

// Função de logout
export async function signOut() {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) {
      throw error;
    }
    return { success: true };
  } catch (error) {
    console.error('Erro no logout:', error);
    return { success: false, error: error.message };
  }
}

// Função para obter a sessão atual
export async function getAuthState() {
  return supabase.auth.getSession();
}

// Função para obter o usuário atual
export async function getCurrentUser() {
  return supabase.auth.getUser();
}

// Função para ouvir mudanças no estado de autenticação
export function onAuthStateChange(callback) {
  return supabase.auth.onAuthStateChange(callback);
}

// Função para redefinir a senha via e-mail
export async function resetPassword(email) {
  try {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/update-password`
    });

    if (error) {
      throw error;
    }
    return { success: true, data };
  } catch (error) {
    console.error('Erro ao redefinir senha:', error);
    return { success: false, error: error.message };
  }
}

// Função para atualizar a senha
export async function updatePassword(newPassword) {
  try {
    const { data, error } = await supabase.auth.updateUser({
      password: newPassword
    });

    if (error) {
      throw error;
    }
    return { success: true, data };
  } catch (error) {
    console.error('Erro ao atualizar senha:', error);
    return { success: false, error: error.message };
  }
}

//eden-ai.js - programação da IA

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
