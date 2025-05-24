const API_KEY = '277256e815b05aae4f56dd5dd45eaa97';
const BASE_URL = 'https://api.themoviedb.org/3';
const IMG_URL = 'https://image.tmdb.org/t/p/original';

let currentItem = null;
let currentPage = 1;
let totalPages = Infinity; // unknown at start
let isLoading = false;

const animeList = document.getElementById('anime-list');       // Your anime container
const pageIndicator = document.getElementById('anime-page-indicator');

const yearSelect = document.getElementById('year-select');

// Cache for fetched anime by key (year-page)
const animeCache = new Map();

// Fetch next page of anime TV shows (Japanese, animation genre)
async function fetchNextPage() {
  if (isLoading) return;
  if (currentPage > totalPages || currentPage > 100) {
    pageIndicator.textContent = 'No more results.';
    return;
  }

  isLoading = true;
  pageIndicator.textContent = `Loading page ${currentPage}...`;

  const year = yearSelect.value;
  const cacheKey = `${year}-${currentPage}`;

  if (animeCache.has(cacheKey)) {
    const cached = animeCache.get(cacheKey);
    appendAnime(cached.results);
    totalPages = cached.totalPages;
    currentPage++;
    isLoading = false;
    pageIndicator.textContent = `Page ${currentPage - 1}`;
    return;
  }

  // TMDB Discover TV endpoint filtered for anime:
  // with_original_language=ja, with_genres=16 (Animation), sorted by popularity desc
  let url = `${BASE_URL}/discover/tv?api_key=${API_KEY}&with_original_language=ja&with_genres=16&sort_by=popularity.desc&page=${currentPage}`;
  if (year) url += `&first_air_date_year=${year}`;  // Use first_air_date_year for TV shows filtering

  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    const data = await res.json();

    totalPages = data.total_pages;
    animeCache.set(cacheKey, { results: data.results || [], totalPages });

    appendAnime(data.results || []);

    currentPage++;
    pageIndicator.textContent = `Page ${currentPage - 1}`;
  } catch (error) {
    console.error("Error fetching anime:", error);
    pageIndicator.textContent = 'Error loading data. Please try again.';
  } finally {
    isLoading = false;
  }
}

function appendAnime(animeShows) {
  if (!animeShows.length) {
    if (currentPage === 1) {
      animeList.innerHTML = '<p>No anime found.</p>';
    }
    return;
  }

  const fragment = document.createDocumentFragment();

  animeShows.forEach(show => {
    const img = document.createElement('img');
    img.src = show.poster_path ? `https://image.tmdb.org/t/p/w342${show.poster_path}` : '';
    img.alt = show.name || 'No title';
    img.title = show.name || '';
    img.loading = 'lazy';
    img.style.cursor = 'pointer';
    img.style.minHeight = '250px';

    img.onclick = () => showDetails({
      ...show,
      media_type: 'tv'
    });

    fragment.appendChild(img);
  });

  animeList.appendChild(fragment);
}

// Reset and reload anime list on year filter change
function resetAnime() {
  animeList.innerHTML = '';
  currentPage = 1;
  totalPages = Infinity;
  animeCache.clear();
  fetchNextPage();
}

// Show details modal (reuse your existing modal code)
function showDetails(item) {
  currentItem = item;

  document.getElementById('modal-title').textContent = item.name || 'No title';
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

// Change video server iframe src (unchanged)
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

// Debounced infinite scroll
let scrollTimeout = null;
window.addEventListener('scroll', () => {
  if (scrollTimeout) return;
  scrollTimeout = setTimeout(() => {
    scrollTimeout = null;
    const scrollThreshold = 300; // px from bottom
    if ((window.innerHeight + window.scrollY) >= (document.body.offsetHeight - scrollThreshold)) {
      fetchNextPage();
    }
  }, 200);
});

// Filter change handler
yearSelect.addEventListener('change', resetAnime);

// Modal close handlers
document.getElementById('modal-close').addEventListener('click', closeModal);
document.getElementById('modal').addEventListener('click', e => {
  if (e.target.id === 'modal') closeModal();
});
window.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeModal();
});

// Initialize year dropdown and load first page
function populateYearDropdown() {
  const currentYear = new Date().getFullYear();
  for (let year = currentYear; year >= currentYear - 30; year--) {
    const option = document.createElement('option');
    option.value = year;
    option.textContent = year;
    yearSelect.appendChild(option);
  }
}

populateYearDropdown();
resetAnime();


/* ========== SEARCH BAR FUNCTIONALITY ========== */

const searchModal = document.getElementById('search-modal');
const searchInputNavbar = document.getElementById('search-input-navbar');
const searchInput = document.getElementById('search-input');
const searchResults = document.getElementById('search-results');
const searchCloseBtn = document.getElementById('search-close-btn');

// Open search modal when navbar search bar clicked
searchInputNavbar.addEventListener('click', () => {
  searchModal.style.display = 'block';
  searchInputNavbar.blur(); // remove focus styling
  searchInput.value = '';
  searchResults.innerHTML = '';
  searchInput.focus();
});

// Close search modal
searchCloseBtn.addEventListener('click', () => {
  searchModal.style.display = 'none';
  searchResults.innerHTML = '';
});

// Close search modal on Escape key (add to existing handler)
window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && searchModal.style.display === 'block') {
    searchModal.style.display = 'none';
    searchResults.innerHTML = '';
  }
});

// Debounce helper for search input to avoid too many API calls
function debounce(func, delay = 300) {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), delay);
  };
}

// Search TMDB API
async function performSearch(query) {
  if (!query) {
    searchResults.innerHTML = '';
    return;
  }
  
  const url = `${BASE_URL}/search/multi?api_key=${API_KEY}&query=${encodeURIComponent(query)}&include_adult=false&page=1`;
  
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    const data = await res.json();

    displaySearchResults(data.results || []);
  } catch (err) {
    console.error('Search error:', err);
    searchResults.innerHTML = '<p style="color: white;">Error searching, please try again.</p>';
  }
}

// Display results in search modal
function displaySearchResults(results) {
  if (!results.length) {
    searchResults.innerHTML = '<p style="color: white;">No results found.</p>';
    return;
  }

  searchResults.innerHTML = '';
  const fragment = document.createDocumentFragment();

  results.forEach(item => {
    // Only show movies and TV shows
    if (!['movie', 'tv'].includes(item.media_type)) return;

    const div = document.createElement('div');
    div.style.cursor = 'pointer';
    div.style.width = '150px';
    div.style.color = 'white';
    div.style.textAlign = 'center';

    const img = document.createElement('img');
    img.src = item.poster_path ? `https://image.tmdb.org/t/p/w185${item.poster_path}` : '';
    img.alt = item.name || item.title || 'No title';
    img.style.width = '100%';
    img.style.borderRadius = '8px';

    const title = document.createElement('p');
    title.textContent = item.name || item.title || 'No title';
    title.style.fontSize = '14px';
    title.style.marginTop = '5px';
    title.style.whiteSpace = 'nowrap';
    title.style.overflow = 'hidden';
    title.style.textOverflow = 'ellipsis';

    div.appendChild(img);
    div.appendChild(title);

    div.onclick = () => {
      showDetails({
        ...item,
        name: item.name || item.title,
        media_type: item.media_type || 'movie',
      });
      searchModal.style.display = 'none';
    };

    fragment.appendChild(div);
  });

  searchResults.appendChild(fragment);
}

// Listen to input changes with debounce
searchInput.addEventListener('input', debounce((e) => {
  performSearch(e.target.value.trim());
}, 400));
