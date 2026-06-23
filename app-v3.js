let user = null;
let groupeActif = null;
let chatActif = null;

// Attendre que DOM soit chargé
document.addEventListener('DOMContentLoaded', () => {

  // Sélection sexe avec feedback visuel
  document.querySelectorAll('.sexe-btn').forEach(btn => {
    btn.onclick = () => {
      document.querySelectorAll('.sexe-btn').forEach(b => {
        b.classList.remove('active');
        b.style.borderColor = '#e0e0e0';
      });
      btn.classList.add('active');
      btn.style.borderColor = '#128C7E';
      document.getElementById('sexe').value = btn.dataset.sexe;
    }
  });

  // Photo preview + vérif taille
  const photoInput = document.getElementById('photo');
  if(photoInput) {
    photoInput.onchange = e => {
      const file = e.target.files[0];
      if(!file) return;

      if(file.size > 2 * 1024 * 1024) {
        alert('Photo trop lourde! Max 2MB');
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        document.getElementById('preview').src = reader.result;
        document.getElementById('preview').style.display = 'block';
        localStorage.setItem('tempPhoto', reader.result);
      }
      reader.readAsDataURL(file);
    }
  }
});

// INSCRIPTION avec messages clairs
function sInscrire(){
  const nom = document.getElementById('nom')?.value.trim();
  const sexe = document.getElementById('sexe')?.value;
  const photo = localStorage.getItem('tempPhoto');

  // Validation une par une pour savoir c quoi le problème
  if(!nom) {
    alert('❌ Mets ton prénom');
    document.getElementById('nom').focus();
    return;
  }
  if(!sexe) {
    alert('❌ Clique sur 👩 Fille ou 👨 Garçon');
    return;
  }
  if(!photo) {
    alert('❌ Ajoute une photo de profil');
    return;
  }

  user = {
    id: Date.now(),
    nom,
    sexe,
    photo,
    chatAvec: null,
    groupe: null
  };

  localStorage.setItem('k_user', JSON.stringify(user));
  localStorage.removeItem('tempPhoto'); // Nettoie pour pas polluer

  rejoindreGroupe();
  showPage('page-lobby');
}

function rejoindreGroupe(){
  let groupes = JSON.parse(localStorage.getItem('k_groupes')) || [];

  // Cherche groupe avec place
  let groupe = groupes.find(g => {
    if(user.sexe === 'fille') return g.filles.length < 5;
    return g.garcons.length < 5;
  });

  // Crée nouveau groupe si aucun dispo
  if(!groupe){
    groupe = {id: Date.now(), filles: [], garcons: []};
    groupes.push(groupe);
  }

  // Ajoute user seulement s'il est pas déjà dedans
  const dejaDedans = groupe.filles.find(u => u.id === user.id) || groupe.garcons.find(u => u.id === user.id);

  if(!dejaDedans){
    if(user.sexe === 'fille') {
      groupe.filles.push(user);
    } else {
      groupe.garcons.push(user);
    }
    user.groupe = groupe.id;
    localStorage.setItem('k_user', JSON.stringify(user));
  }

  localStorage.setItem('k_groupes', JSON.stringify(groupes));
  groupeActif = groupe;
  afficherGroupes();
}

function afficherGroupes(){
  const div = document.getElementById('groupes');
  const groupes = JSON.parse(localStorage.getItem('k_groupes')) || [];

  if(groupes.length === 0) {
    div.innerHTML = '<p style="padding:20px;text-align:center;color:#999">Aucun groupe encore...</p>';
    return;
  }

  div.innerHTML = groupes.map(g => {
    const complet = g.filles.length === 5 && g.garcons.length === 5;
    const opposés = user.sexe === 'fille'? g.garcons : g.filles;

    return `
    <div class="groupe" onclick="${complet? `entrerChat(${g.id})` : `alert('⏳ En attente de joueurs... ${g.filles.length}/5 filles, ${g.garcons.length}/5 garçons')`}">
      <h3>Groupe #${g.id.toString().slice(-4)}</h3>
      <p>${g.filles.length}/5 filles • ${g.garcons.length}/5 garçons ${complet? '✅' : ''}</p>
      <div class="avatars">
        ${opposés.slice(0,5).map(f => `<img class="avatar" src="${f.photo}" title="${f.nom}">`).join('')}
      </div>
    </div>`;
  }).join('');
}

function entrerChat(id){
  localStorage.setItem('k_groupeActif', id);
  const groupes = JSON.parse(localStorage.getItem('k_groupes')) || [];
  groupeActif = groupes.find(g => g.id == id);

  if(!groupeActif) {
    alert('Groupe introuvable');
    return;
  }

  // Ouvre direct le premier membre dispo
  const opposés = user.sexe === 'fille'? groupeActif.garcons : groupeActif.filles;
  const dispo = opposés.find(m =>!m.chatAvec || m.chatAvec === user.id);

  if(!dispo) {
    alert('Tout le monde est occupé ❤️ Reviens plus tard');
    return;
  }

  ouvrirChat(dispo.id);
  showPage('page-chat');
}

function ouvrirChat(idMembre){
  const membre = [...groupeActif.filles,...groupeActif.garcons].find(u => u.id === idMembre);

  if(!membre) {
    alert('Membre introuvable');
    return;
  }

  if(membre.chatAvec && membre.chatAvec!== user.id){
    return alert(membre.nom + ' est déjà en chat privé ❤️');
  }

  // Lie les deux
  if(!membre.chatAvec){
    membre.chatAvec = user.id;
    user.chatAvec = membre.id;
    sauverGroupe();
  }

  chatActif = membre;
  document.getElementById('chat-photo').src = membre.photo;
  document.getElementById('chat-nom').innerText = membre.nom;
  afficherMessages();
}

function envoyer(){
  const texte = document.getElementById('msg').value.trim();
  if(!texte ||!chatActif) return;

  const key = `chat_${Math.min(user.id, chatActif.id)}_${Math.max(user.id, chatActif.id)}`;
  let msgs = JSON.parse(localStorage.getItem(key)) || [];
  msgs.push({de: user.id, texte, time: Date.now()});
  localStorage.setItem(key, JSON.stringify(msgs));

  document.getElementById('msg').value = '';
  afficherMessages();
}

function afficherMessages(){
  if(!chatActif) return;

  const key = `chat_${Math.min(user.id, chatActif.id)}_${Math.max(user.id, chatActif.id)}`;
  const msgs = JSON.parse(localStorage.getItem(key)) || [];

  const messagesDiv = document.getElementById('messages');
  messagesDiv.innerHTML = msgs.map(m => {
    const heure = new Date(m.time).toLocaleTimeString('fr-FR', {hour: '2-digit', minute: '2-digit'});
    const check = m.de === user.id? '<span class="check">✓</span>' : '';
    return `
    <div class="msg ${m.de === user.id? 'moi' : 'autre'}">
      <div class="bulle">${m.texte}<span class="heure">${heure}${check}</span></div>
    </div>`;
  }).join('');

  messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

function sauverGroupe(){
  let groupes = JSON.parse(localStorage.getItem('k_groupes')) || [];
  const idx = groupes.findIndex(g => g.id === groupeActif.id);
  if(idx!== -1) {
    groupes[idx] = groupeActif;
    localStorage.setItem('k_groupes', JSON.stringify(groupes));
    localStorage.setItem('k_user', JSON.stringify(user));
  }
}

function retourLobby(){
  chatActif = null;
  showPage('page-lobby');
  afficherGroupes();
}

function deconnecter(){
  if(confirm('Tu veux vraiment te déconnecter?')) {
    localStorage.clear();
    user = null;
    groupeActif = null;
    chatActif = null;
    showPage('page-signup');
  }
}

function showPage(id){
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}

// Auto-login au chargement
window.onload = () => {
  user = JSON.parse(localStorage.getItem('k_user'));
  if(user && user.groupe) {
    const groupes = JSON.parse(localStorage.getItem('k_groupes')) || [];
    groupeActif = groupes.find(g => g.id == user.groupe);
    if(groupeActif) {
      showPage('page-lobby');
      afficherGroupes();
    } else {
      localStorage.removeItem('k_user');
      showPage('page-signup');
    }
  }
}
