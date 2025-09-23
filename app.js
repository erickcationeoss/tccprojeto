// app.js - Controla toda a interface de usuário e a lógica de interação.

// =========================================
// VARIÁVEIS GLOBAIS E ELEMENTOS DA UI
// =========================================
const authScreen = document.getElementById('authScreen');
const chatScreen = document.getElementById('chatScreen');

const loginForm = document.getElementById('loginForm');
const signupForm = document.getElementById('signupForm');
const authBtns = document.querySelectorAll('.auth-btn');

const logoutBtn = document.querySelector('.logout-btn');
const chatMessages = document.getElementById('chatMessages');
const questionInput = document.getElementById('questionInput');
const sendBtn = document.querySelector('.send-btn');
const chatTabs = document.querySelectorAll('.chat-tabs .tab');

// Função para mostrar mensagens de feedback temporárias
function showMessage(text, type = 'info') {
    const messageBox = document.createElement('div');
    messageBox.className = `message-box ${type}`;
    messageBox.innerText = text;
    document.body.appendChild(messageBox);
    messageBox.style.display = 'block';

    setTimeout(() => {
        messageBox.style.opacity = '0';
        messageBox.addEventListener('transitionend', () => {
            messageBox.remove();
        });
    }, 3000);
}

// Função para alternar a visibilidade das telas
function showScreen(screen) {
    authScreen.classList.remove('visible');
    chatScreen.classList.remove('visible');
    authScreen.classList.add('hidden');
    chatScreen.classList.add('hidden');
    screen.classList.remove('hidden');
    screen.classList.add('visible');
}

// Função para exibir uma mensagem no chat
function displayMessage(text, sender) {
    const messageEl = document.createElement('div');
    messageEl.className = `message ${sender}`;
    messageEl.innerHTML = `
        <div class="message-content">
            <p>${text}</p>
        </div>
        <span class="message-time">${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
    `;
    chatMessages.appendChild(messageEl);
    chatMessages.scrollTop = chatMessages.scrollHeight; // Rolar para a última mensagem
}

// =========================================
// LÓGICA DE AUTENTICAÇÃO
// =========================================
window.onload = function() {
    // Ouve mudanças no estado de autenticação (login/logout)
    window.onAuthStateChange((event, session) => {
        if (session) {
            // Usuário logado
            showScreen(chatScreen);
            console.log('Usuário logado:', session.user);
        } else {
            // Usuário deslogado
            showScreen(authScreen);
            console.log('Usuário deslogado');
        }
    });

    // Lógica para alternar entre login e cadastro
    authBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            authBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            const tab = btn.dataset.tab;
            document.querySelectorAll('.auth-form').forEach(form => {
                form.classList.remove('active');
            });
            document.getElementById(`${tab}Form`).classList.add('active');
        });
    });

    // Lida com o formulário de login
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;

        const result = await window.signIn(email, password);
        if (result.success) {
            showMessage('Login realizado com sucesso!', 'info');
        } else {
            showMessage('Erro ao fazer login. Verifique suas credenciais.', 'error');
        }
    });

    // Lida com o formulário de cadastro
    signupForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('signupEmail').value;
        const password = document.getElementById('signupPassword').value;
        const fullName = document.getElementById('fullName').value;

        const result = await window.signUp(email, password, { fullName });
        if (result.success) {
            showMessage('Conta criada com sucesso! Faça login para continuar.', 'info');
        } else {
            showMessage(`Erro ao criar conta: ${result.error}`, 'error');
        }
    });

    // Lida com o botão de logout
    logoutBtn.addEventListener('click', async () => {
        const result = await window.signOut();
        if (result.success) {
            showMessage('Você saiu da sua conta.', 'info');
        } else {
            showMessage('Erro ao sair da conta.', 'error');
        }
    });

    // =========================================
    // LÓGICA DO CHAT
    // =========================================

    // Lida com o envio de perguntas ao pressionar o botão ou a tecla Enter
    async function handleSendMessage() {
        const question = questionInput.value.trim();
        if (!question) return;

        // Adiciona a mensagem do usuário ao chat
        displayMessage(question, 'user');
        questionInput.value = '';

        // Mostra um estado de "digitando" da IA
        displayMessage('...', 'ai');
        const tempAiMessage = chatMessages.lastElementChild;

        try {
            const response = await window.askEdenAI(question);
            if (response.success) {
                tempAiMessage.querySelector('p').innerText = response.data;
            } else {
                tempAiMessage.querySelector('p').innerText = `Erro: ${response.error}`;
                tempAiMessage.classList.add('error');
            }
        } catch (error) {
            tempAiMessage.querySelector('p').innerText = 'Houve um erro de comunicação.';
            tempAiMessage.classList.add('error');
        }
    }

    sendBtn.addEventListener('click', handleSendMessage);
    questionInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    });

    // Lógica para alternar entre as abas do chat
    chatTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            chatTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            // Futuramente, aqui você pode adicionar a lógica para mostrar o conteúdo de "Histórico" ou "Sugestões"
        });
    });

    // Inicialização da aplicação
    console.log('App inicializado');
};
