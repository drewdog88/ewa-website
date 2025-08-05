// Security utilities for protecting contact information from scraping

// Email obfuscation
function obfuscateEmail(email) {
    const [localPart, domain] = email.split('@');
    const obfuscatedLocal = localPart.charAt(0) + '*'.repeat(localPart.length - 2) + localPart.charAt(localPart.length - 1);
    const obfuscatedDomain = domain.charAt(0) + '*'.repeat(domain.length - 2) + domain.charAt(domain.length - 1);
    return `${obfuscatedLocal}@${obfuscatedDomain}`;
}

// Phone obfuscation
function obfuscatePhone(phone) {
    const cleaned = phone.replace(/[\s\-\(\)]/g, '');
    if (cleaned.length >= 10) {
        return cleaned.substring(0, 3) + '-***-' + cleaned.substring(cleaned.length - 4);
    }
    return phone;
}

// Reveal contact information on user interaction
function revealContactInfo(element, originalValue, type) {
    let revealed = false;
    
    element.addEventListener('click', function() {
        if (!revealed) {
            this.textContent = originalValue;
            this.style.cursor = 'default';
            this.title = 'Contact information revealed';
            revealed = true;
            
            // Auto-hide after 30 seconds
            setTimeout(() => {
                if (type === 'email') {
                    this.textContent = obfuscateEmail(originalValue);
                } else if (type === 'phone') {
                    this.textContent = obfuscatePhone(originalValue);
                }
                this.style.cursor = 'pointer';
                this.title = 'Click to reveal contact information';
                revealed = false;
            }, 30000);
        }
    });
}

// Initialize contact protection
function initContactProtection() {
    // Protect email addresses
    const emailElements = document.querySelectorAll('[data-email]');
    emailElements.forEach(element => {
        const email = element.getAttribute('data-email');
        const obfuscated = obfuscateEmail(email);
        element.textContent = obfuscated;
        element.style.cursor = 'pointer';
        element.title = 'Click to reveal email address';
        revealContactInfo(element, email, 'email');
    });
    
    // Protect phone numbers
    const phoneElements = document.querySelectorAll('[data-phone]');
    phoneElements.forEach(element => {
        const phone = element.getAttribute('data-phone');
        const obfuscated = obfuscatePhone(phone);
        element.textContent = obfuscated;
        element.style.cursor = 'pointer';
        element.title = 'Click to reveal phone number';
        revealContactInfo(element, phone, 'phone');
    });
}

// Anti-scraping measures
function initAntiScraping() {
    // Disable right-click context menu
    document.addEventListener('contextmenu', function(e) {
        e.preventDefault();
        return false;
    });
    
    // Disable text selection on sensitive elements
    const sensitiveElements = document.querySelectorAll('.sensitive-data');
    sensitiveElements.forEach(element => {
        element.style.userSelect = 'none';
        element.style.webkitUserSelect = 'none';
        element.style.mozUserSelect = 'none';
        element.style.msUserSelect = 'none';
    });
    
    // Disable keyboard shortcuts for copy/paste
    document.addEventListener('keydown', function(e) {
        if ((e.ctrlKey || e.metaKey) && (e.key === 'c' || e.key === 'C')) {
            const selection = window.getSelection();
            if (selection.toString().length > 0) {
                const sensitiveElements = document.querySelectorAll('.sensitive-data');
                for (let element of sensitiveElements) {
                    if (selection.containsNode(element, true)) {
                        e.preventDefault();
                        return false;
                    }
                }
            }
        }
    });
}

// Initialize all security measures when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initContactProtection();
    initAntiScraping();
}); 