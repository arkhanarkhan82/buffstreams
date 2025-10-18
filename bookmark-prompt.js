// ==================================================
// Universal Bookmark / Add-to-Home Prompt (Revised & Fixed)
// ==================================================

(function() {
  // === CONFIG ===
  const SHOW_DELAY = 3000; // 3 seconds
  const STORAGE_KEY = 'bookmarkPromptDate';
  const TODAY = new Date().toDateString();

  let deferredPrompt;

  // === Detect if already added to home screen (mobile) ===
  const isStandalone =
    window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone;

  // === Detect mobile devices ===
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);

  // === If already added or already shown today, skip ===
  if (isStandalone) return;
  if (localStorage.getItem(STORAGE_KEY) === TODAY) return;

  // Listen for the beforeinstallprompt event.
  // This event will only fire if the site is PWA-ready.
  window.addEventListener('beforeinstallprompt', (e) => {
    // Prevent the default browser install prompt from showing.
    e.preventDefault();
    // Stash the event so it can be triggered later by our custom button.
    deferredPrompt = e;
  });

  // === Wait until page fully loaded, then delay ===
  window.addEventListener('load', () => {
    setTimeout(() => {
      // The logic is simplified: just show the prompt if the initial checks passed.
      showBookmarkPrompt();
    }, SHOW_DELAY);
  });

  // === Core Function ===
  function showBookmarkPrompt() {
    // Create overlay container
    const container = document.createElement('div');
    container.id = 'bookmark-prompt-container';
    
    let title = 'Bookmark This Site';
    let message = 'Press <b>Ctrl + D</b> (or click the ⭐ beside the address bar) to bookmark this site.';

    if (isMobile) {
      if (isIOS) {
        title = 'Add to Home Screen';
        message = 'For quick access, tap the Share button and then \'Add to Home Screen\'.';
      } else {
        title = 'Add to Home Screen';
        message = 'Add this website to your home screen for quick and easy access.';
      }
    }

    container.innerHTML = `
      <div class="bookmark-prompt">
        <button class="bookmark-close" aria-label="Close">&times;</button>
        <div class="bookmark-content">
          <h3 class="bookmark-title">${title}</h3>
          <p class="bookmark-message">${message}</p>
          <button class="bookmark-ok">Okay</button>
        </div>
      </div>
    `;
    document.body.appendChild(container);

    // === Event Listeners ===
    const closeBtn = container.querySelector('.bookmark-close');
    const okBtn = container.querySelector('.bookmark-ok');

    // The close button just hides the prompt
    closeBtn.addEventListener('click', hidePrompt);

    // The "Okay" button has the special logic
    okBtn.addEventListener('click', () => {
      // On non-iOS mobile, if the browser's install prompt is available, show it
      if (isMobile && !isIOS && deferredPrompt) {
        deferredPrompt.prompt();
        // We can listen for the user's choice
        deferredPrompt.userChoice.then((choiceResult) => {
          if (choiceResult.outcome === 'accepted') {
            console.log('User accepted the Add to Home Screen prompt');
          } else {
            console.log('User dismissed the Add to Home Screen prompt');
          }
          deferredPrompt = null; // The prompt can only be used once.
        });
      }
      
      // No matter what, hide our custom prompt after clicking "Okay"
      hidePrompt();
    });

    // === Hide Function ===
    function hidePrompt() {
      container.classList.add('hide');
      setTimeout(() => container.remove(), 300);
      localStorage.setItem(STORAGE_KEY, TODAY);
    }
  }

  // === Styles === (No changes needed here)
  const style = document.createElement('style');
  style.textContent = `
    /* === Universal Bookmark Prompt Styles === */
    #bookmark-prompt-container {
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 99999;
      font-family: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
      animation: fadeIn 0.4s ease;
    }
    .bookmark-prompt {
      background: #ffffffee;
      color: #222;
      border-radius: 14px;
      box-shadow: 0 6px 24px rgba(0,0,0,0.15);
      width: 320px;
      max-width: 90vw;
      padding: 16px 20px;
      position: relative;
      backdrop-filter: blur(8px);
      transition: transform 0.3s ease, opacity 0.3s ease;
    }
    .bookmark-prompt.hide {
      opacity: 0;
      transform: translateY(-10px);
    }
    .bookmark-close {
      position: absolute;
      top: 8px;
      right: 10px;
      border: none;
      background: none;
      font-size: 22px;
      color: #777;
      cursor: pointer;
      transition: color 0.2s ease;
    }
    .bookmark-close:hover {
      color: #000;
    }
    .bookmark-title {
      font-size: 17px;
      font-weight: 600;
      margin: 0 0 6px 0;
    }
    .bookmark-message {
      font-size: 14px;
      line-height: 1.5;
      color: #444;
      margin-bottom: 12px;
    }
    .bookmark-ok {
      background: linear-gradient(135deg, #0078ff, #00c3ff);
      color: white;
      border: none;
      border-radius: 8px;
      padding: 8px 18px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.3s ease, transform 0.2s ease;
    }
    .bookmark-ok:hover {
      background: linear-gradient(135deg, #006ae0, #00aee0);
      transform: translateY(-1px);
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(-8px); }
      to { opacity: 1; transform: translateY(0); }
    }

    @media (max-width: 480px) {
      #bookmark-prompt-container {
        right: 10px;
        left: 10px;
      }
      .bookmark-prompt {
        width: auto;
      }
    }
  `;
  document.head.appendChild(style);
})();
