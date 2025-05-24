const API_KEY = '277256e815b05aae4f56dd5dd45eaa97';
const BASE_URL = 'https://api.themoviedb.org/3';
const IMG_URL = 'https://image.tmdb.org/t/p/w342';

let currentPage = 1;
let totalPages = Infinity;
let isLoading = false;

const animeList = document.getElementById('anime-list');
const genreSelect = document.getElementById('genre-select');
const yearSelect = document.getElementById('year-select');
const pageIndicator = document.getElementById('anime-page-indicator');

// Populate genre dropdown
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

// Populate year dropdown
function populateYearDropdown() {
  const currentYear = new Date().getFullYear();
  for (let y = currentYear; y >= currentYear - 30; y--) {
    const option = document.createElement('option');
    option.value = y;
    option.textContent = y;
    yearSelect.appendChild(option);
  }
}

// Fetch and render anime
async function fetchAnime() {
  if (isLoading || currentPage > totalPages) return;
  isLoading = true;
  pageIndicator.textContent = `Loading page ${currentPage}...`;

  const selectedGenre = genreSelect.value;
  const selectedYear = yearSelect.value;

  let url = `${BASE_URL}/discover/tv?api_key=${API_KEY}&with_genres=16&page=${currentPage}&sort_by=popularity.desc`;

  if (selectedGenre) {
    url += `&with_genres=${selectedGenre}`;
  }
  if (selectedYear) {
    url += `&first_air_date_year=${selectedYear}`;
  }

  try {
    const res = await fetch(url);
    const data = await res.json();
    totalPages = data.total_pages;

    renderAnime(data.results);
    pageIndicator.textContent = `Page ${currentPage}`;
    currentPage++;
  } catch (err) {
    console.error('Error fetching anime:', err);
  } finally {
    isLoading = false;
  }
}

// Render anime cards
function renderAnime(animes) {
  animes.forEach(anime => {
    const card = document.createElement('div');
    card.className = 'card';

    const img = document.createElement('img');
    img.src = anime.poster_path ? `${IMG_URL}${anime.poster_path}` : 'https://via.placeholder.com/342x513?text=No+Image';
    img.alt = anime.name;

    const title = document.createElement('h3');
    title.textContent = anime.name;

    card.appendChild(img);
    card.appendChild(title);
    animeList.appendChild(card);
  });
}

// Reset and reload anime list
function reloadAnime() {
  currentPage = 1;
  totalPages = Infinity;
  animeList.innerHTML = '';
  fetchAnime();
}

// Event listeners for filters
genreSelect.addEventListener('change', reloadAnime);
yearSelect.addEventListener('change', reloadAnime);

// Infinite Scroll
window.addEventListener('scroll', () => {
  if (
    window.innerHeight + window.scrollY >= document.body.offsetHeight - 100 &&
    !isLoading
  ) {
    fetchAnime();
  }
});

// Initial setup
fetchGenres();
populateYearDropdown();
fetchAnime();
