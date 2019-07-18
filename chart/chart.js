import { invert, fromOneSystemToAnother } from '../helpers/systemConversion.js';
import { binaryFindIndex } from '../helpers/binaryFindIndexES6.js';
import { clamp } from '../helpers/clamp.js';

const CHART_OFFSET_X = 10;
const CHART_OFFSET_Y = 10;

const TOOLTIP_ZONE_HEIGHT = 100;
const TOOLTIP_HEIGHT = 60;
const TOOLTIP_WIDTH = 120;
const TOOLTIP_TOP = CHART_OFFSET_Y + 15;
const TOOLTIP_TEXT_OFFSET_LEFT = 38;
const TOOLTIP_TEXT_OFFSET_TOP = 5;

const defaultChartStyle = {
  strokeStyle: 'dimgray',
  lineJoin: 'round',
  lineCap: 'round',
  lineWidth: 1,
};

const defaultTooltipBoxStyle = {
  fillStyle: 'white',
  strokeStyle: 'gray',
};

const defaultTooltipTextStyle = {
  fillStyle: 'black',
  font: '16px Roboto',
};

const defaultTooltipLineStyle = {
  strokeStyle: '#E7EAEB',
  lineWidth: 1,
};

const defaultHighlightingPointStyle = {
  fillStyle: 'white',
  strokeStyle: '#B48DF7',
  lineWidth: 4,
};

class Chart {
  state = {
    canvasPoints: [],
  };

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
    this.canvasLeft = canvasRect.left;
    this.canvasTop = canvasRect.top;
    this.canvasWidth = canvasRect.width;
    this.canvasHeight = canvasRect.height;

    this.chartLeft = CHART_OFFSET_X;
    this.chartRight = canvasRect.width - CHART_OFFSET_X;
    this.chartTop = CHART_OFFSET_Y;
    this.chartBottom = canvasRect.height - CHART_OFFSET_Y;
  }

  prepareToShowTooltip() {
    this.chartTop += TOOLTIP_ZONE_HEIGHT;

    this.tooltipCenterXLimit = {
      left: this.chartLeft + TOOLTIP_WIDTH / 2,
      right: this.chartRight - TOOLTIP_WIDTH / 2,
    };

    this.canvas.addEventListener('mousemove', this.showPlaceholder);
    this.canvas.addEventListener('mouseleave', this.removePlaceholder);
  }

  showPlaceholder = event => {
    const { clientX, clientY } = event;

    const canvasPoint = this.clientPointToCanvasPoint({
      x: clientX,
      y: clientY,
    });
    const closestChartPoint = this.findClosestChartPoint(canvasPoint);

    this.drawPlaceholderFor(closestChartPoint);
  };

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

  removePlaceholder = () => {
    this.redrawChartOnly();
  };

  redrawChartOnly() {
    this.clear();
    this.drawCanvasPoints();
  }

  highlightPoint(point) {
    this.applyStyles(this.styles.highlightingPoint);

    this.context.beginPath();
    this.context.arc(point.x, point.y, 7, 0, 2 * Math.PI);
    this.context.fill();
    this.context.stroke();
  }

  drawTooltipLine(x) {
    this.applyStyles(this.styles.tooltipLine);

    this.context.beginPath();
    this.context.moveTo(x, TOOLTIP_TOP);
    this.context.lineTo(x, this.chartBottom);
    this.context.stroke();
  }

  drawTooltipBox(desiredCenterX, text) {
    const centerX = clamp(
      desiredCenterX,
      this.tooltipCenterXLimit.left,
      this.tooltipCenterXLimit.right,
    );

    const tooltipLeft = centerX - TOOLTIP_WIDTH / 2;
    const tooltipTop = TOOLTIP_TOP;

    this.applyStyles(this.styles.tooltipBox);
    this.context.rect(tooltipLeft, tooltipTop, TOOLTIP_WIDTH, TOOLTIP_HEIGHT);
    this.context.stroke();
    this.context.fill();

    this.applyStyles(this.styles.tooltipText);
    this.context.fillText(
      text,
      tooltipLeft + TOOLTIP_TEXT_OFFSET_LEFT,
      tooltipTop + TOOLTIP_HEIGHT / 2 + 8,
    );
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

    this.applyStyles(this.styles.chart);

    this.context.beginPath();
    canvasPoints.forEach(point => {
      this.context.lineTo(point.x, point.y);
    });
    this.context.stroke();
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

    return data.map(this.dataToCanvasPoint);
  }

  dataToCanvasPoint = data => {
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
  };

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
