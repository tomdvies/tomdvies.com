
/**
 * Advanced Link Preloader
 * Preloads pages when mouse approaches links and caches them for instant access
 */
class LinkPreloader {
    constructor(options = {}) {
        this.HOVER_THRESHOLD = options.hoverThreshold || 100;
        this.CACHE_NAME = 'page-cache';
        this.preloadedUrls = new Set();
        this.initialized = false;
    }

    log(action, url) {
        console.log(`[Preload] ${action}: ${url}`);
    }

    async preloadUrl(url) {
        if (this.preloadedUrls.has(url)) {
            this.log('Already preloaded', url);
            return;
        }

        try {
            const response = await fetch(url, {
                method: 'GET',
                mode: 'cors',
                credentials: 'same-origin'
            });

            if (!response.ok) throw new Error(`HTTP ${response.status}`);

            // Store in browser's cache
            const cache = await caches.open(this.CACHE_NAME);
            await cache.put(url, response.clone());

            // Add prerender hint
            const prerenderLink = document.createElement('link');
            prerenderLink.rel = 'prerender';
            prerenderLink.href = url;
            document.head.appendChild(prerenderLink);

            this.preloadedUrls.add(url);
            this.log('Cached successfully', url);

        } catch (error) {
            this.log('Failed to preload', `${url} (${error.message})`);
        }
    }

    isValidUrl(url) {
        if (!url) return false;
        
        try {
            const currentDomain = window.location.hostname;
            const urlObject = new URL(url);
            
            return urlObject.hostname === currentDomain && // Same domain check
                   !url.startsWith('javascript:') && 
                   !url.includes('#') &&
                   !url.startsWith('mailto:') &&
                   !url.startsWith('tel:');
        } catch (e) {
            return false; // Invalid URL format
        }
    }

    isNearLink(event, link) {
        const rect = link.getBoundingClientRect();
        const mouseX = event.clientX;
        const mouseY = event.clientY;
        
        return Math.hypot(
            mouseX - (rect.left + rect.width/2),
            mouseY - (rect.top + rect.height/2)
        ) <= this.HOVER_THRESHOLD;
    }

    handleMouseMove(event) {
        const links = document.getElementsByTagName('a');
        
        for (const link of links) {
            if (this.isNearLink(event, link) && this.isValidUrl(link.href)) {
                this.preloadUrl(link.href);
            }
        }
    }

    handleTouch(event) {
        const touch = event.touches[0];
        const element = document.elementFromPoint(touch.clientX, touch.clientY);
        
        if (element?.tagName === 'A' && this.isValidUrl(element.href)) {
            this.preloadUrl(element.href);
        }
    }

    async setupCache() {
        // Clean up old caches
        const caches = await window.caches.keys();
        await Promise.all(
            caches.map(cache => {
                if (cache !== this.CACHE_NAME) {
                    return window.caches.delete(cache);
                }
            })
        );

        // Set up cache listener
        window.addEventListener('fetch', async (event) => {
            const cachedResponse = await caches.match(event.request);
            if (cachedResponse) {
                this.log('Serving from cache', event.request.url);
                return cachedResponse;
            }
            return fetch(event.request);
        });
    }

    init() {
        if (this.initialized) return;
        
        this.log('Initializing', 'preload system');
        
        // Set up event listeners
        document.addEventListener('mousemove', this.handleMouseMove.bind(this));
        document.addEventListener('touchstart', this.handleTouch.bind(this));
        
        // Initialize cache
        this.setupCache().catch(error => {
            console.error('Cache setup failed:', error);
        });

        this.initialized = true;
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    const preloader = new LinkPreloader();
    preloader.init();
});
