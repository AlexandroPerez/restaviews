var dbPromise = idb.open('restaviews-db', 4, function(upgradeDb) {
  switch(upgradeDb.oldVersion) {
    case 0:
      const restaurantStore = upgradeDb.createObjectStore('restaurants', {keyPath: 'id'});
    case 1:
      const reviewStore = upgradeDb.createObjectStore('reviews', {keyPath: 'id'});
      reviewStore.createIndex('restaurant_id', 'restaurant_id');
    case 2:
      // const putRequestStore = upgradeDb.createObjectStore('syncFavorites', {autoIncrement: true});
      // Using the restaurant id as key will allow me to easily update local iDB data,
      // remove successful put requests, and even handle last chance Background Syncs.
      // Another plus, is that if the user toggles the favorite button
      // more than once while offline, only the latest action will be synced, saving requests.

      // Store an object instead of a URL: {restaurant_id: id, url: "url"}
      const syncFavoriteStore = upgradeDb.createObjectStore('syncFavorites', {keyPath: 'restaurant_id'});
    case 3:
      const offlineReviewStore = upgradeDb.createObjectStore('offlineReviews', {keyPath: 'id', autoIncrement: true});
      offlineReviewStore.createIndex('restaurant_id', 'restaurant_id');
  }
});
