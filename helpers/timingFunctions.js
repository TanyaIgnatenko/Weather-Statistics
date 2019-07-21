function ease(t) {
  var sq = t * t;
  //return sq * (-sq * t + 5 * sq - 9 * t + 6);
  return sq * (-4 * sq * t + 14 * sq - 18 * t + 9);
}

// Same as ease(t), but w/o slow start
function easeOut(t) {
  var sq = t * t;
  return sq * (-1.75 * sq * t + 5 * sq - 4.5 * t) + 2.25 * t;
}

function linear(t) {
  return t;
}

function overshoot(t) {
  var sq = t * t;
  return (-0.45 * sq * sq - 0.3 * sq * t + 0.1 * sq + 1.65) * t;
  //return (0.5 * sq * sq + sq * t - 7 * sq + 6 * t + 0.5) * t;
}

export { ease, linear };