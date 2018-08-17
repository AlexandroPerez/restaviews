var dbPromise = idb.open('restaviews-db', 3, function(upgradeDb) {
  switch(upgradeDb.oldVersion) {
    case 0:
      const restaurantStore = upgradeDb.createObjectStore('restaurants', {keyPath: 'id'});
    case 1:
      const reviewStore = upgradeDb.createObjectStore('reviews', {keyPath: 'id'});
      reviewStore.createIndex('restaurant_id', 'restaurant_id');
    case 2:
      const putRequestStore = upgradeDb.createObjectStore('putRequests', {autoIncrement: true});
  }
});
