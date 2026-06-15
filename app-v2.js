// ========== MODE FULL SUPABASE ==========
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm'

let supabase;
let currentUser = null;
let currentUserProfile = null;
let currentMatch = null;
let currentMatchProfile = null;
let allProfiles = [];
let profileIndex = 0;
let uploadedPhotoFile = null;

// ========== LOAD CONFIG + INIT ==========
async function loadConfig() {
    try {
        const response = await fetch('./config.json');
        const config = await response.json();
        supabase = createClient(config.supabase.url, config.supabase.anonKey);
        await initApp();
    } catch (err) {
        console.error('Erreur config.json:', err);
        alert('config.json manquant. Crée le fichier avec url + anonKey');
    }
}

// ========== INITIALISATION ==========
async function initApp() {
    const { data: { user } = await supabase.auth.getUser();

    if (user) {
        currentUser = user;
        await loadUserProfile();
        showSwipe();
        await loadProfiles();
    } else {
        showLogin();
    }

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

// ========== AUTH SUPABASE ==========
async function handleSignup() {
    const email = document.getElementById('signupEmail').value.trim();
    const password = document.getElementById('signupPassword').value;
    const name = document.getElementById('signupName').value.trim();
    const age = parseInt(document.getElementById('signupAge').value);
    const bio = document.getElementById('signupBio').value.trim();

    if (!email ||!password ||!name ||!age) {
        showError('errorSignup', 'Remplis nom, email, mdp, âge');
        return;
    }

    let photo_url = null;
    if (uploadedPhotoFile) {
        const fileExt = uploadedPhotoFile.name.split('.').pop();
        const fileName = `${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage.from('avatars').upload(fileName, uploadedPhotoFile);
        if (!uploadError) {
            const { data } = supabase.storage.from('avatars').getPublicUrl(fileName);
            photo_url = data.publicUrl;
        }
    }

    const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { display_name: name } }
    });

    if (error) {
        showError('errorSignup', error.message);
        return;
    }

    // Créer profil dans table profiles
    const { error: profileError } = await supabase.from('profiles').insert({
        id: data.user.id,
        display_name: name,
        age: age,
        bio: bio,
        photo_url: photo_url
    });

    if (profileError) console.error('Erreur profil:', profileError);

    alert('Compte créé! Vérifie tes emails si confirmation activée.');
    showLogin();
}

async function handleLogin() {
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;

    if (!email ||!password) {
        showError('errorLogin', 'Remplis tout');
        return;
    }

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
        showError('errorLogin', error.message);
        return;
    }

    currentUser = data.user;
    await loadUserProfile();
    showSwipe();
    await loadProfiles();
}

async function handleLogout() {
    await supabase.auth.signOut();
    currentUser = null;
    currentUserProfile = null;
    allProfiles = [];
    profileIndex = 0;
    showLogin();
    clearAllInputs();
}

// ========== PROFILS SUPABASE ==========
async function loadUserProfile() {
    const { data, error } = await supabase.from('profiles').select('*').eq('id', currentUser.id).single();
    if (!error) currentUserProfile = data;
}

async function loadProfiles() {
    const { data, error } = await supabase
       .from('profiles')
       .select('*')
       .neq('id', currentUser.id)
       .limit(20);

    if (error) {
        console.error('Erreur loadProfiles:', error);
        document.getElementById('cardsContainer').innerHTML = '<div class="empty-message">Erreur chargement profils</div>';
        return;
    }

    allProfiles = data || [];
    profileIndex = 0;

    if (allProfiles.length === 0) {
        document.getElementById('cardsContainer').innerHTML = '<div class="empty-message">Aucun profil disponible pour l\'instant 😢</div>';
    } else {
        renderCard();
    }
}

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
        <img src="${profile.photo_url || 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22200%22 height=%22200%22%3E%3Crect fill=%22%23f0f0f0%22 width=%22200%22 height=%22200%22/%3E%3C/svg%3E'}" class="card-image">
        <div class="card-info">
            <div class="card-name">${profile.display_name}, ${profile.age}</div>
            <div class="card-bio">${profile.bio || 'Pas de bio'}</div>
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
    alert(`Like envoyé à ${profile.display_name}. Le chat nécessite l'Edge Function.`);
}

// ========== CHAT - REQUIERT EDGE FUNCTION ==========
function loadMessages() {
    document.getElementById('messagesContainer').innerHTML = '<div class="empty-message">Chat désactivé. Edge Function à réparer.</div>';
}

function sendMessage() {
    alert('Chat désactivé tant que get-or-create-dm n\'est pas réparé');
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
    document.getElementById('matchName').textContent = currentMatchProfile? `${currentMatchProfile.display_name}, ${currentMatchProfile.age}` : 'Match';
    loadMessages();
}
function showError(elementId, message) {
    const element = document.getElementById(elementId);
    element.textContent = message;
    element.classList.add('show');
    setTimeout(() => element.classList.remove('show'), 3000);
}
function clearAllInputs() {
    ['loginEmail','loginPassword','signupEmail','signupPassword','signupName','signupAge','signupBio','chatInput'].forEach(id => {
        document.getElementById(id).value = '';
    });
    uploadedPhotoFile = null;
    document.getElementById('photoLabel').textContent = '📸 Ajouter une photo';
    document.getElementById('photoLabel').classList.remove('has-file');
}

// ========== START ==========
loadConfig();
