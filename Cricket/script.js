const apiURL = "https://topembed.pw/api.php?format=json";
const matchesBody = document.getElementById("matches-body");
const matchesTable = document.getElementById("matches-table");
const loadingDiv = document.getElementById("loading");

// Keyword filter
const keyword = "Cricket"; // Change as needed
const now = Math.floor(Date.now() / 1000); // Current timestamp in seconds
const cutoff = 6 * 60 * 60; // 6 hours

// Show loader initially
loadingDiv.style.display = "block";
matchesTable.style.display = "none";

function formatTime(unix) {
  const date = new Date(unix * 1000);
  return date.toLocaleString(undefined, {
    weekday: "short",
   
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
    let allMatches = [];
    let liveCount = 0;

    for (const date in data.events) {
      data.events[date].forEach((event, idx) => {
        const matchTime = event.unix_timestamp;
        const diffMinutes = (now - matchTime) / 60;

        // ✅ Apply keyword filter (case-insensitive)
        const keywordMatch =
          (event.sport && event.sport.toLowerCase().includes(keyword.toLowerCase())) ||
          (event.tournament && event.tournament.toLowerCase().includes(keyword.toLowerCase()));

        if (!keywordMatch) return; // skip non-matching sports/tournaments

        // ✅ Apply time cutoff (don’t show matches older than 180 min)
        if (diffMinutes >= 180) return;

        let status = "";
        if (diffMinutes >= 150) status = "finished";
        else if (diffMinutes >= 0 && diffMinutes < 150) {
          status = "live";
          liveCount++;
        } else {
          status = "upcoming";
        }

        allMatches.push({
          time: formatTime(matchTime),
          sport: event.sport || "-",
          tournament: event.tournament || "-",
          match: event.match || "-",
          status,
          url: `/StreamPage/?id=${event.unix_timestamp}_${idx}`
        });
      });
    }

    // Update live count in button
    document.getElementById("live-count").textContent = liveCount;

    // ✅ Same render + filter functions as before...
    function renderMatches(filter) {
      matchesBody.innerHTML = "";
      let filtered = allMatches.filter(m => filter === "all" || m.status === filter);

      if (filtered.length === 0) {
        matchesBody.innerHTML = `<tr><td colspan="5">⚠ No matches available.</td></tr>`;
      } else {
        filtered.forEach(m => {
          const badge =
            m.status === "finished"
              ? `<span class="badge finished"></span>`
              : m.status === "live"
              ? `<span class="badge live"></span>`
              : "";

          const row = document.createElement("tr");
          row.innerHTML = `
            <td>${m.time}</td>
            <td>${m.sport}</td>
            <td>${m.tournament}</td>
            <td>${m.match} ${badge}</td>
            <td><a class="watch-btn" href="${m.url}">Watch</a></td>
          `;
          matchesBody.appendChild(row);
        });
      }
      matchesTable.style.display = "table";
    }

    // Initial render (All)
    renderMatches("all");

    // Button events
    document.getElementById("all-btn").addEventListener("click", () => {
      setActive("all-btn");
      renderMatches("all");
    });

    document.getElementById("live-btn").addEventListener("click", () => {
      setActive("live-btn");
      renderMatches("live");
    });

    document.getElementById("upcoming-btn").addEventListener("click", () => {
      setActive("upcoming-btn");
      renderMatches("upcoming");
    });

    function setActive(id) {
      document.querySelectorAll(".filter-btn").forEach(btn => btn.classList.remove("active"));
      document.getElementById(id).classList.add("active");
    }

    // Hide loader
    loadingDiv.style.display = "none";
  })
  .catch(err => {
    loadingDiv.innerHTML = `<p style="color:red;">⚠ Error loading matches</p>`;
    console.error(err);
  });










