import { Chart } from './chart.js';
import { range } from './helpers/range.js';
import { autocomplete } from './autocomplete/autocomplete.js';

const MIN_DATE = 1881;
const MAX_DATE = 2006;

class App {
  state = {
    period: {
      start: MIN_DATE,
      end: MAX_DATE,
    },
    data: [],
  };

  constructor(canvas, startDateInput, endDateInput) {
    this.canvas = canvas;
    this.startDateInput = startDateInput;
    this.endDateInput = endDateInput;

    this.worker = new Worker('worker.js');
    this.worker.onmessage = this.drawChart;
  }

  initPeriodInputs() {
    const { period } = this.state;
    this.startDateInput.value = period.start;
    this.endDateInput.value = period.end;

    this.startDateInput.min = MIN_DATE;
    this.startDateInput.max = MAX_DATE;
    this.endDateInput.min = MIN_DATE;
    this.endDateInput.max = MAX_DATE;

    const possibleDates = range(1881, 2006).map(String);
    autocomplete(this.startDateInput, possibleDates);
    autocomplete(this.endDateInput, possibleDates);

    this.startDateInput.addEventListener('change', this.handlePeriodChange);
    this.endDateInput.addEventListener('change', this.handlePeriodChange);
  }

  handlePeriodChange = event => {
    const { name, value } = event.target;
    const { period } = this.state;

    period[name] = event.target.value;

    this.updateUI();
  };

  async fetchData() {
    this.state.data = await fetch('./data/temperature.json')
      .then(data => data.json());
  }

  updateUI() {
    const { data, period } = this.state;
    this.worker.postMessage({ data, period, groupsCount: 12 });
  }

  drawChart = (event) => {
    this.chart.clear();
    this.chart.draw(event.data);
  };

  async run() {
    await this.fetchData();

    this.initPeriodInputs();
    this.chart = new Chart(this.canvas);

    this.updateUI();
  }
}

export { App };