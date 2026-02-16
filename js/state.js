// state.js - État global de l'application
// © 2025 Quentin THOMAS

const AGENT_COLORS = ['#00a878','#0f4c81','#e63946','#7c3aed','#f59e0b','#0891b2','#c026d3','#65a30d','#0284c7','#db2777','#4f46e5','#059669','#d97706','#7c2d12','#1d4ed8'];
const DEFAULT_GEH_COUNT = 5;

let state = {
    _author: 'Quentin THOMAS',
    _copyright: '© 2025 Quentin THOMAS',
    
    // Navigation
    view: 'home',
    showModal: null,
    
    // Données
    missions: [],
    agentsDB: [],
    
    // Mission courante
    currentMissionId: null,
    currentPrelId: null,
    activeSubIndex: 0,
    
    // UI
    searchText: '',
    expandedGeh: {},
    
    // Terrain v4 - Co-prélèvement agents
    coPrelevementAgentsMode: false,
    selectedForCoPrel: [],
    
    // Terrain v4 - Fusion prélèvements
    fusionPrelevementsMode: false,
    selectedForFusion: [],
    
    // Ancien mode fusion (à supprimer progressivement)
    fusionMode: false,
    
    // Quick entry
    quickPrelType: '8h',
    quickPrelReg: true,
    quickAgentSearch: '',
    quickGehId: null,
    quickMission: null,
    
    // Échantillons
    echantillonSort: 'date',
    
    // Blancs
    blancAgentSearch: '',
    blancAgents: [],
    
    // Prep
    newPrelData: null,
    
    // Timers
    timers: {},
    
    // CIP
    showCIPSection: false
};

console.log('✓ State chargé');
