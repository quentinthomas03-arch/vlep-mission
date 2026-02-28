// import-export.js - Import/Export JSON et QR Code
// Â© 2025 Quentin THOMAS
// Sauvegarde/restauration missions, partage QR

// ===== EXPORT / IMPORT MISSION JSON =====
function exportMissionJSON(id){
  var m=state.missions.find(function(x){return x.id===id;});
  if(!m){alert('Mission introuvable');return;}
  var exportData={_format:'VLEP_Mission_JSON',_version:'3.6',_exportDate:new Date().toISOString(),_author:'Quentin THOMAS',mission:JSON.parse(JSON.stringify(m))};
  var json=JSON.stringify(exportData,null,2);
  var blob=new Blob([json],{type:'application/json'});
  var url=URL.createObjectURL(blob);
  var a=document.createElement('a');
  var safeName=(m.clientSite||'mission').replace(/[^a-zA-Z0-9àâäéèêëïîôùûüçÀÂÄÉÈÊËÏÎÃ”ÙÛÜÇ _-]/g,'').replace(/\s+/g,'_').substring(0,40);
  a.href=url;
  a.download='VLEP_Mission_'+safeName+'_'+String(m.id).slice(-6)+'.json';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function triggerImportMission(){
  var input=document.getElementById('import-mission-input');
  if(!input){
    input=document.createElement('input');
    input.type='file';
    input.accept='.json';
    input.style.display='none';
    input.id='import-mission-input';
    input.onchange=handleImportMission;
    document.body.appendChild(input);
  }
  input.value='';
  input.click();
}

function handleImportMission(event){
  var file=event.target?event.target.files[0]:null;
  if(!file)return;
  if(!file.name.endsWith('.json')){alert('Veuillez sélectionner un fichier .json');return;}
  var reader=new FileReader();
  reader.onload=function(e){
    importMissionFromText(e.target.result);
  };
  reader.readAsText(file);
}

function importMissionFromText(text){
  try{
    var data=JSON.parse(text);
    var mission=null;
    // Format standard
    if(data._format==='VLEP_Mission_JSON'&&data.mission){
      mission=data.mission;
    // Format QR code compact
    }else if(data._f==='VLEP'&&data.m){
      mission=data.m;
    // Format brut
    }else if(data.id&&data.gehs&&data.agents!==undefined){
      mission=data;
    }else{
      alert('Format non reconnu.\n\nAssurez-vous d\'importer des données VLEP Mission.');
      return;
    }
    // Vérifier si la mission existe déjà
    var exists=state.missions.some(function(m){return m.id===mission.id;});
    if(exists){
      if(!confirm('Une mission avec le même identifiant existe déjà.\n\nVoulez-vous l\'écraser ?'))return;
      state.missions=state.missions.filter(function(m){return m.id!==mission.id;});
    }
    state.missions.push(mission);
    saveData('vlep_missions_v3',state.missions);
    repairMissions();
    state.showModal=null;
    render();
    var name=mission.clientSite||'Sans nom';
    var pCount=0;
    if(mission.prelevements)mission.prelevements.forEach(function(p){if(p.subPrelevements)pCount+=p.subPrelevements.length;});
    var aCount=mission.agents?mission.agents.length:0;
    var gCount=mission.gehs?mission.gehs.filter(function(g){return g.name;}).length:0;
    alert('Mission importée avec succès !\n\n'+name+'\n'+gCount+' GEH • '+aCount+' agents • '+pCount+' sous-prélèvements\n\nStatut : '+(mission.status==='prepa'?'En préparation':(mission.status==='validee'?'Validée':(mission.status==='encours'?'En cours':'Terminée'))));
  }catch(err){
    alert('Erreur lors de l\'import :\n\n'+err.message+'\n\nVérifiez que les données sont valides.');
  }
}

// ===== QR CODE PARTAGE =====
function showQRCodeModal(id){
  state.qrMissionId=id;
  state.showModal='qrCode';
  render();
  // Générer le QR code après le render (pour que le DOM soit prêt)
  setTimeout(function(){generateQRCode(id);},100);
}

function renderQRCodeModal(){
  var m=state.missions.find(function(x){return x.id===state.qrMissionId;});
  if(!m)return'';
  
  var missionJson=JSON.stringify({_format:'VLEP_Mission_JSON',_version:'3.6',mission:JSON.parse(JSON.stringify(m))});
  var dataSize=missionJson.length;
  var isTooBig=dataSize>2500;
  
  var h='<div class="modal show" onclick="if(event.target===this){state.showModal=null;render();}"><div class="modal-content" style="text-align:center;"><div class="modal-header"><h2>'+ICONS.share+' Partager la mission</h2><button class="close-btn" onclick="state.showModal=null;render();">×</button></div>';
  
  h+='<div style="font-weight:700;font-size:14px;margin-bottom:4px;">'+escapeHtml(m.clientSite||'Mission')+'</div>';
  h+='<div style="font-size:11px;color:var(--text-muted);margin-bottom:12px;">'+m.gehs.filter(function(g){return g.name;}).length+' GEH • '+m.agents.length+' agents • Taille: '+(dataSize/1024).toFixed(1)+' Ko</div>';
  
  if(isTooBig){
    h+='<div class="info-box info-box-warning" style="text-align:left;"><p><strong>Mission trop volumineuse pour un QR code</strong></p><p style="font-size:11px;margin-top:4px;">Taille: '+(dataSize/1024).toFixed(1)+' Ko (max ~2.5 Ko pour un QR code)</p><p style="font-size:11px;margin-top:2px;">Utilisez l\'export JSON à la place.</p></div>';
  }else{
    h+='<div id="qr-container" style="display:flex;justify-content:center;margin:16px 0;"></div>';
    h+='<div style="font-size:11px;color:var(--text-muted);margin-bottom:8px;">Scannez ce QR code depuis un autre téléphone<br>avec VLEP Mission ouvert</div>';
  }
  
  h+='<div class="row mt-12">';
  h+='<button class="btn btn-gray" onclick="state.showModal=null;render();">Fermer</button>';
  if(!isTooBig){
    h+='<button class="btn btn-primary" onclick="downloadQRImage();">'+ICONS.download+' Sauver image</button>';
  }
  h+='<button class="btn btn-gray" onclick="state.showModal=null;exportMissionJSON('+m.id+');">'+ICONS.download+' JSON</button>';
  h+='</div>';
  
  h+='</div></div>';
  return h;
}

function generateQRCode(id){
  var container=document.getElementById('qr-container');
  if(!container)return;
  
  var m=state.missions.find(function(x){return x.id===id;});
  if(!m)return;
  
  // Compresser les données en retirant les champs inutiles pour le transfert
  var missionCopy=JSON.parse(JSON.stringify(m));
  // Nettoyer pour réduire la taille
  if(missionCopy.agentColors)delete missionCopy.agentColors;
  
  var json=JSON.stringify({_f:'VLEP',_v:'3.6',m:missionCopy});
  
  if(json.length>2500){
    container.innerHTML='<div style="color:var(--danger);font-size:12px;padding:20px;">Données trop volumineuses pour un QR code ('+(json.length/1024).toFixed(1)+' Ko)</div>';
    return;
  }
  
  container.innerHTML='';
  try{
    new QRCode(container,{
      text:json,
      width:256,
      height:256,
      colorDark:'#1a1a2e',
      colorLight:'#ffffff',
      correctLevel:QRCode.CorrectLevel.L
    });
  }catch(e){
    container.innerHTML='<div style="color:var(--danger);font-size:12px;padding:20px;">Erreur génération QR: '+escapeHtml(e.message)+'</div>';
  }
}

function downloadQRImage(){
  var container=document.getElementById('qr-container');
  if(!container)return;
  var canvas=container.querySelector('canvas');
  if(!canvas){
    // Essayer avec l'image
    var img=container.querySelector('img');
    if(img){
      var a=document.createElement('a');
      a.href=img.src;
      a.download='VLEP_QR_Mission.png';
      a.click();
    }
    return;
  }
  var a=document.createElement('a');
  a.href=canvas.toDataURL('image/png');
  a.download='VLEP_QR_Mission.png';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

// Import depuis QR code (via scan camera ou collage texte)
function renderImportQRModal(){
  var h='<div class="modal show" onclick="if(event.target===this){state.showModal=null;render();}"><div class="modal-content"><div class="modal-header"><h2>'+ICONS.share+' Importer via QR / Texte</h2><button class="close-btn" onclick="state.showModal=null;render();">×</button></div>';
  
  h+='<div class="info-box"><p><strong>Comment ça marche :</strong></p><p style="font-size:11px;margin-top:4px;">1. Scannez le QR code avec l\'appareil photo de votre téléphone</p><p style="font-size:11px;">2. Copiez le texte obtenu</p><p style="font-size:11px;">3. Collez-le ci-dessous</p></div>';
  
  h+='<div class="field mt-12"><label class="label">Données de la mission (JSON)</label><textarea class="input" id="import-qr-text" rows="6" placeholder="Collez ici le contenu du QR code..." style="font-size:11px;font-family:monospace;"></textarea></div>';
  
  h+='<div class="row"><button class="btn btn-gray" onclick="state.showModal=null;render();">Annuler</button><button class="btn btn-success" onclick="doImportQR();">'+ICONS.check+' Importer</button></div>';
  
  h+='</div></div>';
  return h;
}

function doImportQR(){
  var textarea=document.getElementById('import-qr-text');
  var text=textarea?textarea.value.trim():'';
  if(!text){alert('Collez les données de la mission');return;}
  importMissionFromText(text);
}


console.log('âœ“ Import/Export chargé');
