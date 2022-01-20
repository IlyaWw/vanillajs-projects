const API_URL = 'http://www.omdbapi.com/';

const autocompleteConfig = {
  renderOption(movie) {
    const imgSrc = movie.Poster === 'N/A' ? '' : movie.Poster;
    return `<img src="${imgSrc}" alt="movie poster" />${movie.Title} (${movie.Year})`;
  },
  inputValue(movie) {
    return movie.Title;
  },
  async fetchData(searchTerm) {
    const { data } = await axios.get(API_URL, {
      params: {
        apikey: API_KEY,
        s: searchTerm,
      },
    });

    return data.Search;
  },
};

createAutocomplete({
  ...autocompleteConfig,
  root: document.querySelector('#left-autocomplete'),
  onOptionSelect(movie) {
    onMovieSelect({
      movie,
      summaryElement: document.querySelector('#left-summary'),
      side: 'left',
    });
  },
});

createAutocomplete({
  ...autocompleteConfig,
  root: document.querySelector('#right-autocomplete'),
  onOptionSelect(movie) {
    onMovieSelect({
      movie,
      summaryElement: document.querySelector('#right-summary'),
      side: 'right',
    });
  },
});

let leftMovie;
let rightMovie;
const onMovieSelect = async ({ movie, summaryElement, side }) => {
  document.querySelector('.tutorial').classList.add('is-hidden');

  const { data } = await axios.get(API_URL, {
    params: {
      apikey: API_KEY,
      i: movie.imdbID,
    },
  });

  summaryElement.innerHTML = movieTemplate(data);

  if (side === 'left') {
    leftMovie = data;
  } else {
    rightMovie = data;
  }

  if (leftMovie && rightMovie) runComparison();
};

const runComparison = () => {
  const leftElements = document.querySelectorAll('#left-summary .notification');
  const rightElements = document.querySelectorAll(
    '#right-summary .notification'
  );

  leftElements.forEach((leftElement, index) => {
    const rightElement = rightElements[index];
    const leftParam = parseFloat(leftElement.dataset.value);
    const rightParam = parseFloat(rightElement.dataset.value);

    if (leftParam > rightParam) {
      rightElement.classList.remove('is-primary');
      rightElement.classList.add('is-danger');
    } else if (leftParam < rightParam) {
      leftElement.classList.remove('is-primary');
      leftElement.classList.add('is-danger');
    } else {
      rightElement.classList.remove('is-primary');
      rightElement.classList.add('is-warning');
      leftElement.classList.remove('is-primary');
      leftElement.classList.add('is-warning');
    }
  });
};

const movieTemplate = (movieData) => {
  const awards = movieData.Awards.split(' ').reduce((count, word) => {
    const num = parseInt(word);
    if (!isNaN(num)) count += num;
    return count;
  }, 0);
  const boxOffice = movieData.BoxOffice.replace(/\$/, '').replace(/,/, '');
  const imdbVotes = movieData.imdbVotes.replace(/,/, '');

  return `
    <article class="media">
      <figure class="media-left">
        <p class="image">
          <img src="${movieData.Poster}" />
        </p>
      </figure>
      <div class="media-content">
        <div class="content">
          <h1>${movieData.Title}</h1>
          <h4>${movieData.Genre}</h4>
          <p>${movieData.Plot}</p>
        </div>
      </div>
    </article>
    <article data-value="${awards}" class="notification is-primary">
      <p class="title">${movieData.Awards}</p>
      <p class="subtitle">Awards</p>
    </article>
    <article data-value="${boxOffice}" class="notification is-primary">
      <p class="title">${movieData.BoxOffice}</p>
      <p class="subtitle">Box office</p>
    </article>
    <article data-value="${movieData.Metascore}" class="notification is-primary">
      <p class="title">${movieData.Metascore}</p>
      <p class="subtitle">Metascore</p>
    </article>
    <article data-value="${movieData.imdbRating}" class="notification is-primary">
      <p class="title">${movieData.imdbRating}</p>
      <p class="subtitle">IMDB rating</p>
    </article>
    <article data-value="${imdbVotes}" class="notification is-primary">
      <p class="title">${movieData.imdbVotes}</p>
      <p class="subtitle">IMDB votes</p>
    </article>
  `;
};
