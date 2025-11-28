document.addEventListener("DOMContentLoaded", function() {
    console.log("--- Buffstreams Pro Script V13 (Layout & Logic Final) ---");

    // =========================================================================
    // ===  CONFIGURATION  =====================================================
    // =========================================================================
    const CONFIG = {
        apiPrimary: 'https://streamed.pk/api',
        apiBackup: 'https://topembed.pw/api.php?format=json',
        proxyUrl: 'https://corsproxy.io/?',
        bufferMinutes: 30, 
        storageKey: 'buff_v13_final',
        sportDurations: {
            'football': 150,          // 2h 30m 
            'basketball': 180,        // 3h 00m
            'american-football': 225, // 3h 45m 
            'baseball': 210,          // 3h 30m 
            'hockey': 185,            // 3h 05m 
            'fight': 300,             // 5h 00m 
            'boxing': 120,            // 2h 00m 
            'mma': 120,               // 2h 00m 
            'motor-sports': 180,      // 3h 00m 
            'tennis': 240,            // 4h 00m 
            'cricket': 480,           // 8h 00m 
            'golf': 480,              // 8h 00m 
            'rugby': 140,             // 2h 20m
            'other': 180              // 3h 00m 
        }
    };

    // =========================================================================
    // ===  STATE & ELEMENTS  ==================================================
    // =========================================================================
    let allMatches = []; 
    let currentFilters = { live: false, popular: false, sport: 'all' };
    
    const GEO_OFFERS = {
        'US': { img: '/Images/webpartnarsUSA.webp', link: 'https://record.webpartners.co/_QUm2k2WIfIruiHimTOg2YWNd7ZgqdRLk/1/', cta: 'Claim Up To $2000', label: 'EXCLUSIVE', alt: 'USA Exclusive Bonus' },
        'GB': { img: '/Images/1winGreece.webp', link: 'https://www.effectivegatecpm.com/mwvtqzkj?key=daf26372fb52174ce25eca816951dd61', cta: 'Bet £10 Get £30', label: 'UK SPECIAL', alt: 'UK Betting Offer' },
        'CA': { img: '/Images/BetssonCanada.webp', link: 'https://record.betsson.com/_Ipto0Q-i5zSwcAgXsjz1uGNd7ZgqdRLk/1/', cta: 'Get $500 Free Bet', label: 'BONUS', alt: 'Canada Sports Bonus' },
        'GR': { img: '/Images/1winGreece.webp', link: 'https://1wksrw.com/betting?open=register&p=xctu', cta: 'Claim Bonus Now', label: 'OFFER', alt: 'Greece Welcome Bonus' },
        'WORLDWIDE': { img: '/Images/1winGreece.webp', link: 'https://1wksrw.com/betting?open=register&p=xctu', cta: 'Join & Win Big', label: 'SPONSORED', alt: 'Global Sports Betting Offer' },
        'default': { img: '/Images/1winGreece.webp', link: 'https://www.effectivegatecpm.com/mwvtqzkj?key=daf26372fb52174ce25eca816951dd61', cta: 'Join & Win Big', label: 'SPONSORED', alt: 'Global Sports Betting Offer' }
    };
    let currentAffiliateOffer = GEO_OFFERS['default'];

    const elements = {
        header: document.querySelector(".main-header"),
        filterBar: document.getElementById("filter-bar"),
        matchesContainer: document.getElementById("matches-container"),
        msgContainer: document.getElementById("message-container"),
        categoryTitle: document.getElementById("category-title"),
        categorySelect: document.getElementById("category-select"),
        filterToggleBtn: document.getElementById("filter-toggle"),
        activeFilters: document.getElementById("active-filters-container"),
        skeletonLoader: document.getElementById("skeleton-loader"),
        finishedSection: document.getElementById("finished-matches-section"),
        finishedContainer: document.getElementById("finished-container"),
        toggleFinishedBtn: document.getElementById("toggle-finished-btn"),
        finishedBtnText: document.getElementById("finished-btn-text")
    };

    // =========================================================================
    // ===  UTILITIES & HELPERS  ===============================================
    // =========================================================================
    const formatViewers = (num) => {
        if (!num) return '';
        if (num >= 1000) return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
        return num;
    };

    const normalizeCategory = (cat) => {
        if (!cat) return 'other';
        cat = cat.toLowerCase().trim();
        if (cat === 'soccer') return 'football';
        if (['nfl', 'cfb', 'american football'].includes(cat)) return 'american-football';
        if (['nba', 'ncaab'].includes(cat)) return 'basketball';
        if (cat === 'mlb') return 'baseball';
        if (['nhl', 'ice hockey'].includes(cat)) return 'hockey';
        if (['f1', 'nascar', 'motorsport'].includes(cat)) return 'motor-sports';
        if (['boxing', 'mma', 'ufc'].includes(cat)) return 'fight';
        return cat;
    };

    const getMatchFingerprint = (category, title) => {
        let s = (title || "").toLowerCase();
        s = s.replace(/\s+v\s+/g, ' vs ').replace(/\s+vs\.?\s+/g, ' vs '); 
        return normalizeCategory(category) + "_" + s.replace(/[^a-z0-9]/g, ''); 
    };

    // Check if match should be removed from memory completely
    function isMatchExpired(match) {
        if (match.viewers > 0) return false; 

        const nowSec = Date.now() / 1000;
        const startSec = match.date / 1000;
        const durationMins = CONFIG.sportDurations[match.category] || 180;
        const removalSec = startSec + (durationMins * 60) + (CONFIG.bufferMinutes * 60);
        
        // 24/7 LOGIC EXCEPTION (Primary sources old dates kept)
        const startOfTodaySec = new Date().setHours(0,0,0,0) / 1000;
        if (match.source === 'primary' && startSec < startOfTodaySec) {
            return false;
        }

        return nowSec > removalSec;
    }

    // =========================================================================
    // ===  GEO LOGIC  =========================================================
    // =========================================================================
    async function initGeoLogic() {
        try {
            let country = null;
            try { country = await fetch('https://get.geojs.io/v1/ip/country.json').then(r=>r.json()).then(d=>d.country); }
            catch { try { country = await fetch('https://api.country.is').then(r=>r.json()).then(d=>d.country); } catch(e){} }

            const code = country ? country.toUpperCase() : 'DEFAULT';
            if (GEO_OFFERS[code]) currentAffiliateOffer = GEO_OFFERS[code];
            else currentAffiliateOffer = GEO_OFFERS['WORLDWIDE'] || GEO_OFFERS['default'];

            updateAffiliateCardDOM(document.getElementById('lcp-affiliate-card'));
            
            document.querySelectorAll('.match-card.affiliate-card').forEach(c => {
                if(c.id !== 'lcp-affiliate-card') c.replaceWith(createAffiliateCard());
            });

        } catch (e) { console.warn("Geo failed", e); }
    }

    function updateAffiliateCardDOM(card) {
        if(!card) return;
        card.href = currentAffiliateOffer.link;
        const img = card.querySelector('img');
        if(img) {
            img.src = currentAffiliateOffer.img;
            img.alt = currentAffiliateOffer.alt;
        }
        const badgeSpan = card.querySelector('.status-badge span');
        if(badgeSpan) badgeSpan.textContent = currentAffiliateOffer.label;
        const title = card.querySelector('.match-title');
        if(title) title.textContent = currentAffiliateOffer.cta;
    }

    // =========================================================================
    // ===  VIEWER CHECK  ======================================================
    // =========================================================================
    async function fetchAndUpdateViewers() {
        const now = Date.now();
        const liveMatchesForApiCall = allMatches.filter(match => {
            if (match.source !== 'primary' || !match.sources || match.sources.length === 0) return false;
            return match.date <= (now + 1800000); 
        });

        if (liveMatchesForApiCall.length === 0) return;

        const streamFetchPromises = liveMatchesForApiCall.flatMap(match =>
            match.sources.map(source =>
                fetch(`${CONFIG.apiPrimary}/stream/${source.source}/${source.id}`)
                .then(res => res.ok ? res.json() : [])
                .then(streams => ({ matchId: match.id, streams }))
                .catch(() => ({ matchId: match.id, streams: [] }))
            )
        );

        const results = await Promise.allSettled(streamFetchPromises);
        const viewerCounts = {};

        results.forEach(result => {
            if (result.status === 'fulfilled' && result.value) {
                const { matchId, streams } = result.value;
                if (!viewerCounts[matchId]) viewerCounts[matchId] = 0;
                if (Array.isArray(streams)) {
                    streams.forEach(stream => {
                        if (stream.viewers && typeof stream.viewers === 'number') {
                            viewerCounts[matchId] += stream.viewers;
                        }
                    });
                }
            }
        });

        let needsRerender = false;
        Object.keys(viewerCounts).forEach(matchId => {
            const totalViewers = viewerCounts[matchId];
            const matchInArray = allMatches.find(m => m.id == matchId);
            if (matchInArray && matchInArray.viewers !== totalViewers) {
                matchInArray.viewers = totalViewers;
                if(totalViewers > 0) matchInArray.isLive = true; 
                needsRerender = true;
            }
        });

        if (needsRerender) {
            renderMatches(true);
        }
    }

    // =========================================================================
    // ===  API FETCHING  ======================================================
    // =========================================================================
    async function fetchPrimaryAPI() {
        try {
            const res = await fetch(`${CONFIG.apiPrimary}/matches/all`);
            if(!res.ok) throw new Error("Primary API Error");
            const data = await res.json();
            
            return data.map(m => {
                let poster = "../Fallbackimage.webp";
                if (m.teams?.home?.badge && m.teams?.away?.badge) {
                    poster = `${CONFIG.apiPrimary}/images/poster/${m.teams.home.badge}/${m.teams.away.badge}.webp`;
                } else if (m.poster) {
                    const p = String(m.poster).trim();
                    if (p.startsWith("http")) poster = p;
                    else if (p.startsWith("/")) poster = `https://streamed.pk${p.endsWith(".webp")?p:p+".webp"}`;
                    else poster = `${CONFIG.apiPrimary}/images/proxy/${p}.webp`;
                }

                return {
                    id: m.id,
                    title: m.title,
                    date: m.date,
                    category: normalizeCategory(m.category),
                    viewers: m.viewers || 0, 
                    popular: m.popular || false,
                    sources: m.sources || [],
                    posterUrl: poster,
                    source: 'primary'
                };
            }).filter(m => !isMatchExpired(m));
        } catch (e) { return []; }
    }

    async function fetchBackupAPI() {
        try {
            const controller = new AbortController();
            const id = setTimeout(() => controller.abort(), 4000);
            const res = await fetch(CONFIG.proxyUrl + encodeURIComponent(CONFIG.apiBackup), { signal: controller.signal });
            clearTimeout(id);
            if(!res.ok) throw new Error("Backup Error");
            
            const data = await res.json();
            const backup = [];
            
            if (data && data.events) {
                for (const d in data.events) {
                    const evts = Array.isArray(data.events[d]) ? data.events[d] : [data.events[d]];
                    evts.forEach(e => {
                        if(!e.sport || !e.match || !e.unix_timestamp) return;
                        const cat = normalizeCategory(e.sport);
                        const unix = parseInt(e.unix_timestamp);
                        const safe = (e.match||e.event||"").toLowerCase().replace(/[^a-z0-9]/g, '');
                        const id = btoa(unescape(encodeURIComponent(`${unix}_${cat}_${safe}`)));
                        
                        const m = {
                            id: id,
                            title: (e.match||e.event).replace(/ vs /i,' v '),
                            date: unix * 1000,
                            category: cat,
                            viewers: 0,
                            popular: false,
                            sources: [],
                            posterUrl: "../Fallbackimage.webp",
                            source: 'backup'
                        };
                        if(!isMatchExpired(m)) backup.push(m);
                    });
                }
            }
            return backup;
        } catch (e) { return []; }
    }

    // =========================================================================
    // ===  INIT  ==============================================================
    // =========================================================================
    async function initApp() {
        initGeoLogic();
        setupEventListeners(); 
        handleURLParams();

        try {
            const cached = localStorage.getItem(CONFIG.storageKey);
            if(cached) {
                allMatches = JSON.parse(cached);
                renderMatches(); 
            }
        } catch(e){}

        const primary = await fetchPrimaryAPI();
        if(primary.length > 0) {
            allMatches = primary;
            localStorage.setItem(CONFIG.storageKey, JSON.stringify(allMatches));
            renderMatches();
            populateCategoryDropdown();
        }

        await fetchAndUpdateViewers();

        setTimeout(async () => {
            const backup = await fetchBackupAPI();
            if(backup.length > 0) {
                const merged = [...allMatches];
                backup.forEach(bm => {
                    const fp = getMatchFingerprint(bm.category, bm.title);
                    const dup = allMatches.some(pm => getMatchFingerprint(pm.category, pm.title) === fp && Math.abs(pm.date - bm.date) < 7200000);
                    if(!dup) merged.push(bm);
                });
                allMatches = merged;
                renderMatches(true);
                populateCategoryDropdown(); 
            }
        }, 3000);
    }

    // =========================================================================
    // ===  RENDERER & CATEGORIZATION  =========================================
    // =========================================================================
    function createMatchCard(match, index) {
        const card = document.createElement('a');
        card.href = `../Matchinformation/?id=${match.id}`;
        card.className = 'match-card';
        
        const img = document.createElement('img');
        img.className = 'match-poster';
        img.width = 444; img.height = 250;
        img.alt = match.title;
        if(index < 3) {
            img.loading = "eager"; img.fetchPriority = "high"; img.src = match.posterUrl;
        } else {
            img.loading = "lazy"; img.src = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"; img.dataset.src = match.posterUrl;
        }
        img.onerror = function() { this.src = "../Fallbackimage.webp"; this.onerror = null; };

        // --- BADGE & META LOGIC ---
        let badgeHtml = '';
        let badgeClass = '';
        
        // Calculate Time String first
        const timeStr = new Date(match.date).toLocaleTimeString([], {hour:'numeric', minute:'2-digit', hour12:true}).toLowerCase(); // e.g. "07:30 pm"

        if (match.viewers > 0) {
            badgeClass = 'status-badge viewer-badge';
            badgeHtml = `<span>${formatViewers(match.viewers)}</span><svg class="viewer-icon" width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/></svg>`;
        } else if (match.isCalcLive && !match.isCalc247) {
            badgeClass = 'status-badge live';
            badgeHtml = `<span>LIVE</span>`;
        } else if (match.isCalcFinished) {
            badgeClass = 'status-badge finished';
            badgeHtml = `<span>FINISHED</span>`;
        } else if (match.isCalc247) {
            // FIX: Show "24/7" badge instead of time
            badgeClass = 'status-badge date';
            badgeHtml = `<span>24/7</span>`;
        } else {
            // Default Date (Upcoming)
            badgeClass = 'status-badge date';
            badgeHtml = timeStr;
        }

        const badgeDiv = document.createElement('div');
        badgeDiv.className = badgeClass;
        badgeDiv.innerHTML = badgeHtml;
        card.appendChild(badgeDiv);

        if(match.popular && match.source === 'primary') {
            const pop = document.createElement('div');
            pop.className = 'popular-badge';
            pop.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12.83 2.33C12.5 1.5 11.5 1.5 11.17 2.33L9.45 7.1C9.33 7.44 9.04 7.7 8.69 7.78L3.65 8.63C2.8 8.75 2.47 9.71 3.06 10.27L6.92 13.9C7.17 14.14 7.28 14.49 7.2 14.85L6.15 19.81C5.97 20.66 6.77 21.3 7.55 20.89L11.79 18.53C12.11 18.35 12.49 18.35 12.81 18.53L17.05 20.89C17.83 21.3 18.63 20.66 18.45 19.81L17.4 14.85C17.32 14.49 17.43 14.14 17.68 13.9L21.54 10.27C22.13 9.71 21.8 8.75 20.95 8.63L15.91 7.78C15.56 7.7 15.27 7.44 15.15 7.1L13.43 2.33Z"/></svg>`;
            card.appendChild(pop);
        }

        card.appendChild(img);
        
        const info = document.createElement('div');
        info.className = 'match-info';
        
        // FIX: Start Time Format Logic
        let meta;
        if (match.isCalc247) {
            meta = "24/7 Stream";
        } else if (match.viewers > 0 || match.isCalcLive || match.isCalcFinished) {
            meta = `Started: ${timeStr}`;
        } else {
            meta = new Date(match.date).toLocaleDateString();
        }

        info.innerHTML = `<div class="match-title">${match.title}</div><div class="match-meta-row"><span class="match-category">${match.category}</span><span>${meta}</span></div>`;
        card.appendChild(info);

        return card;
    }

    function createAffiliateCard() {
        const card = document.createElement('a');
        card.href = currentAffiliateOffer.link;
        card.target = "_blank"; card.rel = "nofollow noopener";
        card.className = 'match-card affiliate-card';
        card.innerHTML = `
            <div class="status-badge" style="background:linear-gradient(90deg,#d4af37,#f2d06b);color:#000;"><span>${currentAffiliateOffer.label}</span></div>
            <img class="match-poster" src="${currentAffiliateOffer.img}" width="444" height="250" alt="${currentAffiliateOffer.alt}" loading="eager">
            <div class="match-info">
                <div class="match-title" style="color:#d4af37;">${currentAffiliateOffer.cta}</div>
                <div class="match-meta-row"><span class="match-category">BETTING</span><span>Verified Offer</span></div>
            </div>`;
        return card;
    }

    function renderMatches(isUpdate = false) {
        if(!elements.matchesContainer) return;

        const now = Date.now();
        const startOfToday = new Date(); startOfToday.setHours(0,0,0,0);
        const todayTime = startOfToday.getTime();

        // 1. GLOBAL FILTERING & CATEGORIZATION
        let filtered = allMatches.filter(m => {
            if(currentFilters.sport !== 'all' && m.category !== currentFilters.sport) return false;
            
            const duration = (CONFIG.sportDurations[m.category] || 180) * 60 * 1000;
            const end = m.date + duration;
            const bufferEnd = end + (CONFIG.bufferMinutes * 60 * 1000);
            
            const isTimeLive = (now >= m.date && now <= end);
            m.isCalcLive = (m.viewers > 0) || isTimeLive;
            
            const isCandidate247 = (m.source === 'primary' && m.date < todayTime);

            if (m.isCalcLive) {
                m.isCalcFinished = false;
                m.isCalc247 = false;
            } else if (isCandidate247) {
                m.isCalc247 = true;
                m.isCalcFinished = false;
            } else {
                m.isCalc247 = false;
                m.isCalcFinished = (now > end); 
            }

            if(currentFilters.live && !m.isCalcLive) return false;
            if(currentFilters.popular && !m.popular) return false;
            return true;
        });

        // 2. SORTING
        let groupViewers = filtered.filter(m => m.viewers > 0);
        groupViewers.sort((a,b) => b.viewers - a.viewers || a.date - b.date);

        let groupLiveTime = filtered.filter(m => m.isCalcLive && m.viewers === 0);
        groupLiveTime.sort((a,b) => a.date - b.date);

        let groupUpcoming = filtered.filter(m => !m.isCalcLive && !m.isCalcFinished && !m.isCalc247);
        groupUpcoming.sort((a,b) => a.date - b.date);

        let groupFinished = filtered.filter(m => m.isCalcFinished);
        groupFinished.sort((a,b) => b.date - a.date); 

        let group247 = filtered.filter(m => m.isCalc247);
        group247.sort((a,b) => b.date - a.date); 

        // 3. DOM CONSTRUCTION
        const frag = document.createDocumentFragment();
        
        const appendSection = (title, list, isTop) => {
            const sec = document.createElement('div');
            sec.className = 'date-section';
            sec.innerHTML = `<h2 class="section-header">${title}</h2>`;
            const grid = document.createElement('div');
            grid.className = 'results-grid';
            
            if(isTop) grid.appendChild(createAffiliateCard());

            list.forEach((m, i) => grid.appendChild(createMatchCard(m, isTop ? i : 99)));
            sec.appendChild(grid);
            frag.appendChild(sec);
        };

        let allLive = [...groupViewers, ...groupLiveTime];
        if(allLive.length > 0) appendSection("LIVE NOW", allLive, true);

        if(groupUpcoming.length > 0) {
            const grouped = {};
            const todayStr = startOfToday.toDateString();
            groupUpcoming.forEach(m => {
                const d = new Date(m.date);
                let k = (d.toDateString() === todayStr) ? "TODAY" : d.toLocaleDateString(undefined, {weekday:'short', month:'short', day:'numeric'});
                if(!grouped[k]) grouped[k] = [];
                grouped[k].push(m);
            });
            let firstUp = (allLive.length === 0);
            Object.keys(grouped).forEach(k => {
                appendSection(k, grouped[k], firstUp);
                firstUp = false;
            });
        }

        if(group247.length > 0) appendSection("24/7 Live Streams", group247, false);

        elements.matchesContainer.innerHTML = '';
        if(filtered.length === 0) {
            elements.msgContainer.style.display = 'block';
            elements.msgContainer.textContent = "No matches found.";
        } else {
            elements.msgContainer.style.display = 'none';
            elements.matchesContainer.appendChild(frag);
        }
        if(elements.skeletonLoader) elements.skeletonLoader.style.display = 'none';

        if(elements.finishedContainer) {
            elements.finishedContainer.innerHTML = '';
            if(groupFinished.length > 0) {
                elements.finishedSection.style.display = 'block'; 
                
                const sec = document.createElement('div');
                sec.className = 'date-section';
                sec.innerHTML = `<h2 class="section-header">Finished</h2>`;
                const grid = document.createElement('div');
                grid.className = 'results-grid';
                grid.appendChild(createAffiliateCard());
                groupFinished.forEach(m => grid.appendChild(createMatchCard(m, 99)));
                sec.appendChild(grid);
                elements.finishedContainer.appendChild(sec);
            } else {
                elements.finishedSection.style.display = 'none'; 
            }
        }

        const obs = new IntersectionObserver(entries => {
            entries.forEach(e => {
                if(e.isIntersecting && e.target.dataset.src) {
                    e.target.src = e.target.dataset.src;
                    e.target.removeAttribute('data-src');
                    obs.unobserve(e.target);
                }
            });
        });
        document.querySelectorAll('img[data-src]').forEach(i => obs.observe(i));

        const sportName = currentFilters.sport === 'all' ? 'All Sports' : currentFilters.sport.replace(/-/g, ' ').replace(/\b\w/g, c=>c.toUpperCase());
        const pageTitle = `buffstreams.world ${sportName} schedule and livestreams`;
        if(elements.categoryTitle) elements.categoryTitle.textContent = `${sportName} Schedule`;
        document.title = pageTitle;
    }

    function setupEventListeners() {
        if(elements.toggleFinishedBtn) {
            const newBtn = elements.toggleFinishedBtn.cloneNode(true);
            elements.toggleFinishedBtn.parentNode.replaceChild(newBtn, elements.toggleFinishedBtn);
            elements.toggleFinishedBtn = newBtn; 

            elements.toggleFinishedBtn.addEventListener('click', () => {
                const isHidden = elements.finishedContainer.style.display === 'none';
                elements.finishedContainer.style.display = isHidden ? 'block' : 'none';
                elements.toggleFinishedBtn.classList.toggle('active', isHidden);
                elements.finishedBtnText.textContent = isHidden ? "Hide Finished Matches" : "Check Finished Matches";
            });
        }

        if(elements.categorySelect) {
             elements.categorySelect.addEventListener('change', (e) => {
                currentFilters.sport = e.target.value;
                updateURL();
            });
        }

        if(elements.filterToggleBtn) {
            elements.filterToggleBtn.addEventListener('click', () => elements.filterBar.classList.toggle('is-expanded'));
        }

        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const k = e.target.dataset.filter;
                currentFilters[k] = !currentFilters[k];
                e.target.classList.toggle('active');
                updateURL();
            });
        });
    }

    function populateCategoryDropdown() {
        if(!elements.categorySelect || allMatches.length === 0) return;
        const s = new Set(['all']);
        allMatches.forEach(m => s.add(m.category));
        
        const prio = ['football','basketball','american-football','fight','motor-sports','baseball','hockey'];
        const list = [...s].sort((a,b) => {
            if(a==='all') return -1; if(b==='all') return 1;
            const ia = prio.indexOf(a), ib = prio.indexOf(b);
            if(ia!==-1 && ib!==-1) return ia-ib;
            if(ia!==-1) return -1; if(ib!==-1) return 1;
            return a.localeCompare(b);
        });

        elements.categorySelect.innerHTML = list.map(v => 
            `<option value="${v}" ${v === currentFilters.sport ? 'selected' : ''}>
                ${v==='all'?'All Sports':v.replace(/-/g, ' ').toUpperCase()}
            </option>`
        ).join('');
        
        elements.categorySelect.value = currentFilters.sport;
    }

    let ticking = false;
    window.addEventListener("scroll", () => {
        if(!ticking) {
            window.requestAnimationFrame(() => {
                if(elements.header) elements.header.classList.toggle("sticky", window.scrollY > 100);
                ticking = false;
            });
            ticking = true;
        }
    }, {passive:true});

    function handleURLParams() {
        const p = new URLSearchParams(window.location.search);
        currentFilters.sport = p.get('sport') || 'all';
        currentFilters.live = p.get('live') === 'true';
        currentFilters.popular = p.get('popular') === 'true';
        
        if(elements.categorySelect) elements.categorySelect.value = currentFilters.sport;
        
        document.querySelectorAll('.filter-btn').forEach(b => {
            if(b.dataset.filter === 'live') b.classList.toggle('active', currentFilters.live);
            if(b.dataset.filter === 'popular') b.classList.toggle('active', currentFilters.popular);
        });
        updateActiveFilters();
    }

    function updateURL() {
        const p = new URLSearchParams();
        if(currentFilters.sport !== 'all') p.set('sport', currentFilters.sport);
        if(currentFilters.live) p.set('live', 'true');
        if(currentFilters.popular) p.set('popular', 'true');
        history.replaceState(null, '', window.location.pathname + '?' + p.toString());
        renderMatches();
        updateActiveFilters();
    }

    function updateActiveFilters() {
        if(!elements.activeFilters) return;
        elements.activeFilters.innerHTML = '';
        const add = (txt, type) => {
            const t = document.createElement('div');
            t.className = 'active-filter-tag';
            t.innerHTML = `<span>${txt}</span><button>&times;</button>`;
            t.querySelector('button').onclick = () => {
                if(type === 'sport') currentFilters.sport = 'all';
                else currentFilters[type] = false;
                if(elements.categorySelect) elements.categorySelect.value = currentFilters.sport;
                document.querySelector(`[data-filter="${type}"]`)?.classList.remove('active');
                updateURL();
            };
            elements.activeFilters.appendChild(t);
        };
        if(currentFilters.live) add('Live', 'live');
        if(currentFilters.popular) add('Popular', 'popular');
    }

    window.addEventListener('popstate', handleURLParams);

    const sb = {
        t: document.getElementById('mobile-toggle'),
        s: document.getElementById('mobile-sidebar'),
        o: document.getElementById('mobile-overlay'),
        c: document.getElementById('close-sidebar')
    };
    function toggleSidebar() {
        if(sb.s && sb.o) { sb.s.classList.toggle('active'); sb.o.classList.toggle('active'); }
    }
    if(sb.t) sb.t.addEventListener('click', toggleSidebar);
    if(sb.c) sb.c.addEventListener('click', toggleSidebar);
    if(sb.o) sb.o.addEventListener('click', toggleSidebar);

    initApp();
});


