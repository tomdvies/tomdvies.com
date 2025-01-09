
// Configuration
const HOVER_THRESHOLD = 100; // Distance in pixels to trigger preload
let preloadedUrls = new Set();

// Logging function
function logPreload(action, url) {
    console.log(`[Preload] ${action}: ${url}`);
}

// Preload function
function preloadLink(url) {
    if (preloadedUrls.has(url)) {
        logPreload('Already preloaded', url);
        return;
    }

    // Create preload link
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'document';
    link.href = url;
    document.head.appendChild(link);
    
    // Create prerender link
    const prerenderLink = document.createElement('link');
    prerenderLink.rel = 'prerender';
    prerenderLink.href = url;
    document.head.appendChild(prerenderLink);

    preloadedUrls.add(url);
    logPreload('Preloaded and prerendered', url);
}

// Check if mouse is near a link
function isNearLink(event, link) {
    const rect = link.getBoundingClientRect();
    const mouseX = event.clientX;
    const mouseY = event.clientY;
    
    const distance = Math.sqrt(
        Math.pow(mouseX - (rect.left + rect.width/2), 2) +
        Math.pow(mouseY - (rect.top + rect.height/2), 2)
    );
    
    return distance <= HOVER_THRESHOLD;
}

// Initialize preload functionality
document.addEventListener('DOMContentLoaded', () => {
    logPreload('Initializing', 'preload system');
    
    // Track mouse movement
    document.addEventListener('mousemove', (e) => {
        const links = document.getElementsByTagName('a');
        
        for (const link of links) {
            if (isNearLink(e, link) && link.href) {
                // Don't preload if it's an anchor link or javascript: link
                if (!link.href.startsWith('javascript:') && !link.href.includes('#')) {
                    preloadLink(link.href);
                }
            }
        }
    });
    
    // Also preload on touch for mobile devices
    document.addEventListener('touchstart', (e) => {
        const touch = e.touches[0];
        const element = document.elementFromPoint(touch.clientX, touch.clientY);
        
        if (element && element.tagName === 'A' && element.href) {
            if (!element.href.startsWith('javascript:') && !element.href.includes('#')) {
                preloadLink(element.href);
            }
        }
    });
});
