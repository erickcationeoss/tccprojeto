import { supabase } from './supabase-client.js'

// Função de cadastro simplificada
export async function signUp(email, password) {
  try {
    // 1. Criar usuário no Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    })

    if (authError) throw authError

    // 2. Criar perfil básico (apenas id e created_at)
    const { error: profileError } = await supabase
      .from('profiles')
      .insert([{ id: authData.user.id }])

    if (profileError) throw profileError

    return { success: true, data: authData }
  } catch (error) {
    console.error('Erro no cadastro:', error)
    return { success: false, error: error.message }
  }
}

// Função de login (mantida igual)
export async function signIn(email, password) {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) throw error

    return { success: true, data }
  } catch (error) {
    console.error('Erro no login:', error)
    return { success: false, error: error.message }
  }
}

// Função de logout (mantida igual)
export async function signOut() {
  try {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
    return { success: true }
  } catch (error) {
    console.error('Erro no logout:', error)
    return { success: false, error: error.message }
  }
}

// Verificar estado de autenticação (mantida)
export function getAuthState() {
  return supabase.auth.getSession()
}

// Ouvir mudanças de estado (mantida)
export function onAuthStateChange(callback) {
  return supabase.auth.onAuthStateChange(callback)
}

// Obter usuário atual (mantida)
export function getCurrentUser() {
  return supabase.auth.getUser()
}

// Buscar perfil do usuário (simplificada - agora só retorna id e created_at)
export async function getUserProfile(userId) {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, created_at')
      .eq('id', userId)
      .single()

    if (error) throw error

    return { success: true, data }
  } catch (error) {
    console.error('Erro ao buscar perfil:', error)
    return { success: false, error: error.message }
  }
}

// Redefinir senha (mantida)
export async function resetPassword(email) {
  try {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/update-password`,
    })

    if (error) throw error

    return { success: true, data }
  } catch (error) {
    console.error('Erro ao redefinir senha:', error)
    return { success: false, error: error.message }
  }
}

// Atualizar senha (mantida)
export async function updatePassword(newPassword) {
  try {
    const { data, error } = await supabase.auth.updateUser({
      password: newPassword,
    })

    if (error) throw error

    return { success: true, data }
  } catch (error) {
    console.error('Erro ao atualizar senha:', error)
    return { success: false, error: error.message }
  }
}

// REMOVIDA: função updateProfile (não é mais necessária)
// REMOVIDA: inserção de dados extras no signUp