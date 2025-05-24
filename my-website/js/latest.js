const API_KEY = 'a1e72fd93ed59f56e6332813b9f8dcae'; // replace with your TMDB API key
const BASE_URL = 'https://api.themoviedb.org/3';

const latestContainer = document.getElementById('latest-movies');

async function fetchLatestMovies() {
  try {
    const response = await fetch(`${BASE_URL}/movie/now_playing?api_key=${API_KEY}&language=en-US&page=1`);
    const data = await response.json();

    data.results.forEach(movie => {
      const img = document.createElement('img');
      img.src = `https://image.tmdb.org/t/p/w500${movie.poster_path}`;
      img.alt = movie.title;
      img.title = movie.title;
      img.onclick = () => openModalWithMovie(movie);
      latestContainer.appendChild(img);
    });
  } catch (error) {
    console.error('Error fetching latest movies:', error);
  }
}

function openModalWithMovie(movie) {
  // You can reuse the modal logic from home.js
  alert(`Selected: ${movie.title}`);
}

fetchLatestMovies();
