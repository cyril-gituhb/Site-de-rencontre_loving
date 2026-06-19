// Fonction drapeau: "CD" → 🇨🇩
function getFlagEmoji(countryCode) {
  if (!countryCode || countryCode.length!== 2) return '';
  return countryCode.toUpperCase().split('')
   .map(char => String.fromCodePoint(127397 + char.charCodeAt()))
   .join('');
}

// Elements DOM
const pageSignup = document.getElementById('pageSignup');
const pageLogin = document.getElementById('pageLogin');
const pageSwipe = document.getElementById('pageSwipe');
const pageChat = document.getElementById('pageChat');

// Formulaire inscription
const btnSignup = document.getElementById('btnSignup');
const signupEmail = document.getElementById('signupEmail');
const signupPassword = document.getElementById('signupPassword');
const signupName = document.getElementById('signupName');
const signupAge = document.getElementById('signupAge');
const signupCountry = document.getElementById('signupCountry');
const signupBio = document.getElementById('signupBio');
const photoInput = document.getElementById('photoInput');

// Formulaire connexion
const btnLogin = document.getElementById('btnLogin');
const loginEmail = document.getElementById('loginEmail');
const loginPassword = document.getElementById('loginPassword');

// Swipe
const btnPass = document.getElementById('btnPass');
const btnLike = document.getElementById('btnLike');
const cardsContainer = document.getElementById('cardsContainer');

// Chat
const btnBackToSwipe = document.getElementById('btnBackToSwipe');
const btnSendMessage = document.getElementById('btnSendMessage');
const chatInput = document.getElementById('chatInput');
const messagesContainer = document.getElementById('messagesContainer');
const matchFlag = document.getElementById('matchFlag');
const matchNameText = document.getElementById('matchNameText');
const matchAvatar = document.getElementById('matchAvatar');

// Variables globales
let currentCardIndex = 0;
let likes = JSON.parse(localStorage.getItem('likes') || '{}');
let matches = JSON.parse(localStorage.getItem('matches') || '[]');
let currentMatchId = null;

// ========== NAVIGATION ==========
function showPage(page) {
  [pageSignup, pageLogin, pageSwipe, pageChat].forEach(p => p.classList.remove('active'));

  if (page === 'signup') pageSignup.classList.add('active');
  if (page === 'login') pageLogin.classList.add('active');
  if (page === 'swipe') pageSwipe.classList.add('active');
  if (page === 'chat') pageChat.classList.add('active');

  document.getElementById('btnLogout').style.display =
    page === 'swipe' || page === 'chat'? 'block' : 'none';
}

document.getElementById('linkToSignup').addEventListener('click', (e) => {
  e.preventDefault();
  showPage('signup');
});

document.getElementById('linkToLogin').addEventListener('click', (e) => {
  e.preventDefault();
  showPage('login');
});

document.getElementById('btnLogout').addEventListener('click', () => {
  localStorage.removeItem('currentUser');
  currentMatchId = null;
  showPage('login');
});

// ========== VALIDATION FORMULAIRE ==========
[signupEmail, signupPassword, signupName, signupAge, signupCountry].forEach(input => {
  input.addEventListener('input', checkSignupForm);
});

function checkSignupForm() {
  btnSignup.disabled =!(
    signupEmail.value &&
    signupPassword.value.length >= 6 &&
    signupName.value &&
    signupAge.value >= 18 &&
    signupCountry.value
  );
}

[loginEmail, loginPassword].forEach(input => {
  input.addEventListener('input', () => {
    btnLogin.disabled =!(loginEmail.value && loginPassword.value);
  });
});

// ========== INSCRIPTION ==========
btnSignup.addEventListener('click', () => {
  const photoFile = photoInput.files[0];
  const reader = new FileReader();

  reader.onload = function(e) {
    const user = {
      id: Date.now(),
      email: signupEmail.value,
      password: signupPassword.value,
      nom: signupName.value,
      age: parseInt(signupAge.value),
      country: signupCountry.value,
      bio: signupBio.value,
      photo: e.target.result || 'https://i.pravatar.cc/300'
    };

    localStorage.setItem('currentUser', JSON.stringify(user));

    let users = JSON.parse(localStorage.getItem('users') || '[]');
    if (users.find(u => u.email === user.email)) {
      document.getElementById('errorSignup').textContent = 'Cet email existe déjà';
      return;
    }
    users.push(user);
    localStorage.setItem('users', JSON.stringify(users));

    alert('Inscription réussie! 🎉');
    showPage('swipe');
    currentCardIndex = 0;
    afficherCartes();
  };

  if (photoFile) {
    reader.readAsDataURL(photoFile);
  } else {
    reader.onload({target: {result: ''}});
  }
});

// ========== CONNEXION ==========
btnLogin.addEventListener('click', () => {
  const users = JSON.parse(localStorage.getItem('users') || '[]');
  const user = users.find(u => u.email === loginEmail.value && u.password === loginPassword.value);

  if (user) {
    localStorage.setItem('currentUser', JSON.stringify(user));
    showPage('swipe');
    currentCardIndex = 0;
    afficherCartes();
  } else {
    document.getElementById('errorLogin').textContent = 'Email ou mot de passe incorrect';
  }
});

// ========== SWIPE + MATCH ==========
function afficherCartes() {
  const currentUser = JSON.parse(localStorage.getItem('currentUser'));
  const users = JSON.parse(localStorage.getItem('users') || '[]');

  // Exclure moi-même + ceux déjà likés/passés
  const dejaVus = likes[currentUser.id] || [];
  const autres = users.filter(u => u.id!== currentUser.id &&!dejaVus.includes(u.id));

  if (currentCardIndex >= autres.length) {
    cardsContainer.innerHTML = '<p style="text-align:center;color:#999;padding:50px">Plus de profils pour le moment 😢</p>';
    btnPass.style.display = 'none';
    btnLike.style.display = 'none';
    return;
  }

  const user = autres[currentCardIndex];
  cardsContainer.innerHTML = `
    <div class="card" data-id="${user.id}">
      <img src="${user.photo}" alt="${user.nom}">
      <div class="card-info">
        <h3>${getFlagEmoji(user.country)} ${user.nom}, ${user.age}</h3>
        <p>${user.bio || 'Aucune bio'}</p>
      </div>
    </div>
  `;
  btnPass.style.display = 'block';
  btnLike.style.display = 'block';
}

btnPass.addEventListener('click', () => {
  const currentUser = JSON.parse(localStorage.getItem('currentUser'));
  const users = JSON.parse(localStorage.getItem('users') || '[]');
  const dejaVus = likes[currentUser.id] || [];
  const autres = users.filter(u => u.id!== currentUser.id &&!dejaVus.includes(u.id));

  if (!likes[currentUser.id]) likes[currentUser.id] = [];
  likes[currentUser.id].push(autres[currentCardIndex].id);
  localStorage.setItem('likes', JSON.stringify(likes));

  currentCardIndex++;
  afficherCartes();
});

btnLike.addEventListener('click', () => {
  const currentUser = JSON.parse(localStorage.getItem('currentUser'));
  const users = JSON.parse(localStorage.getItem('users') || '[]');
  const dejaVus = likes[currentUser.id] || [];
  const autres = users.filter(u => u.id!== currentUser.id &&!dejaVus.includes(u.id));
  const autre = autres[currentCardIndex];

  // Sauvegarder mon like
  if (!likes[currentUser.id]) likes[currentUser.id] = [];
  likes[currentUser.id].push(autre.id);
  localStorage.setItem('likes', JSON.stringify(likes));

  // Vérifier si match
  if (likes[autre.id] && likes[autre.id].includes(currentUser.id)) {
    // Créer match s'il n'existe pas
    let matchId = matches.find(m =>
      (m.user1 === currentUser.id && m.user2 === autre.id) ||
      (m.user1 === autre.id && m.user2 === currentUser.id)
    )?.id;

    if (!matchId) {
      matchId = Date.now();
      matches.push({
        id: matchId,
        user1: currentUser.id,
        user2: autre.id,
        messages: []
      });
      localStorage.setItem('matches', JSON.stringify(matches));
    }

    alert(`🎉 MATCH avec ${getFlagEmoji(autre.country)} ${autre.nom}!`);
    ouvrirChat(matchId, autre);
  } else {
    currentCardIndex++;
    afficherCartes();
  }
});

// ========== CHAT ==========
function ouvrirChat(matchId, autreUser) {
  currentMatchId = matchId;
  localStorage.setItem('currentMatch', matchId);
  showPage('chat');

  matchFlag.textContent = getFlagEmoji(autreUser.country);
  matchNameText.textContent = autreUser.nom;
  matchAvatar.src = autreUser.photo;

  afficherMessages();
}

btnBackToSwipe.addEventListener('click', () => {
  showPage('swipe');
  currentCardIndex = 0;
  afficherCartes();
});

btnSendMessage.addEventListener('click', envoyerMessage);
chatInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter' &&!e.shiftKey) {
    e.preventDefault();
    envoyerMessage();
  }
});

function envoyerMessage() {
  const msg = chatInput.value.trim();
  if (!msg ||!currentMatchId) return;

  const currentUser = JSON.parse(localStorage.getItem('currentUser'));
  matches = JSON.parse(localStorage.getItem('matches') || '[]');
  const match = matches.find(m => m.id == currentMatchId);

  match.messages.push({
    sender: currentUser.id,
    text: msg,
    time: Date.now()
  });

  localStorage.setItem('matches', JSON.stringify(matches));
  chatInput.value = '';
  afficherMessages();
}

function afficherMessages() {
  if (!currentMatchId) return;

  matches = JSON.parse(localStorage.getItem('matches') || '[]');
  const match = matches.find(m => m.id == currentMatchId);
  const currentUser = JSON.parse(localStorage.getItem('currentUser'));

  messagesContainer.innerHTML = match.messages.map(m => `
    <div style="margin:10px 0; text-align:${m.sender === currentUser.id? 'right' : 'left'}">
      <span style="background:${m.sender === currentUser.id? '#f5576c' : '#e0e0e0'};
      color:${m.sender === currentUser.id? 'white' : 'black'};
      padding:10px 14px; border-radius:18px; display:inline-block; max-width:70%; word-wrap:break-word">
      ${m.text}</span>
    </div>
  `).join('');

  messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// ========== CHARGEMENT ==========
window.addEventListener('load', () => {
  const user = localStorage.getItem('currentUser');
  if (user) {
    showPage('swipe');
    currentCardIndex = 0;
    afficherCartes();
  } else {
    showPage('login');
  }
});
