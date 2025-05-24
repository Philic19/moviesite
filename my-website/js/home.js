const BASE_URL = 'https://api.themoviedb.org/3';
const IMG_URL = 'https://image.tmdb.org/t/p/w154';

let currentItems = {
  movies: [],
  tvShows: [],
  anime: []
};
let currentItem = null;
const ITEMS_PER_BATCH = 20;
let renderedIndexes = {
  movies: 0,
  tvShows: 0,
  anime: 0,
};

async function fetchLocalJSON(path) {
  try {
    const res = await fetch(path);
    return await res.json();
  } catch (error) {
    console.error(`Error loading ${path}:`, error);
    return [];
  }
}

function displayBanner(item) {
  const banner = document.getElementById('banner');
  if (!banner) return;
  banner.style.backgroundImage = `url(${IMG_URL}${item.backdrop_path})`;
  const title = document.getElementById('banner-title');
  if (title) title.textContent = item.title || item.name;
}

function displayListBatch(items, containerId, startIndex) {
  const container = document.getElementById(containerId);
  if (!container) return;
  const endIndex = Math.min(startIndex + ITEMS_PER_BATCH, items.length);
  for (let i = startIndex; i < endIndex; i++) {
    const item = items[i];
    if (!item.poster_path) continue;
    const img = document.createElement('img');
    img.src = `${IMG_URL}${item.poster_path}`;
    img.alt = item.title || item.name || 'Media Thumbnail';
    img.loading = 'lazy';
    img.onclick = () => showDetails(item);
    container.appendChild(img);
  }
  return endIndex;
}

function setupLazyLoading(itemsKey, containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;
  let sentinel = document.createElement('div');
  sentinel.style.height = '1px';
  container.appendChild(sentinel);
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const items = currentItems[itemsKey];
        if (!items) return;
        const nextIndex = renderedIndexes[itemsKey];
        if (nextIndex >= items.length) {
          observer.disconnect();
          sentinel.remove();
          return;
        }
        const newIndex = displayListBatch(items, containerId, nextIndex);
        renderedIndexes[itemsKey] = newIndex;
      }
    });
  }, {
    root: container,
    rootMargin: '0px',
    threshold: 1.0
  });
  observer.observe(sentinel);
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

function setupLazyLoadingFiltered(items, itemsKey, containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;
  let sentinel = document.createElement('div');
  sentinel.style.height = '1px';
  container.appendChild(sentinel);
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const nextIndex = renderedIndexes[itemsKey];
        if (nextIndex >= items.length) {
          observer.disconnect();
          sentinel.remove();
          return;
        }
        const newIndex = displayListBatch(items, containerId, nextIndex);
        renderedIndexes[itemsKey] = newIndex;
      }
    });
  }, {
    root: container,
    rootMargin: '0px',
    threshold: 1.0
  });
  observer.observe(sentinel);
}

let currentBannerIndex = 0;
function displayBannerFromList(index) {
  const movie = currentItems.movies[index];
  if (!movie) return;
  displayBanner(movie);
  document.getElementById('banner').onclick = () => showDetails(movie);
}

async function init() {
  const movies = await fetchLocalJSON('/data/movies.json');
  const tvShows = await fetchLocalJSON('/data/tvShows.json');
  const anime = await fetchLocalJSON('/data/anime.json');
  const genresData = await fetchLocalJSON('/data/genres.json');
  const { movieGenres, tvGenres } = genresData;

  currentItems.movies = movies;
  currentItems.tvShows = tvShows;
  currentItems.anime = anime;

  displayBanner(movies[Math.floor(Math.random() * movies.length)]);

  renderedIndexes = { movies: 0, tvShows: 0, anime: 0 };
  ['movies-list', 'tvshows-list', 'anime-list'].forEach(id => {
    const c = document.getElementById(id);
    if (c) c.innerHTML = '';
  });

  renderedIndexes.movies = displayListBatch(movies, 'movies-list', 0);
  renderedIndexes.tvShows = displayListBatch(tvShows, 'tvshows-list', 0);
  renderedIndexes.anime = displayListBatch(anime, 'anime-list', 0);

  setupLazyLoading('movies', 'movies-list');
  setupLazyLoading('tvShows', 'tvshows-list');
  setupLazyLoading('anime', 'anime-list');

  const genreMap = new Map();
  [...movieGenres, ...tvGenres].forEach(g => genreMap.set(g.id, g.name));

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
      ['movies', 'tvShows', 'anime'].forEach(key => {
        const containerId = key === 'movies' ? 'movies-list' : key === 'tvShows' ? 'tvshows-list' : 'anime-list';
        const filteredList = filterByGenre(currentItems[key]);
        renderedIndexes[key] = 0;
        const container = document.getElementById(containerId);
        if (container) container.innerHTML = '';
        renderedIndexes[key] = displayListBatch(filteredList, containerId, 0);
        setupLazyLoadingFiltered(filteredList, key, containerId);
      });
    });
  }
}

document.getElementById('banner-prev')?.addEventListener('click', (e) => {
  e.stopPropagation();
  currentBannerIndex = (currentBannerIndex - 1 + currentItems.movies.length) % currentItems.movies.length;
  displayBannerFromList(currentBannerIndex);
});

document.getElementById('banner-next')?.addEventListener('click', (e) => {
  e.stopPropagation();
  currentBannerIndex = (currentBannerIndex + 1) % currentItems.movies.length;
  displayBannerFromList(currentBannerIndex);
});

window.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    closeModal();
    document.getElementById('about-modal')?.style.display === 'flex' && (document.getElementById('about-modal').style.display = 'none');
  }
});

document.getElementById('modal')?.addEventListener('click', e => {
  if (e.target.id === 'modal') closeModal();
});

document.getElementById('theme-toggle')?.addEventListener('click', () => {
  document.body.classList.toggle('light-mode');
});

document.getElementById('search-input')?.addEventListener('input', () => {
  clearTimeout(debounceTimeout);
  debounceTimeout = setTimeout(() => {
    // You can implement local search if your JSON includes names/titles
  }, 400);
});

let debounceTimeout;

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

async function startApp() {
  await init();
  currentBannerIndex = Math.floor(Math.random() * currentItems.movies.length);
  displayBannerFromList(currentBannerIndex);
}
startApp();
