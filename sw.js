// Increase version number for any change to Service Worker
var staticCacheName = 'restaviews-static-v1.0';
var contentImgsCache = 'restaviews-content-imgs';
var allCaches = [
  staticCacheName,
  contentImgsCache
];

let staticAssets = [
  '/',
  '/index.html',
  '/restaurant.html',
  '/css/styles.css',
  '/css/styles-medium.css',
  '/js/dbhelper.js',
  '/js/main.js',
  '/js/restaurant_info.js',
  '/data/restaurants.json'
];

let images = [1,2,3,4,5,6,7,8,9,10];
images.forEach((image) => {
  staticAssets.push(`/img/${image}-medium.jpg`);
});
console.log("staticAssets:", staticAssets);

/** At Service Worker Install time, cache all static assets */
self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(staticCacheName).then(function(cache) {
      return cache.addAll(staticAssets);
    })
  );
});

/** At Service Worker Activation, Delete previous caches, if any */
self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.filter(function(cacheName) {
          return cacheName.startsWith('restaviews-') &&
                 !allCaches.includes(cacheName);
        }).map(function(cacheName) {
          return caches.delete(cacheName);
        })
      );
    })
  );
});

/** Highjack fetch requests and respond accordingly */
self.addEventListener('fetch', function(event) {
  var requestUrl = new URL(event.request.url);

  // only highjack request made to our app (not google maps for example)
  if (requestUrl.origin === location.origin) {
    // TODO: handle request sent to /restaurant.html
    // Since url has search params, it doesn't respond with the cached restaurant.html
    // so make it respondWith it instead
    if (requestUrl.pathname.startsWith('/restaurant.html')) {
      event.respondWith(caches.match('/restaurant.html'));
      return;
    }

    // TODO: handle images

    // TODO: handle database requests. see function for handling
    if (requestUrl.pathname.startsWith('/data')) {
      console.log('Request sent to /data');
      event.respondWith(serveDB(event.request));
      return;
    }
  }

  // Default behavior: respond with cached elements, if any (google maps may implement their own?)
  event.respondWith(
    caches.match(event.request).then(function(response) {
      if (response) {console.log("there was a match in cache");}
      return response || fetch(event.request);
    })
  );
});

// As of this writting, is a static .json file
// so this code may need to change in future parts of the project
// (if databases like mongodb or others are used for example?)
//
// Regardless of this being a simulation, a request to a database should only be
// cached once, content should be always be served from server, and fall back to
// cached version if needed... so:
//      fetch, update cache and serve clone, or
//      serve cached version if offline
//
// see: https://developers.google.com/web/fundamentals/instant-and-offline/offline-cookbook/#on-network-response
function serveDB(request) {
  return caches.open(staticCacheName).then(function(cache) {
    return cache.match(request).then(function(response) {
      const networkFetch = fetch(request).then(function(networkResponse) {
        cache.put(request, networkResponse.clone());
        return networkResponse;
      });      
      /** Apparently there is no need to put networkFetch first in the return statement
       * see: https://developers.google.com/web/fundamentals/instant-and-offline/offline-cookbook/#on-network-response
       * This will fetch from network, update cache and return response from network, even if response from cache is
       * being passed first...!?
       */
      return response || networkFetch;
    });
  });
}

function serveImage(request) {
  return caches.open
}