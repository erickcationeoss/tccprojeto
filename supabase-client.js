
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