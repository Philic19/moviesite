const API_KEY = 'a1e72fd93ed59f56e6332813b9f8dcae';
const BASE_URL = 'https://api.themoviedb.org/3';

const latestMoviesList = document.getElementById('latest-movies-list');
const prevBtn = document.getElementById('latest-prev-btn');
const nextBtn = document.getElementById('latest-next-btn');
const pageIndicator = document.getElementById('latest-page-indicator');
const modal = document.getElementById('modal');
const modalClose = document.getElementById('modal-close');
const modalImage = document.getElementById('modal-image');
const modalTitle = document.getElementById('modal-title');
const modalRating = document.getElementById('modal-rating');
const modalDescription = document.getElementById('modal-description');
const modalVideo = document.getElementById('modal-video');
const serverSelector = document.getElementById('server');
const serverSelectorContainer = document.querySelector('.server-selector');


let currentPage = 1;
let totalPages = 1; // will be updated from API response

async function fetchLatestMovies(page = 1) {
  try {
    const response = await fetch(`${BASE_URL}/movie/now_playing?api_key=${API_KEY}&language=en-US&page=${page}`);
    const data = await response.json();

    // TMDB /movie/latest endpoint returns a single latest movie, so better use "now_playing" or "popular" for multiple latest movies:
    // const response = await fetch(`${BASE_URL}/movie/now_playing?api_key=${API_KEY}&language=en-US&page=${page}`);

    totalPages = data.total_pages;
    currentPage = data.page;

    displayLatestMovies(data.results || []);
    updatePaginationButtons();
  } catch (error) {
    console.error('Error fetching latest movies:', error);
  }
}

function displayLatestMovies(movies) {
  if (!latestMoviesList) return;

  latestMoviesList.innerHTML = '';

  movies.forEach(movie => {
    const img = document.createElement('img');
    img.src = `https://image.tmdb.org/t/p/w500${movie.poster_path}`;
    img.alt = movie.title;
    img.title = movie.title;
    img.classList.add('movie-poster');

    img.onclick = () => openModalWithMovie(movie);

    latestMoviesList.appendChild(img);
  });
}

function updatePaginationButtons() {
  pageIndicator.textContent = `Page ${currentPage} of ${totalPages}`;
  prevBtn.disabled = currentPage <= 1;
  nextBtn.disabled = currentPage >= totalPages;
}

function openModalWithMovie(movie) {
  modal.style.display = 'flex';

  modalImage.src = movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : '';
  modalTitle.textContent = movie.title || 'No title';
  modalDescription.textContent = movie.overview || 'No description available.';
  
  // Show star rating (out of 5 stars)
  modalRating.innerHTML = '';
  const ratingOutOfFive = Math.round(movie.vote_average / 2);
  for (let i = 0; i < 5; i++) {
    const star = document.createElement('span');
    star.className = 'fa fa-star' + (i < ratingOutOfFive ? ' checked' : '');
    modalRating.appendChild(star);
  }
  
  // Hide video and server selector (unless you want to handle streaming here)
  modalVideo.style.display = 'none';
  serverSelectorContainer.style.display = 'none';
}

// Close modal handler
modalClose.onclick = () => {
  modal.style.display = 'none';
};

// Close modal on outside click
window.onclick = (event) => {
  if (event.target === modal) {
    modal.style.display = 'none';
  }
};

// Button event listeners
if (prevBtn && nextBtn) {
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
}

// Initial fetch on page load if container exists
if (latestMoviesList) {
  fetchLatestMovies();
}
