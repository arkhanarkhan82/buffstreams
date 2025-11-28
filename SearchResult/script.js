document.addEventListener("DOMContentLoaded", function() {
    console.log("--- Buffstreams Search Script V15 (Geo Affiliate) ---");

    // --- CONFIGURATION ---
    const CONFIG = {
        apiPrimary: 'https://streamed.pk/api',
        apiBackup: 'https://topembed.pw/api.php?format=json',
        proxyUrl: 'https://corsproxy.io/?', 
        primaryTimeout: 4000,
        sportDurations: {
            'football': 150, 'basketball': 165, 'american-football': 210, 
            'baseball': 210, 'hockey': 160, 'fight': 300, 'motor-sports': 180, 
            'tennis': 240, 'cricket': 480, 'golf': 480, 'rugby': 130, 
            'darts': 180, 'other': 180
        }
    };

    // --- GEO TARGETING CONFIGURATION ---
    const GEO_OFFERS = {
        'US': { img: '../test.jpg', link: 'YOUR_USA_AFFILIATE_LINK_HERE', cta: 'Claim $500 Bonus', label: 'EXCLUSIVE', alt: 'USA Exclusive Bonus' },
        'GB': { img: '../test.jpg', link: 'YOUR_UK_AFFILIATE_LINK_HERE', cta: 'Bet £10 Get £30', label: 'UK SPECIAL', alt: 'UK Betting Offer' },
        'CA': { img: '../test.jpg', link: 'YOUR_CANADA_AFFILIATE_LINK_HERE', cta: 'Get $200 Free Bet', label: 'BONUS', alt: 'Canada Sports Bonus' },
        'GR': { img: '../test.jpg', link: 'YOUR_GREECE_AFFILIATE_LINK_HERE', cta: 'Claim Bonus Now', label: 'OFFER', alt: 'Greece Welcome Bonus' },
        'WORLDWIDE': { img: '../test.jpg', link: 'YOUR_GLOBAL_AFFILIATE_LINK_HERE', cta: 'Join & Win Big', label: 'SPONSORED', alt: 'Global Sports Betting Offer' },
        'default': { img: '../test.jpg', link: 'YOUR_GLOBAL_AFFILIATE_LINK_HERE', cta: 'Join & Win Big', label: 'SPONSORED', alt: 'Global Sports Betting Offer' }
    };
    let currentAffiliateOffer = GEO_OFFERS['default'];

    // --- STATE ---
    let allMatchesCache = []; 

    // --- DOM ELEMENTS ---
    const elements = {
        header: document.querySelector(".main-header"),
        mainTrigger: document.getElementById("main-search-trigger"),
        overlay: document.getElementById("search-overlay"),
        overlayInput: document.getElementById("overlay-search-input"),
        overlayResults: document.getElementById("overlay-search-results"),
        closeOverlayBtn: document.getElementById("search-close"),
        resultsContainer: document.getElementById("search-results-container"),
        resultsTitle: document.getElementById("results-title"),
        mobileToggle: document.getElementById("mobile-toggle"),
        mobileSidebar: document.getElementById("mobile-sidebar"),
        mobileOverlay: document.getElementById("mobile-overlay"),
        closeSidebar: document.getElementById("close-sidebar")
    };

    // --- GEO LOGIC ---
    async function initGeoLogic() {
        try {
            let country = null;
            try { country = await fetch('https://get.geojs.io/v1/ip/country.json').then(r=>r.json()).then(d=>d.country); }
            catch { try { country = await fetch('https://api.country.is').then(r=>r.json()).then(d=>d.country); } catch(e){} }

            const code = country ? country.toUpperCase() : 'DEFAULT';
            if (GEO_OFFERS[code]) currentAffiliateOffer = GEO_OFFERS[code];
            else currentAffiliateOffer = GEO_OFFERS['WORLDWIDE'] || GEO_OFFERS['default'];
        } catch (e) { console.warn("Geo failed", e); }
    }

    // --- AFFILIATE CARD CREATOR ---
    function createAffiliateCard() {
        const card = document.createElement('a');
        card.href = currentAffiliateOffer.link;
        card.target = "_blank"; card.rel = "nofollow noopener";
        card.className = 'match-card affiliate-card';
        card.innerHTML = `
            <div class="status-badge"><span>${currentAffiliateOffer.label}</span></div>
            <img class="match-poster" src="${currentAffiliateOffer.img}" alt="${currentAffiliateOffer.alt}" loading="eager" fetchpriority="high">
            <div class="match-info">
                <div class="match-title">${currentAffiliateOffer.cta}</div>
                <div class="match-meta-row"><span class="match-category">BETTING</span><span>Verified Offer</span></div>
            </div>`;
        return card;
    }

    // --- UTILITY ---
    const formatViewers = (num) => {
        if (!num) return '';
        if (num >= 1000) return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
        return num;
    };

    const normalizeCategory = (cat) => {
        if (!cat) return 'other';
        cat = cat.toLowerCase().trim();
        if (cat === 'soccer') return 'football';
        if (cat === 'nfl' || cat === 'cfb' || cat === 'american football') return 'american-football';
        if (cat === 'nba' || cat === 'ncaab') return 'basketball';
        if (cat === 'mlb') return 'baseball';
        if (cat === 'nhl' || cat === 'ice hockey') return 'hockey';
        if (cat === 'f1' || cat === 'nascar' || cat === 'motorsport') return 'motor-sports';
        if (cat === 'boxing' || cat === 'mma' || cat === 'ufc') return 'fight';
        return cat;
    };

    const getMatchFingerprint = (category, title) => {
        let s = (title || "").toLowerCase();
        s = s.replace(/\s+v\s+/g, ' vs ').replace(/\s+vs\.?\s+/g, ' vs '); 
        return normalizeCategory(category) + "_" + s.replace(/[^a-z0-9]/g, ''); 
    };

    const generateBackupId = (event) => {
        const safeMatch = (event.match || event.event || "").toLowerCase().replace(/[^a-z0-9]/g, '');
        const safeSport = (event.sport || "").toLowerCase().trim();
        const unix = event.unix_timestamp;
        const uniqueString = `${unix}_${safeSport}_${safeMatch}`;
        return btoa(unescape(encodeURIComponent(uniqueString)));
    };

    // --- API FUNCTIONS ---
    function buildPrimaryPosterUrl(match) {
        if (match.teams?.home?.badge && match.teams?.away?.badge) {
            return `${CONFIG.apiPrimary}/images/poster/${match.teams.home.badge}/${match.teams.away.badge}.webp`;
        }
        if (match.poster) {
            const p = String(match.poster || "").trim();
            if (p.startsWith("http")) return p;
            if (p.startsWith("/")) return `https://streamed.pk${p.endsWith(".webp")?p:p+".webp"}`;
            return `${CONFIG.apiPrimary}/images/proxy/${p}.webp`;
        }
        return "../Fallbackimage.webp";
    }

    async function fetchPrimaryAPI() {
        try {
            const res = await fetch(`${CONFIG.apiPrimary}/matches/all`);
            if(!res.ok) throw new Error("Primary API Error");
            const data = await res.json();
            return data.map(m => ({
                id: m.id,
                title: m.title,
                date: m.date,
                category: normalizeCategory(m.category),
                isLive: false,
                popular: m.popular || false,
                viewers: m.viewers || 0,
                sources: m.sources || [],
                posterUrl: buildPrimaryPosterUrl(m),
                source: 'primary',
                league: m.league || "",
                teams: m.teams || {}
            }));
        } catch (e) { console.error(e); return []; }
    }

    async function fetchBackupAPI() {
        try {
            const url = CONFIG.proxyUrl + encodeURIComponent(CONFIG.apiBackup);
            const res = await fetch(url);
            if(!res.ok) throw new Error("Backup API Error");
            const data = await res.json();
            const backupMatches = [];
            
            if (data && data.events) {
                for (const dateStr in data.events) {
                    const rawEvents = Array.isArray(data.events[dateStr]) ? data.events[dateStr] : [data.events[dateStr]];
                    rawEvents.forEach(event => {
                        if(!event.sport || !event.match || !event.unix_timestamp) return;
                        backupMatches.push({
                            id: generateBackupId(event),
                            title: (event.match || event.event || "Unknown").replace(/ vs /i, ' v '),
                            date: parseInt(event.unix_timestamp) * 1000, 
                            category: normalizeCategory(event.sport),
                            isLive: false,
                            popular: false,
                            viewers: 0, 
                            sources: [],
                            posterUrl: "../Fallbackimage.webp",
                            source: 'backup'
                        });
                    });
                }
            }
            return backupMatches;
        } catch (e) { console.error(e); return []; }
    }

    async function fetchAndUpdateViewers() {
        const now = Date.now();
        const liveMatches = allMatchesCache.filter(m => m.source === 'primary' && m.sources?.length && m.date <= now);
        if (liveMatches.length === 0) return;

        const promises = liveMatches.flatMap(match =>
            match.sources.map(source =>
                fetch(`${CONFIG.apiPrimary}/stream/${source.source}/${source.id}`)
                .then(r => r.ok ? r.json() : [])
                .then(streams => ({ matchId: match.id, streams }))
                .catch(() => ({ matchId: match.id, streams: [] }))
            )
        );

        const results = await Promise.allSettled(promises);
        const viewerCounts = {};
        
        results.forEach(res => {
            if(res.status === 'fulfilled' && res.value) {
                const { matchId, streams } = res.value;
                if(!viewerCounts[matchId]) viewerCounts[matchId] = 0;
                if(Array.isArray(streams)) {
                    streams.forEach(s => { if(s.viewers) viewerCounts[matchId] += s.viewers; });
                }
            }
        });

        Object.keys(viewerCounts).forEach(mid => {
            const m = allMatchesCache.find(x => x.id == mid);
            if(m && m.viewers !== viewerCounts[mid]) {
                m.viewers = viewerCounts[mid];
                m.isLive = true;
            }
        });
    }

    // --- INITIALIZATION ---
    async function loadMatches() {
        await initGeoLogic(); // Wait for Geo before rendering initial results

        const [primary, backup] = await Promise.all([
            fetchPrimaryAPI().catch(() => []),
            fetchBackupAPI().catch(() => [])
        ]);

        const merged = [...primary];
        backup.forEach(bm => {
            const fp = getMatchFingerprint(bm.category, bm.title);
            const isDuplicate = primary.some(pm => {
                const titleMatch = getMatchFingerprint(pm.category, pm.title) === fp;
                const timeDiff = Math.abs(pm.date - bm.date);
                return titleMatch && timeDiff < 7200000; 
            });
            if (!isDuplicate) merged.push(bm);
        });

        merged.sort((a,b) => a.date - b.date);
        allMatchesCache = merged;
        
        const params = new URLSearchParams(window.location.search);
        
        // 1. Check for standard search 'q'
        const query = params.get('q');
        if (query) {
            renderResults(query, elements.resultsContainer);
        } else {
            elements.resultsTitle.textContent = "Recommended Offers";
            // Even if no search, show affiliate card
            elements.resultsContainer.innerHTML = '';
            elements.resultsContainer.appendChild(createAffiliateCard());
        }

        // 2. Check for 'focus=true'
        if (params.get('focus') === 'true') {
            openOverlay();
        }

        fetchAndUpdateViewers();
    }

    // --- SEARCH LOGIC ---
    function renderResults(query, container, isOverlay = false) {
        container.innerHTML = '';
        
        // ALWAYS prepend affiliate card first
        container.appendChild(createAffiliateCard());

        if (!query) {
            if(!isOverlay) elements.resultsTitle.textContent = "Please enter a search term.";
            return;
        }

        const q = query.toLowerCase().trim();
        const terms = q.split(/\s+/); 

        let filtered = allMatchesCache.filter(match => {
            const text = `${match.title} ${match.league} ${match.category} ${match.teams?.home?.name || ''} ${match.teams?.away?.name || ''}`.toLowerCase();
            return terms.every(term => text.includes(term));
        });
        
        if (filtered.length === 0 && terms.length > 1) {
             filtered = allMatchesCache.filter(match => {
                const text = `${match.title} ${match.league}`.toLowerCase();
                return terms.some(term => text.includes(term));
            });
        }

        if(!isOverlay) {
            elements.resultsTitle.textContent = `Found ${filtered.length} matches for "${query}"`;
        }

        if (filtered.length === 0) {
            // Even if no text results, the affiliate card is already added above.
            // Just add a text message saying "No matches"
            const noRes = document.createElement('div');
            noRes.style.gridColumn = "1/-1";
            noRes.style.textAlign = "center";
            noRes.style.color = "var(--text-secondary)";
            noRes.style.padding = "20px";
            noRes.textContent = `No matches found for "${query}"`;
            container.appendChild(noRes);
            return;
        }

        const displayList = isOverlay ? filtered.slice(0, 50) : filtered;
        const fragment = document.createDocumentFragment();
        
        displayList.forEach((m, index) => {
            const card = createMatchCard(m);
            if(isOverlay) card.style.animationDelay = `${index * 0.03}s`;
            fragment.appendChild(card);
        });
        
        container.appendChild(fragment);

        // Lazy Load
        const observer = new IntersectionObserver((entries, obs) => {
            entries.forEach(e => {
                if(e.isIntersecting) {
                    const img = e.target;
                    img.src = img.dataset.src;
                    img.onload = () => img.removeAttribute('data-src');
                    obs.unobserve(img);
                }
            });
        });
        container.querySelectorAll('img[data-src]').forEach(img => observer.observe(img));
    }

    function createMatchCard(match) {
        const card = document.createElement('a');
        card.href = `../Matchinformation/?id=${match.id}`;
        card.className = 'match-card';
        
        const img = document.createElement('img');
        img.className = 'match-poster';
        img.src = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";
        img.dataset.src = match.posterUrl;
        img.alt = match.title;
        img.onerror = function() { this.src = "../Fallbackimage.webp"; };

        const now = Date.now();
        const durationMins = CONFIG.sportDurations[match.category] || 180;
        const end = match.date + (durationMins * 60 * 1000);
        const startOfToday = new Date(); startOfToday.setHours(0,0,0,0);
        const is247 = match.date < startOfToday.getTime();
        
        let isLive = match.isLive || (now >= match.date && now <= end) || (match.viewers > 0);
        let isFinished = (now > end) && !is247 && !isLive;
        
        const dateObj = new Date(match.date);
        const timeStr = dateObj.toLocaleTimeString([], {hour: 'numeric', minute:'2-digit', hour12: true});
        const dateStr = dateObj.toLocaleDateString();

        const badgeDiv = document.createElement('div');
        if (match.viewers > 0) {
            badgeDiv.className = 'status-badge viewer-badge';
            badgeDiv.innerHTML = `<span>${formatViewers(match.viewers)}</span>
            <svg class="viewer-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"></path></svg>`;
        } else if (isLive || is247) {
            badgeDiv.className = 'status-badge live';
            badgeDiv.innerHTML = `<span>LIVE</span>`;
        } else if (isFinished) {
            badgeDiv.className = 'status-badge finished';
            badgeDiv.innerHTML = `<span>FINISHED</span>`;
        } else {
            badgeDiv.className = 'status-badge date';
            badgeDiv.textContent = timeStr;
        }
        card.appendChild(badgeDiv);

        if (match.popular && match.source === 'primary') {
            const popBadge = document.createElement('div');
            popBadge.className = 'popular-badge';
            popBadge.innerHTML = `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12.83 2.33C12.5 1.5 11.5 1.5 11.17 2.33L9.45 7.1C9.33 7.44 9.04 7.7 8.69 7.78L3.65 8.63C2.8 8.75 2.47 9.71 3.06 10.27L6.92 13.9C7.17 14.14 7.28 14.49 7.2 14.85L6.15 19.81C5.97 20.66 6.77 21.3 7.55 20.89L11.79 18.53C12.11 18.35 12.49 18.35 12.81 18.53L17.05 20.89C17.83 21.3 18.63 20.66 18.45 19.81L17.4 14.85C17.32 14.49 17.43 14.14 17.68 13.9L21.54 10.27C22.13 9.71 21.8 8.75 20.95 8.63L15.91 7.78C15.56 7.7 15.27 7.44 15.15 7.1L13.43 2.33Z"/></svg>`;
            card.appendChild(popBadge);
        }

        const infoDiv = document.createElement('div');
        infoDiv.className = 'match-info';
        
        let bottomMeta;
        if(is247) bottomMeta = "24/7 Stream";
        else if(match.viewers > 0 || isLive) bottomMeta = `Started: ${timeStr}`;
        else if(isFinished) bottomMeta = `Started: ${timeStr}`;
        else bottomMeta = dateStr;

        infoDiv.innerHTML = `
            <div class="match-title">${match.title}</div>
            <div class="match-meta-row">
                <span class="match-category">${match.category}</span>
                <span>${bottomMeta}</span>
            </div>`;
        
        card.appendChild(img);
        card.appendChild(infoDiv);
        return card;
    }

    // --- UI EVENTS ---
    function openOverlay() {
        elements.overlay.style.display = 'flex';
        // Instantly render affiliate card + recent searches (if any) or just card
        // We pass "" as query so renderResults adds only the card
        if(elements.overlayResults.children.length === 0) {
            renderResults("", elements.overlayResults, true);
        }

        requestAnimationFrame(() => {
            elements.overlay.classList.add('active');
            elements.overlayInput.focus();
        });
        document.body.style.overflow = 'hidden';
    }

    function closeOverlay() {
        elements.overlay.classList.remove('active');
        setTimeout(() => {
            elements.overlay.style.display = 'none';
        }, 200);
        document.body.style.overflow = '';
    }

    elements.mainTrigger.addEventListener('click', openOverlay);
    elements.closeOverlayBtn.addEventListener('click', closeOverlay);
    
    elements.overlay.addEventListener('click', (e) => {
        if (e.target === elements.overlay) closeOverlay();
    });

    document.addEventListener('keydown', (e) => {
        if(e.key === 'Escape' && elements.overlay.classList.contains('active')) closeOverlay();
    });

    // Sidebar
    elements.mobileToggle.addEventListener('click', () => {
        elements.mobileSidebar.classList.add('active');
        elements.mobileOverlay.classList.add('active');
    });
    const closeMenu = () => {
        elements.mobileSidebar.classList.remove('active');
        elements.mobileOverlay.classList.remove('active');
    };
    elements.closeSidebar.addEventListener('click', closeMenu);
    elements.mobileOverlay.addEventListener('click', closeMenu);
    elements.header.addEventListener("click", (e) => {
        if (e.target.closest("a")) closeMenu();
    });

    window.addEventListener("scroll", () => {
        elements.header.classList.toggle("sticky", window.scrollY > 100);
    }, { passive: true });

    // Live Search
    elements.overlayInput.addEventListener('input', (e) => {
        const val = e.target.value;
        renderResults(val, elements.overlayResults, true);
    });

    elements.overlayInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            const val = e.target.value.trim();
            if(val) window.location.search = `?q=${encodeURIComponent(val)}`;
        }
    });

    loadMatches();
});