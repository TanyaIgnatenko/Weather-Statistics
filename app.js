import { Chart } from './chart/chart.js';
import { RangeSlider } from './range-slider/RangeSlider.js';
import { range } from './helpers/range.js';
import { throttle } from './helpers/throttle.js';
import { removeAllChilds } from './helpers/dom.js';

const MIN_DATE = 1881;
const MAX_DATE = 2006;

// this Enum doesn't use Symbol because it will be used as key at IndexedDb while Symbol is not serializable
const DATA_TYPE = {
  TEMPERATURE: 'temperature',
  PRECIPITATION: 'precipitation',
};

const PURPOSE = {
  SLIDER: 'slider',
  CHART: 'chart',
};

class App {
  state = {
    selectedDataType: DATA_TYPE.TEMPERATURE,
    selectedPeriod: {
      start: MIN_DATE,
      end: MAX_DATE,
    },
  };

  constructor(chartCanvas, dataTypeInputs, periodSelects, slider) {
    this.initPeriodSelects(periodSelects);
    this.initDataTypeInputs(dataTypeInputs);
    this.initRangeSlider(slider);
    this.initChart(chartCanvas);
    this.initWorker();

    this.updateChart = throttle(this.updateChart, 100);
    this.updateSliderChartPreview = throttle(
      this.updateSliderChartPreview,
      100,
    );
  }

  initWorker() {
    this.worker = new Worker('worker/worker.js');
    this.worker.onmessage = message => {
      const { data, purpose } = message.data;

      switch (purpose) {
        case PURPOSE.CHART: {
          this.drawChart(data);
          break;
        }
        case PURPOSE.SLIDER: {
          this.drawSliderPreviewChart(data);
          break;
        }
        default: {
          console.error('Uknown purpose: ', purpose);
        }
      }
    };
  }

  initChart(chartCanvas) {
    this.chart = new Chart(chartCanvas);
  }

  initRangeSlider(slider) {
    const { selectedPeriod } = this.state;

    this.slider = new RangeSlider({
      domElements: slider,
      min: MIN_DATE,
      max: MAX_DATE,
      selectedRange: selectedPeriod,
      valuePerStep: 1,
      onChange: this.handleRangeSliderChange,
    });

    this.sliderPreviewChart = new Chart(slider.canvas);
  }

  initDataTypeInputs(dataTypeInputs) {
    const { selectedDataType } = this.state;

    dataTypeInputs.temperature.checked =
      selectedDataType === DATA_TYPE.TEMPERATURE;
    dataTypeInputs.precipitation.checked =
      selectedDataType === DATA_TYPE.PRECIPITATION;

    dataTypeInputs.temperature.addEventListener('click', () =>
      this.switchDataType(DATA_TYPE.TEMPERATURE),
    );
    dataTypeInputs.precipitation.addEventListener('click', () =>
      this.switchDataType(DATA_TYPE.PRECIPITATION),
    );
  }

  initPeriodSelects(periodSelects) {
    this.startDateSelect = periodSelects.start;
    this.endDateSelect = periodSelects.end;

    this.initPeriodSelect(this.startDateSelect, 'start');
    this.initPeriodSelect(this.endDateSelect, 'end');
  }

  initPeriodSelect(select, selectName) {
    this.updatePeriodSelectOptions(selectName);

    select.addEventListener('change', e =>
      this.handlePeriodSelectChange(selectName, e.target.value),
    );
  }

  updatePeriodSelectOptions(selectName) {
    const select = this.getPeriodSelectByName(selectName);

    removeAllChilds(select);

    const { selectedPeriod } = this.state;

    const minDate = selectName === 'end'
      ? selectedPeriod.start
      : MIN_DATE;
    const maxDate = selectName === 'start'
      ? selectedPeriod.end
      : MAX_DATE;

    const possibleDates = range(minDate, maxDate);
    possibleDates.forEach(year => {
      const option = document.createElement('option');
      option.value = year;
      option.textContent = year;
      option.selected = year === selectedPeriod[selectName];
      select.appendChild(option);
    });
  }

  getPeriodSelectByName(name) {
    return name === 'start'
      ? this.startDateSelect
      : this.endDateSelect;
  }

  switchDataType = dataType => {
    this.state.selectedDataType = dataType;

    this.updateChart();
    this.updateSliderChartPreview();
  };

  handlePeriodSelectChange = (name, value) => {
    const { selectedPeriod } = this.state;
    selectedPeriod[name] = +value;

    const otherPeriodSelectName = name === 'start' ? 'end' : 'start';
    this.updatePeriodSelectOptions(otherPeriodSelectName);

    this.slider.setSelectedRange(selectedPeriod.start, selectedPeriod.end);

    this.updateChart();
  };

  handleRangeSliderChange = newRange => {
    this.state.selectedPeriod = newRange;

    this.startDateSelect.value = this.state.selectedPeriod.start;
    this.endDateSelect.value = this.state.selectedPeriod.end;

    this.updatePeriodSelectOptions('start');
    this.updatePeriodSelectOptions('end');

    this.updateChart();
  };

  updateChart() {
    const { selectedDataType, selectedPeriod } = this.state;
    this.worker.postMessage({
      dataKey: selectedDataType,
      dateRange: selectedPeriod,
      groupsCount: 12,
      purpose: PURPOSE.CHART,
    });
  }

  updateSliderChartPreview() {
    const { selectedDataType } = this.state;
    this.worker.postMessage({
      dataKey: selectedDataType,
      dateRange: {
        start: MIN_DATE,
        end: MAX_DATE,
      },
      groupsCount: 165,
      purpose: PURPOSE.SLIDER,
    });
  }

  drawChart = data => {
    this.chart.clear();
    this.chart.draw(data);
  };

  drawSliderPreviewChart = data => {
    this.sliderPreviewChart.clear();
    this.sliderPreviewChart.draw(data);
  };

  run() {
    this.updateChart();
    this.updateSliderChartPreview();
  }
}

export { App };