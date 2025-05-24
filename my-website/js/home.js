// TMDB API key for authenticating requests to The Movie Database API
const API_KEY = '277256e815b05aae4f56dd5dd45eaa97';
const BASE_URL = 'https://api.themoviedb.org/3'; // Base URL for TMDB API endpoints
const IMG_URL = 'https://image.tmdb.org/t/p/original'; // Base URL for loading images like posters and backdrops from TMDB
let currentItems = {
  movies: [],
  tvShows: [],
  anime: []
};
// Object to store fetched items grouped by type for easy access and filtering

/**
 * Fetch trending movies or TV shows by type ('movie' or 'tv') and page number.
 * Uses the TMDB trending endpoint for the current week.
 */
async function fetchTrending(type, page = 1) {
  try {
    const res = await fetch(`${BASE_URL}/trending/${type}/week?api_key=${API_KEY}&page=${page}`);
    const data = await res.json();
    return data.results;
  } catch (error) {
    console.error("Error Fetching Trending:", error);
    return [];
  }
}

/**
 * Fetch trending TV shows and filter for anime.
* Fetches up to 3 pages and concatenates all filtered anime results.
 */
async function fetchTrendingAnime() {
  let allResults = [];
  try {
    for (let page = 1; page <= 3; page++) {
      const res = await fetch(`${BASE_URL}/trending/tv/week?api_key=${API_KEY}&page=${page}`);
      const data = await res.json();
      const filtered = data.results.filter(item =>
        item.original_language === 'ja' && item.genre_ids.includes(16)
      );
      allResults = allResults.concat(filtered);
    }
  } catch (error) {
    console.error("Error Fetching Anime:", error);
  }
  return allResults;
}

/**
 * Fetch list of genres for a given type ('movie' or 'tv').
 */
async function fetchGenres(type = 'movie') {
  try {
    const res = await fetch(`${BASE_URL}/genre/${type}/list?api_key=${API_KEY}`);
    const data = await res.json();
    return data.genres;
  } catch (error) {
    console.error("Error fetching genres:", error);
    return [];
  }
}

/**
 * Sets the banner background and title to highlight a featured movie or TV show.
 */
function displayBanner(item) {
  document.getElementById('banner').style.backgroundImage = `url(${IMG_URL}${item.backdrop_path})`;
  document.getElementById('banner-title').textContent = item.title || item.name;
}

/**
 * Displays a list of movie/TV/anime thumbnails in a container element.
 * Each thumbnail is clickable to show detailed info in a modal.
 */
function displayList(items, containerId) {
  const container = document.getElementById(containerId);
  container.innerHTML = '';
  items.forEach(item => {
    const img = document.createElement('img');
    img.src = `${IMG_URL}${item.poster_path}`;
    img.alt = item.title || item.name || 'Media Thumbnail';
    img.onclick = () => showDetails(item);
    img.loading = 'lazy';
    container.appendChild(img);
  });
}

//Rating display
function getStars(vote) {
  const full = Math.floor(vote / 2);
  const half = vote % 2 >= 1 ? 1 : 0;
  return '★'.repeat(full) + (half ? '⯨' : '') + '☆'.repeat(5 - full - half);
}

//show details of selected movie in a modal form
function showDetails(item) {
  currentItem = item;
  localStorage.setItem('lastItem', JSON.stringify(item));
  document.getElementById('modal-title').textContent = item.title || item.name;
  document.getElementById('modal-description').textContent = item.overview;
  document.getElementById('modal-image').src = `${IMG_URL}${item.poster_path}`;
  document.getElementById('modal-rating').innerHTML = getStars(item.vote_average);
  changeServer();
  document.getElementById('modal').style.display = 'flex';
}

//load video from selected server
function changeServer() {
  const server = document.getElementById('server').value;
  const type = currentItem.media_type === "movie" ? "movie" : "tv";
  let embedURL = "";

  //change server
  if (server === "vidsrc.cc") {
    embedURL = `https://vidsrc.cc/v2/embed/${type}/${currentItem.id}`;
  } else if (server === "vidsrc.me") {
    embedURL = `https://vidsrc.net/embed/${type}/?tmdb=${currentItem.id}`;
  } else if (server === "player.videasy.net") {
    embedURL = `https://player.videasy.net/${type}/${currentItem.id}`;
  }

  document.getElementById('modal-video').src = embedURL;
}

//close and clear video to stop playback
function closeModal() {
  document.getElementById('modal').style.display = 'none';
  document.getElementById('modal-video').src = '';
}

//open search bar
function openSearchModal() {
  document.getElementById('search-modal').style.display = 'flex';
  document.getElementById('search-input').focus();
}

//close search bar
function closeSearchModal() {
  document.getElementById('search-modal').style.display = 'none';
  document.getElementById('search-results').innerHTML = '';
}

//show result on search bar and clickable
async function searchTMDB() {
  const query = document.getElementById('search-input').value.trim();
  if (!query) {
    document.getElementById('search-results').innerHTML = '';
    return;
  }

  try {
    const res = await fetch(`${BASE_URL}/search/multi?api_key=${API_KEY}&query=${query}`);
    const data = await res.json();

    const container = document.getElementById('search-results');
    container.innerHTML = '';
    data.results.forEach(item => {
      if (!item.poster_path) return;
      const img = document.createElement('img');
      img.src = `${IMG_URL}${item.poster_path}`;
      img.alt = item.title || item.name || 'Media Thumbnail';
      img.loading = 'lazy';
      img.onclick = () => {
        closeSearchModal();
        showDetails(item);
      };
      container.appendChild(img);
    });
  } catch (error) {
    console.error("Search failed:", error);
  }
}

//genre selection
function populateGenreFilter(selectId, genres) {
  const select = document.getElementById(selectId);
  if (!select) return;
  genres.forEach(genre => {
    const option = document.createElement('option');
    option.value = genre.id;
    option.textContent = genre.name;
    select.appendChild(option);
  });
}

// filter genre selection on selected genre
function addGenreFilterListener(selectId, itemsKey, containerId) {
  const select = document.getElementById(selectId);
  if (!select) return;
  select.addEventListener('change', function () {
    const selectedGenre = parseInt(this.value);
    if (isNaN(selectedGenre)) {
      displayList(currentItems[itemsKey], containerId);
    } else {
      const filtered = currentItems[itemsKey].filter(item =>
        item.genre_ids.includes(selectedGenre)
      );
      displayList(filtered, containerId);
    }
  });
}

//initialize by fetch movies
async function init() {
  const movies = await fetchTrending('movie');
  const tvShows = await fetchTrending('tv');
  const anime = await fetchTrendingAnime();

  currentItems.movies = movies;
  currentItems.tvShows = tvShows;
  currentItems.anime = anime;

  displayBanner(movies[Math.floor(Math.random() * movies.length)]);
  displayList(movies, 'movies-list');
  displayList(tvShows, 'tvshows-list');
  displayList(anime, 'anime-list');

  const [movieGenres, tvGenres] = await Promise.all([
    fetchGenres('movie'),
    fetchGenres('tv')
  ]);

  // Merge and deduplicate genres
  const genreMap = new Map();
  [...movieGenres, ...tvGenres].forEach(g => {
    genreMap.set(g.id, g.name);
  });

  // Populate unified genre filter
  const select = document.getElementById('genre-filter');
  if (select) {
    // Add "All" option
    const allOption = document.createElement('option');
    allOption.value = 'all';
    allOption.textContent = 'All Genres';
    select.appendChild(allOption);

    for (const [id, name] of genreMap.entries()) {
      const option = document.createElement('option');
      option.value = id;
      option.textContent = name;
      select.appendChild(option);
    }

    // Add event listener
    select.addEventListener('change', () => {
      const selected = select.value;
      const genreId = selected === 'all' ? null : parseInt(selected);

      const filterByGenre = (list) => {
        if (!genreId) return list;
        return list.filter(item => item.genre_ids.includes(genreId));
      };

      displayList(filterByGenre(currentItems.movies), 'movies-list');
      displayList(filterByGenre(currentItems.tvShows), 'tvshows-list');
      displayList(filterByGenre(currentItems.anime), 'anime-list');
    });
  }
}

// About Us modal elements
const aboutModal = document.getElementById('about-modal');
const openAboutBtn = document.getElementById('open-about-btn');
const closeAboutBtn = document.getElementById('close-about-btn');

if (openAboutBtn && aboutModal && closeAboutBtn) {
  openAboutBtn.addEventListener('click', (e) => {
    e.preventDefault();
    aboutModal.style.display = 'flex';
  });

  closeAboutBtn.addEventListener('click', () => {
    aboutModal.style.display = 'none';
  });

  aboutModal.addEventListener('click', (e) => {
    if (e.target === aboutModal) {
      aboutModal.style.display = 'none';
    }
  });

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && aboutModal.style.display === 'flex') {
      aboutModal.style.display = 'none';
    }
  });
}

window.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeModal();
});

document.getElementById('modal').addEventListener('click', e => {
  if (e.target.id === 'modal') closeModal();
});

let debounceTimeout;
document.getElementById('search-input').addEventListener('input', () => {
  clearTimeout(debounceTimeout);
  debounceTimeout = setTimeout(searchTMDB, 400);
});

document.getElementById('theme-toggle').addEventListener('click', () => {
  document.body.classList.toggle('light-mode');
});

function openDisclaimerModal() {
  document.getElementById('disclaimer-modal').style.display = 'flex';
}

function closeDisclaimerModal() {
  document.getElementById('disclaimer-modal').style.display = 'none';
}

window.addEventListener('click', function(e) {
  const modal = document.getElementById('disclaimer-modal');
  if (e.target === modal) {
    modal.style.display = 'none';
  }
});

let currentBannerIndex = 0;

function displayBannerFromList(index) {
  const movie = currentItems.movies[index];
  if (!movie) return;
  displayBanner(movie);

  document.getElementById('banner').onclick = () => {
    showDetails(movie);
  };
}

document.getElementById('banner-prev').addEventListener('click', (e) => {
  e.stopPropagation();
  currentBannerIndex = (currentBannerIndex - 1 + currentItems.movies.length) % currentItems.movies.length;
  displayBannerFromList(currentBannerIndex);
});

document.getElementById('banner-next').addEventListener('click', (e) => {
  e.stopPropagation();
  currentBannerIndex = (currentBannerIndex + 1) % currentItems.movies.length;
  displayBannerFromList(currentBannerIndex);
});

async function startApp() {
  await init();
  currentBannerIndex = Math.floor(Math.random() * currentItems.movies.length);
  displayBannerFromList(currentBannerIndex);
}

startApp();
