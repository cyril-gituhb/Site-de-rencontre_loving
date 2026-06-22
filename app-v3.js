// --- INITIALISATION DES DONNÉES ---
if (!localStorage.getItem('groups')) {
    const initialGroups = [
        { id: 'g1', name: "Amphi A - Chill 🏝️", members: [], messages: [] },
        { id: 'g2', name: "Cafétéria Vibes ☕", members: [], messages: [] },
        { id: 'g3', name: "Plage Étudiante 🌊", members: [], messages: [] }
    ];
    localStorage.setItem('groups', JSON.stringify(initialGroups));
}

const db = {
    get: (key) => JSON.parse(localStorage.getItem(key)) || [],
    save: (key, data) => localStorage.setItem(key, JSON.stringify(data)),
    getUser: () => JSON.parse(localStorage.getItem('currentUser')) || null
};

// --- NAVIGATION ---
function showView(viewId) {
    document.querySelectorAll('.view').forEach(v => v.classList.add('hidden'));
    document.getElementById(viewId).classList.remove('hidden');
    const user = db.getUser();
    document.getElementById('nav-bar').classList.toggle('hidden', !user);
    
    if(viewId === 'groups-view') renderGroups();
    if(viewId === 'online-view') renderOnline();
}

// --- INSCRIPTION ---
document.getElementById('signup-form').onsubmit = async (e) => {
    e.preventDefault();
    const photoFile = document.getElementById('s-photo').files[0];
    let photo = "https://i.pravatar.cc/150";

    if (photoFile) {
        photo = await new Promise(r => {
            const reader = new FileReader();
            reader.onload = () => r(reader.result);
            reader.readAsDataURL(photoFile);
        });
    }

    const newUser = {
        id: Date.now(),
        name: document.getElementById('s-name').value,
        email: document.getElementById('s-email').value,
        phone: document.getElementById('s-phone').value,
        sex: document.getElementById('s-sex').value,
        pass: document.getElementById('s-pass').value,
        photo: photo,
        isBusy: false
    };

    const users = db.get('users');
    users.push(newUser);
    db.save('users', users);
    alert("Compte KELVIN LOVING créé !");
    showView('login-view');
};

document.getElementById('login-form').onsubmit = (e) => {
    e.preventDefault();
    const user = db.get('users').find(u => u.email === document.getElementById('l-email').value && u.pass === document.getElementById('l-pass').value);
    if(user) {
        db.save('currentUser', user);
        showView('groups-view');
    } else alert("Erreur d'accès");
};

function logout() {
    localStorage.removeItem('currentUser');
    showView('login-view');
}

// --- LOGIQUE DES GROUPES (5M / 5F) ---
function renderGroups() {
    const groups = db.get('groups');
    const container = document.getElementById('groups-list');
    container.innerHTML = "";

    groups.forEach(g => {
        const boys = g.members.filter(m => m.sex === 'M').length;
        const girls = g.members.filter(m => m.sex === 'F').length;

        container.innerHTML += `
            <div class="group-card">
                <div>
                    <strong>${g.name}</strong><br>
                    <small>♂️ ${boys}/5 | ♀️ ${girls}/5</small>
                </div>
                <button onclick="joinGroup('${g.id}')" ${(boys+girls >= 10) ? 'disabled' : ''}>Entrer</button>
            </div>
        `;
    });
}

function joinGroup(groupId) {
    const user = db.getUser();
    const groups = db.get('groups');
    const group = groups.find(g => g.id === groupId);

    const count = group.members.filter(m => m.sex === user.sex).length;
    if (count >= 5) return alert("Désolé, il y a déjà 5 personnes de votre sexe dans ce groupe.");
    if (group.members.length >= 10) return alert("Groupe plein !");

    if (!group.members.find(m => m.id === user.id)) {
        group.members.push(user);
        db.save('groups', groups);
    }
    
    currentChatId = groupId;
    isGroupChat = true;
    showView('chat-view');
    renderMessages();
}

// --- LOGIQUE PRIVÉ & EN LIGNE ---
function renderOnline() {
    const me = db.getUser();
    const users = db.get('users').filter(u => u.id !== me.id);
    const container = document.getElementById('online-list');
    container.innerHTML = "";

    users.forEach(u => {
        container.innerHTML += `
            <div class="user-card">
                <img src="${u.photo}" style="width:40px; height:40px; border-radius:50%">
                <div>
                    <strong>${u.name}</strong> <span class="tag ${u.sex}">${u.sex}</span><br>
                    <small>${u.isBusy ? '🔴 Occupé(e)' : '🟢 Dispo'}</small>
                </div>
                <button onclick="startPrivate('${u.id}')" ${u.isBusy ? 'disabled' : ''}>Inviter</button>
            </div>
        `;
    });
}

function startPrivate(otherId) {
    const me = db.getUser();
    const users = db.get('users');
    const other = users.find(u => u.id == otherId);

    // Règle Sexe : Pas de M-M
    if (me.sex === 'M' && other.sex === 'M') {
        return alert("Règle KELVIN LOVING : Pas de discussion privée entre garçons !");
    }

    if (other.isBusy) return alert("Cet étudiant est déjà en ligne avec quelqu'un.");

    // Créer ou ouvrir chat privé
    currentChatId = [me.id, other.id].sort().join('_');
    isGroupChat = false;
    
    // Marquer comme occupé (simulation)
    me.isBusy = true;
    // En vrai, il faudrait mettre à jour la DB globale
    
    showView('chat-view');
    document.getElementById('chat-title').innerText = "Privé avec " + other.name;
    renderMessages();
}

// --- SYSTÈME DE CHAT ---
let currentChatId = null;
let isGroupChat = true;

function sendMessage() {
    const text = document.getElementById('msg-input').value;
    if(!text) return;
    saveMessage({ type: 'text', content: text });
    document.getElementById('msg-input').value = "";
}

function saveMessage(msgObj) {
    const me = db.getUser();
    const fullMsg = { ...msgObj, senderId: me.id, senderName: me.name, time: new Date() };

    if(isGroupChat) {
        const groups = db.get('groups');
        groups.find(g => g.id === currentChatId).messages.push(fullMsg);
        db.save('groups', groups);
    } else {
        const privates = db.get('privates') || {};
        if(!privates[currentChatId]) privates[currentChatId] = [];
        privates[currentChatId].push(fullMsg);
        db.save('privates', privates);
    }
    renderMessages();
}

function renderMessages() {
    const me = db.getUser();
    const container = document.getElementById('chat-messages');
    let msgs = [];

    if(isGroupChat) {
        msgs = db.get('groups').find(g => g.id === currentChatId).messages;
    } else {
        msgs = (db.get('privates') || {})[currentChatId] || [];
    }

    container.innerHTML = msgs.map(m => `
        <div class="msg ${m.senderId === me.id ? 'me' : 'other'}">
            <small>${m.senderName}</small><br>
            ${m.type === 'voice' ? '🎤 Message Vocal (Lecture...)' : m.content}
        </div>
    `).join('');
    container.scrollTop = container.scrollHeight;
}

// --- SIMULATION VOCAL ---
let mediaRecorder;
const voiceBtn = document.getElementById('btn-voice');

voiceBtn.onclick = () => {
    if (!mediaRecorder || mediaRecorder.state === "inactive") {
        voiceBtn.classList.add('recording');
        // Ici on simule car sans serveur on ne peut pas stocker de gros fichiers audio facilement
        setTimeout(() => {
            voiceBtn.classList.remove('recording');
            saveMessage({ type: 'voice', content: 'audio_file_url' });
        }, 2000);
    }
};

function leaveChat() {
    showView('groups-view');
}

window.onload = () => {
    if(db.getUser()) showView('groups-view');
};
