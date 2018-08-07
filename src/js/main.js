var map; // Global variable to hold Google Maps information
self.markers = []; // Global variable to hold current map markers.

/**
 * Fetch neighborhoods and cuisines as soon as the page is loaded, and update filter
 * options ONLY.
 */
document.addEventListener('DOMContentLoaded', (event) => {
  fetchNeighborhoods();
  fetchCuisines();
});

/**
 * Fetch all neighborhoods and update ONLY neighborhood Filter Results options.
 */
const fetchNeighborhoods = () => {
  return DBHelper.fetchNeighborhoods()
    .then(fillNeighborhoodsHTML)
    .catch(console.log);
}

/**
 * Set neighborhoods filter option's HTML
 * @param {Array.<string>} neighborhoods Array of neighborhood strings.
 */
const fillNeighborhoodsHTML = (neighborhoods) => {
  const select = document.getElementById('neighborhoods-select');
  neighborhoods.forEach(neighborhood => {
    const option = document.createElement('option');
    option.innerHTML = neighborhood;
    option.value = neighborhood;
    select.append(option);
  });
}

/**
 * Fetch all cuisines and update ONLY cuisine Filter Results options
 */
const fetchCuisines = () => {
  return DBHelper.fetchCuisines()
    .then(fillCuisinesHTML)
    .catch(console.log);
}

/**
 * Set cuisines filter result's HTML.
 * @param {Array.<string>} cuisines Array of cuisine strings.
 */
const fillCuisinesHTML = (cuisines) => {
  const select = document.getElementById('cuisines-select');

  cuisines.forEach(cuisine => {
    const option = document.createElement('option');
    option.innerHTML = cuisine;
    option.value = cuisine;
    select.append(option);
  });
}

/**
 * Initialize Google map, set markers its markers, and populate restaurant list.
 * To be called from HTML deferred script as a callback in Google Maps API as initMap
 * (not window.initMap).
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
  updateRestaurants();
}

/**
 * Update page and map markers for currenty selected restaurant filter options. Defaults
 * to all restaurants.
 * To be called from HTML file with each select's onchange property
 * (currently cuisine and neighborhood select elements).
 */
const updateRestaurants = () => {
  const cSelect = document.getElementById('cuisines-select');
  const nSelect = document.getElementById('neighborhoods-select');

  const cIndex = cSelect.selectedIndex;
  const nIndex = nSelect.selectedIndex;

  const cuisine = cSelect[cIndex].value;
  const neighborhood = nSelect[nIndex].value;

  // TODO: conver to promise base function
  DBHelper.fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood)
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
