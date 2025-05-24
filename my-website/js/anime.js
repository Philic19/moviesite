const API_KEY = '277256e815b05aae4f56dd5dd45eaa97';
const BASE_URL = 'https://api.themoviedb.org/3';
const IMG_URL = 'https://image.tmdb.org/t/p/original';

let currentPage = 1;
let totalPages = Infinity;
let isLoading = false;

const animeList = document.getElementById('anime-list');
const pageIndicator = document.getElementById('anime-page-indicator');

// Cache to avoid repeat calls
const animeCache = new Map();

// Filter dropdowns still here but you might want to hide or disable them, or keep year only.

async function fetchNextPage() {
  if (isLoading) return;
  if (currentPage > totalPages || currentPage > 100) return;

  isLoading = true;
  pageIndicator.textContent = `Loading page ${currentPage}...`;

  const year = yearSelect.value; // optional filter by year

  const cacheKey = `ja-16-${year}-${currentPage}`;

  if (animeCache.has(cacheKey)) {
    const cached = animeCache.get(cacheKey);
    appendAnimes(cached.results);
    totalPages = cached.totalPages;
    currentPage++;
    isLoading = false;
    pageIndicator.textContent = `Page ${currentPage - 1}`;
    return;
  }

  let url = `${BASE_URL}/discover/tv?api_key=${API_KEY}&page=${currentPage}&with_original_language=ja&with_genres=16`;
  if (year) url += `&first_air_date_year=${year}`;

  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    const data = await res.json();

    totalPages = data.total_pages;
    animeCache.set(cacheKey, { results: data.results || [], page: currentPage, totalPages });

    appendAnimes(data.results || []);

    currentPage++;
    pageIndicator.textContent = `Page ${currentPage - 1}`;
  } catch (error) {
    console.error("Error fetching animes:", error);
  } finally {
    isLoading = false;
  }
}

function appendAnimes(animes) {
  if (!animes.length) {
    const endMsg = document.createElement('p');
    endMsg.textContent = 'No more anime found.';
    animeList.appendChild(endMsg);
    return;
  }

  animes.forEach(anime => {
    const img = document.createElement('img');
    img.src = anime.poster_path ? `https://image.tmdb.org/t/p/w342${anime.poster_path}` : '';
    img.alt = anime.name || 'No title';
    img.title = anime.name || '';
    img.loading = 'lazy';
    img.style.cursor = 'pointer';
    img.style.minHeight = '250px';

    img.onclick = () => showDetails({
      ...anime,
      media_type: 'tv'
    });

    animeList.appendChild(img);
  });
}

function resetAnimes() {
  animeList.innerHTML = '';
  currentPage = 1;
  totalPages = Infinity;
  animeCache.clear();
  fetchNextPage();
}

// When year filter changes, reload anime list
yearSelect.addEventListener('change', resetAnimes);

// Modal and other code remain the same (showDetails, modal handlers, etc.)

// Initialize year dropdown and load first page
populateYearDropdown();
resetAnimes();
