const API_KEY = '277256e815b05aae4f56dd5dd45eaa97';
const BASE_URL = 'https://api.themoviedb.org/3';
const IMG_URL = 'https://image.tmdb.org/t/p/original';

let currentItem = null;
let currentPage = 1;
let totalPages = 100; // TMDB allows up to 100 pages max

const latestMoviesList = document.getElementById('latest-movies-list');
const prevBtn = document.getElementById('latest-prev-btn');
const nextBtn = document.getElementById('latest-next-btn');
const pageIndicator = document.getElementById('latest-page-indicator');

const genreSelect = document.getElementById('genre-select');
const yearSelect = document.getElementById('year-select');

const mediaType = 'movie'; // keep as movie for this filter example

const movieCache = new Map(); // key: `${genre}-${year}-${page}`, value: movie list

// Fetch genres and populate the genre dropdown
async function fetchGenres() {
  try {
    const res = await fetch(`${BASE_URL}/genre/movie/list?api_key=${API_KEY}`);
    if (!res.ok) throw new Error('Failed to fetch genres');
    const data = await res.json();
    data.genres.forEach(genre => {
      const option = document.createElement('option');
      option.value = genre.id;
      option.textContent = genre.name;
      genreSelect.appendChild(option);
    });
  } catch (err) {
    console.error('Error loading genres:', err);
  }
}

// Populate year dropdown for last 30 years
function populateYearDropdown() {
  const currentYear = new Date().getFullYear();
  for (let year = currentYear; year >= currentYear - 30; year--) {
    const option = document.createElement('option');
    option.value = year;
    option.textContent = year;
    yearSelect.appendChild(option);
  }
}

// Fetch movies with filters applied
async function fetchFilteredMovies(page = 1) {
  const genre = genreSelect.value;
  const year = yearSelect.value;
  const cacheKey = `${genre}-${year}-${page}`;

  // Show skeletons
  latestMoviesList.innerHTML = '<p>Loading...</p>';
  pageIndicator.textContent = `Loading...`;

  if (movieCache.has(cacheKey)) {
    const cached = movieCache.get(cacheKey);
    displayLatestMovies(cached.results);
    currentPage = cached.page;
    totalPages = cached.totalPages;
    updatePaginationButtons();
    return;
  }

  let url = `${BASE_URL}/discover/movie?api_key=${API_KEY}&page=${page}`;
  if (genre) url += `&with_genres=${genre}`;
  if (year) url += `&primary_release_year=${year}`;

  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    const data = await res.json();

    movieCache.set(cacheKey, { results: data.results || [], page, totalPages: Math.min(100, data.total_pages) });

    currentPage = page;
    totalPages = data.total_pages > 100 ? 100 : data.total_pages;
    displayLatestMovies(data.results || []);
    updatePaginationButtons();
  } catch (error) {
    console.error("Error Fetching Filtered Movies:", error);
    displayLatestMovies([]);
  }
}

function displayLatestMovies(movies) {
  latestMoviesList.innerHTML = '';

  if (movies.length === 0) {
    latestMoviesList.textContent = 'No movies found.';
    return;
  }

  movies.forEach(movie => {
    const img = document.createElement('img');
    img.src = movie.poster_path ? `https://image.tmdb.org/t/p/w342${movie.poster_path}` : '';
    img.alt = movie.title || movie.name || 'No title';
    img.title = movie.title || movie.name || '';
    img.loading = 'lazy';
    img.style.cursor = 'pointer';
    img.style.minHeight = '250px';

    img.onclick = () => showDetails({
      ...movie,
      media_type: mediaType
    });

    latestMoviesList.appendChild(img);
  });
}

function updatePaginationButtons() {
  pageIndicator.textContent = `Page ${currentPage}`;
  prevBtn.disabled = currentPage <= 1;
  nextBtn.disabled = currentPage >= totalPages;
}

function showDetails(item) {
  currentItem = item;

  document.getElementById('modal-title').textContent = item.title || item.name || 'No title';
  document.getElementById('modal-description').textContent = item.overview || 'No description.';
  document.getElementById('modal-image').src = item.poster_path ? `${IMG_URL}${item.poster_path}` : '';
  document.getElementById('modal-rating').innerHTML = getStars(item.vote_average || 0);

  const serverSelect = document.getElementById('server');
  if (serverSelect) {
    serverSelect.value = 'vidsrc.cc';
    serverSelect.onchange = changeServer;
  }

  document.getElementById('modal').style.display = 'flex';
  changeServer();
}

function changeServer() {
  if (!currentItem) return;
  const server = document.getElementById('server').value;
  const type = currentItem.media_type === "tv" ? "tv" : "movie";
  let embedURL = "";

  if (server === "vidsrc.cc") {
    embedURL = `https://vidsrc.cc/v2/embed/${type}/${currentItem.id}`;
  } else if (server === "vidsrc.me") {
    embedURL = `https://vidsrc.net/embed/${type}/?tmdb=${currentItem.id}`;
  } else if (server === "player.videasy.net") {
    embedURL = `https://player.videasy.net/${type}/${currentItem.id}`;
  }

  const videoFrame = document.getElementById('modal-video');
  if (videoFrame) {
    videoFrame.src = embedURL;
  }
}

function closeModal() {
  document.getElementById('modal').style.display = 'none';
  const videoFrame = document.getElementById('modal-video');
  if (videoFrame) videoFrame.src = '';
}

function getStars(vote) {
  const full = Math.floor(vote / 2);
  const half = vote % 2 >= 1 ? 1 : 0;
  return '★'.repeat(full) + (half ? '½' : '') + '☆'.repeat(5 - full - half);
}

// Event listeners
prevBtn.addEventListener('click', () => {
  if (currentPage > 1) {
    fetchFilteredMovies(currentPage - 1);
  }
});

nextBtn.addEventListener('click', () => {
  if (currentPage < totalPages) {
    fetchFilteredMovies(currentPage + 1);
  }
});

genreSelect.addEventListener('change', () => fetchFilteredMovies(1));
yearSelect.addEventListener('change', () => fetchFilteredMovies(1));

document.getElementById('modal-close').addEventListener('click', closeModal);
document.getElementById('modal').addEventListener('click', e => {
  if (e.target.id === 'modal') closeModal();
});
window.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeModal();
});

// Initialize filters and load first page
fetchGenres();
populateYearDropdown();
fetchFilteredMovies(1);
