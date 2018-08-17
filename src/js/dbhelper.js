/**
 * Common database helper functions.
 */
class DBHelper {

  //TODO: old database url, delete after removing other old methods. See todos below.
  static get DATABASE_URL() {
    const protocol = window.location.protocol;
    const host =  window.location.host;
    return `${protocol}//${host}/data/restaurants.json`;
  }
  static get API_URL() {
    const protocol = window.location.protocol;
    const hostname = window.location.hostname;
    const port = 1337; // change this if port number of your sails server is different.
    return `${protocol}//${hostname}:${port}`;
  }

  // TODO: replace old fetchRestaurants() with this new promise based function.
  /**
   * Fetch all restaurants from API, and store results in indexedDB. If offline, fallback to indexedDB.
   * @returns {Promise.<Object[]>} A promise that resolves to an Array of restaurant objects.
   */
  static fetchRestaurantsPromise() {
    return fetch(`${DBHelper.API_URL}/restaurants`)
      .then(response => {
        if (!response.ok) {
          return Promise.reject(`API Fetch request to ${response.url} failed with code: ${response.status}`);
        }
        return response.json();
      })
      .then(
        function onfulfilled(restaurants) {
          // TODO: after successfully fetching restaurants from API,
          // store/update local indexedDB restaurants
          dbPromise.then(db => {
            const tx = db.transaction('restaurants', 'readwrite');
            const restaurantStore = tx.objectStore('restaurants');
            restaurants.forEach(restaurant => {
              restaurantStore.get(restaurant.id)
                .then(stored => {
                  // only update IDB restaurant data, if data is new or has been updated.
                  // If restaurant is not stored OR stored updated date doesn't match, create/update.
                  if (!stored || stored.updatedAt !== restaurant.updatedAt) {
                    restaurantStore.put(restaurant);
                  }
                });
            });
            return tx.complete; // make sure readwrite transaction was successful.
          }).catch(console.log);
          return restaurants; // Return restaurants fetched from network.
        },
        function onrejected(error) {
          //TODO: handle offline mode (couldn't fetch restaurants from API)
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
    id = Number(id); // Make sure id is a number. Strings will give an error in iDB.
    return fetch(`${DBHelper.API_URL}/restaurants/${id}`)
      .then(response => {
        if (!response.ok) {
          return Promise.reject(`API Fetch request to ${response.url} failed with code: ${response.status}`);
        }
        return response.json();
      })
      .then(
        function onfulfilled(restaurant) {
          //TODO: after successfully fetching restaurant from API,
          // store/update local iDB restaurant database
          dbPromise.then(db => {
            const tx = db.transaction('restaurants', 'readwrite');
            const restaurantStore = tx.objectStore('restaurants');
            restaurantStore.get(restaurant.id)
              .then(stored => {
                // only update iDB restaurant data, if data is new or has been updated.
                // if restaurant is not stored OR stored updated date doesn't match, create/update
                if (!stored || stored.updatedAt !== restaurant.updatedAt) {
                  restaurantStore.put(restaurant);
                }
              });
            return tx.complete // make sure readwrite transaction was successful.
          });
          return restaurant; // Return restaurant fetched from network.
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
                if (!stored || stored.length < 1) return Promise.reject('No reviews were found in iDB either. No way to know if Restaurant has reviews.');
                return stored;
              });
          });
        }
      );
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
  static mapMarkerForRestaurant(restaurant, map) {
    const marker = new google.maps.Marker({
      position: restaurant.latlng,
      title: restaurant.name,
      url: DBHelper.urlForRestaurant(restaurant),
      map: map,
      animation: google.maps.Animation.DROP}
    );
    return marker;
  }

  // TODO: Create a helper method to mark a restaurant as a favorite. Use Background Sync
  // to make it work offline
  /**
   * Mark Restaurant as favorite (true) or not (false) using Promises.
   *
   * @param {number} id Id of the restaurant.
   * @param {boolean} isFavorite Whether restaurant is favorite or not.
   */
  static markFavorite(id, isFavorite) {
    // Do not make a fetch request, but instead save url to iDB, reguister
    // a background sync, and have the service worker fetch the request from iDB
    // when a sync is triggered. 😎
    const url = `${DBHelper.API_URL}/restaurants/${id}/?is_favorite=${isFavorite}`;

    return dbPromise.then(db => {
      const tx = db.transaction('putRequests', 'readwrite');
      const putRequestStore = tx.objectStore('putRequests');

      putRequestStore.add(url);

      return tx.complete;
    })
    .then(() => {
      // register sync only if put request was successfully stored in iDB
      navigator.serviceWorker.ready.then(reg => reg.sync.register('putSync'));
    }).catch(() => {
      // TODO: if iDB couldn't be used, try a fetch request without background sync.
    });

    // return fetch(url, {method: "PUT"}).catch(console.error);

  }

}
