var staticCacheName = 'restaviews-static-v1.0';
/**
 * Common database helper functions.
 */
class DBHelper {

  /**
   * Database URL.
   * Change this to restaurants.json file location on your server.
   */
  static get DATABASE_URL() {
    /* Fixed so that regardless of location, the database
     * can be accessed. Previous code:
     *
     *    const port = 8000 // Change this to your server port
     *    return `http://localhost:${port}/data/restaurants.json`;
     *
     */
    const protocol = window.location.protocol;
    const host =  window.location.host;
    return `${protocol}//${host}/data/restaurants.json`;
  }

  /**
   * Fetch all restaurants
   * @returns A promise with a json response.
   */
  static fetchRestaurantsPromise() {
    // TODO: use fetch API, return promise and use dynamic urls instead of typed in ones
    return fetch('http://localhost:1337/restaurants')
      .then(response => {
        if (!response.ok) {
          throw Error(`Fetch request for ${response.url} failed with code: ${response.status}`);
        }
        return response.json();
      })
      .catch(console.log);
  }

  /**
   * Fetch all restaurants.
   * @param {function} callback callback(error, restaurants)
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
   * Fetch a restaurant by its ID.
   */
  static fetchRestaurantById(id, callback) {
    // fetch all restaurants with proper error handling.
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        const restaurant = restaurants.find(r => r.id == id);
        if (restaurant) { // Got the restaurant
          callback(null, restaurant);
        } else { // Restaurant does not exist in the database
          callback('Restaurant does not exist', null);
        }
      }
    });
  }

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
   * Fetch restaurants by a cuisine and a neighborhood with proper error handling.
   * @param {string} cuisine cuisine filter
   * @param {string} neighborhood neighborhood filter
   * @param {function} callback callback(error, filteredRestaurants)
   */
  static fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        let results = restaurants
        if (cuisine != 'all') { // filter by cuisine
          results = results.filter(r => r.cuisine_type == cuisine);
        }
        if (neighborhood != 'all') { // filter by neighborhood
          results = results.filter(r => r.neighborhood == neighborhood);
        }
        callback(null, results);
      }
    });
  }

  /**
   * Fetch all neighborhoods using promises
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
   * Fetch all cuisines with proper error handling.
   */
  static fetchCuisines(callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Get all cuisines from all restaurants
        const cuisines = restaurants.map((v, i) => restaurants[i].cuisine_type)
        // Remove duplicates from cuisines
        const uniqueCuisines = cuisines.filter((v, i) => cuisines.indexOf(v) == i)
        callback(null, uniqueCuisines);
      }
    });
  }

  /**
   * Restaurant page URL.
   */
  static urlForRestaurant(restaurant) {
    return (`./restaurant.html?id=${restaurant.id}`);
  }

  /**
   * Restaurant image URL.
   * I edited the helper because code should be reusable! Right? ;)
   */
  static imageHolderUrlForRestaurant(restaurant) {
    // return a tyny image as placeholder for lazy loading
    return (`/img/${restaurant.photograph.replace('.jpg', '-placeholder.jpg')}`);
  }
   static imageUrlForRestaurant(restaurant) {
    // default to medium sized image
    return (`/img/${restaurant.photograph.replace('.jpg', '-medium.jpg')}`);
  }
  static imageSrcsetForRestaurant(restaurant) {
    // default to medium sized image
    const imageSrc = `/img/${restaurant.photograph}`;
    return `${imageSrc.replace('.jpg', '-small.jpg')} 240w,
            ${imageSrc.replace('.jpg', '-medium.jpg')} 400w,
            ${imageSrc.replace('.jpg', '-large.jpg')} 800w`;
  }
  static imageSizesForRestaurant(restaurant) {
    return `(max-width: 320px) 240px,
            (max-width: 599px) 500px,
            400px`;
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

}
