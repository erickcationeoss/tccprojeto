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