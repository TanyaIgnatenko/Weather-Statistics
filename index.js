import { App } from './app.js';

const canvas = document.getElementById('chart');
const startDateInput = document.getElementsByClassName('start-date')[0];
const endDateInput = document.getElementsByClassName('end-date')[0];

const app = new App(canvas, startDateInput, endDateInput);
app.run();