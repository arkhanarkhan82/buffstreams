// mobiledetectscript.js

// Function to check if it's a mobile device (not a tablet)
function isMobileDevice() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) && window.innerWidth <= 768;
}

// Function to check for WebView
function isWebView() {
    const ua = navigator.userAgent || navigator.vendor || window.opera;
    const isAndroidWebView = (ua.includes("Android") && ua.includes("wv"));
    const isIOSWebView = (ua.includes("iPhone") || ua.includes("iPad") || ua.includes("iPod")) && !ua.includes("Safari");
    return isAndroidWebView || isIOSWebView;
}

// Run when the DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    const adPlaceholder = document.getElementById('sticky-ad-placeholder');
    const closeAdButton = document.getElementById('close-ad');

    if (adPlaceholder && closeAdButton) {
        // Show the ad placeholder ONLY on mobile devices and NOT in a WebView
        if (isMobileDevice() && !isWebView()) {
            adPlaceholder.classList.add('is-mobile');
        }

        // Close Button functionality
        closeAdButton.onclick = (e) => {
            e.stopPropagation();
            adPlaceholder.style.display = 'none'; // Hide the placeholder
        };
    }
});
