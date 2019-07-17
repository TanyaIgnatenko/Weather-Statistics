import { makeDraggable } from '../helpers/draggable.js';
import { clamp } from '../helpers/clamp.js';

class RangeSlider {
  state = {
    selectedRange: {
      start: null,
      end: null,
    },
  };

  constructor({
                domElements,
                min,
                max,
                selectedRange,
                valuePerStep = 1,
                onChange = () => {
                },
              }) {
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
      onDrag: this.handleStartHandleDrag,
      onDragEnd: this.handleDragEnd,
    });
    makeDraggable({
      node: this.rightHandle,
      onDrag: this.handleEndHandleDrag,
      onDragEnd: this.handleDragEnd,
    });
    makeDraggable({
      node: this.selectedRange,
      onDrag: this.handleSelectedRangeDrag,
      onDragEnd: this.handleDragEnd,
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
    const normalizedSelectedRange = this.absoluteRangeToNormalized(
      selectedRange,
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

  handleStartHandleDrag = newPosition => {
    const normalizedValue = this.pagePositionToNormalizedValue(newPosition);
    const endHandleValue = this.state.selectedRange.end;
    const normalizedEndHandleValue = this.absoluteValueToNormalized(
      endHandleValue,
    );

    const clampedValue = clamp(
      normalizedValue,
      0,
      normalizedEndHandleValue,
    );

    const { selectedRange } = this.state;
    const normalizedRange = this.absoluteRangeToNormalized(selectedRange);
    normalizedRange.start = clampedValue;

    this.handleSelectedRangeChange(normalizedRange);
  };

  handleEndHandleDrag = newPosition => {
    const normalizedValue = this.pagePositionToNormalizedValue(newPosition);
    const startHandleValue = this.state.selectedRange.start;
    const normalizedStartHandleValue = this.absoluteValueToNormalized(
      startHandleValue,
    );

    const clampedValue = clamp(
      normalizedValue,
      normalizedStartHandleValue,
      1,
    );

    const { selectedRange } = this.state;
    const normalizedRange = this.absoluteRangeToNormalized(selectedRange);
    normalizedRange.end = clampedValue;

    this.handleSelectedRangeChange(normalizedRange);
  };

  handleSelectedRangeDrag = newPosition => {
    const { selectedRange } = this.state;
    const normalizedSelectedRange = this.absoluteRangeToNormalized(
      selectedRange,
    );
    const normalizedSelectedRangeLength =
      normalizedSelectedRange.end - normalizedSelectedRange.start;

    const normalizedStartValue = this.pagePositionToNormalizedValue(
      newPosition,
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
  };

  handleSelectedRangeChange = normalizedRange => {
    const absoluteRange = this.normalizedRangeToAbsolute(normalizedRange);
    this.state.selectedRange = absoluteRange;
    this.synchronizePositionsWithState();

    const roundedRange = {
      start: this.roundValue(absoluteRange.start),
      end: this.roundValue(absoluteRange.end),
    };
    this.onChange(roundedRange);
  };

  handleDragEnd = () => {
    const { selectedRange } = this.state;
    this.state.selectedRange = {
      start: this.roundValue(selectedRange.start),
      end: this.roundValue(selectedRange.end),
    };
    this.synchronizePositionsWithState();
  };

  roundValue = value => {
    return Math.round(value / this.valuePerStep) * this.valuePerStep;
  };

  absoluteRangeToNormalized = absoluteRange => ({
    start: this.absoluteValueToNormalized(absoluteRange.start),
    end: this.absoluteValueToNormalized(absoluteRange.end),
  });

  absoluteValueToNormalized = absoluteValue => {
    return (absoluteValue - this.min) / (this.max - this.min);
  };

  normalizedValueToAbsolute = normalizedValue => {
    return normalizedValue * (this.max - this.min) + this.min;
  };

  normalizedRangeToAbsolute = absoluteRange => ({
    start: this.normalizedValueToAbsolute(absoluteRange.start),
    end: this.normalizedValueToAbsolute(absoluteRange.end),
  });

  pagePositionToNormalizedValue = position => {
    return (position - this.sliderLeft) / this.sliderWidth;
  };
}

export { RangeSlider };
