const API_KEY = '277256e815b05aae4f56dd5dd45eaa97';
const BASE_URL = 'https://api.themoviedb.org/3';
const IMG_URL = 'https://image.tmdb.org/t/p/w342';
const ANIME_GENRE_ID = 16;

let currentPage = 1;
let totalPages = Infinity;
let isLoading = false;

const animeList = document.getElementById('anime-list');
const genreSelect = document.getElementById('genre-select');
const yearSelect = document.getElementById('year-select');
const pageIndicator = document.getElementById('anime-page-indicator');
const loader = document.getElementById('loader');

function createAnimeCard(show) {
  const card = document.createElement('div');
  card.classList.add('card');

  card.innerHTML = `
    <img src="${show.poster_path ? IMG_URL + show.poster_path : 'https://via.placeholder.com/342x513?text=No+Image'}" alt="${show.name}">
    <h4>${show.name}</h4>
    <p>${show.first_air_date ? show.first_air_date.split('-')[0] : 'N/A'}</p>
  `;

  card.addEventListener('click', () => {
    openModal(show);
  });

  return card;
}

function openModal(show) {
  const modal = document.getElementById('modal');
  const modalImage = document.getElementById('modal-image');
  const modalTitle = document.getElementById('modal-title');
  const modalDescription = document.getElementById('modal-description');
  const modalVideo = document.getElementById('modal-video');

  modalImage.src = show.poster_path ? IMG_URL + show.poster_path : '';
  modalTitle.textContent = show.name;
  modalDescription.textContent = show.overview || 'No description available';
  modalVideo.src = `https://vidsrc.to/embed/tv/${show.id}`;

  modal.style.display
