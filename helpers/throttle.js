function throttle(func, ms) {
  let shouldWait = false;
  let savedThis = null;
  let savedArgs = null;

  return function funcWrapper() {
    if(shouldWait) {
      savedThis = this;
      savedArgs = arguments;
      return;
    }

    func.apply(this, arguments);

    shouldWait = true;

    setTimeout(() => {
      shouldWait = false;

      if(savedThis) {
        funcWrapper.apply(savedThis, savedArgs);
        savedThis = savedArgs = null;
      }
    }, ms)
  }
}

export { throttle };