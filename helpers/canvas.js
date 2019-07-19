const defaultRadius = {
  topLeft: 5,
  topRight: 5,
  bottomRight: 5,
  bottomLeft: 5,
};

function roundRect(ctx, x, y, width, height, radius = defaultRadius) {
  if (typeof radius === 'number') {
    radius = {
      topLeft: radius,
      topRight: radius,
      bottomRight: radius,
      bottomLeft: radius,
    };
  } else {
    for (const corner in defaultRadius) {
      radius[corner] = radius[corner] || defaultRadius[corner];
    }
  }

  ctx.beginPath();
  ctx.moveTo(x + radius.topLeft, y);

  ctx.lineTo(x + width - radius.topRight, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius.topRight);

  ctx.lineTo(x + width, y + height - radius.bottomRight);
  ctx.quadraticCurveTo(
    x + width,
    y + height,
    x + width - radius.bottomRight,
    y + height,
  );

  ctx.lineTo(x + radius.bottomLeft, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius.bottomLeft);

  ctx.lineTo(x, y + radius.topLeft);
  ctx.quadraticCurveTo(x, y, x + radius.topLeft, y);

  ctx.closePath();
}

export { roundRect };
