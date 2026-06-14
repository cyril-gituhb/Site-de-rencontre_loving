import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm'
// ========== LOAD CONFIG ==========
let SUPABASE_URL = '';
let SUPABASE_KEY = '';

async function loadConfig() {
    try {
        const response = await fetch('config.json');
        const config = await response.json();
        SUPABASE_URL = config.supabase.url;
        SUPABASE_KEY = config.supabase.anonKey;
        init();
    } catch (err) {
        console.error('Erreur chargement config:', err);
    }
}

// ========== VARIABLES GLOBALES ==========
let supabase;
let currentUser = null;
let currentUserProfile = null;
let currentMatch = null;
let currentMatchProfile = null;
let allProfiles = [];
let profileIndex = 0;
let uploadedPhotoFile = null;
let realtimeSubscription = null;

// ========== INITIALISATION ==========
async function init() {    
    supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

    // Vérifier si utilisateur déjà connecté
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
        currentUser = user;
        await loadCurrentUserProfile();
        showSwipe();
        loadProfiles();
    } else {
        showLogin();
    }
}

// ========== AUTH - SIGNUP ==========
document.getElementById('photoInput').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        uploadedPhotoFile = file;
        document.getElementById('photoLabel').textContent = `📸 ${file.name}`;
        document.getElementById('photoLabel').classList.add('has-file');
    }
});

document.getElementById('btnSignup').addEventListener('click', async () => {
    const email = document.getElementById('signupEmail').value.trim();
    const password = document.getElementById('signupPassword').value;
    const name = document.getElementById('signupName').value.trim();
    const age = parseInt(document.getElementById('signupAge').value);
    const bio = document.getElementById('signupBio').value.trim();

    clearError('errorSignup');

    if (!email || !password || !name || !age || !bio) {
        showError('errorSignup', 'Tous les champs sont requis');
        return;
    }

    if (password.length < 6) {
        showError('errorSignup', 'Le mot de passe doit avoir au moins 6 caractères');
        return;
    }

    if (age < 18) {
        showError('errorSignup', 'Vous devez avoir au moins 18 ans');
        return;
    }

    try {
        // Signup
        const { data: { user }, error: signupError } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    display_name: name,
                    age: age,
                    bio: bio
                }
            }
        });

        if (signupError) throw signupError;

        currentUser = user;

        // Upload photo si existe
        let photoUrl = null;
        if (uploadedPhotoFile) {
            const fileName = `${user.id}-${Date.now()}.jpg`;
            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(fileName, uploadedPhotoFile);

            if (!uploadError) {
                const { data } = supabase.storage
                    .from('avatars')
                    .getPublicUrl(fileName);
                photoUrl = data.publicUrl;
            }
        }

        // Créer profile
        const { error: profileError } = await supabase
            .from('profiles')
            .insert({
                id: user.id,
                display_name: name,
                age: age,
                bio: bio,
                photo_url: photoUrl
            });

        if (profileError) throw profileError;

        await loadCurrentUserProfile();
        showSwipe();
        loadProfiles();
        
    } catch (err) {
        console.error('Erreur signup:', err);
        showError('errorSignup', err.message || 'Erreur lors de l\'inscription');
    }
});

// ========== AUTH - LOGIN ==========
document.getElementById('btnLogin').addEventListener('click', async () => {
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;

    clearError('errorLogin');

    if (!email || !password) {
        showError('errorLogin', 'Email et mot de passe requis');
        return;
    }

    try {
        const { data: { user }, error } = await supabase.auth.signInWithPassword({
            email,
            password
        });

        if (error) throw error;

        currentUser = user;
        await loadCurrentUserProfile();
        showSwipe();
        loadProfiles();

    } catch (err) {
        console.error('Erreur login:', err);
        showError('errorLogin', err.message || 'Email ou mot de passe incorrect');
    }
});

// ========== LOGOUT ==========
document.getElementById('btnLogout').addEventListener('click', async () => {
    await supabase.auth.signOut();
    currentUser = null;
    currentUserProfile = null;
    currentMatch = null;
    profileIndex = 0;
    allProfiles = [];
    unsubscribeChat();
    showLogin();
    clearAllInputs();
});

// ========== LOAD CURRENT USER PROFILE ==========
async function loadCurrentUserProfile() {
    try {
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', currentUser.id)
            .single();

        if (error) throw error;
        currentUserProfile = data;
    } catch (err) {
        console.error('Erreur load profile:', err);
    }
}

// ========== LOAD ALL PROFILES (SWIPE) ==========
async function loadProfiles() {
    try {
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .neq('id', currentUser.id)
            .order('created_at', { ascending: false });

        if (error) throw error;

        allProfiles = data || [];
        profileIndex = 0;

        if (allProfiles.length === 0) {
            document.getElementById('cardsContainer').innerHTML = '<div class="empty-message">Aucun profil disponible</div>';
        } else {
            renderCard();
        }
    } catch (err) {
        console.error('Erreur load profiles:', err);
        document.getElementById('cardsContainer').innerHTML = '<div class="empty-message">Erreur réseau</div>';
    }
}

// ========== RENDER CARD ==========
function renderCard() {
    const container = document.getElementById('cardsContainer');
    container.innerHTML = '';

    if (profileIndex >= allProfiles.length) {
        container.innerHTML = '<div class="empty-message">Plus de profils 😢</div>';
        return;
    }

    const profile = allProfiles[profileIndex];
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
        <img src="${profile.photo_url || 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22200%22 height=%22200%22%3E%3Crect fill=%22%23f0f0f0%22 width=%22200%22 height=%22200%22/%3E%3Ctext x=%2250%25%22 y=%2250%25%22 font-size=%2248%22 fill=%22%23999%22 text-anchor=%22middle%22 dy=%22.3em%22%3E📸%3C/text%3E%3C/svg%3E'}" class="card-image" onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22200%22 height=%22200%22%3E%3Crect fill=%22%23f0f0f0%22 width=%22200%22 height=%22200%22/%3E%3C/svg%3E'">
        <div class="card-info">
            <div>
                <div class="card-name">${profile.display_name}, ${profile.age}</div>
                <div class="card-bio">${profile.bio || 'Bio non renseignée'}</div>
            </div>
        </div>
    `;
    container.appendChild(card);
}

// ========== LIKE (MATCH) ==========
document.getElementById('btnLike').addEventListener('click', async () => {
    if (profileIndex >= allProfiles.length) return;

    const profile = allProfiles[profileIndex];
    
    try {
        document.getElementById('btnLike').disabled = true;

        // Appeler Edge Function pour créer/obtenir conversation
        const { data, error } = await supabase.functions.invoke('get-or-create-dm', {
            body: {
                user_id_1: currentUser.id,
                user_id_2: profile.id
            }
        });

        if (error) throw error;

        if (data && data.conversation_id) {
            // Match créé
            currentMatch = data.conversation_id;
            currentMatchProfile = profile;
            document.getElementById('btnLike').disabled = false;
            showChat();
            loadMessages();
            subscribeToChat();
        } else {
            // Pas de match, passer au suivant
            nextProfile();
            document.getElementById('btnLike').disabled = false;
        }

    } catch (err) {
        console.error('Erreur like:', err);
        document.getElementById('btnLike').disabled = false;
    }
});

// ========== PASS ==========
document.getElementById('btnPass').addEventListener('click', () => {
    nextProfile();
});

function nextProfile() {
    const container = document.getElementById('cardsContainer');
    const card = container.querySelector('.card');
    if (card) {
        card.classList.add('exit-right');
        setTimeout(() => {
            profileIndex++;
            renderCard();
        }, 300);
    }
}

// ========== CHAT - LOAD MESSAGES ==========
async function loadMessages() {
    try {
        const { data, error } = await supabase
            .from('messages')
            .select('*')
            .eq('conversation_id', currentMatch)
            .order('created_at', { ascending: true });

        if (error) throw error;

        const container = document.getElementById('messagesContainer');
        container.innerHTML = '';

        if (data && data.length > 0) {
            data.forEach(msg => {
                renderMessage(msg);
            });
            container.scrollTop = container.scrollHeight;
        }
    } catch (err) {
        console.error('Erreur load messages:', err);
    }
}

// ========== CHAT - RENDER MESSAGE ==========
function renderMessage(message) {
    const container = document.getElementById('messagesContainer');
    const messageDiv = document.createElement('div');
    const isOwn = message.user_id === currentUser.id;
    
    messageDiv.className = `message ${isOwn ? 'mine' : 'theirs'}`;
    messageDiv.innerHTML = `
        <div>
            <div class="message-bubble">${escapeHtml(message.content)}</div>
            <div class="message-time">${new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
        </div>
    `;
    container.appendChild(messageDiv);
}

// ========== CHAT - SEND MESSAGE ==========
document.getElementById('btnSendMessage').addEventListener('click', async () => {
    const input = document.getElementById('chatInput');
    const message = input.value.trim();

    if (!message) return;

    try {
        const { error } = await supabase
            .from('messages')
            .insert({
                conversation_id: currentMatch,
                user_id: currentUser.id,
                content: message
            });

        if (error) throw error;

        input.value = '';
        input.style.height = 'auto';
        loadMessages();

    } catch (err) {
        console.error('Erreur envoi message:', err);
    }
});

// ========== CHAT - REALTIME SUBSCRIPTION ==========
function subscribeToChat() {
    if (realtimeSubscription) unsubscribeChat();

    realtimeSubscription = supabase
        .channel(`messages-${currentMatch}`)
        .on('postgres_changes', 
            { 
                event: 'INSERT', 
                schema: 'public', 
                table: 'messages',
                filter: `conversation_id=eq.${currentMatch}`
            },
            (payload) => {
                if (payload.new.user_id !== currentUser.id) {
                    renderMessage(payload.new);
                    document.getElementById('messagesContainer').scrollTop = document.getElementById('messagesContainer').scrollHeight;
                }
            }
        )
        .subscribe();
}

function unsubscribeChat() {
    if (realtimeSubscription) {
        supabase.removeChannel(realtimeSubscription);
        realtimeSubscription = null;
    }
}

// ========== UI - PAGE NAVIGATION ==========
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
    document.getElementById('matchAvatar').src = currentMatchProfile.photo_url || 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2240%22 height=%2240%22%3E%3Crect fill=%22%23f0f0f0%22 width=%2240%22 height=%2240%22/%3E%3C/svg%3E';
}

// ========== UI - BACK BUTTON ==========
document.getElementById('btnBackToSwipe').addEventListener('click', () => {
    unsubscribeChat();
    showSwipe();
});

// ========== UI - ERROR HANDLING ==========
function showError(elementId, message) {
    const element = document.getElementById(elementId);
    element.textContent = message;
    element.classList.add('show');
}

function clearError(elementId) {
    const element = document.getElementById(elementId);
    element.classList.remove('show');
}

// ========== UI - CLEAR INPUTS ==========
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

// ========== UTILITY - ESCAPE HTML ==========
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ========== AUTO-RESIZE TEXTAREA ==========
document.getElementById('chatInput').addEventListener('input', (e) => {
    e.target.style.height = 'auto';
    e.target.style.height = Math.min(e.target.scrollHeight, 100) + 'px';
});

// ========== START APP ==========
loadConfig();
