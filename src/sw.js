// Increase version number for any change to Service Worker
const staticCacheName = 'restaviews-static-v1.2';
const contentImgsCache = 'restaviews-content-imgs';
var allCaches = [
  staticCacheName,
  contentImgsCache
];

/** At Service Worker Install time, cache all static assets */
self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(staticCacheName).then(function(cache) {
      return cache.addAll([
        '/',
        '/restaurant.html',
        '/css/styles.css',
        '/css/styles-medium.css',
        '/js/dbhelper.js',
        '/js/main.js',
        '/js/restaurant_info.js',
        // Google maps resources and fonts
        'https://fonts.googleapis.com/css?family=Roboto:300,400,500,700',
        'https://fonts.gstatic.com/s/roboto/v18/KFOmCnqEu92Fr1Mu4mxK.woff2',
        'https://fonts.gstatic.com/s/roboto/v18/KFOlCnqEu92Fr1MmEU9fBBc4.woff2'


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
    // TODO: handle request sent to /restaurant.html
    // Since url has search params, it doesn't respond with the cached restaurant.html
    // (the url can't be used as a key) so make it respondWith it instead
    if (requestUrl.pathname.startsWith('/restaurant.html')) {
      event.respondWith(caches.match('/restaurant.html'));
      return;
    }

    // TODO: handle images
    if (requestUrl.pathname.startsWith('/img')) {
      event.respondWith(serveImage(event.request));
      return;
    }

    // TODO: handle database requests. see function definition below
    if (requestUrl.pathname.startsWith('/data')) {
      event.respondWith(serveDB(event.request));
      return;
    }
  }

  // Default behavior: respond with cached elements, if any (google maps may implement their own?)
  event.respondWith(
    caches.match(event.request).then(function(response) {
      return response || fetch(event.request);
    })
  );
});

/**
 * As of this writting, is a static .json file
 * so this code may need to change in future parts of the project
 * (if databases like mongodb or others are used for example?)
 *
 * Apparently it's better to serve content from cache first, otherwise user will
 * have to wait if connection is slow. This approach serves content from cache first
 * fetches request from network and then updates the cache. See link below.
 *
 * It may be worth trying to serve content only from the network, and cache it so it
 * can be used only if app is offline, or network has problems. But it may not be the best
 * approach, again, due to wait times in slow networks.
 *
 * see: https://developers.google.com/web/fundamentals/instant-and-offline/offline-cookbook/#on-network-response
 */

// Cache on network response approach
function serveDB(request) {
  return caches.open(staticCacheName).then(function(cache) {
    return cache.match(request).then(function(response) {
      const networkFetch = fetch(request).then(function(networkResponse) {
        cache.put(request, networkResponse.clone());
        return networkResponse;
      });
      return response || networkFetch;
    });
  });
}

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
