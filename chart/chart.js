import { invert, fromOneSystemToAnother } from '../helpers/systemConversion.js';
import { binaryFindIndex } from '../helpers/binaryFindIndex.js';
import { roundRect } from '../helpers/canvas.js';
import { clamp } from '../helpers/clamp.js';
import { range } from '../helpers/range.js';

const CHART_TOP_PADDING = 10;
const CHART_BOTTOM_PADDING = 10;

const TOOLTIP_TOP = 0;
const TOOLTIP_HEIGHT = 60;
const TOOLTIP_WIDTH = 120;
const TOOLTIP_RADIUS = 10;
const TOOLTIP_ZONE_HEIGHT = 0;
const TOOLTIP_CHART_LEFT_PADDING = 10;
const TOOLTIP_CHART_RIGHT_PADDING = 10;

const Y_LINES_COUNT = 5;
const Y_LINE_LABEL_ZONE_WIDTH = 70;
const Y_LINES_BOTTOM_PADDING = 50;

const defaultChartStyle = {
  lineWidth: 2,
  lineCap: 'round',
  lineJoin: 'round',
  strokeStyle: '#58C657',
  fillStyle: 'rgba(88, 198, 87, 0.03)'
};

const defaultYLineStyle = {
  lineWidth: 2,
  strokeStyle: 'rgba(240, 240, 240)',
};

const defaultYLineLabelStyle = {
  fillStyle: 'dimgray',
  font: '16px Roboto',
  textAlign: 'center',
  textBaseline: 'middle',
};

const defaultTooltipBoxStyle = {
  fillStyle: '#FAFCFE',
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
  strokeStyle: '#58C657',
};

class Chart {
  constructor(
    canvas,
    showYLines = false,
    formatYLineLabel = value => value,
    showTooltip = false,
    formatTooltipText = value => value,
    styles = {
      chart: defaultChartStyle,
      yLine: defaultYLineStyle,
      yLineLabel: defaultYLineLabelStyle,
      tooltipBox: defaultTooltipBoxStyle,
      tooltipText: defaultTooltipTextStyle,
      tooltipLine: defaultTooltipLineStyle,
      highlightingPoint: defaultHighlightingPointStyle,
    },
  ) {
    this.state = {
      canvasPoints: [],
    };

    this.styles = styles;
    this.canvas = canvas;
    this.context = canvas.getContext('2d');
    this.showYLines = showYLines;
    this.formatYLineLabel = formatYLineLabel;
    this.formatTooltipText = formatTooltipText;

    this.measureElementsSize();
    if (showYLines) this.prepareToShowYLines();
    if (showTooltip) this.prepareToShowTooltip();
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
    this.chartRight = this.canvasWidth;
    this.chartTop = CHART_TOP_PADDING;
    this.chartBottom = canvasRect.height - CHART_BOTTOM_PADDING;
    this.chartHeight = this.chartBottom - this.chartTop;
  }

  prepareToShowYLines() {
    this.chartLeft += Y_LINE_LABEL_ZONE_WIDTH;
    this.chartRight -= Y_LINE_LABEL_ZONE_WIDTH - 5;
    this.chartBottom -= Y_LINES_BOTTOM_PADDING;
    this.chartHeight -= TOOLTIP_ZONE_HEIGHT;
    this.chartHeight = this.chartBottom - this.chartTop;
  }

  prepareToShowTooltip() {
    this.chartTop += TOOLTIP_ZONE_HEIGHT;
    this.chartHeight -= TOOLTIP_ZONE_HEIGHT;

    // to avoid highlighting points clipping on hover
    this.chartLeft += TOOLTIP_CHART_LEFT_PADDING;
    this.chartRight -= TOOLTIP_CHART_RIGHT_PADDING;

    this.tooltipCenterXLimit = {
      left: this.chartLeft + TOOLTIP_WIDTH / 2,
      right: this.chartRight - TOOLTIP_WIDTH / 2,
    };

    this.canvas.addEventListener('mousemove', this.showTooltip.bind(this));
    this.canvas.addEventListener(
      'mouseleave',
      this.removeTooltip.bind(this),
    );
  }

  showTooltip(event) {
    const { clientX, clientY } = event;

    const canvasPoint = this.clientPointToCanvasPoint({
      x: clientX,
      y: clientY,
    });
    const closestChartPoint = this.findClosestChartPoint(canvasPoint);

    this.drawTooltipFor(closestChartPoint);
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

  drawTooltipFor(point) {
    this.redrawChartOnly();

    this.drawTooltipLine(point.x);
    this.highlightPoint(point);

    const value = this.canvasYToValue(point.y);
    const tooltipText = this.formatTooltipText(value);
    this.drawTooltipBox(point.x, tooltipText);
  }

  removeTooltip() {
    this.redrawChartOnly();
  }

  redrawChartOnly() {
    this.clear();
    if (this.showYLines) this.drawYLines();
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
    this.rangeX = {
      min: data[0].x,
      max: data[data.length - 1].x,
    };
    this.rangeY = {
      min: data.reduce((min, point) => Math.min(min, point.y), Infinity),
      max: data.reduce((max, point) => Math.max(max, point.y), -Infinity),
    };

    if (this.showYLines) this.drawYLines();
    this.state.canvasPoints = this.dataToCanvasPoints(data);
    this.drawCanvasPoints();
  }

  drawYLines() {
    const yLines = range(0, Y_LINES_COUNT - 1);
    const yLinesDist = this.chartHeight / (Y_LINES_COUNT - 1);

    yLines.forEach(yLine => {
      this.context.save();
      this.applyStyles(this.styles.yLine);

      const yLineStart = {
        x: this.chartLeft,
        y: this.chartTop + yLine * yLinesDist,
      };
      const yLineEnd = {
        x: this.chartRight,
        y: this.chartTop + yLine * yLinesDist,
      };
      this.context.beginPath();
      this.context.moveTo(yLineStart.x, yLineStart.y);
      this.context.lineTo(yLineEnd.x, yLineEnd.y);
      this.context.stroke();
      this.context.restore();

      this.context.save();
      this.applyStyles(this.styles.yLineLabel);

      const value = this.canvasYToValue(yLineStart.y);
      const label = this.formatYLineLabel(value);
      this.context.fillText(
        label,
        yLineStart.x - Y_LINE_LABEL_ZONE_WIDTH / 2,
        yLineStart.y,
      );
      this.context.restore();
    });
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
    this.context.lineTo(this.chartRight, this.chartBottom);
    this.context.lineTo(this.chartLeft, this.chartBottom);
    this.context.closePath();
    this.context.fill();

    this.context.restore();
  }

  dataToCanvasPoints(data) {
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

  canvasYToValue(y) {
    const invertedY = invert(y, this.chartTop, this.chartBottom);
    return fromOneSystemToAnother({
      value: invertedY,
      oldMin: this.chartTop,
      oldMax: this.chartBottom,
      newMin: this.rangeY.min,
      newMax: this.rangeY.max,
    }).toFixed(1);
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
