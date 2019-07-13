function onClickOutside(elementId, onClickOutside) {
  const checkClick = function(event) {
      const wasClickOutside = !event.target.closest(`#${elementId}`);

      if (wasClickOutside) {
        onClickOutside();
      }
    };

    document.addEventListener('mousedown', checkClick);
}

export { onClickOutside };
