// main.js - Centraliza todas as funções de autenticação e da IA.

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
window.onAuthStateChange = onAuthStateChange;
window.askEdenAI = askEdenAI;
window.getEdenAIHistory = getEdenAIHistory;

console.log('main.js carregado. Funções globais expostas.');
