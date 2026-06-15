// ========== MODE OFFLINE - BACKEND DÉSACTIVÉ ==========
const supabase = {
  auth: { 
    getUser: async () => ({ data: { user: null } }),
    signUp: async () => ({ data: null, error: { message: 'Backend désactivé pour test' } }),
    signInWithPassword: async () => ({ data: null, error: { message: 'Backend désactivé pour test' } }),
    signOut: async () => ({ error: null })
  },
  from: () => ({ 
    select: async () => ({ data: [], error: null }), 
    insert: async () => ({ data: null, error: null }),
    eq: () => ({ single: async () => ({ data: null, error: null }) }),
    neq: () => ({ order: async () => ({ data: [], error: null }) })
  }),
  storage: { from: () => ({ upload: async () => ({ error: null }), getPublicUrl: () => ({ data: { publicUrl: null } }) },
  functions: { invoke: async () => ({ data: null, error: null }) },
  channel: () => ({ on: () => ({ subscribe: () => {} }), removeChannel: () => {} }),
  removeChannel: () => {}
};

// import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm' // COMMENTÉ POUR TEST

// ========== VARIABLES GLOBALES ==========
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
        // const response = await fetch('./config.json'); COMMENTÉ
        // const config = await response.json(); COMMENTÉ
        // supabase = createClient(config.supabase.url, config.supabase.anonKey); COMMENTÉ

        await initApp(); // On lance direct sans config

    } catch (err) {
        console.error('Erreur chargement config:', err);
        alert('Mode test activé. Backend désactivé.');
    }
}

// ========== INITIALISATION APP ==========
async function initApp() {
    const { data: { user } = await supabase.auth.getUser();

    if (user) {
        currentUser = user;
        await loadCurrentUserProfile();
        showSwipe();
        loadProfiles();
    } else {
        showLogin(); // Va toujours afficher login car user = null
    }

    attachEventListeners();

    document.getElementById('btnSignup').disabled = false;
    document.getElementById('btnLogin').disabled = false;
}

// ... le reste de ton code reste identique ...
