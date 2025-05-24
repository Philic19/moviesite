const genre = genreSelect.value;
const year = yearSelect.value;
const cacheKey = `${genre}-${year}-${currentPage}`;

if (movieCache.has(cacheKey)) {
  const cached = movieCache.get(cacheKey);
  appendAnime(cached.results);
  totalPages = cached.totalPages;
  currentPage++;
  isLoading = false;
  pageIndicator.textContent = `Page ${currentPage - 1}`;
  return;
}

let url = `${BASE_URL}/discover/tv?api_key=${API_KEY}&page=${currentPage}&with_keywords=${ANIME_KEYWORD}`;
if (genre) url += `&with_genres=${genre}`;
if (year) url += `&first_air_date_year=${year}`;

try {
  const res = await fetch(url);
  const data = await res.json();

  movieCache.set(cacheKey, {
    results: data.results || [],
    totalPages: data.total_pages
  });

  totalPages = data.total_pages;
  appendAnime(data.results || []);
  currentPage++;
  pageIndicator.textContent = `Page ${currentPage - 1}`;
} catch (err) {
  console.error('Error fetching anime:', err);
} finally {
  isLoading = false;
}
}

function appendAnime(shows) {
  if (!shows.length) {
    const msg = document.createElement('p');
    msg.textContent = 'No anime found.';
    animeList.appendChild(msg);
    return;
  }

  shows.forEach(show => {
    const img = document.createElement('img');
    img.src = show.poster_path ? `${IMG_URL}${show.poster_path}` : '';
    img.alt = show.name || 'No title';
    img.title = show.name || '';
    img.loading = 'lazy';
    img.style.cursor = 'pointer';
    img.onclick = () => showDetails({ ...show, media_type: 'tv' });
    animeList.appendChild(img);
  });
}

function resetAnime() {
  animeList.innerHTML = '';
  currentPage = 1;
  totalPages = Infinity;
  movieCache.clear();
  fetchNextPage();
}

function showDetails(item) {
  currentItem = item;
  document.getElementById('modal-title').textContent = item.name || item.title || 'No title';
  document.getElementById('modal-description').textContent = item.overview || 'No description.';
  document.getElementById('modal-image').src = item.poster_path ? `${IMG_URL}${item.poster_path}` : '';
  document.getElementById('modal-rating').innerHTML = getStars(item.vote_average || 0);

  const serverSelect = document.getElementById('server');
  if (serverSelect) {
    serverSelect.value = 'vidsrc.cc';
    serverSelect.onchange = changeServer;
  }

  document.getElementById('modal').style.display = 'flex';
  changeServer();
}

function changeServer() {
  if (!currentItem) return;
  const server = document.getElementById('server').value;
  const embedURL =
    server === 'vidsrc.cc'
      ? `https://vidsrc.cc/v2/embed/tv/${currentItem.id}`
      : server === 'vidsrc.me'
      ? `https://vidsrc.net/embed/tv/?tmdb=${currentItem.id}`
      : `https://player.videasy.net/tv/${currentItem.id}`;

  const videoFrame = document.getElementById('modal-video');
  if (videoFrame) videoFrame.src = embedURL;
}

function closeModal() {
  document.getElementById('modal').style.display = 'none';
  const videoFrame = document.getElementById('modal-video');
  if (videoFrame) videoFrame.src = '';
}

function getStars(vote) {
  const full = Math.floor(vote / 2);
  const half = vote % 2 >= 1 ? 1 : 0;
  return '★'.repeat(full) + (half ? '½' : '') + '☆'.repeat(5 - full - half);
}

// Infinite scroll
window.addEventListener('scroll', () => {
  if ((window.innerHeight + window.scrollY) >= document.body.offsetHeight - 300) {
    fetchNextPage();
  }
});

genreSelect.addEventListener('change', resetAnime);
yearSelect.addEventListener('change', resetAnime);
document.getElementById('modal-close').addEventListener('click', closeModal);
document.getElementById('modal').addEventListener('click', e => {
  if (e.target.id === 'modal') closeModal();
});
window.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeModal();
});

// Initial Load
fetchGenres();
populateYearDropdown();
resetAnime();
