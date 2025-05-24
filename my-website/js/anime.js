<script>
const API_KEY = '277256e815b05aae4f56dd5dd45eaa97';
const BASE_URL = 'https://api.themoviedb.org/3';
const IMG_URL = 'https://image.tmdb.org/t/p/original';
const mediaType = 'tv';
const ANIME_KEYWORD = 210024;

let currentItem = null;
let currentPage = 1;
let totalPages = Infinity;
let isLoading = false;

const latestMoviesList = document.getElementById('latest-movies-list');
const pageIndicator = document.getElementById('latest-page-indicator');
const genreSelect = document.getElementById('genre-select');
const yearSelect = document.getElementById('year-select');
const movieCache = new Map();

async function fetchGenres() {
  try {
    const res = await fetch(`${BASE_URL}/genre/tv/list?api_key=${API_KEY}`);
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

function populateYearDropdown() {
  const currentYear = new Date().getFullYear();
  for (let year = currentYear; year >= currentYear - 30; year--) {
    const option = document.createElement('option');
    option.value = year;
    option.textContent = year;
    yearSelect.appendChild(option);
  }
}

async function fetchNextPage() {
  if (isLoading || currentPage > totalPages || currentPage > 100) return;

  isLoading = true;
  pageIndicator.textContent = `Loading page ${currentPage}...`;

  const genre = genreSelect.value;
  const year = yearSelect.value;
  const cacheKey = `${genre}-${year}-${currentPage}`;

  if (movieCache.has(cacheKey)) {
    const cached = movieCache.get(cacheKey);
    appendMovies(cached.results);
    totalPages = cached.totalPages;
    currentPage++;
    isLoading = false;
    pageIndicator.textContent = `Page ${currentPage - 1}`;
    return;
  }

  let url = `${BASE_URL}/discover/tv?api_key=${API_KEY}&page=${currentPage}&with_keywords=${ANIME_KEYWORD}`;
  if (genre) url += `&with_genres=${genre}`;
  if (year) url += `&first_air_date_year=${year}`;

  try {
    const res = await fetch(url);
    const data = await res.json();
    console.log("Fetched Anime:", data.results);

    totalPages = data.total_pages;
    movieCache.set(cacheKey, { results: data.results || [], page: currentPage, totalPages });
    appendMovies(data.results || []);
    currentPage++;
    pageIndicator.textContent = `Page ${currentPage - 1}`;
  } catch (error) {
    console.error("Error fetching anime:", error);
  } finally {
    isLoading = false;
  }
}

function appendMovies(movies) {
  if (!movies.length) {
    const endMsg = document.createElement('p');
    endMsg.textContent = 'No more anime found.';
    latestMoviesList.appendChild(endMsg);
    return;
  }

  movies.forEach(movie => {
    const img = document.createElement('img');
    img.src = movie.poster_path ? `https://image.tmdb.org/t/p/w342${movie.poster_path}` : '';
    img.alt = movie.name || 'No title';
    img.title = movie.name || '';
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

function resetMovies() {
  latestMoviesList.innerHTML = '';
  currentPage = 1;
  totalPages = Infinity;
  movieCache.clear();
  fetchNextPage();
}

function showDetails(item) {
  currentItem = item;

  document.getElementById('modal-title').textContent = item.name || item.title || 'No title';
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
  const embedURL = server === "vidsrc.cc"
    ? `https://vidsrc.cc/v2/embed/tv/${currentItem.id}`
    : server === "vidsrc.me"
    ? `https://vidsrc.net/embed/tv/?tmdb=${currentItem.id}`
    : `https://player.videasy.net/tv/${currentItem.id}`;

  const videoFrame = document.getElementById('modal-video');
  if (videoFrame) videoFrame.src = embedURL;
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

window.addEventListener('scroll', () => {
  const scrollThreshold = 300;
  if ((window.innerHeight + window.scrollY) >= (document.body.offsetHeight - scrollThreshold)) {
    fetchNextPage();
  }
});

genreSelect.addEventListener('change', resetMovies);
yearSelect.addEventListener('change', resetMovies);
document.getElementById('modal-close').addEventListener('click', closeModal);
document.getElementById('modal').addEventListener('click', e => {
  if (e.target.id === 'modal') closeModal();
});
window.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeModal();
});

// Initial Load
fetchGenres();
populateYearDropdown();
resetMovies();
</script>
