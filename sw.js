// sw.js - Service Worker
// Â© 2025 Quentin THOMAS

const CACHE_NAME = 'vlep-mission-v1.0';
const VERSION = '1.0'; // Incrémenter à chaque mise à jour
const urlsToCache = [
  './',
  './index.html',
  './procedure_vlep_mission.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  // Modules JavaScript
  './js/icons.js',
  './js/database.js',
  './js/state.js',
  './js/prepa.js',
  './js/terrain.js',
  './js/echantillons.js',
  './js/export-excel.js',
  './js/database-views.js',
  './js/quick-entry.js',
  './js/import-export.js',
  './js/timers.js',
  './js/docx.iife.js',
  './js/export-word.js',
  './js/app.js',
  // BibliothÃ¨que externe
  'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js'
];

// Installation
self.addEventListener('install', function(event) {
  console.log('[SW] Installation v' + VERSION);
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function(cache) {
        console.log('[SW] Mise en cache des fichiers');
        return cache.addAll(urlsToCache);
      })
      .then(function() {
        console.log('[SW] Tous les fichiers mis en cache avec succÃ¨s');
        return self.skipWaiting(); // Active immÃ©diatement
      })
      .catch(function(err){
        console.error('[SW] Erreur mise en cache:', err);
      })
  );
});

// Activation
self.addEventListener('activate', function(event) {
  console.log('[SW] Activation v' + VERSION);
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.map(function(cacheName) {
          if (cacheName !== CACHE_NAME) {
            console.log('[SW] Suppression ancien cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
    .then(function() {
      console.log('[SW] Prise de contrÃ´le des clients');
      return self.clients.claim(); // Prend le contrÃ´le immÃ©diatement
    })
    .then(function() {
      // Notifier tous les clients qu'une mise Ã  jour est disponible
      return self.clients.matchAll().then(function(clients) {
        clients.forEach(function(client) {
          client.postMessage({
            type: 'UPDATE_AVAILABLE',
            version: VERSION
          });
        });
      });
    })
  );
});

// Fetch - StratÃ©gie Network First pour le dÃ©veloppement
self.addEventListener('fetch', function(event) {
  event.respondWith(
    fetch(event.request)
      .then(function(response) {
        // Si la requÃªte rÃ©seau rÃ©ussit, mettre en cache
        if (response && response.status === 200) {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then(function(cache) {
            cache.put(event.request, responseToCache);
          });
        }
        return response;
      })
      .catch(function() {
        // Si le rÃ©seau Ã©choue, utiliser le cache
        return caches.match(event.request);
      })
  );
});

console.log('[SW] Service Worker chargÃ© v' + VERSION);
