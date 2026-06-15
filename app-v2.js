// ========== MODE 100% FRONT - ZÉRO BACKEND ==========
let currentUser = { id: 'test-123', email: 'test@test.com' };
let currentUserProfile = { display_name: 'Test User', age: 25, bio: 'Mode test', photo_url: null };
let currentMatch = null;
let currentMatchProfile = null;
let allProfiles = [
  { id: '1', display_name: 'Awa', age: 22, bio: 'J\'aime voyager ✈️', photo_url: null },
  { id: '2', display_name: 'Kevin', age: 27, bio: 'Fan de foot ⚽', photo_url: null },
  { id: '3', display_name: 'Sarah', age: 24, bio: 'Mode + photo 📸', photo_url: null }
];
let profileIndex = 0;
let uploadedPhotoFile = null;

// ========== INIT ==========
function loadConfig() {
    initApp(); // Lance direct
}

function initApp() {
    showLogin(); // Démarre sur login
    attachEventListeners();

    document.getElementById('btnSignup').disabled = false;
    document.getElementById('btnLogin').disabled = false;
}

function attachEventListeners() {
    document.getElementById('photoInput').addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            uploadedPhotoFile = file;
            document.getElementById('photoLabel').textContent = `📸 ${file.name}`;
            document.getElementById('photoLabel').classList.add('has-file');
        }
    });

    document.getElementById('btnSignup').addEventListener('click', handleSignup);
    document.getElementById('btnLogin').addEventListener('click', handleLogin);
    document.getElementById('btnLogout').addEventListener('click', handleLogout);
    document.getElementById('btnLike').addEventListener('click', handleLike);
    document.getElementById('btnPass').addEventListener('click', nextProfile);
    document.getElementById('btnSendMessage').addEventListener('click', sendMessage);
    document.getElementById('btnBackToSwipe').addEventListener('click', () => {
        showSwipe();
    });

    document.getElementById('linkToLogin').addEventListener('click', (e) => {
        e.preventDefault();
        showLogin();
    });
    document.getElementById('linkToSignup').addEventListener('click', (e) => {
        e.preventDefault();
        showSignup();
    });

    document.getElementById('chatInput').addEventListener('input', (e) => {
        e.target.style.height = 'auto';
        e.target.style.height = Math.min(e.target.scrollHeight, 100) + 'px';
    });
}

// ========== AUTH FAKE ==========
function handleSignup() {
    const name = document.getElementById('signupName').value.trim();
    if (!name) {
        showError('errorSignup', 'Mets un nom pour tester');
        return;
    }
    currentUserProfile.display_name = name;
    alert('Mode test: Inscription simulée ✅');
    showSwipe();
    loadProfiles();
}

function handleLogin() {
    alert('Mode test: Connexion simulée ✅');
    showSwipe();
    loadProfiles();
}

function handleLogout() {
    currentMatch = null;
    profileIndex = 0;
    showLogin();
    clearAllInputs();
}

// ========== PROFILES FAKE ==========
function loadProfiles() {
    profileIndex = 0;
    if (allProfiles.length === 0) {
        document.getElementById('cardsContainer').innerHTML = '<div class="empty-message">Aucun profil disponible</div>';
    } else {
        renderCard();
    }
}

function renderCard() {
    const container = document.getElementById('cardsContainer');
    container.innerHTML = '';
    if (profileIndex >= allProfiles.length) {
        container.innerHTML = '<div class="empty-message">Plus de profils 😢 Mode test fini</div>';
        return;
    }
    const profile = allProfiles[profileIndex];
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
        <img src="${profile.photo_url || 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22200%22 height=%22200%22%3E%3Crect fill=%22%23f0f0f0%22 width=%22200%22 height=%22200%22/%3E%3C/svg%3E'}" class="card-image">
        <div class="card-info">
            <div class="card-name">${profile.display_name}, ${profile.age}</div>
            <div class="card-bio">${profile.bio}</div>
        </div>
    `;
    container.appendChild(card);
}

function nextProfile() {
    const card = document.querySelector('.card');
    if (card) {
        card.classList.add('exit-right');
        setTimeout(() => {
            profileIndex++;
            renderCard();
        }, 300);
    }
}

function handleLike() {
    const profile = allProfiles[profileIndex];
    currentMatch = 'fake-conv-123';
    currentMatchProfile = profile;
    alert(`Mode test: Match avec ${profile.display_name} ✅`);
    showChat();
}

// ========== CHAT FAKE ==========
function loadMessages() {
    const container = document.getElementById('messagesContainer');
    container.innerHTML = '<div class="message theirs"><div class="message-bubble">Salut! Mode test activé 👋</div></div>';
}

function sendMessage() {
    const input = document.getElementById('chatInput');
    const message = input.value.trim();
    if (!message) return;
    renderMessage({ user_id: currentUser.id, content: message, created_at: new Date() });
    input.value = '';
    input.style.height = 'auto';
}

function renderMessage(message) {
    const container = document.getElementById('messagesContainer');
    const messageDiv = document.createElement('div');
    const isOwn = message.user_id === currentUser.id;
    messageDiv.className = `message ${isOwn? 'mine' : 'theirs'}`;
    messageDiv.innerHTML = `
        <div>
            <div class="message-bubble">${message.content}</div>
            <div class="message-time">${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
        </div>
    `;
    container.appendChild(messageDiv);
    container.scrollTop = container.scrollHeight;
}

// ========== UI ==========
function showPage(pageId) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById(pageId).classList.add('active');
}
function showLogin() {
    showPage('pageLogin');
    document.getElementById('btnLogout').style.display = 'none';
}
function showSignup() {
    showPage('pageSignup');
}
function showSwipe() {
    showPage('pageSwipe');
    document.getElementById('btnLogout').style.display = 'inline-block';
}
function showChat() {
    showPage('pageChat');
    document.getElementById('matchName').textContent = `${currentMatchProfile.display_name}, ${currentMatchProfile.age}`;
    loadMessages();
}
function showError(elementId, message) {
    const element = document.getElementById(elementId);
    element.textContent = message;
    element.classList.add('show');
    setTimeout(() => element.classList.remove('show'), 3000);
}
function clearAllInputs() {
    document.getElementById('loginEmail').value = '';
    document.getElementById('loginPassword').value = '';
    document.getElementById('signupEmail').value = '';
    document.getElementById('signupPassword').value = '';
    document.getElementById('signupName').value = '';
    document.getElementById('signupAge').value = '';
    document.getElementById('signupBio').value = '';
    document.getElementById('chatInput').value = '';
    uploadedPhotoFile = null;
    document.getElementById('photoLabel').textContent = '📸 Ajouter une photo';
    document.getElementById('photoLabel').classList.remove('has-file');
}

// ========== START APP ==========
loadConfig();
