// global.js - Exporta funções para escopo global
import { signUp, signIn, signOut, getAuthState, getCurrentUser } from './auth.js';

// Exporta para window
window.signUp = signUp;
window.signIn = signIn;
window.signOut = signOut;
window.getAuthState = getAuthState;
window.getCurrentUser = getCurrentUser;
window.askEdenAI = askEdenAI;
window.getEdenAIHistory = getEdenAIHistory;