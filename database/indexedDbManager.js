importScripts('../helpers/math.js');

class IndexedDbManager {
  constructor() {
    this.fetchPutPromise = {};
  }

  openDb() {
    if (this.db) return this.db;

    const openRequest = indexedDB.open('weather-statistics', 3);

    openRequest.onupgradeneeded = ({ oldVersion }) => {
      this.db = openRequest.result;

      if(oldVersion < 1) {
        IndexedDbManager.createDbScheme(this.db);
      } else if(oldVersion <= 3) {
        this.db.deleteObjectStore('metadata');
        this.db.deleteObjectStore('temperature');
        this.db.deleteObjectStore('precipitation');

        IndexedDbManager.createDbScheme(this.db);
      }
      this.db.onversionchange = event => {
        this.db.close();
      };
    };

    return toPromise(openRequest);
  }

  static createDbScheme(db) {
    db.createObjectStore('metadata');
    db.createObjectStore('temperature');
    db.createObjectStore('precipitation');
  }

  async retrieveData(dataKey, monthRange) {
    const db = await this.openDb();

    await this.ensureDataPresent(db, dataKey);

    const store = db.transaction(dataKey).objectStore(dataKey);

    const query = IDBKeyRange.bound(monthRange.min, monthRange.max);
    const cursorRequest = store.openCursor(query);

    const data = [];
    await new Promise((resolve, reject) => {
      cursorRequest.onsuccess = function(event) {
        const cursor = event.target.result;
        if (cursor) {
          data.push(cursor.value);
          cursor.continue();
        } else {
          resolve();
        }
      };
    });

    return data;
  }

  static async fetchAndPut(db, dataKey) {
    const data = await fetchData(dataKey);
    const dataStore = db.transaction(dataKey, 'readwrite').objectStore(dataKey);
    IndexedDbManager.fillStoreWith(dataStore, data);

    const metadataStore = db
      .transaction('metadata', 'readwrite')
      .objectStore('metadata');
    const addRequest = metadataStore.add(true, dataKey);

    return toPromise(addRequest);
  }

  async ensureDataPresent(db, dataKey) {
    if (await IndexedDbManager.isDataPresent(db, dataKey)) return;

    if (!this.fetchPutPromise[dataKey]) {
      this.fetchPutPromise[dataKey] = IndexedDbManager.fetchAndPut(db, dataKey);
    }

    return this.fetchPutPromise[dataKey];
  }

  static isDataPresent(db, dataKey) {
    const store = db.transaction('metadata').objectStore('metadata');
    const checkRequest = store.get(dataKey);
    return toPromise(checkRequest);
  }

  static fillStoreWith(store, data) {
    let lastYearStart = 0;
    let lastYear = getYear(data[0]);

    for (let i = 1; i < data.length; ++i) {
      const year = getYear(data[i]);

      if (year !== lastYear) {
        const yearDays = data.slice(lastYearStart, i);
        const lastYearAverage = calculateYearAverage(yearDays);
        store.add(lastYearAverage, lastYear);

        lastYear = year;
        lastYearStart = i;
      }
    }
    const yearDays = data.slice(lastYearStart, data.length);
    const lastYearAverage = calculateYearAverage(yearDays);
    store.add(lastYearAverage, lastYear);
  }
}

function toPromise(request) {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => {
      resolve(request.result);
    };
    request.onerror = () => {
      reject(request.error);
    };
  });
}

function fetchData(dataKey) {
  return fetch(`../data/${dataKey}.json`)
    .then(data => data.json())
    .catch(error => {
      throw new Error(`Failed to retrieve ${dataKey}.json. Error: ${error}`);
    });
}

function getYear(item) {
  const date = new Date(item.t);
  const [year] = date.toISOString().split('-');
  return year;
}

function calculateYearAverage(days) {
  const unixTime = Date.parse(days[0].t);
  return {
    x: unixTime,
    y: average(days.map(day => day.v)),
  };
}
