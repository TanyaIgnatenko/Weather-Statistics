import { distance } from '../helpers/distance.js';

function absoluteValueToNormalized(value, min, max) {
  return (value - min) / (max - min);
}

function normalizedValueToAbsolute(normalizedValue, min, max) {
  return normalizedValue * (max - min) + min;
}

const CHART_MARGIN_TOP = 100;
const TOOLTIP_HEIGHT = 60;
const TOOLTIP_WIDTH = 120;
const TOOLTIP_TOP = 30;
const CHART_OFFSET_X = 10;

class Chart {
  state = {
    canvasPoints: [],
  };

  constructor(canvas) {
    this.context = canvas.getContext('2d');

    const canvasRect = canvas.getBoundingClientRect();
    this.canvas = canvas;
    this.canvasLeft = canvasRect.left;
    this.canvasTop = canvasRect.top;
    this.canvasWidth = canvas.width;
    this.canvasHeight = canvas.height - CHART_MARGIN_TOP;

    this.chartWidth = this.canvasWidth - 2 * CHART_OFFSET_X;
    this.chartHeight = this.canvasHeight;

    this.tooltipCenterXLimit = {
      left: TOOLTIP_WIDTH / 2 + CHART_OFFSET_X,
      right: this.canvasWidth - TOOLTIP_WIDTH / 2 - CHART_OFFSET_X,
    };

    this.canvas.onmousemove = this.showPlaceholder;
  }

  showPlaceholder = (event) => {
    const { clientX, clientY } = event;

    const canvasPoint = this.fromClientPointToCanvasPoint({ x: clientX, y: clientY });
    const closestChartPoint = this.findClosestChartPoint(canvasPoint);
    this.drawPlaceholderFor(closestChartPoint);
  };

  fromClientPointToCanvasPoint(point) {
    return {
      x: point.x - this.canvasLeft,
      y: point.y - this.canvasTop,
    };
  }

  findClosestChartPoint(canvasPoint) {
    const { canvasPoints } = this.state;

    const { chartPoint } = canvasPoints.reduce((minDistInfo, chartPoint) => {
      const dist = distance(chartPoint, canvasPoint);
      const isLess = dist < minDistInfo.dist;
      return isLess
        ? {
          dist,
          chartPoint,
        }
        : minDistInfo;
    }, { dist: Infinity, chartPoint: null });

    return chartPoint;
  }

  drawPlaceholderFor(point) {
    this.redrawChartOnly();
    this.drawTooltipFor(point);
    this.highlightPoint(point);
  }

  redrawChartOnly() {
    this.clear();
    this.drawCanvasPoints();
  }

  highlightPoint(point) {
    this.context.beginPath();
    this.context.arc(point.x, point.y, 7, 0, 2 * Math.PI);
    this.context.fillStyle = 'white';
    this.context.fill();
    this.context.lineWidth = 4;
    this.context.strokeStyle = '#B48DF7';
    this.context.stroke();
  }

  drawTooltipFor(point) {
    this.drawTooltipLine(point.x);

    const normalizedValue = 1 - point.y / this.canvasHeight;
    const absoluteValue = normalizedValueToAbsolute(normalizedValue, this.rangeY.min, this.rangeY.max);
    const tooltipText = `Значение ${absoluteValue.toFixed(1)}`;
    this.drawTooltip(point.x, tooltipText);
  }

  drawTooltipLine(x) {
    this.context.strokeStyle = '#E7EAEB';
    this.context.lineWidth = 1;
    this.context.beginPath();
    this.context.moveTo(x, 0);
    this.context.lineTo(x, this.canvasHeight + CHART_MARGIN_TOP);
    this.context.stroke();
  }

  drawTooltip(centerX, text) {
    centerX = centerX < this.tooltipCenterXLimit.left
      ? this.tooltipCenterXLimit.left
      : centerX;

    centerX = centerX > this.tooltipCenterXLimit.right
      ? this.tooltipCenterXLimit.right
      : centerX;

    const tooltipLeft = centerX - TOOLTIP_WIDTH / 2;
    const tooltipTop = TOOLTIP_TOP;

    this.context.rect(tooltipLeft, tooltipTop, TOOLTIP_WIDTH, TOOLTIP_HEIGHT);
    this.context.strokeStyle = 'gray';
    this.context.stroke();
    this.context.fillStyle = 'white';
    this.context.fill();

    this.context.fillStyle = 'black';
    this.context.fillText(text, tooltipLeft + 10, tooltipTop + TOOLTIP_HEIGHT / 2 + 5);
  }

  clear() {
    this.context.clearRect(0, 0, this.canvasWidth, this.canvasHeight + CHART_MARGIN_TOP);
  }

  draw(points, color = 'black') {
    this.state.canvasPoints = this.toCanvasPoints(points);
    this.drawCanvasPoints(color);
  }

  toCanvasPoints(points) {
    this.rangeX = {
      min: points[0].x,
      max: points[points.length - 1].x
    };
    this.rangeY = {
      min: points.reduce((min, point) => Math.min(min, point.y), Infinity),
      max: points.reduce((max, point) => Math.max(max, point.y), -Infinity)
    };

    return points.map(this.fromAbsoluteValuesToCanvasPoint);
  }

  fromAbsoluteValuesToCanvasPoint = (point) => {
    return {
      x: CHART_OFFSET_X + Math.round(absoluteValueToNormalized(point.x, this.rangeX.min, this.rangeX.max) * this.chartWidth),
      y: CHART_MARGIN_TOP
        + Math.round((1 - absoluteValueToNormalized(point.y, this.rangeY.min, this.rangeY.max)) * this.chartHeight),
    };
  };

  drawCanvasPoints(color = 'dimgray') {
    const { canvasPoints } = this.state;

    this.context.strokeStyle = color;
    this.context.lineWidth = 1;
    this.context.lineCap = 'round';
    this.context.lineJoin = 'round';

    this.context.beginPath();
    canvasPoints.forEach(point => {
      this.context.lineTo(point.x, point.y);
    });
    this.context.stroke();
  }
}

export { Chart };