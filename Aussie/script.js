const apiURL = "https://topembed.pw/api.php?format=json";
const matchesBody = document.getElementById("matches-body");
const matchesTable = document.getElementById("matches-table");
const loadingDiv = document.getElementById("loading");

// Keyword filter
const keyword = "Aussie"; // Change as needed
const now = Math.floor(Date.now() / 1000); // Current timestamp in seconds
const cutoff = 6 * 60 * 60; // 6 hours

// Show loader initially
loadingDiv.style.display = "block";
matchesTable.style.display = "none";

function formatTime(unix) {
  const date = new Date(unix * 1000);
  return date.toLocaleString(undefined, {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true
  });
}

fetch(apiURL)
  .then(res => res.json())
  .then(data => {
    let count = 0;

    // Safety: ensure data.events exists
    if (!data || !data.events) {
      loadingDiv.innerHTML = `<p style="color:red;">⚠ No data returned</p>`;
      return;
    }

    for (const date in data.events) {
      const events = data.events[date];
      if (!Array.isArray(events)) continue;

      events.forEach((event, idx) => {
        // Keyword filter (case-insensitive)
        const keywordMatch =
          (event.sport && event.sport.toLowerCase().includes(keyword.toLowerCase())) ||
          (event.tournament && event.tournament.toLowerCase().includes(keyword.toLowerCase()));

        // Time filter: show upcoming or started within last 6 hours
        const timeMatch = (event.unix_timestamp || 0) + cutoff > now;

        if (keywordMatch && timeMatch) {
          const linkHref = `https://arkhanrimu.github.io/sportsurgelive/?id=${event.unix_timestamp}_${idx}`;

          // Build row with countdown span + hidden watch link
          const tr = document.createElement("tr");
          tr.innerHTML = `
            <td>${formatTime(event.unix_timestamp)}</td>
            <td>${event.sport || "-"}</td>
            <td>${event.tournament || "-"}</td>
            <td>${event.match || "-"}</td>
            <td class="watch-cell">
              <span class="countdown">Watch in 10s</span>
              <a class="watch-btn hidden" target="_blank" rel="nofollow noopener noreferrer" href="${linkHref}">Watch</a>
            </td>
          `;

          matchesBody.appendChild(tr);
          count++;

          // Start countdown for this row (does NOT block showing table)
          const countdownEl = tr.querySelector(".countdown");
          const linkEl = tr.querySelector("a.watch-btn");

          // Start at 10 seconds visible to user
          let seconds = 10;
          countdownEl.textContent = `Watch in ${seconds}s`;

          const interval = setInterval(() => {
            seconds--;
            if (seconds > 0) {
              countdownEl.textContent = `Watch in ${seconds}s`;
            } else {
              clearInterval(interval);
              // Remove countdown text and reveal the link (so only the button remains)
              countdownEl.remove();
              linkEl.classList.remove("hidden");
            }
          }, 1000);
        }
      });
    }

    // Hide loader and show table
    loadingDiv.style.display = "none";
    matchesTable.style.display = count > 0 ? "table" : "none";

    if (count === 0) {
      matchesBody.innerHTML = `<tr><td colspan="5">⚠ No matches available.</td></tr>`;
      matchesTable.style.display = "table";
    }
  })
  .catch(err => {
    loadingDiv.innerHTML = `<p style="color:red;">⚠ Error loading matches</p>`;
    console.error(err);
  });


