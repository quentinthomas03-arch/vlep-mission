import { ICONS } from './icons.js';
import { state, AGENT_COLORS, DEFAULT_GEH_COUNT } from './state.js';
import { BUILTIN_DB } from './database.js';
import { escapeHtml, generateId, saveData } from './utils.js';

// --- INITIALISATION ---
document.addEventListener('DOMContentLoaded', () => {
    console.log("Démarrage de VLEP Mission...");
    initApp();
    
    // Cache le splash screen après 1.5s
    setTimeout(() => {
        const splash = document.getElementById('splash');
        if(splash) splash.style.display = 'none';
    }, 1500);
});

function initApp() {
    const app = document.getElementById('app');
    if (!app) return;
    renderHome();
}

// --- NAVIGATION / RENDU ---
function renderHome() {
    const app = document.getElementById('app');
    app.innerHTML = `
        <header class="app-header">
            <h1>VLEP Mission</h1>
            <div class="version">v3.8 - © Quentin THOMAS</div>
        </header>
        <main class="container">
            <div class="card">
                <h2>Nouvelle Mission</h2>
                <p>Commencez par créer une mission ou reprenez un projet existant.</p>
                <button id="btnNewMission" class="btn btn-primary">Créer une Mission</button>
            </div>
            
            <div class="mission-list" id="missionList">
                </div>
        </main>
    `;
    
    document.getElementById('btnNewMission').onclick = () => createNewMission();
}

function createNewMission() {
    const id = generateId();
    const newMission = {
        id: id,
        date: new Date().toLocaleDateString(),
        entreprise: "Nouvelle Entreprise",
        gehs: []
    };
    state.missions.push(newMission);
    saveData(state.missions);
    renderMissionDetail(id);
}

// --- LOGIQUE DE FUSION (STRUCTURE) ---
// Cette fonction sera appelée par Claude pour ajouter tes agents
function addAgentToPrelevement(missionId, gehId, prelevementId, agentData) {
    const mission = state.missions.find(m => m.id === missionId);
    // Ici on ajoutera la logique : 
    // SI (support == existant && debit == existant) -> push dans le tableau agents
    console.log("Tentative d'ajout d'agent:", agentData["Agent chimique"]);
}

function renderMissionDetail(id) {
    const mission = state.missions.find(m => m.id === id);
    const app = document.getElementById('app');
    app.innerHTML = `
        <div class="header-action">
            <button onclick="location.reload()" class="btn-back">← Retour</button>
            <h2>${mission.entreprise}</h2>
        </div>
        <div class="container">
            <div class="card">
                <h3>Saisie Terrain / Préparation</h3>
                <p>Ici s'affichera la liste de vos GEH et vos prélèvements.</p>
                <div id="gehContainer"></div>
                <button class="btn btn-secondary" id="btnAddGeh">+ Ajouter un GEH</button>
            </div>
        </div>
    `;
}

console.log("Système prêt.");