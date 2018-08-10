var dbPromise = idb.open('restaviews-db', 1, function(upgradeDb) {
  switch(upgradeDb.oldVersion) {
    case 0:
      const restaurantStore = upgradeDb.createObjectStore('restaurants', {keyPath: 'id'});
  }
});
