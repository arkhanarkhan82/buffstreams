// --- [v3 - HIGH PERFORMANCE SCRIPT FOR BUFFSTREAMS] ---

// =========================================================================
// === CRITICAL FIRST-PAINT LOGIC ===
// =========================================================================
document.addEventListener("DOMContentLoaded", function() {

    // --- 1. STICKY HEADER LOGIC ---
    (function setupStickyHeader() {
        const header = document.querySelector(".main-header");
        const titleElement = document.getElementById("main-title");
        if (!header || !titleElement) return;
        window.addEventListener("scroll", function() {
            const triggerPoint = titleElement.offsetTop + titleElement.offsetHeight;
            header.classList.toggle("sticky", window.scrollY > triggerPoint);
        }, { passive: true });
    })();

});

// =========================================================================
// === DEFERRED, NON-CRITICAL LOGIC (RUNS AFTER PAGE LOAD) ===
// =========================================================================
window.addEventListener('load', function() {

    const CONFIG = {
        apiBaseUrl: 'https://streamed.pk/api',
        matchPageUrl: '/Matchinformation/',
        searchResultUrl: '/SearchResult/',
        searchUrlHash: '#search',
        discordServerId: '1422384816472457288', // IMPORTANT: Change if you have a different server ID
        discordFallbackInvite: 'https://discord.gg/buffstreams',
        placeholderImageUrl: 'https://methstreams.world/mysite.jpg'
    };

    // --- 2. SCROLL ANIMATION LOGIC ---
    (function setupScrollAnimations() {
        const animatedElements = document.querySelectorAll('.animate-on-scroll');
        if (!animatedElements.length) return;
        if ('IntersectionObserver' in window) {
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('is-visible');
                        observer.unobserve(entry.target);
                    }
                });
            }, { threshold: 0.1 });
            animatedElements.forEach(element => observer.observe(element));
        } else {
            animatedElements.forEach(el => el.classList.add('is-visible'));
        }
    })();

    // --- 3. ADVANCED SEARCH FEATURE LOGIC ---
    (function setupSearchFeature() {
        let allMatches = [], liveMatchIds = new Set(), isDataFetched = false, debounceTimer;
        const searchTrigger = document.getElementById('search-trigger');
        const searchOverlay = document.getElementById('search-overlay');
        const closeSearchBtn = document.getElementById('close-search-btn');
        const searchInput = document.getElementById('search-input');
        const resultsContainer = document.getElementById('search-results-container');
        if (!searchTrigger || !searchOverlay) return;

        function buildPosterUrl(match) {
            if (match.teams?.home?.badge && match.teams?.away?.badge) return `${CONFIG.apiBaseUrl}/images/poster/${match.teams.home.badge}/${match.teams.away.badge}.webp`;
            if (match.poster) {
                const p = String(match.poster).trim();
                if (p.startsWith("http")) return p;
                if (p.startsWith("/")) return `https://streamed.pk${p.endsWith(".webp") ? p : p + ".webp"}`;
                return `${CONFIG.apiBaseUrl}/images/proxy/${p}.webp`;
            }
            return CONFIG.placeholderImageUrl;
        }

        function createMatchCard(match) {
            if (!match?.id) return document.createDocumentFragment();
            const card = document.createElement("a");
            card.href = `${CONFIG.matchPageUrl}?id=${match.id}`;
            card.className = "match-card";
            const isLive = liveMatchIds.has(match.id);
            const matchDate = new Date(match.date);
            const timeFormatted = matchDate.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true });
            const dateFormatted = matchDate.toLocaleDateString([], { month: 'short', day: 'numeric' });
            const statusText = isLive ? "LIVE" : timeFormatted;
            const statusClass = isLive ? "live" : "date";
            const metaText = isLive ? timeFormatted : dateFormatted;
            
            card.innerHTML = `
                <img src="${buildPosterUrl(match)}" alt="${match.title}" class="match-poster" loading="lazy" decoding="async">
                <div class="status-badge ${statusClass}">${statusText}</div>
                ${match.popular ? `<div class="popular-badge" title="Popular Match"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M12.83 2.33C12.5 1.5 11.5 1.5 11.17 2.33L9.45 7.1C9.33 7.44 9.04 7.7 8.69 7.78L3.65 8.63C2.8 8.75 2.47 9.71 3.06 10.27L6.92 13.9C7.17 14.14 7.28 14.49 7.2 14.85L6.15 19.81C5.97 20.66 6.77 21.3 7.55 20.89L11.79 18.53C12.11 18.35 12.49 18.35 12.81 18.53L17.05 20.89C17.83 21.3 18.63 20.66 18.45 19.81L17.4 14.85C17.32 14.49 17.43 14.14 17.68 13.9L21.54 10.27C22.13 9.71 21.8 8.75 20.95 8.63L15.91 7.78C15.56 7.7 15.27 7.44 15.15 7.1L13.43 2.33Z"/></svg></div>` : ''}
                <div class="match-info"><div class="match-title">${match.title}</div><div class="match-meta-row"><span class="match-category">${match.category}</span><span>${metaText}</span></div></div>`;
            return card;
        }

        async function fetchSearchData() {
            if (isDataFetched) return;
            resultsContainer.innerHTML = '<div class="search-placeholder"><p>Loading matches...</p></div>';
            try {
                const [allMatchesRes, liveMatchesRes] = await Promise.all([
                    fetch(`${CONFIG.apiBaseUrl}/matches/all`),
                    fetch(`${CONFIG.apiBaseUrl}/matches/live`)
                ]);
                if (!allMatchesRes.ok) throw new Error('Failed to fetch all matches.');
                allMatches = await allMatchesRes.json();
                if (liveMatchesRes.ok) liveMatchIds = new Set((await liveMatchesRes.json()).map(m => m.id));
                isDataFetched = true;
                showInitialMessage();
            } catch (error) {
                console.error("Error fetching search data:", error);
                resultsContainer.innerHTML = '<div class="search-placeholder"><p>Could not load matches. Please try again later.</p></div>';
            }
        }

        const openOverlay = () => {
            searchOverlay.classList.add('active');
            document.body.style.overflow = 'hidden';
            history.pushState(null, '', CONFIG.searchUrlHash);
            searchInput.focus();
            fetchSearchData();
        };

        const closeOverlay = () => {
            searchOverlay.classList.remove('active');
            document.body.style.overflow = '';
            if (window.location.hash === CONFIG.searchUrlHash) {
                history.back();
            }
        };
        
        const showInitialMessage = () => {
            resultsContainer.innerHTML = '<div class="search-placeholder"><p>Find live matches by team, sport, or title.</p></div>';
        };

        const handleSearch = () => {
            const query = searchInput.value.trim().toLowerCase();
            if (query.length < 2) {
                showInitialMessage();
                return;
            }
            const filtered = allMatches.filter(m => ((m.title||"").toLowerCase().includes(query) || (m.category||"").toLowerCase().includes(query) || (m.teams?.home?.name||"").toLowerCase().includes(query) || (m.teams?.away?.name||"").toLowerCase().includes(query)));
            renderResults(filtered);
        };

        const renderResults = (matches) => {
            resultsContainer.innerHTML = '';
            if (matches.length === 0) {
                resultsContainer.innerHTML = '<div class="search-placeholder"><p>No matches found for your search.</p></div>';
                return;
            }
            matches.slice(0, 30).forEach(m => resultsContainer.appendChild(createMatchCard(m)));
        };

        searchTrigger.addEventListener('click', openOverlay);
        closeSearchBtn.addEventListener('click', closeOverlay);
        searchOverlay.addEventListener('click', (e) => e.target === searchOverlay && closeOverlay());
        window.addEventListener('keydown', e => e.key === 'Escape' && searchOverlay.classList.contains('active') && closeOverlay());
        searchInput.addEventListener('input', () => {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(handleSearch, 300);
        });

        window.addEventListener('popstate', () => {
            if (window.location.hash !== CONFIG.searchUrlHash) {
                searchOverlay.classList.remove('active');
                document.body.style.overflow = '';
            }
        });

    })();

    // --- 4. DISCORD INVITE LINK FETCHER LOGIC ---
    (function fetchDiscordInvite() {
        const apiUrl = `https://discord.com/api/guilds/${CONFIG.discordServerId}/widget.json`;
        const discordButton = document.getElementById("discord-join-link");
        if (!discordButton) return;
        fetch(apiUrl)
            .then(res => res.ok ? res.json() : Promise.reject('API fetch failed'))
            .then(data => {
                if (data.instant_invite) discordButton.href = data.instant_invite;
                else discordButton.href = CONFIG.discordFallbackInvite;
            })
            .catch(() => {
                discordButton.href = CONFIG.discordFallbackInvite;
            });
    })();
    
    // --- 5. LAZY-LOAD MOBILE AD SCRIPT ---
    (function lazyLoadMobileAdScript() {
        setTimeout(() => {
            const script = document.createElement('script');
            script.src = '/mobiledetectscript.js';
            script.defer = true;
            document.body.appendChild(script);
        }, 2500);
    })();
});
