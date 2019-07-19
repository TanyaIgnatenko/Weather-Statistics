import { invert, fromOneSystemToAnother } from '../helpers/systemConversion.js';
import { binaryFindIndex } from '../helpers/binaryFindIndex.js';
import { roundRect } from '../helpers/canvas.js';
import { clamp } from '../helpers/clamp.js';

const CHART_OFFSET_X = 10;
const CHART_OFFSET_Y = 10;

const TOOLTIP_ZONE_HEIGHT = 100;
const TOOLTIP_HEIGHT = 60;
const TOOLTIP_WIDTH = 120;
const TOOLTIP_RADIUS = 10;
const TOOLTIP_TOP = CHART_OFFSET_Y + 15;

const defaultChartStyle = {
  lineWidth: 1,
  lineCap: 'round',
  lineJoin: 'round',
  strokeStyle: 'dimgray',
};

const defaultTooltipBoxStyle = {
  fillStyle: 'white',
  lineWidth: 0.25,
  shadowOffsetX: 1,
  shadowOffsetY: 2,
  shadowBlur: 6,
  strokeStyle: 'rgba(0,0,0,0.3)',
  shadowColor: 'rgba(0,0,0,0.08)',
};

const defaultTooltipTextStyle = {
  fillStyle: 'black',
  font: '16px Roboto',
  textAlign: 'center',
  textBaseline: 'middle',
};

const defaultTooltipLineStyle = {
  lineWidth: 1,
  strokeStyle: 'rgba(0,0,0,0.12)',
};

const defaultHighlightingPointStyle = {
  lineWidth: 3,
  fillStyle: 'white',
  strokeStyle: '#717171',
};

class Chart {
  constructor(
    canvas,
    showPlaceholder,
    formatTooltipText = value => value,
    styles = {
      chart: defaultChartStyle,
      tooltipBox: defaultTooltipBoxStyle,
      tooltipText: defaultTooltipTextStyle,
      tooltipLine: defaultTooltipLineStyle,
      highlightingPoint: defaultHighlightingPointStyle,
    },
  ) {
    this.state = {
      canvasPoints: [],
    };

    this.canvas = canvas;
    this.context = canvas.getContext('2d');
    this.formatTooltipText = formatTooltipText;
    this.styles = styles;

    this.measureElementsSize();

    if (showPlaceholder) {
      this.prepareToShowTooltip();
    }
  }

  get width() {
    return this.canvasWidth;
  }

  get height() {
    return this.canvasHeight;
  }

  measureElementsSize() {
    const canvasRect = this.canvas.getBoundingClientRect();

    // to avoid canvas styles and attributes desynchronization
    this.canvas.width = canvasRect.width;
    this.canvas.height = canvasRect.height;

    this.canvasLeft = canvasRect.left;
    this.canvasTop = canvasRect.top;
    this.canvasWidth = canvasRect.width;
    this.canvasHeight = canvasRect.height;

    this.chartLeft = 0;
    this.chartRight = canvasRect.width;
    this.chartTop = CHART_OFFSET_Y;
    this.chartBottom = canvasRect.height - CHART_OFFSET_Y;
  }

  prepareToShowTooltip() {
    this.chartTop += TOOLTIP_ZONE_HEIGHT;

    // to avoid highlighting points clipping on hover
    this.chartLeft += CHART_OFFSET_X;
    this.chartRight -= CHART_OFFSET_X;

    this.tooltipCenterXLimit = {
      left: this.chartLeft + TOOLTIP_WIDTH / 2,
      right: this.chartRight - TOOLTIP_WIDTH / 2,
    };

    this.canvas.addEventListener('mousemove', this.showPlaceholder.bind(this));
    this.canvas.addEventListener(
      'mouseleave',
      this.removePlaceholder.bind(this),
    );
  }

  showPlaceholder(event) {
    const { clientX, clientY } = event;

    const canvasPoint = this.clientPointToCanvasPoint({
      x: clientX,
      y: clientY,
    });
    const closestChartPoint = this.findClosestChartPoint(canvasPoint);

    this.drawPlaceholderFor(closestChartPoint);
  }

  findClosestChartPoint(canvasPoint) {
    const { canvasPoints } = this.state;

    const rightClosestPointIdx = binaryFindIndex(
      canvasPoints,
      point => point.x > canvasPoint.x,
    );

    // point after chart
    if (rightClosestPointIdx === null) {
      return canvasPoints[canvasPoints.length - 1];
    }

    const rightClosestPoint = canvasPoints[rightClosestPointIdx];
    const leftClosestPoint = canvasPoints[rightClosestPointIdx - 1];

    // point before chart
    if (!leftClosestPoint) return rightClosestPointIdx;

    const distToLeftPoint = leftClosestPoint.x - canvasPoint.x;
    const distToRightPoint = rightClosestPoint.x - canvasPoint.x;

    return distToLeftPoint < distToRightPoint
      ? leftClosestPoint
      : rightClosestPoint;
  }

  drawPlaceholderFor(point) {
    this.redrawChartOnly();
    this.drawTooltipLine(point.x);

    const invertedY = invert(point.y, this.chartTop, this.chartBottom);
    const valueInUserSystem = fromOneSystemToAnother({
      value: invertedY,
      oldMin: this.chartTop,
      oldMax: this.chartBottom,
      newMin: this.rangeY.min,
      newMax: this.rangeY.max,
    }).toFixed(1);
    const tooltipText = this.formatTooltipText(valueInUserSystem);
    this.drawTooltipBox(point.x, tooltipText);

    this.highlightPoint(point);
  }

  removePlaceholder() {
    this.redrawChartOnly();
  }

  redrawChartOnly() {
    this.clear();
    this.drawCanvasPoints();
  }

  highlightPoint(point) {
    this.context.save();
    this.applyStyles(this.styles.highlightingPoint);

    this.context.beginPath();
    this.context.arc(point.x, point.y, 6, 0, 2 * Math.PI);
    this.context.fill();
    this.context.stroke();

    this.context.restore();
  }

  drawTooltipLine(x) {
    this.context.save();
    this.applyStyles(this.styles.tooltipLine);

    this.context.beginPath();
    this.context.moveTo(x, TOOLTIP_TOP + TOOLTIP_RADIUS);
    this.context.lineTo(x, this.chartBottom);
    this.context.stroke();

    this.context.restore();
  }

  drawTooltipBox(desiredCenterX, text) {
    const centerX = clamp(
      desiredCenterX,
      this.tooltipCenterXLimit.left,
      this.tooltipCenterXLimit.right,
    );

    const tooltipLeft = centerX - TOOLTIP_WIDTH / 2;
    const tooltipTop = TOOLTIP_TOP;

    this.context.save();
    this.applyStyles(this.styles.tooltipBox);

    roundRect(this.context, tooltipLeft, tooltipTop, TOOLTIP_WIDTH, TOOLTIP_HEIGHT, TOOLTIP_RADIUS);
    this.context.fill();
    this.context.stroke();

    this.context.restore();

    this.context.save();
    this.applyStyles(this.styles.tooltipText);
    this.context.fillText(
      text,
      tooltipLeft + TOOLTIP_WIDTH / 2,
      tooltipTop + TOOLTIP_HEIGHT / 2 + 3,
    );
    this.context.restore();
  }

  clear() {
    this.context.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
  }

  drawChartFor(data) {
    this.state.canvasPoints = this.dataToCanvasPoints(data);
    this.drawCanvasPoints();
  }

  drawCanvasPoints() {
    const { canvasPoints } = this.state;

    this.context.save();
    this.applyStyles(this.styles.chart);

    this.context.beginPath();
    canvasPoints.forEach(point => {
      this.context.lineTo(point.x, point.y);
    });
    this.context.stroke();

    this.context.restore();
  }

  dataToCanvasPoints(data) {
    this.rangeX = {
      min: data[0].x,
      max: data[data.length - 1].x,
    };
    this.rangeY = {
      min: data.reduce((min, point) => Math.min(min, point.y), Infinity),
      max: data.reduce((max, point) => Math.max(max, point.y), -Infinity),
    };

    return data.map(this.dataToCanvasPoint.bind(this));
  }

  dataToCanvasPoint(data) {
    const canvasPoint = {
      x: Math.round(
        fromOneSystemToAnother({
          value: data.x,
          oldMin: this.rangeX.min,
          oldMax: this.rangeX.max,
          newMin: this.chartLeft,
          newMax: this.chartRight,
        }),
      ),
      y: Math.round(
        fromOneSystemToAnother({
          value: data.y,
          oldMin: this.rangeY.min,
          oldMax: this.rangeY.max,
          newMin: this.chartTop,
          newMax: this.chartBottom,
        }),
      ),
    };
    canvasPoint.y = invert(canvasPoint.y, this.chartTop, this.chartBottom);

    return canvasPoint;
  }

  clientPointToCanvasPoint(point) {
    return {
      x: point.x - this.canvasLeft,
      y: point.y - this.canvasTop,
    };
  }

  applyStyles(styles) {
    for (const styleProp in styles) {
      this.context[styleProp] = styles[styleProp];
    }
  }
}

export { Chart };
