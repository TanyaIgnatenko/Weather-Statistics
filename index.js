import { Chart } from './chart.js';
import { Point } from './point.js';

'use strict';

const points = [
  new Point(75, 50),
  new Point(100, 75),
  new Point(125, 25),
  new Point(150, 50),
  new Point(200, 75),
  new Point(475, 50),
  new Point(500, 75),
  new Point(525, 25),
  new Point(550, 50),
  new Point(600, 75),
];

const canvas = document.getElementById('chart');

const chart = new Chart();
chart.drawChart(canvas, points);