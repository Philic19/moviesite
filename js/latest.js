const API_KEY = '277256e815b05aae4f56dd5dd45eaa97';
const BASE_URL = 'https://api.themoviedb.org/3';
const IMG_URL = 'https://image.tmdb.org/t/p/original';

let currentItem = null;
let currentPage = 1;
let totalPages = Infinity;
let isLoading = false;

const latestMoviesList = document.getElementById('latest-movies-list');
const pageIndicator = document.getElementById('latest-page-indicator');
const genreSelect = document.getElementById('genre-select');
const yearSelect = document.getElementById('year-select');
const mediaType = 'movie';
const movieCache = new Map();

const searchModal = document.getElementById('search-modal');
const navbarSearchInput = document.getElementById('search-input-navbar');
const searchInput = document.getElementById('search-input');
const searchResults = document.getElementById('search-results');
const searchCloseBtn = document.getElementById('search-close-btn');

// Focus trap elements
const focusableSelectors = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
let lastFocusedElement = null;

// Focus trap for search modal
function trapFocus(modal) {
  const focusableElements = modal.querySelectorAll(focusableSelectors);
  const firstEl = focusableElements[0];
  const lastEl = focusableElements[focusableElements.length - 1];

  modal.addEventListener('keydown', (e) => {
    if (e.key === 'Tab') {
      if (e.shiftKey) {
        if (document.activeElement === firstEl) {
          e.preventDefault();
          lastEl.focus();
        }
      } else {
        if (document.activeElement === lastEl) {
          e.preventDefault();
          firstEl.focus();
        }
      }
    }
  });
}

// Open search modal
navbarSearchInput.addEventListener('click', () => {
  lastFocusedElement = document.activeElement;
  searchModal.style.display = 'block';
  searchInput.value = '';
  searchResults.innerHTML = '';
  searchInput.focus();
  trapFocus(searchModal);
});

// Close search modal
function closeSearchModal() {
  searchModal.style.display = 'none';
  searchInput.value = '';
  searchResults.innerHTML = '';
  if (lastFocusedElement) lastFocusedElement.focus();
}

searchCloseBtn.addEventListener('click', closeSearchModal);
searchModal.addEventListener('click', e => {
  if (e.target === searchModal) closeSearchModal();
});
window.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    if (searchModal.style.display === 'block') closeSearchModal();
    if (document.getElementById('modal').style.display === 'flex') closeModal();
  }
});

// Debounced search
let searchTimeout = null;
searchInput.addEventListener('input', () => {
  clearTimeout(searchTimeout);
  const query = searchInput.value.trim();
  if (!query) return searchResults.innerHTML = '';
  searchTimeout = setTimeout(() => searchTMDB(query), 400);
});

async function searchTMDB(query) {
  searchResults.innerHTML = '<p style="color:#fff;">Searching...</p>';
  try {
    const res = await fetch(`${BASE_URL}/search/multi?api_key=${API_KEY}&query=${encodeURIComponent(query)}&page=1`);
    if (!res.ok) throw new Error(`Error: ${res.status}`);
    const data = await res.json();
    if (!data.results.length) return searchResults.innerHTML = '<p style="color:#fff;">No results found.</p>';
    renderSearchResults(data.results);
  } catch (err) {
    console.error('Search error:', err);
    searchResults.innerHTML = '<p style="color:#f00;">Search failed. Try again.</p>';
  }
}

function renderSearchResults(results) {
  searchResults.innerHTML = '';
  results.forEach(item => {
    if (!item.title && !item.name) return;
    const div = document.createElement('div');
    div.style.cssText = 'cursor:pointer;width:150px;color:#fff;text-align:center;';

    const img = document.createElement('img');
    img.src = item.poster_path ? `https://image.tmdb.org/t/p/w154${item.poster_path}` : '';
    img.alt = item.title || item.name;
    img.loading = 'lazy';
    img.style.cssText = 'width:100%;border-radius:8px;margin-bottom:5px;';

    const title = document.createElement('div');
    title.textContent = item.title || item.name || 'No title';
    title.style.cssText = 'font-size:14px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;';

    div.appendChild(img);
    div.appendChild(title);
    div.onclick = () => {
      showDetails({ ...item, media_type: item.media_type || (item.first_air_date ? 'tv' : 'movie') });
      closeSearchModal();
    };
    searchResults.appendChild(div);
  });
}

async function fetchGenres() {
  try {
    const res = await fetch(`${BASE_URL}/genre/movie/list?api_key=${API_KEY}`);
    const data = await res.json();
    data.genres.forEach(g => {
      const option = document.createElement('option');
      option.value = g.id;
      option.textContent = g.name;
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

  let url = `${BASE_URL}/discover/movie?api_key=${API_KEY}&page=${currentPage}`;
  if (genre) url += `&with_genres=${genre}`;
  if (year) url += `&primary_release_year=${year}`;

  try {
    const res = await fetch(url);
    const data = await res.json();
    totalPages = data.total_pages;
    movieCache.set(cacheKey, { results: data.results, page: currentPage, totalPages });
    appendMovies(data.results);
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
    img.style.cssText = 'cursor:pointer;min-height:250px;';
    img.onclick = () => showDetails({ ...movie, media_type: mediaType });
    latestMoviesList.appendChild(img);
  });
}

function resetMovies() {
  window.scrollTo(0, 0);
  latestMoviesList.innerHTML = '';
  currentPage = 1;
  totalPages = Infinity;
  movieCache.clear();
  fetchNextPage();
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

  document.getElementById('modal-video').src = embedURL;
}

function closeModal() {
  document.getElementById('modal').style.display = 'none';
  document.getElementById('modal-video').src = '';
}

function getStars(vote) {
  const full = Math.floor(vote / 2);
  const half = vote % 2 >= 1 ? 1 : 0;
  return '★'.repeat(full) + (half ? '½' : '') + '☆'.repeat(5 - full - half);
}

// Infinite scroll
window.addEventListener('scroll', () => {
  if ((window.innerHeight + window.scrollY) >= (document.body.offsetHeight - 300)) {
    fetchNextPage();
  }
});

genreSelect.addEventListener('change', resetMovies);
yearSelect.addEventListener('change', resetMovies);

// Modal events
document.getElementById('modal-close').addEventListener('click', closeModal);
document.getElementById('modal').addEventListener('click', e => {
  if (e.target.id === 'modal') closeModal();
});

// About modal
const aboutModal = document.getElementById('about-modal');
document.getElementById('open-about-btn')?.addEventListener('click', e => {
  e.preventDefault();
  aboutModal.style.display = 'flex';
});
document.getElementById('close-about-btn')?.addEventListener('click', () => aboutModal.style.display = 'none');
aboutModal?.addEventListener('click', e => {
  if (e.target === aboutModal) aboutModal.style.display = 'none';
});

function openDisclaimerModal() {
  document.getElementById('disclaimer-modal').style.display = 'flex';
}
function closeDisclaimerModal() {
  document.getElementById('disclaimer-modal').style.display = 'none';
}

// Initial load
fetchGenres();
populateYearDropdown();
resetMovies();
