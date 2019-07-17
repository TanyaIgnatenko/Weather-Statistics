function makeDraggable({
                         node: draggable,
                         onDragStart = () => {},
                         onDrag = () => {},
                         onDragEnd = () => {},
                       }
) {
  draggable.addEventListener('pointerdown', grab);

  let cursorShift = null;

  function grab(event) {
    const { target: draggedObject, pageX: cursorX } = event;

    const draggedObjectLeft = draggedObject.getBoundingClientRect().left;
    cursorShift = cursorX - draggedObjectLeft;

    document.addEventListener('pointermove', move);
    document.addEventListener('pointerup', release);

    onDragStart();

    event.stopPropagation();
    event.preventDefault();
  }

  function move(event) {
    const { pageX: cursorPagePosition } = event;

    const leftPosition = cursorPagePosition - cursorShift;

    onDrag(leftPosition);

    event.stopPropagation();
    event.preventDefault();
  }

  function release(event) {
    document.removeEventListener('pointermove', move);
    document.removeEventListener('pointerup', release);

    onDragEnd();

    event.stopPropagation();
    event.preventDefault();
  }
}

export { makeDraggable };
