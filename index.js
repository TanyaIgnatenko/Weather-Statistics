import { Chart } from './chart.js';
import { Point } from './point.js';

'use strict';

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