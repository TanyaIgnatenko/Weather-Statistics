import { Chart } from './chart.js';
import { Point } from './point.js';
import { range } from './helpers/range.js';
import { autocomplete } from './autocomplete/autocomplete.js';

'use strict';

const startDateInput = document.getElementsByClassName('start-date')[0];
const endDateInput = document.getElementsByClassName('end-date')[0];

const possibleDates = range(1881, 2006).map(String);
autocomplete(startDateInput, possibleDates);
autocomplete(endDateInput, possibleDates);

(async function () {
  const temperatureData = await fetch('./data/temperature.json')
    .then(data => data.json());

  const chartData = temperatureData.map(data => {
    const date = new Date(data.t).getTime();
    const temperature = data.v;
    return new Point(date, temperature);
  });

  const canvas = document.getElementById('chart');

  const chart = new Chart();
  chart.drawChart(canvas, chartData);
})();