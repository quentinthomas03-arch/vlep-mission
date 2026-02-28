// state.js - Ãƒâ€°tat global de l'application
// Ã‚Â© 2025 Quentin THOMAS

// Couleurs pour les agents chimiques
var AGENT_COLORS=['#00a878','#0f4c81','#e63946','#7c3aed','#f59e0b','#0891b2','#c026d3','#65a30d','#0284c7','#db2777','#4f46e5','#059669','#d97706','#7c2d12','#1d4ed8'];

// Nombre de GEH par dÃƒÂ©faut lors de crÃƒÂ©ation mission
var DEFAULT_GEH_COUNT=5;

// Ãƒâ€°tat global de l'application
var state={
  _author:'Quentin THOMAS',
  _copyright:'Ã‚Â© 2025 Quentin THOMAS',
  
  // Navigation
  view:'home',
  showModal:null,
  
  // DonnÃƒÂ©es
  missions:[],
  agentsDB:[],
  
  // Mission courante
  currentMissionId:null,
  currentPrelId:null,
  activeSubIndex:0,
  
  // UI
  searchText:'',
  expandedGeh:{},
  
  // Modes
  fusionMode:false,
  selectedForFusion:[],
  coPrelMode:false,
  selectedForCoPrel:[],
  coPrelGroups:null,
  
  // Saisie rapide
  quickPrelType:'8h',
  quickPrelReg:true,
  quickAgentSearch:'',
  quickGehId:null,
  quickMission:null,
  
  // Ãƒâ€°chantillons
  echantillonSort:'date',
  
  // Blancs
  blancAgentSearch:'',
  blancAgents:[],
  
  // PrÃƒÂ©paration
  newPrelData:null,
  
  // Co-prÃ©lÃ¨vement
  coPrelTargetPid:null,
  coPrelDetectedGroups:null,
  coPrelEditGroups:null,
  
  // Timers
  timers:{}
};

// === UTILITAIRES ESSENTIELS ===

function escapeHtml(t){
  if(!t)return'';
  return String(t)
    .replace(/&/g,'&amp;')
    .replace(/</g,'&lt;')
    .replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;')
    .replace(/'/g,'&#39;');
}

function escapeJs(t){
  if(!t)return'';
  var s=String(t);
  s=s.split(String.fromCharCode(92)).join(String.fromCharCode(92,92));
  s=s.split(String.fromCharCode(39)).join(String.fromCharCode(92,39));
  s=s.replace(/"/g,'&quot;');
  s=s.replace(/\r/g,'\\r');
  s=s.replace(/\n/g,'\\n');
  return s;
}

function generateId(){
  return Date.now()*1000+Math.floor(Math.random()*1000);
}

function saveData(k,d){
  try{
    localStorage.setItem(k,JSON.stringify(d));
  }catch(e){}
}

function lightenColor(h,p){
  var n=parseInt(h.replace('#',''),16);
  var r=Math.min(255,Math.floor((n>>16)+(255-(n>>16))*p));
  var g=Math.min(255,Math.floor(((n>>8)&0xFF)+(255-((n>>8)&0xFF))*p));
  var b=Math.min(255,Math.floor((n&0xFF)+(255-(n&0xFF))*p));
  return'#'+(0x1000000+r*0x10000+g*0x100+b).toString(16).slice(1);
}

// === CHARGEMENT DONNÃƒâ€°ES ===

function loadData(){
  try{
    var m=localStorage.getItem('vlep_missions_v3');
    var d=localStorage.getItem('vlep_database');
    if(m)state.missions=JSON.parse(m);
    if(d)state.agentsDB=JSON.parse(d);
    else state.agentsDB=JSON.parse(JSON.stringify(BUILTIN_DB));
    repairMissions();
  }catch(e){}
}

function repairMissions(){
  state.missions.forEach(function(m){
    if(m.prelevements){
      m.prelevements.forEach(function(p){
        if(!p.agents)p.agents=[];
      });
    }
    // Migration : dÃƒÂ©placer isReg vers isReg8h et isRegCT
    if(m.affectations){
      for(var an in m.affectations){
        var af=m.affectations[an];
        if(af.gehs){
          for(var gid in af.gehs){
            var gaf=af.gehs[gid];
            var oldIsReg=(gaf.isReg!==undefined)?gaf.isReg:((af.isReg!==undefined)?af.isReg:true);
            if(gaf.isReg8h===undefined){
              gaf.isReg8h=oldIsReg;
            }
            if(gaf.isRegCT===undefined){
              gaf.isRegCT=oldIsReg;
            }
          }
        }
      }
    }
  });
}

// === ACCESSEURS ===

function getCurrentMission(){
  for(var i=0;i<state.missions.length;i++){
    if(state.missions[i].id===state.currentMissionId)return state.missions[i];
  }
  return null;
}

function getAgentColor(m,n){
  if(!m.agentColors)m.agentColors={};
  if(!m.agentColors[n]){
    var u=Object.values(m.agentColors);
    for(var i=0;i<AGENT_COLORS.length;i++){
      if(u.indexOf(AGENT_COLORS[i])===-1){
        m.agentColors[n]=AGENT_COLORS[i];
        break;
      }
    }
    if(!m.agentColors[n])m.agentColors[n]=AGENT_COLORS[Object.keys(m.agentColors).length%AGENT_COLORS.length];
  }
  return m.agentColors[n];
}

// === UTILITAIRES DB ===

function getAgentFromDB(n){
  for(var i=0;i<state.agentsDB.length;i++){
    if(state.agentsDB[i]['Agent chimique']===n)return state.agentsDB[i];
  }
  return null;
}

function getCodeAnalytique(agent){
  if(!agent)return'';
  return agent['code_analyse']||agent['Code analytique']||agent['Code analyse']||'';
}

function hasVLEP8h(n){
  var a=getAgentFromDB(n);
  if(!a || !a['VLEP 8h (mg/m3)']) return false;
  var v=String(a['VLEP 8h (mg/m3)']).trim();
  return v!=='' && v!=='-';
}

function hasVLEPCT(n){
  var a=getAgentFromDB(n);
  if(!a || !a['VLEP CT (mg/m3)']) return false;
  var v=String(a['VLEP CT (mg/m3)']).trim();
  return v!=='' && v!=='-';
}

// === CRÃƒâ€°ATION MISSION ===

function createEmptyMission(){
  var g=[];
  for(var i=0;i<DEFAULT_GEH_COUNT;i++)g.push({id:generateId(),num:i+1,name:''});
  return{
    id:generateId(),
    status:'prepa',
    createdAt:new Date().toISOString(),
    clientSite:'',
    preleveur:'',
    debitmetre:'',
    gehs:g,
    agents:[],
    affectations:{},
    prelevements:[],
    conditionsAmbiantes:[],
    agentColors:{}
  };
}

console.log('Ã¢Å“â€œ State chargÃƒÂ©');
