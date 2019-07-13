import { absoluteValueToNormalized, average } from './helpers/math.js';
import { Point } from './point.js';

class Chart {
  toChartPoint(point) {
    return new Point(
      Math.round(absoluteValueToNormalized(point.x, this.rangeX.min, this.rangeX.max) * this.chartWidth),
      Math.round(absoluteValueToNormalized(point.y, this.rangeY.min, this.rangeY.max) * this.chartHeight)
    );
  }

  drawChart(canvas, points, color = 'black') {
    this.chartWidth = canvas.width;
    this.chartHeight = canvas.height;

    this.rangeX = {
      min: points[0].x,
      max: points[points.length - 1].x
    };
    this.rangeY = {
      min: points.reduce((min, point) => point.y < min ? point.y : min, Infinity),
      max: points.reduce((max, point) => point.y > max ? point.y : max, -Infinity)
    };

    const chartValues = points.reduce((chartValues, point) => {
      const chartPoint = this.toChartPoint(point);

      chartValues[chartPoint.x] = chartValues[chartPoint.x]
        ? chartValues[chartPoint.x].concat(chartPoint.y)
        : [chartPoint.y];

      return chartValues;
    }, {});

    const averageChartValues = Object.keys(chartValues).reduce((averageValues, valueX) => {
      averageValues[valueX] = average(chartValues[valueX]);
      return averageValues;
    }, {});

    const ctx = canvas.getContext('2d');
    ctx.strokeStyle = color;

    ctx.beginPath();
    for (const chartX in averageChartValues) {
      ctx.lineTo(Number(chartX), averageChartValues[chartX]);
    }
    ctx.stroke();
  }
}

export { Chart };