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

// FUNÇÃO SHOWCHATSCREEN CORRIGIDA (usando apenas classes CSS)
function showChatScreen() {
    const authScreen = document.getElementById('authScreen');
    const chatScreen = document.getElementById('chatScreen');
    
    if (authScreen && chatScreen) {
        console.log('Mostrando chat screen...');
        
        // 1. Primeiro esconder a tela de auth
        authScreen.classList.add('hidden');
        
        // 2. Esperar a transição terminar antes de mostrar o chat
        setTimeout(() => {
            chatScreen.classList.add('active');
            
            // 3. Inicializar o chat DEPOIS que estiver visível
            setTimeout(() => {
                initChat();
                console.log('Chat inicializado');
            }, 100);
            
        }, 300); // Tempo da transição CSS (0.5s = 500ms)
    }
}

// FUNÇÃO SHOWAUTHSCREEN CORRIGIDA
function showAuthScreen() {
    const authScreen = document.getElementById('authScreen');
    const chatScreen = document.getElementById('chatScreen');
    
    if (authScreen && chatScreen) {
        console.log('Mostrando auth screen...');
        
        // 1. Esconder chat screen
        chatScreen.classList.remove('active');
        
        // 2. Esperar transição terminar antes de mostrar auth
        setTimeout(() => {
            authScreen.classList.remove('hidden');
        }, 300);
    }
}



// Inicialização da aplicação
function initApp() {
    console.log('App inicializado');
    
    // Configurar estado inicial de opacidade
    const authScreen = document.getElementById('authScreen');
    const chatScreen = document.getElementById('chatScreen');
    
    if (authScreen) {
        authScreen.style.opacity = '1';
        authScreen.style.display = 'block';
    }
    
    if (chatScreen) {
        chatScreen.style.opacity = '0';
        chatScreen.style.display = 'none';
    }
    
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

// ===== FUNÇÕES DA INTERFACE DO CHAT =====

// Configurar abas do chat
function setupChatTabs() {
    const chatTabs = document.querySelectorAll('.tab');
    const chatContents = document.querySelectorAll('.chat-content > div');
    
    chatTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            // Remover active de todas as abas
            chatTabs.forEach(t => t.classList.remove('active'));
            chatContents.forEach(c => {
                c.style.display = 'none';
                c.classList.remove('fade-in');
            });
            
            // Adicionar active na aba clicada
            tab.classList.add('active');
            
            // Mostrar conteúdo correspondente
            const tabName = tab.getAttribute('data-tab');
            const contentToShow = document.querySelector(`.${tabName}-content`);
            if (contentToShow) {
                contentToShow.style.display = 'block';
                setTimeout(() => {
                    contentToShow.classList.add('fade-in');
                }, 50);
            }
        });
    });
}

// Configurar área de input de perguntas
function setupQuestionInput() {
    const questionInput = document.getElementById('questionInput');
    const sendBtn = document.querySelector('.send-btn');
    
    if (questionInput && sendBtn) {
        // Auto-ajustar altura do textarea
        questionInput.addEventListener('input', function() {
            this.style.height = 'auto';
            this.style.height = (this.scrollHeight) + 'px';
        });
        
        // Enviar pergunta ao clicar no botão
        sendBtn.addEventListener('click', sendQuestion);
        
        // Enviar pergunta ao pressionar Enter
        questionInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendQuestion();
            }
        });
    }
}

// Função para enviar pergunta à IA
async function sendQuestion() {
    const questionInput = document.getElementById('questionInput');
    const question = questionInput.value.trim();
    
    if (!question) return;
    
    try {
        // Limpar input e ajustar altura
        questionInput.value = '';
        questionInput.style.height = 'auto';
        
        // Adicionar mensagem do usuário no chat
        addMessage(question, 'user');
        
        // Mostrar indicador de carregamento
        const loadingMsg = addMessage('Pensando...', 'ai', true);
        
        // Chamar a IA
        const response = await window.askEdenAI(question);
        
        // Remover mensagem de carregamento
        if (loadingMsg) {
            loadingMsg.remove();
        }
        
        // Adicionar resposta da IA
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

// Adicionar mensagem no chat
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
    
    // Animação de entrada suave
    setTimeout(() => {
        messageDiv.style.opacity = '1';
        messageDiv.style.transition = 'opacity 0.3s ease-in-out';
    }, 10);
    
    return isTemp ? messageDiv : null;
}

// Carregar histórico de mensagens
async function loadChatHistory() {
    try {
        const history = await window.getEdenAIHistory();
        const chatMessages = document.getElementById('chatMessages');
        
        if (!chatMessages) return;
        
        chatMessages.innerHTML = ''; // Limpar mensagens atuais
        
        // Adicionar mensagem de boas-vindas
        addMessage('Olá! Sou seu assistente de estudos. Como posso ajudá-lo hoje?', 'ai');
        
        // Adicionar histórico (se houver)
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
        const chatMessages = document.getElementById('chatMessages');
        if (chatMessages) {
            addMessage('Olá! Sou seu assistente de estudos. Como posso ajudá-lo hoje?', 'ai');
        }
    }
}

// Configurar tópicos sugeridos
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

// ===== INICIALIZAÇÃO DO CHAT =====
function initChat() {
    console.log('Inicializando chat...');
    
    setupChatTabs();
    setupQuestionInput();
    setupSuggestedTopics();
    loadChatHistory();
}