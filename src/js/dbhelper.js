/**
 * Common database helper functions.
 */
class DBHelper {

  //TODO: old database url, delete after removing other old methods. See todos below.
  static get DATABASE_URL() {
    const protocol = location.protocol;
    const host =  location.host;
    return `${protocol}//${host}/data/restaurants.json`;
  }
  static get API_URL() {
    const protocol = location.protocol;
    const hostname = location.hostname;
    const port = 1337; // change this if port number of your sails server is different.
    return `${protocol}//${hostname}:${port}`;
  }

  // TODO: replace old fetchRestaurants() with this new promise based function.
  /**
   * Fetch all restaurants from API, and store results in indexedDB. If offline, fallback to indexedDB.
   * @returns {Promise.<Object[]>} A promise that resolves to an Array of restaurant objects.
   */
  static fetchRestaurantsPromise() {
    const url = `${DBHelper.API_URL}/restaurants`;

    // if service worker isn't supported, just return a regular fetch.
    if (!navigator.serviceWorker) return fetch(url).then(response => {return response.json()});

    return fetch(url)
      .then(response => {
        if (!response.ok) {
          return Promise.reject(`API Fetch request to ${response.url} failed with code: ${response.status}`);
        }
        return response.json();
      })
      .then(
        function onfulfilled(restaurants) {
          // After fetching restaurants from network, if any local iDB restaurant
          // is awaitingSync, use that instead of Fetched restaurant. Create/Update other restaurants
          // with fetched data
          return dbPromise.then(db => {
            const tx = db.transaction('restaurants', 'readwrite');
            const restaurantStore = tx.objectStore('restaurants');

            return Promise.all(restaurants.map((restaurant, index, restaurants) => {
              return restaurantStore.get(restaurant.id).then(idbRestaurant => {
                // There are 2 reasons to create/update local iDB restaurant data:
                // 1. it doesn't exist
                // 2. is not awaiting a Background Sync and updatedAt property doesn't match. This scenario
                //    will be useful for failed syncs, where awaitingSync becomes false, and server data
                //    should be used instead.
                if ( !idbRestaurant || (!idbRestaurant.awaitingSync && idbRestaurant.updatedAt !== restaurant.updatedAt) ) {
                  return restaurantStore.put(restaurant);
                }
                // if local iDB restaurant is awaiting a sync, use that instead.
                if (idbRestaurant.awaitingSync) {
                  restaurants[index] = idbRestaurant;
                }
                // for anything else, network fetched restaurants remain untouched, and nothing needs updating in locla iDB
              });
            })).then(() => {
              tx.complete;
              return restaurants;
            });

          });
        },
        function onrejected(error) {
          // Handle offline mode (couldn't fetch restaurants from API)
          console.log(error, '\nTrying local indexedDB database...');
          return dbPromise.then(db => {
            const tx = db.transaction('restaurants');
            const restaurantStore = tx.objectStore('restaurants');

            return restaurantStore.getAll();
          })
          .catch(console.log);
        })
      .catch(console.error);
  }

  // TODO: This is the old fetchRestaurants method. Kept for other two methods
  // (fetchRestaurantByCuisine and fetchRestaurantByNeighborhood) that still rely
  // on it, but are never used. DELETE if no longer needed.
  // Still relies on the old DATABASE_URL (/data/restaurants.josn)
  /**
   * Fetch all restaurants using an XMLhttpRequest.
   */
  static fetchRestaurants(callback) {
    let xhr = new XMLHttpRequest();
    xhr.open('GET', DBHelper.DATABASE_URL);
    xhr.onload = () => {
      if (xhr.status === 200) { // Got a success response from server!
        const json = JSON.parse(xhr.responseText);
        const restaurants = json.restaurants;
        callback(null, restaurants);
      } else { // Oops!. Got an error from server.
        const error = (`Request failed. Returned status of ${xhr.status}`);
        callback(error, null);
      }
    };
    xhr.send();
  }

  /**
   * Fetch a restaurant by its ID using a Promise. Resolves to a restaurant object.
   *
   * @param {(number)} id a valid restaurant id.
   */
  static fetchRestaurantById(id) {
    const url = `${DBHelper.API_URL}/restaurants/${id}`;

    // if service worker isn't supported, just return a regular fetch.
    if (!navigator.serviceWorker) return fetch(url).then(response => {return response.json()});

    id = Number(id); // Make sure id is a number. Strings will give an error in iDB.
    return fetch(url)
      .then(response => {
        if (!response.ok) {
          return Promise.reject(`API Fetch request to ${response.url} failed with code: ${response.status}`);
        }
        return response.json();
      })
      .then(
        //TODO: on fulfilled use fetched restaurant only if restaruant isn't awaitingSync
        function onfulfilled(restaurant) {

          // Return restaurant fetched from Network or local iDB restaurant if awaitingSync
          return dbPromise.then(db => {
            const tx = db.transaction('restaurants', 'readwrite');
            const restaurantStore = tx.objectStore('restaurants');

            return restaurantStore.get(id).then(idbRestaurant => {
              // if idbRestaurant doesn't exist, OR isn't awaitingSync and doesn't match updatedAt,
              // create/update local idbRestaurant and return network fetched Restaurant
              if (!idbRestaurant || (!idbRestaurant.awaitingSync && idbRestaurant.updatedAt !== restaurant.updatedAt)) {
                restaurantStore.put(restaurant);
              }
              // else if local idbRestaurant is awaitingSync, use that instead.
              else if (idbRestaurant.awaitingSync) {
                restaurant = idbRestaurant;
              }
              tx.complete;
              return restaurant;
            });
          });
        },
        function onrejected(error) {
          //TODO: handle offline mode (couldn't fetch restaurant from API)
          console.error(`${error}\n Trying local indexedDB database...`);
          return dbPromise.then(db => {
            const tx = db.transaction('restaurants');
            const restaurantStore = tx.objectStore('restaurants');

            return restaurantStore.get(id);
          })
          .then(idbRestaurant => {
            if (!idbRestaurant) {
              return Promise.reject(`No match found for restaurant with id: ${id} in iDB either...`);
            }
            return idbRestaurant;
          })
        }
      );
  }

  /**
   * Fetch all reviews for a Restaurant by its id using Promises. Resolves to an Array of reviews objects.
   *
   * @param {number} id a valid restaurant id
   */
  static fetchReviewsByRestaurantId(id) {
    id = Number(id); // Make sure id is a number. Strings will give an error in iDB.
    return fetch(`${DBHelper.API_URL}/reviews/?restaurant_id=${id}`)
      .then(response => {
        if (!response.ok) {
          return Promise.reject(`API Fetch request to ${response.url} failed with code: ${response.status}`);
        }
        return response.json();
      })
      .then(
        function onfulfilled(reviews) {
          //TODO: after successfully fetching reviews from API,
          // store/update local iDB reviews database
          dbPromise.then(db => {
            const tx = db.transaction('reviews', 'readwrite');
            const reviewStore = tx.objectStore('reviews');
            reviews.forEach(review => {
              reviewStore.get(review.id)
                .then(stored => {
                  // only update iDB review data if data is new or has been updated.
                  // if review is not stored OR stored updatedAt date doesn't match, create/update.
                  if (!stored || stored.updatedAt !== review.updatedAt) {
                    reviewStore.put(review);
                  }
                });
            });
            return tx.complete // make sure readwrite transaction was successful.
          }).catch(console.error);

          return reviews; // Return reviews fetched from network.
        },
        function onrejected(error) {
          //TODO: handle offline mode (couldn't fetch reviews from API)
          console.error(`${error}\n Trying local iDB database...`);
          return dbPromise.then(db => {
            const tx = db.transaction('reviews');
            const reviewStore = tx.objectStore('reviews');
            const restaurantIdIndex = reviewStore.index('restaurant_id');

            return restaurantIdIndex.getAll(id)
              .then(stored => {
                //TODO: handle possible no match, or error
                if (!stored) return []; // return an empty array if stored is undefined
                return stored;
              });
          });
        }
      )
      .then(fetchedRevies => {
        return DBHelper.getOfflineReviews(fetchedRevies, id); // get offlineReviews as well, and return combined array
      });
  }

  // TODO: This method is never used. Delete if not needed.
  /**
   * Fetch restaurants by a cuisine type with proper error handling.
   */
  static fetchRestaurantByCuisine(cuisine, callback) {
    // Fetch all restaurants  with proper error handling
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Filter restaurants to have only given cuisine type
        const results = restaurants.filter(r => r.cuisine_type == cuisine);
        callback(null, results);
      }
    });
  }

  // TODO: This method is never used. Delete if not needed.
  /**
   * Fetch restaurants by a neighborhood with proper error handling.
   */
  static fetchRestaurantByNeighborhood(neighborhood, callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Filter restaurants to have only given neighborhood
        const results = restaurants.filter(r => r.neighborhood == neighborhood);
        callback(null, results);
      }
    });
  }

  /**
   * Fetch restaurants filtered by cuisine and neighborhood using promises.
   * @param {string} cuisine cuisine filter
   * @param {string} neighborhood neighborhood filter
   * @returns {Promise.<Object[]>} A promise that resolves to an Array of filtered restaurants.
   */
  static fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood) {
    return DBHelper.fetchRestaurantsPromise()
      .then(restaurants => {
        // filter restaurants by cuisine and neighborhood, if any ('all' means no filter)
        if (cuisine != 'all') { // filter by cuisine
          restaurants = restaurants.filter(r => r.cuisine_type == cuisine);
        }
        if (neighborhood != 'all') { // filter by neighborhood
          restaurants = restaurants.filter(r => r.neighborhood == neighborhood);
        }
        return restaurants;
      }).catch(console.log);
  }

  // TODO: This method has been replaced by getNeighborhoods() to reduce
  // fetch requests to the API. Delete if not needed anymore.
  /**
   * Fetch a list of unique neighborhoods from API
   * @returns A promise that resolves to an array of unique neighborhoods
   */
  static fetchNeighborhoods() {
    return DBHelper.fetchRestaurantsPromise()
      .then(restaurants => {
        // Get all neighborhoods from all restaurants
        const neighborhoods = restaurants.map((v, i) => restaurants[i].neighborhood);
        // Remove duplicates from neighborhoods
        const uniqueNeighborhoods = neighborhoods.filter((v, i) => neighborhoods.indexOf(v) == i);
        return uniqueNeighborhoods;
      }).catch(console.log);
  }

  /**
   * Get a list of unique neighborhoods from provided restaurants.
   *
   * @param {Array.<{ neighborhood: string}>} restaurants Array of restaurant objects with at least above information.
   */
  static getNeighborhoods(restaurants) {
    const neighborhoods = restaurants.map((v, i) => restaurants[i].neighborhood);
    // Remove duplicates from neighborhoods
    const uniqueNeighborhoods = neighborhoods.filter((v, i) => neighborhoods.indexOf(v) == i);
    return uniqueNeighborhoods;
  }

  // TODO: This method has been replaced by getCuisines() to reduce
  // fetch requests to the API. Delete if not needed anymore.
  /**
   * Fetch a list of unique cuisines from API.
   * @returns A promise that resolves to an array of unique cuisines
   */
  static fetchCuisines() {
    return DBHelper.fetchRestaurantsPromise()
      .then(restaurants => {
        // Get all cuisines from all restaurants
        const cuisines = restaurants.map((v, i) => restaurants[i].cuisine_type);
        // Remove duplicates from cuisines
        const uniqueCuisines = cuisines.filter((v, i) => cuisines.indexOf(v) == i);
        return uniqueCuisines;
      }).catch(console.log);
  }

  /**
   * Get a list of unique cuisines from provided restaurants.
   *
   * @param {Array.<{cuisine_type: string}>} restaurants Array of restaurant objects with at least above information.
   */
  static getCuisines(restaurants) {
    const cuisines = restaurants.map((v, i) => restaurants[i].cuisine_type);
    // Remove duplicates from cuisines
    const uniqueCuisines = cuisines.filter((v, i) => cuisines.indexOf(v) == i);
    return uniqueCuisines;
  }

  /**
   * Restaurant page URL. It uses restaurant.id to create URL.
   */
  static urlForRestaurant(restaurant) {
    return (`./restaurant.html?id=${restaurant.id}`);
  }

  /**
   * Restaurant image placeholder image URL for lazy loading. It uses restaurant.photograph
   * and fallbacks to restaurant.id if former is missing.
   */
  static imageHolderUrlForRestaurant(restaurant) {
    let url = `/img/${(restaurant.photograph||restaurant.id)}-placeholder.jpg`
    return url;
  }

  /**
   * Restaurant image URL. It defaults to a medium sized image. It uses restaurant.photograph
   * and fallbacks to restaurant.id if former is missing.
   */
  static imageUrlForRestaurant(restaurant) {
    let url = `/img/${(restaurant.photograph||restaurant.id)}-medium.jpg`;
    return url;
  }

  /**
   * Restaurant srcset attribute for browser to decide best resolution. It uses restaurant.photograph
   * and fallbacks to restaurant.id if former is missing.
   */
  static imageSrcsetForRestaurant(restaurant) {
    const imageSrc = `/img/${(restaurant.photograph||restaurant.id)}`;
    return `${imageSrc}-small.jpg 240w,
            ${imageSrc}-medium.jpg 400w,
            ${imageSrc}-large.jpg 800w`;
  }

  /**
   * Restaurant sizes attribute so browser knows image sizes before deciding wich image to download
   * with srcset. It uses restaurant.photograph and fallbacks to restaurant.id if former is missing.
   */
  static imageSizesForRestaurant(restaurant) {
    return `(max-width: 320px) 240px,
            (max-width: 599px) 500px,
            400px`;
  }

  /**
   * Get date in format "Month DD, YYYY" from valid timestamp or date string
   *
   * @param {(number|string)} timestamp A valid timestamp or date string
   */
  static getDate(timestamp) {
    const date = new Date(timestamp);
    const months = [
      'January', 'February', 'March',
      'April', 'May', 'June',
      'July', 'August', 'September',
      'October', 'November', 'December'
    ];
    const month = months[date.getMonth()];
    const day = date.getDate();
    const year = date.getFullYear();
    return `${month} ${day}, ${year}`;
  }

  /**
   * Map marker for a restaurant.
   */
  /*static mapMarkerForRestaurant(restaurant, map) {
    const marker = new google.maps.Marker({
      position: restaurant.latlng,
      title: restaurant.name,
      url: DBHelper.urlForRestaurant(restaurant),
      map: map,
      animation: google.maps.Animation.DROP}
    );
    return marker;
  } /** */
  static mapMarkerForRestaurant(restaurant, map) {
    // https://leafletjs.com/reference-1.3.0.html#marker
    const marker = new L.marker([restaurant.latlng.lat, restaurant.latlng.lng],
      {title: restaurant.name,
      alt: restaurant.name,
      url: DBHelper.urlForRestaurant(restaurant)
      })
      marker.addTo(map);
    return marker;
  }

  // TODO: Create a helper method to mark a restaurant as a favorite. Use Background Sync
  // to make it work offline, fallback to a PUT fetch if service worker isn't supported,
  // or if any errors happen.
  /**
   * Mark Restaurant as favorite (true) or not (false) using Promises.
   *
   * @param {number} id Id of the restaurant.
   * @param {boolean} isFavorite Whether restaurant is favorite or not.
   */
  static markFavorite(id, isFavorite) {
    id = Number(id) // REMEMBER to make id a number, otherwise it won't work in iDB .get() method 🙄
    const url = `${DBHelper.API_URL}/restaurants/${id}/?is_favorite=${isFavorite}`;
    const PUT = {method: 'PUT'};

    // if either SyncManager OR Service Worker aren't supported, just make a PUT fetch as usual
    if (!window.SyncManager || !navigator.serviceWorker) {
      return fetch(url, PUT);
    }

    // Do not make a fetch request, but instead save url to iDB, reguister
    // a background sync, and have the service worker fetch the request from iDB
    // when a sync is triggered. 😎
    return dbPromise.then(db => {
      const tx = db.transaction('syncFavorites', 'readwrite');
      const syncFavoriteStore = tx.objectStore('syncFavorites');
      const sync = {"restaurant_id": id, "url": url};
      syncFavoriteStore.put(sync);
      return tx.complete;
    })
    .then(() => {
      // register sync iDB transaction was successfull
      navigator.serviceWorker.ready.then(function (reg) {
        reg.sync.register('syncFavorites');
      }).catch(function (e) {
        console.error(e, "System was unable to register for a sync");
      });
      // Update local iDB data so data is updated online
      return dbPromise.then(db => {
        const tx = db.transaction('restaurants', 'readwrite');
        const restaurantStore = tx.objectStore('restaurants');

        restaurantStore.get(id).then(restaurant => {
          const isoDate = new Date().toISOString(); // sails actually uses ISO date format
          restaurant.is_favorite = String(isFavorite);
          restaurant.updatedAt = isoDate;

          // use this property to know if data was updated while offline. If data couldn't be
          // synced for any reason, this property should be removed, so data is overwritten by
          // server data in the next page load.
          // Obviously, since server doesn't include this property, it won't exists when updating data
          // from server.
          restaurant.awaitingSync = true;
          restaurantStore.put(restaurant);
        });

        return tx.complete;
      });
    }).catch((e) => {
      console.error(e);
      // TODO: if iDB couldn't be used, or an error was thrown, try a fetch request without background sync.
      return fetch(url, PUT);
    });
  }

  /**
   * Rerturns a promise that resolves to a new Array of review objects containing reviews fetched from network/iDB (passed
   * as an argument) and any reviews stored while offline in iDB.
   *
   * @param {Array.<Object>} fetchedReviews Array of review objects, fetched from network.
   * @param {number} restaurantId Id of the restaurant we're fetching reviews for.
   *
   * @returns {Promise.<Array.<Object>>} A promise that resolves to an array of review objects containing fetchedReviews and offline reviews.
   */
  static getOfflineReviews(fetchedReviews, restaurantId) {
    restaurantId = Number(restaurantId); // make sure id is a number for iDB
    return dbPromise.then(db => {
      const tx = db.transaction('offlineReviews');
      const offlineReviewStore = tx.objectStore('offlineReviews');
      const restaurantIdIndex = offlineReviewStore.index('restaurant_id');

      return restaurantIdIndex.getAll(restaurantId).then(offlineReviews => {
        if(!offlineReviews) offlineReviews = []; // if offlineReviews is undefined because of no matches, make it an empty array.
        fetchedReviews.push(...offlineReviews);
        return fetchedReviews;
      });
    });
  }
}
