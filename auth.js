// auth.js - Sistema de autenticação com Supabase

import { createClient } from '@supabase/supabase-js'

// Configuração do Supabase
const supabaseUrl = 'https://seu-projeto.supabase.co'
const supabaseAnonKey = 'sua-chave-anon-publica'
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Função de cadastro
export async function signUp(email, password, userData) {
  try {
    // 1. Criar usuário no Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    })

    if (authError) throw authError

    // 2. Inserir dados extras na tabela profiles
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .insert([
        {
          id: authData.user.id,
          email: email,
          full_name: userData.fullName,
          interests: userData.interests,
          created_at: new Date(),
        },
      ])
      .select()

    if (profileError) throw profileError

    return { success: true, data: { authData, profileData } }
  } catch (error) {
    console.error('Erro no cadastro:', error)
    return { success: false, error: error.message }
  }
}

// Função de login
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

// Função de logout
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

// Verificar estado de autenticação
export function getAuthState() {
  return supabase.auth.getSession()
}

// Ouvir mudanças de estado de autenticação
export function onAuthStateChange(callback) {
  return supabase.auth.onAuthStateChange((event, session) => {
    callback(event, session)
  })
}

// Obter usuário atual
export function getCurrentUser() {
  return supabase.auth.getUser()
}

// Atualizar perfil do usuário
export async function updateProfile(userId, updates) {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select()

    if (error) throw error

    return { success: true, data }
  } catch (error) {
    console.error('Erro ao atualizar perfil:', error)
    return { success: false, error: error.message }
  }
}

// Buscar perfil do usuário
export async function getUserProfile(userId) {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (error) throw error

    return { success: true, data }
  } catch (error) {
    console.error('Erro ao buscar perfil:', error)
    return { success: false, error: error.message }
  }
}

// Redefinir senha
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

// Atualizar senha
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