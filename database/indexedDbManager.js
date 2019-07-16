const VERSION_FACTOR = {
  temperature: 2,
  percipitation: 3,
};

class IndexedDbManager {
  openDb() {
    const openRequest = indexedDB.open('weather-statistics');

    openRequest.onupgradeneeded = ({ oldVersion, target: { result } }) => {
      const db = result;

      if (oldVersion < 1) {
        IndexedDbManager.createDbScheme(db);
      }

      db.onversionchange = function (event) {
        db.close();
        alert("A new version of this page is ready. Please reload!");
      };
    };

    return toPromise(openRequest);
  }

  static createDbScheme(db) {
    db.createObjectStore('temperature');
    db.createObjectStore('precipitation');
  }

  async retrieveData(dataKey, monthRange) {
    const db = await this.openDb();

    await IndexedDbManager.ensureDataPresent(db, dataKey);

    const store = db.transaction(dataKey).objectStore(dataKey);

    const query = IDBKeyRange.bound(monthRange.min, monthRange.max);
    const cursorRequest = store.openCursor(query);

    const data = [];
    await new Promise((resolve, reject) => {
      cursorRequest.onsuccess = function (event) {
        const cursor = event.target.result;
        if (cursor) {
          data.push(...cursor.value);
          cursor.continue();
        } else {
          resolve();
        }
      };
    });

    return data;
  }

  static async ensureDataPresent(db, dataKey) {
    if (IndexedDbManager.isDataPresent(db.version, dataKey)) return db;

    const data = await fetchData(dataKey);

    const store = db.transaction(dataKey, 'readwrite').objectStore(dataKey);

    IndexedDbManager.fillStoreWith(store, data);

    db.close();
    const versionChangeRequest = indexedDB.open('weather-statistics', Number(db.version * VERSION_FACTOR[dataKey]));

    return toPromise(versionChangeRequest);
  }

  static isDataPresent(version, dataKey) {
    return version % VERSION_FACTOR[dataKey] === 0;
  }

  static fillStoreWith(store, data) {
    let curMonthStart = 0, curMonth = getMonth(data[0]);
    for (let i = 1; i < data.length; ++i) {
      const month = getMonth(data[i]);
      if (month !== curMonth) {
        store.add(data.slice(curMonthStart, i), curMonth);

        curMonth = month;
        curMonthStart = i;
      }
    }
    store.add(data.slice(curMonthStart, data.length), curMonth);
  }
}

function toPromise(request) {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function fetchData(dataKey) {
  return fetch(`../data/${dataKey}.json`)
    .then(data => data.json())
    .catch(error => console.error(`Failed to retrieve ${dataKey}.json. Error: ${error}`));
}

function getMonth(item) {
  const date = new Date(item.t);
  const [year, month] = date.toISOString().split('-');
  return `${year}-${month}`;
}
