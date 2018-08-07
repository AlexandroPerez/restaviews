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
    //TODO: Change returned URL so that it can be used to access API in port 1337
    const protocol = window.location.protocol;
    const host =  window.location.host;
    return `${protocol}//${host}/data/restaurants.json`;
  }

  /**
   * Fetch all restaurants
   * @returns {Promise.<Object[]>} A promise that resolves to an Array of restaurant objects (parsed json response).
   */
  static fetchRestaurantsPromise() {
    // TODO: use DBHelper.DATABASE_URL
    // TODO: replace old fetchRestaurants() with this new promise based function.
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
   * Fetch restaurants filtered by cuisine and neighborhood using promises.
   * @param {string} cuisine cuisine filter
   * @param {string} neighborhood neighborhood filter
   * @returns {Promise.<Object[]>} A promise that resolves to an Array of filtered restaurants.
   */
  //static fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, callback) {
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
      });

    /*// Fetch all restaurants
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
    });/** */
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
   * Fetch all cuisines using promises.
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
    // Fetch all restaurants
    /*DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Get all cuisines from all restaurants
        const cuisines = restaurants.map((v, i) => restaurants[i].cuisine_type)
        // Remove duplicates from cuisines
        const uniqueCuisines = cuisines.filter((v, i) => cuisines.indexOf(v) == i)
        callback(null, uniqueCuisines);
      }
    });/** */
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

}
