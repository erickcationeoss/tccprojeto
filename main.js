
//inicialização do supabase
const supabaseUrl = window.ENV.VITE_SUPABASE_URL
const supabaseAnonKey = window.ENV.VITE_SUPABASE_ANON_KEY

// Inicializar cliente Supabase (agora usando a global window.supabase)
export const supabase = window.supabase.createClient(supabaseUrl, supabaseAnonKey)

// ===== FUNÇÕES DE INICIALIZAÇÃO DO BANCO =====

/**
 * Inicializa o banco de dados criando tabelas necessárias
 * Esta função deve ser chamada uma vez durante o setup da aplicação
 */
export async function initializeDatabase() {
  try {
    console.log('Inicializando banco de dados...')
    
    // Verificar se as tabelas já existem
    const tables = await checkExistingTables()
    
    // Criar tabelas se não existirem
    if (!tables.includes('profiles')) {
      await createProfilesTable()
    }
    
    if (!tables.includes('user_questions')) {
      await createUserQuestionsTable()
    }
    
    if (!tables.includes('ai_responses')) {
      await createAIResponsesTable()
    }
    
    if (!tables.includes('user_interests')) {
      await createUserInterestsTable()
    }
    
    console.log('Banco de dados inicializado com sucesso!')
    return { success: true }
  } catch (error) {
    console.error('Erro ao inicializar banco de dados:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Verifica quais tabelas já existem no banco
 */
async function checkExistingTables() {
  try {
    const { data, error } = await supabase
      .from('pg_tables')
      .select('tablename')
      .eq('schemaname', 'public')

    if (error) throw error
    return data.map(table => table.tablename)
  } catch (error) {
    console.error('Erro ao verificar tabelas:', error)
    return []
  }
}

// ===== CRIAÇÃO DE TABELAS =====

/**
 * Cria tabela de perfis de usuário
 */
async function createProfilesTable() {
  try {
    // Esta tabela será criada via SQL no Supabase devido às constraints
    console.log('Tabela profiles será criada via SQL')
  } catch (error) {
    console.error('Erro ao criar tabela profiles:', error)
  }
}

/**
 * Cria tabela de perguntas dos usuários
 */
async function createUserQuestionsTable() {
  try {
    const { error } = await supabase.rpc('create_user_questions_table')
    if (error) throw error
    console.log('Tabela user_questions criada com sucesso')
  } catch (error) {
    console.error('Erro ao criar tabela user_questions:', error)
  }
}

/**
 * Cria tabela de respostas da IA
 */
async function createAIResponsesTable() {
  try {
    const { error } = await supabase.rpc('create_ai_responses_table')
    if (error) throw error
    console.log('Tabela ai_responses criada com sucesso')
  } catch (error) {
    console.error('Erro ao criar tabela ai_responses:', error)
  }
}

/**
 * Cria tabela de interesses dos usuários
 */
async function createUserInterestsTable() {
  try {
    const { error } = await supabase.rpc('create_user_interests_table')
    if (error) throw error
    console.log('Tabela user_interests criada com sucesso')
  } catch (error) {
    console.error('Erro ao criar tabela user_interests:', error)
  }
}

// ===== FUNÇÕES DE UTILIDADE =====

/**
 * Obtém o perfil completo do usuário atual
 */
export async function getCurrentUserProfile() {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return { success: false, error: 'Usuário não autenticado' }
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (error) throw error

    return { success: true, data }
  } catch (error) {
    console.error('Erro ao obter perfil:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Atualiza o perfil do usuário
 */
export async function updateUserProfile(updates) {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return { success: false, error: 'Usuário não autenticado' }
    }

    const { data, error } = await supabase
      .from('profiles')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id)
      .select()

    if (error) throw error

    return { success: true, data }
  } catch (error) {
    console.error('Erro ao atualizar perfil:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Salva uma pergunta do usuário
 */
export async function saveUserQuestion(question, category = null) {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return { success: false, error: 'Usuário não autenticado' }
    }

    const { data, error } = await supabase
      .from('user_questions')
      .insert({
        user_id: user.id,
        question: question,
        category: category,
        created_at: new Date().toISOString()
      })
      .select()

    if (error) throw error

    return { success: true, data }
  } catch (error) {
    console.error('Erro ao salvar pergunta:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Salva uma resposta da IA
 */
export async function saveAIResponse(questionId, response, provider) {
  try {
    const { data, error } = await supabase
      .from('ai_responses')
      .insert({
        question_id: questionId,
        response: response,
        provider: provider,
        created_at: new Date().toISOString()
      })
      .select()

    if (error) throw error

    return { success: true, data }
  } catch (error) {
    console.error('Erro ao salvar resposta da IA:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Obtém o histórico de interações do usuário
 */
export async function getUserInteractionHistory(limit = 20) {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return { success: false, error: 'Usuário não autenticado' }
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
      .limit(limit)

    if (error) throw error

    return { success: true, data }
  } catch (error) {
    console.error('Erro ao obter histórico:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Adiciona interesses do usuário
 */
export async function addUserInterests(interests) {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return { success: false, error: 'Usuário não autenticado' }
    }

    // Converter array de interesses em objetos para inserção
    const interestsData = interests.map(interest => ({
      user_id: user.id,
      interest: interest,
      created_at: new Date().toISOString()
    }))

    const { data, error } = await supabase
      .from('user_interests')
      .insert(interestsData)
      .select()

    if (error) throw error

    return { success: true, data }
  } catch (error) {
    console.error('Erro ao adicionar interesses:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Obtém interesses do usuário
 */
export async function getUserInterests() {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return { success: false, error: 'Usuário não autenticado' }
    }

    const { data, error } = await supabase
      .from('user_interests')
      .select('interest, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) throw error

    return { success: true, data }
  } catch (error) {
    console.error('Erro ao obter interesses:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Busca usuários por interesses similares
 */
export async function findUsersWithSimilarInterests() {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return { success: false, error: 'Usuário não autenticado' }
    }

    const { data, error } = await supabase
      .rpc('find_similar_interests', { current_user_id: user.id })

    if (error) throw error

    return { success: true, data }
  } catch (error) {
    console.error('Erro ao buscar usuários similares:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Estatísticas do usuário
 */
export async function getUserStats() {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return { success: false, error: 'Usuário não autenticado' }
    }

    const { data, error } = await supabase
      .rpc('get_user_stats', { user_id: user.id })

    if (error) throw error

    return { success: true, data }
  } catch (error) {
    console.error('Erro ao obter estatísticas:', error)
    return { success: false, error: error.message }
  }
}

// ===== FUNÇÕES DE GERENCIAMENTO DE ARQUIVOS =====

/**
 * Faz upload de avatar do usuário
 */
export async function uploadUserAvatar(file) {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return { success: false, error: 'Usuário não autenticado' }
    }

    const fileExt = file.name.split('.').pop()
    const fileName = `${user.id}-${Math.random()}.${fileExt}`
    const filePath = `avatars/${fileName}`

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, file)

    if (uploadError) throw uploadError

    // Obter URL pública
    const { data: { publicUrl } } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath)

    // Atualizar perfil com URL do avatar
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ avatar_url: publicUrl })
      .eq('id', user.id)

    if (updateError) throw updateError

    return { success: true, url: publicUrl }
  } catch (error) {
    console.error('Erro ao fazer upload de avatar:', error)
    return { success: false, error: error.message }
  }
}

// ===== LISTENERS E REALTIME =====

/**
 * Inscreve-se para atualizações em tempo real
 */
export function subscribeToRealtime(table, event, callback) {
  return supabase
    .channel('custom-channels')
    .on(
      'postgres_changes',
      {
        event: event,
        schema: 'public',
        table: table
      },
      callback
    )
    .subscribe()
}

/**
 * Cancela todas as inscrições
 */
export function unsubscribeAll() {
  supabase.removeAllChannels()
}

// ===== TRATAMENTO DE ERROS =====

/**
 * Tratador global de erros do Supabase
 */
export function setupErrorHandling() {
  // Listener global de erros de autenticação
  supabase.auth.onAuthStateChange((event, session) => {
    if (event === 'SIGNED_OUT') {
      console.log('Usuário deslogado')
    }
    
    if (event === 'TOKEN_REFRESHED') {
      console.log('Token atualizado')
    }
  })
}

// ===== EXPORTAÇÕES PRINCIPAIS =====

export default {
  supabase,
  initializeDatabase,
  getCurrentUserProfile,
  updateUserProfile,
  saveUserQuestion,
  saveAIResponse,
  getUserInteractionHistory,
  addUserInterests,
  getUserInterests,
  findUsersWithSimilarInterests,
  getUserStats,
  uploadUserAvatar,
  subscribeToRealtime,
  unsubscribeAll,
  setupErrorHandling
}

// global.js - Exporta funções para o escopo global do window
import { signUp, signIn, signOut, getAuthState, getCurrentUser } from './auth.js';
import { askEdenAI, getEdenAIHistory } from './eden-ai.js';


// Anexa as funções importadas ao objeto 'window'
window.signUp = signUp;
window.signIn = signIn;
window.signOut = signOut;
window.getAuthState = getAuthState;
window.getCurrentUser = getCurrentUser;
window.askEdenAI = askEdenAI;
window.getEdenAIHistory = getEdenAIHistory;

console.log("global.js carregado. Aplicação pronta para iniciar!");

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

// eden-ai - programação da I.A

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
