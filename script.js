// --- [v7.5 - STICKY FIX & ZERO MOVEMENT/CLS] ---

document.addEventListener("DOMContentLoaded", function() {

    // --- 1. STICKY HEADER LOGIC (FIXED: Placeholder Swap) ---
    // Solves the issue of header covering content at the top
    (function setupStickyHeader() {
        const header = document.querySelector(".main-header");
        const placeholder = document.getElementById("header-placeholder");
        
        if (!header || !placeholder) return;
        
        // Threshold: 100px scroll triggers sticky
        const THRESHOLD = 100;

        window.addEventListener("scroll", function() {
            window.requestAnimationFrame(() => {
                if (window.scrollY > THRESHOLD) {
                    if (!header.classList.contains("sticky")) {
                        // Activate Sticky
                        header.classList.add("sticky");
                        // Show placeholder to fill the gap in DOM so content doesn't jump
                        placeholder.style.display = "block";
                        placeholder.style.visibility = "visible";
                    }
                } else {
                    if (header.classList.contains("sticky")) {
                        // Deactivate Sticky
                        header.classList.remove("sticky");
                        // Hide placeholder
                        placeholder.style.display = "none";
                        placeholder.style.visibility = "hidden";
                    }
                }
            });
        }, { passive: true });
    })();

    // --- 2. MOBILE SIDEBAR MENU LOGIC ---
    (function setupMobileMenu() {
        const toggleBtn = document.getElementById('mobile-toggle');
        const closeBtn = document.getElementById('close-sidebar');
        const sidebar = document.getElementById('mobile-sidebar');
        const overlay = document.getElementById('mobile-overlay');
        
        if(!toggleBtn || !sidebar || !overlay) return;

        function toggleMenu() {
            sidebar.classList.toggle('active');
            overlay.classList.toggle('active');
            document.body.style.overflow = sidebar.classList.contains('active') ? 'hidden' : '';
        }

        toggleBtn.addEventListener('click', toggleMenu);
        if(closeBtn) closeBtn.addEventListener('click', toggleMenu);
        overlay.addEventListener('click', toggleMenu);
    })();

    // --- 3. STICKY FOOTER AD LOGIC ---
    (function setupStickyFooterAd() {
        const adPlaceholder = document.getElementById('sticky-ad-placeholder');
        if (!adPlaceholder) return;

        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth <= 768;
        let adContent = '';

        if (isMobile) {
            adContent = `
            <div id="sticky-footer-ad">
              <div class="ad-content">
                <span class="emoji">📲</span>
                <span class="cta-text">Get App!</span>
                <a href="https://tinyurl.com/BuffstreamsApp" class="download-btn" rel="nofollow" target="_blank">⬇ Download</a>
              </div>
              <span id="close-ad">&#10060;</span>
            </div>`;
        } else {
            adContent = `
            <div id="sticky-footer-ad">
              <div class="ad-content">
                <span class="emoji">📺</span>
                <span class="cta-text">Free Prime Video</span>
                <a href="https://www.amazon.com/tryprimefree?tag=YOUR_TAG_HERE" class="download-btn amazon-btn" rel="nofollow sponsored" target="_blank">Start Trial</a>
              </div>
              <span id="close-ad">&#10060;</span>
            </div>`;
        }

        adPlaceholder.innerHTML = adContent;
        adPlaceholder.classList.add('active');

        const closeBtn = document.getElementById('close-ad');
        if (closeBtn) {
            closeBtn.addEventListener('click', function() {
                adPlaceholder.style.display = 'none';
            });
        }
    })();
});

window.addEventListener('load', function() {

    const CONFIG = {
        apiPrimary: 'https://streamed.pk/api',
        apiBackup: 'https://topembed.pw/api.php?format=json',
        discordServerId: '1422384816472457288',
        discordFallbackInvite: 'https://discord.gg/buffstreams',
    };

    // --- 4. SCROLL ANIMATION LOGIC ---
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

    // --- 5. SEARCH REDIRECT ---
    (function setupSearchRedirect() {
        const searchTrigger = document.getElementById('search-trigger');
        if (searchTrigger) {
            searchTrigger.addEventListener('click', function() {
                window.location.href = '/SearchResult/?focus=true';
            });
        }
    })();

    // --- 6. DISCORD FETCHER ---
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
            })
            .finally(() => {
                // Remove the skeleton loading class once data is ready
                discordButton.classList.remove('skeleton-loading');
                discordButton.classList.add('loaded');
            });
    })();
    
    // --- 7. HYBRID CATEGORY LOGIC ---
    (async function initializeHybridCategorySorting() {
        const categoriesGrid = document.querySelector('.categories-grid');
        if (!categoriesGrid) return;

        // Static Category Data
        const staticCategoryData = [
            { name: 'Basketball', href: '/Schedule/?sport=basketball', imgSrc: './Images/Basketball.webp', key: 'basketball' },
            { name: 'Football', href: '/Schedule/?sport=football', imgSrc: './Images/Football.webp', key: 'football' },
            { name: 'American Football', href: '/Schedule/?sport=american-football', imgSrc: './Images/American-football.webp', key: 'american-football' },
            { name: 'Hockey', href: '/Schedule/?sport=hockey', imgSrc: './Images/Hockey.webp', key: 'hockey' },
            { name: 'Baseball', href: '/Schedule/?sport=baseball', imgSrc: './Images/Baseball.webp', key: 'baseball' },
            { name: 'Motor-sports', href: '/Schedule/?sport=motor-sports', imgSrc: './Images/Motor-sport.webp', key: 'motor-sports' },
            { name: 'Fight', href: '/Schedule/?sport=fight', imgSrc: './Images/Fight.webp', key: 'fight' },
            { name: 'Tennis', href: '/Schedule/?sport=tennis', imgSrc: './Images/Tennis.webp', key: 'tennis' },
            { name: 'Rugby', href: '/Schedule/?sport=rugby', imgSrc: './Images/Rugby.webp', key: 'rugby' },
            { name: 'Golf', href: '/Schedule/?sport=golf', imgSrc: './Images/Golf.webp', key: 'golf' },
            { name: 'Billiards', href: '/Schedule/?sport=billiards', imgSrc: './Images/Billiards.webp', key: 'billiards' },
            { name: 'AFL', href: '/Schedule/?sport=afl', imgSrc: './Images/AFL.webp', key: 'afl' },
            { name: 'Darts', href: '/Schedule/?sport=darts', imgSrc: './Images/Darts.webp', key: 'darts' },
            { name: 'Cricket', href: '/Schedule/?sport=cricket', imgSrc: './Images/Cricket.webp', key: 'cricket' },
            { name: 'Other', href: '/Schedule/?sport=other', imgSrc: './Images/Other.webp', key: 'other' }
        ];

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

        const SPORT_DURATIONS = {
            'football': 150, 'basketball': 165, 'american-football': 210, 'baseball': 210,
            'hockey': 160, 'fight': 300, 'motor-sports': 180, 'tennis': 240,
            'cricket': 480, 'golf': 480, 'rugby': 130, 'darts': 180,
            'billiards': 180, 'afl': 180, 'other': 180
        };

        async function fetchBackupCounts() {
            try {
                const proxyUrl = 'https://corsproxy.io/?';
                const targetUrl = CONFIG.apiBackup;
                const finalUrl = proxyUrl + encodeURIComponent(targetUrl);
                const response = await fetch(finalUrl);
                if (!response.ok) throw new Error('Backup API failed');
                const data = await response.json();
                const now = Math.floor(Date.now() / 1000);
                const counts = {};

                if (data && data.events) {
                    for (const date in data.events) {
                        data.events[date].forEach(event => {
                            if (!event.sport) return;
                            const key = normalizeCategory(event.sport);
                            const durationMinutes = SPORT_DURATIONS[key] || 180;
                            const diffMinutes = (now - event.unix_timestamp) / 60;
                            if (diffMinutes >= 0 && diffMinutes < durationMinutes) {
                                counts[key] = (counts[key] || 0) + 1;
                            }
                        });
                    }
                }
                return counts;
            } catch (e) {
                return {};
            }
        }

        async function fetchPrimaryViewers() {
            const matchesRes = await fetch(`${CONFIG.apiPrimary}/matches/live`);
            if (!matchesRes.ok) throw new Error('Primary Matches API failed');
            const liveMatches = await matchesRes.json();
            if (liveMatches.length === 0) return {};

            const streamPromises = liveMatches.flatMap(match =>
                match.sources.map(source =>
                    fetch(`${CONFIG.apiPrimary}/stream/${source.source}/${source.id}`)
                        .then(res => res.ok ? res.json() : [])
                        .then(streams => ({ category: match.category, streams }))
                        .catch(() => ({ category: match.category, streams: [] }))
                )
            );

            const results = await Promise.all(streamPromises);
            const viewerCounts = {};
            results.forEach(item => {
                const key = normalizeCategory(item.category);
                if (!viewerCounts[key]) viewerCounts[key] = 0;
                item.streams.forEach(stream => {
                    if (typeof stream.viewers === 'number') {
                        viewerCounts[key] += stream.viewers;
                    }
                });
            });
            return viewerCounts;
        }

        const fetchWithTimeout = (promise, ms) => {
            const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout")), ms));
            return Promise.race([promise, timeout]);
        };

        let finalCategoryData = [...staticCategoryData];
        let backupCounts = {};

        try {
            const backupPromise = fetchBackupCounts();
            const primaryViewers = await fetchWithTimeout(fetchPrimaryViewers(), 4000);
            backupCounts = await backupPromise;

            finalCategoryData = finalCategoryData.map(cat => ({
                ...cat,
                viewers: primaryViewers[cat.key] || 0,
                matchCount: backupCounts[cat.key] || 0
            }));
            
            finalCategoryData.sort((a, b) => b.viewers - a.viewers);

        } catch (error) {
            console.log("Primary API failed or timed out. Switching to Match Count sort.");
            if (Object.keys(backupCounts).length === 0) {
                 backupCounts = await fetchBackupCounts();
            }
            finalCategoryData = finalCategoryData.map(cat => ({
                ...cat,
                viewers: 0,
                matchCount: backupCounts[cat.key] || 0
            }));
            finalCategoryData.sort((a, b) => b.matchCount - a.matchCount);
        }

        const formatViewers = (num) => {
            if (num >= 1000) return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
            return num;
        };

        const createCategoryCard = (category) => {
            const card = document.createElement('a');
            card.href = category.href;
            card.className = 'category-card';
    
            const img = document.createElement('img');
            img.src = category.imgSrc;
            img.alt = `${category.name} Logo`;
            img.loading = 'lazy';
            img.width = 90;
            img.height = 90;
            img.style.aspectRatio = "1/1"; 
            
            const span = document.createElement('span');
            span.textContent = category.name;
            
            card.appendChild(img);
            card.appendChild(span);
    
            if (category.viewers > 0) {
                const vBadge = document.createElement('div');
                vBadge.className = 'live-badge';
                const eyeIconSVG = `<svg class="viewer-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"></path></svg>`;
                vBadge.innerHTML = `<span>${formatViewers(category.viewers)}</span>${eyeIconSVG}`;
                card.appendChild(vBadge);
                setTimeout(() => vBadge.classList.add('visible'), 50);
            }

            if (category.matchCount > 0) {
                const cBadge = document.createElement('div');
                cBadge.className = 'count-badge';
                cBadge.innerHTML = `<span>${category.matchCount} Matches</span>`;
                card.appendChild(cBadge);
                setTimeout(() => cBadge.classList.add('visible'), 50);
            }

            return card;
        };

        const fragment = document.createDocumentFragment();
        finalCategoryData.forEach((category, index) => {
            const card = createCategoryCard(category);
            if (index < 4) { 
                const img = card.querySelector('img');
                if(img) { img.loading = 'eager'; img.fetchPriority = 'high'; }
            }
            fragment.appendChild(card);
        });

        categoriesGrid.innerHTML = '';
        categoriesGrid.appendChild(fragment);
    })();
});
