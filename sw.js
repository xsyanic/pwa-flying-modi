const CACHE_NAME = 'flying-modi-v1';
const urlsToCache = [
  './',
  './index.html',
  './bg.png',
  './bird.png',
  './pipe_up.png',
  './pipe_down.png',
  './music1.mp3',
  './music2.mp3',
  './music3.mp3',
  './music4.mp3',
  './fly.mp3',
  './gameover.mp3',
  './highscore.mp3',
  './gameover.png',
  './highscore.png',
  './manifest.json',
  './sw.js',
  './icon.png'
];

self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function(cache) {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('fetch', function(event) {
  if (event.request.url.indexOf('.html') > -1) {
    event.respondWith(
      fetch(event.request)
        .then(function(response) {
          return caches.open(CACHE_NAME)
            .then(function(cache) {
              cache.put(event.request, response.clone());
              return response;
            });
        })
        .catch(function() {
          return caches.match(event.request);
        })
    );
  } else {
    event.respondWith(
      caches.match(event.request)
        .then(function(response) {
          if (response) {
            return response;
          }
          
          return fetch(event.request)
            .then(function(response) {
              if (!response || response.status !== 200 || response.type !== 'basic') {
                return response;
              }
              
              var responseToCache = response.clone();
              
              caches.open(CACHE_NAME)
                .then(function(cache) {
                  cache.put(event.request, responseToCache);
                });
              
              return response;
            })
            .catch(function() {
              return new Response('Offline', {
                status: 408,
                headers: new Headers({
                  'Content-Type': 'text/plain'
                })
              });
            });
        })
    );
  }
});

self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.map(function(cacheName) {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

self.addEventListener('sync', function(event) {
  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync());
  }
});

async function doBackgroundSync() {
  const cache = await caches.open(CACHE_NAME);
  const requests = urlsToCache.map(url => new Request(url));
  
  requests.forEach(async (request) => {
    try {
      const networkResponse = await fetch(request);
      await cache.put(request, networkResponse);
      console.log('Updated:', request.url);
    } catch (error) {
      console.log('Failed to update:', request.url, error);
    }
  });
}