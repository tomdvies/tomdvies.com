// Track which URLs have been preloaded to avoid duplicates
const preloadedUrls = new Set();

// Check if we're running on localhost
const isLocalhost = window.location.hostname === 'localhost' 
    || window.location.hostname === '127.0.0.1'
    || window.location.protocol === 'file:';

// Logging utility with timestamp
function logPreload(type, url, details = '') {
    const timestamp = new Date().toLocaleTimeString();
    const style = type === 'prerender' ? 'color: #e44d26' : 'color: #4CAF50';
    console.log(
        `%c[${timestamp}] ${type.toUpperCase()}: ${url} ${details}`,
        `${style}; font-weight: bold;`
    );
}

// Function to prerender a link
function prerenderLink(href) {
    if (!href || !href.startsWith(window.location.origin) || preloadedUrls.has(href)) {
        return;
    }

    // Remove any existing prerender for this URL
    const existingPrerender = document.querySelector(`link[rel="prerender"][href="${href}"]`);
    if (existingPrerender) {
        existingPrerender.remove();
    }

    // Create new prerender link
    const prerenderLink = document.createElement('link');
    prerenderLink.rel = 'prerender';
    prerenderLink.href = href;
    
    if (!isLocalhost) {
        prerenderLink.addEventListener('load', () => {
            logPreload('prerender', href, '✓ loaded');
        });
        prerenderLink.addEventListener('error', () => {
            logPreload('prerender', href, '❌ failed');
        });
    } else {
        // For localhost, just assume it worked
        setTimeout(() => {
            logPreload('prerender', href, '? assumed loaded (localhost)');
        }, 100);
    }
    
    document.head.appendChild(prerenderLink);
    preloadedUrls.add(href);
    logPreload('prerender', href, 'started');
}

// Function to handle mouse proximity and hover
function initializeLinkPrerendering() {
    const links = document.querySelectorAll('a[href]');
    
    links.forEach(link => {
        // Prerender on hover
        link.addEventListener('mouseenter', () => {
            logPreload('hover', link.href, 'detected');
            prerenderLink(link.href);
        });

        // Optional: Prerender on mouse getting near the link
        document.addEventListener('mousemove', (e) => {
            const rect = link.getBoundingClientRect();
            const proximity = 50; // Distance in pixels to trigger prerender
            
            // Check if mouse is within proximity distance of the link
            if (e.clientX >= rect.left - proximity &&
                e.clientX <= rect.right + proximity &&
                e.clientY >= rect.top - proximity &&
                e.clientY <= rect.bottom + proximity) {
                logPreload('proximity', link.href, 'detected');
                prerenderLink(link.href);
            }
        }, { passive: true }); // Performance optimization
    });
}

// Basic prefetch for all links initially
function prefetchLinks() {
    const links = document.querySelectorAll('a[href]');
    const domain = window.location.origin;

    links.forEach(link => {
        const href = link.href;
        if (href.startsWith(domain) && !preloadedUrls.has(href)) {
            const prefetchLink = document.createElement('link');
            prefetchLink.rel = 'prefetch';
            prefetchLink.href = href;
            
            if (!isLocalhost) {
                prefetchLink.addEventListener('load', () => {
                    logPreload('prefetch', href, '✓ loaded');
                });
                prefetchLink.addEventListener('error', () => {
                    logPreload('prefetch', href, '❌ failed');
                });
            } else {
                // For localhost, just assume it worked
                setTimeout(() => {
                    logPreload('prefetch', href, '? assumed loaded (localhost)');
                }, 100);
            }
            
            document.head.appendChild(prefetchLink);
            preloadedUrls.add(href);
            logPreload('prefetch', href, 'started');
        }
    });
}

// Initialize everything when the page loads
window.addEventListener('load', () => {
    prefetchLinks(); // First, prefetch all links
    initializeLinkPrerendering(); // Then set up prerendering
});
