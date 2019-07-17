import { Chart } from './chart/chart.js';
import { RangeSlider } from './range-slider/RangeSlider.js';
import { range } from './helpers/range.js';

const MIN_DATE = 1881;
const MAX_DATE = 2006;

const CHART_TYPE = {
  TEMPERATURE: 'temperature',
  PRECIPITATION: 'precipitation',
};

const PURPOSE = {
  SLIDER: 'SLIDER',
  CHART: 'CHART',
};

class App {
  state = {
    chartType: CHART_TYPE.TEMPERATURE,
    selectedPeriod: {
      start: MIN_DATE,
      end: MAX_DATE,
    },
  };

  constructor(canvas, periodInputs, slider) {
    this.canvas = canvas;
    this.startDateSelect = periodInputs.start;
    this.endDateSelect = periodInputs.end;

    const { selectedPeriod } = this.state;
    this.slider = new RangeSlider({
      domElements: slider,
      min: MIN_DATE,
      max: MAX_DATE,
      selectedRange: { ...selectedPeriod },
      valuePerStep: 1,
      onChange: this.handleRangeSliderChange,
    });

    this.chart = new Chart(this.canvas);
    this.sliderWireframeChart = new Chart(slider.wireframe);

    this.worker = new Worker('worker/worker.js');
    this.worker.onmessage = message => {
      const { data, purpose } = message.data;

      switch (purpose) {
        case PURPOSE.CHART: {
          this.drawChart(data);
          break;
        }
        case PURPOSE.SLIDER: {
          this.fillSliderWireframe(data);
          break;
        }
        default: {
          console.error('Uknown purpose: ', purpose);
        }
      }
    };
  }

  initPeriodInputs() {
    const { selectedPeriod } = this.state;
    const possibleStartDates = range(MIN_DATE, MAX_DATE - 4);
    const possibleEndDates = range(MIN_DATE + 4, MAX_DATE);

    possibleStartDates.forEach(year => {
      const option = document.createElement('option');
      option.value = year;
      option.textContent = year;
      option.selected = year === selectedPeriod.start;
      this.startDateSelect.appendChild(option);
    });

    possibleEndDates.forEach(year => {
      const option = document.createElement('option');
      option.value = year;
      option.textContent = year;
      option.selected = year === selectedPeriod.end;
      this.endDateSelect.appendChild(option);
    });

    this.startDateSelect.addEventListener('change', e =>
      this.handlePeriodChange('start', e.target.value),
    );
    this.endDateSelect.addEventListener('change', e =>
      this.handlePeriodChange('end', e.target.value),
    );

    const { chartType } = this.state;
    this.worker.postMessage({
      dataKey: chartType,
      dateRange: selectedPeriod,
      groupsCount: 165,
      purpose: PURPOSE.SLIDER,
    });
  }

  handlePeriodChange = (name, value) => {
    const { selectedPeriod } = this.state;
    selectedPeriod[name] = value;
    this.slider.setSelectedRange(selectedPeriod.start, selectedPeriod.end);
    this.updateUI();
  };

  handleRangeSliderChange = newRange => {
    this.state.selectedPeriod = newRange;
    this.startDateSelect.value = this.state.selectedPeriod.start;
    this.endDateSelect.value = this.state.selectedPeriod.end;
    this.updateUI();
  };

  updateUI() {
    const { chartType, selectedPeriod } = this.state;
    this.worker.postMessage({
      dataKey: chartType,
      dateRange: selectedPeriod,
      groupsCount: 12,
      purpose: PURPOSE.CHART,
    });
  }

  drawChart = data => {
    this.chart.clear();
    this.chart.draw(data);
  };

  fillSliderWireframe = data => {
    this.sliderWireframeChart.clear();
    this.sliderWireframeChart.draw(data);
  };

  async run() {
    this.initPeriodInputs();
    this.updateUI();
  }
}

export { App };
