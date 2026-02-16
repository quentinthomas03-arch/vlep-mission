// sw.js - Service Worker
// © 2025 Quentin THOMAS

const CACHE_NAME = 'vlep-mission-v3.8-cache';
const urlsToCache = [
  '/',
  '/index.html',
  '/css/main.css',
  '/js/state.js',
  '/js/icons.js',
  '/js/utils.js',
  '/js/database.js',
  '/js/terrain.js',
  '/js/app.js',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png'
];

// Installation
self.addEventListener('install', function(event) {
  console.log('[SW] Installation...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function(cache) {
        console.log('[SW] Mise en cache des fichiers');
        return cache.addAll(urlsToCache);
      })
      .catch(function(err){
        console.log('[SW] Erreur mise en cache:', err);
      })
  );
});

// Activation
self.addEventListener('activate', function(event) {
  console.log('[SW] Activation...');
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
  );
});

// Fetch - Stratégie Cache First
self.addEventListener('fetch', function(event) {
  event.respondWith(
    caches.match(event.request)
      .then(function(response) {
        // Retourner le cache si disponible
        if (response) {
          return response;
        }
        // Sinon, faire la requête réseau
        return fetch(event.request);
      })
  );
});

console.log('[SW] Service Worker chargé');
