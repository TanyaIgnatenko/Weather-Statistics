function createElement(parentNode, tag, className ='', attributes = {}) {
  const el = document.createElement(tag);

  for(const attribute in attributes) {
    el[attribute] = attributes[attribute];
  }

  el.classList.add(className);
  parentNode.append(el);
}

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

export { createElement, removeAllChilds, bindLabelEnterPressWithRelatedInput };
