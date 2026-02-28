// sw.js - Service Worker
// © 2025 Quentin THOMAS

const CACHE_NAME = 'vlep-mission-v3.8-modular-fix1';
const VERSION = '3.8.1'; // Incrémenter à chaque mise à jour
const urlsToCache = [
  './',
  './index.html',
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
  './js/app.js',
  // Bibliothèque externe
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
        console.log('[SW] Tous les fichiers mis en cache avec succès');
        return self.skipWaiting(); // Active immédiatement
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
      console.log('[SW] Prise de contrôle des clients');
      return self.clients.claim(); // Prend le contrôle immédiatement
    })
    .then(function() {
      // Notifier tous les clients qu'une mise à jour est disponible
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

// Fetch - Stratégie Network First pour le développement
self.addEventListener('fetch', function(event) {
  event.respondWith(
    fetch(event.request)
      .then(function(response) {
        // Si la requête réseau réussit, mettre en cache
        if (response && response.status === 200) {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then(function(cache) {
            cache.put(event.request, responseToCache);
          });
        }
        return response;
      })
      .catch(function() {
        // Si le réseau échoue, utiliser le cache
        return caches.match(event.request);
      })
  );
});

console.log('[SW] Service Worker chargé v' + VERSION);
