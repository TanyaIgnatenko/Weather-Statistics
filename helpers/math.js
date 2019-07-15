function sum(values) {
  return values.reduce((sum, value) => sum + value);
}

function average(values) {
  return sum(values) / values.length;
}
