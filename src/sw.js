// Increase version number for any change to Service Worker
const staticCacheName = 'restaviews-static-v1.3';
const contentImgsCache = 'restaviews-content-imgs';
var allCaches = [
  staticCacheName,
  contentImgsCache
];

// External Scripts can be imported into the service worker scope by using importScripts!!
// see: https://developer.mozilla.org/en-US/docs/Web/API/WorkerGlobalScope/importScripts
importScripts('js/vendor/idb.js', 'js/dbpromise.js');

/** At Service Worker Install time, cache all static assets */
self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(staticCacheName).then(function(cache) {
      return cache.addAll([
        '/',
        '/restaurant.html',
        '/css/styles.css',
        '/css/styles-medium.css',
        '/js/vendor/idb.js',
        '/img/icon_error.png',
        '/js/dbhelper.js',
        '/js/dbpromise.js',
        '/js/main.js',
        '/js/restaurant_info.js',
        // cache leaflet assets
        '/js/vendor/leaflet.js',
        '/css/vendor/leaflet.css',
        '/css/vendor/vendor/images/layers-2x.png',
        '/css/vendor/vendor/images/layers.png',
        '/css/vendor/vendor/images/marker-icon-2x.png',
        '/css/vendor/vendor/images/marker-icon.png',
        '/css/vendor/vendor/images/marker-shadow.png',
      ]);
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
    // DONE: handle request sent to /restaurant.html
    // Since url has search params, it doesn't respond with the cached restaurant.html
    // (the url can't be used as a key) so make it respondWith it instead
    if (requestUrl.pathname.startsWith('/restaurant.html')) {
      event.respondWith(caches.match('/restaurant.html'));
      return;
    }

    // DONE: handle images
    if (requestUrl.pathname.startsWith('/img')) {
      event.respondWith(serveImage(event.request));
      return;
    }

    // DONE: handle database requests.
    // Database is accessed by API, and requests are cached using iDB directly
    // from the website. Since caching of json data to iDB can be done directly
    // from the site, I implemented it outside the service worker scope.
  }

  // TODO: if offline respond with a personilized script instead of Google Map's
  // if (!navigator.onLine)

  // Default behavior: respond with cached elements, if any (google maps may implement their own?)
  event.respondWith(
    caches.match(event.request).then(function(response) {
      return response || fetch(event.request);
    })
  );
});

/**
 * This approach will strip the "-small", "-medium" and "-large" suffixes added to
 * responsive images. So when a request is made for any image:
 *
 *    1. Keep request intact for fetch
 *    2. Make a new URL with a stripped suffix and extension, so it can be used as key for cache storage
 *    3. If image is not in cache (fetched for the first time), get it, and then cache it
 *       using the stripped URL
 *    4. If there is an image in cached with the stripped URL, serve that image instead.
 *
 * NOTE: since images can also be of different format, for example the largest image can be
 *       a .png with the highest quality for retina displays, while lower quality ones will
 *       be .jpg, it's also a good idea to strip the extension!
 *
 * This way only one image will be stored in cache, and since browsers will use the best image
 * for the device based on srcset, it means it's likely the image will always be the best image
 * fit for caching
 */

// Cache only one type of image when requested
function serveImage(request) {
  let imageStorageUrl = request.url;

  // DONE: Placeholder images should be cached without sripping anything.
  // placeholder images (used for lazy loading) will be stored in cache in their
  // original request.url. So if image is not a placeholder:
  if ( imageStorageUrl.indexOf("placeholder") < 0 ) {
  // Make a new URL with a stripped suffix and extension from the request url
  // i.e. /img/1-medium.jpg  ->  /img/1
    imageStorageUrl = imageStorageUrl.replace(/-small\.\w{3}|-medium\.\w{3}|-large\.\w{3}/i, '');
  }

  return caches.open(contentImgsCache).then(function(cache) {
    return cache.match(imageStorageUrl).then(function(response) {
      // if image is in cache, return it
      if (response) return response;

      // if image wasn't in cache, fetch it from network, cache it, and return response
      return fetch(request).then(function(networkResponse) {
        cache.put(imageStorageUrl, networkResponse.clone());
        return networkResponse;
      });
    });
  });
}

self.addEventListener('sync', event => {
  if (event.tag == 'putSync') {
    // see: https://wicg.github.io/BackgroundSync/spec/#dom-syncevent-lastchance
    event.waitUntil(syncPutRequests().catch(err => {
      if (event.lastChance) {
        console.log("Failed to sync request");
      }
      throw err;
    })
  )}
});

// TODO: Listen to sync events made when a restaurant favorite button is toggled.
function syncPutRequests() {
  // open iDB, and process all put requests, clearing iDB when done.
  console.log('hello from putSync');
  return Promise.reject('simulated failure');
  /*if (!navigator.onLine) return Promise.reject('offline try again later fucker');
  return dbPromise.then(db => {
    const tx = db.transaction('putRequests', 'readwrite');
    const putRequestStore = tx.objectStore('putRequests');

    // get all put requests stored while offline
    putRequestStore.openCursor()
    .then(function putRequest(cursor) {
      if (!cursor) return; // exit if done

      const url = cursor.value;
      const PUT = {method: 'PUT'};
      console.log("making PUT fetch to ", url);
      // and make a PUT fetch request for each one.
      fetch(url, PUT);
      cursor.delete();

      return cursor.continue().then(putRequest);
    })
    .then(
      function onfulfilled() {
        // clear iDB database ONLY if successful (no fetch request failed)
        console.log('No Failures! Yay!')
        //putRequestStore.clear();
      },
      function onrejected(e) {
        console.error("Noooooo! Failures!!!!", e);
        // TODO: If any of the fetch requests failed, remove any successful fetch from iDB and exit
        console.log("YOu should see some requests still in iDB");
        // TODO: remember to return a rejected promise so sync tries again if anything failed.
        //return Promise.reject();
      }
    );
    
    //return tx.complete;
  });/** */
}
