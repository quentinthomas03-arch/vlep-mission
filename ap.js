// === IMPORTATIONS DES MODULES ===
import { ICONS } from './icons.js';
import { state, AGENT_COLORS, DEFAULT_GEH_COUNT } from './state.js';
import { BUILTIN_DB } from './database.js';
import { escapeHtml, escapeJs, generateId, saveData } from './utils.js';

// === INITIALISATION ===
const splash = document.getElementById("splash");
if (splash) splash.style.display = "none";
const app = document.getElementById("app");

// === LOGIQUE DE CHARGEMENT ===
function loadData() {
    const saved = localStorage.getItem('vlep_mission_data');
    if (saved) {
        try {
            const parsed = JSON.parse(saved);
            state.missions = parsed.missions || [];
            state.agentsDB = parsed.agentsDB || [];
        } catch (e) {
            console.error("Erreur de chargement", e);
        }
    }
}

// === LES FONCTIONS DE RENDU (RENDER) ===
// C'est ici que Claude travaillera désormais. 
// Le code est beaucoup plus court car les icônes et la DB sont ailleurs.

function render() {
    if (state.view === 'home') {
        renderHome();
    } else if (state.view === 'mission_detail') {
        renderMissionDetail();
    }
    // ... (Le reste de vos fonctions render habituelles)
    // IMPORTANT : Claude pourra maintenant vous redonner ces fonctions 
    // sans jamais saturer !
}

// Initialisation au démarrage
loadData();
render();

// === GESTION DU SERVICE WORKER (PWA) ===
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js').then(reg => {
            console.log('SW enregistré');
        });
    });
}