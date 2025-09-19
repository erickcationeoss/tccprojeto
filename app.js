// app.js - Controle principal da aplicação
console.log('Aplicação iniciada!');

// Elementos da interface
let currentUser = null;

// Função para alternar entre login e cadastro
function setupAuthTabs() {
    const authBtns = document.querySelectorAll('.auth-btn');
    const authForms = document.querySelectorAll('.auth-form');
    
    authBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Remover classe active de todos
            authBtns.forEach(b => b.classList.remove('active'));
            authForms.forEach(f => f.classList.remove('active'));
            
            // Adicionar classe active no botão clicado
            btn.classList.add('active');
            
            // Mostrar formulário correspondente
            const tabName = btn.getAttribute('data-tab');
            const formToShow = document.getElementById(`${tabName}Form`);
            if (formToShow) {
                formToShow.classList.add('active');
            }
        });
    });
}

// Função para configurar formulários
function setupAuthForms() {
    // Formulário de login
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('loginEmail').value;
            const password = document.getElementById('loginPassword').value;
            
            console.log('Tentando login:', email);
            // Aqui vai chamar sua função signIn do auth.js
            try {
                const result = await window.signIn(email, password);
                if (result.success) {
                    showChatScreen();
                } else {
                    alert('Erro no login: ' + result.error);
                }
            } catch (error) {
                alert('Erro: ' + error.message);
            }
        });
    }

    // Formulário de cadastro
    const signupForm = document.getElementById('signupForm');
    if (signupForm) {
        signupForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('signupEmail').value;
            const password = document.getElementById('signupPassword').value;
            const fullName = document.getElementById('fullName').value;
            
            console.log('Tentando cadastro:', email);
            // Aqui vai chamar sua função signUp do auth.js
            try {
                const result = await window.signUp(email, password, { fullName });
                if (result.success) {
                    alert('Cadastro realizado! Verifique seu email.');
                    // Alternar para login após cadastro
                    document.querySelector('[data-tab="login"]').click();
                } else {
                    alert('Erro no cadastro: ' + result.error);
                }
            } catch (error) {
                alert('Erro: ' + error.message);
            }
        });
    }
}

// Função para mostrar tela de chat
function showChatScreen() {
    document.getElementById('authScreen').style.display = 'none';
    document.getElementById('chatScreen').style.display = 'block';
    console.log('Chat screen mostrada');
}

// Função para voltar para auth
function showAuthScreen() {
    document.getElementById('authScreen').style.display = 'block';
    document.getElementById('chatScreen').style.display = 'none';
    console.log('Auth screen mostrada');
}

// Configurar botão de logout
function setupLogout() {
    const logoutBtn = document.querySelector('.logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            try {
                await window.signOut();
                showAuthScreen();
            } catch (error) {
                alert('Erro ao sair: ' + error.message);
            }
        });
    }
}

// Inicialização da aplicação
function initApp() {
    console.log('App inicializado');
    
    // Configurar abas de autenticação
    setupAuthTabs();
    
    // Configurar formulários
    setupAuthForms();
    
    // Configurar logout
    setupLogout();
    
    // Verificar se já está logado
    checkAuthState();
}

// Verificar estado de autenticação
async function checkAuthState() {
    try {
        const { data } = await window.getAuthState();
        if (data.session) {
            currentUser = data.session.user;
            showChatScreen();
        }
    } catch (error) {
        console.log('Usuário não autenticado');
    }
}

// Iniciar quando o DOM carregar
document.addEventListener('DOMContentLoaded', initApp);

// Exportar funções globais para outros módulos
window.showChatScreen = showChatScreen;
window.showAuthScreen = showAuthScreen;