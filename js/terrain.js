// terrain.js - Saisie terrain
// © 2025 Quentin THOMAS
// Liste missions, prélèvements, fusion, défusion, timers

function renderTerrainList(){
  var h='<button class="back-btn" onclick="state.view=\'home\';render();">'+ICONS.arrowLeft+' Accueil</button><div class="card"><h1>'+ICONS.clipboard+' Saisie terrain</h1><p class="subtitle">Missions prêtes pour le terrain</p></div>';
  h+='<button class="btn btn-success mb-12" onclick="openQuickEntry();">'+ICONS.zap+' Saisie rapide (sans prépa)</button>';
  var ml=state.missions.filter(function(m){return m.status==='validee'||m.status==='encours'||m.status==='terminee';});
  if(ml.length===0)h+='<div class="empty-state"><div class="empty-state-icon">'+ICONS.list+'</div><p>Aucune mission validée</p><p style="font-size:13px;margin-top:8px;">Validez d\'abord une mission dans Préparation</p></div>';
  else ml.forEach(function(m){
    var t=0,d=0;
    m.prelevements.forEach(function(p){p.subPrelevements.forEach(function(s){t++;if(s.completed)d++;});});
    var pct=t>0?Math.round(d/t*100):0;
    h+='<div class="mission-card mission-card-'+m.status+'" onclick="goToTerrain('+m.id+');"><div class="mission-title">'+escapeHtml(m.clientSite||'Sans nom')+'<span class="status-badge status-'+m.status+'">'+(m.status==='validee'?'Prête':(m.status==='encours'?'En cours':'Terminée'))+'</span></div><div class="progress-bar"><div class="progress-fill" style="width:'+pct+'%;"></div></div><div class="progress-text">'+d+'/'+t+' prélèvements ('+pct+'%)</div></div>';
  });
  return h;
}

function renderTerrainMission(){
  var m=getCurrentMission();
  if(!m){state.view='terrain-list';render();return'';}
  var h='<div class="sticky-header"><button class="back-btn" onclick="state.view=\'terrain-list\';state.currentMissionId=null;render();">'+ICONS.arrowLeft+' Liste</button><div style="display:flex;justify-content:space-between;align-items:center;"><div style="color:white;font-weight:700;font-size:14px;">'+escapeHtml(m.clientSite)+'</div><div class="row" style="gap:4px;"><button class="btn btn-gray btn-small btn-icon" onclick="unvalidateMissionFromTerrain();" title="Repasser en prépa" style="background:rgba(255,255,255,0.15);color:white;border:none;">'+ICONS.arrowLeft+'</button><button class="btn btn-danger btn-icon" onclick="deleteMissionTerrain();" style="width:24px;height:24px;">'+ICONS.trash+'</button></div></div></div>';
  h+='<div class="card" style="margin-top:4px;"><p class="subtitle"><span class="svg-icon">'+ICONS.user+'</span> '+escapeHtml(m.preleveur||'-')+' • <span class="svg-icon">'+ICONS.tool+'</span> '+escapeHtml(m.debitmetre||'-')+'</p></div>';
  h+='<div class="row mb-12"><button class="btn btn-gray" onclick="state.view=\'conditions\';render();">'+ICONS.thermometer+' Conditions</button><button class="btn btn-blue" onclick="state.view=\'liste-echantillons\';render();">'+ICONS.list+' Échantillons</button></div>';
  h+='<div class="row mb-12"><button class="btn btn-gray" onclick="exportMissionJSON('+m.id+');">'+ICONS.download+' Export JSON</button></div>';
  
  // Boutons d'ajout
  h+='<div class="row mb-12"><button class="btn btn-success btn-small" onclick="state.showModal=\'addGehTerrain\';render();">+ GEH</button><button class="btn btn-primary btn-small" onclick="state.showModal=\'addPrelTerrain\';render();">+ Prélèvement</button><button class="btn btn-gray btn-small" onclick="editMissionFromTerrain();">'+ICONS.edit+' Modifier</button></div>';
  
  if(state.fusionMode){
    h+='<div class="info-box info-box-warning mb-12"><p><strong>Mode fusion manuelle actif</strong></p><p>Sélectionnez les prélèvements à fusionner (même GEH, même type)</p></div><div class="row mb-12"><button class="btn btn-gray" onclick="cancelFusion();">Annuler</button><button class="btn btn-success" onclick="doFusion();" '+(state.selectedForFusion.length<2?'disabled':'')+'>Fusionner ('+state.selectedForFusion.length+')</button></div>';
  }else{
    h+='<div class="row mb-12"><button class="btn btn-success" onclick="showSmartFusionModal();">'+ICONS.zap+' Fusionner intelligemment</button><button class="btn btn-orange" onclick="startFusionMode();">'+ICONS.merge+' Fusion manuelle</button></div>';
  }
  var byGeh={};
  m.prelevements.forEach(function(p){var k=p.gehId;if(!byGeh[k])byGeh[k]=[];byGeh[k].push(p);});
  m.gehs.filter(function(g){return g.name;}).forEach(function(g){
    var ps=byGeh[g.id]||[];
    var dc=0,tc=0;
    ps.forEach(function(p){p.subPrelevements.forEach(function(s){tc++;if(s.completed)dc++;});});
    var isOpen=state.expandedGeh[g.id];
    h+='<div class="accordion"><div class="accordion-header '+(isOpen?'open':'')+'" onclick="toggleGehAccordion('+g.id+');"><span class="accordion-icon">'+ICONS.chevronRight+'</span><span class="accordion-title">'+g.num+'. '+escapeHtml(g.name)+'</span><span class="accordion-count">'+dc+'/'+tc+'</span><button class="btn btn-danger btn-icon" style="width:24px;height:24px;margin-left:6px;font-size:11px;" onclick="event.stopPropagation();deleteGehTerrain('+g.id+');">'+ICONS.trash+'</button></div><div class="accordion-body '+(isOpen?'open':'')+'">';
    if(ps.length===0){
      h+='<div class="empty-state" style="padding:16px;color:#6b7280;"><p>Aucun prélèvement</p></div>';
    }else{
      ps.forEach(function(p){
        var anyDone=p.subPrelevements.some(function(s){return s.completed;});
        var allDone=p.subPrelevements.every(function(s){return s.completed;});
        var mc=p.agents&&p.agents[0]?p.agents[0].color:'#3b82f6';
        var isSelected=state.selectedForFusion.indexOf(p.id)!==-1;
        var agentNames=p.agents&&p.agents.length>0?p.agents.map(function(a){return escapeHtml(a.name);}).join(' + '):'Agent inconnu';
        h+='<div class="prel-item '+(isSelected?'selected':'')+'" style="background:'+lightenColor(mc,0.85)+';">';
        if(state.fusionMode){
          h+='<div class="prel-checkbox '+(isSelected?'checked':'')+'" onclick="toggleFusionSelect('+p.id+');">✓</div>';
        }else{
          h+='<div class="prel-status '+(allDone?'done':'pending')+'" onclick="openPrel('+p.id+');">✓</div>';
        }
        h+='<div class="prel-content" onclick="'+(state.fusionMode?'toggleFusionSelect('+p.id+');':'openPrel('+p.id+');')+'"><div class="prel-title" style="color:'+mc+';">'+agentNames+'</div><div class="prel-subtitle">'+p.type+' • '+p.subPrelevements.length+' sous-prél. '+(p.isReglementaire?'<span class="prel-reg-badge">Régl.</span>':'<span class="prel-nonreg-badge">Non-régl.</span>')+'</div></div>';
        if(!state.fusionMode){
          if(p.agents&&p.agents.length>1)h+='<button class="btn btn-gray btn-icon" style="width:24px;height:24px;font-size:11px;margin-right:2px;" onclick="event.stopPropagation();defusionPrel('+p.id+');" title="Défusionner">'+ICONS.merge+'</button>';
          h+='<button class="btn btn-danger btn-icon" style="width:24px;height:24px;font-size:11px;margin-right:2px;" onclick="event.stopPropagation();deletePrelTerrain('+p.id+');">'+ICONS.trash+'</button>';
        }
        h+='<div class="prel-arrow" onclick="'+(state.fusionMode?'toggleFusionSelect('+p.id+');':'openPrel('+p.id+');')+'">'+ICONS.arrowRight+'</div></div>';
      });
    }
    h+='</div></div>';
  });
  
  // Modals
  if(state.showModal==='addGehTerrain')h+=renderAddGehTerrainModal();
  if(state.showModal==='addPrelTerrain')h+=renderAddPrelTerrainModal();
  if(state.showModal==='smartFusion')h+=renderSmartFusionModal();
  
  return h;
}

function toggleGehAccordion(gid){state.expandedGeh[gid]=!state.expandedGeh[gid];render();}

function deleteMissionTerrain(){
  var m=getCurrentMission();if(!m)return;
  if(!confirm('Supprimer la mission "'+m.clientSite+'" ?\n\nToutes les données seront perdues !'))return;
  state.missions=state.missions.filter(function(x){return x.id!==m.id;});
  saveData('vlep_missions_v3',state.missions);
  state.currentMissionId=null;
  state.view='terrain-list';
  render();
}

// ===== AJOUT/SUPPRESSION TERRAIN =====
function renderAddGehTerrainModal(){
  var h='<div class="modal show" onclick="if(event.target===this){state.showModal=null;render();}"><div class="modal-content"><div class="modal-header"><h2>+ Ajouter un GEH</h2><button class="close-btn" onclick="state.showModal=null;render();">×</button></div>';
  h+='<div class="field"><label class="label">Nom du GEH *</label><input type="text" class="input" id="new-geh-name" placeholder="Ex: Atelier peinture"></div>';
  h+='<div class="row"><button class="btn btn-gray" onclick="state.showModal=null;render();">Annuler</button><button class="btn btn-primary" onclick="addGehTerrain();">Ajouter</button></div></div></div>';
  return h;
}

function addGehTerrain(){
  var input=document.getElementById('new-geh-name');
  var name=input?input.value.trim():'';
  if(!name){alert('Saisissez un nom de GEH');return;}
  var m=getCurrentMission();if(!m)return;
  var newNum=m.gehs.length+1;
  var newGeh={id:generateId(),num:newNum,name:name};
  m.gehs.push(newGeh);
  state.expandedGeh[newGeh.id]=true;
  saveData('vlep_missions_v3',state.missions);
  state.showModal=null;
  render();
}

function deleteGehTerrain(gehId){
  var m=getCurrentMission();if(!m)return;
  var geh=m.gehs.find(function(g){return g.id===gehId;});
  var prelCount=m.prelevements.filter(function(p){return p.gehId===gehId;}).length;
  var msg='Supprimer le GEH "'+geh.name+'" ?';
  if(prelCount>0)msg+='\n\n'+prelCount+' prélèvement(s) seront également supprimés !';
  if(!confirm(msg))return;
  // Supprimer les prélèvements associés
  m.prelevements=m.prelevements.filter(function(p){return p.gehId!==gehId;});
  // Supprimer le GEH
  m.gehs=m.gehs.filter(function(g){return g.id!==gehId;});
  // Renuméroter
  m.gehs.forEach(function(g,i){g.num=i+1;});
  saveData('vlep_missions_v3',state.missions);
  render();
}

function deletePrelTerrain(prelId){
  var m=getCurrentMission();if(!m)return;
  var prel=m.prelevements.find(function(p){return p.id===prelId;});
  if(!prel)return;
  var agentNames=prel.agents.map(function(a){return a.name;}).join(' + ');
  if(!confirm('Supprimer le prélèvement "'+agentNames+'" ('+prel.type+') ?'))return;
  m.prelevements=m.prelevements.filter(function(p){return p.id!==prelId;});
  updateMissionStatus(m);
  saveData('vlep_missions_v3',state.missions);
  render();
}

function renderAddPrelTerrainModal(){
  var m=getCurrentMission();
  var h='<div class="modal show" onclick="if(event.target===this){state.showModal=null;state.newPrelData=null;render();}"><div class="modal-content" style="max-height:90vh;"><div class="modal-header"><h2>+ Ajouter un prélèvement</h2><button class="close-btn" onclick="state.showModal=null;state.newPrelData=null;render();">×</button></div>';
  
  if(!state.newPrelData){
    state.newPrelData={gehId:null,agents:[],type:'8h',isReg:true,agentSearch:''};
  }
  var d=state.newPrelData;
  
  // Sélection GEH
  h+='<div class="field"><label class="label">GEH *</label><select class="input" onchange="state.newPrelData.gehId=this.value;render();">';
  h+='<option value="">-- Sélectionner --</option>';
  m.gehs.filter(function(g){return g.name;}).forEach(function(g){
    h+='<option value="'+g.id+'" '+(d.gehId==g.id?'selected':'')+'>'+g.num+'. '+escapeHtml(g.name)+'</option>';
  });
  h+='</select></div>';
  
  // Type
  h+='<div class="field"><label class="label">Type de VLEP *</label><div class="row">';
  h+='<button class="btn btn-small '+(d.type==='8h'?'btn-primary':'btn-gray')+'" onclick="state.newPrelData.type=\'8h\';render();">8h</button>';
  h+='<button class="btn btn-small '+(d.type==='CT'?'btn-primary':'btn-gray')+'" onclick="state.newPrelData.type=\'CT\';render();">CT</button>';
  h+='</div></div>';
  
  // Réglementaire
  h+='<div class="field"><label class="label">Statut</label><div class="row">';
  h+='<button class="btn btn-small '+(d.isReg?'btn-success':'btn-gray')+'" onclick="state.newPrelData.isReg=true;render();">Réglementaire</button>';
  h+='<button class="btn btn-small '+(!d.isReg?'btn-orange':'btn-gray')+'" onclick="state.newPrelData.isReg=false;render();">Non-réglementaire</button>';
  h+='</div></div>';
  
  // Agents
  h+='<div class="field"><label class="label">Agent(s) chimique(s) *</label>';
  h+='<input type="text" class="input" id="new-prel-agent-search" placeholder="Rechercher..." value="'+escapeHtml(d.agentSearch||'')+'" oninput="handleNewPrelAgentSearch(this.value);"></div>';
  h+='<div id="new-prel-search-results">';
  if(d.agentSearch&&d.agentSearch.length>=2){
    var results=searchAgentsDB(d.agentSearch);
    var filtered=results.filter(function(x){return!d.agents.some(function(a){return a.name===x;});});
    if(filtered.length>0){
      h+='<div class="search-results" style="max-height:120px;overflow-y:auto;">';
      filtered.slice(0,6).forEach(function(x){
        h+='<div class="search-result-item" onmousedown="event.preventDefault();" onclick="addNewPrelAgent(\''+escapeJs(x)+'\');">'+escapeHtml(x)+'</div>';
      });
      h+='</div>';
    }
  }
  h+='</div>';
  
  if(d.agents.length>0){
    h+='<div class="info-box mt-8"><strong>Agents sélectionnés :</strong><div style="margin-top:4px;">';
    d.agents.forEach(function(a,i){
      h+='<span style="display:inline-block;background:#e5e7eb;padding:2px 8px;border-radius:4px;margin:2px;font-size:12px;">'+escapeHtml(a.name)+' <span style="cursor:pointer;color:#ef4444;" onclick="removeNewPrelAgent('+i+');">×</span></span>';
    });
    h+='</div></div>';
  }
  
  // Nombre de sous-prélèvements
  var subCount=d.isReg&&d.type==='8h'?3:1;
  h+='<div class="info-box info-box-success mt-12"><p>'+subCount+' sous-prélèvement(s) seront créés</p></div>';
  
  var canAdd=d.gehId&&d.agents.length>0;
  h+='<div class="row mt-12"><button class="btn btn-gray" onclick="state.showModal=null;state.newPrelData=null;render();">Annuler</button><button class="btn btn-primary" '+(canAdd?'':'disabled')+' onclick="addPrelTerrain();">Ajouter</button></div></div></div>';
  return h;
}

function renderSmartFusionModal(){
  if(!state.fusionGroups||state.fusionGroups.length===0)return'';
  
  var h='<div class="modal show" onclick="if(event.target===this){state.showModal=null;state.fusionGroups=null;render();}"><div class="modal-content" style="max-height:90vh;overflow-y:auto;"><div class="modal-header"><h2>'+ICONS.zap+' Fusion intelligente</h2><button class="close-btn" onclick="state.showModal=null;state.fusionGroups=null;render();">×</button></div>';
  
  var selectedCount=state.fusionGroups.filter(function(g){return g.selected;}).length;
  
  h+='<div class="info-box mb-12"><p><strong>'+state.fusionGroups.length+' groupe(s) fusionnable(s) détecté(s)</strong></p><p style="font-size:11px;margin-top:4px;">Décochez les groupes que vous ne souhaitez pas fusionner</p></div>';
  
  // Boutons rapides
  h+='<div class="row mb-12"><button class="btn btn-gray btn-small" onclick="toggleAllGroups(true);">Tout sélectionner</button><button class="btn btn-gray btn-small" onclick="toggleAllGroups(false);">Tout désélectionner</button></div>';
  
  // Liste des groupes
  state.fusionGroups.forEach(function(group){
    var hasWarnings=group.warnings.length>0;
    h+='<div class="card" style="padding:10px;margin-bottom:8px;border-left:4px solid '+(hasWarnings?'var(--warning)':'var(--accent)')+';">';
    h+='<div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">';
    h+='<input type="checkbox" '+(group.selected?'checked':'')+' onchange="toggleGroupSelection(\''+group.id+'\');" style="width:18px;height:18px;cursor:pointer;">';
    h+='<div style="flex:1;"><div style="font-weight:700;font-size:13px;color:var(--text-dark);">'+group.gehNum+'. '+escapeHtml(group.gehName)+'</div>';
    h+='<div style="font-size:11px;color:var(--text-muted);margin-top:2px;">'+group.type+' • '+(group.isReglementaire?'Réglementaire':'Non-régl.')+'</div></div>';
    h+='<div style="background:var(--primary-pale);color:var(--primary);padding:4px 8px;border-radius:6px;font-size:11px;font-weight:700;">'+group.prelevements.length+' prél.</div>';
    h+='</div>';
    
    // Agents
    h+='<div style="font-size:12px;color:var(--text-dark);margin-bottom:4px;"><strong>Agents:</strong> '+group.agentNames.map(escapeHtml).join(', ')+'</div>';
    
    // Avertissements
    if(hasWarnings){
      h+='<div style="background:#fef3c7;border-radius:6px;padding:6px 8px;font-size:11px;color:#b45309;"><strong>⚠ï¸ Attention:</strong> '+group.warnings.join(', ')+'</div>';
    }
    
    h+='</div>';
  });
  
  h+='<div class="row mt-12"><button class="btn btn-gray" onclick="state.showModal=null;state.fusionGroups=null;render();">Annuler</button><button class="btn btn-success" onclick="doSmartFusion();" '+(selectedCount===0?'disabled':'')+'>Fusionner ('+selectedCount+')</button></div>';
  h+='</div></div>';
  return h;
}

function handleNewPrelAgentSearch(value){
  state.newPrelData.agentSearch=value;
  var container=document.getElementById('new-prel-search-results');
  if(!container)return;
  var d=state.newPrelData;
  var h='';
  if(value&&value.length>=2){
    var results=searchAgentsDB(value);
    var filtered=results.filter(function(x){return!d.agents.some(function(a){return a.name===x;});});
    if(filtered.length>0){
      h+='<div class="search-results" style="max-height:120px;overflow-y:auto;">';
      filtered.slice(0,6).forEach(function(x){
        h+='<div class="search-result-item" onmousedown="event.preventDefault();" onclick="addNewPrelAgent(\''+escapeJs(x)+'\');">'+escapeHtml(x)+'</div>';
      });
      h+='</div>';
    }
  }
  container.innerHTML=h;
}

function addNewPrelAgent(name){
  if(!state.newPrelData)return;
  if(state.newPrelData.agents.some(function(a){return a.name===name;}))return;
  var color=AGENT_COLORS[state.newPrelData.agents.length%AGENT_COLORS.length];
  state.newPrelData.agents.push({name:name,color:color});
  state.newPrelData.agentSearch='';
  render();
}

function removeNewPrelAgent(i){
  if(!state.newPrelData)return;
  state.newPrelData.agents.splice(i,1);
  render();
}

function addPrelTerrain(){
  var m=getCurrentMission();if(!m)return;
  var d=state.newPrelData;
  if(!d||!d.gehId||d.agents.length===0)return;
  
  var geh=m.gehs.find(function(g){return String(g.id)===String(d.gehId);});
  if(!geh)return;
  
  var subCount=d.isReg&&d.type==='8h'?3:1;
  var newPrel={
    id:generateId(),
    gehId:geh.id,
    gehName:geh.name,
    gehNum:geh.num,
    agents:d.agents.slice(),
    type:d.type,
    isReglementaire:d.isReg,
    subPrelevements:[]
  };
  
  for(var i=0;i<subCount;i++){
    var sub={id:generateId(),operateur:'',date:'',plages:[{debut:'',fin:''}],observations:'',completed:false,agentData:{}};
    d.agents.forEach(function(a){
      sub.agentData[a.name]={refEchantillon:'',numPompe:'',debitInitial:'',debitFinal:''};
    });
    newPrel.subPrelevements.push(sub);
  }
  
  m.prelevements.push(newPrel);
  state.expandedGeh[geh.id]=true;
  updateMissionStatus(m);
  saveData('vlep_missions_v3',state.missions);
  state.showModal=null;
  state.newPrelData=null;
  render();
}

function startFusionMode(){
  state.fusionMode=true;
  state.selectedForFusion=[];
  var m=getCurrentMission();
  if(m)m.gehs.forEach(function(g){state.expandedGeh[g.id]=true;});
  render();
}



function returnToTerrain(){
  var m=getCurrentMission();
  if(!m)return;
  m.status=state._oldStatus||'validee';
  if(m.status==='prepa')m.status='validee';
  state._returnToTerrain=false;
  state._oldStatus=null;
  state.view='terrain-mission';
  saveData('vlep_missions_v3',state.missions);
  render();
}
function editMissionFromTerrain(){
  var m=getCurrentMission();
  if(!m)return;
  var oldStatus=m.status;
  m.status='prepa';
  state.view='prepa-mission';
  state._returnToTerrain=true;
  state._oldStatus=oldStatus;
  saveData('vlep_missions_v3',state.missions);
  render();
}
function cancelFusion(){state.fusionMode=false;state.selectedForFusion=[];render();}

function toggleFusionSelect(pid){
  var m=getCurrentMission();if(!m)return;
  var p=m.prelevements.find(function(x){return x.id===pid;});
  if(!p)return;
  var i=state.selectedForFusion.indexOf(pid);
  if(i===-1){
    if(state.selectedForFusion.length>0){
      var fp=m.prelevements.find(function(x){return x.id===state.selectedForFusion[0];});
      if(fp.gehId!==p.gehId||fp.type!==p.type||fp.isReglementaire!==p.isReglementaire){
        alert('Les prélèvements doivent être du même GEH, même type et même statut réglementaire');
        return;
      }
    }
    state.selectedForFusion.push(pid);
  }else state.selectedForFusion.splice(i,1);
  render();
}

function doFusion(){
  var m=getCurrentMission();
  if(!m||state.selectedForFusion.length<2)return;
  var tm=m.prelevements.filter(function(p){return state.selectedForFusion.indexOf(p.id)!==-1;});
  if(tm.length<2)return;
  var first=tm[0];
  var errors=[];
  for(var j=1;j<tm.length;j++){
    var o=tm[j];
    if(o.gehId!==first.gehId)errors.push('GEH différent');
    if(o.type!==first.type)errors.push('Type différent (8h/CT)');
    if(o.isReglementaire!==first.isReglementaire)errors.push('Statut réglementaire différent');
  }
  if(errors.length>0){alert('Fusion impossible:\n- '+errors.join('\n- '));return;}
  var mn=tm[0];
  for(var j=1;j<tm.length;j++){
    var o=tm[j];
    o.agents.forEach(function(a){if(!mn.agents.some(function(x){return x.name===a.name;}))mn.agents.push(a);});
    for(var s=0;s<mn.subPrelevements.length&&s<o.subPrelevements.length;s++){
      if(!mn.subPrelevements[s].agentData)mn.subPrelevements[s].agentData={};
      if(o.subPrelevements[s].agentData){
        for(var an in o.subPrelevements[s].agentData){
          if(!mn.subPrelevements[s].agentData[an])mn.subPrelevements[s].agentData[an]=o.subPrelevements[s].agentData[an];
        }
      }
    }
    var idx=m.prelevements.findIndex(function(x){return x.id===o.id;});
    if(idx!==-1)m.prelevements.splice(idx,1);
  }
  saveData('vlep_missions_v3',state.missions);
  state.fusionMode=false;
  state.selectedForFusion=[];
  render();
}


// ===== DEFUSION =====
function defusionPrel(prelId){
  var m=getCurrentMission();
  if(!m)return;
  var p=m.prelevements.find(function(x){return x.id===prelId;});
  if(!p||!p.agents||p.agents.length<2){alert('Ce prélèvement ne contient qu\'un seul agent, impossible de défusionner.');return;}
  if(!confirm('Défusionner ce prélèvement ?\nChaque agent redeviendra un prélèvement séparé.'))return;
  var newPrels=[];
  p.agents.forEach(function(agent){
    var np={id:Date.now()+Math.floor(Math.random()*1000),gehId:p.gehId,type:p.type,isReglementaire:p.isReglementaire,agents:[agent],subPrelevements:[]};
    p.subPrelevements.forEach(function(sub){
      var ns=JSON.parse(JSON.stringify(sub));
      ns.id=Date.now()+Math.floor(Math.random()*10000);
      if(ns.agentData){var kept={};if(ns.agentData[agent.name])kept[agent.name]=ns.agentData[agent.name];ns.agentData=kept;}
      np.subPrelevements.push(ns);
    });
    newPrels.push(np);
  });
  var idx=m.prelevements.findIndex(function(x){return x.id===prelId;});
  m.prelevements.splice(idx,1);
  newPrels.forEach(function(np){m.prelevements.splice(idx,0,np);idx++;});
  saveData('vlep_missions_v3',state.missions);
  render();
}

// Nouvelle fonction : Analyse les groupes fusionnables
function analyzeGroupsForFusion(){
  var m=getCurrentMission();
  if(!m)return[];
  
  var groups=[];
  var processed={};
  
  m.prelevements.forEach(function(p){
    if(processed[p.id])return;
    
    // Trouver tous les prélèvements compatibles
    var compatible=m.prelevements.filter(function(x){
      return x.gehId===p.gehId && x.type===p.type && x.isReglementaire===p.isReglementaire && x.id!==p.id && !processed[x.id];
    });
    
    if(compatible.length>0){
      var allInGroup=[p].concat(compatible);
      var gehInfo=m.gehs.find(function(g){return g.id===p.gehId;});
      var agentNames=[];
      allInGroup.forEach(function(pr){
        pr.agents.forEach(function(a){
          if(agentNames.indexOf(a.name)===-1)agentNames.push(a.name);
        });
      });
      
      // Vérifier les différences
      var warnings=[];
      var operators={};
      var dates={};
      var supports={};
      var codesPretrait={};
      
      allInGroup.forEach(function(pr){
        pr.subPrelevements.forEach(function(sub){
          if(sub.operateur)operators[sub.operateur]=true;
          if(sub.date)dates[sub.date]=true;
        });
        pr.agents.forEach(function(a){
          var ag=getAgentFromDB(a.name);
          if(ag){
            var sup=ag['Support de prélèvement']||'';
            var cp=ag['Code prétraitement']||'';
            if(sup)supports[sup]=true;
            if(cp)codesPretrait[cp]=true;
          }
        });
      });
      var opCount=Object.keys(operators).length;
      var dateCount=Object.keys(dates).length;
      if(opCount>1)warnings.push('Opérateurs différents');
      if(dateCount>1)warnings.push('Dates différentes');
      if(Object.keys(supports).length>1)warnings.push('Supports différents: '+Object.keys(supports).join(', '));
      if(Object.keys(codesPretrait).length>1)warnings.push('Codes prétraitement différents: '+Object.keys(codesPretrait).join(', '));
      
      groups.push({
        id:'group_'+p.id,
        gehId:p.gehId,
        gehName:gehInfo?gehInfo.name:'',
        gehNum:gehInfo?gehInfo.num:'',
        type:p.type,
        isReglementaire:p.isReglementaire,
        prelevements:allInGroup,
        agentNames:agentNames,
        warnings:warnings,
        selected:warnings.length===0 // Auto-sélectionner seulement si pas de warnings
      });
      
      allInGroup.forEach(function(pr){processed[pr.id]=true;});
    }
  });
  
  return groups;
}

// Nouvelle fonction : Affiche le modal de fusion intelligente
function showSmartFusionModal(){
  var groups=analyzeGroupsForFusion();
  if(groups.length===0){
    alert('Aucun prélèvement fusionnable trouvé.\n\nLes prélèvements doivent partager :\n- Même GEH\n- Même type (8h ou CT)\n- Même statut réglementaire');
    return;
  }
  state.showModal='smartFusion';
  state.fusionGroups=groups;
  render();
}

// Nouvelle fonction : Effectue la fusion intelligente
function doSmartFusion(){
  var m=getCurrentMission();
  if(!m||!state.fusionGroups)return;
  
  var selectedGroups=state.fusionGroups.filter(function(g){return g.selected;});
  if(selectedGroups.length===0){
    alert('Aucun groupe sélectionné');
    return;
  }
  
  var totalFused=0;
  selectedGroups.forEach(function(group){
    if(group.prelevements.length<2)return;
    
    var first=group.prelevements[0];
    for(var j=1;j<group.prelevements.length;j++){
      var other=group.prelevements[j];
      
      // Fusionner les agents
      other.agents.forEach(function(a){
        if(!first.agents.some(function(x){return x.name===a.name;})){
          first.agents.push(a);
        }
      });
      
      // Fusionner les données de sous-prélèvements
      for(var s=0;s<first.subPrelevements.length&&s<other.subPrelevements.length;s++){
        if(!first.subPrelevements[s].agentData)first.subPrelevements[s].agentData={};
        if(other.subPrelevements[s].agentData){
          for(var an in other.subPrelevements[s].agentData){
            if(!first.subPrelevements[s].agentData[an]){
              first.subPrelevements[s].agentData[an]=other.subPrelevements[s].agentData[an];
            }
          }
        }
      }
      
      // Supprimer l'autre prélèvement
      var idx=m.prelevements.findIndex(function(x){return x.id===other.id;});
      if(idx!==-1){
        m.prelevements.splice(idx,1);
        totalFused++;
      }
    }
  });
  
  saveData('vlep_missions_v3',state.missions);
  state.showModal=null;
  state.fusionGroups=null;
  render();
  
  alert('Fusion réussie !\n\n'+selectedGroups.length+' groupe(s) fusionné(s)\n'+totalFused+' prélèvement(s) fusionné(s)');
}

// Nouvelle fonction : Toggle sélection groupe
function toggleGroupSelection(groupId){
  if(!state.fusionGroups)return;
  var group=state.fusionGroups.find(function(g){return g.id===groupId;});
  if(group)group.selected=!group.selected;
  render();
}

// Nouvelle fonction : Tout sélectionner/désélectionner
function toggleAllGroups(select){
  if(!state.fusionGroups)return;
  state.fusionGroups.forEach(function(g){g.selected=select;});
  render();
}

function openPrel(pid){
  if(state.fusionMode)return;
  state.currentPrelId=pid;
  state.activeSubIndex=0;
  state.view='terrain-prel';
  render();
}

function calcDebitVariation(di,df){
  if(!di||!df||isNaN(parseFloat(di))||isNaN(parseFloat(df)))return null;
  var dI=parseFloat(di);
  var dF=parseFloat(df);
  if(dI<=0)return null;
  return Math.abs(dF-dI)/dI*100;
}

function renderTerrainPrel(){
  var m=getCurrentMission();
  if(!m){state.view='terrain-list';render();return'';}
  var p=m.prelevements.find(function(x){return x.id===state.currentPrelId;});
  if(!p){state.view='terrain-mission';render();return'';}
  var mc=p.agents&&p.agents[0]?p.agents[0].color:'#3b82f6';
  var agentNames=p.agents&&p.agents.length>0?p.agents.map(function(a){return escapeHtml(a.name||'???');}).join(' + '):'Agent inconnu';
  var h='<div class="sticky-header"><button class="back-btn" onclick="state.view=\'terrain-mission\';state.currentPrelId=null;render();">'+ICONS.arrowLeft+' Liste</button><div style="color:white;font-size:12px;opacity:0.85;">'+agentNames+' - '+p.type+' | GEH '+p.gehNum+'</div></div><div class="card" style="border-left:4px solid '+mc+';"><h2 style="color:'+mc+';">'+agentNames+' - '+p.type+'</h2><p class="subtitle"><span class="svg-icon">'+ICONS.folder+'</span> GEH '+p.gehNum+' - '+escapeHtml(p.gehName)+' | '+(p.isReglementaire?'Réglementaire':'Non-régl.')+'</p></div>';
  if(p.subPrelevements.length>1){
    h+='<div class="tabs">';
    for(var t=0;t<p.subPrelevements.length;t++){
      var sb=p.subPrelevements[t];
      h+='<button class="tab '+(state.activeSubIndex===t?'active':'')+'" onclick="state.activeSubIndex='+t+';render();">Prél '+(t+1)+(sb.completed?' ✓':'')+'</button>';
    }
    h+='</div>';
  }
  // Boutons co-prélèvement (seulement si plusieurs agents fusionnés)
  if(p.agents&&p.agents.length>1){
    h+='<div class="row mb-12" style="gap:6px;">';
    h+='<button class="btn btn-blue btn-small" onclick="showSmartCoPrelModal('+p.id+');">'+ICONS.zap+' Co-prél. intelligent</button>';
    h+='<button class="btn btn-blue-outline btn-small" onclick="showManualCoPrelModal('+p.id+');">'+ICONS.merge+' Co-prél. manuel</button>';
    if(p.coPrelGroups&&p.coPrelGroups.some(function(g){return g.length>1;})){
      h+='<button class="btn btn-gray btn-small" onclick="resetCoPrel('+p.id+');">✕ Réinitialiser</button>';
    }
    h+='</div>';
  }
  h+=renderSubPrelForm(p,p.subPrelevements[state.activeSubIndex],state.activeSubIndex);
  if(state.showModal==='smartCoPrel'&&state.coPrelTargetPid===p.id)h+=renderSmartCoPrelModal(p);
  if(state.showModal==='manualCoPrel'&&state.coPrelTargetPid===p.id)h+=renderManualCoPrelModal(p);
  return h;
}

// FIX #4 & #5: Ajout des boutons "Copier J-1" et auto-date
function renderSubPrelForm(p,sb,idx){
  var m=getCurrentMission();
  var canCopyFromPrevious=idx>0;
  
  var h='<div class="card">';
  
  // Opérateur avec bouton copier J-1
  h+='<div class="field"><div class="field-header"><label class="label">Opérateur / Point fixe</label>';
  if(canCopyFromPrevious)h+='<button class="copy-btn" onclick="copyFromPrevious('+p.id+','+idx+',\'operateur\');">'+ICONS.list+' J-1</button>';
  h+='</div><input type="text" class="input" value="'+escapeHtml(sb.operateur||'')+'" onchange="updateSubFieldWithAutoDate('+p.id+','+idx+',\'operateur\',this.value);"></div>';
  
  // Date
  h+='<div class="field"><label class="label">Date</label><input type="date" class="input" value="'+(sb.date||'')+'" onchange="updateSubField('+p.id+','+idx+',\'date\',this.value);"></div>';
  
  h+='<div class="field"><label class="label"><span class="svg-icon">'+ICONS.beaker+'</span> Agent(s) chimique(s)</label>';
  
  if(!p.agents||p.agents.length===0){
    h+='<div class="info-box info-box-warning"><p>Aucun agent chimique défini pour ce prélèvement</p></div>';
  }else{
    // Construire les groupes d'affichage
    var agentsRendered={};
    var groups=buildDisplayGroups(p);
    
    groups.forEach(function(group){
      var isCoGroup=group.length>1;
      if(!sb.agentData)sb.agentData={};
      
      // S'assurer que les données existent pour tous les agents du groupe
      group.forEach(function(a){
        var aname=a.name||'Agent inconnu';
        if(!sb.agentData[aname])sb.agentData[aname]={refEchantillon:'',numPompe:'',debitInitial:'',debitFinal:''};
      });
      
      // Le premier agent du groupe est le "maître" pour pompe+débits
      var masterName=group[0].name||'Agent inconnu';
      var masterAd=sb.agentData[masterName];
      var variation=calcDebitVariation(masterAd.debitInitial,masterAd.debitFinal);
      var hasWarning=variation!==null&&variation>5;
      
      // Header du bloc
      if(isCoGroup){
        // Bloc co-prélèvement : header bleu avec tous les agents
        h+='<div class="multi-agent-item coprel-group"><div class="multi-agent-header coprel-header">';
        group.forEach(function(a){
          h+='<div class="multi-agent-color" style="background:'+(a.color||'#3b82f6')+';"></div>';
        });
        h+='<div class="multi-agent-name">'+group.map(function(a){return escapeHtml(a.name);}).join(' + ')+'</div>';
        h+='<span class="coprel-badge">🔵 Co-prél.</span>';
        h+='</div><div class="multi-agent-fields">';
      }else{
        // Bloc agent seul : header normal
        h+='<div class="multi-agent-item"><div class="multi-agent-header"><div class="multi-agent-color" style="background:'+(group[0].color||'#3b82f6')+';"></div><div class="multi-agent-name">'+escapeHtml(masterName)+'</div></div><div class="multi-agent-fields">';
      }
      
      // Champs partagés (pompe + débits) — sur le maître, synchronisés aux autres
      var coAgentsJs=isCoGroup?'['+group.map(function(a){return'\''+escapeJs(a.name)+'\'';}).join(',')+']':'null';
      
      h+='<div class="multi-agent-row"><label>N° Pompe';
      if(canCopyFromPrevious)h+='<button class="copy-btn" onclick="copyAgentDataFromPrevious('+p.id+','+idx+',\''+escapeJs(masterName)+'\',\'numPompe\');">J-1</button>';
      h+='</label><input type="text" inputmode="numeric" value="'+escapeHtml(masterAd.numPompe||'')+'" placeholder="Ex: 123" onchange="updateSharedField('+p.id+','+idx+','+coAgentsJs+',\''+escapeJs(masterName)+'\',\'numPompe\',this.value);"></div>';
      
      h+='<div class="multi-agent-row"><label>Débit initial</label><input type="text" inputmode="decimal" class="debit-input '+(hasWarning?'warning':'')+'" value="'+escapeHtml(masterAd.debitInitial||'')+'" placeholder="L/min" oninput="handleDebitInput(this);" onchange="updateSharedField('+p.id+','+idx+','+coAgentsJs+',\''+escapeJs(masterName)+'\',\'debitInitial\',this.value);"></div>';
      h+='<div class="multi-agent-row"><label>Débit final</label><input type="text" inputmode="decimal" class="debit-input '+(hasWarning?'warning':'')+'" value="'+escapeHtml(masterAd.debitFinal||'')+'" placeholder="L/min" oninput="handleDebitInput(this);" onchange="updateSharedField('+p.id+','+idx+','+coAgentsJs+',\''+escapeJs(masterName)+'\',\'debitFinal\',this.value);">';
      if(variation!==null){h+='<span class="debit-variation '+(hasWarning?'warning':'')+'">Δ '+variation.toFixed(1)+'%</span>';}
      h+='</div>';
      
      // Réf. échantillon : partagée pour un groupe co-prélevé, individuelle sinon
      if(isCoGroup){
        h+='<div class="multi-agent-row"><label>Réf. échant. <span style="color:#1d4ed8;font-size:10px;">(commune)</span></label><input type="text" value="'+escapeHtml(masterAd.refEchantillon||'')+'" placeholder="Référence..." onchange="updateSharedField('+p.id+','+idx+','+coAgentsJs+',\''+escapeJs(masterName)+'\',\'refEchantillon\',this.value);"></div>';
      }else{
        var soloAd=sb.agentData[masterName];
        h+='<div class="multi-agent-row"><label>Réf. échant.</label><input type="text" value="'+escapeHtml(soloAd.refEchantillon||'')+'" placeholder="Référence..." onchange="updateAgentDataWithAutoDate('+p.id+','+idx+',\''+escapeJs(masterName)+'\',\'refEchantillon\',this.value);"></div>';
      }
      
      h+='</div></div>';
    });
  }
  h+='</div>';
  
  // Timer CT
  if(p.type==='CT'){
    var timerRunning=isTimerRunning(p.id,idx);
    if(timerRunning){
      h+=getTimerDisplay(p.id,idx);
    }else{
      h+='<button class="btn btn-primary" style="width:100%;margin:8px 0;" onclick="startCTTimer('+p.id+','+idx+');">▶ï¸ Démarrer chrono CT</button>';
    }
  }
  
  h+='<div class="field"><label class="label">Plages horaires</label>';
  var pl=sb.plages||[{debut:'',fin:''}];
  pl.forEach(function(x,pi){
    h+='<div class="plage-row"><div class="plage-num">'+(pi+1)+'</div><input type="time" class="plage-input" value="'+(x.debut||'')+'" onchange="updatePlageWithAutoDate('+p.id+','+idx+','+pi+',\'debut\',this.value);"><span class="plage-sep">'+ICONS.arrowRight+'</span><input type="time" class="plage-input" value="'+(x.fin||'')+'" onchange="updatePlageWithAutoDate('+p.id+','+idx+','+pi+',\'fin\',this.value);">';
    if(pl.length>1)h+='<button class="plage-delete" onclick="removePlage('+p.id+','+idx+','+pi+');">✕</button>';
    h+='</div>';
  });
  if(pl.length<10)h+='<button class="btn btn-gray btn-small" onclick="addPlage('+p.id+','+idx+');">+ Plage</button>';
  h+='</div>';
  
  var d=getDureeTotale(pl);
  if(d)h+='<div class="duration-box"><span style="display:inline-flex;width:16px;height:16px;">'+ICONS.clock+'</span> Durée : '+d+'</div>';
  
  h+='<div class="field"><label class="label">Observations</label><div style="display:flex;gap:6px;align-items:flex-start;"><textarea class="input" style="flex:1;" rows="2" id="obs-'+p.id+'-'+idx+'" onchange="updateSubFieldWithAutoDate('+p.id+','+idx+',\'observations\',this.value);">'+escapeHtml(sb.observations||'')+'</textarea><button class="dictation-btn" id="dict-btn-'+p.id+'-'+idx+'" onclick="toggleDictation('+p.id+','+idx+');" title="Dictée vocale">'+ICONS.mic+'</button></div></div>';
  h+='<button class="btn btn-success" onclick="toggleSubComplete('+p.id+','+idx+');">'+(sb.completed?'✓ Complété - Modifier':'✓ Valider')+'</button></div>';
  return h;
}

// FIX #4: Fonctions pour copier depuis J-1
function copyFromPrevious(pid,idx,field){
  if(idx<=0)return;
  var m=getCurrentMission();if(!m)return;
  var p=m.prelevements.find(function(x){return x.id===pid;});
  if(!p)return;
  var prevSub=p.subPrelevements[idx-1];
  var currentSub=p.subPrelevements[idx];
  if(prevSub&&prevSub[field]){
    currentSub[field]=prevSub[field];
    saveData('vlep_missions_v3',state.missions);
    render();
  }
}

function copyAgentDataFromPrevious(pid,idx,agentName,field){
  if(idx<=0)return;
  var m=getCurrentMission();if(!m)return;
  var p=m.prelevements.find(function(x){return x.id===pid;});
  if(!p)return;
  var prevSub=p.subPrelevements[idx-1];
  var currentSub=p.subPrelevements[idx];
  if(prevSub&&prevSub.agentData&&prevSub.agentData[agentName]&&prevSub.agentData[agentName][field]){
    if(!currentSub.agentData)currentSub.agentData={};
    if(!currentSub.agentData[agentName])currentSub.agentData[agentName]={};
    currentSub.agentData[agentName][field]=prevSub.agentData[agentName][field];
    saveData('vlep_missions_v3',state.missions);
    render();
  }
}

// FIX #5: Fonctions avec auto-date
function getTodayDate(){
  var d=new Date();
  return d.toISOString().split('T')[0];
}

function autoFillDate(p,idx){
  var sb=p.subPrelevements[idx];
  if(!sb.date){
    sb.date=getTodayDate();
  }
}

function updateSubFieldWithAutoDate(pid,idx,f,v){
  var m=getCurrentMission();if(!m)return;
  var p=m.prelevements.find(function(x){return x.id===pid;});
  if(p){
    p.subPrelevements[idx][f]=v;
    autoFillDate(p,idx);
    saveData('vlep_missions_v3',state.missions);
  }
}

function updateAgentDataWithAutoDate(pid,idx,an,f,v){
  var m=getCurrentMission();if(!m)return;
  var p=m.prelevements.find(function(x){return x.id===pid;});
  if(p){
    if(!p.subPrelevements[idx].agentData)p.subPrelevements[idx].agentData={};
    if(!p.subPrelevements[idx].agentData[an])p.subPrelevements[idx].agentData[an]={};
    p.subPrelevements[idx].agentData[an][f]=v;
    autoFillDate(p,idx);
    saveData('vlep_missions_v3',state.missions);
  }
}

function updatePlageWithAutoDate(pid,idx,pi,f,v){
  var m=getCurrentMission();if(!m)return;
  var p=m.prelevements.find(function(x){return x.id===pid;});
  if(p){
    p.subPrelevements[idx].plages[pi][f]=v;
    autoFillDate(p,idx);
    saveData('vlep_missions_v3',state.missions);
    render();
  }
}

function handleDebitInput(input){
  var v=input.value;
  v=v.replace(/[^0-9.,]/g,'');
  v=v.replace(',','.');
  input.value=v;
}

function renderDebitVariation(pid,idx,aname){render();}

function updateSubField(pid,idx,f,v){
  var m=getCurrentMission();if(!m)return;
  var p=m.prelevements.find(function(x){return x.id===pid;});
  if(p){p.subPrelevements[idx][f]=v;saveData('vlep_missions_v3',state.missions);}
}

function updateAgentData(pid,idx,an,f,v){
  var m=getCurrentMission();if(!m)return;
  var p=m.prelevements.find(function(x){return x.id===pid;});
  if(p){
    if(!p.subPrelevements[idx].agentData)p.subPrelevements[idx].agentData={};
    if(!p.subPrelevements[idx].agentData[an])p.subPrelevements[idx].agentData[an]={};
    p.subPrelevements[idx].agentData[an][f]=v;
    saveData('vlep_missions_v3',state.missions);
  }
}

function updatePlage(pid,idx,pi,f,v){
  var m=getCurrentMission();if(!m)return;
  var p=m.prelevements.find(function(x){return x.id===pid;});
  if(p){p.subPrelevements[idx].plages[pi][f]=v;saveData('vlep_missions_v3',state.missions);render();}
}

function addPlage(pid,idx){
  var m=getCurrentMission();if(!m)return;
  var p=m.prelevements.find(function(x){return x.id===pid;});
  if(p&&p.subPrelevements[idx].plages.length<10){
    p.subPrelevements[idx].plages.push({debut:'',fin:''});
    saveData('vlep_missions_v3',state.missions);
    render();
  }
}

function removePlage(pid,idx,pi){
  var m=getCurrentMission();if(!m)return;
  var p=m.prelevements.find(function(x){return x.id===pid;});
  if(p&&p.subPrelevements[idx].plages.length>1){
    p.subPrelevements[idx].plages.splice(pi,1);
    saveData('vlep_missions_v3',state.missions);
    render();
  }
}

function getDureeTotale(pl){
  var mn=0;
  pl.forEach(function(x){
    if(x.debut&&x.fin){
      var d=x.debut.split(':'),f=x.fin.split(':');
      var df=(parseInt(f[0])*60+parseInt(f[1]))-(parseInt(d[0])*60+parseInt(d[1]));
      if(df>0)mn+=df;
    }
  });
  if(mn<=0)return'';
  return Math.floor(mn/60)+'h'+(mn%60<10?'0':'')+(mn%60);
}

function toggleSubComplete(pid,idx){
  var m=getCurrentMission();if(!m)return;
  var p=m.prelevements.find(function(x){return x.id===pid;});
  if(p){
    p.subPrelevements[idx].completed=!p.subPrelevements[idx].completed;
    updateMissionStatus(m);
    saveData('vlep_missions_v3',state.missions);
    state.view='terrain-mission';
    render();
  }
}

function updateMissionStatus(m){
  var t=0,d=0;
  m.prelevements.forEach(function(p){p.subPrelevements.forEach(function(s){t++;if(s.completed)d++;});});
  if(d===0)m.status='validee';
  else if(d===t)m.status='terminee';
  else m.status='encours';
}

// FIX #7: Conditions ambiantes responsive mobile


// ===== CO-PRÉLÈVEMENT (à l'intérieur d'un prélèvement fusionné) =====

// Construit les groupes d'affichage à partir de p.coPrelGroups
function buildDisplayGroups(p){
  if(!p.coPrelGroups||p.coPrelGroups.length===0){
    // Pas de groupes définis : chaque agent est seul
    return p.agents.map(function(a){return[a];});
  }
  var result=[];
  var placed={};
  p.coPrelGroups.forEach(function(groupNames){
    var groupAgents=groupNames.map(function(n){return p.agents.find(function(a){return a.name===n;});}).filter(function(a){return!!a;});
    if(groupAgents.length>0){
      result.push(groupAgents);
      groupAgents.forEach(function(a){placed[a.name]=true;});
    }
  });
  // Agents non placés dans un groupe
  p.agents.forEach(function(a){
    if(!placed[a.name])result.push([a]);
  });
  return result;
}

// Met à jour un champ partagé sur le maître + synchronise les co-prélevés
function updateSharedField(pid,idx,coAgents,masterName,field,value){
  var m=getCurrentMission();if(!m)return;
  var p=m.prelevements.find(function(x){return x.id===pid;});
  if(!p)return;
  if(!p.subPrelevements[idx].agentData)p.subPrelevements[idx].agentData={};
  var ad=p.subPrelevements[idx].agentData;
  // Mettre à jour le maître
  if(!ad[masterName])ad[masterName]={};
  ad[masterName][field]=value;
  // Synchroniser les co-prélevés si applicable
  if(coAgents&&coAgents.length>1){
    coAgents.forEach(function(aname){
      if(aname!==masterName){
        if(!ad[aname])ad[aname]={};
        ad[aname][field]=value;
      }
    });
  }
  // Auto-date
  autoFillDate(p,idx);
  saveData('vlep_missions_v3',state.missions);
  render();
}

// Retourne clé de compatibilité co-prél d'un agent
function getCoPrelKey(agentName){
  var ag=getAgentFromDB(agentName);
  if(!ag)return null;
  var sup=ag['Support de prélèvement']||'';
  var cp=ag['Code prétraitement']||'';
  var dm=ag['débit max  8h (L/min)']||ag['débit max 8h (L/min)']||'';
  if(!sup&&!cp)return null;
  return{support:sup,codePretrait:cp,debitMax:dm,key:sup+'||'+cp+'||'+dm};
}

// Détection intelligente : regroupe les agents compatibles dans un prélèvement
function detectSmartGroups(p){
  var grouped={};
  var keyMap={};
  p.agents.forEach(function(a){
    var k=getCoPrelKey(a.name);
    if(k&&k.key){
      if(!grouped[k.key])grouped[k.key]=[];
      grouped[k.key].push(a.name);
      keyMap[k.key]=k;
    }
  });
  var result=[];
  for(var key in grouped){
    if(grouped[key].length>1)result.push({names:grouped[key],info:keyMap[key]});
  }
  return result;
}

// Modal co-prél intelligent
function showSmartCoPrelModal(pid){
  var m=getCurrentMission();if(!m)return;
  var p=m.prelevements.find(function(x){return x.id===pid;});
  if(!p)return;
  var groups=detectSmartGroups(p);
  if(groups.length===0){
    alert('Aucun groupe co-prélevable détecté.\n\nLes agents doivent partager :\n- Même support de prélèvement\n- Même code prétraitement\n- Même débit max');
    return;
  }
  state.showModal='smartCoPrel';
  state.coPrelTargetPid=pid;
  state.coPrelDetectedGroups=groups;
  render();
}

function renderSmartCoPrelModal(p){
  if(!state.coPrelDetectedGroups)return'';
  var h='<div class="modal show" onclick="if(event.target===this){state.showModal=null;state.coPrelDetectedGroups=null;render();}"><div class="modal-content"><div class="modal-header"><h2>🔵 Co-prél. intelligent</h2><button class="close-btn" onclick="state.showModal=null;state.coPrelDetectedGroups=null;render();">×</button></div>';
  h+='<div class="info-box info-box-blue mb-12"><p><strong>'+state.coPrelDetectedGroups.length+' groupe(s) détecté(s)</strong> par support + code prétraitement + débit max identiques</p></div>';
  state.coPrelDetectedGroups.forEach(function(g,i){
    h+='<div class="card" style="padding:10px;margin-bottom:8px;border-left:4px solid #3b82f6;">';
    h+='<div style="font-weight:700;color:#1d4ed8;margin-bottom:4px;">Groupe '+(i+1)+'</div>';
    h+='<div style="font-size:12px;margin-bottom:4px;">'+g.names.map(escapeHtml).join(' + ')+'</div>';
    h+='<div style="font-size:11px;color:#6b7280;">Support: <strong>'+escapeHtml(g.info.support)+'</strong> • Code prétr.: <strong>'+escapeHtml(g.info.codePretrait)+'</strong>';
    if(g.info.debitMax)h+=' • Débit max: <strong>'+escapeHtml(g.info.debitMax)+' L/min</strong>';
    h+='</div></div>';
  });
  h+='<div class="row mt-12"><button class="btn btn-gray" onclick="state.showModal=null;state.coPrelDetectedGroups=null;render();">Annuler</button><button class="btn btn-blue" onclick="applySmartCoPrel('+p.id+');">Appliquer</button></div>';
  h+='</div></div>';
  return h;
}

function applySmartCoPrel(pid){
  var m=getCurrentMission();if(!m)return;
  var p=m.prelevements.find(function(x){return x.id===pid;});
  if(!p||!state.coPrelDetectedGroups)return;
  // Construire les groupes : agents groupés + agents solo
  var placed={};
  var newGroups=[];
  state.coPrelDetectedGroups.forEach(function(g){
    newGroups.push(g.names);
    g.names.forEach(function(n){placed[n]=true;});
  });
  p.agents.forEach(function(a){
    if(!placed[a.name])newGroups.push([a.name]);
  });
  p.coPrelGroups=newGroups;
  saveData('vlep_missions_v3',state.missions);
  state.showModal=null;
  state.coPrelDetectedGroups=null;
  render();
}

// Modal co-prél manuel
function showManualCoPrelModal(pid){
  var m=getCurrentMission();if(!m)return;
  var p=m.prelevements.find(function(x){return x.id===pid;});
  if(!p)return;
  // Initialiser avec les groupes existants ou chaque agent seul
  state.showModal='manualCoPrel';
  state.coPrelTargetPid=pid;
  // Copier les groupes actuels pour édition
  if(p.coPrelGroups&&p.coPrelGroups.length>0){
    state.coPrelEditGroups=JSON.parse(JSON.stringify(p.coPrelGroups));
  }else{
    state.coPrelEditGroups=p.agents.map(function(a){return[a.name];});
  }
  render();
}

function renderManualCoPrelModal(p){
  if(!state.coPrelEditGroups)return'';
  var h='<div class="modal show" onclick="if(event.target===this){state.showModal=null;state.coPrelEditGroups=null;render();}"><div class="modal-content" style="max-height:90vh;overflow-y:auto;"><div class="modal-header"><h2>🔵 Co-prél. manuel</h2><button class="close-btn" onclick="state.showModal=null;state.coPrelEditGroups=null;render();">×</button></div>';
  h+='<div class="info-box info-box-blue mb-12"><p>Glissez les agents dans des groupes. Les agents du même groupe partageront la même pompe et les mêmes débits.</p></div>';
  
  // Afficher les groupes éditables
  state.coPrelEditGroups.forEach(function(group,gi){
    var isCo=group.length>1;
    h+='<div class="card" style="padding:10px;margin-bottom:8px;border-left:4px solid '+(isCo?'#3b82f6':'#e5e7eb')+';">';
    h+='<div style="font-size:11px;font-weight:700;color:#6b7280;margin-bottom:6px;">Groupe '+(gi+1)+(isCo?' 🔵 Co-prélèvement':'')+'</div>';
    group.forEach(function(aname,ai){
      var agent=p.agents.find(function(a){return a.name===aname;});
      var color=agent?agent.color:'#3b82f6';
      h+='<div style="display:flex;align-items:center;gap:6px;margin-bottom:4px;">';
      h+='<div style="width:10px;height:10px;border-radius:50%;background:'+color+';flex-shrink:0;"></div>';
      h+='<span style="flex:1;font-size:13px;">'+escapeHtml(aname)+'</span>';
      // Boutons déplacer vers autre groupe
      if(state.coPrelEditGroups.length>1){
        state.coPrelEditGroups.forEach(function(og,ogi){
          if(ogi!==gi)h+='<button class="btn btn-gray btn-small" style="font-size:10px;padding:2px 6px;" onclick="moveToCoPrelGroup('+gi+','+ai+','+ogi+');">→ G'+(ogi+1)+'</button>';
        });
      }
      // Retirer du groupe (le mettre seul)
      if(group.length>1)h+='<button class="btn btn-gray btn-small" style="font-size:10px;padding:2px 6px;" onclick="removeFromCoPrelGroup('+gi+','+ai+');">Seul</button>';
      h+='</div>';
    });
    h+='</div>';
  });
  
  h+='<div class="row mt-12"><button class="btn btn-gray" onclick="state.showModal=null;state.coPrelEditGroups=null;render();">Annuler</button><button class="btn btn-blue" onclick="applyManualCoPrel('+p.id+');">Appliquer</button></div>';
  h+='</div></div>';
  return h;
}

function moveToCoPrelGroup(fromGi,fromAi,toGi){
  if(!state.coPrelEditGroups)return;
  var aname=state.coPrelEditGroups[fromGi].splice(fromAi,1)[0];
  state.coPrelEditGroups[toGi].push(aname);
  // Nettoyer groupes vides
  state.coPrelEditGroups=state.coPrelEditGroups.filter(function(g){return g.length>0;});
  render();
}

function removeFromCoPrelGroup(gi,ai){
  if(!state.coPrelEditGroups)return;
  var aname=state.coPrelEditGroups[gi].splice(ai,1)[0];
  if(state.coPrelEditGroups[gi].length===0)state.coPrelEditGroups.splice(gi,1);
  state.coPrelEditGroups.push([aname]);
  render();
}

function applyManualCoPrel(pid){
  var m=getCurrentMission();if(!m)return;
  var p=m.prelevements.find(function(x){return x.id===pid;});
  if(!p||!state.coPrelEditGroups)return;
  p.coPrelGroups=state.coPrelEditGroups.filter(function(g){return g.length>0;});
  saveData('vlep_missions_v3',state.missions);
  state.showModal=null;
  state.coPrelEditGroups=null;
  render();
}

function resetCoPrel(pid){
  var m=getCurrentMission();if(!m)return;
  var p=m.prelevements.find(function(x){return x.id===pid;});
  if(!p)return;
  if(!confirm('Réinitialiser le co-prélèvement ?\nChaque agent aura sa propre pompe.'))return;
  p.coPrelGroups=null;
  saveData('vlep_missions_v3',state.missions);
  render();
}

console.log('✓ Terrain chargé');
