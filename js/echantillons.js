// echantillons.js - Gestion échantillons et conditions ambiantes
// © 2025 Quentin THOMAS
// Liste échantillons, blancs, conditions ambiantes

function renderConditions(){
  var m=getCurrentMission();
  if(!m){state.view='terrain-mission';render();return'';}
  var h='<button class="back-btn" onclick="state.view=\'terrain-mission\';render();">'+ICONS.arrowLeft+' Mission</button><div class="card"><h2>'+ICONS.thermometer+' Conditions ambiantes</h2><p class="subtitle">Par jour de prélèvement</p><button class="btn btn-primary mt-12" onclick="addCondition();">+ Ajouter un jour</button></div>';
  if(!m.conditionsAmbiantes)m.conditionsAmbiantes=[];
  if(m.conditionsAmbiantes.length===0)h+='<div class="empty-state"><p>Aucune condition saisie</p></div>';
  else m.conditionsAmbiantes.forEach(function(c,i){
    h+='<div class="condition-card">';
    h+='<div class="condition-date"><input type="date" class="input" style="margin:0;flex:1;max-width:160px;" value="'+(c.date||'')+'" onchange="updateCond('+i+',\'date\',this.value);"><button class="btn btn-danger btn-icon" onclick="deleteCond('+i+');">'+ICONS.trash+'</button></div>';
    
    // Température
    h+='<div class="condition-row"><span class="condition-label">'+ICONS.thermometer+' Température (°C)</span><div class="condition-inputs"><div style="flex:1;"><div class="condition-input-label">Initial</div><input type="text" inputmode="decimal" class="condition-input condition-input-i" value="'+(c.tempI||'')+'" placeholder="I" onchange="updateCond('+i+',\'tempI\',this.value);"></div><div style="flex:1;"><div class="condition-input-label">Final</div><input type="text" inputmode="decimal" class="condition-input condition-input-f" value="'+(c.tempF||'')+'" placeholder="F" onchange="updateCond('+i+',\'tempF\',this.value);"></div></div></div>';
    
    // Pression
    h+='<div class="condition-row"><span class="condition-label">'+ICONS.database+' Pression (hPa)</span><div class="condition-inputs"><div style="flex:1;"><div class="condition-input-label">Initial</div><input type="text" inputmode="numeric" class="condition-input condition-input-i" value="'+(c.pressionI||'')+'" placeholder="I" onchange="updateCond('+i+',\'pressionI\',this.value);"></div><div style="flex:1;"><div class="condition-input-label">Final</div><input type="text" inputmode="numeric" class="condition-input condition-input-f" value="'+(c.pressionF||'')+'" placeholder="F" onchange="updateCond('+i+',\'pressionF\',this.value);"></div></div></div>';
    
    // Humidité
    h+='<div class="condition-row"><span class="condition-label">'+ICONS.droplet+' Humidité (%)</span><div class="condition-inputs"><div style="flex:1;"><div class="condition-input-label">Initial</div><input type="text" inputmode="numeric" class="condition-input condition-input-i" value="'+(c.humiditeI||'')+'" placeholder="I" onchange="updateCond('+i+',\'humiditeI\',this.value);"></div><div style="flex:1;"><div class="condition-input-label">Final</div><input type="text" inputmode="numeric" class="condition-input condition-input-f" value="'+(c.humiditeF||'')+'" placeholder="F" onchange="updateCond('+i+',\'humiditeF\',this.value);"></div></div></div>';
    
    h+='</div>';
  });
  return h;
}

function addCondition(){
  var m=getCurrentMission();if(!m)return;
  if(!m.conditionsAmbiantes)m.conditionsAmbiantes=[];
  m.conditionsAmbiantes.push({date:new Date().toISOString().split('T')[0],tempI:'',tempF:'',pressionI:'',pressionF:'',humiditeI:'',humiditeF:''});
  saveData('vlep_missions_v3',state.missions);
  render();
}

function updateCond(i,f,v){
  var m=getCurrentMission();
  if(m&&m.conditionsAmbiantes[i]){m.conditionsAmbiantes[i][f]=v;saveData('vlep_missions_v3',state.missions);}
}

function deleteCond(i){
  var m=getCurrentMission();
  if(m&&confirm('Supprimer ?')){m.conditionsAmbiantes.splice(i,1);saveData('vlep_missions_v3',state.missions);render();}
}

// FIX #1 & #2: Liste échantillons avec code analytique corrigé et regroupement
function renderListeEchantillons(){
  var m=getCurrentMission();
  if(!m){state.view='terrain-mission';render();return'';}
  if(!m.blancs)m.blancs=[];
  
  var h='<button class="back-btn" onclick="state.view=\'terrain-mission\';render();">'+ICONS.arrowLeft+' Mission</button><div class="card"><h2>'+ICONS.list+' Liste échantillons</h2><p class="subtitle">'+escapeHtml(m.clientSite)+'</p></div>';
  h+='<div class="row mb-12"><button class="btn btn-success" onclick="state.showModal=\'addBlanc\';state.blancAgentSearch=\'\';state.blancAgents=[];render();">+ Blanc terrain</button><button class="btn btn-primary" onclick="exportExcel();">'+ICONS.download+' Export Excel</button></div>';
  h+='<div class="row mb-12"><span style="font-size:13px;margin-right:8px;">Trier par :</span><button class="btn btn-small '+(state.echantillonSort==='date'?'btn-blue':'btn-gray')+'" onclick="state.echantillonSort=\'date\';render();">Date</button><button class="btn btn-small '+(state.echantillonSort==='agent'?'btn-blue':'btn-gray')+'" onclick="state.echantillonSort=\'agent\';render();">Agent</button></div>';
  
  // FIX #2: Regrouper par référence échantillon
  var byRef={};
  m.prelevements.forEach(function(p){
    p.subPrelevements.forEach(function(sb){
      p.agents.forEach(function(a){
        var d=sb.agentData?sb.agentData[a.name]:null;
        if(d&&d.refEchantillon){
          var ref=d.refEchantillon;
          if(!byRef[ref]){
            byRef[ref]={ref:ref,agents:[],date:sb.date||'',type:'Échantillon',isBlanc:false};
          }
          var ag=getAgentFromDB(a.name);
          byRef[ref].agents.push({name:a.name,code:getCodeAnalytique(ag)});
        }
      });
    });
  });
  
  // Blancs
  m.blancs.forEach(function(b){
    var ref=b.ref;
    if(!byRef[ref]){
      byRef[ref]={ref:ref,agents:[],date:b.date||'',type:'Blanc',isBlanc:true};
    }
    b.agents.forEach(function(an){
      var ag=getAgentFromDB(an);
      byRef[ref].agents.push({name:an,code:getCodeAnalytique(ag)});
    });
  });
  
  // Convertir en liste
  var l=Object.values(byRef);
  
  if(state.echantillonSort==='agent'){
    l.sort(function(a,b){
      var aName=a.agents[0]?a.agents[0].name:'';
      var bName=b.agents[0]?b.agents[0].name:'';
      return aName.localeCompare(bName);
    });
  }else{
    l.sort(function(a,b){return(a.date||'').localeCompare(b.date||'');});
  }
  
  if(l.length===0)h+='<div class="empty-state"><p>Aucun échantillon</p></div>';
  else{
    h+='<div class="card" style="padding:8px;overflow-x:auto;"><table style="width:100%;border-collapse:collapse;font-size:11px;"><tr style="background:#f3f4f6;"><th style="padding:6px;text-align:left;">Réf.</th><th style="padding:6px;text-align:left;">Agent(s) chimique(s)</th><th style="padding:6px;">Date</th><th style="padding:6px;">Code(s) analytique(s)</th><th style="padding:6px;">Type</th></tr>';
    l.forEach(function(x){
      var bg=x.isBlanc?'background:#fef3c7;':'';
      var agentNames=x.agents.map(function(a){return a.name;}).join(', ');
      var codes=x.agents.map(function(a){return a.code;}).filter(function(c){return c;}).join(', ');
      h+='<tr style="border-bottom:1px solid #e5e7eb;'+bg+'"><td style="padding:6px;font-weight:600;">'+escapeHtml(x.ref)+'</td><td style="padding:6px;">'+escapeHtml(agentNames)+'</td><td style="padding:6px;text-align:center;">'+escapeHtml(x.date)+'</td><td style="padding:6px;text-align:center;">'+escapeHtml(codes||'-')+'</td><td style="padding:6px;text-align:center;"><span style="font-size:10px;padding:2px 6px;border-radius:4px;'+(x.isBlanc?'background:#f59e0b;color:white;':'background:#e5e7eb;')+'">'+x.type+'</span></td></tr>';
    });
    h+='</table></div>';
  }
  
  if(m.blancs.length>0){
    h+='<div class="section-title mt-12">Blancs terrain ('+m.blancs.length+')</div>';
    m.blancs.forEach(function(b,i){
      h+='<div class="card" style="padding:10px;background:#fef3c7;margin-bottom:8px;"><div style="display:flex;justify-content:space-between;align-items:center;"><div><strong>'+escapeHtml(b.ref)+'</strong><div style="font-size:12px;color:#666;">'+escapeHtml(b.agents.join(', '))+' • '+escapeHtml(b.date||'Sans date')+'</div></div><button class="btn btn-danger btn-small" onclick="deleteBlanc('+i+');">'+ICONS.trash+'</button></div></div>';
    });
  }
  
  if(state.showModal==='addBlanc')h+=renderAddBlancModal();
  return h;
}

// FIX #3: Modal blanc avec recherche corrigée
function renderAddBlancModal(){
  var h='<div class="modal show" onclick="if(event.target===this){state.showModal=null;render();}"><div class="modal-content"><div class="modal-header"><h2>+ Blanc terrain</h2><button class="close-btn" onclick="state.showModal=null;render();">×</button></div>';
  h+='<div class="field"><label class="label">Référence échantillon *</label><input type="text" class="input" id="blanc-ref" placeholder="Ex: BT-001" value="'+escapeHtml(state.blancRef||'')+'" oninput="state.blancRef=this.value;"></div>';
  h+='<div class="field"><label class="label">Date</label><input type="date" class="input" id="blanc-date" value="'+(state.blancDate||'')+'" oninput="state.blancDate=this.value;"></div>';
  h+='<div class="field"><label class="label">Agent(s) chimique(s)</label><input type="text" class="input" id="blanc-agent-search" placeholder="Rechercher..." value="'+escapeHtml(state.blancAgentSearch||'')+'" oninput="handleBlancAgentSearch(this.value);"></div>';
  h+='<div id="blanc-search-results">';
  if(state.blancAgentSearch&&state.blancAgentSearch.length>=2){
    var r=searchAgentsDB(state.blancAgentSearch).slice(0,6);
    if(r.length>0){
      h+='<div class="search-results" style="max-height:120px;overflow-y:auto;">';
      r.forEach(function(x){
        var already=state.blancAgents&&state.blancAgents.indexOf(x)!==-1;
        h+='<div class="search-result-item" style="'+(already?'opacity:0.5;':'')+'" onmousedown="event.preventDefault();" onclick="'+(already?'':'addBlancAgent(\''+escapeJs(x)+'\');')+'">'+escapeHtml(x)+(already?' ✓':'')+'</div>';
      });
      h+='</div>';
    }
  }
  h+='</div>';
  if(state.blancAgents&&state.blancAgents.length>0){
    h+='<div class="info-box mt-8"><strong>Agents sélectionnés :</strong><div style="margin-top:4px;">';
    state.blancAgents.forEach(function(a,i){
      h+='<span style="display:inline-block;background:#e5e7eb;padding:2px 8px;border-radius:4px;margin:2px;font-size:12px;">'+escapeHtml(a)+' <span style="cursor:pointer;color:#ef4444;" onclick="removeBlancAgent('+i+');">×</span></span>';
    });
    h+='</div></div>';
    // Avertissements si débits ou codes prétraitement différents
    var blancWarnings=checkBlancWarnings(state.blancAgents);
    if(blancWarnings.length>0){
      blancWarnings.forEach(function(w){
        h+='<div class="blanc-warning">'+escapeHtml(w)+'</div>';
      });
    }
  }
  h+='<div class="row mt-12"><button class="btn btn-gray" onclick="state.showModal=null;render();">Annuler</button><button class="btn btn-success" onclick="saveBlanc();">Ajouter</button></div></div></div>';
  return h;
}

// FIX #3: Handler de recherche blanc sans render() complet
function handleBlancAgentSearch(value){
  state.blancAgentSearch=value;
  updateBlancSearchResults();
}

function updateBlancSearchResults(){
  var container=document.getElementById('blanc-search-results');
  if(!container)return;
  var h='';
  if(state.blancAgentSearch&&state.blancAgentSearch.length>=2){
    var r=searchAgentsDB(state.blancAgentSearch).slice(0,6);
    if(r.length>0){
      h+='<div class="search-results" style="max-height:120px;overflow-y:auto;">';
      r.forEach(function(x){
        var already=state.blancAgents&&state.blancAgents.indexOf(x)!==-1;
        h+='<div class="search-result-item" style="'+(already?'opacity:0.5;':'')+'" onmousedown="event.preventDefault();" onclick="'+(already?'':'addBlancAgent(\''+escapeJs(x)+'\');')+'">'+escapeHtml(x)+(already?' ✓':'')+'</div>';
      });
      h+='</div>';
    }
  }
  container.innerHTML=h;
}

function addBlancAgent(name){
  if(!state.blancAgents)state.blancAgents=[];
  if(state.blancAgents.indexOf(name)===-1)state.blancAgents.push(name);
  state.blancAgentSearch='';
  render();
}

function removeBlancAgent(i){
  if(state.blancAgents)state.blancAgents.splice(i,1);
  render();
}

function checkBlancWarnings(agents){
  if(!agents||agents.length<=1)return[];
  var warnings=[];
  var debits={};
  var codesPretrait={};
  agents.forEach(function(an){
    var ag=getAgentFromDB(an);
    if(ag){
      var d8=ag['débit max  8h (L/min)']||ag['débit max 8h (L/min)']||'';
      var cp=ag['Code prétraitement']||'';
      if(d8)debits[d8]=(debits[d8]||[]).concat([an]);
      if(cp)codesPretrait[cp]=(codesPretrait[cp]||[]).concat([an]);
    }
  });
  if(Object.keys(debits).length>1){
    warnings.push('⚠️ Débits différents : '+Object.keys(debits).map(function(d){return d+' L/min ('+debits[d].join(', ')+')';}).join(' vs '));
  }
  if(Object.keys(codesPretrait).length>1){
    warnings.push('⚠️ Codes prétraitement différents : '+Object.keys(codesPretrait).map(function(c){return c+' ('+codesPretrait[c].join(', ')+')';}).join(' vs '));
  }
  return warnings;
}

function saveBlanc(){
  var ref=(state.blancRef||'').trim();
  var date=state.blancDate||'';
  if(!ref){alert('Saisissez une référence');return;}
  if(!state.blancAgents||state.blancAgents.length===0){alert('Sélectionnez au moins un agent');return;}
  var m=getCurrentMission();if(!m)return;
  if(!m.blancs)m.blancs=[];
  m.blancs.push({ref:ref,date:date,agents:state.blancAgents.slice()});
  saveData('vlep_missions_v3',state.missions);
  state.showModal=null;
  state.blancAgents=[];
  state.blancRef='';
  state.blancDate='';
  render();
}

function deleteBlanc(i){
  var m=getCurrentMission();
  if(!m||!confirm('Supprimer ce blanc ?'))return;
  m.blancs.splice(i,1);
  saveData('vlep_missions_v3',state.missions);
  render();
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORT EXCEL - Structure support REG/NON REG COMPLÈTE
// © 2025 Quentin THOMAS
// Inclut : Conditions ambiantes, Débits I/F, Type 8h/CT, Blancs
// ═══════════════════════════════════════════════════════════════════════════════

function exportExcel(){
  var m=getCurrentMission();
  if(!m){alert('Aucune mission');return;}
  
  var wb=XLSX.utils.book_new();
  
  // Séparer les prélèvements REG et NON-REG
  var regPrels=[];
  var nonRegPrels=[];
  
  m.prelevements.forEach(function(p){
    p.subPrelevements.forEach(function(sb,si){
      p.agents.forEach(function(a){
        var prelData={
          prel:p,
          sub:sb,
          subIdx:si,
          agent:a.name,
          gehName:p.gehName,
          gehNum:p.gehNum,
          type:p.type,
          isReg:p.isReglementaire
        };
        
        if(p.isReglementaire){
          regPrels.push(prelData);
        }else{
          nonRegPrels.push(prelData);
        }
      });
    });
  });
  
  // Trier par GEH puis agent
  var sortByGehAgent=function(a,b){
    if(a.gehNum!==b.gehNum)return a.gehNum-b.gehNum;
    return a.agent.localeCompare(b.agent);
  };
  
  regPrels.sort(sortByGehAgent);
  nonRegPrels.sort(sortByGehAgent);
  
  // Créer la feuille REG
  if(regPrels.length>0){
    var wsReg=createRegSheet(m,regPrels);
    XLSX.utils.book_append_sheet(wb,wsReg,'REG');
  }
  
  // Créer la feuille NON REG
  if(nonRegPrels.length>0){
    var wsNonReg=createNonRegSheet(m,nonRegPrels);
    XLSX.utils.book_append_sheet(wb,wsNonReg,'NON REG');
  }
  
  // Créer la feuille Échantillons
  var wsEchantillons=createEchantillonsSheet(m,regPrels,nonRegPrels);
  XLSX.utils.book_append_sheet(wb,wsEchantillons,'Échantillons');
  
  // Créer la feuille Relevé d'activité
  var wsActivite=createActiviteSheet(m);
  XLSX.utils.book_append_sheet(wb,wsActivite,'Relevé activité');
  
  var fn=(m.clientSite||'Mission').replace(/[^a-zA-Z0-9àâäéèêëïîôùûüç\\s-]/g,'')+'_supports.xlsx';
  XLSX.writeFile(wb,fn);
  alert('Export terminé : '+fn);
}

console.log('✓ Échantillons chargé');
