importScripts('../database/indexedDbManager.js', '../helpers/math.js');

const dbManager = new IndexedDbManager();

onmessage = async function (message) {
  const { dataKey, dateRange, groupsCount, purpose } = message.data;

  const  monthRange = {
    min: `${dateRange.start}-01`,
    max: `${dateRange.end}-01`,
  };

  const data = await dbManager.retrieveData(dataKey, monthRange);

  const averageData = getGroupsAverage(data, groupsCount);

  postMessage({data: averageData, purpose});
};

function getGroupsAverage(data, groupsCount) {
  groupsCount = groupsCount <= data.length
    ? groupsCount
    : data.length;

  const groups = divideIntoGroups(data, groupsCount);

  return calculateGroupAverage(groups);
}

function calculateGroupAverage(groups) {
  return groups.map(group => {
    const unixTime = Date.parse(group[0].t);
    return ({
      x: unixTime,
      y: average(group.map(data => data.v)),
    })
  });
}

function divideIntoGroups(data, groupsCount) {
  const groups = [];
  const maxCountInGroup = Math.floor(data.length / groupsCount);

  function isLastGroup(idx) {
    return idx === (groupsCount - 1);
  }

  for (let i = 0; i < groupsCount; ++i) {
    const startIdx = i * maxCountInGroup;
    if (isLastGroup(i)) {
      groups[i] = data.slice(startIdx);
    } else {
      groups[i] = data.slice(startIdx, startIdx + maxCountInGroup);
    }
  }

  return groups;
}
