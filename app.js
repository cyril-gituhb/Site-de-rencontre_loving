import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm'

// ========== VARIABLES GLOBALES ==========
let supabase = null;
let currentUser = null;
let currentUserProfile = null;
let currentMatch = null;
let currentMatchProfile = null;
let allProfiles = [];
let profileIndex = 0;
let uploadedPhotoFile = null;
let realtimeSubscription = null;

// ========== LOAD CONFIG + INIT ==========
async function loadConfig() {
    try {
        // Le./ est important pour GitHub Pages / IP locale
        const response = await fetch('./config.json');
        if (!response.ok) throw new Error('config.json introuvable');
        
        const config = await response.json();
        supabase = createClient(config.supabase.url, config.supabase.anonKey);
        
        // Init seulement après que supabase est prêt
        await initApp();
        
    } catch (err) {
        console.error('Erreur chargement config:', err);
        alert('Impossible de charger config.json. Vérifie le chemin.');
    }
}

// ========== INITIALISATION APP ==========
async function initApp() { 
    // Vérifier si utilisateur déjà connecté
    const { data: { user } = await supabase.auth.getUser();
    if (user) {
        currentUser = user;
        await loadCurrentUserProfile();
        showSwipe();
        loadProfiles();
    } else {
        showLogin();
    }

    // Attacher les event listeners SEULEMENT après init
    attachEventListeners();
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
        unsubscribeChat();
        showSwipe();
    });
    
    document.getElementById('chatInput').addEventListener('input', (e) => {
        e.target.style.height = 'auto';
        e.target.style.height = Math.min(e.target.scrollHeight, 100) + 'px';
    });
}

// ========== AUTH - SIGNUP ==========
async function handleSignup() {
    const email = document.getElementById('signupEmail').value.trim();
    const password = document.getElementById('signupPassword').value;
    const name = document.getElementById('signupName').value.trim();
    const age = parseInt(document.getElementById('signupAge').value);
    const bio = document.getElementById('signupBio').value.trim();

    clearError('errorSignup');

    if (!email ||!password ||!name ||!age ||!bio) {
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
        const { data: { user }, error: signupError } = await supabase.auth.signUp({
            email,
            password,
            options: { data: { display_name: name, age: age, bio: bio }
        });
        if (signupError) throw signupError;
        currentUser = user;

        // Upload photo si existe
        let photoUrl = null;
        if (uploadedPhotoFile) {
            const fileName = `${user.id}-${Date.now()}.jpg`;
            const { error: uploadError } = await supabase.storage.from('avatars').upload(fileName, uploadedPhotoFile);
            if (!uploadError) {
                const { data } = supabase.storage.from('avatars').getPublicUrl(fileName);
                photoUrl = data.publicUrl;
            }
        }

        // Créer profile
        const { error: profileError } = await supabase.from('profiles').insert({
            id: user.id, display_name: name, age: age, bio: bio, photo_url: photoUrl
        });
        if (profileError) throw profileError;

        await loadCurrentUserProfile();
        showSwipe();
        loadProfiles();
        
    } catch (err) {
        console.error('Erreur signup:', err);
        showError('errorSignup', err.message || 'Erreur lors de l\'inscription');
    }
}

// ========== AUTH - LOGIN ==========
async function handleLogin() {
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;
    clearError('errorLogin');
    if (!email ||!password) {
        showError('errorLogin', 'Email et mot de passe requis');
        return;
    }
    try {
        const { data: { user }, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        currentUser = user;
        await loadCurrentUserProfile();
        showSwipe();
        loadProfiles();
    } catch (err) {
        console.error('Erreur login:', err);
        showError('errorLogin', err.message || 'Email ou mot de passe incorrect');
    }
}

// ========== LOGOUT ==========
async function handleLogout() {
    await supabase.auth.signOut();
    currentUser = null;
    currentUserProfile = null;
    currentMatch = null;
    profileIndex = 0;
    allProfiles = [];
    unsubscribeChat();
    showLogin();
    clearAllInputs();
}

// ========== LIKE ==========
async function handleLike() {
    if (profileIndex >= allProfiles.length) return;
    const profile = allProfiles[profileIndex];
    try {
        document.getElementById('btnLike').disabled = true;
        const { data, error } = await supabase.functions.invoke('get-or-create-dm', {
            body: { user_id_1: currentUser.id, user_id_2: profile.id }
        });
        if (error) throw error;
        if (data && data.conversation_id) {
            currentMatch = data.conversation_id;
            currentMatchProfile = profile;
            document.getElementById('btnLike').disabled = false;
            showChat();
            loadMessages();
            subscribeToChat();
        } else {
            nextProfile();
            document.getElementById('btnLike').disabled = false;
        }
    } catch (err) {
        console.error('Erreur like:', err);
        document.getElementById('btnLike').disabled = false;
    }
}

//... Le reste de ton code loadProfiles, renderCard, loadMessages, etc reste identique...

// ========== START APP ==========
loadConfig(); // <-- C'ETAIT LA LIGNE QUI MANQUAIT
