const API_KEY = '277256e815b05aae4f56dd5dd45eaa97';
const BASE_URL = 'https://api.themoviedb.org/3';
const IMG_URL = 'https://image.tmdb.org/t/p/original';

let currentItem = null;

const latestMoviesList = document.getElementById('latest-movies-list');

async function fetchLatestMovies(page = 1) {
  try {
    const res = await fetch(`${BASE_URL}/movie/now_playing?api_key=${API_KEY}&language=en-US&page=${page}`);
    const data = await res.json();
    displayLatestMovies(data.results || []);
  } catch (error) {
    console.error('Error fetching latest movies:', error);
  }
}

function displayLatestMovies(movies) {
  latestMoviesList.innerHTML = ''; // Clear container

  movies.forEach(movie => {
    const img = document.createElement('img');
    img.src = movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : '';
    img.alt = movie.title || 'No title';
    img.title = movie.title || '';
    img.loading = 'lazy';
    img.style.cursor = 'pointer';

    img.onclick = () => showDetails({
      ...movie,
      media_type: 'movie' // add media_type for video embed URL
    });

    latestMoviesList.appendChild(img);
  });
}

// Modal functions and helpers:

function showDetails(item) {
  currentItem = item;

  document.getElementById('modal-title').textContent = item.title || 'No title';
  document.getElementById('modal-description').textContent = item.overview || 'No description.';
  document.getElementById('modal-image').src = item.poster_path ? `${IMG_URL}${item.poster_path}` : '';
  document.getElementById('modal-rating').innerHTML = getStars(item.vote_average || 0);

  // Default server selector setup
  const serverSelect = document.getElementById('server');
  if (serverSelect) {
    serverSelect.value = 'vidsrc.cc'; // default server
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

// Event listeners for closing modal
document.getElementById('modal-close').addEventListener('click', closeModal);
document.getElementById('modal').addEventListener('click', e => {
  if (e.target.id === 'modal') closeModal();
});
window.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeModal();
});

// Kick off initial fetch
fetchLatestMovies();
