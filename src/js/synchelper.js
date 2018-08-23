/**
 * Sync helper functions
 */
class SyncHelper {
  // TODO: move DBHelper.markFavorite here

  // TODO: Listen to sync events made when a restaurant favorite button is toggled.
  static putRequests() {
    // open iDB, and process all put requests, clearing iDB when done.
    console.log('hello from putSync');
    return dbPromise.then(db => {
      const tx = db.transaction('putRequests', 'readwrite');
      const putRequestStore = tx.objectStore('putRequests');

      // get all put requests stored while offline
      return putRequestStore.openCursor()
        .then(function putRequest(cursor) {
          if (!cursor) return tx.complete ; // exit if done

          const url = cursor.value;
          const PUT = {method: 'PUT'};
          console.log("making PUT fetch to ", url);
          // and make a PUT fetch request for each one.
          fetch(url, PUT);

          //TODO: find a way to delete only if request.ok. Couldn't use cursor.delete()
          // whithin a .then(), it gave an error like: couldn't delete cursor, transaction
          // ended already...
          cursor.delete(); 

          return cursor.continue().then(putRequest);
        }).catch(console.error); // If I don't catch any errors, if function is run in sw.js,
    });                          // it will break the service worker's sync listener. It will stop working.
  }
};