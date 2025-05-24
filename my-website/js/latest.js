const API_KEY = 'a1e72fd93ed59f56e6332813b9f8dcae';
const BASE_URL = 'https://api.themoviedb.org/3';

const latestMoviesList = document.getElementById('latest-movies-list');
const prevBtn = document.getElementById('latest-prev-btn');
const nextBtn = document.getElementById('latest-next-btn');
const pageIndicator = document.getElementById('latest-page-indicator');

let currentPage = 1;
let totalPages = 1; // will be updated from API response

async function fetchLatestMovies(page = 1) {
  try {
    const response = await fetch(`${BASE_URL}/movie/now_playing?api_key=${API_KEY}&language=en-US&page=${page}`);
    const data = await response.json();

    totalPages = data.total_pages;
    currentPage = data.page;

    displayLatestMovies(data.results || []);
    updatePaginationButtons();
  } catch (error) {
    console.error('Error fetching latest movies:', error);
  }
}

function displayLatestMovies(movies) {
  if (!latestMoviesList) return;

  latestMoviesList.innerHTML = '';

  movies.forEach(movie => {
    const img = document.createElement('img');
    img.src = `https://image.tmdb.org/t/p/w500${movie.poster_path}`;
    img.alt = movie.title;
    img.title = movie.title;
    img.classList.add('movie-poster');

    img.onclick = () => openModalWithMovie(movie);

    latestMoviesList.appendChild(img);
  });
}

function updatePaginationButtons() {
  pageIndicator.textContent = `Page ${currentPage} of ${totalPages}`;
  prevBtn.disabled = currentPage <= 1;
  nextBtn.disabled = currentPage >= totalPages;
}

function openModalWithMovie(movie) {
  alert(`Selected movie: ${movie.title}`);
}

// Button event listeners
if (prevBtn && nextBtn) {
  prevBtn.addEventListener('click', () => {
    if (currentPage > 1) {
      fetchLatestMovies(currentPage - 1);
    }
  });

  nextBtn.addEventListener('click', () => {
    if (currentPage < totalPages) {
      fetchLatestMovies(currentPage + 1);
    }
  });
}

// Initial fetch on page load if container exists
if (latestMoviesList) {
  fetchLatestMovies();
}
