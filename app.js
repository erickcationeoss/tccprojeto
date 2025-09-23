// app.js - Lógica principal da aplicação
console.log('Aplicação iniciada!');

// =========================================
// REFERÊNCIAS DE ELEMENTOS DO DOM
// =========================================
const authScreen = document.getElementById('authScreen');
const chatScreen = document.getElementById('chatScreen');
const loginForm = document.getElementById('loginForm');
const signupForm = document.getElementById('signupForm');
const authBtns = document.querySelectorAll('.auth-switcher .auth-btn');
const messageBox = document.getElementById('messageBox');
const messageText = document.getElementById('messageText');
const logoutBtn = document.querySelector('.logout-btn');
const questionInput = document.getElementById('questionInput');
const sendBtn = document.querySelector('.send-btn');
const chatMessages = document.getElementById('chatMessages');
const chatTabs = document.querySelectorAll('.chat-tabs .tab');
const topicItems = document.querySelectorAll('.topic-item');

let currentUser = null;

// =========================================
// FUNÇÕES DE UTILIDADE
// =========================================

/**
 * Exibe uma mensagem de feedback para o usuário.
 * @param {string} message - A mensagem a ser exibida.
 * @param {string} type - O tipo da mensagem ('info' ou 'error').
 */
function showMessage(message, type = 'info') {
    if (messageBox && messageText) {
        messageText.textContent = message;
        messageBox.className = `message-box ${type}`;
        messageBox.style.display = 'block';
        
        setTimeout(() => {
            messageBox.style.display = 'none';
        }, 5000); // Esconde a mensagem após 5 segundos
    }
}

/**
 * Adiciona uma mensagem ao chat.
 * @param {string} text - O texto da mensagem.
 * @param {string} type - O tipo de mensagem ('user' ou 'ai').
 * @param {boolean} isTemp - Se a mensagem é temporária (ex: carregamento).
 */
function addMessage(text, type = 'ai', isTemp = false) {
    if (!chatMessages) return null;
    
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}`;
    messageDiv.style.opacity = '0';
    
    const time = new Date().toLocaleTimeString('pt-BR', { 
        hour: '2-digit', 
        minute: '2-digit' 
    });
    
    messageDiv.innerHTML = `
        <div class="message-content">
            <p>${text}</p>
        </div>
        <span class="message-time">${time}</span>
    `;
    
    if (isTemp) {
        messageDiv.id = 'temp-loading-msg';
    }
    
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    
    setTimeout(() => {
        messageDiv.style.opacity = '1';
        messageDiv.style.transition = 'opacity 0.3s ease-in-out';
    }, 10);
    
    return isTemp ? messageDiv : null;
}

// =========================================
// FUNÇÕES DE CONTROLE DE TELA
// =========================================

/**
 * Alterna entre a tela de autenticação e a de chat.
 * @param {string} screenName - O nome da tela ('auth' ou 'chat').
 */
function showScreen(screenName) {
    const screens = {
        'auth': authScreen,
        'chat': chatScreen
    };

    const screenToShow = screens[screenName];
    const screenToHide = screenName === 'auth' ? chatScreen : authScreen;

    if (screenToShow && screenToHide) {
        console.log(`Mostrando tela: ${screenName}`);
        screenToHide.classList.remove('visible');
        screenToHide.classList.add('hidden');

        // Espera a transição de ocultar para evitar flashes
        setTimeout(() => {
            screenToShow.classList.remove('hidden');
            screenToShow.classList.add('visible');
            if (screenName === 'chat') {
                initChat();
            }
        }, 500); 
    }
}

// =========================================
// LÓGICA DE AUTENTICAÇÃO
// =========================================

/**
 * Configura os listeners dos formulários de login e cadastro.
 */
function setupAuthForms() {
    // Formulário de login
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('loginEmail').value;
            const password = document.getElementById('loginPassword').value;
            
            try {
                const result = await window.signIn(email, password);
                if (result.success) {
                    showScreen('chat');
                } else {
                    showMessage('Erro no login: ' + result.error, 'error');
                }
            } catch (error) {
                showMessage('Erro: ' + error.message, 'error');
            }
        });
    }

    // Formulário de cadastro
    if (signupForm) {
        signupForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('signupEmail').value;
            const password = document.getElementById('signupPassword').value;
            const fullName = document.getElementById('fullName').value;
            
            try {
                const result = await window.signUp(email, password, { fullName });
                if (result.success) {
                    showMessage('Cadastro realizado! Verifique seu email para confirmar.', 'info');
                    // Alternar para login após cadastro
                    document.querySelector('[data-tab="login"]').click();
                } else {
                    showMessage('Erro no cadastro: ' + result.error, 'error');
                }
            } catch (error) {
                showMessage('Erro: ' + error.message, 'error');
            }
        });
    }
}

/**
 * Configura o botão de logout.
 */
function setupLogout() {
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            try {
                await window.signOut();
                showScreen('auth');
            } catch (error) {
                showMessage('Erro ao sair: ' + error.message, 'error');
            }
        });
    }
}

/**
 * Verifica o estado de autenticação do usuário ao carregar a página.
 */
async function checkAuthState() {
    try {
        const { data } = await window.getAuthState();
        if (data && data.session) {
            currentUser = data.session.user;
            showScreen('chat');
        } else {
            showScreen('auth');
        }
    } catch (error) {
        console.log('Nenhum usuário autenticado. Exibindo tela de login.');
        showScreen('auth');
    }
}

// =========================================
// LÓGICA DO CHAT
// =========================================

/**
 * Configura as abas do chat.
 */
function setupChatTabs() {
    chatTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            chatTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            // Lógica para mostrar/esconder o conteúdo das abas
            const contentToShow = document.querySelector(`.chat-content .${tab.dataset.tab}-content`);
            const allContents = document.querySelectorAll('.chat-content > div:not(.sidebar)');
            allContents.forEach(content => {
                content.style.display = 'none';
            });
            if (contentToShow) {
                contentToShow.style.display = 'flex';
            }
        });
    });
}

/**
 * Configura a área de input de perguntas e o botão de envio.
 */
function setupQuestionInput() {
    if (questionInput && sendBtn) {
        questionInput.addEventListener('input', function() {
            this.style.height = 'auto';
            this.style.height = (this.scrollHeight) + 'px';
        });
        
        sendBtn.addEventListener('click', sendQuestion);
        
        questionInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendQuestion();
            }
        });
    }
}

/**
 * Envia a pergunta para a IA e gerencia a resposta.
 */
async function sendQuestion() {
    const question = questionInput.value.trim();
    
    if (!question) return;
    
    try {
        questionInput.value = '';
        questionInput.style.height = 'auto';
        
        addMessage(question, 'user');
        
        const loadingMsg = addMessage('Pensando...', 'ai', true);
        
        const response = await window.askEdenAI(question);
        
        if (loadingMsg) {
            loadingMsg.remove();
        }
        
        if (response.success) {
            addMessage(response.data, 'ai');
        } else {
            addMessage('Erro: ' + response.error, 'ai');
        }
        
    } catch (error) {
        console.error('Erro ao enviar pergunta:', error);
        addMessage('Desculpe, ocorreu um erro. Tente novamente.', 'ai');
    }
}

/**
 * Carrega o histórico de mensagens do Supabase.
 */
async function loadChatHistory() {
    try {
        const history = await window.getEdenAIHistory();
        if (!chatMessages) return;
        
        chatMessages.innerHTML = ''; 
        
        if (history.success && history.data && history.data.length > 0) {
            history.data.forEach(interaction => {
                addMessage(interaction.question, 'user');
                if (interaction.ai_responses && interaction.ai_responses[0]) {
                    addMessage(interaction.ai_responses[0].response, 'ai');
                }
            });
        }
    } catch (error) {
        console.error('Erro ao carregar histórico:', error);
    }
}

/**
 * Configura os tópicos sugeridos para o chat.
 */
function setupSuggestedTopics() {
    topicItems.forEach(item => {
        item.addEventListener('click', () => {
            const topic = item.textContent;
            if (questionInput) {
                questionInput.value = topic;
                questionInput.focus();
            }
        });
    });
}

/**
 * Inicializa as funcionalidades da tela de chat.
 */
function initChat() {
    console.log('Inicializando chat...');
    setupChatTabs();
    setupQuestionInput();
    setupSuggestedTopics();
    loadChatHistory();
}

// =========================================
// INICIALIZAÇÃO DA APLICAÇÃO
// =========================================

/**
 * Inicializa a aplicação ao carregar o DOM.
 */
function initApp() {
    console.log('App inicializado');
    
    // Setup das abas de autenticação
    authBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            authBtns.forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.auth-form').forEach(f => f.classList.remove('active'));
            btn.classList.add('active');
            document.getElementById(`${btn.dataset.tab}Form`).classList.add('active');
        });
    });
    
    setupAuthForms();
    setupLogout(); 
    checkAuthState();
}

// Iniciar a aplicação quando o DOM estiver completamente carregado
document.addEventListener('DOMContentLoaded', initApp);
