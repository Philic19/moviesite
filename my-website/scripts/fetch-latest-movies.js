// fetch-latest.js
const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');

const API_KEY = 'your_tmdb_api_key'; // Use your actual TMDB key here
const URL = `https://api.themoviedb.org/3/movie/now_playing?api_key=${API_KEY}&language=en-US&page=1`;

(async () => {
  try {
    const res = await fetch(URL);
    const data = await res.json();
    const outputPath = path.join(__dirname, 'data', 'latest.json');
    fs.writeFileSync(outputPath, JSON.stringify(data, null, 2));
    console.log('✅ latest.json created');
  } catch (error) {
    console.error('❌ Failed to fetch or save latest movies:', error);
    process.exit(1);
  }
})();
