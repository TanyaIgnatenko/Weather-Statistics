function sum(values) {
  return values.reduce((sum, value) => sum + value);
}

function average(values) {
  return sum(values) / values.length;
}

function absoluteValueToNormalized(value, min, max) {
  return (value - min) / (max - min);
}

export {
 sum,
 average,
 absoluteValueToNormalized,
}