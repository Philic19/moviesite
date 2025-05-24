const fetch = require('node-fetch');
const fs = require('fs');

const API_KEY = process.env.TMDB_API_KEY;
const URL = `https://api.themoviedb.org/3/movie/now_playing?api_key=${API_KEY}&language=en-US&page=1`;

async function fetchMovies() {
  const res = await fetch(URL);
  if (!res.ok) throw new Error('Failed to fetch movies');
  const data = await res.json();
  return data.results;
}

async function main() {
  try {
    const movies = await fetchMovies();
    fs.writeFileSync('./data/latest-movies.json', JSON.stringify(movies, null, 2));
    console.log('Movies saved!');
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

main();
