import { Chart } from './chart.js';
import { range } from './helpers/range.js';
import { autocomplete } from './autocomplete/autocomplete.js';
import { binaryFindIndex } from './helpers/binaryFindIndex.js';

const MIN_DATE = 1881;
const MAX_DATE = 2006;

class App {
  state = {
    period: {
      start: 1881,
      end: 2006,
    },
    data: [],
  };

  constructor(canvas, startDateInput, endDateInput) {
    this.canvas = canvas;
    this.startDateInput = startDateInput;
    this.endDateInput = endDateInput;
  }

  initPeriodInputs() {
    this.startDateInput.value = this.state.period.start;
    this.endDateInput.value = this.state.period.end;

    this.startDateInput.min = MIN_DATE;
    this.startDateInput.max = MAX_DATE;
    this.endDateInput.min = MIN_DATE;
    this.endDateInput.max = MAX_DATE;

    this.startDateInput.addEventListener('change', this.handlePeriodChange);
    this.endDateInput.addEventListener('change', this.handlePeriodChange);

    const possibleDates = range(1881, 2006).map(String);
    autocomplete(this.startDateInput, possibleDates);
    autocomplete(this.endDateInput, possibleDates);
  }

  handlePeriodChange = event => {
    const { name, value } = event.target;
    this.state.period[name] = event.target.value;
    this.renderChart();
  };

  toChartFormat(data) {
    return data.map(data => {
      const unixTime = Date.parse(data.t);
      const value = data.v;
      return {
        x: unixTime,
        y: value
      };
    });
  }

  async fetchData() {
    this.state.data = await fetch('./data/temperature.json')
      .then(data => data.json());
  }

  renderChart() {
    const { data } = this.state;

    const startIdx = binaryFindIndex(data, data => {
      const year = data.t.slice(0, 4);
      return year >= this.state.period.start;
    });
    const endIdx = binaryFindIndex(data, data => {
      const year = data.t.slice(0, 4);
      return year > this.state.period.end;
    }) || data.length;
    const selectedData = data.slice(startIdx, endIdx);

    const chartData = this.toChartFormat(selectedData);

    this.chart.clear();
    this.chart.draw(chartData);
  }

  async run() {
    this.initPeriodInputs();

    await this.fetchData();

    this.chart = new Chart(this.canvas);

    this.renderChart();
  }
}

export { App };