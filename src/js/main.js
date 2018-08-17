var map; // Global variable to hold Google Maps information
self.markers = []; // Global variable to hold current map markers.

/**
 * Initialize Google map, set its markers, and populate restaurant list.
 * To be called from HTML deferred script as a callback in Google Maps API as initMap
 * (not window.initMap). Example:
 *                                                                                                                            ↓↓↓↓↓↓↓
 * <script async defer src="https://maps.googleapis.com/maps/api/js?key=<key>&libraries=places&language=en&region=US&callback=initMap"></script>
 */
window.initMap = () => {
  let loc = {
    lat: 40.722216,
    lng: -73.987501
  };
  self.map = new google.maps.Map(document.getElementById('map'), {
    zoom: 12,
    center: loc,
    scrollwheel: false
  });
  // Fetch all restaurants when initializing map (main page is loaded for the first time)
  // and populate filter options, update restaurant list and map markers accordingly
  DBHelper.fetchRestaurantsPromise()
    .then(fillNeighborhoodsHTML)
    .then(fillCuisinesHTML)
    .then(updateRestaurants)
    .catch(console.log);
}

/**
 * Set neighborhoods filter option's HTML.
 *
 * @param {Array.<{neighborhood: string}>} restaurants Array of restaurant objects with at least above information.
 * @returns {Object[]} returns/pipes **restaurants** argument same way it was passed back to promise chain.
 */
const fillNeighborhoodsHTML = (restaurants) => {
  const neighborhoods = DBHelper.getNeighborhoods(restaurants);
  const select = document.getElementById('neighborhoods-select');
  neighborhoods.forEach(neighborhood => {
    const option = document.createElement('option');
    option.innerHTML = neighborhood;
    option.value = neighborhood;
    select.append(option);
  });
  return restaurants;
}

/**
 * Set cuisines filter result's HTML.
 * @param {Array.<{cuisine_type: string}>} restaurants Array or restaurant objects with at least the above information.
 * @returns {Object[]} returns/pipes **restaurants** argument same way it was passed back to promise chain.
*/
const fillCuisinesHTML = (restaurants) => {
  const cuisines = DBHelper.getCuisines(restaurants);
  const select = document.getElementById('cuisines-select');
  cuisines.forEach(cuisine => {
    const option = document.createElement('option');
    option.innerHTML = cuisine;
    option.value = cuisine;
    select.append(option);
  });
  return restaurants;
}

/**
 * Update restaurant list and map markers for currenty selected restaurant filter options. If an Array of restaurant objects
 * is passed, that will be used to update list and markers in map. This can be used to populate list and map markers when page
 * is loaded for the first time, or when restaurants had been previously fetched in promise chain.
 *
 * Otherwise restaurants will be fetched from API, which can be used when filter options are selected, and list and markers need
 * to fetch API data again.
 *
 * To be called from HTML file with each select's onchange property.
 *
 * @param {Array.<Object>} restaurants Optional array of restaurant objects. Pass this argument if restaurants have been fetched in promise chain already.
 */
const updateRestaurants = (restaurants = null) => {
  // if restaurants argument is passed, then page is being loaded for the first time, or
  // restaurants have been fetched already in promise chain.
  if (restaurants) {
    return Promise.resolve(restaurants)
    .then(fillRestaurantsHTML)
    .then(addMarkersToMap)
    .then(lazyLoadImages)
    .catch(console.log);
  }
  // Otherwise, a filter option called this function, and data needs to be fetched and updated.
  const cSelect = document.getElementById('cuisines-select');
  const nSelect = document.getElementById('neighborhoods-select');

  const cIndex = cSelect.selectedIndex;
  const nIndex = nSelect.selectedIndex;

  const cuisine = cSelect[cIndex].value;
  const neighborhood = nSelect[nIndex].value;

  // TODO: conver to promise base function
  return DBHelper.fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood)
    .then(resetRestaurants)
    .then(fillRestaurantsHTML)
    .then(addMarkersToMap)
    .then(lazyLoadImages)
    .catch(console.log);
}

/**
 * Clear current restaurants, their HTML and remove their map markers. Always use before fillRestaurantsHTML() in a promise chain.
 * @param {Object[]} restaurants Array of restaurant objects.
 * @returns restaurants In same state as it was passed.
 */
const resetRestaurants = (restaurants) => {
  // Remove all restaurants from html list
  const ul = document.getElementById('restaurants-list');
  ul.innerHTML = '';

  // Remove all map markers
  self.markers.forEach(m => m.setMap(null));
  self.markers = [];

  // return restaurants with no changes. Just pipe it to the next promise chain
  return restaurants;
}

/**
 * Create all restaurants HTML and add them to the webpage. Use resetRestaurants() in promise
 * chain before using this function.
 * @param {Object[]} restaurants Array of restaurant objects.
 * @returns restaurants In same state as it was passed.
 */
const fillRestaurantsHTML = (restaurants) => {
  const ul = document.getElementById('restaurants-list');
  restaurants.forEach(restaurant => {
    ul.append(createRestaurantHTML(restaurant));
  });
  return restaurants;
}

/**
 * Create restaurant HTML.
 * @param {Object} restaurant object with restaurant information.
 * @returns An HTML <li> element with populated restaurant information.
 */
const createRestaurantHTML = (restaurant) => {
  const li = document.createElement('li');

  const image = document.createElement('img');
  image.className = 'restaurant-img';
  image.alt = `Picture of ${restaurant.name}`;

  // class lazy is for images that use lazy loading
  image.classList.add('lazy');
  // use a placeholder image, which should be a 64px low quality image ~1kb
  image.src = DBHelper.imageHolderUrlForRestaurant(restaurant);

  // store image src, src and sizes in dataset for use in lazy loading
  image.dataset.src = DBHelper.imageUrlForRestaurant(restaurant);
  image.dataset.srcset = DBHelper.imageSrcsetForRestaurant(restaurant);
  image.dataset.sizes = DBHelper.imageSizesForRestaurant(restaurant);

  li.append(image);

  const name = document.createElement('h1');
  name.innerHTML = restaurant.name;
  li.append(name);

  const neighborhood = document.createElement('p');
  neighborhood.innerHTML = restaurant.neighborhood;
  li.append(neighborhood);

  const address = document.createElement('p');
  address.innerHTML = restaurant.address;
  li.append(address);

  //TODO: add favorite toggle button. Use a button to get its accessibility advandages. For toggle buttons see:
  //https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/ARIA_Techniques/Using_the_button_role#Toggle_buttons
  const favorite = document.createElement('button');
  favorite.innerHTML = "&#x2764;";
  favorite.classList.add('fav-toggle');
  favorite.dataset.restaurant_id = restaurant.id;
  favorite.setAttribute("aria-pressed", restaurant.is_favorite || false); // false if undefined

  const toggleButton = function() {
    let favorite = this.getAttribute("aria-pressed") === "true";
    if (favorite === "true") {
      this.setAttribute("aria-pressed", "false");
      //TODO: make a handle request that sets restaurant as false or true
      // set restaurant as not favorite
    } else {
      this.setAttribute("aria-pressed", "true");
      //TODO: set restaurant as favorite
    }
  };
  favorite.onclick = toggleButton;
  li.append(favorite);

  const more = document.createElement('a');
  more.innerHTML = 'View Details';
  more.href = DBHelper.urlForRestaurant(restaurant);
  /**
   * Use aria-label to give a more descriptive link for each restaurant.
   */
  more.setAttribute("aria-label", "View Details about " + restaurant.name);
  li.append(more)

  return li
}

/**
 * Add markers for current restaurants to the map.
 */
const addMarkersToMap = (restaurants) => {
  restaurants.forEach(restaurant => {
    // Add marker to the map
    const marker = DBHelper.mapMarkerForRestaurant(restaurant, self.map);
    google.maps.event.addListener(marker, 'click', () => {
      window.location.href = marker.url
    });
    self.markers.push(marker);
  });
}

/**
 * Implement lazy loading using an Intersection Observer. Fallback to no lazy loading
 * if feature is not supported by browser.
 *
 * MUST be used after restaurant information has been populated on page by javascript. So use
 * as last function in promise chain
 */
const lazyLoadImages = () => {
  // Script for lazy loading images
  // see: https://developers.google.com/web/fundamentals/performance/lazy-loading-guidance/images-and-video/

  // All images with class lazy are now loaded into an array, so is possible to use forEach()
  var lazyImages = [].slice.call(document.querySelectorAll("img.lazy"));

  if ("IntersectionObserver" in window) {
    let lazyImageObserver = new IntersectionObserver(function(entries, observer) {
      entries.forEach(function(entry) {
        if (entry.isIntersecting) {
          let lazyImage = entry.target;
          lazyImage.src = lazyImage.dataset.src;
          lazyImage.srcset = lazyImage.dataset.srcset;
          lazyImage.sizes = lazyImage.dataset.sizes;
          lazyImage.classList.remove("lazy");
          lazyImageObserver.unobserve(lazyImage);
        }
      });
    });

    lazyImages.forEach(function(lazyImage) {
      lazyImageObserver.observe(lazyImage);
    });
  } else {
    // If the IntersectionObserver isn't supported by the browser, then not lazy loading :(
      lazyImages.forEach(lazyImage => {
        lazyImage.src = lazyImage.dataset.src;
        lazyImage.src = lazyImage.dataset.src;
        lazyImage.srcset = lazyImage.dataset.srcset;
        lazyImage.sizes = lazyImage.dataset.sizes;
        lazyImage.classList.remove("lazy");
      });
  }
};

/** Register Service Worker */

function registerServiceWorker () {

  if (!navigator.serviceWorker) return;

  navigator.serviceWorker.register('/sw.js').then(function(reg) {
    console.log("Service Worker has been registered successfully!");
  }).catch((e) => {
    console.log("Coudn't register service worker... \n", e);
  });
}

//registerServiceWorker();
