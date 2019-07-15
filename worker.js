onmessage = function (event) {
  let { data, period, groupsCount } = event.data;

  const filteredData = filterData(data, period.start, period.end);
  
  groupsCount = groupsCount <= data.length
    ? groupsCount
    : data.length;

  const groups = divideIntoGroups(filteredData, groupsCount);
  
  const averageData = calculateGroupAverage(groups);
  
  postMessage(averageData);
};

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

// instead of imports

function sum(values) {
  return values.reduce((sum, value) => sum + value);
}

function average(values) {
  return sum(values) / values.length;
}

function binaryFindIndex(array, predicate) {
  let leftIdx = 0,
    rightIdx = array.length - 1;

  while (leftIdx <= rightIdx) {
    const middleIdx = Math.floor((leftIdx + rightIdx) / 2);

    if (predicate(array[middleIdx])) {
      rightIdx = middleIdx - 1;
    } else {
      leftIdx = middleIdx + 1;
    }
  }

  return leftIdx !== array.length ? leftIdx : null;
}
