let user = null;
let groupeActif = null;
let chatActif = null;

// Sélection sexe
document.querySelectorAll('.sexe-btn').forEach(btn => {
  btn.onclick = () => {
    document.querySelectorAll('.sexe-btn').forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById('sexe').value = btn.dataset.sexe;
  }
});

// Photo preview
document.getElementById('photo').onchange = e => {
  const file = e.target.files[0];
  if(!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    document.getElementById('preview').src = reader.result;
    document.getElementById('preview').style.display = 'block';
    localStorage.setItem('tempPhoto', reader.result);
  }
  reader.readAsDataURL(file);
}

function sInscrire(){
  const nom = document.getElementById('nom').value.trim();
  const sexe = document.getElementById('sexe').value;
  const photo = localStorage.getItem('tempPhoto');
  if(!nom ||!sexe ||!photo) return alert('Remplis tout!');

  user = {id: Date.now(), nom, sexe, photo, chatAvec: null, groupe: null};
  localStorage.setItem('k_user', JSON.stringify(user));
  rejoindreGroupe();
  showPage('page-lobby');
}

function rejoindreGroupe(){
  let groupes = JSON.parse(localStorage.getItem('k_groupes')) || [];
  let groupe = groupes.find(g => {
    if(user.sexe==='fille') return g.filles.length < 5;
    return g.garcons.length < 5;
  });
  if(!groupe){
    groupe = {id: Date.now(), filles:[], garcons:[]};
    groupes.push(groupe);
  }
  if(!groupe.filles.find(u=>u.id===user.id) &&!groupe.garcons.find(u=>u.id===user.id)){
    user.sexe==='fille'? groupe.filles.push(user) : groupe.garcons.push(user);
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

  div.innerHTML = groupes.map(g => {
    const complet = g.filles.length===5 && g.garcons.length===5;
    const opposés = user.sexe==='fille'? g.garcons : g.filles;

    return `
    <div class="groupe" onclick="${complet?`entrerChat(${g.id})`:'alert(\'En attente de joueurs...\')'}">
      <h3>Groupe #${g.id.toString().slice(-4)}</h3>
      <p>${g.filles.length}/5 filles • ${g.garcons.length}/5 garçons ${complet?'✓':''}</p>
      <div class="avatars">
        ${opposés.slice(0,5).map(f=>`<img class="avatar" src="${f.photo}" title="${f.nom}">`).join('')}
      </div>
    </div>`;
  }).join('');
}

function entrerChat(id){
  localStorage.setItem('k_groupeActif', id);
  groupeActif = JSON.parse(localStorage.getItem('k_groupes')).find(g=>g.id==id);

  // Ouvre direct le premier membre dispo
  const opposés = user.sexe==='fille'? groupeActif.garcons : groupeActif.filles;
  const dispo = opposés.find(m =>!m.chatAvec || m.chatAvec===user.id);

  if(!dispo) return alert('Tout le monde est occupé ❤️');
  ouvrirChat(dispo.id);
  showPage('page-chat');
}

function ouvrirChat(idMembre){
  const membre = [...groupeActif.filles,...groupeActif.garcons].find(u=>u.id===idMembre);
  if(membre.chatAvec && membre.chatAvec!==user.id){
    return alert(membre.nom + ' est occupé ❤️');
  }
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
  const key = `chat_${Math.min(user.id,chatActif.id)}_${Math.max(user.id,chatActif.id)}`;
  let msgs = JSON.parse(localStorage.getItem(key)) || [];
  msgs.push({de: user.id, texte, time: Date.now()});
  localStorage.setItem(key, JSON.stringify(msgs));
  document.getElementById('msg').value = '';
  afficherMessages();
}

function afficherMessages(){
  if(!chatActif) return;
  const key = `chat_${Math.min(user.id,chatActif.id)}_${Math.max(user.id,chatActif.id)}`;
  const msgs = JSON.parse(localStorage.getItem(key)) || [];

  document.getElementById('messages').innerHTML = msgs.map(m => {
    const heure = new Date(m.time).toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'});
    const check = m.de===user.id? '<span class="check">✓</span>' : '';
    return `
    <div class="msg ${m.de===user.id?'moi':'autre'}">
      <div class="bulle">${m.texte}<span class="heure">${heure}${check}</span></div>
    </div>`;
  }).join('');
  document.getElementById('messages').scrollTop = document.getElementById('messages').scrollHeight;
}

function sauverGroupe(){
  let groupes = JSON.parse(localStorage.getItem('k_groupes'));
  const idx = groupes.findIndex(g=>g.id===groupeActif.id);
  groupes[idx] = groupeActif;
  localStorage.setItem('k_groupes', JSON.stringify(groupes));
  localStorage.setItem('k_user', JSON.stringify(user));
}

function retourLobby(){
  chatActif = null;
  showPage('page-lobby');
  afficherGroupes();
}

function deconnecter(){
  localStorage.clear();
  user = null;
  showPage('page-signup');
}

function showPage(id){
  document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}

window.onload = () => {
  user = JSON.parse(localStorage.getItem('k_user'));
  if(user){
    groupeActif = JSON.parse(localStorage.getItem('k_groupes'))?.find(g=>g.id==user.groupe);
    showPage('page-lobby');
    afficherGroupes();
  }
}
