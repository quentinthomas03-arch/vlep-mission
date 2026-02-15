import { ICONS } from './icons.js';
import { state, AGENT_COLORS, DEFAULT_GEH_COUNT } from './state.js';
import { BUILTIN_DB } from './database.js';
import { generateId, saveData } from './utils.js';

// --- INITIALISATION ---
document.addEventListener('DOMContentLoaded', () => {
    const saved = localStorage.getItem('vlep_missions_v3');
    if (saved) state.missions = JSON.parse(saved);

    const splash = document.getElementById('splash');
    if (splash) splash.style.display = 'none';

    renderHome();
});

// --- LOGIQUE DE FUSION (LE COEUR DU SYSTEME) ---
function findCompatiblePrelevement(geh, newAgent) {
    // On cherche si un prélèvement existant a le même Support et Prétraitement
    return geh.prelevements.find(p => {
        const firstAgent = p.agents[0];
        return firstAgent && 
               firstAgent["Code support"] === newAgent["Code support"] &&
               firstAgent["Code prétraitement"] === newAgent["Code prétraitement"];
    });
}

// --- RENDU ACCUEIL ---
function renderHome() {
    const app = document.getElementById('app');
    app.innerHTML = `
        <div class="container">
            <h1>VLEP Mission</h1>
            <button id="btnNew" class="btn btn-primary">Nouvelle Mission</button>
            <div class="mission-list">
                ${state.missions.map(m => `
                    <div class="card" onclick="window.viewMission('${m.id}')">
                        <h3>${m.entreprise}</h3>
                        <p>${m.gehs.length} GEH(s)</p>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
    document.getElementById('btnNew').onclick = () => {
        const name = prompt("Nom de l'entreprise ?") || "Nouvelle Entreprise";
        const mission = { id: generateId(), entreprise: name, gehs: [] };
        state.missions.push(mission);
        saveData(state.missions);
        renderHome();
    };
}

// --- VUE DÉTAILLÉE DU GEH (AVEC FUSION) ---
window.viewMission = (id) => {
    const mission = state.missions.find(m => m.id === id);
    const app = document.getElementById('app');
    app.innerHTML = `
        <div class="container">
            <button onclick="location.reload()">← Retour</button>
            <h2>${mission.entreprise}</h2>
            <div id="geh-area">
                ${mission.gehs.map(geh => `
                    <div class="geh-card">
                        <h4>${geh.nom}</h4>
                        <div class="prelev-list">
                            ${geh.prelevements.map(p => `
                                <div class="prelev-item">
                                    <strong>Support: ${p.agents[0]["Support de prélèvement"]}</strong>
                                    <ul>${p.agents.map(a => `<li>${a["Agent chimique"]}</li>`).join('')}</ul>
                                </div>
                            `).join('')}
                        </div>
                        <button onclick="window.showAgentSelector('${mission.id}', '${geh.id}')">Ajouter un Agent</button>
                    </div>
                `).join('')}
            </div>
            <button class="btn" onclick="window.addGEH('${mission.id}')">+ Ajouter un GEH</button>
        </div>
    `;
};

// --- LE SÉLECTEUR D'AGENT AVEC FUSION AUTO ---
window.showAgentSelector = (mId, gId) => {
    const agentName = prompt("Nom de l'agent (ex: Zinc) ?");
    const agentData = BUILTIN_DB.find(a => a["Agent chimique"].includes(agentName));
    
    if (!agentData) return alert("Agent non trouvé");

    const mission = state.missions.find(m => m.id === mId);
    const geh = mission.gehs.find(g => g.id === gId);

    // TENTATIVE DE FUSION
    const existingPrelev = findCompatiblePrelevement(geh, agentData);

    if (existingPrelev) {
        alert("Fusion automatique : cet agent sera prélevé sur le même support !");
        existingPrelev.agents.push(agentData);
    } else {
        // Nouveau prélèvement (pas de compatibilité trouvée)
        geh.prelevements.push({
            id: generateId(),
            agents: [agentData],
            pompe: ""
        });
    }

    saveData(state.missions);
    window.viewMission(mId);
};

window.addGEH = (mId) => {
    const mission = state.missions.find(m => m.id === mId);
    mission.gehs.push({ id: generateId(), nom: "GEH " + (mission.gehs.length + 1), prelevements: [] });
    saveData(state.missions);
    window.viewMission(mId);
};