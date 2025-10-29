// --- [v4 - HIGH PERFORMANCE SCRIPT FOR BUFFSTREAMS] ---

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
        placeholderImageUrl: '/Fallbackimage.webp'
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

    // --- 3. HOMEPAGE SEARCH REDIRECT LOGIC ---
    (function setupSearchRedirect() {
        const searchTrigger = document.getElementById('search-trigger');
        if (searchTrigger) {
            searchTrigger.addEventListener('click', function() {
                window.location.href = '/SearchResult/?focus=true';
            });
        }
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
    
    

    // =========================================================================
    // === [NEW] DYNAMIC CATEGORY SORTING LOGIC ===
    // =========================================================================
    (function initializeLiveCategorySorting() {
        const API_BASE = 'https://streamed.pk/api';
        const categoriesGrid = document.querySelector('.categories-grid');
    
        // Store static data for each category, mirroring the original HTML.
        const staticCategoryData = [
            { name: 'Basketball', href: '/Schedule/#/basketball', imgSrc: './Images/Basketball.webp', key: 'basketball' },
            { name: 'Football', href: '/Schedule/#/football', imgSrc: './Images/Football.webp', key: 'football' },
            { name: 'American Football', href: '/Schedule/#/american-football', imgSrc: './Images/American-football.webp', key: 'american-football' },
            { name: 'Hockey', href: '/Schedule/#/hockey', imgSrc: './Images/Hockey.webp', key: 'hockey' },
            { name: 'Baseball', href: '/Schedule/#/baseball', imgSrc: './Images/Baseball.webp', key: 'baseball' },
            { name: 'Motor-sports', href: '/Schedule/#/motor-sports', imgSrc: './Images/Motor-sport.webp', key: 'motor-sports' },
            { name: 'Fight', href: '/Schedule/#/fight', imgSrc: './Images/Fight.webp', key: 'fight' },
            { name: 'Tennis', href: '/Schedule/#/tennis', imgSrc: './Images/Tennis.webp', key: 'tennis' },
            { name: 'Rugby', href: '/Schedule/#/rugby', imgSrc: './Images/Rugby.webp', key: 'rugby' },
            { name: 'Golf', href: '/Schedule/#/golf', imgSrc: './Images/Golf.webp', key: 'golf' },
            { name: 'Billiards', href: '/Schedule/#/billiards', imgSrc: './Images/Billiards.webp', key: 'billiards' },
            { name: 'AFL', href: '/Schedule/#/afl', imgSrc: './Images/AFL.webp', key: 'afl' },
            { name: 'Darts', href: '/Schedule/#/darts', imgSrc: './Images/Darts.webp', key: 'darts' },
            { name: 'Cricket', href: '/Schedule/#/cricket', imgSrc: './Images/Cricket.webp', key: 'cricket' },
            { name: 'Other', href: '/Schedule/#/other', imgSrc: './Images/Other.webp', key: 'other' }
        ];
    
        // [UPDATED] Viewer formatting function as requested.
        const formatViewers = (num) => {
            if (num >= 1000) {
                // Returns 1.3k for 1300, or 1k for 1000
                return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
            }
            // Returns the exact number if below 1000
            return num;
        };
    
        // [UPDATED] Card creation now includes the eye icon SVG.
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
            
            const span = document.createElement('span');
            span.textContent = category.name;
            
            card.appendChild(img);
            card.appendChild(span);
    
            if (category.viewers > 0) {
                const badge = document.createElement('div');
                badge.className = 'live-badge';
                
                // --- Eye Icon SVG --- (Performance-friendly inline SVG)
                const eyeIconSVG = `<svg class="viewer-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"></path></svg>`;

                // Use innerHTML to add the number and the icon SVG
                badge.innerHTML = `<span>${formatViewers(category.viewers)}</span>${eyeIconSVG}`;

                card.appendChild(badge);
                setTimeout(() => badge.classList.add('visible'), 50);
            }
    
            return card;
        };
    
        const updateHomepageCategories = async () => {
            if (!categoriesGrid) return;
    
            try {
                const matchesRes = await fetch(`${API_BASE}/matches/live`);
                if (!matchesRes.ok) throw new Error('Failed to fetch live matches');
                const liveMatches = await matchesRes.json();
    
                if (liveMatches.length === 0) {
                    console.log("No live matches currently. Displaying default order.");
                    return;
                }
    
                const streamFetchPromises = liveMatches.flatMap(match =>
                    match.sources.map(source =>
                        fetch(`${API_BASE}/stream/${source.source}/${source.id}`)
                            .then(res => res.ok ? res.json() : [])
                            .then(streams => ({ category: match.category, streams }))
                    )
                );
    
                const results = await Promise.allSettled(streamFetchPromises);
    
                const viewerCounts = {};
                const categoryMapping = { 'mma': 'fight', 'boxing': 'fight' };
    
                results.forEach(result => {
                    if (result.status === 'fulfilled' && result.value) {
                        let { category, streams } = result.value;
                        const mappedCategory = categoryMapping[category] || category;
    
                        if (!viewerCounts[mappedCategory]) viewerCounts[mappedCategory] = 0;
                        
                        streams.forEach(stream => {
                            if (stream.viewers && typeof stream.viewers === 'number') {
                                viewerCounts[mappedCategory] += stream.viewers;
                            }
                        });
                    }
                });
    
                const dynamicCategoryData = staticCategoryData.map(category => ({
                    ...category,
                    viewers: viewerCounts[category.key] || 0
                }));
    
                dynamicCategoryData.sort((a, b) => b.viewers - a.viewers);
    
                categoriesGrid.innerHTML = ''; // Clear existing static cards
                dynamicCategoryData.forEach((category, index) => {
                    const card = createCategoryCard(category);
                    if (index < 4) { // Eager load the top categories for performance
                        const img = card.querySelector('img');
                        if(img) {
                           img.loading = 'eager';
                           img.fetchPriority = 'high';
                        }
                    }
                    categoriesGrid.appendChild(card);
                });
    
            } catch (error) {
                console.error("Error updating live categories:", error);
                // If an error occurs, the original static HTML will remain as a fallback.
            }
        };
    
        updateHomepageCategories();
    
    })();

});

