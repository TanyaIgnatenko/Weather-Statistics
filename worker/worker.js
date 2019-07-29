importScripts('../database/indexedDbManager.js');

const dbManager = new IndexedDbManager();

onmessage = async function(message) {
  const { dataKey, dateRange, purpose } = message.data;

  const yearRange = {
    min: `${dateRange.start}`,
    max: `${dateRange.end}`,
  };

  try {

    const data = await dbManager.retrieveData(dataKey, yearRange);
    postMessage({ data: data, purpose });

  } catch (error) {
    setTimeout(() => {
      throw error;
    });
  }
};
