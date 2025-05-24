const API_KEY = '277256e815b05aae4f56dd5dd45eaa97'; // Replace with your TMDB API key
const BASE_URL = 'https://api.themoviedb.org/3';
const IMG_URL = 'https://image.tmdb.org/t/p/w342';

// Utility: Fetch with cache fallback
async function fetchTrending(type, page = 1) {
  const cacheKey = `trending_${type}_page_${page}`;
  const cached = localStorage.getItem(cacheKey);
  if (cached) {
    console.log(`Loading ${type} from cache`);
    return JSON.parse(cached);
  }

  try {
    const res = await fetch(`${BASE_URL}/trending/${type}/week?api_key=${API_KEY}&page=${page}`);
    const data = await res.json();
    if (data.results) {
      localStorage.setItem(cacheKey, JSON.stringify(data.results));
      return data.results;
    }
    return [];
  } catch (err) {
    console.error(`Failed to fetch ${type}:`, err);
    return [];
  }
}

// Display items in DOM
function displayList(items, containerId) {
  const container = document.getElementById(containerId);
  container.innerHTML = '';

  if (!items.length) {
    container.innerHTML = '<p>No results found.</p>';
    return;
  }

  items.forEach(item => {
    const title = item.title || item.name || 'Untitled';
    const imagePath = item.poster_path ? `${IMG_URL}${item.poster_path}` : 'https://via.placeholder.com/342x513?text=No+Image';
    const div = document.createElement('div');
    div.classList.add('card');
    div.innerHTML = `
      <img loading="lazy" src="${imagePath}" alt="${title}" />
      <h3>${title}</h3>
    `;
    container.appendChild(div);
  });
}

// Initial load
document.addEventListener('DOMContentLoaded', async () => {
  const [movies, tvShows, anime] = await Promise.all([
    fetchTrending('movie'),
    fetchTrending('tv'),
    fetchTrending('tv', 2) // Using TV as a proxy for anime (filter separately if needed)
  ]);

  displayList(movies, 'movies-list');
  displayList(tvShows, 'tvshows-list');
  displayList(anime.filter(show => /anime|japan/i.test(show.origin_country.join(' '))), 'anime-list');
});
