function range(start, end, step = 1) {
  const size = (end - start) / step;
  return Array.from({length: size}, (val, i) => i * step + start);
}

export { range };