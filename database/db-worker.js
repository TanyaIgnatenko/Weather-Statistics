importScripts('./indexedDbManager.js');

onmessage = async function (message) {
  const { dataKey, dateRange } = message.data;

  const  monthRange = {
    min: `${dateRange.start}-01`,
    max: `${dateRange.end}-01`,
  };
  const dbManager = new IndexedDbManager();
  const data = await dbManager.retrieveData(dataKey, monthRange);

  postMessage(data);
};


