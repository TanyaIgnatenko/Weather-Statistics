import { absoluteValueToNormalized, average } from './helpers/math.js';

class Chart {
  constructor(canvas) {
    this.context = canvas.getContext('2d');
    this.chartWidth = canvas.width;
    this.chartHeight = canvas.height;
  }

  toChartPoint = point => {
    return {
      x: Math.round(absoluteValueToNormalized(point.x, this.rangeX.min, this.rangeX.max) * this.chartWidth),
      y: Math.round((1 - absoluteValueToNormalized(point.y, this.rangeY.min, this.rangeY.max)) * this.chartHeight),
    };
  };

  clear() {
    this.context.clearRect(0, 0, this.chartWidth, this.chartHeight);
  }

  draw(points, color = 'black') {
    this.rangeX = {
      min: points[0].x,
      max: points[points.length - 1].x
    };
    this.rangeY = {
      min: points.reduce((min, point) => Math.min(min, point.y), Infinity),
      max: points.reduce((max, point) => Math.max(max, point.y), -Infinity)
    };

    const chartPoints = points.map(this.toChartPoint);

    this.context.strokeStyle = color;

    this.context.beginPath();
    chartPoints.forEach(point => {
      this.context.lineTo(point.x, point.y);
    });
    this.context.stroke();
  }
}

export { Chart };