const CACHE_NAME = 'mdu-alumni-cache-v2';
const urlsToCache = [
  './',
  './index.html',
  './login.html',
  './register.html',
  './directory.html',
  './dashboard.html',
  './profile.html',
  './events.html',
  './contact.html',
  './admin.html',
  './id-registry.html',
  './main.css',
  './app.js',
  './admin.js',
  './manifest.json'
];

// Install the service worker
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(urlsToCache).catch(err => {
        console.log('Cache addAll error:', err);
      });
    })
  );
  self.skipWaiting();
});

// Activation logic: clear all old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Clearing old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
        return self.clients.claim();
    })
  );
});

// Fetch resources
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request).catch(() => {
        return caches.match('./index.html');
      });
    })
  );
});