let restaurant;
var map;

/**
 * Populate restaurant and review information, and initialize Google map.
 * To be called from HTML deferred script as a callback in Google Maps API as initMap
 * (not window.initMap).
 */
window.initMap = () => {
  // Use a promise chain to populate restaurant info. Each function pipes the restaurant object
  // to the next one. All Functions should pipe the argument to make it easier to execute a Promise chain.
  fetchRestaurantFromURL()
    .then(fillBreadcrumb)
    .then(fillRestaurantHTML)
    .then(fillRestaurantHoursHTML)
    .then(createMap)
    .then(fillReviewsHTML)
    .catch(console.log);
}

/**
 *
 * @param {{name: string, latlng: {lat: number, lng: number}}} restaurant object with at least the above restaurant information.
 * @returns {Object} returns/pipes **restaurant** argument same way it was passed to promise chain.
 */
const createMap = (restaurant) => {
  // Create new google map
  self.map = new google.maps.Map(document.getElementById('map'), {
    zoom: 16,
    center: restaurant.latlng,
    scrollwheel: false
  });
  // Add marker to map
  DBHelper.mapMarkerForRestaurant(restaurant, self.map);
  // return restaurant object to promise chain
  return restaurant;
};

/**
 * Get current restaurant from page URL, if any. Returns a Promise that resolves to a restaurant object,
 * or rejects it if id isn't pressent as a parameter or is invalid.
 */
const fetchRestaurantFromURL = () => {
  const id = getParameterByName('id');
  if (!id) {
    return Promise.reject('No restaurant id in URL');
  }

  return DBHelper.fetchRestaurantById(id);
}

/**
 * Create restaurant HTML and add it to the webpage. Pipes argument back.
 *
 * @param {{id: number, name: string, address: string, cuisine_type: string, photograph: number}} restaurant object with at least the above restaurant information
 * @returns {Object} returns/pipes restaurant argument same way it was passed.
 */
const fillRestaurantHTML = (restaurant) => {
  const name = document.getElementById('restaurant-name');
  name.innerHTML = restaurant.name;

  const address = document.getElementById('restaurant-address');
  address.innerHTML = restaurant.address;

  const image = document.getElementById('restaurant-img');
  image.className = 'restaurant-img'
  // give descriptive image alt
  image.alt=`Picture of ${restaurant.name}`;
  image.src = DBHelper.imageUrlForRestaurant(restaurant);
  image.srcset = DBHelper.imageSrcsetForRestaurant(restaurant);
  image.sizes = DBHelper.imageSizesForRestaurant(restaurant);

  const cuisine = document.getElementById('restaurant-cuisine');
  cuisine.innerHTML = restaurant.cuisine_type;

  return restaurant;
}

/**
 * if restaurant.operating_hours is defined, create restaurant operating hour's HTML table and add it to the webpage.
 *
 * @param {{?operating_hours: {weekday: string}}} restaurant
 * @returns {Object} returns/pipes **restaurant** argument same way it was passed.
 */
const fillRestaurantHoursHTML = (restaurant) => {
  let operatingHours = restaurant.operating_hours;
  // if there are no operating_hours, exit to promise chain
  if (!operatingHours) {
    return restaurant;
  }
  const hours = document.getElementById('restaurant-hours');
  for (let key in operatingHours) {
    const row = document.createElement('tr');

    // the day should be the header of the row in the generated table
    const day = document.createElement('th');
    day.setAttribute("scope", "row");
    day.innerHTML = key;
    row.appendChild(day);

    const time = document.createElement('td');
    // Split multiple hours in one day by inserting a new line. They are coma
    // separated, so just replace "," for "<br>"
    time.innerHTML = operatingHours[key].replace(",","<br>");
    row.appendChild(time);

    hours.appendChild(row);
  }
  return restaurant;
}

/**
 * Fetch and create all HTLM reviews for current restaurant.
 *
 * @param {{id: (number|string)}} restaurant object with at least the above restaurant information provided.
 * @returns {Object} returns/pipes **restaurant** argument same way it was passed.
 */
const fillReviewsHTML = (restaurant) => {
  DBHelper.fetchReviewsByRestaurantId(restaurant.id)
    .then(reviews => {
      const container = document.getElementById('reviews-container');
      const title = document.createElement('h2');
      title.innerHTML = 'Reviews';
      container.appendChild(title);
      // if no reviews, let user know, and exit sooner.
      if (!reviews) {
        const noReviews = document.createElement('p');
        noReviews.innerHTML = 'No reviews yet!';
        container.appendChild(noReviews);
        return;
      }
      const ul = document.getElementById('reviews-list');
      reviews.forEach(review => {
        ul.appendChild(createReviewHTML(review));
      });
      container.appendChild(ul);
    })
    .catch(console.log);
  return restaurant;
}

/**
 * Creates review <li> element and returns it.
 *
 * @param {{name: string, createdAt: number, rating: number, comments: string,}} review object with at least the above review information.
 */
const createReviewHTML = (review) => {
  const li = document.createElement('li');
  const name = document.createElement('p');
  name.className = "name";
  name.innerHTML = review.name;
  li.appendChild(name);

  const date = document.createElement('p');
  date.className = "date";
  date.innerHTML = DBHelper.getDate(review.createdAt);
  li.appendChild(date);

  const rating = document.createElement('p');
  rating.className = "rating";
  rating.innerHTML = `Rating: ${review.rating}`;
  li.appendChild(rating);

  const comments = document.createElement('p');
  comments.innerHTML = review.comments;
  li.appendChild(comments);

  return li;
}

/**
 * Add restaurant name to the breadcrumb navigation menu
 *
 * @param {{name: string}} restaurant object with at least the above restaurant information
 * @returns {Object} returns/pipes **restaurant** argument same way it was passed to promise chain.
 */
const fillBreadcrumb = (restaurant) => {
  const breadcrumb = document.getElementById('breadcrumb');
  const li = document.createElement('li');
  // aria says we have to provide a last <a> element with
  // aria-current property set to "page"
  const a = document.createElement('a');
  a.setAttribute("aria-current", "page");
  // this <a> element should point to current page
  a.href=`${location.pathname}${location.search}`;
  a.innerHTML = restaurant.name;
  li.appendChild(a);
  breadcrumb.appendChild(li);
  return restaurant;
}

/**
 * Get value from a parameter in a URL. Default url is window.location.href.
 *
 * @param {string} name parameter's name
 */
const getParameterByName = (name, url = window.location.href) => {
  name = name.replace(/[\[\]]/g, '\\$&');
  const regex = new RegExp(`[?&]${name}(=([^&#]*)|&|#|$)`),
    results = regex.exec(url);
  if (!results)
    return null;
  if (!results[2])
    return '';
  return decodeURIComponent(results[2].replace(/\+/g, ' '));
}
