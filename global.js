// global.js - Exporta funções para escopo global
import { signUp, signIn, signOut, getAuthState, getCurrentUser } from './auth.js';
import { askEdenAI, getEdenAIHistory } from './eden-ai.js';


window.signUp = signUp;
window.signIn = signIn;
window.signOut = signOut;
window.getAuthState = getAuthState;
window.getCurrentUser = getCurrentUser;
window.askEdenAI = askEdenAI;
window.getEdenAIHistory = getEdenAIHistory;

console.log("Aplicação iniciada!");