importScripts('../helpers/math.js', '../helpers/binaryFindIndex.js');

const fetchedData = {};

onmessage = async function(message) {
  const { dataKey, dateRange, groupsCount, purpose } = message.data;

  if(!fetchedData[dataKey]) {
    fetchedData[dataKey] = await fetch(`../data/${dataKey}.json`)
      .then(data => data.json())
      .catch(error => {
        throw new Error(`Failed to retrieve ${dataKey}.json. Error: ${error}`);
      });
  }

  const data = filterData(fetchedData[dataKey], dateRange.start, dateRange.end);

  const averageData = getGroupsAverage(data, groupsCount);

  postMessage({ data: averageData, purpose });
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
    });
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

function filterData(data, startDate, endDate) {
  const startIdx = binaryFindIndex(data, data => {
    const [ year ] = data.t.split('-');
    return year >= startDate;
  });
  const endIdx = binaryFindIndex(data, data => {
    const [ year ] = data.t.split('-');
    return year > endDate;
  }) || data.length;

  return data.slice(startIdx, endIdx);
}