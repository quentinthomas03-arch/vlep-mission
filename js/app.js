// app.js - Point d'entrée de l'application
// © 2025 Quentin THOMAS

// ===== INITIALISATION =====
document.addEventListener('DOMContentLoaded', function(){
  console.log('[VLEP] Initialisation...');
  
  // Cacher le splash screen
  setTimeout(function(){
    var splash = document.getElementById('splash');
    if(splash){
      splash.style.opacity = '0';
      setTimeout(function(){
        splash.style.display = 'none';
      }, 300);
    }
  }, 1000);
  
  // Charger les données
  loadData();
  
  // Premier rendu
  render();
  
  console.log('[VLEP] ✓ Initialisé');
});

// ===== CHARGEMENT DONNÉES =====
function loadData(){
  try{
    var saved = localStorage.getItem('vlep_missions_v3');
    if(saved){
      state.missions = JSON.parse(saved);
      console.log('[VLEP] ✓ Données chargées:', state.missions.length, 'mission(s)');
    }
    
    // Charger la DB agents si disponible
    if(typeof BUILTIN_DB !== 'undefined'){
      state.agentsDB = BUILTIN_DB;
      console.log('[VLEP] ✓ Base de données:', state.agentsDB.length, 'agents');
    }
  }catch(e){
    console.error('[VLEP] Erreur chargement données:', e);
  }
}

// ===== ROUTEUR PRINCIPAL =====
function render(){
  var html = '';
  
  switch(state.view){
    case 'home':
      html = renderHome();
      break;
    case 'terrain-list':
      html = renderTerrainList();
      break;
    case 'terrain':
      html = renderTerrainMission();
      break;
    default:
      html = '<div class="container"><h1>Vue non trouvée: '+state.view+'</h1></div>';
  }
  
  document.getElementById('app').innerHTML = html;
  
  // Attach event listeners après le rendu si nécessaire
  attachEventListeners();
}

// ===== EVENT LISTENERS =====
function attachEventListeners(){
  // Pour les résultats de recherche agents (si modal ouverte)
  var searchResults = document.querySelectorAll('.search-result-item');
  searchResults.forEach(function(item){
    item.addEventListener('click', function(){
      var agentName = this.getAttribute('data-agent');
      if(state.newPrelData && state.newPrelData.agents){
        var agentDB = getAgentFromDB(agentName);
        if(agentDB){
          var color = AGENT_COLORS[state.newPrelData.agents.length % AGENT_COLORS.length];
          state.newPrelData.agents.push({name:agentName, color:color});
          state.newPrelData.agentSearch = '';
          render();
        }
      }
    });
  });
}

// ===== VUE HOME =====
function renderHome(){
  var h = '<div class="container">';
  h += '<div class="card">';
  h += '<h1>'+ICONS.flask+' VLEP Mission v3.8</h1>';
  h += '<p class="subtitle">Gestion des prélèvements professionnels</p>';
  h += '</div>';
  
  h += '<div class="row">';
  h += '<button class="btn btn-primary" onclick="state.view=\'terrain-list\';render();">'+ICONS.clipboard+' Saisie terrain</button>';
  h += '</div>';
  
  // Liste des missions
  h += '<div class="card" style="margin-top:20px;">';
  h += '<h2>Missions ('+state.missions.length+')</h2>';
  
  if(state.missions.length === 0){
    h += '<div class="empty-state">';
    h += '<div class="empty-state-icon">'+ICONS.empty+'</div>';
    h += '<p>Aucune mission créée</p>';
    h += '</div>';
  }else{
    state.missions.forEach(function(m){
      var statusClass = 'mission-card-'+m.status;
      h += '<div class="mission-card '+statusClass+'" style="margin:8px 0;padding:12px;border-radius:8px;cursor:pointer;" onclick="goToMission('+m.id+');">';
      h += '<div class="mission-title">'+escapeHtml(m.clientSite||'Sans nom')+'</div>';
      h += '<div style="font-size:12px;color:#64748b;">'+m.gehs.length+' GEH • '+m.prelevements.length+' prél.</div>';
      h += '</div>';
    });
  }
  
  h += '</div>';
  
  h += '<div class="card" style="margin-top:20px;text-align:center;color:#94a3b8;font-size:12px;">';
  h += '<p>© 2025 Quentin THOMAS</p>';
  h += '</div>';
  
  h += '</div>';
  return h;
}

function goToMission(missionId){
  state.currentMissionId = missionId;
  state.view = 'terrain';
  render();
}

// ===== UTILITAIRES DB =====
function getAgentFromDB(name){
  if(!state.agentsDB)return null;
  return state.agentsDB.find(function(a){
    return a['Agent chimique'] && a['Agent chimique'].toLowerCase().indexOf(name.toLowerCase()) !== -1;
  });
}

function searchAgentsDB(query){
  if(!query || query.length < 2)return [];
  if(!state.agentsDB)return [];
  
  var q = query.toLowerCase();
  return state.agentsDB
    .filter(function(a){
      return a['Agent chimique'] && a['Agent chimique'].toLowerCase().indexOf(q) !== -1;
    })
    .map(function(a){return a['Agent chimique'];})
    .slice(0, 10);
}

function getCurrentMission(){
  if(!state.currentMissionId)return null;
  return state.missions.find(function(m){return m.id === state.currentMissionId;});
}

function goToTerrain(missionId){
  state.currentMissionId = missionId;
  state.view = 'terrain';
  render();
}

// ===== EXPORTS JSON =====
function exportMissionJSON(missionId){
  var mission = state.missions.find(function(m){return m.id === missionId;});
  if(!mission)return;
  
  var dataStr = JSON.stringify(mission, null, 2);
  var dataBlob = new Blob([dataStr], {type: 'application/json'});
  var url = URL.createObjectURL(dataBlob);
  var link = document.createElement('a');
  link.href = url;
  link.download = 'mission-'+(mission.clientSite||'export')+'-'+Date.now()+'.json';
  link.click();
  URL.revokeObjectURL(url);
}

console.log('✓ App chargé');
