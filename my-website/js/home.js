// TMDB API key for authenticating requests to The Movie Database API
const API_KEY = '277256e815b05aae4f56dd5dd45eaa97';
const BASE_URL = 'https://api.themoviedb.org/3';
const IMG_URL = 'https://image.tmdb.org/t/p/w185';

let currentItems = {
  movies: [],
  tvShows: [],
  anime: []
};

// Cache fetch utility with TTL
async function cacheFetch(url, cacheKey, ttlMinutes = 30) {
  const cached = localStorage.getItem(cacheKey);
  if (cached) {
    const { data, timestamp } = JSON.parse(cached);
    if (Date.now() - timestamp < ttlMinutes * 60 * 1000) {
      return data;
    }
  }
  const res = await fetch(url);
  const data = await res.json();
  localStorage.setItem(cacheKey, JSON.stringify({ data, timestamp: Date.now() }));
  return data;
}

async function fetchTrending(type, page = 1) {
  try {
    return await cacheFetch(`${BASE_URL}/trending/${type}/week?api_key=${API_KEY}&page=${page}`, `trending_${type}_page${page}`);
  } catch (error) {
    console.error("Error Fetching Trending:", error);
    return [];
  }
}

async function fetchTrendingAnime(page = 1) {
  try {
    const data = await cacheFetch(`${BASE_URL}/trending/tv/week?api_key=${API_KEY}&page=${page}`, `anime_page${page}`);
    return data.results.filter(item => item.original_language === 'ja' && item.genre_ids.includes(16));
  } catch (error) {
    console.error("Error Fetching Anime:", error);
    return [];
  }
}

async function fetchGenres(type = 'movie') {
  try {
    return await cacheFetch(`${BASE_URL}/genre/${type}/list?api_key=${API_KEY}`, `genres_${type}`);
  } catch (error) {
    console.error("Error fetching genres:", error);
    return [];
  }
}

function displayBanner(item) {
  document.getElementById('banner').style.backgroundImage = `url(${IMG_URL}${item.backdrop_path})`;
  document.getElementById('banner-title').textContent = item.title || item.name;
}

function displayList(items, containerId) {
  const container = document.getElementById(containerId);
  container.innerHTML = '';
  items.forEach(item => {
    const img = document.createElement('img');
    img.src = `${IMG_URL}${item.poster_path}`;
    img.alt = item.title || item.name || 'Media Thumbnail';
    img.loading = 'lazy';
    img.srcset = `${IMG_URL.replace("w185", "w92")}${item.poster_path} 92w, ${IMG_URL.replace("w185", "w154")}${item.poster_path} 154w, ${IMG_URL}${item.poster_path} 185w`;
    img.sizes = "(max-width: 600px) 92px, (max-width: 900px) 154px, 185px";
    img.onclick = () => showDetails(item);
    container.appendChild(img);
  });
}

function getStars(vote) {
  const full = Math.floor(vote / 2);
  const half = vote % 2 >= 1 ? 1 : 0;
  return '★'.repeat(full) + (half ? '⯨' : '') + '☆'.repeat(5 - full - half);
}

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

function changeServer() {
  const server = document.getElementById('server').value;
  const type = currentItem.media_type === "movie" ? "movie" : "tv";
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

function openSearchModal() {
  document.getElementById('search-modal').style.display = 'flex';
  document.getElementById('search-input').focus();
}

function closeSearchModal() {
  document.getElementById('search-modal').style.display = 'none';
  document.getElementById('search-results').innerHTML = '';
}

async function searchTMDB() {
  const query = document.getElementById('search-input').value.trim();
  if (!query) {
    document.getElementById('search-results').innerHTML = '';
    return;
  }

  try {
    const data = await cacheFetch(`${BASE_URL}/search/multi?api_key=${API_KEY}&query=${query}`, `search_${query}`, 10);
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

async function init() {
  currentItems.movies = await fetchTrending('movie');
  currentItems.tvShows = await fetchTrending('tv');
  currentItems.anime = await fetchTrendingAnime();

  displayBanner(currentItems.movies[Math.floor(Math.random() * currentItems.movies.length)]);
  displayList(currentItems.movies, 'movies-list');

  const [movieGenres, tvGenres] = await Promise.all([
    fetchGenres('movie'),
    fetchGenres('tv')
  ]);

  const genreMap = new Map();
  [...movieGenres, ...tvGenres].forEach(g => {
    genreMap.set(g.id, g.name);
  });

  const select = document.getElementById('genre-filter');
  if (select) {
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

window.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeModal();
});

document.getElementById('modal').addEventListener('click', e => {
  if (e.target.id === 'modal') closeModal();
});

document.getElementById('search-input').addEventListener('input', () => {
  clearTimeout(debounceTimeout);
  debounceTimeout = setTimeout(searchTMDB, 400);
});

document.getElementById('theme-toggle').addEventListener('click', () => {
  document.body.classList.toggle('light-mode');
});

async function startApp() {
  await init();
  currentBannerIndex = Math.floor(Math.random() * currentItems.movies.length);
  displayBannerFromList(currentBannerIndex);

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        if (entry.target.id === 'tvshows-section') {
          displayList(currentItems.tvShows, 'tvshows-list');
        } else if (entry.target.id === 'anime-section') {
          displayList(currentItems.anime, 'anime-list');
        }
        observer.unobserve(entry.target);
      }
    });
  });
  observer.observe(document.getElementById('tvshows-section'));
  observer.observe(document.getElementById('anime-section'));
}

startApp();
