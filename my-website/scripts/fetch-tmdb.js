const fs = require('fs');
const fetch = require('node-fetch');

const API_KEY = process.env.TMDB_API_KEY;
const BASE_URL = 'https://api.themoviedb.org/3';

async function fetchData(url, filename) {
  const res = await fetch(`${url}&api_key=${API_KEY}`);
  const data = await res.json();
  fs.writeFileSync(`public/data/${filename}`, JSON.stringify(data, null, 2));
}

// Fetch trending movies, TV shows, and anime
async function main() {
  await fetchData(`${BASE_URL}/trending/movie/week?language=en-US`, 'trending-movies.json');
  await fetchData(`${BASE_URL}/trending/tv/week?language=en-US`, 'trending-tv.json');
  await fetchData(`${BASE_URL}/discover/tv?with_original_language=ja&with_genres=16&sort_by=popularity.desc`, 'trending-anime.json');
}

main();
