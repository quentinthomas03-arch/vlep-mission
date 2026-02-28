// export-excel.js - Export Excel et validation
// © 2025 Quentin THOMAS
// Validation pré-export, création fichier Excel (3 feuilles)

function createRegSheet(m,prels){
  var aoa=[];
  
  // Lignes 1-3 : En-tête
  aoa.push(['Support Reg','CONTRÔLE REGLEMENTAIRE']);
  aoa.push(['22','PRELEVEMENTS SUR SUPPORT']);
  aoa.push([]);
  
  // Ligne 4-5 : Préleveur et site
  aoa.push(['nom du préleveur','',m.preleveur||'']);
  aoa.push(['site','',m.clientSite||'']);
  
  // Ligne 6 : GEH
  var row6=['GEH',''];
  for(var i=0;i<prels.length;i++){
    var p=prels[i];
    row6.push(p.gehNum+' - '+p.gehName);
    row6.push('');
  }
  aoa.push(row6);
  
  // Ligne 7 : opérateur
  var row7=['opérateur',''];
  for(var i=0;i<prels.length;i++){
    row7.push(prels[i].sub.operateur||'');
    row7.push('');
  }
  aoa.push(row7);
  
  // Ligne 8 : agent chimique
  var row8=['agent chimique',''];
  for(var i=0;i<prels.length;i++){
    row8.push(prels[i].agent);
    row8.push('');
  }
  aoa.push(row8);
  
  // Ligne 9 : Matériel de prélèvement
  aoa.push(['Matériel de mesure','']);
  
  // Lignes 10-11 : pompe + débitmètre
  var row10=['n° d\'identification','pompe'];
  var row11=['','Débimetre'];
  for(var i=0;i<prels.length;i++){
    var ad=prels[i].sub.agentData?prels[i].sub.agentData[prels[i].agent]:null;
    row10.push(ad&&ad.numPompe?ad.numPompe:'');
    row10.push('');
    row11.push(m.debitmetre||'');
    row11.push('');
  }
  aoa.push(row10);
  aoa.push(row11);
  
  // Ligne 12 : Support
  var row12=['Support','nature et marque'];
  for(var i=0;i<prels.length;i++){
    var ag=getAgentFromDB(prels[i].agent);
    var support=ag?(ag['Support de prélèvement']||''):'';
    row12.push(support);
    row12.push('');
  }
  aoa.push(row12);
  
  // Ligne 13 : Plages horaires
  aoa.push(['Plages horaires de prélèvement, durée du','']);
  
  // Ligne 14 : date
  var row14=['date de prélèvement',''];
  for(var i=0;i<prels.length;i++){
    row14.push(formatDateFR(prels[i].sub.date)||'');
    row14.push('');
  }
  aoa.push(row14);
  
  // Lignes 15-24 : 5 plages horaires (2 lignes chacune)
  for(var plageNum=1;plageNum<=5;plageNum++){
    var rowDebut=['plage n°'+plageNum,'heure début n°C'+plageNum+'-P'+plageNum+'_'];
    var rowFin=['','heure fin n°C'+plageNum+'-P'+plageNum+'_'];
    
    for(var i=0;i<prels.length;i++){
      var plages=prels[i].sub.plages||[];
      var plage=plages[plageNum-1];
      
      rowDebut.push(plage&&plage.debut?plage.debut:'');
      rowDebut.push('');
      rowFin.push(plage&&plage.fin?plage.fin:'');
      rowFin.push('');
    }
    
    aoa.push(rowDebut);
    aoa.push(rowFin);
  }
  
  // Ligne 25 : durée du prélèvement (vide)
  var row25=['durée du prélèvement (h)',''];
  for(var i=0;i<prels.length;i++){
    row25.push('');
    row25.push('');
  }
  aoa.push(row25);
  
  // Ligne 26 : durée d'exposition (vide)
  var row26=['durée d\'exposition (h:min) - VLEP 8h',''];
  for(var i=0;i<prels.length;i++){
    row26.push('');
    row26.push('');
  }
  aoa.push(row26);
  
  // Ligne 27 : durée d'exposition VLEP (vide)
  var row27=['durée d\'exposition - VLEP 8h',''];
  for(var i=0;i<prels.length;i++){
    row27.push('');
    row27.push('');
  }
  aoa.push(row27);
  
  // Ligne 28 : Prise en compte des EPI
  aoa.push(['Prise en compte des Equipements de Protection Individuelle','']);
  
  // Ligne 29 : type EPI (vide)
  var row29=['type d\'EPI',''];
  for(var i=0;i<prels.length;i++){
    row29.push('');
    row29.push('');
  }
  aoa.push(row29);
  
  // Ligne 30 : facteur de protection (vide)
  var row30=['facteur de protection assigné (FPA)',''];
  for(var i=0;i<prels.length;i++){
    row30.push('');
    row30.push('');
  }
  aoa.push(row30);
  
  // Ligne 31 : durée de port EPI (vide)
  var row31=['durée de port de l\'EPI (min)',''];
  for(var i=0;i<prels.length;i++){
    row31.push('');
    row31.push('');
  }
  aoa.push(row31);
  
  // Ligne 32 : Conditions ambiantes
  aoa.push(['Conditions ambiantes lors des prélèvements','']);
  
  // Lignes 33-35 : Température (initiale, finale, moyenne)
  var row33=['température ambiante (°C)','initiale'];
  var row34=['','finale'];
  var row35=['','moyenne'];
  for(var i=0;i<prels.length;i++){
    var cond=getConditionsForPrel(m,prels[i].sub);
    row33.push(cond&&cond.tempI?cond.tempI:'');
    row33.push('');
    row34.push(cond&&cond.tempF?cond.tempF:'');
    row34.push('');
    row35.push(''); // moyenne calculée après
    row35.push('');
  }
  aoa.push(row33);
  aoa.push(row34);
  aoa.push(row35);
  
  // Lignes 36-38 : Pression (initiale, finale, moyenne)
  var row36=['pression atmosphérique (hPa)','initiale'];
  var row37=['','finale'];
  var row38=['','moyenne'];
  for(var i=0;i<prels.length;i++){
    var cond=getConditionsForPrel(m,prels[i].sub);
    row36.push(cond&&cond.pressionI?cond.pressionI:'');
    row36.push('');
    row37.push(cond&&cond.pressionF?cond.pressionF:'');
    row37.push('');
    row38.push('');
    row38.push('');
  }
  aoa.push(row36);
  aoa.push(row37);
  aoa.push(row38);
  
  // Lignes 39-41 : Humidité (initiale, finale, moyenne)
  var row39=['humidité relative (%)','initiale'];
  var row40=['','finale'];
  var row41=['','moyenne'];
  for(var i=0;i<prels.length;i++){
    var cond=getConditionsForPrel(m,prels[i].sub);
    row39.push(cond&&cond.humiditeI?cond.humiditeI:'');
    row39.push('');
    row40.push(cond&&cond.humiditeF?cond.humiditeF:'');
    row40.push('');
    row41.push('');
    row41.push('');
  }
  aoa.push(row39);
  aoa.push(row40);
  aoa.push(row41);
  
  // Ligne 42 : Pression de saturation (vide)
  var row42=['pression de saturation de la vapeur d\'eau (Pa)',''];
  for(var i=0;i<prels.length;i++){
    row42.push('');
    row42.push('');
  }
  aoa.push(row42);
  
  // Ligne 43 : Volume prélevé
  aoa.push(['Volume prélevé','']);
  
  // Ligne 44 : Vérification débit
  aoa.push(['Volume prélevé avec pompe - Vérification du débit','']);
  
  // Lignes 45-46 : Débits initial et final
  var row45=['débit initial de la pompe (L/min) DM',''];
  var row46=['débit final de la pompe (L/min) DM',''];
  for(var i=0;i<prels.length;i++){
    var ad=prels[i].sub.agentData?prels[i].sub.agentData[prels[i].agent]:null;
    row45.push(ad&&ad.debitInitial?ad.debitInitial:'');
    row45.push('');
    row46.push(ad&&ad.debitFinal?ad.debitFinal:'');
    row46.push('');
  }
  aoa.push(row45);
  aoa.push(row46);
  
  // Lignes 47-48 : Débit moyen et volume (vides, calculés après)
  var row47=['débit moyen de la pompe (L/min)',''];
  var row48=['volume prélevé (L)',''];
  for(var i=0;i<prels.length;i++){
    row47.push('');
    row47.push('');
    row48.push('');
    row48.push('');
  }
  aoa.push(row47);
  aoa.push(row48);
  
  // Lignes 49-56 : Vérification DLS (vides)
  for(var lnum=49;lnum<=56;lnum++){
    var rowEmpty=['',''];
    for(var i=0;i<prels.length;i++){
      rowEmpty.push('');
      rowEmpty.push('');
    }
    aoa.push(rowEmpty);
  }
  
  // Ligne 57 : Résultats labo
  aoa.push(['Résultats du laboratoire d\'analyse','']);
  
  // Lignes 58-62 : Nom labo, réf échantillon, masse, incertitude
  var row58=['nom du laboratoire',''];
  var row59=['référence de l\'échantillon',''];
  for(var i=0;i<prels.length;i++){
    row58.push('');
    row58.push('');
    var ad=prels[i].sub.agentData?prels[i].sub.agentData[prels[i].agent]:null;
    row59.push(ad&&ad.refEchantillon?ad.refEchantillon:'');
    row59.push('');
  }
  aoa.push(row58);
  aoa.push(row59);
  
  // Lignes 60-62 : masse et incertitude (vides)
  for(var lnum=60;lnum<=62;lnum++){
    var rowEmpty=['',''];
    for(var i=0;i<prels.length;i++){
      rowEmpty.push('');
      rowEmpty.push('');
    }
    aoa.push(rowEmpty);
  }
  
  // Ligne 63 : RESULTATS
  aoa.push(['RESULTATS','']);
  
  // Lignes 64-69 : GEH, type VLEP, opérateur, agent, réf, date
  var row64=['GEH',''];
  var row65=['type de VLEP',''];
  var row66=['opérateur',''];
  var row67=['agent chimique',''];
  var row68=['référence de l\'échantillon',''];
  var row69=['date du prélèvement',''];
  
  for(var i=0;i<prels.length;i++){
    var p=prels[i];
    row64.push(p.gehNum+' - '+p.gehName);
    row64.push('');
    row65.push(p.type); // 8h ou CT
    row65.push('');
    row66.push(p.sub.operateur||'');
    row66.push('');
    row67.push(p.agent);
    row67.push('');
    var ad=p.sub.agentData?p.sub.agentData[p.agent]:null;
    row68.push(ad&&ad.refEchantillon?ad.refEchantillon:'');
    row68.push('');
    row69.push(formatDateFR(p.sub.date)||'');
    row69.push('');
  }
  aoa.push(row64);
  aoa.push(row65);
  aoa.push(row66);
  aoa.push(row67);
  aoa.push(row68);
  aoa.push(row69);
  
  // Lignes 70-78 : Durée, résultats, EPI, exposition, VLEP, commentaire (vides)
  for(var lnum=70;lnum<=78;lnum++){
    var rowEmpty=['',''];
    for(var i=0;i<prels.length;i++){
      rowEmpty.push('');
      rowEmpty.push('');
    }
    aoa.push(rowEmpty);
  }
  
  // Ligne 79 : Validation des prélèvements
  aoa.push(['Validation des prélèvements','']);
  
  // Ligne 80 : Variation débit (vide)
  var row80=['Variation du débit avant et après prélèvement (< 5%)',''];
  for(var i=0;i<prels.length;i++){
    row80.push('');
    row80.push('');
  }
  aoa.push(row80);
  
  // Ligne 81 : Référence témoin (blanc)
  var row81=["référence du témoin",''];
  for(var i=0;i<prels.length;i++){
    var blancRef=getBlancForAgent(m,prels[i].agent);
    row81.push(blancRef);
    row81.push('');
  }
  aoa.push(row81);
  
  // Lignes 82-84 : masse témoin, concentration blanc, critère (vides)
  for(var lnum=82;lnum<=84;lnum++){
    var rowEmpty=['',''];
    for(var i=0;i<prels.length;i++){
      rowEmpty.push('');
      rowEmpty.push('');
    }
    aoa.push(rowEmpty);
  }
  
  // Créer la feuille
  var ws=XLSX.utils.aoa_to_sheet(aoa);
  
  // Ajouter les fusions de cellules
  if(!ws['!merges'])ws['!merges']=[];
  
  // Fusions en-tête
  ws['!merges'].push({s:{r:0,c:1},e:{r:0,c:13}});
  ws['!merges'].push({s:{r:1,c:1},e:{r:1,c:13}});
  ws['!merges'].push({s:{r:3,c:2},e:{r:3,c:13}});
  ws['!merges'].push({s:{r:4,c:2},e:{r:4,c:13}});
  
  // Fusions A-B
  ws['!merges'].push({s:{r:9,c:0},e:{r:10,c:0}});
  for(var plageNum=0;plageNum<5;plageNum++){
    var startRow=14+plageNum*2;
    ws['!merges'].push({s:{r:startRow,c:0},e:{r:startRow+1,c:0}});
  }
  ws['!merges'].push({s:{r:32,c:0},e:{r:34,c:0}});
  ws['!merges'].push({s:{r:35,c:0},e:{r:37,c:0}});
  ws['!merges'].push({s:{r:38,c:0},e:{r:40,c:0}});
  
  // Fusions colonnes prélèvements (C-D, E-F, etc.)
  var fuseRows=[5,6,7,9,10,11,13,25,26,27,28,29,30,32,33,34,35,36,37,38,39,40,41,44,45,46,47,48,58,59,63,64,65,66,67,68,69,80,81];
  for(var ri=0;ri<fuseRows.length;ri++){
    var row=fuseRows[ri];
    for(var i=0;i<prels.length;i++){
      var startCol=2+i*2;
      ws['!merges'].push({s:{r:row,c:startCol},e:{r:row,c:startCol+1}});
    }
  }
  
  // Fusions plages horaires
  for(var plageNum=0;plageNum<5;plageNum++){
    for(var i=0;i<prels.length;i++){
      var startRow=14+plageNum*2;
      var startCol=2+i*2;
      ws['!merges'].push({s:{r:startRow,c:startCol},e:{r:startRow,c:startCol+1}});
      ws['!merges'].push({s:{r:startRow+1,c:startCol},e:{r:startRow+1,c:startCol+1}});
    }
  }
  
  // Largeurs de colonnes
  var cols=[{wch:50},{wch:20}];
  for(var i=0;i<prels.length;i++){
    cols.push({wch:15});
    cols.push({wch:15});
  }
  ws['!cols']=cols;
  
  return ws;
}

function createNonRegSheet(m,prels){
  var aoa=[];
  
  // Ligne 1-2 : préleveur et site
  aoa.push(['nom du préleveur','',m.preleveur||'']);
  aoa.push(['site','',m.clientSite||'']);
  aoa.push(['Matériel de mesure','']);
  
  // Ligne 4 : Prélèvement n°
  var row4=['Prélèvement n°',''];
  for(var i=0;i<prels.length;i++){
    row4.push(i+1);
    row4.push('');
  }
  aoa.push(row4);
  
  // Ligne 5 : agent chimique
  var row5=['agent chimique',''];
  for(var i=0;i<prels.length;i++){
    row5.push(prels[i].agent);
    row5.push('');
  }
  aoa.push(row5);
  
  // Lignes 6-7 : pompe + débitmètre
  var row6=['n° d\'identification','pompe'];
  var row7=['','débitmètre'];
  for(var i=0;i<prels.length;i++){
    var ad=prels[i].sub.agentData?prels[i].sub.agentData[prels[i].agent]:null;
    row6.push(ad&&ad.numPompe?ad.numPompe:'');
    row6.push('');
    row7.push(m.debitmetre||'');
    row7.push('');
  }
  aoa.push(row6);
  aoa.push(row7);
  
  // Ligne 8 : Support
  var row8=['Support','nature et marque'];
  for(var i=0;i<prels.length;i++){
    var ag=getAgentFromDB(prels[i].agent);
    var support=ag?(ag['Support de prélèvement']||''):'';
    row8.push(support);
    row8.push('');
  }
  aoa.push(row8);
  
  // Ligne 9 : Plages horaires
  aoa.push(['Plages horaires de prélèvement, durée du','']);
  
  // Ligne 10 : Prélèvement n° (répété)
  var row10=['Prélèvement n°',''];
  for(var i=0;i<prels.length;i++){
    row10.push(i+1);
    row10.push('');
  }
  aoa.push(row10);
  
  // Ligne 11 : date
  var row11=['date de prélèvement',''];
  for(var i=0;i<prels.length;i++){
    row11.push(formatDateFR(prels[i].sub.date)||'');
    row11.push('');
  }
  aoa.push(row11);
  
  // Lignes 12-31 : 10 plages horaires (2 lignes chacune)
  for(var plageNum=1;plageNum<=10;plageNum++){
    var rowDebut=['plage n°'+plageNum,'heure début n°C'+plageNum+'-P'+plageNum+'_'];
    var rowFin=['','heure fin n°C'+plageNum+'-P'+plageNum+'_'];
    
    for(var i=0;i<prels.length;i++){
      var plages=prels[i].sub.plages||[];
      var plage=plages[plageNum-1];
      
      rowDebut.push(plage&&plage.debut?plage.debut:'');
      rowDebut.push('');
      rowFin.push(plage&&plage.fin?plage.fin:'');
      rowFin.push('');
    }
    
    aoa.push(rowDebut);
    aoa.push(rowFin);
  }
  
  // Lignes 32-39 : Durées, exposition, EPI (vides)
  for(var lnum=32;lnum<=39;lnum++){
    var rowEmpty=['',''];
    for(var i=0;i<prels.length;i++){
      rowEmpty.push('');
      rowEmpty.push('');
    }
    aoa.push(rowEmpty);
  }
  
  // Ligne 40 : Conditions ambiantes
  aoa.push(['Conditions ambiantes lors des prélèvements','']);
  
  // Ligne 41 : Prélèvement n°
  var row41=['Prélèvement n°',''];
  for(var i=0;i<prels.length;i++){
    row41.push(i+1);
    row41.push('');
  }
  aoa.push(row41);
  
  // Lignes 42-44 : Température
  var row42=['température ambiante (°C)','initiale'];
  var row43=['','finale'];
  var row44=['','moyenne'];
  for(var i=0;i<prels.length;i++){
    var cond=getConditionsForPrel(m,prels[i].sub);
    row42.push(cond&&cond.tempI?cond.tempI:'');
    row42.push('');
    row43.push(cond&&cond.tempF?cond.tempF:'');
    row43.push('');
    row44.push('');
    row44.push('');
  }
  aoa.push(row42);
  aoa.push(row43);
  aoa.push(row44);
  
  // Lignes 45-47 : Pression
  var row45=['pression atmosphérique (hPa)','initiale'];
  var row46=['','finale'];
  var row47=['','moyenne'];
  for(var i=0;i<prels.length;i++){
    var cond=getConditionsForPrel(m,prels[i].sub);
    row45.push(cond&&cond.pressionI?cond.pressionI:'');
    row45.push('');
    row46.push(cond&&cond.pressionF?cond.pressionF:'');
    row46.push('');
    row47.push('');
    row47.push('');
  }
  aoa.push(row45);
  aoa.push(row46);
  aoa.push(row47);
  
  // Lignes 48-50 : Humidité
  var row48=['humidité relative (%)','initiale'];
  var row49=['','finale'];
  var row50=['','moyenne'];
  for(var i=0;i<prels.length;i++){
    var cond=getConditionsForPrel(m,prels[i].sub);
    row48.push(cond&&cond.humiditeI?cond.humiditeI:'');
    row48.push('');
    row49.push(cond&&cond.humiditeF?cond.humiditeF:'');
    row49.push('');
    row50.push('');
    row50.push('');
  }
  aoa.push(row48);
  aoa.push(row49);
  aoa.push(row50);
  
  // Ligne 51 : Pression saturation (vide)
  var row51=['pression de saturation de la vapeur d\'eau (Pa)',''];
  for(var i=0;i<prels.length;i++){
    row51.push('');
    row51.push('');
  }
  aoa.push(row51);
  
  // Ligne 52 : Volume prélevé
  aoa.push(['Volume prélevé','']);
  
  // Ligne 53 : Prélèvement n°
  var row53=['Prélèvement n°',''];
  for(var i=0;i<prels.length;i++){
    row53.push(i+1);
    row53.push('');
  }
  aoa.push(row53);
  
  // Ligne 54 : Vérification débit
  aoa.push(['Volume prélevé avec pompe - Vérification du débit','']);
  
  // Lignes 55-56 : Débits initial et final
  var row55=['débit initial de la pompe (L/min)',''];
  var row56=['débit final de la pompe (L/min)',''];
  for(var i=0;i<prels.length;i++){
    var ad=prels[i].sub.agentData?prels[i].sub.agentData[prels[i].agent]:null;
    row55.push(ad&&ad.debitInitial?ad.debitInitial:'');
    row55.push('');
    row56.push(ad&&ad.debitFinal?ad.debitFinal:'');
    row56.push('');
  }
  aoa.push(row55);
  aoa.push(row56);
  
  // Lignes 57-73 : débit moyen, volume, vérification DLS, résultats labo (vides)
  for(var lnum=57;lnum<=73;lnum++){
    var rowEmpty=['',''];
    for(var i=0;i<prels.length;i++){
      rowEmpty.push('');
      rowEmpty.push('');
    }
    aoa.push(rowEmpty);
  }
  
  // Ligne 74 : RESULTATS
  aoa.push(['RESULTATS','']);
  
  // Ligne 75 : Prélèvement n°
  var row75=['Prélèvement n°',''];
  for(var i=0;i<prels.length;i++){
    row75.push(i+1);
    row75.push('');
  }
  aoa.push(row75);
  
  // Lignes 76-78 : agent, type VLEP, type prélèvement
  var row76=['agent chimique',''];
  var row77=['type de VLEP',''];
  var row78=['type de prélèvement',''];
  for(var i=0;i<prels.length;i++){
    var p=prels[i];
    row76.push(p.agent);
    row76.push('');
    row77.push(''); // vide pour non-reg
    row77.push('');
    row78.push(p.type); // 8h ou CT
    row78.push('');
  }
  aoa.push(row76);
  aoa.push(row77);
  aoa.push(row78);
  
  // Lignes 79-88 : opérateur, date, réf, résultats (vides/partiels)
  var row79=['opérateur',''];
  var row80=['date de prélèvement',''];
  var row81=['référence de l\'échantillon',''];
  for(var i=0;i<prels.length;i++){
    var p=prels[i];
    row79.push(p.sub.operateur||'');
    row79.push('');
    row80.push(formatDateFR(p.sub.date)||'');
    row80.push('');
    var ad=p.sub.agentData?p.sub.agentData[p.agent]:null;
    row81.push(ad&&ad.refEchantillon?ad.refEchantillon:'');
    row81.push('');
  }
  aoa.push(row79);
  aoa.push(row80);
  aoa.push(row81);
  
  // Lignes 82-88 : résultats bruts, EPI, VLEP (vides)
  for(var lnum=82;lnum<=88;lnum++){
    var rowEmpty=['',''];
    for(var i=0;i<prels.length;i++){
      rowEmpty.push('');
      rowEmpty.push('');
    }
    aoa.push(rowEmpty);
  }
  
  // Ligne 89 : Validation
  aoa.push(['Validation des prélèvements','']);
  
  // Ligne 90 : Prélèvement n°
  var row90=['Prélèvement n°',''];
  for(var i=0;i<prels.length;i++){
    row90.push(i+1);
    row90.push('');
  }
  aoa.push(row90);
  
  // Ligne 91 : Variation débit (vide)
  var row91=['Variation du débit avant et après prélèvement (< 5%)',''];
  for(var i=0;i<prels.length;i++){
    row91.push('');
    row91.push('');
  }
  aoa.push(row91);
  
  // Ligne 92 : Référence témoin
  var row92=["référence du témoin",''];
  for(var i=0;i<prels.length;i++){
    var blancRef=getBlancForAgent(m,prels[i].agent);
    row92.push(blancRef);
    row92.push('');
  }
  aoa.push(row92);
  
  // Lignes 93-95 : masse témoin, concentration, critère (vides)
  for(var lnum=93;lnum<=95;lnum++){
    var rowEmpty=['',''];
    for(var i=0;i<prels.length;i++){
      rowEmpty.push('');
      rowEmpty.push('');
    }
    aoa.push(rowEmpty);
  }
  
  // Créer la feuille
  var ws=XLSX.utils.aoa_to_sheet(aoa);
  
  // Ajouter les fusions de cellules
  if(!ws['!merges'])ws['!merges']=[];
  
  // Fusions en-tête
  ws['!merges'].push({s:{r:0,c:2},e:{r:0,c:13}});
  ws['!merges'].push({s:{r:1,c:2},e:{r:1,c:13}});
  
  // Fusions A-B
  ws['!merges'].push({s:{r:5,c:0},e:{r:6,c:0}});
  for(var plageNum=0;plageNum<10;plageNum++){
    var startRow=11+plageNum*2;
    ws['!merges'].push({s:{r:startRow,c:0},e:{r:startRow+1,c:0}});
  }
  ws['!merges'].push({s:{r:41,c:0},e:{r:43,c:0}});
  ws['!merges'].push({s:{r:44,c:0},e:{r:46,c:0}});
  ws['!merges'].push({s:{r:47,c:0},e:{r:49,c:0}});
  
  // Fusions colonnes prélèvements
  var fuseRows=[3,4,5,6,7,9,10,40,41,42,43,44,45,46,47,48,49,50,52,53,54,55,56,74,75,76,77,78,79,80,81,89,90,91,92];
  for(var ri=0;ri<fuseRows.length;ri++){
    var row=fuseRows[ri];
    for(var i=0;i<prels.length;i++){
      var startCol=2+i*2;
      ws['!merges'].push({s:{r:row,c:startCol},e:{r:row,c:startCol+1}});
    }
  }
  
  // Fusions plages horaires
  for(var plageNum=0;plageNum<10;plageNum++){
    for(var i=0;i<prels.length;i++){
      var startRow=11+plageNum*2;
      var startCol=2+i*2;
      ws['!merges'].push({s:{r:startRow,c:startCol},e:{r:startRow,c:startCol+1}});
      ws['!merges'].push({s:{r:startRow+1,c:startCol},e:{r:startRow+1,c:startCol+1}});
    }
  }
  
  // Largeurs de colonnes
  var cols=[{wch:50},{wch:20}];
  for(var i=0;i<prels.length;i++){
    cols.push({wch:15});
    cols.push({wch:15});
  }
  ws['!cols']=cols;
  
  return ws;
}

// Fonction helper pour récupérer les conditions ambiantes d'un sous-prélèvement
function getConditionsForPrel(m,subPrel){
  if(!m.conditionsAmbiantes||m.conditionsAmbiantes.length===0)return null;
  // Matcher par date si possible
  if(subPrel.date){
    for(var i=0;i<m.conditionsAmbiantes.length;i++){
      if(m.conditionsAmbiantes[i].date===subPrel.date)return m.conditionsAmbiantes[i];
    }
  }
  // Fallback: première condition
  return m.conditionsAmbiantes[0];
}

// Fonction helper pour récupérer la référence du blanc pour un agent
function getBlancForAgent(m,agentName){
  if(!m.blancs||m.blancs.length===0)return '';
  for(var i=0;i<m.blancs.length;i++){
    var b=m.blancs[i];
    if(b.agents&&b.agents.indexOf(agentName)!==-1){
      return b.ref||'';
    }
  }
  return '';
}



function createEchantillonsSheet(m, regPrels, nonRegPrels){
  var aoa = [];
  
  // En-tête
  aoa.push(['Nom de l\'échantillon', 'Date', 'Numéro de lot', 'Type d\'échantillon', 'Priorité air', 'Matrice']);
  
  // Collecter tous les échantillons (REG + NON REG) - dédupliquer par réf
  var allPrels = regPrels.concat(nonRegPrels);
  var seenRefs = {};
  
  // Fonction pour normaliser les références (trim + lowercase)
  function normalizeRef(ref){
    return ref ? String(ref).trim().toLowerCase() : '';
  }
  
  // Ajouter les échantillons (dédupliqués)
  allPrels.forEach(function(p){
    var ad = p.sub.agentData ? p.sub.agentData[p.agent] : null;
    var ref = ad && ad.refEchantillon ? ad.refEchantillon : '';
    if(!ref) return; // skip empty refs
    
    // Normaliser pour la comparaison
    var normalizedRef = normalizeRef(ref);
    if(!normalizedRef) return; // skip empty after trim
    if(seenRefs[normalizedRef]) return; // skip duplicates
    seenRefs[normalizedRef] = true;
    
    var date = p.sub.date ? formatDateFR(p.sub.date) : '';
    
    aoa.push([
      ref,                           // Nom de l'échantillon (valeur originale)
      date,                          // Date (JJ/MM/AAAA)
      '',                            // Numéro de lot (vide)
      'Echantillon',                 // Type
      'Standard (J0+9)',             // Priorité
      'Air des lieux de Travail'     // Matrice
    ]);
  });
  
  // Ajouter les blancs
  if(m.blancs && m.blancs.length > 0){
    m.blancs.forEach(function(b){
      var ref = b.ref || '';
      if(!ref) return;
      
      // Normaliser pour la comparaison
      var normalizedRef = normalizeRef(ref);
      if(!normalizedRef || seenRefs[normalizedRef]) return;
      seenRefs[normalizedRef] = true;
      
      var date = b.date ? formatDateFR(b.date) : '';
      
      aoa.push([
        ref,                           // Nom de l'échantillon (ref blanc, valeur originale)
        date,                          // Date (JJ/MM/AAAA)
        '',                            // Numéro de lot (vide)
        'Blanc',                       // Type
        'Standard (J0+9)',             // Priorité
        'Air des lieux de Travail'     // Matrice
      ]);
    });
  }
  
  var ws = XLSX.utils.aoa_to_sheet(aoa);
  
  // Largeurs de colonnes
  ws['!cols'] = [
    {wch: 25}, // Nom échantillon
    {wch: 12}, // Date
    {wch: 15}, // Numéro de lot
    {wch: 18}, // Type
    {wch: 18}, // Priorité
    {wch: 30}  // Matrice
  ];
  
  return ws;
}

// Feuille Relevé d'activité
function createActiviteSheet(m){
  var aoa=[];
  
  // En-tête
  aoa.push(['Relevé d\'activité - '+m.clientSite]);
  aoa.push(['Préleveur: '+(m.preleveur||''),'','Débitmètre: '+(m.debitmetre||'')]);
  aoa.push([]);
  
  // En-tête tableau
  aoa.push(['GEH','Opérateur','Agent(s) chimique(s)','Type','Date','Plage horaire','Durée','Observations']);
  
  // Données
  m.prelevements.forEach(function(p){
    p.subPrelevements.forEach(function(sb,si){
      var agentNames=p.agents.map(function(a){return a.name;}).join(', ');
      var plagesStr='';
      var dureeTotale=0;
      if(sb.plages){
        plagesStr=sb.plages.filter(function(pl){return pl.debut||pl.fin;}).map(function(pl){
          return(pl.debut||'?')+' - '+(pl.fin||'?');
        }).join(' / ');
        sb.plages.forEach(function(pl){
          if(pl.debut&&pl.fin){
            var d=pl.debut.split(':'),f=pl.fin.split(':');
            var diff=(parseInt(f[0])*60+parseInt(f[1]))-(parseInt(d[0])*60+parseInt(d[1]));
            if(diff>0)dureeTotale+=diff;
          }
        });
      }
      var dureeStr=dureeTotale>0?(Math.floor(dureeTotale/60)+'h'+(dureeTotale%60<10?'0':'')+(dureeTotale%60)):'';
      
      aoa.push([
        p.gehNum+' - '+(p.gehName||''),
        sb.operateur||'',
        agentNames,
        p.type+(p.isReglementaire?' (Régl.)':' (Non-régl.)'),
        formatDateFR(sb.date)||'',
        plagesStr,
        dureeStr,
        sb.observations||''
      ]);
    });
  });
  
  var ws=XLSX.utils.aoa_to_sheet(aoa);
  
  // Fusions en-tête
  if(!ws['!merges'])ws['!merges']=[];
  ws['!merges'].push({s:{r:0,c:0},e:{r:0,c:7}});
  
  // Largeurs
  ws['!cols']=[
    {wch:25},{wch:18},{wch:30},{wch:15},{wch:12},{wch:25},{wch:10},{wch:30}
  ];
  
  return ws;
}

// Fonction helper pour formater les dates en JJ/MM/AAAA
function formatDateFR(dateStr){
  if(!dateStr) return '';
  
  // Si la date est au format AAAA-MM-JJ (format ISO)
  if(dateStr.match(/^\d{4}-\d{2}-\d{2}$/)){
    var parts = dateStr.split('-');
    return parts[2] + '/' + parts[1] + '/' + parts[0]; // JJ/MM/AAAA
  }
  
  // Si déjà au bon format ou autre, retourner tel quel
  return dateStr;
}


// ═══════════════════════════════════════════════════════════════════════════════
// TIMER CT - Chronomètre pour prélèvements Court Terme
// © 2025 Quentin THOMAS
// ═══════════════════════════════════════════════════════════════════════════════

// Ajouter au state initial (dans la fonction d'initialisation)
// state.timers = {}; // { prelId_subIdx: { startTime, elapsed, interval } }

function startCTTimer(prelId, subIdx){
  var key = prelId + '_' + subIdx;
  
  // Si déjà un timer en cours, l'arrêter
  if(state.timers && state.timers[key] && state.timers[key].interval){
    clearInterval(state.timers[key].interval);
  }
  
  if(!state.timers) state.timers = {};
  
  // Démarrer le timer
  var startTime = Date.now();
  state.timers[key] = {
    startTime: startTime,
    elapsed: 0,
    interval: setInterval(function(){
      updateTimerDisplay(key);
    }, 1000)
  };
  
  // Persister le timer
  saveTimers();
  
  // Remplir l'heure de début automatiquement
  var now = new Date();
  var heureDebut = String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0');
  
  var m = getCurrentMission();
  if(!m) return;
  
  var prel = m.prelevements.find(function(p){ return p.id === prelId; });
  if(!prel) return;
  
  var sub = prel.subPrelevements[subIdx];
  if(!sub) return;
  
  if(!sub.plages || sub.plages.length === 0){
    sub.plages = [{debut: '', fin: ''}];
  }
  
  // Trouver la première plage vide
  var plageIdx = -1;
  for(var i = 0; i < sub.plages.length; i++){
    if(!sub.plages[i].debut){
      plageIdx = i;
      break;
    }
  }
  
  if(plageIdx === -1){
    // Toutes les plages sont remplies, ajouter une nouvelle
    sub.plages.push({debut: heureDebut, fin: ''});
  } else {
    sub.plages[plageIdx].debut = heureDebut;
  }
  
  saveData('vlep_missions_v3', state.missions);
  render();
}

function stopCTTimer(prelId, subIdx){
  var key = prelId + '_' + subIdx;
  
  if(!state.timers || !state.timers[key]) return;
  
  // Arrêter le timer
  if(state.timers[key].interval){
    clearInterval(state.timers[key].interval);
  }
  
  // Remplir l'heure de fin automatiquement
  var now = new Date();
  var heureFin = String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0');
  
  var m = getCurrentMission();
  if(!m) return;
  
  var prel = m.prelevements.find(function(p){ return p.id === prelId; });
  if(!prel) return;
  
  var sub = prel.subPrelevements[subIdx];
  if(!sub) return;
  
  // Trouver la dernière plage avec un début mais sans fin
  var plageIdx = -1;
  for(var i = sub.plages.length - 1; i >= 0; i--){
    if(sub.plages[i].debut && !sub.plages[i].fin){
      plageIdx = i;
      break;
    }
  }
  
  if(plageIdx !== -1){
    sub.plages[plageIdx].fin = heureFin;
  }
  
  // Nettoyer le timer
  delete state.timers[key];
  saveTimers();
  
  saveData('vlep_missions_v3', state.missions);
  render();
}

// Persistence des timers
function saveTimers(){
  var data={};
  for(var key in state.timers){
    if(state.timers[key]&&state.timers[key].startTime){
      data[key]={startTime:state.timers[key].startTime};
    }
  }
  try{localStorage.setItem('vlep_timers',JSON.stringify(data));}catch(e){}
}

function restoreTimers(){
  try{
    var data=JSON.parse(localStorage.getItem('vlep_timers')||'{}');
    for(var key in data){
      if(data[key].startTime){
        state.timers[key]={
          startTime:data[key].startTime,
          elapsed:Math.floor((Date.now()-data[key].startTime)/1000),
          interval:setInterval((function(k){return function(){updateTimerDisplay(k);};})(key),1000)
        };
      }
    }
  }catch(e){}
}

function updateTimerDisplay(key){
  if(!state.timers || !state.timers[key]) return;
  
  var timer = state.timers[key];
  var elapsed = Math.floor((Date.now() - timer.startTime) / 1000);
  timer.elapsed = elapsed;
  
  // Mettre à jour l'affichage
  var element = document.getElementById('timer-display-' + key);
  if(element){
    var minutes = Math.floor(elapsed / 60);
    var seconds = elapsed % 60;
    element.textContent = String(minutes).padStart(2, '0') + ':' + String(seconds).padStart(2, '0');
    
    // Alerte à 15 minutes
    if(elapsed === 900){ // 15 minutes
      element.style.color = '#ef4444';
      element.style.fontWeight = 'bold';
      // Vibration (3 pulses longues)
      try {
        if(navigator.vibrate) navigator.vibrate([500, 200, 500, 200, 1000]);
      } catch(e){}
      // Son
      try {
        var audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIGWe77einTxELTqXh8LljHAU7k9r0x3ImBSh+zPLaizsIFWS56+qnUBEKTKPh8rpmHgU+m9z0zHUpBSh/zfPaizsIFWO46uunThELTaTi8bplHgU8mtr0zHYrBSh+zfPbiTsIFWS46uunUBEKTKPh8r1pHgU/nN301XcsBSh/zfPbiTsIFWS46+ymURAKTKPi8bxmHgU9mtr0zHYrBSh/zfPbizsIFWS46+ymUhELTKTi8bxmHgU9mtr0zHYrBSh/zfPbiTwIFWO46+ymUhAKTKPi8b1nHgU/m9301HgrBSh/zfPbiTsIFWS46+ymURAKTKPh8rxnHgU+m9v00nYpBSh/zPPbiTsIFWO46uunUBEKTKPh8rxnHgU+m9z00nYqBSh/zPPaiTsIFWS46+ymUhEKTKPi8r1oHgU/nNz0z3cpBSh/zfPaiTsIFWS46+ymUhELTKPi8r1oHgU+m9z00nYpBSh/zfPbiTsIFWO46+ymUhEKTKPi8r1pHgU/nN301HcpBSh/zfPaiTsIFWS56+ymUhAKTKPi8r1pHgU+m9301HgrBSiAzfPbiTsIFWO46+ymUhELTKPi8r1pHgU/nN301XcsBSiAzfPaiTsIFWO46+ymUhEKTKPi8r1pHgU+m9z01HYpBSh/zfPaiTsIFWS46+ymUhEKTKPi8r1pHgVAm9z01XcsBSh/zfPaiTsIFWS46+ymURAKTKPi8r1pHgU+m9301HYpBSh/zfPaiTsIFWO46+ymUhEKTKPi8r1pHgU/nN301XcsBSh/zfPaiTsIFWS46+ymUhAKTKPi8r1pHgU+m9z00nYpBSh/zfPaiTsIFWS46+ymUhEKTKPi8r1pHgU/nN301XcsBSh/zfPaiTsIFWS46+ymUhEKTKPi8r1pHgU+m9301HYrBSh/zfPaiTsIFWO46+ymUhEKTKPi8r1pHgU+m9301HYrBSh/zfPaiTsIFWO46+ymUhEKTKPi8r1pHgU+m9301HYrBSh/zfPaiTsIFWO46+ymUhEKTKPi8r1pHgU+m9301HYrBSh/zfPaiTsIFWO46+ymUhEKTKPi8r1pHgU+m9301HYrBSh/zfPaiTsIFWO46+ymUhEKTKPi8r1pHgU+m9301HYrBSh/zfPaiTsIFWO46+ymUhEKTKPi8r1pHgU+m9301HYrBSh/zfPaiTsIFWO46+ymUhEKTKPi8r1pHgU+m9301HYrBSh/zfPaiTsIFWO46+ymUhEKTKPi8r1pHgU+m9301HYrBSh/zfPaiTsIFWO46+ymUhEKTKPi8r1pHgU+m9301HYrBSh/zfPaiTsIFWO46+ymUhEKTKPi8r1pHgU+m9301HYrBSh/zfPaiTsIFWO46+ymUhEKTKPi8r1pHg==');
        audio.play();
      } catch(e){}
    }
    // Rappel vibration à 14min (1 min avant)
    if(elapsed === 840){
      try {
        if(navigator.vibrate) navigator.vibrate([300, 100, 300]);
      } catch(e){}
    }
  }
}

function getTimerDisplay(prelId, subIdx){
  var key = prelId + '_' + subIdx;
  
  if(!state.timers || !state.timers[key]){
    return '';
  }
  
  var elapsed = state.timers[key].elapsed || 0;
  var minutes = Math.floor(elapsed / 60);
  var seconds = elapsed % 60;
  var timeStr = String(minutes).padStart(2, '0') + ':' + String(seconds).padStart(2, '0');
  
  var color = elapsed >= 900 ? '#ef4444' : '#0066b3';
  
  return '<div style="background:#f0f7fc;border:2px solid '+color+';border-radius:8px;padding:12px;margin:8px 0;text-align:center;"><div style="font-size:11px;color:#64748b;margin-bottom:4px;">⏱️ Chronomètre CT</div><div id="timer-display-'+key+'" style="font-size:32px;font-weight:bold;color:'+color+';font-family:monospace;">'+timeStr+'</div><button class="btn btn-danger" style="margin-top:8px;" onclick="stopCTTimer('+prelId+','+subIdx+');">⏹️ Arrêter</button></div>';
}

function isTimerRunning(prelId, subIdx){
  var key = prelId + '_' + subIdx;
  return state.timers && state.timers[key] && state.timers[key].interval;
}

// ═══════════════════════════════════════════════════════════════════════════════
// Gestion des timers en arrière-plan (iOS/Android)
// © 2025 Quentin THOMAS
// ═══════════════════════════════════════════════════════════════════════════════

// Quand l'app revient au premier plan, mettre à jour tous les timers actifs
document.addEventListener('visibilitychange', function() {
  if (!document.hidden && state.timers) {
    // L'app revient au premier plan
    console.log('[Timers] App revenue au premier plan, mise à jour des timers...');
    
    // Mettre à jour l'affichage de tous les timers actifs
    for (var key in state.timers) {
      if (state.timers[key] && state.timers[key].startTime) {
        updateTimerDisplay(key);
      }
    }
  }
});

// Au chargement, restaurer les timers depuis localStorage
if (typeof restoreTimers === 'function') {
  restoreTimers();
}



console.log('✓ Export Excel chargé');
