// =================================================================================
// CATEGORY PAGE SCRIPT - v5.7 (FINAL) WITH "ALL" CATEGORY FILTER
// =================================================================================

(function() {
  // Global caches
  let allMatchesForSearch = [];
  let categoryMatchesCache = [];

  // State for current filters
  let currentFilters = {
    live: false,
    popular: false,
    source: 'all',
  };

  // *** UPDATED: Added "all" to the CATEGORIES array
  const CATEGORIES = ["all", "football", "basketball", "baseball","motor-sports", "american-football", "afl", "fight", "hockey", "tennis", "rugby", "mma", "golf", "billiards", "cricket", "darts", "other"];
  const SOURCES = ["alpha", "bravo", "charlie", "delta", "echo", "foxtrot", "golf", "hotel", "intel"];

  // =========================================================================
  // === DOM ELEMENTS ===
  // =========================================================================
  const matchesContainer = document.getElementById("matches-container");
  const messageContainer = document.getElementById("message-container");
  const titleElement = document.getElementById("category-title");
  const pageTitle = document.querySelector("title");
  const filterBar = document.getElementById("filter-bar");
  const filterToggleBtn = document.getElementById("filter-toggle");
  const activeFiltersContainer = document.getElementById("active-filters-container");
  const filterOptions = document.getElementById("filter-options");
  const categorySelect = document.getElementById("category-select");
  const sourceSelect = document.getElementById("source-select");
  const skeletonLoader = document.getElementById('skeleton-loader');

  // =========================================================================
  // === HELPER & RENDERING FUNCTIONS ===
  // =========================================================================
  function formatDateTime(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    const timeFormat = { hour: "numeric", minute: "2-digit", hour12: true };
    if (timestamp <= now.getTime()) {
      return { badge: "LIVE", badgeType: "live", meta: date.toLocaleTimeString("en-US", timeFormat) };
    }
    if (isToday) {
      return { badge: date.toLocaleTimeString("en-US", timeFormat), badgeType: "date", meta: "Today" };
    }
    return { badge: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }), badgeType: "date", meta: date.toLocaleTimeString("en-US", timeFormat) };
  }

  function buildPosterUrl(match) {
    const placeholder = "https://methstreams.world/mysite.jpg";
    if (match.teams?.home?.badge && match.teams?.away?.badge) return `https://streamed.pk/api/images/poster/${match.teams.home.badge}/${match.teams.away.badge}.webp`;
    if (match.poster) {
      const p = String(match.poster || "").trim();
      if (p.startsWith("http")) return p;
      if (p.startsWith("/")) return `https://streamed.pk${p.endsWith(".webp")?p:p+".webp"}`;
      return `https://streamed.pk/api/images/proxy/${p}.webp`;
    }
    return placeholder;
  }

  function createMatchCard(match, options = {}) {
    if (!match || !match.id) return document.createDocumentFragment();
    const lazyLoad = options.lazyLoad !== false;
    const card = document.createElement("a");
    card.href = `../Matchinformation/?id=${match.id}`;
    card.classList.add("match-card");
    
    const poster = document.createElement("img");
    poster.classList.add("match-poster");
    poster.alt = match.title || "Match Poster";
    poster.onerror = () => { poster.onerror = null; poster.src = "https://methstreams.world/mysite.jpg"; };
    if (lazyLoad) {
      poster.loading = "lazy";
      poster.src = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";
      poster.dataset.src = buildPosterUrl(match);
    } else {
      poster.src = buildPosterUrl(match);
    }
    
    const { badge, badgeType, meta } = formatDateTime(match.date);
    const statusBadge = document.createElement("div");
    statusBadge.classList.add("status-badge", badgeType);
    statusBadge.textContent = badge;

    card.append(poster, statusBadge);

    if (match.popular === true) {
      const popularBadge = document.createElement("div");
      popularBadge.classList.add("popular-badge");
      popularBadge.title = `Popular Match`;
      popularBadge.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M12.83 2.33C12.5 1.5 11.5 1.5 11.17 2.33L9.45 7.1C9.33 7.44 9.04 7.7 8.69 7.78L3.65 8.63C2.8 8.75 2.47 9.71 3.06 10.27L6.92 13.9C7.17 14.14 7.28 14.49 7.2 14.85L6.15 19.81C5.97 20.66 6.77 21.3 7.55 20.89L11.79 18.53C12.11 18.35 12.49 18.35 12.81 18.53L17.05 20.89C17.83 21.3 18.63 20.66 18.45 19.81L17.4 14.85C17.32 14.49 17.43 14.14 17.68 13.9L21.54 10.27C22.13 9.71 21.8 8.75 20.95 8.63L15.91 7.78C15.56 7.7 15.27 7.44 15.15 7.1L13.43 2.33Z"/></svg>`;
      card.appendChild(popularBadge);
    }
    
    const info = document.createElement("div");
    info.classList.add("match-info");
    const title = document.createElement("div");
    title.classList.add("match-title");
    title.textContent = match.title || "Untitled Match";
    const metaRow = document.createElement("div");
    metaRow.classList.add("match-meta-row");
    const categorySpan = document.createElement("span");
    categorySpan.classList.add("match-category");
    categorySpan.textContent = match.category ? match.category.charAt(0).toUpperCase() + match.category.slice(1) : "Unknown";
    const timeOrDate = document.createElement("span");
    timeOrDate.textContent = meta;
    
    metaRow.append(categorySpan, timeOrDate);
    info.append(title, metaRow);
    card.appendChild(info);
    
    return card;
  }

  function initiateDelayedImageLoading() {
    const lazyImages = document.querySelectorAll('img[data-src]');
    if ('IntersectionObserver' in window) {
      const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target;
            img.src = img.dataset.src;
            img.removeAttribute('data-src');
            observer.unobserve(img);
          }
        });
      }, { rootMargin: "100px" });
      lazyImages.forEach(img => imageObserver.observe(img));
    } else {
        lazyImages.forEach(img => {
            img.src = img.dataset.src;
            img.removeAttribute('data-src');
        });
    }
  }

  // =========================================================================
  // === FILTERING & DATE GROUPING LOGIC ===
  // =========================================================================
  function renderMatches() {
    let matchesToRender = [...categoryMatchesCache];
    if (currentFilters.live) {
      matchesToRender = matchesToRender.filter(match => match.date <= Date.now());
    }
    if (currentFilters.source !== 'all') {
      matchesToRender = matchesToRender.filter(match => 
        match.sources && match.sources.some(s => s.source.toLowerCase() === currentFilters.source)
      );
    }
    if (currentFilters.popular) {
      matchesToRender = matchesToRender.filter(match => match.popular === true);
    }
    
    matchesToRender.sort((a, b) => a.date - b.date);
    
    matchesContainer.innerHTML = "";
    messageContainer.style.display = 'none';

    if (matchesToRender.length === 0) {
      messageContainer.textContent = "No matches found with the selected filters.";
      messageContainer.style.display = 'block';
      return;
    }
    
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const twentyFourSevenMatches = matchesToRender.filter(m => m.date < today.getTime());
    const upcomingMatches = matchesToRender.filter(m => m.date >= today.getTime());

    const groupedByDate = upcomingMatches.reduce((acc, match) => {
        const matchDate = new Date(match.date);
        const dateKey = new Date(matchDate.getFullYear(), matchDate.getMonth(), matchDate.getDate()).toISOString();
        if (!acc[dateKey]) acc[dateKey] = [];
        acc[dateKey].push(match);
        return acc;
    }, {});
    
    if (twentyFourSevenMatches.length > 0) {
        const section = document.createElement('div');
        section.className = 'date-section';
        section.innerHTML = `<h2 class="section-header">24/7 FREE</h2>`;
        const grid = document.createElement('div');
        grid.className = 'results-grid';
        twentyFourSevenMatches.forEach(match => grid.appendChild(createMatchCard(match)));
        section.appendChild(grid);
        matchesContainer.appendChild(section);
    }
    
    Object.keys(groupedByDate).sort().forEach(dateKey => {
        const date = new Date(dateKey);
        const isToday = date.toDateString() === now.toDateString();
        const dayLabel = isToday ? 'TODAY' : date.toLocaleDateString([], { weekday: 'short' }).toUpperCase();
        const dateLabel = date.toLocaleDateString([], { day: 'numeric', month: 'short' }).toUpperCase();
        const section = document.createElement('div');
        section.className = 'date-section';
        section.innerHTML = `<h2 class="section-header">${dayLabel} <span class="date-day">${dateLabel}</span></h2>`;
        const grid = document.createElement('div');
        grid.className = 'results-grid';
        groupedByDate[dateKey].forEach(match => grid.appendChild(createMatchCard(match)));
        section.appendChild(grid);
        matchesContainer.appendChild(section);
    });

    updateActiveFiltersUI();
    initiateDelayedImageLoading();
  }
  
  // =========================================================================
  // === URL & UI STATE MANAGEMENT ===
  // =========================================================================
  function updateUrlWithFilters(){const params=new URLSearchParams;currentFilters.live&&params.set("live","true"),currentFilters.popular&&params.set("popular","true"),"all"!==currentFilters.source&&params.set("source",currentFilters.source);const queryString=params.toString(),newUrl=`${window.location.pathname}${queryString?`?${queryString}`:""}${window.location.hash}`;history.replaceState(null,"",newUrl)}
  
  function updateActiveFiltersUI(){activeFiltersContainer.innerHTML="";const createTag=(key,text)=>{const tag=document.createElement("div");tag.className="active-filter-tag",tag.dataset.filterKey=key,tag.innerHTML=`<span>${text}</span><button class="remove-filter-btn" data-filter-key="${key}">&times;</button>`,activeFiltersContainer.appendChild(tag)};currentFilters.live&&createTag("live","Live"),currentFilters.popular&&createTag("popular","Popular"),"all"!==currentFilters.source&&createTag("source",`${currentFilters.source}`)}

  // =========================================================================
  // === EVENT LISTENERS & ROUTING ===
  // =========================================================================
  function setupEventListeners(){filterToggleBtn.addEventListener("click",()=>filterBar.classList.toggle("is-expanded")),filterOptions.addEventListener("click",e=>{const target=e.target.closest(".filter-btn");if(target){const filterKey=target.dataset.filter;currentFilters[filterKey]=!currentFilters[filterKey],target.classList.toggle("active",currentFilters[filterKey]),updateUrlWithFilters(),renderMatches()}}),sourceSelect.addEventListener("change",()=>{currentFilters.source=sourceSelect.value,updateUrlWithFilters(),renderMatches()}),
  
  categorySelect.addEventListener('change', () => {
    const newCategory = categorySelect.value;
    window.location.hash = `/${newCategory.charAt(0).toUpperCase() + newCategory.slice(1)}`;
  }),
  
  activeFiltersContainer.addEventListener("click",e=>{const target=e.target.closest(".remove-filter-btn");if(target){const key=target.dataset.filterKey;"boolean"==typeof currentFilters[key]?(currentFilters[key]=!1,document.querySelector(`.filter-btn[data-filter="${key}"]`)?.classList.remove("active")):(currentFilters[key]="all",sourceSelect.value="all"),updateUrlWithFilters(),renderMatches()}})}
  
  // *** UPDATED: Logic to handle "All Sports" in dropdown ***
  function populateFilterDropdowns(currentCategory){
    categorySelect.innerHTML = CATEGORIES.map(cat => {
      const isSelected = cat === currentCategory ? 'selected' : '';
      const displayText = cat === 'all' 
        ? 'All Sports' 
        : cat.replace(/-/g, " ").replace(/\b\w/g, l => l.toUpperCase());
      return `<option value="${cat}" ${isSelected}>${displayText}</option>`;
    }).join('');

    sourceSelect.innerHTML='<option value="all">All Sources</option>',SOURCES.forEach(source=>{const capitalizedSource=source.charAt(0).toUpperCase()+source.slice(1);sourceSelect.innerHTML+=`<option value="${source}">${capitalizedSource}</option>`}),sourceSelect.value=currentFilters.source
  }
  
  async function handleRouteChange() {
    // Default to 'all' if no category is specified in the URL hash
    let categoryName = window.location.hash.substring(2).toLowerCase() || "all";
    if (!CATEGORIES.includes(categoryName)) categoryName = "all";
    
    const urlParams = new URLSearchParams(window.location.search);
    currentFilters.live = urlParams.get('live') === 'true';
    currentFilters.popular = urlParams.get('popular') === 'true';
    currentFilters.source = urlParams.get('source') || 'all';

    // *** UPDATED: Logic to handle titles and API endpoint for "All Sports" ***
    const isAllSports = categoryName === 'all';
    const formattedName = isAllSports ? 'All Sports' : categoryName.replace(/-/g, ' ');
    const pageTitleText = `NFLBite.Top ${formattedName.replace(/\b\w/g, l => l.toUpperCase())} Matches`;
    
    pageTitle.textContent = pageTitleText;
    titleElement.textContent = pageTitleText;
    matchesContainer.innerHTML = "";
    skeletonLoader.style.display = "grid";
    messageContainer.style.display = "none";
    document.querySelector('.filter-btn[data-filter="live"]').classList.toggle('active', currentFilters.live);
    document.querySelector('.filter-btn[data-filter="popular"]').classList.toggle('active', currentFilters.popular);
    updateActiveFiltersUI();

    try {
      const apiUrl = isAllSports
        ? 'https://streamed.pk/api/matches/all'
        : `https://streamed.pk/api/matches/${categoryName}`;
        
      const response = await fetch(apiUrl);
      if (!response.ok) throw new Error(`API error: ${response.status}`);
      categoryMatchesCache = await response.json();
      skeletonLoader.style.display = 'none';

      if (!categoryMatchesCache || categoryMatchesCache.length === 0) {
        messageContainer.textContent = `No matches found for ${formattedName}. Check back later!`;
        messageContainer.style.display = "block";
        return;
      }
      
      populateFilterDropdowns(categoryName);
      renderMatches();

    } catch (error) {
      console.error("Failed to load category matches:", error);
      skeletonLoader.style.display = 'none';
      messageContainer.textContent = "Could not load matches. Please check your connection and try again.",
      messageContainer.style.display = "block";
    }
  }

  // =========================================================================
  // === SEARCH FUNCTIONALITY ===
  // =========================================================================
  async function fetchAllMatchesForSearch(){try{const res=await fetch("https://streamed.pk/api/matches/all");if(!res.ok)throw new Error("Failed to fetch search data");const allMatches=await res.json();const map=new Map;allMatches.forEach(m=>map.set(m.id,m)),allMatchesForSearch=Array.from(map.values())}catch(err){console.error("Error fetching search data:",err)}}
  function setupSearch(){const searchInput=document.getElementById("search-input"),searchOverlay=document.getElementById("search-overlay"),overlayInput=document.getElementById("overlay-search-input"),overlayResults=document.getElementById("overlay-search-results"),searchClose=document.getElementById("search-close");if(searchInput){searchInput.addEventListener("focus",()=>{searchOverlay.style.display="flex",overlayInput.value=searchInput.value,overlayInput.focus(),overlayResults.innerHTML=""}),searchClose.addEventListener("click",()=>{searchOverlay.style.display="none"}),searchOverlay.addEventListener("click",e=>{e.target.closest(".search-overlay-content")||(searchOverlay.style.display="none")}),overlayInput.addEventListener("input",function(){const q=this.value.trim().toLowerCase();if(overlayResults.innerHTML="",!q)return;const filtered=allMatchesForSearch.filter(m=>(m.title||"").toLowerCase().includes(q)||(m.league||"").toLowerCase().includes(q)||(m.teams?.home?.name||"").toLowerCase().includes(q)||(m.teams?.away?.name||"").toLowerCase().includes(q));filtered.slice(0,12).forEach(match=>{const item=document.createElement("div");item.className="search-result-item",item.appendChild(createMatchCard(match,{lazyLoad:!1})),overlayResults.appendChild(item)})}),overlayInput.addEventListener("keydown",e=>{if("Enter"===e.key){const q=overlayInput.value.trim();q&&(window.location.href=`../SearchResult/?q=${encodeURIComponent(q)}`)}})}}

  // === START THE APP ===
  setupEventListeners();
  window.addEventListener('hashchange', handleRouteChange);
  window.addEventListener('DOMContentLoaded', handleRouteChange);
  fetchAllMatchesForSearch().then(setupSearch);

})();
