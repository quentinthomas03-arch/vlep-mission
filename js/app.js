// app.js - Point d'entrée application
// © 2025 Quentin THOMAS
// Render principal, navigation, initialisation, splash screen

function render(){
  var h='';
  switch(state.view){
    case'home':h=renderHome();break;
    case'prepa-list':h=renderPrepaList();break;
    case'prepa-mission':h=renderPrepaMission();break;
    case'prepa-agents':h=renderPrepaAgents();break;
    case'prepa-affectations':h=renderPrepaAffectations();break;
    case'prepa-geh':h=renderPrepaGeh();break;
    case'terrain-list':h=renderTerrainList();break;
    case'terrain-mission':h=renderTerrainMission();break;
    case'terrain-prel':h=renderTerrainPrel();break;
    case'conditions':h=renderConditions();break;
    case'db-terrain':h=renderDbTerrain();break;
    case'db-full':h=renderDbFull();break;
    case'liste-echantillons':h=renderListeEchantillons();break;
    case'quick-entry':h=renderQuickEntry();break;
    default:h=renderHome();
  }
  document.getElementById('app').innerHTML=h;
  if(state.view==='prepa-agents'){var src=document.getElementById('search-results-container');if(src)attachSearchResultListeners(src);}
  if(state.view==='quick-entry'){var qsrc=document.getElementById('quick-search-results');if(qsrc)attachQuickSearchListeners(qsrc);setTimeout(function(){var i=document.getElementById('quick-agent-search');if(i)i.focus();},50);}
  if(state.view==='db-terrain')setTimeout(updateDbResults,50);
}


// === SPLASH SCREEN DISMISS ===
setTimeout(function(){
  var splash=document.getElementById('splash');
  if(splash){
    splash.classList.add('fade-out');
    setTimeout(function(){splash.remove();},600);
  }
},1800);

// ???????????????????????????????????????????????????????????
// PWA - Service Worker Registration & Update Management
// ???????????????????????????????????????????????????????????
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').then(registration => {
      console.log('[PWA] Service Worker enregistré');
      
      // Vérifier les mises à jour au démarrage
      registration.update();
      
      // Vérifier les mises à jour toutes les 5 minutes (pour dev)
      // En production, mettre 30 * 60 * 1000 (30 minutes)
      setInterval(() => {
        registration.update();
        console.log('[PWA] Vérification mise à jour...');
      }, 5 * 60 * 1000);
      
      // Détecter une nouvelle version disponible
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        console.log('[PWA] Nouvelle version détectée !');
        
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            // Nouvelle version disponible et prête
            console.log('[PWA] Nouvelle version prête, rechargement dans 2s...');
            
            // Notification discrète
            var banner = document.createElement('div');
            banner.style.cssText = 'position:fixed;top:0;left:0;right:0;background:#0066b3;color:white;padding:12px;text-align:center;font-size:13px;z-index:9999;box-shadow:0 2px 8px rgba(0,0,0,0.2);';
            banner.innerHTML = '??? Mise à jour disponible... Rechargement automatique dans 2s';
            document.body.appendChild(banner);
            
            // Rechargement automatique après 2 secondes
            setTimeout(() => {
              window.location.reload();
            }, 2000);
          }
        });
      });
      
      // ?couter les messages du Service Worker
      navigator.serviceWorker.addEventListener('message', event => {
        if (event.data && event.data.type === 'UPDATE_AVAILABLE') {
          console.log('[PWA] Message reçu: mise à jour disponible');
        }
      });
      
    }).catch(err => {
      console.log('[PWA] Erreur SW:', err);
    });
  });
}

// === INITIALISATION ===
loadData();
render();

// ???????????????????????????????????????????????????????????
// Gestion du bouton retour Android (back button)
// ???????????????????????????????????????????????????????????
window.addEventListener('popstate', function(event) {
  // Empêcher le comportement par défaut (quitter l'app)
  event.preventDefault();
  
  // Navigation dans l'app selon la vue actuelle
  if (state.view === 'home') {
    // Si on est déjà sur l'accueil, on ne fait rien (ou on peut quitter)
    return;
  } else if (state.view.startsWith('prepa-')) {
    // Dans la préparation, retour à la liste des missions
    if (state.view === 'prepa-list') {
      state.view = 'home';
    } else if (state.view === 'prepa-mission') {
      state.view = 'prepa-list';
    } else {
      state.view = 'prepa-mission';
    }
  } else if (state.view.startsWith('terrain-')) {
    // Sur le terrain, retour à la liste
    if (state.view === 'terrain-list') {
      state.view = 'home';
    } else if (state.view === 'terrain-mission') {
      state.view = 'terrain-list';
    } else {
      state.view = 'terrain-mission';
    }
  } else if (state.view === 'conditions' || state.view === 'liste-echantillons') {
    // Depuis conditions ou échantillons, retour à terrain-mission
    state.view = 'terrain-mission';
  } else if (state.view.startsWith('db-') || state.view === 'quick-entry') {
    // Depuis base de données ou saisie rapide, retour à l'accueil
    state.view = 'home';
  } else {
    // Par défaut, retour à l'accueil
    state.view = 'home';
  }
  
  render();
});

// Ajouter un état initial dans l'historique pour capturer le bouton retour
history.pushState({view: state.view}, '', '');

console.log('?? App chargé');
