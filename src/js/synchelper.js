/**
 * Sync helper functions
 */
class SyncHelper {

  /**
   * Return a Promise that resolves if all favorite restaurant PUT requests were successful,
   * or rejects if any of them fails. Use this helper in a Background Sync to sync any
   * data changed while offline.
   * @returns {Promise}
  */
  static syncFavorites() {
    return dbPromise.then(db => {
      const tx = db.transaction('syncFavorites');
      const syncFavoriteStore = tx.objectStore('syncFavorites');

      return syncFavoriteStore.getAll().then(syncs => {
        const PUT = {method: 'PUT'};

        return Promise.all(syncs.map(sync => {
          return fetch(sync.url, PUT).then(res => {
            if (!res.ok) return Promise.reject(`PUT Fetch to ${res.url} failed with code ${res.status}`);
            // sync response from server to local iDB and remove each successful fetch from the syncFavorites store.
            // Any successful request should be made only once, instead of retrying it if another fails.
            return res.json().then(SyncHelper.updateIDBRestaurant).then(() => {
              return SyncHelper.removeSyncFavorite(sync.restaurant_id);
            });
          })
        }));
      }) // the catch is implemented in the service worker Sync listener.
    });
  }

  /**
   * TODO: Returns a Promise that resolves if local iDB restaurant data is updated
   * @param {Object} restaurant A restaurant object with updated info fetched from server after performing a Sync
   */
  static updateIDBRestaurant(restaurant) {
    return dbPromise.then(db => {
      const tx = db.transaction('restaurants', 'readwrite');
      const restaurantStore = tx.objectStore('restaurants');

      restaurantStore.put(restaurant);
      return tx.complete;
    });
  }

  /**
   * TODO: Returns a Promise that resolves if syncFavorite was successfully removed from iDB.
   * @param {number} id Restaurant id of a successfuly synced Restaurant.
  */
  static removeSyncFavorite(id) {
    id = Number(id); // Make sure id is a numbder. iDB doesn't accept strings as numbers.
    return dbPromise.then(db => {
      const tx = db.transaction('syncFavorites', 'readwrite');
      const syncFavoriteStore = tx.objectStore('syncFavorites');

      syncFavoriteStore.delete(id);
      return tx.complete;
    });
  }

  /**
   * Returns a Promise that fulfils if iDB store is successfully cleared.
   *
   * @param {string} storeName Name of the iDB store to clear
   * @returns {Promise}
  */
  static clearStore(storeName) {
    //
    return dbPromise.then(db => {
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);

      store.clear();
      return tx.complete;
    });
  }

  // TODO: Listen to sync events made when a restaurant favorite button is toggled.
  /**
   *
   * @param {{name: String, rating: number, comments: String}} review Review objcet with above information.
   */
  static addReview(review) {
    const url = `${DBHelper.API_URL}/reviews/`;
    const POST = {
      method: "POST",
      body: JSON.stringify(review)
    };

    // if either SyncManager OR Service Worker aren't supported, just make a PUT fetch as usual
    if (!window.SyncManager || !navigator.serviceWorker) {
      return fetch(url, POST);
    }

    // Do not make a fetch request, but instead save review to iDB, reguister
    // a background sync, and have the service worker fetch review from iDB and POST
    // data to server when a sync is triggered. 😎
    return dbPromise.then(db => {
      const tx = db.transaction('offlineReviews', 'readwrite');
      const offlineReviewStore = tx.objectStore('offlineReviews');

      offlineReviewStore.add(review);
      return tx.complete;
    }).then(() => {
      // register background sync if transaction was successful
      console.log('review saved to iDB successfully!');

      return navigator.serviceWorker.ready.then(function (reg) {
        return reg.sync.register('syncReviews');
      });
    }).catch(err => {
      // if review couldn't be added to offlineReview store or sync couldn't be registered
      // attempt a regular POST fetch
      console.error(err, "Attempting to POST data...");
      return fetch(url, POST);
    });
  };

  /**
   * Return a Promise that resolves if all offline reviews are successfully POSTED,
   * or rejects if any of them fails. Use this helper in a Background Sync to sync any
   * reviews posted while offline.
   * @returns {Promise}
  */
  static syncReviews() {
    console.log('hea');
    return dbPromise.then(db => {
      // get all offline reviews
      const tx = db.transaction('offlineReviews');
      const offlineReviewStore = tx.objectStore('offlineReviews');
      return offlineReviewStore.getAll();
    }).then(offlineReviews => {
      return Promise.all(offlineReviews.map(offlineReview => {
        const offlineReviewId = offlineReview.id;
        delete offlineReview.id; // Make sure offlineReview.id isn't passed to API
        return SyncHelper.postReview(offlineReview).then(fetchedReview => {
          // Save review to iDB for offline use, catch any errors. A failed promise
          // to saveReview shouldn't make a background sync try to POST data again
          SyncHelper.saveReview(fetchedReview).catch(console.error);
          // Delete offline review, catch any errors. A failed Promise here creates
          // a bug, since a background sync will still try to POST data.
          SyncHelper.removeOfflineReview(offlineReviewId).catch(console.error);
        });
      }));
    });
  };

  /**
   * Returns a Promise that resolves to a json response from a successful fetch POST.
   * @param {Object} data Object with review data to POST to API.
   * @returns {JSON}
   */
  static postReview(data) {
    const url = `${DBHelper.API_URL}/reviews/`; // has to fail
    const POST = {
      method: "POST",
      body: JSON.stringify(data)
    };
    return fetch(url, POST).then(response => {
      // if offline review was POSTED successfully, save review to iDB
      // with response data
      if (!response.ok) {
        return Promise.reject(`Failed to POST offline review id: ${data.id}`);
      }
      return response.json();
    });
  }

  /**
   * Returns a Promise that resolves if review was successfully saved to iDB.
   * @param {Object} review Review Object to save to iDB for offline use
   */
  static saveReview(review) {
    return dbPromise.then(db => {
      const tx = db.transaction('reviews', 'readwrite');
      const reviewStore = tx.objectStore('reviews');

      reviewStore.put(review);
      return tx.complete;
    });
  }

  /**
   * Returns a Promise that resolves if offline review was successfully removed from iDB.
   * @param {number} id id of the offline review to remove.
  */
  static removeOfflineReview(id) {
    id = Number(id); // Make sure id is a number for iDB
    return dbPromise.then(db => {
      const tx = db.transaction('offlineReviews', 'readwrite');
      const offlineReviewStore = tx.objectStore('offlineReviews');

      offlineReviewStore.delete(id);
      return tx.complete;
    });
  }

  static registerServiceWorker () {

    if (!navigator.serviceWorker) return;

    navigator.serviceWorker.register('/sw.js').then(function(reg) {
      console.log("Service Worker has been registered successfully!");
    }).catch((e) => {
      console.log("Coudn't register service worker... \n", e);
    });
  }
};
