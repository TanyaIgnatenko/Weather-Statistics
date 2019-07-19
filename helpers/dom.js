function removeAllChilds(node) {
  while (node.firstChild) {
    node.removeChild(node.firstChild);
  }
}

function bindLabelEnterPressWithRelatedInput(label) {
  const relatedInput = document.getElementById(label.htmlFor);
  label.addEventListener('keyup', event => {
    if(event.code === 'Enter' ) {
      relatedInput.click();
    }
  });
}

export { removeAllChilds, bindLabelEnterPressWithRelatedInput };
