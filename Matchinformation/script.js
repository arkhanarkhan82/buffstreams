// =================================================================================
// SCRIPT.JS - Match Information Page (Final Version for Hash-based URLs)
// =================================================================================

// ---------------------------
// GLOBAL CACHE & HELPERS
// ---------------------------
let allMatchesCache = [];
let searchDataFetched = false;

// Reusable card creation for search results
function createMatchCard(match) {
    const card = document.createElement("div");
    card.className = "search-result-item";
    
    const poster = document.createElement("img");
    poster.className = "match-poster";
    poster.src = (match.teams?.home?.badge && match.teams?.away?.badge)
        ? `https://streamed.pk/api/images/poster/${match.teams.home.badge}/${match.teams.away.badge}.webp`
        : "/Fallbackimage.webp";
    poster.alt = match.title || "Match Poster";
    poster.onerror = () => { poster.onerror = null; poster.src = "/Fallbackimage.webp"; };
    
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
    card.addEventListener("click", () => { window.location.href = `?id=${match.id}`; });
    
    return card;
}

function formatDateTime(timestamp) {
    const date = new Date(timestamp), now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    const timeFormat = { hour: "numeric", minute: "2-digit" };
    if (timestamp <= now.getTime()) return { badge: "LIVE", badgeType: "live", meta: date.toLocaleTimeString("en-US", timeFormat) };
    if (isToday) return { badge: date.toLocaleTimeString("en-US", timeFormat), badgeType: "date", meta: "Today" };
    return { badge: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }), badgeType: "date", meta: date.toLocaleTimeString("en-US", timeFormat) };
}

async function fetchSearchData() {
    if (searchDataFetched) return;
    try {
        const res = await fetch("https://streamed.pk/api/matches/all");
        if (!res.ok) throw new Error("Failed to fetch search data");
        const allMatches = await res.json();
        const map = new Map();
        allMatches.forEach(m => map.set(m.id, m));
        allMatchesCache = Array.from(map.values());
        searchDataFetched = true;
    } catch (err) {
        console.error("Error fetching search data:", err);
    }
}

function setupSearch() {
    const searchInput = document.getElementById("search-input");
    const searchOverlay = document.getElementById("search-overlay");
    const overlayInput = document.getElementById("overlay-search-input");
    const overlayResults = document.getElementById("overlay-search-results");
    const searchClose = document.getElementById("search-close");

    const openSearch = () => {
        fetchSearchData();
        searchOverlay.style.display = "flex";
        overlayInput.value = searchInput.value;
        overlayInput.focus();
    };
    
    searchInput.addEventListener("focus", openSearch);
    searchClose.addEventListener("click", () => { searchOverlay.style.display = "none"; });
    searchOverlay.addEventListener("click", (e) => {
        if (!e.target.closest(".search-overlay-content")) searchOverlay.style.display = "none";
    });

    overlayInput.addEventListener("input", function() {
        const q = this.value.trim().toLowerCase();
        overlayResults.innerHTML = "";
        if (!q || !searchDataFetched) return;
        const filtered = allMatchesCache.filter(m => (m.title || "").toLowerCase().includes(q) || (m.teams?.home?.name || "").toLowerCase().includes(q) || (m.teams?.away?.name || "").toLowerCase().includes(q));
        filtered.slice(0, 12).forEach(match => {
            overlayResults.appendChild(createMatchCard(match));
        });
    });

    overlayInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
            const q = overlayInput.value.trim();
            if (q) window.location.href = `../SearchResult/?q=${encodeURIComponent(q)}`;
        }
    });
}

// ---------------------------
// PAGE-SPECIFIC RENDER FUNCTIONS
// ---------------------------
function renderStreamRow(stream, index, matchId, sourceName) {
    const row = document.createElement("a");
    row.className = "stream-row";

    // === THE ONLY CHANGE IS HERE ===
    // Build the new hash-based URL that works on GitHub Pages
    const quality = stream.hd ? 'hd' : 'sd';
    const streamNumber = stream.streamNo;
    row.href = `../Watch/#/${matchId}/${sourceName}/${quality}${streamNumber}`;
    // ===============================
    
    const qualityTagClass = stream.hd ? "hd" : "sd";
    const qualityText = stream.hd ? "HD" : "SD";
    const viewersHTML = stream.viewers > 0 
        ? `<div class="viewers-count"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"></path><circle cx="12" cy="12" r="3"></circle></svg>${stream.viewers}</div>`
        : '';
    const openLinkIcon = `<span class="open-arrow"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg></span>`;
    
    const languageHTML = `<div class="stream-lang"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"></path><path d="M2 12h20"></path></svg>${stream.language || "English"}</div>`;
    
    row.innerHTML = `
        <div class="stream-label">
            <span class="quality-tag ${qualityTagClass}">${qualityText}</span>
            <span>Stream ${index + 1}</span>
            ${openLinkIcon}
        </div>
        <div class="stream-meta">
            ${viewersHTML}
            ${languageHTML}
        </div>`;
    return row;
}

async function renderStreamSource(source, matchId) {
    const sourceMeta = { alpha: "Most reliable (720p 30fps)", charlie: "Good backup", intel: "Large event coverage", admin: "Admin added streams", hotel: "Very high quality feeds", foxtrot: "Good quality, offers home/away feeds", delta: "Reliable backup", echo: "Great quality overall" };
    const description = sourceMeta[source.source.toLowerCase()] || "Reliable streams";
    try {
        const res = await fetch(`https://streamed.pk/api/stream/${source.source}/${source.id}`);
        if (!res.ok) return null;
        let streams = await res.json();
        if (!streams || streams.length === 0) return null;
        
        streams.sort((a, b) => (b.hd - a.hd) || ((b.viewers || 0) - (a.viewers || 0)));
        
        const sourceContainer = document.createElement("div");
        sourceContainer.className = "stream-source";
        sourceContainer.innerHTML = `<div class="source-header"><span class="source-name">${source.source.charAt(0).toUpperCase() + source.source.slice(1)}</span><span class="source-count">${streams.length} streams</span></div><small class="source-desc">✨ ${description}</small>`;
        
        const fragment = document.createDocumentFragment();
        streams.forEach((stream, i) => fragment.appendChild(renderStreamRow(stream, i, matchId, source.source)));
        sourceContainer.appendChild(fragment);
        
        return sourceContainer;
    } catch (err) {
        console.error(err);
        return null;
    }
}

async function loadMatchDetails() {
    const urlParams = new URLSearchParams(window.location.search);
    const matchId = urlParams.get("id");
    
    const titleEl = document.getElementById("match-title");
    const descEl = document.getElementById("match-description");
    const countdownEl = document.getElementById("countdown-section");
    const streamsContainer = document.getElementById("streams-container");
    const showAllBtn = document.getElementById("show-all-sources-btn");
    
    if (!matchId) { titleEl.innerHTML = "Error: Match ID not provided."; return; }
    
    try {
        const res = await fetch("https://streamed.pk/api/matches/all");
        if (!res.ok) throw new Error("Could not fetch match list");
        const allMatches = await res.json();
        const match = allMatches.find(m => String(m.id) === String(matchId));
        if (!match) { throw new Error("Match not found in the list"); }

        const fullTitle = `${match.title} Live Stream Links`;
        document.title = fullTitle;
        titleEl.textContent = fullTitle;
        descEl.textContent = `To watch ${match.title} streams, scroll down and choose a stream link of your choice. If no links appear, the event may not be live yet.`;
        
        const matchDate = Number(match.date);
        if (matchDate > Date.now()) {
            countdownEl.classList.remove("hidden");
            const interval = setInterval(() => {
                const diff = matchDate - Date.now();
                if (diff <= 0) {
                    countdownEl.classList.add("hidden");
                    clearInterval(interval);
                    window.location.reload();
                    return;
                }
                const days = Math.floor(diff / 86400000);
                const hrs = String(Math.floor((diff % 86400000) / 3600000)).padStart(2, "0");
                const mins = String(Math.floor((diff % 3600000) / 60000)).padStart(2, "0");
                const secs = String(Math.floor((diff % 60000) / 1000)).padStart(2, "0");
                const dayString = days > 0 ? `${days} day${days > 1 ? 's' : ''} ` : "";
                countdownEl.textContent = `The event starts in ${dayString}${hrs}:${mins}:${secs}`;
            }, 1000);
        }
        
        const streamsSection = document.getElementById("streams-section");
        const skeletonHeader = streamsSection.querySelector('.skeleton-header');
        if (skeletonHeader) {
            const realHeaderHTML = `
                <button id="back-button" class="back-button-styled">
                    <span>&lt;- BCK</span><span class="separator">•</span><span>Back</span>
                </button>
                <p id="sources-summary"></p>
            `;
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = realHeaderHTML;
            skeletonHeader.replaceWith(...tempDiv.childNodes);

            document.getElementById("back-button").addEventListener("click", () => {
                window.history.length > 1 ? window.history.back() : window.location.href = '../index.html';
            });
        }
        
        streamsContainer.innerHTML = ""; 

        if (match.sources && match.sources.length > 0) {
            const sourcePromises = match.sources.map(source => renderStreamSource(source, match.id));
            const sourceElements = (await Promise.all(sourcePromises)).filter(Boolean);
            const totalSources = sourceElements.length;

            const sourcesSummaryEl = document.getElementById('sources-summary');

            if (totalSources === 0) {
                streamsContainer.innerHTML = `<p class="no-results">No active streams found for this match yet.</p>`;
                if (sourcesSummaryEl) sourcesSummaryEl.textContent = 'No sources available';
                return;
            }

            const INITIAL_SOURCES_TO_SHOW = 3;
            if (sourcesSummaryEl) sourcesSummaryEl.textContent = `Showing top quality sources • ${Math.min(totalSources, INITIAL_SOURCES_TO_SHOW)} of ${totalSources} sources`;
            
            sourceElements.forEach((el, index) => {
                if (index >= INITIAL_SOURCES_TO_SHOW) el.classList.add('hidden-source');
                streamsContainer.appendChild(el);
            });

            if (totalSources > INITIAL_SOURCES_TO_SHOW) {
                const remainingCount = totalSources - INITIAL_SOURCES_TO_SHOW;
                showAllBtn.textContent = `Show all sources (${remainingCount} more) ⌄`;
                showAllBtn.classList.remove('hidden');
                showAllBtn.addEventListener('click', () => {
                    document.querySelectorAll('.hidden-source').forEach(el => el.classList.remove('hidden-source'));
                    showAllBtn.classList.add('hidden');
                    if (sourcesSummaryEl) sourcesSummaryEl.textContent = `Showing all ${totalSources} sources`;
                }, { once: true });
            }
        } else {
            const sourcesSummaryEl = document.getElementById('sources-summary');
            if (sourcesSummaryEl) sourcesSummaryEl.textContent = 'No sources available';
            streamsContainer.innerHTML = `<p class="no-results">Streams will be available shortly before the match begins.</p>`;
        }
    } catch (err) {
        console.error(err);
        titleEl.textContent = "Match Not Found";
        descEl.textContent = "The match you are looking for could not be found. It may have been removed or the ID is incorrect.";
        streamsContainer.innerHTML = '';
        document.querySelector('.skeleton-header')?.remove();
    }
}

// ===================================
// CUSTOM DISCORD WIDGET
// ===================================
async function loadDiscordWidget() {
    const serverId = "1422384816472457288";
    const apiUrl = `https://discord.com/api/guilds/${serverId}/widget.json`;
    
    const onlineCountEl = document.getElementById("discord-online-count");
    const membersListEl = document.getElementById("discord-members-list");
    const joinButton = document.getElementById("discord-join-button");
    const widgetContainer = document.getElementById("discord-widget-container");

    if (!widgetContainer) return;

    try {
        const response = await fetch(apiUrl);
        if (!response.ok) {
            throw new Error('Failed to fetch Discord widget data');
        }
        const data = await response.json();

        // Update online count
        onlineCountEl.textContent = data.presence_count || '0';
        
        // Update join links from API
        const inviteUrl = data.instant_invite;
        if (inviteUrl && joinButton) {
          joinButton.href = inviteUrl;
        }

        // Clear skeleton loaders
        membersListEl.innerHTML = ''; 

        const fragment = document.createDocumentFragment();

        // Populate members list (max 10)
        if (data.members && data.members.length > 0) {
            const membersToShow = data.members.slice(0, 10);
            
            membersToShow.forEach(member => {
                const li = document.createElement('li');
                
                const avatarDiv = document.createElement('div');
                avatarDiv.className = 'member-avatar';
                
                const avatarImg = document.createElement('img');
                avatarImg.src = member.avatar_url;
                avatarImg.alt = member.username;
                
                const onlineIndicator = document.createElement('span');
                onlineIndicator.className = 'online-indicator';
                
                avatarDiv.appendChild(avatarImg);
                avatarDiv.appendChild(onlineIndicator);

                const nameSpan = document.createElement('span');
                nameSpan.className = 'member-name';
                nameSpan.textContent = member.username;

                li.appendChild(avatarDiv);
                li.appendChild(nameSpan);
                fragment.appendChild(li);
            });

        } else {
            const noMembersLi = document.createElement('li');
            noMembersLi.style.color = 'var(--text-secondary)';
            noMembersLi.style.display = 'block';
            noMembersLi.style.textAlign = 'center';
            noMembersLi.textContent = 'No online members to display.';
            fragment.appendChild(noMembersLi);
        }

        // ALWAYS add the "and more..." link if an invite URL exists
        if (inviteUrl) {
            const moreLi = document.createElement('li');
            moreLi.className = 'more-members-link';
            
            const p = document.createElement('p');
            const moreLink = document.createElement('a');
            
            moreLink.href = inviteUrl;
            moreLink.target = '_blank';
            moreLink.rel = 'noopener noreferrer';
            moreLink.textContent = 'Discord!';

            p.append('and more in our ', moreLink);
            moreLi.appendChild(p);
            fragment.appendChild(moreLi);
        }

        membersListEl.appendChild(fragment);

    } catch (error) {
        console.error("Error loading Discord widget:", error);
        if (widgetContainer) {
            widgetContainer.innerHTML = '<p style="text-align: center; color: var(--text-secondary);">Could not load Discord widget.</p>';
        }
    }
}

// ---------------------------
// INITIALIZE PAGE
// ---------------------------
document.addEventListener("DOMContentLoaded", () => {
    loadMatchDetails();
    setupSearch(); 
    loadDiscordWidget();
});

