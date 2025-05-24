// scripts/generateData.js
const fs = require('fs');
const fetch = require('node-fetch');

const API_KEY = process.env.TMDB_API_KEY;
const BASE_URL = 'https://api.themoviedb.org/3';

async function fetchTrending(type, page = 1) {
  const res = await fetch(`${BASE_URL}/trending/${type}/week?api_key=${API_KEY}&page=${page}`);
  const data = await res.json();
  return data.results || [];
}

async function fetchGenres(type) {
  const res = await fetch(`${BASE_URL}/genre/${type}/list?api_key=${API_KEY}`);
  const data = await res.json();
  return data.genres || [];
}

async function main() {
  const movies = await fetchTrending('movie');
  const tvShows = await fetchTrending('tv');
  const animeTV = await fetchTrending('tv');
  const anime = animeTV.filter(item => item.original_language === 'ja' && item.genre_ids.includes(16));

  const movieGenres = await fetchGenres('movie');
  const tvGenres = await fetchGenres('tv');

  fs.writeFileSync('./public/data/movies.json', JSON.stringify(movies));
  fs.writeFileSync('./public/data/tvShows.json', JSON.stringify(tvShows));
  fs.writeFileSync('./public/data/anime.json', JSON.stringify(anime));
  fs.writeFileSync('./public/data/genres.json', JSON.stringify({ movieGenres, tvGenres }));
}

main().catch(console.error);
