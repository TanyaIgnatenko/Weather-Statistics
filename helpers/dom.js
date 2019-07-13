function removeAllChilds(node) {
  while(node.firstChild) {
    node.removeChild(node.firstChild);
  }
}

export { removeAllChilds };