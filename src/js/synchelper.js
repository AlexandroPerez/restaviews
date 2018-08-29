/**
 * Sync helper functions
 */
class SyncHelper {
  // TODO: move DBHelper.markFavorite here


  // TODO: Return a Promise that resolves if PUT requests were successful, or rejects if 
  // any of them fails. Use this helper in a Background Sync and when page loads to sync any 
  // data change wile offline.
  static putRequests() {
    return dbPromise.then(db => {
      const tx = db.transaction('putRequests');
      const putRequestStore = tx.objectStore('putRequests');

      return putRequestStore.getAll().then(urls => {
        const PUT = {method: 'PUT'};

        return Promise.all(urls.map(url => {
          return fetch(url, PUT).then(res => {
            if (!res.ok) return Promise.reject(`PUT Fetch to ${res.url} failed with code ${res.status}`);
            return `PUT Fetch to ${res.url} was oh-ok! 👍`;
          }).then(console.log); // log only if successful. TODO: remove when done debugging.
        }));
      })
      .then(() => {
        //do clean up and resolve
        return SyncHelper.clearIDB('putRequests')
      }); // the catch is implemented in the service worker Sync listener.
    });
  }

  /**
   * Returns a Promise that fulfils if iDB store is successfully cleared.
   * 
   * @param {string} storeName Name of the iDB store to clear
  */ 
  static clearIDB(storeName) {
    //
    return dbPromise.then(db => {
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);

      store.clear();
      return tx.complete;
    });
  }

  // TODO: Listen to sync events made when a restaurant favorite button is toggled.
  static putRequests2() {
    // open iDB, and process all put requests, clearing iDB when done.
    console.log('hello from putSync');
    return new Promise(function(resolve,reject) {
      const handleError = error => {
        console.error(error);
        throw Error(error);
      }

      

    //});
    
    return dbPromise.then(db => {
      const tx = db.transaction('putRequests');
      const putRequestStore = tx.objectStore('putRequests');

      return putRequestStore.getAll().then(urls => {
        urls.push('http://localhost:1337/barequest');

        const PUT = {method: 'PUT'};
        //let counter = urls.length; // Keep track of all requests, and clean up only if all were successful
        
        return Promise.all(urls.map(url => {
          return fetch(url, PUT).then(res => {
            if (!res.ok) throw Error(`PUT Fetch to ${res.url} failed with code ${res.status}`);
            console.log(`PUT fetch to ${res.url} was oh-ok! 👍`);
          });
        })).then(() => {
          console.log("I should definetly not be hea");
        });
        
      })
      .then(() => {
        //do clean up and resolve
        console.log('I sould not be hea');
        return resolve();
      }).catch(reject);

      // get all put requests stored while offline
      /*return putRequestStore.openCursor()
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
        }).catch(console.error);/** */
    }); }); // <- move these, indent above code when done
  }
};


















/*
dbPromise.then(db => {
  const tx = db.transaction('putRequests');
  const putRequestStore = tx.objectStore('putRequests');

  return putRequestStore.getAll().then(urls => {
    urls.push('http://localhost:1337/barequest'); // inject a request that will fail.

    const PUT = {method: 'PUT'};
    
    return Promise.all(urls.map(url => {
      fetch(url, PUT).then(res => {
        if (!res.ok) return Promise.reject(`PUT Fetch to ${res.url} failed with code ${res.status}`);
        console.log(`PUT fetch to ${res.url} was oh-ok! 👍`);
      });
    })).then(() => {
      console.log("I should definitely not be printed"); // why is this printed?
    });
    
  })
  .then(() => {
    //do clean up and resolve
    console.log('I sould not be printed'); // and even this?
    return resolve();
  });
});

/** */