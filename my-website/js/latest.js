const API_KEY = 'a1e72fd93ed59f56e6332813b9f8dcae'; // your TMDB API key
const BASE_URL = 'https://api.themoviedb.org/3';

const latestMoviesList = document.getElementById('latest-movies-list'); // container on latest page

async function fetchLatestMovies(page = 1) {
  try {
    const response = await fetch(`${BASE_URL}/movie/now_playing?api_key=${API_KEY}&language=en-US&page=${page}`);
    const data = await response.json();

    displayLatestMovies(data.results || []);
  } catch (error) {
    console.error('Error fetching latest movies:', error);
  }
}

function displayLatestMovies(movies) {
  if (!latestMoviesList) return; // make sure container exists (runs only on latest.html)

  latestMoviesList.innerHTML = ''; // clear previous movies

  movies.forEach(movie => {
    const img = document.createElement('img');
    img.src = `https://image.tmdb.org/t/p/w500${movie.poster_path}`;
    img.alt = movie.title;
    img.title = movie.title;
    img.classList.add('movie-poster');

    // Optional: open modal on click (you can replace this with your modal logic)
    img.onclick = () => openModalWithMovie(movie);

    latestMoviesList.appendChild(img);
  });
}

function openModalWithMovie(movie) {
  // Replace with your modal code; for now, simple alert:
  alert(`Selected movie: ${movie.title}`);
}

// Only call fetchLatestMovies if latestMoviesList exists (i.e., on latest.html)
if (latestMoviesList) {
  fetchLatestMovies();
}
