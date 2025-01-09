/**
 * InstantPage - Preloads and instantly switches pages within the same domain
 */
class InstantPage {
    constructor(options = {}) {
        this.HOVER_THRESHOLD = options.hoverThreshold || 100;
        this.DEBOUNCE_DELAY = options.debounceDelay || 100; // ms
        this.preloadedContents = new Map();
        this.preloadRequested = new Set(); // Track URLs being preloaded
        this.currentUrl = window.location.href;
        this.isNavigating = false;
        this.debounceTimer = null;
        
        // Create container for new content
        this.contentContainer = document.querySelector('main') || document.body;
        this.init();
    }

    log(action, url) {
        console.log(`[InstantPage] ${action}: ${url}`);
    }

    isValidUrl(url) {
        if (!url) return false;
        
        try {
            const currentDomain = window.location.hostname;
            const urlObject = new URL(url);
            
            return urlObject.hostname === currentDomain && 
                   !url.startsWith('javascript:') && 
                   !url.includes('#') &&
                   !url.startsWith('mailto:') &&
                   !url.startsWith('tel:');
        } catch (e) {
            return false;
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

    // async fetchPage(url) {
    //     try {
    //         const response = await fetch(url, {
    //             method: 'GET',
    //             credentials: 'same-origin'
    //         });
    //
    //         if (!response.ok) throw new Error(`HTTP ${response.status}`);
    //        
    //         const html = await response.text();
    //         const parser = new DOMParser();
    //         const doc = parser.parseFromString(html, 'text/html');
    //        
    //         return {
    //             title: doc.title,
    //             content: doc.querySelector('main')?.innerHTML || doc.body.innerHTML,
    //             doc: doc
    //         };
    //     } catch (error) {
    //         this.log('Failed to fetch', `${url} (${error.message})`);
    //         return null;
    //     }
    // }

    async fetchPage(url) {
        try {
            const response = await fetch(url, {
                method: 'GET',
                credentials: 'same-origin'
            });

            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            
            const html = await response.text();
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            
            const mainContent = doc.querySelector('main') || doc.body;
            
            return {
                title: doc.title,
                content: mainContent.innerHTML,
                head: doc.head,
                doc: doc  // Keep the full document for reference
            };
        } catch (error) {
            this.log('Failed to fetch', `${url} (${error.message})`);
            return null;
        }
    }

    async preloadLink(url) {
        if (this.preloadedContents.has(url)) {
            return;
        }

        try {
            const content = await this.fetchPage(url);
            if (content) {
                this.preloadedContents.set(url, content);
                this.log('Preloaded', url);
            }
        } finally {
            // Remove from requested set regardless of success/failure
            this.preloadRequested.delete(url);
        }
    }

    // updatePageContent(content, url) {
    //     // Update the page content
    //     document.title = content.title;
    //     this.contentContainer.innerHTML = content.content;
    //
    //     // Update URL without reload
    //     window.history.pushState({}, content.title, url);
    //     this.currentUrl = url;
    //
    //     // Trigger virtual page view for analytics
    //     if (typeof gtag !== 'undefined') {
    //         gtag('config', window.GA_MEASUREMENT_ID, {
    //             page_path: window.location.pathname
    //         });
    //     }
    //
    //     // Re-attach event listeners to new content
    //     this.attachLinkListeners();
    //    
    //     // Emit custom event
    //     window.dispatchEvent(new CustomEvent('instantPageLoad', { 
    //         detail: { url, title: content.title } 
    //     }));
    // }
    updatePageContent(content, url) {
        // Update the page content
        document.title = content.title;
        
                // Update or remove header
                const currentHeader = document.querySelector('header');
                const newHeader = content.doc.querySelector('header');
                
                if (currentHeader) {
                    if (newHeader) {
                        currentHeader.innerHTML = newHeader.innerHTML;
                    } else {
                        currentHeader.remove();
                    }
                }
        
                // Update main content
        this.contentContainer.innerHTML = content.content;

        // Update head elements (CSS, JS, meta tags, etc.)
        this.updateHeadElements(content.head);

        // Update URL without reload
        window.history.pushState({}, content.title, url);
        this.currentUrl = url;

        // Trigger virtual page view for analytics
        if (typeof gtag !== 'undefined') {
            gtag('config', window.GA_MEASUREMENT_ID, {
                page_path: window.location.pathname
            });
        }

        // Re-attach event listeners to new content
        this.attachLinkListeners();
        
        // Emit custom event
        window.dispatchEvent(new CustomEvent('instantPageLoad', { 
            detail: { url, title: content.title } 
        }));
    }

    updateHeadElements(newHead) {
        const currentHead = document.head;
        
        // Keep track of elements we want to preserve (like this script)
        const preserveSelectors = [
            'script[src*="preload.js"]',
            'script[src*="googletagmanager.com"]',
            'script[src*="google-analytics.com"]',
            'link[href*="fonts.googleapis.com"]',
            'link[href*="fonts.gstatic.com"]',
            // Add other scripts/resources you want to preserve
        ];
        
        // Store references to elements we want to preserve
        const preservedElements = [];
        preserveSelectors.forEach(selector => {
            const elements = currentHead.querySelectorAll(selector);
            elements.forEach(element => {
                // Clone the element before removing it
                const clone = element.cloneNode(true);
                preservedElements.push(clone);
            });
        });

        // Clear current head
        while (currentHead.firstChild) {
            currentHead.removeChild(currentHead.firstChild);
        }

        // Add all new head elements
        Array.from(newHead.children).forEach(element => {
            // Skip if this element should be preserved
            const shouldPreserve = preserveSelectors.some(selector => 
                element.matches(selector)
            );
            
            if (!shouldPreserve) {
                // Clone the element to avoid issues with moving nodes between documents
                const clone = element.cloneNode(true);
                currentHead.appendChild(clone);
            }
        });

        // Re-add preserved elements
        preservedElements.forEach(element => {
            currentHead.appendChild(element);
        });
    }

    async handleClick(event, link) {
        const url = link.href;
        
        if (!this.isValidUrl(url) || this.isNavigating) {
            return;
        }

        event.preventDefault();
        this.isNavigating = true;

        // Immediately use preloaded content if available
        if (this.preloadedContents.has(url)) {
            const content = this.preloadedContents.get(url);
            this.updatePageContent(content, url);
            this.isNavigating = false;
            // Start preloading the next page immediately
            this.preloadedContents.delete(url);
            return;
        }

        // If not preloaded, fetch immediately
        const content = await this.fetchPage(url);
        if (content) {
            this.updatePageContent(content, url);
        } else {
            // Fallback to traditional navigation if fetch fails
            window.location.href = url;
        }

        this.isNavigating = false;
    }

    attachLinkListeners() {
        const links = document.getElementsByTagName('a');
        
        for (const link of links) {
            if (this.isValidUrl(link.href)) {
                // Remove existing listeners to prevent duplicates
                link.removeEventListener('click', this._handleClickBound);
                link.removeEventListener('mouseenter', this._handleMouseEnterBound);
                
                // Add click listener
                this._handleClickBound = (e) => this.handleClick(e, link);
                link.addEventListener('click', this._handleClickBound);
                
                // Add mouseenter listener for immediate preload
                this._handleMouseEnterBound = () => {
                    if (!this.preloadedContents.has(link.href) && !this.preloadRequested.has(link.href)) {
                        this.preloadRequested.add(link.href);
                        this.preloadLink(link.href);
                    }
                };
                link.addEventListener('mouseenter', this._handleMouseEnterBound);
            }
        }
    }

    handleMouseMove(event) {
        // Clear existing timer
        if (this.debounceTimer) {
            clearTimeout(this.debounceTimer);
        }

        // Set new timer
        this.debounceTimer = setTimeout(() => {
            const links = document.getElementsByTagName('a');
            
            for (const link of links) {
                if (this.isNearLink(event, link) && 
                    this.isValidUrl(link.href) && 
                    !this.preloadRequested.has(link.href) && 
                    !this.preloadedContents.has(link.href)) {
                    this.preloadRequested.add(link.href);
                    this.preloadLink(link.href);
                }
            }
        }, this.DEBOUNCE_DELAY);
    }

    handlePopState() {
        // Handle browser back/forward buttons
        if (this.currentUrl !== window.location.href) {
            this.isNavigating = true;
            this.fetchPage(window.location.href).then((content) => {
                if (content) {
                    // Force header check on back/forward
                    const newHeader = content.doc.querySelector('header');
                    const currentHeader = document.querySelector('header');
                    
                    // If new page should have a header but we don't have one
                    if (newHeader && !currentHeader) {
                        // Create new header element
                        const header = document.createElement('header');
                        header.innerHTML = newHeader.innerHTML;
                        document.body.insertBefore(header, document.body.firstChild);
                    }
                    
                    this.updatePageContent(content, window.location.href);
                } else {
                    window.location.reload();
                }
                this.isNavigating = false;
            });
        }
    }

    init() {
        // Track mouse movement for preloading
        document.addEventListener('mousemove', this.handleMouseMove.bind(this));
        
        // Handle browser back/forward
        window.addEventListener('popstate', this.handlePopState.bind(this));
        
        // Initial link listeners
        this.attachLinkListeners();

        this.log('Initialized', 'instant page system');
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.instantPage = new InstantPage();
});

