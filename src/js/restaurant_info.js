let restaurant;
var map;

/**
 * Populate restaurant and review information, and initialize Google map.
 * To be called from HTML deferred script as a callback in Google Maps API as initMap
 * (not window.initMap).
 */
document.addEventListener('DOMContentLoaded', (event) => {
  // Use a promise chain to populate restaurant info. Each function pipes the restaurant object
  // to the next one. All Functions should pipe the argument to make it easier to execute a Promise chain.
  fetchRestaurantFromURL()
    .then(fillBreadcrumb)
    .then(fillRestaurantHTML)
    .then(fillRestaurantHoursHTML)
    .then(initMap)
    .then(fillReviewsHTML)
    .catch(console.log);
});

/**
 *
 * @param {{name: string, latlng: {lat: number, lng: number}}} restaurant object with at least the above restaurant information.
 * @returns {Object} returns/pipes **restaurant** argument same way it was passed to promise chain.
 */
const initMap = (restaurant) => {
  // Create new google map
  /*self.map = new google.maps.Map(document.getElementById('map'), {
    zoom: 16,
    center: restaurant.latlng,
    scrollwheel: false
  });/** */

  // Create new openstreetmap
  self.map = L.map('map', {
    center: [restaurant.latlng.lat, restaurant.latlng.lng],
    zoom: 16,
    scrollWheelZoom: false,
    dragging: false,
  });
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 18,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  }).addTo(map);

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
  const container = document.getElementById('reviews-container');
  const title = document.createElement('h2');
  title.innerHTML = 'Reviews';
  container.appendChild(title);

  DBHelper.fetchReviewsByRestaurantId(restaurant.id)
    .then(reviews => {
      // create form for adding reviews
      const form = createReviewForm('review', restaurant.id);
      const leaveReview = document.createElement('h3');
      leaveReview.innerText = "Leave a Review";


      // if no reviews, let user know, and exit sooner.
      if (!reviews) {
        const noReviews = document.createElement('p');
        noReviews.innerHTML = 'No reviews yet! Be the first one!';
        container.appendChild(noReviews);
        container.appendChild(leaveReview);
        container.appendChild(form);
        return;
      }
      const ul = document.getElementById('reviews-list');
      reviews.forEach(review => {
        ul.appendChild(createReviewHTML(review));
      });
      container.appendChild(ul);
      container.appendChild(leaveReview);
      container.appendChild(form);
    })
    .catch(e => {
      console.error(e);
      // If no reviews could be fetched from API or iDB, handle error and let user know
      const offline = document.createElement('p');
      offline.classList.add('error');
      offline.innerHTML = `Unfortunately we can't fetch any reviews at the moment. Please check back later when you're connection
                         is back online.`;
      container.appendChild(offline);
      const message = document.createElement('p');
      message.classList.add('message');
      message.innerHTML = `You can stil leave a review, we'll add it for you once you're back online!!`;
      container.appendChild(message);
    });
  return restaurant;
}

/**
 * Creates review <li> element and returns it. The second argument should be true if creating a new review
 * on the fly. It will add class ".new-review" and remove it a second later. This alongside a css color 
 * transition, it should be enough to let user know the review is new.
 *
 * @param {{name: string, createdAt: number, rating: number, comments: string,}} review object with at least the above review information.
 * @param {boolean} newReview Whether or not review is being posted by user and should be notified of it. Defaults to false.
 */
const createReviewHTML = (review, newReview = false) => {
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
  let starRating = "";
  for (let n = Number(review.rating); n > 0; n--) {
    starRating += "&#9733;"; // this is the charcode for a star ★
  }
  rating.innerHTML = starRating;
  li.appendChild(rating);

  const comments = document.createElement('p');
  comments.innerHTML = review.comments;
  li.appendChild(comments);

  // if review is new, user should be able to notice the change.
  if (newReview) {
    li.classList.add('new-review');
    setTimeout(function() {
      li.classList.remove('new-review');
    }, 1000);
  }

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

/**
 *
 * @param {string} id Optional id for the form. It defaults to "review".
 *
 */
const createReviewForm = (id = "review", restaurantId) => {
  const form = document.createElement('form');
  form.id = id;
  form.dataset.restaurantId = restaurantId;

  let p = document.createElement('p');
  const name = document.createElement('input');
  name.id = "name"
  name.setAttribute('type', 'text');
  name.setAttribute('aria-label', 'Name');
  name.setAttribute('placeholder', 'Enter Your Name');
  p.appendChild(name);
  form.appendChild(p);

  const radiogroup = document.createElement('radiogroup');
  radiogroup.id = "rating";
  radiogroup.setAttribute('aria-label', 'Review out of 5 Stars');
  radiogroup.setAttribute('aria-role', 'radiogroup');
  radiogroup.classList.add('rating');
  for (let n = 1; n < 6; n++) {
    let label = document.createElement('label');
    label.innerHTML = `<span>${n} star</span>&#9733;`; // this is the charcode for a star ★
    label.id = `${n}star`;
    label.setAttribute('for', n);
    label.onmouseover = function() { litStars(n, true); };
    label.onmouseout = function() { litSelectedStars(); };
    label.onmousedown = function(e) {e.preventDefault(); }; // prevent blinking of styles when mouse is pressed down, but not let go yet.
    radiogroup.appendChild(label);

    let radio = document.createElement('input');
    radio.setAttribute('type', 'radio');
    radio.setAttribute('aria-labelledby', 'rating');
    radio.id = n;
    radio.value = n;
    radio.name = "rating";
    radio.classList.add('hidden');
    radio.onfocus = function() { litStars(n, true); };
    radio.onblur = function() { litSelectedStars(); };
    radio.onclick = function() { selectStar(n) };
    radiogroup.appendChild(radio);
  }
  form.appendChild(radiogroup);

  p = document.createElement('p');
  const textarea = document.createElement('textarea');
  textarea.id = "comments";
  textarea.setAttribute('aria-label', 'comments');
  textarea.setAttribute('placeholder', 'Enter any comments here');
  textarea.setAttribute('rows', '10');
  p.appendChild(textarea);
  form.appendChild(p);

  p = document.createElement('p');
  const addButton = document.createElement('button');
  addButton.setAttribute('type', 'submit');
  addButton.setAttribute('aria-label', 'Add Review');
  addButton.classList.add('add-review');
  addButton.innerHTML = "<span>+</span>";
  p.appendChild(addButton);
  form.appendChild(p);

  form.onsubmit = function(e) {
    e.preventDefault();
    const review = validateAndGetData();
    if (!review) return;

    console.log(review);
    SyncHelper.addReview(review);
    //TODO: Add new review to list
    const reviewList = document.getElementById('reviews-list');
    const newReview = createReviewHTML(review, true);
    reviewList.appendChild(newReview);
  };

  return form;
};

function selectStar(n) {
  let total = 5;
  while (total > 0) {
    let id = total+"star";
    let star = document.getElementById(id);
    if (total == n) {
      star.classList.add('selected-star');
    } else {
      star.classList.remove('selected-star');
    }
    total--;
  }
}

function litStars(n, focus = false) {
  let total = 5;
  while (total > 0) {
    let id = total+"star";
    let star = document.getElementById(id);
    if (total <= n) {
      star.classList.add('on');
    } else {
      star.classList.remove('on');
    }
    if (total <= n && focus) {
      star.classList.add('focus');
    } else {
      star.classList.remove('focus');
    }

    total--;
  }
}

function litSelectedStars() {
  const selectedStar = document.getElementsByClassName('selected-star')[0];
  if (!selectedStar) {
    litStars(0);
    return;
  }
  const id = Number(selectedStar.id[0]);
  litStars(id);
}

function validateAndGetData() {
  const data = {};

  // get name
  let name = document.getElementById('name');
  if (name.value === '') {
    name.focus();
    return;
  }
  data.name = sanitize(name.value);

  // get rating
  let rating = document.querySelector('input[name="rating"]:checked');
  if (!rating) {
    rating = document.querySelector('input[name="rating"]'); // first radio
    rating.focus();
    return;
  }
  let ratingLabel = document.getElementById(`${rating.value}star`);
  data.rating = Number(rating.value);

  // get comments
  let comments = document.getElementById('comments');
  if (comments.value === "") {
    comments.focus();
    return;
  }
  data.comments = sanitize(comments.value);

  // get restaurant_id
  let restaurantId = document.getElementById('review').dataset.restaurantId;
  data.restaurant_id = Number(restaurantId);

  // set createdAT
  data.createdAt = new Date().toISOString();

  name.value = "";
  rating.checked = false;
  comments.value = "";
  // reset selected label stars in UI
  ratingLabel.classList.remove('selected-star');
  litSelectedStars();

  return data;
}

/**
 * It replaces "<" with "&lt;" and ">" with "&gt;" charcodes so html tags can't be injected.
 *
 * @param {String} str String to sanitize html elements from.
 */
function sanitize(str) {
  str = str.replace(/</g, "&lt;");
  str = str.replace(/>/g, "&gt;");
  return str;
}
