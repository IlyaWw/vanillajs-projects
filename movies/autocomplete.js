const createAutocomplete = ({
  root,
  renderOption,
  onOptionSelect,
  inputValue,
  fetchData,
}) => {
  const INPUT_DEBOUNCE_DELAY = 500;

  root.innerHTML = `
    <label><b>Search</b></label>
    <input class="input" />
    <div class="dropdown">
      <div class="dropdown-menu">
        <div class="dropdown-content results"></div>
      </div>
    </div>
  `;

  const input = root.querySelector('input');
  const dropdown = root.querySelector('.dropdown');
  const resultsWrapper = root.querySelector('.results');

  const onInput = async (event) => {
    const items = await fetchData(event.target.value);

    if (!items) {
      dropdown.classList.remove('is-active');
      return;
    }

    resultsWrapper.innerHTML = '';
    dropdown.classList.add('is-active');
    items.forEach((item) => {
      const option = document.createElement('a');

      option.classList.add('dropdown-item');
      option.innerHTML = renderOption(item);
      option.addEventListener('click', () => {
        input.value = inputValue(item);
        dropdown.classList.remove('is-active');
        onOptionSelect(item);
      });

      resultsWrapper.appendChild(option);
    });
  };

  input.addEventListener('input', debounce(onInput, INPUT_DEBOUNCE_DELAY));
  document.addEventListener('click', (event) => {
    if (!root.contains(event.target)) {
      dropdown.classList.remove('is-active');
    }
  });
};
