import { App } from './app.js';

const canvas = document.getElementById('chart');
const periodSelects = {
  start: document.getElementsByClassName('start-date')[0],
  end: document.getElementsByClassName('end-date')[0],
};
const slider = {
  container:  document.getElementsByClassName('slider-container')[0],
  leftHandle:  document.getElementsByClassName('slider-handle')[0],
  rightHandle:  document.getElementsByClassName('slider-handle')[1],
  selectedRange: document.getElementsByClassName('selected-range')[0],
  wireframe: document.getElementsByClassName('slider-wireframe')[0],
  leftMask: document.getElementsByClassName('mask')[0],
  rightMask: document.getElementsByClassName('mask')[1],
};

const app = new App(canvas, periodSelects, slider);
app.run();