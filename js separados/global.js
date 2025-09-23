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