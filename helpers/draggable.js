function makeDraggable({
  node: draggable,
  onDragStart = () => {},
  onDrag = () => {},
  onDragEnd = () => {},
}) {
  let cursorShift = null;
  draggable.style.cursor = 'grab';
  draggable.addEventListener('pointerdown', grab);

  function grab(event) {
    const { target: draggedObject, pageX: cursorX } = event;

    const draggedObjectLeft = draggedObject.getBoundingClientRect().left;
    cursorShift = cursorX - draggedObjectLeft;

    draggedObject.style.cursor = 'grabbing';

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
    draggable.style.cursor = 'grab';

    document.removeEventListener('pointermove', move);
    document.removeEventListener('pointerup', release);

    onDragEnd();

    event.stopPropagation();
    event.preventDefault();
  }
}

export { makeDraggable };
