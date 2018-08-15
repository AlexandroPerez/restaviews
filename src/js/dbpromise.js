var dbPromise = idb.open('restaviews-db', 2, function(upgradeDb) {
  switch(upgradeDb.oldVersion) {
    case 0:
      const restaurantStore = upgradeDb.createObjectStore('restaurants', {keyPath: 'id'});
    case 1:
      const reviewStore = upgradeDb.createObjectStore('reviews', {keyPath: 'id'});
      reviewStore.createIndex('restaurant_id', 'restaurant_id');
  }
});
