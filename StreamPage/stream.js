const apiURL = "https://topembed.pw/api.php?format=json";

const playerFrame = document.getElementById("playerFrame");
const channelsListEl = document.getElementById("channelsList");
const matchTitleEl = document.getElementById("matchTitle");
const matchStatusEl = document.getElementById("matchStatus");
const streamStatus = document.getElementById("streamStatus");

// Format helpers
function formatLocalFromUnix(unix) {
  return new Date(unix * 1000).toLocaleString(undefined, {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function formatCountdown(ms) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${hours}H ${minutes}M ${seconds}S`;
}

// Get match id from URL
const urlParams = new URLSearchParams(window.location.search);
const matchId = urlParams.get("id");

if (!matchId) {
  streamStatus.textContent = "⚠ No match ID provided.";
} else {
  fetch(apiURL)
    .then(res => res.json())
    .then(data => {
      let foundMatch = null;

      // Find the match by ID
      for (const date in data.events) {
        data.events[date].forEach((event, idx) => {
          const id = `${event.unix_timestamp}_${idx}`;
          if (id === matchId) {
            foundMatch = event;
          }
        });
      }

      if (!foundMatch) {
        streamStatus.textContent = "⚠ Match not found.";
        return;
      }

      // Set match title
      matchTitleEl.textContent = foundMatch.match || "Match";

      // Handle status + countdown
      const start = foundMatch.unix_timestamp * 1000;
      const end = start + 150 * 60 * 1000;

      function updateStatus() {
        const now = Date.now();
        if (now >= end) {
          matchStatusEl.innerHTML = `<span class="status-badge status-finished">Finished</span>`;
        } else if (now >= start) {
          matchStatusEl.innerHTML = `<span class="status-badge status-running">Live</span> (Started: ${formatLocalFromUnix(foundMatch.unix_timestamp)})`;
        } else {
          const countdown = formatCountdown(start - now);
          matchStatusEl.innerHTML = `Upcoming — Start: ${formatLocalFromUnix(foundMatch.unix_timestamp)} <br> ⏳ ${countdown}`;
        }
      }

      updateStatus();
      setInterval(updateStatus, 1000);

      // Render channels
      channelsListEl.innerHTML = "";
      if (foundMatch.channels && Array.isArray(foundMatch.channels) && foundMatch.channels.length > 0) {
        foundMatch.channels.forEach((url, i) => {
          const btn = document.createElement("button");
          btn.className = "channel-btn";
          btn.textContent = `Channel ${i + 1}`;
          btn.addEventListener("click", () => {
            Array.from(channelsListEl.children).forEach(el => el.classList.remove("active"));
            btn.classList.add("active");
            playerFrame.src = url;
            streamStatus.textContent = `Loaded channel ${i + 1}`;
          });
          channelsListEl.appendChild(btn);
        });

        // Optional improvement: set first channel as active immediately
        const firstBtn = channelsListEl.firstChild;
        firstBtn.classList.add("active");
        playerFrame.src = foundMatch.channels[0];
        streamStatus.textContent = `Loaded channel 1`;

      } else {
        streamStatus.textContent = "⚠ No streaming channels available.";
      }

    })
    .catch(err => {
      console.error(err);
      streamStatus.textContent = "⚠ Error loading match.";
    });
}
