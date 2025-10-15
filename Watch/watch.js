// =================================================================================
// WATCH.JS - Watch Page Logic (Final Corrected and Complete Version)
// =================================================================================

// ---------------------------
// GLOBAL CACHE & HELPERS
// ---------------------------
let allMatchesCache = [];
let searchDataFetched = false;

function createMatchCard(match) {
    const card = document.createElement("div");
    card.className = "search-result-item";
    const poster = document.createElement("img");
    poster.className = "match-poster";
    poster.src = (match.teams?.home?.badge && match.teams?.away?.badge) ? `https://streamed.pk/api/images/poster/${match.teams.home.badge}/${match.teams.away.badge}.webp` : "/Fallbackimage.webp";
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
    card.addEventListener("click", () => { window.location.href = `../Matchinformation/?id=${match.id}`; });
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
    } catch (err) { console.error("Error fetching search data:", err); }
}
function setupSearch() {
    const searchInput = document.getElementById("search-input");
    const searchOverlay = document.getElementById("search-overlay");
    const overlayInput = document.getElementById("overlay-search-input");
    const overlayResults = document.getElementById("overlay-search-results");
    const searchClose = document.getElementById("search-close");
    const openSearch = () => { fetchSearchData(); searchOverlay.style.display = "flex"; overlayInput.value = searchInput.value; overlayInput.focus(); };
    searchInput.addEventListener("focus", openSearch);
    searchClose.addEventListener("click", () => { searchOverlay.style.display = "none"; });
    searchOverlay.addEventListener("click", (e) => { if (!e.target.closest(".search-overlay-content")) searchOverlay.style.display = "none"; });
    overlayInput.addEventListener("input", function() {
        const q = this.value.trim().toLowerCase();
        overlayResults.innerHTML = "";
        if (!q || !searchDataFetched) return;
        const filtered = allMatchesCache.filter(m => (m.title || "").toLowerCase().includes(q) || (m.teams?.home?.name || "").toLowerCase().includes(q) || (m.teams?.away?.name || "").toLowerCase().includes(q));
        filtered.slice(0, 12).forEach(match => { overlayResults.appendChild(createMatchCard(match)); });
    });
    overlayInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
            const q = overlayInput.value.trim();
            if (q) window.location.href = `../SearchResult/?q=${encodeURIComponent(q)}`;
        }
    });
}

// ---------------------------
// PAGE-SPECIFIC LOGIC
// ---------------------------

function parseUrlFromHash() {
    const hash = window.location.hash.substring(1); 
    if (!hash) return null;

    const pathParts = hash.replace(/^\//, '').split('/');
    if (pathParts.length < 3) return null;

    const [matchId, sourceName, streamIdentifier] = pathParts;
    const quality = streamIdentifier.substring(0, 2);
    const streamNumber = parseInt(streamIdentifier.substring(2), 10);

    if (!matchId || !sourceName || !['hd', 'sd'].includes(quality) || isNaN(streamNumber)) {
        return null;
    }
    return { matchId, sourceName, quality, streamNumber };
}

function renderStreamRow(stream, index, match, activeStream) {
    if (!activeStream) activeStream = {};

	const isActive =
    stream.source === activeStream.source &&
    (stream.hd ? 'hd' : 'sd') === (activeStream.hd ? 'hd' : 'sd') &&
    stream.streamNo === activeStream.streamNo;

    const row = isActive ? document.createElement("div") : document.createElement("a");
    
    row.className = "stream-row";
    if (isActive) {
        row.classList.add("active");
    } else {
        const quality = stream.hd ? 'hd' : 'sd';
        row.href = `#/${match.id}/${stream.source}/${quality}${stream.streamNo}`;
    }

    const qualityTagClass = stream.hd ? "hd" : "sd";
    const qualityText = stream.hd ? "HD" : "SD";
    const viewersHTML = stream.viewers > 0 ? `<div class="viewers-count"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"></path><circle cx="12" cy="12" r="3"></circle></svg>${stream.viewers}</div>` : '';
    const languageHTML = `<div class="stream-lang"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"></path><path d="M2 12h20"></path></svg>${stream.language || "English"}</div>`;
    const statusIcon = isActive ? `<span class="status-running">Running</span>` : `<span class="open-arrow"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg></span>`;

    row.innerHTML = `
        <div class="stream-label">
            <span class="quality-tag ${qualityTagClass}">${qualityText}</span>
            <span>Stream ${index + 1}</span>
            ${statusIcon}
        </div>
        <div class="stream-meta">
            ${viewersHTML}
            ${languageHTML}
        </div>`;
    return row;
}

async function renderStreamSource(source, match, activeStream) {
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
        if (streams.some(s => s.id === activeStream.id)) {
            sourceContainer.dataset.containsActive = "true";
        }

        sourceContainer.innerHTML = `<div class="source-header"><span class="source-name">${source.source.charAt(0).toUpperCase() + source.source.slice(1)}</span><span class="source-count">${streams.length} streams</span></div><small class="source-desc">✨ ${description}</small>`;
        
        const fragment = document.createDocumentFragment();
        streams.forEach((stream, i) => fragment.appendChild(renderStreamRow(stream, i, match, activeStream)));
        sourceContainer.appendChild(fragment);
        
        return sourceContainer;
    } catch (err) { 
        console.error(`Error fetching source ${source.source}:`, err);
        return null; 
    }
}

async function initializeWatchPage() {
    const urlData = parseUrlFromHash();

    const titleEl = document.getElementById("watch-title");
    const descEl = document.getElementById("watch-description");
    const playerEl = document.getElementById("stream-player");
    const playerContainerEl = document.getElementById("stream-player-container");
    const streamsContainer = document.getElementById("streams-container");
    const sourcesSummaryEl = document.getElementById('sources-summary');
    const showAllBtn = document.getElementById("show-all-sources-btn");
    
    if (!urlData) {
        titleEl.textContent = "Error: Invalid Stream Link";
        descEl.textContent = "Please select a stream from a match page.";
        document.querySelectorAll('.skeleton').forEach(el => el.classList.remove('skeleton'));
        playerContainerEl.innerHTML = `<div class="error-message">Invalid stream URL hash.</div>`;
        document.getElementById("back-button").addEventListener("click", () => { window.history.back(); });
        return;
    }

    const { matchId } = urlData;
    
    document.getElementById("back-button").onclick = () => {
        window.location.href = `../Matchinformation/?id=${matchId}`;
    };

    titleEl.textContent = '';
    descEl.textContent = '';
    titleEl.classList.add('skeleton');
    descEl.classList.add('skeleton');
    playerContainerEl.classList.add('skeleton');
    playerEl.src = 'about:blank';
    streamsContainer.innerHTML = '<div class="stream-source is-loading"><div class="source-header"><span class="source-name">&nbsp;</span><span class="source-count">&nbsp;</span></div><small class="source-desc">&nbsp;</small><div class="stream-row"></div><div class="stream-row"></div></div>';
    sourcesSummaryEl.textContent = '';
    sourcesSummaryEl.classList.add('skeleton');

    try {
        const { sourceName, quality, streamNumber } = urlData;

        const res = await fetch("https://streamed.pk/api/matches/all");
        if (!res.ok) throw new Error("Could not fetch match list");
        const allMatches = await res.json();
        const match = allMatches.find(m => String(m.id) === String(matchId));
        if (!match) throw new Error("Match not found");

        const sourceForStream = match.sources.find(s => s.source === sourceName);
        if (!sourceForStream) throw new Error("Source not found for this match");

        const streamRes = await fetch(`https://streamed.pk/api/stream/${sourceForStream.source}/${sourceForStream.id}`);
        if (!streamRes.ok) throw new Error(`Could not fetch streams from source: ${sourceName}`);
        
        const streams = await streamRes.json();
        const activeStream = streams.find(s => (s.hd ? 'hd' : 'sd') === quality && s.streamNo === streamNumber);
        if (!activeStream) throw new Error("Stream not found.");

        document.querySelectorAll('.skeleton').forEach(el => el.classList.remove('skeleton'));
        
		
        const qualityLabel = activeStream.hd ? "HD" : "SD";
const pageTitle = `Live ${match.title} Stream Link (${activeStream.source.charAt(0).toUpperCase() + activeStream.source.slice(1)} ${qualityLabel} ${activeStream.streamNo})`;
document.title = pageTitle;
titleEl.textContent = pageTitle;

        descEl.textContent = `${match.title} live on nflbite.top. Join the stream and chat with others in our live chat!`;
        playerEl.src = activeStream.embedUrl;

        streamsContainer.innerHTML = "";

        if (match.sources && match.sources.length > 0) {
            const sourcePromises = match.sources.map(source => renderStreamSource(source, match, activeStream));
            const sourceElements = (await Promise.all(sourcePromises)).filter(Boolean);
            const totalSources = sourceElements.length;

            if (totalSources === 0) {
                streamsContainer.innerHTML = `<p class="no-results">No other active streams found.</p>`;
                sourcesSummaryEl.textContent = 'No other sources available';
                return;
            }
            
            const INITIAL_SOURCES_TO_SHOW = 3;
            const activeSourceIndex = sourceElements.findIndex(el => el.dataset.containsActive === "true");
            const showAllInitially = activeSourceIndex !== -1 && activeSourceIndex >= INITIAL_SOURCES_TO_SHOW;

            if (showAllInitially) {
                sourceElements.forEach(el => streamsContainer.appendChild(el));
                sourcesSummaryEl.textContent = `Showing all ${totalSources} sources`;
                showAllBtn.classList.add('hidden');
            } else {
                sourceElements.forEach((el, index) => {
                    if (index >= INITIAL_SOURCES_TO_SHOW) el.classList.add('hidden-source');
                    streamsContainer.appendChild(el);
                });
                if (totalSources > INITIAL_SOURCES_TO_SHOW) {
                    const remainingCount = totalSources - INITIAL_SOURCES_TO_SHOW;
                    showAllBtn.textContent = `Show all sources (${remainingCount} more) ⌄`;
                    showAllBtn.classList.remove('hidden');
                    sourcesSummaryEl.textContent = `Showing top quality sources • ${INITIAL_SOURCES_TO_SHOW} of ${totalSources} sources`;
                    showAllBtn.addEventListener('click', () => {
                        document.querySelectorAll('.hidden-source').forEach(el => el.classList.remove('hidden-source'));
                        showAllBtn.classList.add('hidden');
                        sourcesSummaryEl.textContent = `Showing all ${totalSources} sources`;
                    }, { once: true });
                } else {
                    sourcesSummaryEl.textContent = `Showing all ${totalSources} sources`;
                }
            }
        } else {
            sourcesSummaryEl.textContent = 'No sources available';
            streamsContainer.innerHTML = `<p class="no-results">No stream sources found for this match.</p>`;
        }
    } catch (err) {
        console.error("Error loading watch page:", err);
        titleEl.textContent = "Error Loading Stream";
        descEl.textContent = `An error occurred: ${err.message}.`;
        playerContainerEl.innerHTML = `<div class="error-message">${err.message}</div>`;
        document.querySelectorAll('.skeleton').forEach(el => el.classList.remove('skeleton'));
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

        onlineCountEl.textContent = data.presence_count || '0';
        
        const inviteUrl = data.instant_invite;
        if (inviteUrl && joinButton) {
          joinButton.href = inviteUrl;
        }

        membersListEl.innerHTML = ''; 

        const fragment = document.createDocumentFragment();

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

document.addEventListener("DOMContentLoaded", () => {
    initializeWatchPage();
    setupSearch(); 
    loadDiscordWidget();
});


window.addEventListener('hashchange', initializeWatchPage);
