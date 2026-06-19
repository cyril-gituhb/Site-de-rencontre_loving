// --- DATA MANAGEMENT ---
const getData = (key) => JSON.parse(localStorage.getItem(key)) || (key === 'users' || key === 'matches' ? [] : {});
const setData = (key, data) => localStorage.setItem(key, JSON.stringify(data));

// --- UTILS ---
const getFlagEmoji = (countryCode) => {
    return countryCode.toUpperCase().replace(/./g, char => 
        String.fromCodePoint(char.charCodeAt(0) + 127397)
    );
};

// --- NAVIGATION ---
function showView(viewId) {
    document.querySelectorAll('.view').forEach(v => v.classList.add('hidden'));
    document.getElementById(viewId).classList.remove('hidden');
    
    const currentUser = getData('currentUser');
    document.getElementById('main-nav').classList.toggle('hidden', !currentUser.id);

    if (viewId === 'swipe-view') renderSwipe();
    if (viewId === 'matches-view') renderMatches();
}

// --- AUTHENTIFICATION ---
document.getElementById('signup-form').onsubmit = async (e) => {
    e.preventDefault();
    const users = getData('users');
    const email = document.getElementById('sign-email').value;
    
    if (users.find(u => u.email === email)) return alert("Email déjà utilisé");

    const photoFile = document.getElementById('sign-photo').files[0];
    let photoBase64 = "https://i.pravatar.cc/300";

    if (photoFile) {
        photoBase64 = await new Promise(resolve => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.readAsDataURL(photoFile);
        });
    }

    const newUser = {
        id: Date.now(),
        name: document.getElementById('sign-name').value,
        email,
        password: document.getElementById('sign-password').value,
        age: document.getElementById('sign-age').value,
        country: document.getElementById('sign-country').value,
        bio: document.getElementById('sign-bio').value,
        photo: photoBase64
    };

    users.push(newUser);
    setData('users', users);
    alert("Inscription réussie !");
    showView('login-view');
};

document.getElementById('login-form').onsubmit = (e) => {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const pass = document.getElementById('login-password').value;
    const user = getData('users').find(u => u.email === email && u.password === pass);

    if (user) {
        setData('currentUser', user);
        showView('swipe-view');
    } else {
        alert("Identifiants incorrects");
    }
};

function logout() {
    localStorage.removeItem('currentUser');
    showView('login-view');
}

// --- SWIPE SYSTEM ---
let currentSwipeProfiles = [];

function renderSwipe() {
    const me = getData('currentUser');
    const users = getData('users');
    const likes = getData('likes')[me.id] || [];
    
    // Filtrer : Pas moi-même, et pas ceux déjà swipés
    currentSwipeProfiles = users.filter(u => u.id !== me.id && !likes.includes(u.id));
    
    const container = document.getElementById('card-container');
    if (currentSwipeProfiles.length > 0) {
        const user = currentSwipeProfiles[0];
        container.innerHTML = `
            <div class="profile-card" style="background-image: url('${user.photo}')">
                <div class="info">
                    <h3>${user.name}, ${user.age} ${getFlagEmoji(user.country)}</h3>
                    <p>${user.bio}</p>
                </div>
            </div>
        `;
    } else {
        container.innerHTML = "<p>Plus personne autour de vous ! 🌍</p>";
    }
}

function handleAction(type) {
    if (currentSwipeProfiles.length === 0) return;
    
    const me = getData('currentUser');
    const target = currentSwipeProfiles[0];
    
    // Sauvegarder le like
    const allLikes = getData('likes');
    if (!allLikes[me.id]) allLikes[me.id] = [];
    allLikes[me.id].push(target.id);
    setData('likes', allLikes);

    if (type === 'like') {
        // Check Match
        const targetLikes = allLikes[target.id] || [];
        if (targetLikes.includes(me.id)) {
            createMatch(me, target);
        }
    }
    
    renderSwipe();
}

function createMatch(me, target) {
    const matches = getData('matches');
    const newMatch = {
        id: "match_" + Date.now(),
        user1: me.id,
        user2: target.id,
        messages: []
    };
    matches.push(newMatch);
    setData('matches', matches);

    // Popup
    document.getElementById('match-announcement').innerHTML = `
        <p>Toi et ${target.name} ${getFlagEmoji(target.country)} vous plaisez !</p>
    `;
    document.getElementById('match-modal').classList.remove('hidden');
}

function closeMatchModal() {
    document.getElementById('match-modal').classList.add('hidden');
    showView('matches-view');
}

// --- MATCHES & CHAT ---
function renderMatches() {
    const me = getData('currentUser');
    const matches = getData('matches');
    const users = getData('users');
    const list = document.getElementById('matches-list');
    
    const myMatches = matches.filter(m => m.user1 === me.id || m.user2 === me.id);
    
    list.innerHTML = myMatches.length === 0 ? "<p>Aucun match pour le moment.</p>" : "";

    myMatches.forEach(m => {
        const otherId = m.user1 === me.id ? m.user2 : m.user1;
        const otherUser = users.find(u => u.id === otherId);
        
        const div = document.createElement('div');
        div.className = "match-item";
        div.style = "display:flex; align-items:center; gap:15px; padding:10px; cursor:pointer; border-bottom:1px solid #eee";
        div.innerHTML = `
            <img src="${otherUser.photo}" style="width:50px; height:50px; border-radius:50%; object-fit:cover">
            <div>
                <strong>${otherUser.name} ${getFlagEmoji(otherUser.country)}</strong>
                <p style="font-size:12px; color:gray">Cliquez pour discuter</p>
            </div>
        `;
        div.onclick = () => openChat(m.id);
        list.appendChild(div);
    });
}

let activeMatchId = null;

function openChat(matchId) {
    activeMatchId = matchId;
    const me = getData('currentUser');
    const match = getData('matches').find(m => m.id === matchId);
    const otherId = match.user1 === me.id ? match.user2 : match.user1;
    const otherUser = getData('users').find(u => u.id === otherId);

    document.getElementById('chat-user-info').innerHTML = `
        <strong>${otherUser.name} ${getFlagEmoji(otherUser.country)}</strong>
    `;
    
    showView('chat-view');
    renderMessages();
}

function renderMessages() {
    const me = getData('currentUser');
    const match = getData('matches').find(m => m.id === activeMatchId);
    const container = document.getElementById('chat-messages');
    
    container.innerHTML = match.messages.map(msg => `
        <div class="msg ${msg.senderId === me.id ? 'sent' : 'received'}">
            ${msg.text}
        </div>
    `).join('');
    container.scrollTop = container.scrollHeight;
}

function sendMessage() {
    const input = document.getElementById('msg-input');
    const text = input.value.trim();
    if (!text) return;

    const me = getData('currentUser');
    const matches = getData('matches');
    const matchIndex = matches.findIndex(m => m.id === activeMatchId);

    matches[matchIndex].messages.push({
        senderId: me.id,
        text: text,
        time: new Date().toISOString()
    });

    setData('matches', matches);
    input.value = "";
    renderMessages();
}

// Support Touche Entrée
document.getElementById('msg-input').onkeypress = (e) => {
    if (e.key === 'Enter') sendMessage();
};

// --- INIT APP ---
window.onload = () => {
    const me = getData('currentUser');
    if (me.id) {
        showView('swipe-view');
    } else {
        showView('login-view');
    }
};
