// scripts/fetch-latest-movies.js
const fetch = require('node-fetch');
const fs = require('fs');

const API_KEY = process.env.TMDB_API_KEY;
const BASE_URL = 'https://api.themoviedb.org/3/movie/now_playing';

async function fetchPage(page) {
  const res = await fetch(`${BASE_URL}?api_key=${API_KEY}&language=en-US&page=${page}`);
  if (!res.ok) throw new Error(`Failed to fetch page ${page}`);
  return res.json();
}

(async () => {
  try {
    // Fetch first page to get total_pages
    const firstPageData = await fetchPage(1);
    const totalPages = firstPageData.total_pages;

    // Save first page results
    fs.writeFileSync('data/latest-movies-page-1.json', JSON.stringify(firstPageData.results, null, 2));

    // (Optional) Fetch and save more pages, or just do the first page
    // for (let p = 2; p <= totalPages && p <= 5; p++) {
    //   const pageData = await fetchPage(p);
    //   fs.writeFileSync(`data/latest-movies-page-${p}.json`, JSON.stringify(pageData.results, null, 2));
    // }

    console.log('Fetched and saved latest movies JSON files.');
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
})();
