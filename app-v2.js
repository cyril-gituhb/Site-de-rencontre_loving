// ========== MODE FULL SUPABASE ==========
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm'

// Tes clés direct ici
const supabaseUrl = 'https://ghcaswgaghkzvyvmzkyb.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdoY2Fzd2dhZ2hrenZ5dm16a3liIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE0MzUzMTUsImV4cCI6MjA5NzAxMTMxNX0.xwuTKMah1y1C2TkAqiKEe288UrfvY8DK_TyLauAKWB4'
const supabase = createClient(supabaseUrl, supabaseKey)

let currentUser = null;
let currentUserProfile = null;
let currentMatch = null;
let currentMatchProfile = null;
let allProfiles = [];
let profileIndex = 0;
let uploadedPhotoFile = null;

// ========== INITIALISATION ==========
async function initApp() {
    const { data: { user } = await supabase.auth.getUser(); // <-- CORRIGÉ ICI

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

// ... le reste de ton code reste identique ...
