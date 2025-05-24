const API_KEY = "277256e815b05aae4f56dd5dd45eaa97";
const BASE_URL = "https://api.themoviedb.org/3";
const mediaType = "tv"; // 'tv' for anime shows

const latestMoviesList = document.getElementById("anime-list");
const yearSelect = document.getElementById("year-select");
const pageIndicator = document.getElementById("anime-page-indicator");
const loader = document.getElementById("loader");

let currentPage = 1;
let totalPages = 1;
let isLoading = false;
const movieCache = new Map();

async function fetchNextPage() {
  if (isLoading) return;
  if (currentPage > totalPages || currentPage > 100) return; // TMDB max 100 pages

  isLoading = true;
  loader.style.display = "block";
  pageIndicator.textContent = `Loading page ${currentPage}...`;

  const year = yearSelect.value;

  const cacheKey = `${year}-${currentPage}`;
  if (movieCache.has(cacheKey)) {
    const cached = movieCache.get(cacheKey);
    appendShows(cached.results);
    totalPages = cached.totalPages;
    currentPage++;
    isLoading = false;
    loader.style.display = "none";
    pageIndicator.textContent = `Page ${currentPage - 1}`;
    return;
  }

let url = `${BASE_URL}/discover/tv?api_key=${API_KEY}&page=${currentPage}&with_original_language=ja&with_genres=16&sort_by=popularity.desc`;

  if (year) {
    url += `&first_air_date_year=${year}`;
  }

  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    const data = await res.json();

    totalPages = data.total_pages;
    movieCache.set(cacheKey, { results: data.results || [], totalPages });

    appendShows(data.results || []);

    currentPage++;
    pageIndicator.textContent = `Page ${currentPage - 1}`;
  } catch (error) {
    console.error("Error fetching anime:", error);
    pageIndicator.textContent = "Error loading data.";
  } finally {
    isLoading = false;
    loader.style.display = "none";
  }
}

function appendShows(shows) {
  if (!shows.length) {
    const endMsg = document.createElement("p");
    endMsg.textContent = "No more anime found.";
    latestMoviesList.appendChild(endMsg);
    return;
  }

  shows.forEach((show) => {
    const container = document.createElement("div");
    container.classList.add("anime-card");
    container.style.display = "inline-block";
    container.style.margin = "10px";
    container.style.width = "150px";
    container.style.cursor = "pointer";

    const img = document.createElement("img");
    img.src = show.poster_path
      ? `https://image.tmdb.org/t/p/w342${show.poster_path}`
      : "https://via.placeholder.com/200x300?text=No+Image";
    img.alt = show.name || "No title";
    img.loading = "lazy";
    img.style.width = "100%";
    img.style.borderRadius = "8px";

    const title = document.createElement("h3");
    title.textContent = show.name || "Untitled";
    title.style.fontSize = "1rem";
    title.style.margin = "5px 0 0 0";

    container.appendChild(img);
    container.appendChild(title);

    container.onclick = () =>
      showDetails({
        ...show,
        media_type: mediaType,
      });

    latestMoviesList.appendChild(container);
  });
}

function resetResults() {
  currentPage = 1;
  totalPages = 1;
  latestMoviesList.innerHTML = "";
  movieCache.clear();
  fetchNextPage();
}

function showDetails(show) {
  alert(`Title: ${show.name}\nOverview: ${show.overview || "No description."}`);
}

yearSelect.addEventListener("change", resetResults);

resetResults();

window.addEventListener("scroll", () => {
  if (
    window.innerHeight + window.scrollY >=
    document.body.offsetHeight - 300
  ) {
    fetchNextPage();
  }
});
