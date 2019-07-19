import { makeDraggable } from '../helpers/draggable.js';
import { clamp } from '../helpers/clamp.js';

import {
  absoluteRangeToNormalized,
  absoluteValueToNormalized,
  normalizedRangeToAbsolute,
} from '../helpers/systemConversion.js';

class RangeSlider {
  constructor({
    domElements,
    min,
    max,
    selectedRange,
    valuePerStep = 1,
    onChange = () => {},
  }) {
    this.state = {
      selectedRange: {
        start: null,
        end: null,
      },
    };

    this.min = min;
    this.max = max;
    this.valuePerStep = valuePerStep;
    this.onChange = onChange;
    this.state.selectedRange = selectedRange;

    this.registerDomElements(domElements);
    this.measureElementsSize();
    this.synchronizePositionsWithState();

    makeDraggable({
      node: this.leftHandle,
      onDrag: this.handleStartHandleDrag.bind(this),
      onDragEnd: this.handleDragEnd.bind(this),
    });
    makeDraggable({
      node: this.rightHandle,
      onDrag: this.handleEndHandleDrag.bind(this),
      onDragEnd: this.handleDragEnd.bind(this),
    });
    makeDraggable({
      node: this.selectedRange,
      onDrag: this.handleSelectedRangeDrag.bind(this),
      onDragEnd: this.handleDragEnd.bind(this),
    });
  }

  registerDomElements(domElements) {
    this.container = domElements.container;
    this.leftHandle = domElements.leftHandle;
    this.rightHandle = domElements.rightHandle;
    this.selectedRange = domElements.selectedRange;
    this.wireframe = domElements.wireframe;
    this.leftMask = domElements.leftMask;
    this.rightMask = domElements.rightMask;
  }

  measureElementsSize() {
    const { width, left } = this.container.getBoundingClientRect();
    this.sliderWidth = width;
    this.sliderLeft = left;
  }

  synchronizePositionsWithState() {
    const { selectedRange } = this.state;
    const normalizedSelectedRange = absoluteRangeToNormalized(
      selectedRange,
      this.min,
      this.max,
    );

    this.leftHandle.style.left = `${normalizedSelectedRange.start * 100}%`;
    this.rightHandle.style.left = `${normalizedSelectedRange.end * 100}%`;

    const normalizedSelectedRangeLength =
      normalizedSelectedRange.end - normalizedSelectedRange.start;
    this.selectedRange.style.left = `${normalizedSelectedRange.start * 100}%`;
    this.selectedRange.style.width = `${normalizedSelectedRangeLength * 100}%`;

    this.leftMask.style.left = 0;
    this.rightMask.style.right = 0;
    this.leftMask.style.width = `${normalizedSelectedRange.start * 100}%`;
    this.rightMask.style.width = `${(1 - normalizedSelectedRange.end) * 100}%`;
  }

  setSelectedRange(start, end) {
    this.state.selectedRange = { start, end };
    this.synchronizePositionsWithState();
  }

  handleStartHandleDrag(newPosition) {
    const normalizedValue = absoluteValueToNormalized(
      newPosition,
      this.sliderLeft,
      this.sliderWidth,
    );
    const endHandleValue = this.state.selectedRange.end;
    const normalizedEndHandleValue = absoluteValueToNormalized(
      endHandleValue,
      this.min,
      this.max,
    );

    const clampedValue = clamp(normalizedValue, 0, normalizedEndHandleValue);

    const { selectedRange } = this.state;
    const normalizedRange = absoluteRangeToNormalized(
      selectedRange,
      this.min,
      this.max,
    );
    normalizedRange.start = clampedValue;

    this.handleSelectedRangeChange(normalizedRange);
  }

  handleEndHandleDrag(newPosition) {
    const normalizedValue = absoluteValueToNormalized(
      newPosition,
      this.sliderLeft,
      this.sliderWidth,
    );
    const startHandleValue = this.state.selectedRange.start;
    const normalizedStartHandleValue = absoluteValueToNormalized(
      startHandleValue,
      this.min,
      this.max,
    );

    const clampedValue = clamp(normalizedValue, normalizedStartHandleValue, 1);

    const { selectedRange } = this.state;
    const normalizedRange = absoluteRangeToNormalized(
      selectedRange,
      this.min,
      this.max,
    );
    normalizedRange.end = clampedValue;

    this.handleSelectedRangeChange(normalizedRange);
  }

  handleSelectedRangeDrag(newPosition) {
    const { selectedRange } = this.state;
    const normalizedSelectedRange = absoluteRangeToNormalized(
      selectedRange,
      this.min,
      this.max,
    );
    const normalizedSelectedRangeLength =
      normalizedSelectedRange.end - normalizedSelectedRange.start;

    const normalizedStartValue = absoluteValueToNormalized(
      newPosition,
      this.sliderLeft,
      this.sliderWidth,
    );
    const clampedStartValue = clamp(
      normalizedStartValue,
      0,
      1 - normalizedSelectedRangeLength,
    );
    const normalizedEndValue =
      clampedStartValue + normalizedSelectedRangeLength;

    this.handleSelectedRangeChange({
      start: clampedStartValue,
      end: normalizedEndValue,
    });
  }

  handleSelectedRangeChange(normalizedRange) {
    const absoluteRange = normalizedRangeToAbsolute(
      normalizedRange,
      this.min,
      this.max,
    );
    this.state.selectedRange = absoluteRange;
    this.synchronizePositionsWithState();

    const roundedRange = {
      start: this.roundValue(absoluteRange.start),
      end: this.roundValue(absoluteRange.end),
    };
    this.onChange(roundedRange);
  }

  handleDragEnd() {
    const { selectedRange } = this.state;
    this.state.selectedRange = {
      start: this.roundValue(selectedRange.start),
      end: this.roundValue(selectedRange.end),
    };
    this.synchronizePositionsWithState();
  }

  roundValue(value) {
    return Math.round(value / this.valuePerStep) * this.valuePerStep;
  }
}

export { RangeSlider };
