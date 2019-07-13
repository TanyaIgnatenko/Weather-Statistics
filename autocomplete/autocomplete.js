import { removeAllChilds } from '../helpers/dom.js';
import { onClickOutside } from '../helpers/onClickOutside.js';

function autocomplete(input, options) {
  const inputContainer = input.parentNode;
  const inputContainerId = 'autocomplete-container';
  inputContainer.id = inputContainerId;
  onClickOutside(inputContainerId, hideAutocompleteList);

  const autocompleteList = createAutocompleteList();
  inputContainer.appendChild(autocompleteList);
  hideAutocompleteList();

  input.addEventListener('input', refreshAutocompleteOptions);
  input.addEventListener('focus', showAutocompleteList);

  function refreshAutocompleteOptions(event) {
    removeAllChilds(autocompleteList);

    const { value } = event.target;
    const matchedOptions = options.filter(option => {
      return option.startsWith(value);
    });

    matchedOptions.forEach(option => {
      const optionNode = createAutocompleteOption(option);
      autocompleteList.appendChild(optionNode);
    });
  }

  function createAutocompleteList() {
    const autocompleteList = document.createElement('ul');
    autocompleteList.classList.add('autocomplete-list');

    return autocompleteList;
  }

  function createAutocompleteOption(option) {
    const optionNode = document.createElement('li');
    optionNode.classList.add('autocomplete-option');
    optionNode.innerText = option;
    optionNode.addEventListener('click', handleOptionSelected.bind(null, option));
    return optionNode;
  }

  function handleOptionSelected(option) {
    input.value = option;
    hideAutocompleteList();
  }

  function showAutocompleteList() {
    autocompleteList.style.display = 'block';
  }

  function hideAutocompleteList() {
    autocompleteList.style.display = 'none';
  }
}

export { autocomplete };