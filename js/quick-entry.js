// quick-entry.js - Saisie rapide
// © 2025 Quentin THOMAS
// Création mission minimaliste sans préparation

// ===== SAISIE RAPIDE =====
function openQuickEntry(){
  state.quickMission={
    clientSite:'',
    preleveur:'',
    debitmetre:'',
    gehs:[{id:generateId(),num:1,name:''}],
    agents:[],
    prelevements:[]
  };
  state.quickAgentSearch='';
  state.view='quick-entry';
  render();
}

function renderQuickEntry(){
  var q=state.quickMission;
  var h='<button class="back-btn" onclick="state.view=\'terrain-list\';render();">'+ICONS.arrowLeft+' Retour</button>';
  h+='<div class="card"><h1>'+ICONS.zap+' Saisie rapide</h1><p class="subtitle">Créez une mission directement sur le terrain</p></div>';
  
  // Infos générales
  h+='<div class="card"><h2>'+ICONS.list+' Informations</h2>';
  h+='<div class="field"><label class="label">Client / Site *</label><input type="text" class="input" id="quick-client" value="'+escapeHtml(q.clientSite)+'" placeholder="Ex: Entreprise ABC" onchange="state.quickMission.clientSite=this.value;"></div>';
  h+='<div class="field"><label class="label">Préleveur</label><input type="text" class="input" id="quick-preleveur" value="'+escapeHtml(q.preleveur)+'" placeholder="Votre nom" onchange="state.quickMission.preleveur=this.value;"></div>';
  h+='<div class="field"><label class="label">Débitmètre</label><input type="text" class="input" id="quick-debitmetre" value="'+escapeHtml(q.debitmetre)+'" placeholder="N° débitmètre" onchange="state.quickMission.debitmetre=this.value;"></div>';
  h+='</div>';
  
  // GEH
  h+='<div class="card"><h2>'+ICONS.folder+' GEH</h2>';
  q.gehs.forEach(function(g,i){
    h+='<div class="geh-item"><div class="geh-num">'+(i+1)+'</div><input type="text" class="geh-input" value="'+escapeHtml(g.name)+'" placeholder="Nom du GEH..." onchange="updateQuickGeh('+i+',this.value);">';
    if(q.gehs.length>1)h+='<button class="agent-delete" onclick="removeQuickGeh('+i+');">'+ICONS.trash+'</button>';
    h+='</div>';
  });
  h+='<button class="btn btn-gray btn-small" onclick="addQuickGeh();">+ Ajouter GEH</button>';
  h+='</div>';
  
  // Agents
  h+='<div class="card"><h2>'+ICONS.beaker+' Agents chimiques</h2>';
  h+='<div class="search-box"><span class="search-icon">'+ICONS.search+'</span><input type="text" class="search-input" id="quick-agent-search" placeholder="Rechercher un agent..." value="'+escapeHtml(state.quickAgentSearch)+'" oninput="handleQuickAgentSearch(this.value);"></div>';
  h+='<div id="quick-search-results">';
  if(state.quickAgentSearch&&state.quickAgentSearch.length>=2){
    var results=searchAgentsDB(state.quickAgentSearch);
    var filtered=results.filter(function(x){return!q.agents.some(function(a){return a.name===x;});});
    if(filtered.length>0){
      state._quickSearchResults=filtered.slice(0,8);
      h+='<div class="search-results">';
      state._quickSearchResults.forEach(function(x,idx){
        h+='<div class="search-result-item" data-quick-agent-idx="'+idx+'" onmousedown="event.preventDefault();">'+escapeHtml(x)+'</div>';
      });
      h+='</div>';
    }else{state._quickSearchResults=[];}
  }else{state._quickSearchResults=[];}
  h+='</div>';
  h+='<button class="btn btn-gray btn-small mt-8" onclick="state.showModal=\'quickAddManual\';render();">+ Agent manuel</button>';
  
  if(q.agents.length>0){
    h+='<div class="section-title" style="color:#374151;margin-top:16px;">Agents sélectionnés ('+q.agents.length+')</div>';
    q.agents.forEach(function(a,i){
      h+='<div class="agent-item"><div class="agent-color" style="background:'+AGENT_COLORS[i%AGENT_COLORS.length]+';"></div><div class="agent-name">'+escapeHtml(a.name)+'</div>';
      h+='<div class="agent-badges"><span class="agent-badge agent-badge-8h '+(a.is8h?'active':'')+'" onclick="toggleQuickAgent8h('+i+');">8h</span><span class="agent-badge agent-badge-ct '+(a.isCT?'active':'')+'" onclick="toggleQuickAgentCT('+i+');">CT</span></div>';
      h+='<button class="agent-delete" onclick="removeQuickAgent('+i+');">'+ICONS.trash+'</button></div>';
    });
  }
  h+='</div>';
  
  // Prélèvements configurés
  if(q.agents.length>0&&q.gehs.some(function(g){return g.name;})){
    h+='<div class="card"><h2>'+ICONS.link+' Prélèvements à créer</h2>';
    h+='<p class="subtitle mb-12">Sélectionnez les combinaisons agent/GEH</p>';
    
    var validGehs=q.gehs.filter(function(g){return g.name;});
    q.agents.forEach(function(ag,ai){
      h+='<div class="affect-card" style="border-left:4px solid '+AGENT_COLORS[ai%AGENT_COLORS.length]+';"><div class="affect-header"><div class="affect-agent">'+escapeHtml(ag.name)+'</div><button class="affect-reg-toggle '+(ag.isReg?'':'nonreg')+'" onclick="toggleQuickAgentReg('+ai+');">'+(ag.isReg!==false?'Réglementaire':'Non-régl.')+'</button></div>';
      validGehs.forEach(function(g,gi){
        if(!ag.gehs)ag.gehs={};
        if(!ag.gehs[g.id])ag.gehs[g.id]={has8h:false,hasCT:false};
        var gaf=ag.gehs[g.id];
        h+='<div class="affect-geh-row"><div class="affect-geh-name">'+(gi+1)+'. '+escapeHtml(g.name)+'</div><div class="affect-geh-badges">';
        if(ag.is8h)h+='<span class="affect-mini-badge '+(gaf.has8h?'active-8h':'')+'" onclick="toggleQuickGehAffect('+ai+',\''+g.id+'\',\'8h\');">8h</span>';
        if(ag.isCT)h+='<span class="affect-mini-badge '+(gaf.hasCT?'active-ct':'')+'" onclick="toggleQuickGehAffect('+ai+',\''+g.id+'\',\'CT\');">CT</span>';
        h+='</div></div>';
      });
      h+='</div>';
    });
    h+='</div>';
  }
  
  // Bouton créer
  var canCreate=q.clientSite&&q.agents.length>0&&q.gehs.some(function(g){return g.name;})&&countQuickPrelevements()>0;
  var prelCount=countQuickPrelevements();
  if(canCreate){
    h+='<button class="btn btn-primary" onclick="createQuickMission();">'+ICONS.play+' Créer la mission ('+prelCount+' prél.)</button>';
  }else{
    h+='<div class="info-box info-box-warning"><p>Pour créer la mission :</p>';
    if(!q.clientSite)h+='<p>? Renseignez le client/site</p>';
    if(!q.gehs.some(function(g){return g.name;}))h+='<p>? Ajoutez au moins un GEH</p>';
    if(q.agents.length===0)h+='<p>? Sélectionnez au moins un agent</p>';
    if(q.agents.length>0&&prelCount===0)h+='<p>? Affectez les agents aux GEH</p>';
    h+='</div>';
  }
  
  // Modal ajout manuel
  if(state.showModal==='quickAddManual'){
    h+='<div class="modal show" onclick="if(event.target===this){state.showModal=null;render();}"><div class="modal-content"><div class="modal-header"><h2>Ajouter agent</h2><button class="close-btn" onclick="state.showModal=null;render();">?</button></div><div class="field"><label class="label">Nom de l\'agent</label><input type="text" class="input" id="quick-manual-name" placeholder="Ex: Benzène"></div><div class="row"><button class="btn btn-gray" onclick="state.showModal=null;render();">Annuler</button><button class="btn btn-primary" onclick="addQuickManualAgent();">Ajouter</button></div></div></div>';
  }
  
  return h;
}

function handleQuickAgentSearch(value){
  state.quickAgentSearch=value;
  var container=document.getElementById('quick-search-results');
  if(!container)return;
  var q=state.quickMission;
  var h='';
  if(value&&value.length>=2){
    var results=searchAgentsDB(value);
    var filtered=results.filter(function(x){return!q.agents.some(function(a){return a.name===x;});});
    if(filtered.length>0){
      state._quickSearchResults=filtered.slice(0,8);
      h+='<div class="search-results">';
      state._quickSearchResults.forEach(function(x,idx){
        h+='<div class="search-result-item" data-quick-agent-idx="'+idx+'" onmousedown="event.preventDefault();">'+escapeHtml(x)+'</div>';
      });
      h+='</div>';
    }else{state._quickSearchResults=[];}
  }else{state._quickSearchResults=[];}
  container.innerHTML=h;
  attachQuickSearchListeners(container);
}

function attachQuickSearchListeners(container){
  var items=container.querySelectorAll('[data-quick-agent-idx]');
  items.forEach(function(el){
    el.addEventListener('click',function(){
      var idx=parseInt(el.getAttribute('data-quick-agent-idx'),10);
      if(state._quickSearchResults&&state._quickSearchResults[idx]!==undefined){
        addQuickAgent(state._quickSearchResults[idx]);
      }
    });
  });
}

function addQuickGeh(){
  var q=state.quickMission;
  q.gehs.push({id:generateId(),num:q.gehs.length+1,name:''});
  render();
}

function updateQuickGeh(i,v){
  state.quickMission.gehs[i].name=v.trim();
}

function removeQuickGeh(i){
  state.quickMission.gehs.splice(i,1);
  state.quickMission.gehs.forEach(function(g,idx){g.num=idx+1;});
  render();
}

function addQuickAgent(name){
  var q=state.quickMission;
  if(q.agents.some(function(a){return a.name===name;}))return;
  q.agents.push({name:name,is8h:hasVLEP8h(name),isCT:hasVLEPCT(name),isReg:true,gehs:{}});
  state.quickAgentSearch='';
  render();
}

function addQuickManualAgent(){
  var input=document.getElementById('quick-manual-name');
  var name=input?input.value.trim():'';
  if(!name){alert('Saisissez un nom');return;}
  var q=state.quickMission;
  if(q.agents.some(function(a){return a.name===name;})){alert('Agent déjà ajouté');return;}
  q.agents.push({name:name,is8h:true,isCT:true,isReg:true,isManual:true,gehs:{}});
  state.showModal=null;
  render();
}

function removeQuickAgent(i){
  state.quickMission.agents.splice(i,1);
  render();
}

function toggleQuickAgent8h(i){
  var a=state.quickMission.agents[i];
  if(!hasVLEP8h(a.name)&&!a.isManual)return;
  a.is8h=!a.is8h;
  if(!a.is8h&&!a.isCT)a.isCT=true;
  render();
}

function toggleQuickAgentCT(i){
  var a=state.quickMission.agents[i];
  if(!hasVLEPCT(a.name)&&!a.isManual)return;
  a.isCT=!a.isCT;
  if(!a.is8h&&!a.isCT)a.is8h=true;
  render();
}

function toggleQuickAgentReg(i){
  var a=state.quickMission.agents[i];
  a.isReg=!a.isReg;
  render();
}

function toggleQuickGehAffect(ai,gid,type){
  var a=state.quickMission.agents[ai];
  if(!a.gehs)a.gehs={};
  if(!a.gehs[gid])a.gehs[gid]={has8h:false,hasCT:false};
  if(type==='8h')a.gehs[gid].has8h=!a.gehs[gid].has8h;
  else a.gehs[gid].hasCT=!a.gehs[gid].hasCT;
  render();
}

function countQuickPrelevements(){
  var q=state.quickMission;
  var count=0;
  q.agents.forEach(function(a){
    if(!a.gehs)return;
    for(var gid in a.gehs){
      var g=a.gehs[gid];
      if(g.has8h)count+=(a.isReg!==false?3:1);
      if(g.hasCT)count+=1;
    }
  });
  return count;
}

function createQuickMission(){
  var q=state.quickMission;
  
  // Créer la mission
  var m=createEmptyMission();
  m.clientSite=q.clientSite;
  m.preleveur=q.preleveur;
  m.debitmetre=q.debitmetre;
  m.gehs=q.gehs.filter(function(g){return g.name;}).map(function(g,i){
    return{id:g.id,num:i+1,name:g.name};
  });
  m.agents=q.agents.map(function(a){
    return{name:a.name,is8h:a.is8h,isCT:a.isCT,isManual:a.isManual||false};
  });
  
  // Affectations
  q.agents.forEach(function(a){
    m.affectations[a.name]={isReg:a.isReg!==false,gehs:{}};
    if(a.gehs){
      for(var gid in a.gehs){
        m.affectations[a.name].gehs[gid]=a.gehs[gid];
      }
    }
    m.agentColors[a.name]=AGENT_COLORS[q.agents.indexOf(a)%AGENT_COLORS.length];
  });
  
  // Générer prélèvements
  generatePrelevements(m);
  m.status='encours';
  
  state.missions.push(m);
  saveData('vlep_missions_v3',state.missions);
  
  state.currentMissionId=m.id;
  state.view='terrain-mission';
  state.expandedGeh={};
  m.gehs.forEach(function(g){state.expandedGeh[g.id]=true;});
  
  render();
  alert(''+ICONS.check+' Mission créée avec '+m.prelevements.length+' prélèvement(s) !');
}


console.log('?? Quick entry chargé');
