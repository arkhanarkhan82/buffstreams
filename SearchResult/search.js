// =================================================================================
// SEARCH.JS - Search Results Page Logic (Optimized for Skeletons)
// =================================================================================

let allMatchesCache = [];

function debounce(func, delay) {
  let timeout;
  return function(...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), delay);
  };
}

// Reusable DOM/formatting functions
function formatDateTime(timestamp) {
  const date = new Date(timestamp), now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  const timeFormat = { hour: "numeric", minute: "2-digit" };
  if (timestamp <= now.getTime()) return { badge: "LIVE", badgeType: "live", meta: date.toLocaleTimeString("en-US", timeFormat) };
  if (isToday) return { badge: date.toLocaleTimeString("en-US", timeFormat), badgeType: "date", meta: "Today" };
  return { badge: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }), badgeType: "date", meta: date.toLocaleTimeString("en-US", timeFormat) };
}

function buildPosterUrl(match) {
  const placeholder = "https://methstreams.world/mysite.jpg";
  if (match.teams?.home?.badge && match.teams?.away?.badge) return `https://streamed.pk/api/images/poster/${match.teams.home.badge}/${match.teams.away.badge}.webp`;
  if (match.poster) {
    const p = String(match.poster || "").trim();
    if (p.startsWith("http")) return p;
    if (p.startsWith("/")) return `https://streamed.pk${p.endsWith(".webp") ? p : p + ".webp"}`;
    return `https://streamed.pk/api/images/proxy/${p}.webp`;
  }
  return placeholder;
}

function createMatchCard(match, isLazy = true) {
  const card = document.createElement("div");
  card.classList.add("match-card");

  const poster = document.createElement("img");
  poster.classList.add("match-poster");
  if (isLazy) {
    poster.classList.add("lazy-placeholder");
    poster.src = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";
    poster.dataset.src = buildPosterUrl(match);
  } else {
    poster.src = buildPosterUrl(match);
  }
  poster.alt = match.title || "Match Poster";
  poster.onerror = () => { poster.onerror = null; poster.src = "https://methstreams.world/mysite.jpg"; poster.classList.remove('lazy-placeholder'); };

  const { badge, badgeType, meta } = formatDateTime(match.date);
  const statusBadge = document.createElement("div");
  statusBadge.classList.add("status-badge", badgeType);
  statusBadge.textContent = badge;

  const info = document.createElement("div");
  info.classList.add("match-info");
  const title = document.createElement("div");
  title.classList.add("match-title");
  title.textContent = match.title || "Untitled Match";

  const metaRow = document.createElement("div");
  metaRow.classList.add("match-meta-row");
  const category = document.createElement("span");
  category.classList.add("match-category");
  category.textContent = match.category ? match.category.charAt(0).toUpperCase() + match.category.slice(1) : "Unknown";
  const timeOrDate = document.createElement("span");
  timeOrDate.textContent = meta;

  metaRow.append(category, timeOrDate);
  info.append(title, metaRow);
  card.append(poster, statusBadge, info);

  card.addEventListener("click", () => {
    window.location.href = `../Matchinformation/?id=${match.id}`;
  });

  return card;
}

// Search & Page-specific Functions
async function fetchAllMatches() {
  if (allMatchesCache.length > 0) return;
  try {
    const res = await fetch("https://streamed.pk/api/matches/all");
    if (!res.ok) throw new Error("Failed to fetch search data");
    const allMatches = await res.json();
    const map = new Map();
    allMatches.forEach(m => map.set(m.id, m));
    allMatchesCache = Array.from(map.values());
  } catch (err) {
    console.error("Error fetching search data:", err);
    document.getElementById("search-results").innerHTML = `<p class="no-results">Could not load match data.</p>`;
  }
}

function renderResults(query) {
  const container = document.getElementById("search-results");
  const title = document.getElementById("results-title");
  
  // === MODIFICATION: Clear skeletons/previous results ===
  container.innerHTML = ""; 

  if (!query) {
     title.textContent = `🔍 Please enter a search term`;
     return;
  }

  const q = query.toLowerCase();
  const filtered = allMatchesCache.filter(match => 
    (match.title || "").toLowerCase().includes(q) ||
    (match.league || "").toLowerCase().includes(q) ||
    (match.teams?.home?.name || "").toLowerCase().includes(q) ||
    (match.teams?.away?.name || "").toLowerCase().includes(q)
  );

  title.textContent = `🔍 Found ${filtered.length} results for "${query}"`;
  
  if (!filtered.length) {
    container.innerHTML = `<p class="no-results">❌ No matches found for "${query}"</p>`;
    return;
  }
  
  const fragment = document.createDocumentFragment();
  filtered.forEach(match => fragment.appendChild(createMatchCard(match)));
  container.appendChild(fragment);

  initiateDelayedImageLoading();
}

function initiateDelayedImageLoading() {
    const lazyImages = document.querySelectorAll('img.lazy-placeholder');
    if (lazyImages.length === 0) return;
    const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.src = img.dataset.src;
                img.onload = () => img.classList.remove('lazy-placeholder');
                observer.unobserve(img);
            }
        });
    }, { rootMargin: "1200px" }); // Using aggressive margin from homepage
    lazyImages.forEach(img => imageObserver.observe(img));
}

function setupSearch() {
  const searchInput = document.getElementById("search-input"),
        searchOverlay = document.getElementById("search-overlay"),
        overlayInput = document.getElementById("overlay-search-input"),
        overlayResults = document.getElementById("overlay-search-results"),
        searchClose = document.getElementById("search-close");

  if (!searchInput) return;

  searchInput.addEventListener("focus", () => {
    searchOverlay.style.display = "flex";
    overlayInput.value = searchInput.value;
    overlayInput.focus();
    if (searchInput.value.trim()) overlayInput.dispatchEvent(new Event('input'));
  });

  searchClose.addEventListener("click", () => searchOverlay.style.display = "none");
  searchOverlay.addEventListener("click", (e) => {
    if (!e.target.closest(".search-overlay-content")) searchOverlay.style.display = "none";
  });

  overlayInput.addEventListener("input", function() {
    const q = this.value.trim().toLowerCase();
    overlayResults.innerHTML = "";
    if (!q) return;
    const filtered = allMatchesCache.filter(m => (m.title || "").toLowerCase().includes(q) || (m.league || "").toLowerCase().includes(q) || (m.teams?.home?.name || "").toLowerCase().includes(q) || (m.teams?.away?.name || "").toLowerCase().includes(q));
    filtered.slice(0, 12).forEach(match => {
        const item = createMatchCard(match, false); // No lazy load in overlay
        item.classList.replace("match-card", "search-result-item");
        overlayResults.appendChild(item);
    });
  });

  overlayInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      const q = overlayInput.value.trim();
      if (q) {
        window.location.href = `?q=${encodeURIComponent(q)}`; // Full redirect for new search
      }
    }
  });
}

// Initialize Page
document.addEventListener("DOMContentLoaded", async () => {
  const params = new URLSearchParams(window.location.search);
  const query = params.get("q") || "";
  const searchInput = document.getElementById("search-input");
  
  searchInput.value = query;

  await fetchAllMatches();
  
  setupSearch();
  
  renderResults(query);

  const debouncedRender = debounce((newQuery) => {
      window.history.replaceState({}, '', newQuery ? `?q=${encodeURIComponent(newQuery)}` : window.location.pathname);
      renderResults(newQuery);
  }, 300);
  
  searchInput.addEventListener("input", () => {
      debouncedRender(searchInput.value.trim());
  });
  
  document.getElementById("search-form").addEventListener("submit", (e) => e.preventDefault());
});