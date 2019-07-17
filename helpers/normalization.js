function absoluteValueToNormalized(absoluteValue, min, max) {
  return (absoluteValue - min) / (max - min);
}

function normalizedValueToAbsolute(normalizedValue, min, max) {
  return normalizedValue * (max - min) + min;
}

function absoluteRangeToNormalized(absoluteRange, min, max) {
  return {
    start: absoluteValueToNormalized(absoluteRange.start, min, max),
    end: absoluteValueToNormalized(absoluteRange.end, min, max),
  }
}

function normalizedRangeToAbsolute(absoluteRange, min, max) {
  return {
    start: normalizedValueToAbsolute(absoluteRange.start, min, max),
    end: normalizedValueToAbsolute(absoluteRange.end, min, max),
  }
}

export {
  absoluteValueToNormalized,
  normalizedValueToAbsolute,
  absoluteRangeToNormalized,
  normalizedRangeToAbsolute,
}