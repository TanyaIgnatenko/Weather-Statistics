import { App } from './app.js';

const chartCanvas = document.getElementsByClassName('chart')[0];
const dataTypeInputs = {
  temperature: document.getElementsByClassName('temperature-input')[0],
  precipitation: document.getElementsByClassName('precipitation-input')[0],
};
const periodSelects = {
  start: document.getElementsByClassName('start-date')[0],
  end: document.getElementsByClassName('end-date')[0],
};
const slider = {
  container: document.getElementsByClassName('slider-container')[0],
  leftHandle: document.getElementsByClassName('slider-handle')[0],
  rightHandle: document.getElementsByClassName('slider-handle')[1],
  selectedRange: document.getElementsByClassName('selected-range')[0],
  canvas: document.getElementsByClassName('slider-canvas')[0],
  leftMask: document.getElementsByClassName('mask')[0],
  rightMask: document.getElementsByClassName('mask')[1],
};
const errorContainer = document.getElementsByClassName('error-container')[0];

const app = new App(
  chartCanvas,
  dataTypeInputs,
  periodSelects,
  slider,
  errorContainer,
);
app.run();
