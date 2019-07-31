import { RangeSlider } from './range-slider/RangeSlider.js';
import { Chart } from './chart/chart.js';
import { range } from './helpers/range.js';
import { throttle } from './helpers/throttle.js';
import { createElement, removeAllChilds } from './helpers/dom.js';

const MIN_DATE = 1881;
const MAX_DATE = 2006;

const DATA_TYPE = {
  TEMPERATURE: 'temperature',
  PRECIPITATION: 'precipitation',
};

const PURPOSE = {
  SLIDER: 'slider',
  CHART: 'chart',
  LOG: 'log',
};

const unitsByType = {
  temperature: '℃',
  precipitation: 'мм',
};

class App {
  constructor(
    chartCanvas,
    dataTypeInputs,
    periodSelects,
    slider,
    errorContainer,
  ) {
    this.state = {
      selectedDataType: DATA_TYPE.TEMPERATURE,
      selectedPeriod: {
        start: MIN_DATE,
        end: MAX_DATE,
      },
    };

    this.chartCanvas = chartCanvas;
    this.sliderContainer = slider.container;
    this.selectedRange = slider.selectedRange;
    this.errorContainer = errorContainer;

    this.initPeriodSelects(periodSelects);
    this.initDataTypeInputs(dataTypeInputs);
    this.initRangeSlider(slider);
    this.initChart(chartCanvas);
    this.initWorker();

    this.updateChart = throttle(this.updateChart, 150);
    this.updateSliderChartPreview = throttle(
      this.updateSliderChartPreview,
      150,
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
          console.error('Unknown purpose: ', purpose);
        }
      }

      this.hideError();
    };

    let firstTime = true;
    this.worker.onerror = error => {
      error.preventDefault();
      this.showError();
      if(firstTime) {
        alert('Убедитесь, что вы находитесь не в приватном режиме, или воспользуйтесь более современным браузером');
        firstTime = false;
      }
    };
  }

  showError() {
    this.chartCanvas.classList.add('hidden');
    this.sliderContainer.classList.add('hidden');
    this.errorContainer.classList.remove('hidden');
  }

  hideError() {
    this.chartCanvas.classList.remove('hidden');
    this.sliderContainer.classList.remove('hidden');
    this.errorContainer.classList.add('hidden');
  }

  initChart(chartCanvas) {
    this.chart = new Chart(
      chartCanvas,
      true,
      value => value + this.getSelectedDataTypeUnits(),
      true,
      value => value + this.getSelectedDataTypeUnits(),
    );
  }

  getSelectedDataTypeUnits() {
    const { selectedDataType } = this.state;
    return unitsByType[selectedDataType];
  }

  initRangeSlider(slider) {
    const { selectedPeriod } = this.state;

    this.slider = new RangeSlider({
      domElements: slider,
      min: MIN_DATE,
      max: MAX_DATE,
      selectedRange: selectedPeriod,
      valuePerStep: 1,
      onChange: this.handleRangeSliderChange.bind(this),
    });

    this.sliderPreviewChart = new Chart(slider.canvas);
  }

  initDataTypeInputs(dataTypeInputs) {
    this.temperatureInput = dataTypeInputs.temperature;
    this.precipitationInput = dataTypeInputs.precipitation;

    const { selectedDataType } = this.state;

    this.temperatureInput.checked = selectedDataType === DATA_TYPE.TEMPERATURE;
    this.precipitationInput.checked =
      selectedDataType === DATA_TYPE.PRECIPITATION;

    this.updateDataTypeInputStyles();

    dataTypeInputs.temperature.addEventListener('click', () => {
      this.switchDataType(DATA_TYPE.TEMPERATURE);
    });
    dataTypeInputs.precipitation.addEventListener('click', () => {
      this.switchDataType(DATA_TYPE.PRECIPITATION);
    });
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

    const minDate = selectName === 'end' ? selectedPeriod.start : MIN_DATE;
    const maxDate = selectName === 'start' ? selectedPeriod.end : MAX_DATE;

    const possibleDates = range(minDate, maxDate);
    possibleDates.forEach(year => {
      createElement(select, 'option', 'date-option', {
        value: year,
        textContent: year,
        selected: year === selectedPeriod[selectName],
      });
    });
  }

  getPeriodSelectByName(name) {
    return name === 'start' ? this.startDateSelect : this.endDateSelect;
  }

  switchDataType(dataType) {
    this.state.selectedDataType = dataType;

    this.updateDataTypeInputStyles();
    this.updateChart();
    this.updateSliderChartPreview();
  }

  updateDataTypeInputStyles() {
    const { selectedDataType } = this.state;

    const checkedInput =
      selectedDataType === DATA_TYPE.TEMPERATURE
        ? this.temperatureInput
        : this.precipitationInput;

    const uncheckedInput =
      selectedDataType === DATA_TYPE.TEMPERATURE
        ? this.precipitationInput
        : this.temperatureInput;

    checkedInput.parentNode.classList.add('checked');
    uncheckedInput.parentNode.classList.remove('checked');
  }

  handlePeriodSelectChange(name, value) {
    const { selectedPeriod } = this.state;
    selectedPeriod[name] = parseInt(value, 10);

    const otherPeriodSelectName = name === 'start' ? 'end' : 'start';
    this.updatePeriodSelectOptions(otherPeriodSelectName);

    this.slider.setSelectedRange(selectedPeriod.start, selectedPeriod.end);

    this.updateChart();
  }

  handleRangeSliderChange(newRange) {
    const startBecameMore = newRange.start >= this.state.selectedPeriod.start;
    const endBecameMore = newRange.end >= this.state.selectedPeriod.end;

    const startRange = range(
      this.state.selectedPeriod.start,
      newRange.start,
      1,
    );
    const startChangeRange = startBecameMore
      ? startRange
      : startRange.reverse();

    const endRange = range(this.state.selectedPeriod.end, newRange.end, 1);
    const endChangeRange = endBecameMore ? endRange : endRange.reverse();

    startChangeRange.forEach(newStart => {
      this.state.selectedPeriod.start = newStart;
      this.startDateSelect.value = newStart;
      this.updatePeriodSelectOptions('start');
      this.updateChart();
    });

    endChangeRange.forEach(newEnd => {
      this.state.selectedPeriod.end = newEnd;
      this.endDateSelect.value = newEnd;
      this.updatePeriodSelectOptions('end');
      this.updateChart();
    });
  }

  updateChart() {
    const { selectedDataType, selectedPeriod } = this.state;
    this.worker.postMessage({
      dataKey: selectedDataType,
      dateRange: selectedPeriod,
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
      purpose: PURPOSE.SLIDER,
    });
  }

  drawChart(data) {
    this.chart.clear();
    this.chart.drawChartFor(data);
  }

  drawSliderPreviewChart(data) {
    this.sliderPreviewChart.clear();
    this.sliderPreviewChart.drawChartFor(data);
  }

  run() {
    this.updateChart();
    this.updateSliderChartPreview();
  }
}

export { App };
