const API_KEY = '277256e815b05aae4f56dd5dd45eaa97';
const BASE_URL = 'https://api.themoviedb.org/3';
const IMG_URL = 'https://image.tmdb.org/t/p/original';

let currentItem = null;
let currentPage = 1;
let totalPages = 1;

const latestMoviesList = document.getElementById('latest-movies-list');
const prevBtn = document.getElementById('latest-prev-btn');
const nextBtn = document.getElementById('latest-next-btn');
const pageIndicator = document.getElementById('latest-page-indicator');

async function fetchLatestMovies(page = 1) {
  try {
    // Assuming you saved all pages locally as JSON files (or just page 1 for simplicity)
    const res = await fetch(`/data/latest-movies-page-${page}.json`);
    const movies = await res.json();

    // Manually set currentPage and totalPages if saved in JSON, or hardcode totalPages
    currentPage = page;
    totalPages = 10; // or read from JSON metadata

    displayLatestMovies(movies);
    updatePaginationButtons();
  } catch (error) {
    console.error('Error loading latest movies from JSON:', error);
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
      media_type: 'movie' // Needed for video embed URLs
    });

    latestMoviesList.appendChild(img);
  });
}

function updatePaginationButtons() {
  pageIndicator.textContent = `Page ${currentPage}`;

  prevBtn.disabled = currentPage <= 1;
  nextBtn.disabled = currentPage >= totalPages;
}

function showDetails(item) {
  currentItem = item;

  document.getElementById('modal-title').textContent = item.title || 'No title';
  document.getElementById('modal-description').textContent = item.overview || 'No description.';
  document.getElementById('modal-image').src = item.poster_path ? `${IMG_URL}${item.poster_path}` : '';
  document.getElementById('modal-rating').innerHTML = getStars(item.vote_average || 0);

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

// Event listeners
prevBtn.addEventListener('click', () => {
  if (currentPage > 1) {
    fetchLatestMovies(currentPage - 1);
  }
});

nextBtn.addEventListener('click', () => {
  if (currentPage < totalPages) {
    fetchLatestMovies(currentPage + 1);
  }
});

document.getElementById('modal-close').addEventListener('click', closeModal);
document.getElementById('modal').addEventListener('click', e => {
  if (e.target.id === 'modal') closeModal();
});
window.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeModal();
});

// Initial fetch
fetchLatestMovies();
