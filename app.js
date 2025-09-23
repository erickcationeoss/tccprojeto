// app.js - Controle principal da aplicação
console.log('Aplicação iniciada!');

// Elementos da interface
let currentUser = null;

// --- FUNÇÕES DE CONTROLE DE TELA ---

/**
 * Alterna entre as abas de login e cadastro.
 */
function setupAuthTabs() {
    const authBtns = document.querySelectorAll('.auth-btn');
    const authForms = document.querySelectorAll('.auth-form');
    
    authBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            authBtns.forEach(b => b.classList.remove('active'));
            authForms.forEach(f => f.classList.remove('active'));
            
            btn.classList.add('active');
            
            const tabName = btn.getAttribute('data-tab');
            const formToShow = document.getElementById(`${tabName}Form`);
            if (formToShow) {
                formToShow.classList.add('active');
            }
        });
    });
}

/**
 * Configura os listeners dos formulários de login e cadastro.
 */
function setupAuthForms() {
    // Formulário de login
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('loginEmail').value;
            const password = document.getElementById('loginPassword').value;
            
            console.log('Tentando login:', email);
            try {
                const result = await window.signIn(email, password);
                if (result.success) {
                    showChatScreen();
                } else {
                    showMessage('Erro no login: ' + result.error, 'error');
                }
            } catch (error) {
                showMessage('Erro: ' + error.message, 'error');
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
 * Exibe a tela de chat.
 */
function showChatScreen() {
    const authScreen = document.getElementById('authScreen');
    const chatScreen = document.getElementById('chatScreen');
    
    if (authScreen && chatScreen) {
        console.log('Mostrando chat screen...');
        authScreen.classList.add('hidden');
        
        // Espera a transição de ocultar a tela de auth para evitar flashes
        setTimeout(() => {
            chatScreen.classList.remove('hidden');
            chatScreen.classList.add('visible');
            initChat();
        }, 500); 
    }
}

/**
 * Exibe a tela de autenticação.
 */
function showAuthScreen() {
    const authScreen = document.getElementById('authScreen');
    const chatScreen = document.getElementById('chatScreen');
    
    if (authScreen && chatScreen) {
        console.log('Mostrando auth screen...');
        chatScreen.classList.remove('visible');
        chatScreen.classList.add('hidden');
        
        setTimeout(() => {
            authScreen.classList.remove('hidden');
            authScreen.classList.add('visible');
        }, 500);
    }
}

// --- FUNÇÕES DE INICIALIZAÇÃO E AUTENTICAÇÃO ---

/**
 * Configura o botão de logout.
 */
function setupLogout() {
    const logoutBtn = document.querySelector('.logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            try {
                await window.signOut();
                showAuthScreen();
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
            showChatScreen();
        } else {
            showAuthScreen();
        }
    } catch (error) {
        console.log('Nenhum usuário autenticado. Exibindo tela de login.');
        showAuthScreen();
    }
}

/**
 * Inicializa a aplicação ao carregar o DOM.
 */
function initApp() {
    console.log('App inicializado');
    setupAuthTabs();
    setupAuthForms();
    setupLogout(); 
    checkAuthState();
}

// Iniciar a aplicação quando o DOM estiver completamente carregado
document.addEventListener('DOMContentLoaded', initApp);


// --- FUNÇÕES DA INTERFACE DO CHAT ---

/**
 * Configura as abas do chat.
 */
function setupChatTabs() {
    const chatTabs = document.querySelectorAll('.tab');
    const chatContents = document.querySelectorAll('.chat-content > div');
    
    chatTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            chatTabs.forEach(t => t.classList.remove('active'));
            chatContents.forEach(c => {
                c.classList.remove('fade-in');
            });
            
            tab.classList.add('active');
            
            const tabName = tab.getAttribute('data-tab');
            const contentToShow = document.querySelector(`.${tabName}-content`);
            if (contentToShow) {
                setTimeout(() => {
                    contentToShow.classList.add('fade-in');
                }, 50);
            }
        });
    });
}

/**
 * Configura a área de input de perguntas e o botão de envio.
 */
function setupQuestionInput() {
    const questionInput = document.getElementById('questionInput');
    const sendBtn = document.querySelector('.send-btn');
    
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
    const questionInput = document.getElementById('questionInput');
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
 * Adiciona uma mensagem ao chat.
 * @param {string} text - O texto da mensagem.
 * @param {string} type - O tipo de mensagem ('user' ou 'ai').
 * @param {boolean} isTemp - Se a mensagem é temporária (ex: carregamento).
 */
function addMessage(text, type = 'ai', isTemp = false) {
    const chatMessages = document.getElementById('chatMessages');
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

/**
 * Exibe uma mensagem de feedback para o usuário.
 * @param {string} message - A mensagem a ser exibida.
 * @param {string} type - O tipo da mensagem ('info', 'error', 'success').
 */
function showMessage(message, type = 'info') {
    const messageBox = document.getElementById('messageBox');
    const messageText = document.getElementById('messageText');
    
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
 * Carrega o histórico de mensagens do Supabase.
 */
async function loadChatHistory() {
    try {
        const history = await window.getEdenAIHistory();
        const chatMessages = document.getElementById('chatMessages');
        
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
    const topicItems = document.querySelectorAll('.topic-item');
    topicItems.forEach(item => {
        item.addEventListener('click', () => {
            const topic = item.textContent;
            document.getElementById('questionInput').value = topic;
            document.getElementById('questionInput').focus();
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