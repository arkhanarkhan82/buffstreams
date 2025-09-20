const apiURL = "https://topembed.pw/api.php?format=json";
const matchesBody = document.getElementById("matches-body");
const matchesTable = document.getElementById("matches-table");
const loadingDiv = document.getElementById("loading");

// Keyword filter
const keyword = "NCAA"; // Change as needed
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

    for (const date in data.events) {
      data.events[date].forEach((event, idx) => {
        // Keyword filter (case-insensitive)
        const keywordMatch =
          (event.sport && event.sport.toLowerCase().includes(keyword.toLowerCase())) ||
          (event.tournament && event.tournament.toLowerCase().includes(keyword.toLowerCase()));

        // Time filter: show upcoming or started within last 6 hours
        const timeMatch = event.unix_timestamp + cutoff > now;

        if (keywordMatch && timeMatch) {
          const row = document.createElement("tr");

          row.innerHTML = `
            <td>${formatTime(event.unix_timestamp)}</td>
            <td>${event.sport || "-"}</td>
            <td>${event.tournament || "-"}</td>
            <td>${event.match || "-"}</td>
            <td>
              <a class="watch-btn" target="_blank"
                 href="https://arkhan648.github.io/buffstreamslive/?id=${event.unix_timestamp}_${idx}">
                 Watch
              </a>
            </td>
          `;
          matchesBody.appendChild(row);
          count++;
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

