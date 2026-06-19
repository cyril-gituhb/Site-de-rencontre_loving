// Fonction pour convertir "CD" en 🇨🇩
function getFlagEmoji(countryCode) {
  if (!countryCode || countryCode.length!== 2) return '';
  return countryCode.toUpperCase().split('')
   .map(char => String.fromCodePoint(127397 + char.charCodeAt()))
   .join('');
}

// Récupérer les éléments
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

// Activer bouton si tous champs remplis
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

// Inscription
btnSignup.addEventListener('click', () => {
  const photoFile = photoInput.files[0];
  const reader = new FileReader();

  reader.onload = function(e) {
    const user = {
      id: Date.now(),
      email: signupEmail.value,
      password: signupPassword.value,
      nom: signupName.value,
      age: signupAge.value,
      country: signupCountry.value, // <-- pays sauvegardé
      bio: signupBio.value,
      photo: e.target.result
    };

    // Sauvegarder user dans localStorage
    localStorage.setItem('currentUser', JSON.stringify(user));

    // Ajouter à la liste des users
    let users = JSON.parse(localStorage.getItem('users') || '[]');
    users.push(user);
    localStorage.setItem('users', JSON.stringify(users));

    alert('Inscription réussie!');
    showPage('swipe');
    afficherProfil();
  };

  if (photoFile) {
    reader.readAsDataURL(photoFile);
  } else {
    reader.onload({target: {result: ''}});
  }
});

// Connexion
const btnLogin = document.getElementById('btnLogin');
const loginEmail = document.getElementById('loginEmail');
const loginPassword = document.getElementById('loginPassword');

[loginEmail, loginPassword].forEach(input => {
  input.addEventListener('input', () => {
    btnLogin.disabled =!(loginEmail.value && loginPassword.value);
  });
});

btnLogin.addEventListener('click', () => {
  const users = JSON.parse(localStorage.getItem('users') || '[]');
  const user = users.find(u => u.email === loginEmail.value && u.password === loginPassword.value);

  if (user) {
    localStorage.setItem('currentUser', JSON.stringify(user));
    showPage('swipe');
    afficherProfil();
  } else {
    document.getElementById('errorLogin').textContent = 'Email ou mot de passe incorrect';
  }
});

// Déconnexion
document.getElementById('btnLogout').addEventListener('click', () => {
  localStorage.removeItem('currentUser');
  showPage('login');
});

// Navigation entre pages
document.getElementById('linkToSignup').addEventListener('click', (e) => {
  e.preventDefault();
  showPage('signup');
});

document.getElementById('linkToLogin').addEventListener('click', (e) => {
  e.preventDefault();
  showPage('login');
});

function showPage(page) {
  pageSignup.classList.remove('active');
  pageLogin.classList.remove('active');
  pageSwipe.classList.remove('active');
  pageChat.classList.remove('active');

  if (page === 'signup') pageSignup.classList.add('active');
  if (page === 'login') pageLogin.classList.add('active');
  if (page === 'swipe') pageSwipe.classList.add('active');
  if (page === 'chat') pageChat.classList.add('active');

  document.getElementById('btnLogout').style.display = page === 'swipe' || page === 'chat'? 'block' : 'none';
}

// Afficher profil avec drapeau
function afficherProfil() {
  const user = JSON.parse(localStorage.getItem('currentUser'));
  if (user) {
    // Dans le chat
    const matchFlag = document.getElementById('matchFlag');
    const matchNameText = document.getElementById('matchNameText');
    if (matchFlag && matchNameText) {
      matchFlag.textContent = getFlagEmoji(user.country);
      matchNameText.textContent = user.nom;
    }

    // Dans les cartes swipe - exemple
    afficherCartes();
  }
}

// Exemple pour afficher les cartes avec drapeau
function afficherCartes() {
  const container = document.getElementById('cardsContainer');
  const users = JSON.parse(localStorage.getItem('users') || '[]');
  const currentUser = JSON.parse(localStorage.getItem('currentUser'));

  container.innerHTML = '';

  users.filter(u => u.id!== currentUser.id).forEach(user => {
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
      <img src="${user.photo}" alt="${user.nom}">
      <div class="card-info">
        <h3>${getFlagEmoji(user.country)} ${user.nom}, ${user.age}</h3>
        <p>${user.bio}</p>
      </div>
    `;
    container.appendChild(card);
  });
}

// Au chargement
window.addEventListener('load', () => {
  const user = localStorage.getItem('currentUser');
  if (user) {
    showPage('swipe');
    afficherProfil();
  } else {
    showPage('login');
  }
});
