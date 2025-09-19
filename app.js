// app.js - Controle principal da aplicação
console.log('Aplicação iniciada!');

// Funções básicas para começar
function initApp() {
    console.log('App inicializado');
    // Aqui vai a lógica para trocar entre telas de auth e chat
}

document.addEventListener('DOMContentLoaded', initApp);
console.log('Supabase URL:', import.meta.env.VITE_SUPABASE_URL)
console.log('Eden AI Key existe?', !!import.meta.env.VITE_EDEN_AI_API_KEY)
const EDEN_AI_BASE_URL = 'https://api.edenai.run/v2';