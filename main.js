// main.js - Gerencia a lógica central, incluindo autenticação e a comunicação com a IA.

// Importa a biblioteca Supabase para gerenciar a autenticação e o banco de dados
// ✅ CORREÇÃO: Usamos o caminho correto para a versão 'esm' do Supabase.
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.38.0/dist/supabase.esm.min.js';

// Variáveis para a API Supabase e Eden AI
const supabaseUrl = window.ENV.VITE_SUPABASE_URL;
const supabaseAnonKey = window.ENV.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// =========================================
// FUNÇÕES DE AUTENTICAÇÃO
// =========================================

// Função para lidar com o login de um usuário existente
async function signIn(email, password) {
    try {
        const { data, error } = await supabase.auth.signInWithPassword({
            email: email,
            password: password,
        });
        if (error) throw error;
        return { success: true, data: data };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

// Função para lidar com o cadastro de um novo usuário
async function signUp(email, password, options = {}) {
    try {
        const { data, error } = await supabase.auth.signUp({
            email: email,
            password: password,
            options: options
        });
        if (error) throw error;
        return { success: true, data: data };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

// Função para deslogar o usuário
async function signOut() {
    try {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

// Ouve mudanças no estado de autenticação (login, logout) e notifica o app.js
if (typeof window.onAuthStateChange === 'function') {
    supabase.auth.onAuthStateChange(window.onAuthStateChange);
}

// =========================================
// FUNÇÕES DA IA - MUDANÇA PARA GEMINI
// =========================================

// Função para interagir com a API do Gemini
async function askGemini(question) {
    const apiKey = ""; // A plataforma irá fornecer uma chave automaticamente
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${apiKey}`;

    const payload = {
        contents: [
            {
                role: "user",
                parts: [
                    {
                        text: question
                    }
                ]
            }
        ]
    };
    
    try {
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`Erro na API do Gemini: ${errorData.error.message}`);
        }

        const result = await response.json();
        const generatedText = result.candidates[0].content.parts[0].text;
        
        return { success: true, data: generatedText };
    } catch (error) {
        console.error('Erro ao chamar a API do Gemini:', error);
        return { success: false, error: error.message };
    }
}

// Exponha as funções globalmente para que o app.js possa usá-las
window.signIn = signIn;
window.signUp = signUp;
window.signOut = signOut;
window.askGemini = askGemini;

console.log('Main.js carregado');
