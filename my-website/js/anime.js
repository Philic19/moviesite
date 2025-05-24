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

const mediaType = 'tv'; // Anime are TV shows

const movieCache = new Map();

// Search modal elements
const searchModal = document.getElementById('search-modal');
const navbarSearchInput = document.getElementById('search-input-navbar');
const searchInput = document.getElementById('search-input');
const searchResults = document.getElementById('search-results');
const searchCloseBtn = document.getElementById('search-close-btn');

// Open search modal
navbarSearchInput.addEventListener('click', () => {
  searchModal.style.display = 'block';
  searchInput.value = '';
  searchResults.innerHTML = '';
  searchInput.focus();
});

// Close search modal
searchCloseBtn.addEventListener('click', () => {
  searchModal.style.display = 'none';
  searchInput.value = '';
  searchResults.innerHTML = '';
});
searchModal.addEventListener('click', e => {
  if (e.target === searchModal) {
    searchModal.style.display = 'none';
    searchInput.value = '';
    searchResults.innerHTML = '';
  }
});

// Search with debounce
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
    if (!item.title && !item.name) return;

    const div = document.createElement('div');
    div.style.cursor = 'pointer';
    div.style.width = '150px';
    div.style.color = '#fff';
    div.style.textAlign = 'center';

    const img = document.createElement('img');
    img.src = item.poster_path ? `https://image.tmdb.org/t/p/w154${item.poster_path}` : '';
    img.alt = item.name || item.title;
    img.loading = 'lazy';
    img.style.width = '100%';
    img.style.borderRadius = '8px';
    img.style.marginBottom = '5px';

    const title = document.createElement('div');
    title.textContent = item.name || item.title || 'No title';
    title.style.fontSize = '14px';
    title.style.overflow = 'hidden';
    title.style.textOverflow = 'ellipsis';
    title.style.whiteSpace = 'nowrap';

    div.appendChild(img);
    div.appendChild(title);

    div.onclick = () => {
      showDetails({
        ...item,
        media_type: 'tv'
      });
      searchModal.style.display = 'none';
      searchInput.value = '';
      searchResults.innerHTML = '';
    };

    searchResults.appendChild(div);
  });
}

async function fetchGenres() {
  try {
    const res = await fetch(`${BASE_URL}/genre/tv/list?api_key=${API_KEY}`);
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

  let url = `${BASE_URL}/discover/tv?api_key=${API_KEY}&page=${currentPage}`;
  if (genre) url += `&with_genres=${genre}`;
  if (year) url += `&first_air_date_year=${year}`;

  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    const data = await res.json();

    totalPages = data.total_pages;
    movieCache.set(cacheKey, { results: data.results || [], page: currentPage
