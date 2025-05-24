const API_KEY = '277256e815b05aae4f56dd5dd45eaa97';
const BASE_URL = 'https://api.themoviedb.org/3';
const IMG_URL = 'https://image.tmdb.org/t/p/original';

let currentItem = null;
let currentPage = 1;
let totalPages = Infinity; // unknown at start, updated on fetch
let isLoading = false;

const latestMoviesList = document.getElementById('latest-movies-list');
const pageIndicator = document.getElementById('latest-page-indicator');

const genreSelect = document.getElementById('genre-select');
const yearSelect = document.getElementById('year-select');

const mediaType = 'movie';

const movieCache = new Map(); // cache with key `${genre}-${year}-${page}`

// Search modal and elements
const searchModal = document.getElementById('search-modal');
const navbarSearchInput = document.getElementById('search-input-navbar');
const searchInput = document.getElementById('search-input');
const searchResults = document.getElementById('search-results');
const searchCloseBtn = document.getElementById('search-close-btn');

// Open search modal on navbar search input click
navbarSearchInput.addEventListener('click', () => {
  searchModal.style.display = 'block';
  searchInput.value = '';
  searchResults.innerHTML = '';
  searchInput.focus();
});

// Close search modal on close button click
searchCloseBtn.addEventListener('click', () => {
  searchModal.style.display = 'none';
  searchInput.value = '';
  searchResults.innerHTML = '';
});

// Close search modal if clicking outside input/results
searchModal.addEventListener('click', e => {
  if (e.target === searchModal) {
    searchModal.style.display = 'none';
    searchInput.value = '';
    searchResults.innerHTML = '';
  }
});

// Search TMDB multi endpoint as user types, debounce to avoid too many requests
let searchTimeout = null;
searchInput.addEventListener('input', () => {
  clearTimeout(searchTimeout);
  const query = searchInput.value.trim();
  if (!query) {
    searchResults.innerHTML = '';
    return;
  }

  searchTimeout = setTimeout(() => {
    searchTMDB(query);
  }, 400);
});

async function searchTMDB(query) {
  searchResults.innerHTML = '<p style="color:#fff;">Searching...</p>';

  try {
    const res = await fetch(`${BASE_URL}/search/multi?api_key=${API_KEY}&query=${encodeURIComponent(query)}&page=1`);
    if (!res.ok) throw new Error(`Error: ${res.status}`);
    const data = await res.json();

    if (!data.results || data.results.length === 0) {
      searchResults.innerHTML = '<p style="color:#fff;">No results found.</p>';
      return;
    }

    renderSearchResults(data.results);
  } catch (err) {
    console.error('Search error:', err);
    searchResults.innerHTML = '<p style="color:#f00;">Search failed. Try again.</p>';
  }
}

function renderSearchResults(results) {
  searchResults.innerHTML = '';
  results.forEach(item => {
    // Skip if no title or name
    if (!item.title && !item.name) return;

    const div = document.createElement('div');
    div.style.cursor = 'pointer';
    div.style.width = '150px';
    div.style.color = '#fff';
    div.style.textAlign = 'center';

    const img = document.createElement('img');
    img.src = item.poster_path ? `https://image.tmdb.org/t/p/w154${item.poster_path}` : '';
    img.alt = item.title || item.name;
    img.loading = 'lazy';
    img.style.width = '100%';
    img.style.borderRadius = '8px';
    img.style.marginBottom = '5px';

    const title = document.createElement('div');
    title.textContent = item.title || item.name || 'No title';
    title.style.fontSize = '14px';
    title.style.overflow = 'hidden';
    title.style.textOverflow = 'ellipsis';
    title.style.whiteSpace = 'nowrap';

    div.appendChild(img);
    div.appendChild(title);

    div.onclick = () => {
      showDetails({
        ...item,
        media_type: item.media_type || (item.first_air_date ? 'tv' : 'movie'),
      });
      searchModal.style.display = 'none';
      searchInput.value = '';
      searchResults.innerHTML = '';
    };

    searchResults.appendChild(div);
  });
}

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

// Fetch next page of filtered movies
async function fetchNextPage() {
  if (isLoading) return;
  if (currentPage > totalPages || currentPage > 100) return; // TMDB max 100 pages

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

   let url = `${BASE_URL}/discover/tv?api_key=${API_KEY}&page=${currentPage}&with_original_language=ja&with_genres=16&sort_by=popularity.desc`;
 if (genre) url += `&with_genres=${genre}`;
  if (year) url += `&primary_release_year=${year}`;

  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    const data = await res.json();

    totalPages = data.total_pages;
    movieCache.set(cacheKey, { results: data.results || [], page: currentPage, totalPages });

    appendMovies(data.results || []);

    currentPage++;
    pageIndicator.textContent = `Page ${currentPage - 1}`;
  } catch (error) {
    console.error("Error fetching movies:", error);
  } finally {
    isLoading = false;
  }
}

function appendMovies(movies) {
  if (!movies.length) {
    const endMsg = document.createElement('p');
    endMsg.textContent = 'No more movies found.';
    latestMoviesList.appendChild(endMsg);
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

// Reset movies and cache on filter change
function resetMovies() {
  latestMoviesList.innerHTML = '';
  currentPage = 1;
  totalPages = Infinity;
  movieCache.clear();
  fetchNextPage();
}

// Show movie details modal
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

// Change video server iframe src
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

// Infinite scroll
window.addEventListener('scroll', () => {
  const scrollThreshold = 300; // pixels from bottom to trigger loading

  if ((window.innerHeight + window.scrollY) >= (document.body.offsetHeight - scrollThreshold)) {
    fetchNextPage();
  }
});

// Filter change resets movies and starts from page 1
genreSelect.addEventListener('change', resetMovies);
yearSelect.addEventListener('change', resetMovies);

// Modal close handlers
document.getElementById('modal-close').addEventListener('click', closeModal);
document.getElementById('modal').addEventListener('click', e => {
  if (e.target.id === 'modal') closeModal();
});
window.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeModal();
});

// About modal handlers
const aboutModal = document.getElementById('about-modal');
const openAboutBtn = document.getElementById('open-about-btn');
const closeAboutBtn = document.getElementById('close-about-btn');
if (aboutModal && openAboutBtn && closeAboutBtn) {
  openAboutBtn.addEventListener('click', e => {
    e.preventDefault();
    aboutModal.style.display = 'flex';
  });
  closeAboutBtn.addEventListener('click', () => aboutModal.style.display = 'none');
  aboutModal.addEventListener('click', e => {
    if (e.target === aboutModal) aboutModal.style.display = 'none';
  });
}

function openDisclaimerModal() {
  document.getElementById('disclaimer-modal').style.display = 'flex';
}
function closeDisclaimerModal() {
  document.getElementById('disclaimer-modal').style.display = 'none';
}

// Initialize genres, years and first load
fetchGenres();
populateYearDropdown();
resetMovies();
