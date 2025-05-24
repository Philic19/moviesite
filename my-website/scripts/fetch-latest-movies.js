const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');

const API_KEY = process.env.TMDB_API_KEY;
const BASE_URL = 'https://api.themoviedb.org/3';

async function fetchMovies() {
  const url = `${BASE_URL}/movie/now_playing?api_key=${API_KEY}&language=en-US&page=1`;
  const res = await fetch(url);
  const data = await res.json();

  const filePath = path.join(__dirname, '../data/latest.json');
  fs.writeFileSync(filePath, JSON.stringify(data.results, null, 2));
  console.log(`Fetched ${data.results.length} movies to latest.json`);
}

fetchMovies();
