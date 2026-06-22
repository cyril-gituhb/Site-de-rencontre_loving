// --- INITIALISATION DES DONNÉES (Simulation LocalStorage) ---
const GROUPS_DATA = [
    { id: 1, name: "Alpha Beach 🏖️", girls: 4, boys: 5 },
    { id: 2, name: "Étudiants VIP", girls: 5, boys: 4 },
    { id: 3, name: "Club Lecture 📚", girls: 2, boys: 2 }
];

const ONLINE_USERS = [
    { id: 101, name: "Sarah", gender: "Fille", busy: false },
    { id: 102, name: "Kevin", gender: "Garçon", busy: true },
    { id: 103, name: "Julie", gender: "Fille", busy: false },
    { id: 104, name: "Marc", gender: "Garçon", busy: false }
];

let currentUser = JSON.parse(localStorage.getItem('kelvin_user')) || null;

// --- GESTION DE L'INSCRIPTION ---
document.getElementById('register-form').onsubmit = function(e) {
    e.preventDefault();
    
    const user = {
        name: document.getElementById('reg-name').value,
        email: document.getElementById('reg-email').value,
        gender: document.getElementById('reg-gender').value,
        isOccupied: false
    };

    localStorage.setItem('kelvin_user', JSON.stringify(user));
    currentUser = user;
    loadApp();
};

function loadApp() {
    if(!currentUser) return;
    document.getElementById('auth-page').classList.add('hidden');
    document.getElementById('chat-page').classList.remove('hidden');
    document.getElementById('user-name-top').innerText = currentUser.name;
    renderSidebar('groups');
}

// --- LOGIQUE DU CHAT ---
function switchView(type) {
    renderSidebar(type);
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.toggle('active'));
}

function renderSidebar(type) {
    const list = document.getElementById('sidebar-list');
    list.innerHTML = "";

    if(type === 'groups') {
        GROUPS_DATA.forEach(g => {
            const item = document.createElement('div');
            item.className = "sidebar-item";
            item.innerHTML = `
                <div style="padding:15px; border-bottom:1px solid #eee; cursor:pointer">
                    <strong>${g.name}</strong> <br>
                    <small>${g.girls} Filles / ${g.boys} Garçons</small>
                </div>
            `;
            item.onclick = () => joinGroup(g);
            list.appendChild(item);
        });
    } else {
        ONLINE_USERS.forEach(u => {
            const item = document.createElement('div');
            item.className = "sidebar-item";
            item.innerHTML = `
                <div style="padding:15px; border-bottom:1px solid #eee; cursor:pointer">
                    <strong>${u.name}</strong> (${u.gender}) <br>
                    <small>${u.busy ? '🔴 Occupé' : '🟢 En ligne'}</small>
                </div>
            `;
            item.onclick = () => startPrivateChat(u);
            list.appendChild(item);
        });
    }
}

// --- RÈGLES DE CONNEXION ---
function joinGroup(group) {
    const total = group.girls + group.boys;
    if (total >= 10) return alert("Groupe Complet (10/10) !");
    
    // Vérification mixité
    if(currentUser.gender === "Garçon" && group.boys >= 5) return alert("Plus de place pour les garçons !");
    if(currentUser.gender === "Fille" && group.girls >= 5) return alert("Plus de place pour les filles !");

    document.getElementById('chat-title').innerText = group.name;
    document.getElementById('chat-status').innerText = `${group.girls}F / ${group.boys}G`;
}

function startPrivateChat(target) {
    // REGLE : Pas garçon avec garçon
    if(currentUser.gender === "Garçon" && target.gender === "Garçon") {
        return alert("Désolé, la discussion privée Garçon-Garçon est désactivée sur Kelvin Loving.");
    }

    if(target.busy) return alert("Cet étudiant est déjà occupé !");

    document.getElementById('chat-title').innerText = "Chat avec " + target.name;
    document.getElementById('chat-status').innerText = "En ligne";
    document.getElementById('messages-box').innerHTML = `<div class="message received">Salut ${currentUser.name} !</div>`;
}

// Envoi de message (Simulé)
document.getElementById('send-msg').onclick = function() {
    const text = document.getElementById('msg-input').value;
    if(!text) return;
    
    const msg = document.createElement('div');
    msg.className = "message sent";
    msg.innerText = text;
    document.getElementById('messages-box').appendChild(msg);
    document.getElementById('msg-input').value = "";
};

// Vérifier si déjà connecté au chargement
window.onload = loadApp;
