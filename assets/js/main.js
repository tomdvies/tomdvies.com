
function loadCSS() {
    const aspectRatio = window.innerWidth / window.innerHeight;
    const isMobile = aspectRatio <= 0.65; // ratio <= 1 means taller than wide (portrait)
    // Use the global variables set by Hugo in head
    const newPath = isMobile ? mobileCssPath : mainCssPath;
    console.log(`Aspect ratio: ${aspectRatio.toFixed(2)} (${window.innerWidth}x${window.innerHeight})`);
    
    let currentCSS = document.getElementById('dynamic-css');
    
    // If the current CSS file is already the one we want, do nothing
    if (currentCSS && currentCSS.href.endsWith(newPath)) {
        return;
    }
    
    // Create new link element
    const link = document.createElement('link');
    link.id = 'dynamic-css';
    link.rel = 'stylesheet';
    link.type = 'text/css';
    link.href = newPath;
    
    // Add new CSS file first
    document.head.appendChild(link);
    
    // Remove old CSS file after new one is loaded
    if (currentCSS) {
        link.onload = () => {
            console.log(`Aspect ratio: ${aspectRatio.toFixed(2)} (${window.innerWidth}x${window.innerHeight}) blah`);
            currentCSS.remove();
        };
    }
}

// Load appropriate CSS on page load
document.addEventListener('DOMContentLoaded', loadCSS);

// Recheck on window resize
let resizeTimer;
window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(loadCSS, 250);
});
