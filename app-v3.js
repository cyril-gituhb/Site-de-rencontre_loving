// Simulation de l'utilisateur actuel
let currentUser = {
    name: "",
    gender: "",
    isOccupied: false
};

// Simulation de l'état des groupes (Max 10)
let groups = [
    { id: 1, name: "Plage Étudiante 🏖️", girls: 5, boys: 4 },
    { id: 2, name: "Soirée Campus", girls: 3, boys: 5 }
];

document.getElementById('register-form').addEventListener('submit', function(e) {
    e.preventDefault();
    currentUser.gender = document.getElementById('gender').value;
    // Passage à l'interface de chat
    document.getElementById('auth-section').classList.add('hidden');
    document.getElementById('chat-section').classList.remove('hidden');
});

// Fonction pour vérifier la règle Garçon-Garçon
function startPrivateChat(targetUser) {
    if (currentUser.gender === 'M' && targetUser.gender === 'M') {
        alert("Désolé ! La connexion privée n'est pas possible entre deux garçons sur Kelvin Loving.");
        return false;
    }
    
    if (targetUser.isOccupied) {
        alert("Cet étudiant est déjà en pleine discussion !");
        return false;
    }

    console.log("Discussion démarrée...");
}

// Fonction pour rejoindre un groupe
function joinGroup(groupId) {
    let group = groups.find(g => g.id === groupId);
    let total = group.girls + group.boys;

    if (total >= 10) {
        alert("Ce groupe est complet (10/10) !");
        return;
    }

    // Vérification mixité
    if (currentUser.gender === 'M' && group.boys >= 5) {
        alert("Plus de place pour les garçons dans ce groupe.");
        return;
    }
    if (currentUser.gender === 'F' && group.girls >= 5) {
        alert("Plus de place pour les filles dans ce groupe.");
        return;
    }

    alert("Bienvenue dans le groupe " + group.name);
}
