/**
 * IP Address Tracker Application
 * Professional geolocation tool with interactive maps and device detection
 */

class IPTracker {
    constructor() {
        this.API_KEY = this.getAPIKey();
        this.map = null;
        this.currentMarker = null;
        this.searchHistory = this.loadSearchHistory();
        this.currentIPData = null;
        
        // Initialize UAParser if available
        try {
            this.parser = typeof UAParser !== 'undefined' ? new UAParser() : null;
        } catch (error) {
            console.warn('UAParser not available:', error);
            this.parser = null;
        }
        
        this.init();
    }

    /**
     * Get API key from environment or use fallback
     */
    getAPIKey() {
        // Check for environment variable first
        const envApiKey = typeof process !== 'undefined' && process.env ? process.env.IPINFO_API_KEY : null;
        if (envApiKey) return envApiKey;
        
        // For production, replace this with your actual API key
        // Free tier allows 50,000 requests per month
        return null; // Using free tier without API key
    }

    /**
     * Initialize the application
     */
    init() {
        this.setupEventListeners();
        this.setupThemeToggle();
        this.detectCurrentIP();
        this.renderSearchHistory();
        this.parseDeviceInfo();
        
        // Hide loading overlay after initialization
        setTimeout(() => {
            this.hideLoadingOverlay();
        }, 1000);
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        const searchBtn = document.getElementById('searchBtn');
        const ipInput = document.getElementById('ipInput');
        const detectCurrentIPBtn = document.getElementById('detectCurrentIP');
        const copyIPBtn = document.getElementById('copyIPBtn');
        const downloadReportBtn = document.getElementById('downloadReportBtn');
        const clearHistoryBtn = document.getElementById('clearHistoryBtn');
        const fullscreenMapBtn = document.getElementById('fullscreenMap');

        if (searchBtn) searchBtn.addEventListener('click', () => this.handleSearch());
        if (ipInput) {
            ipInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.handleSearch();
                }
            });
            // Input validation
            ipInput.addEventListener('input', (e) => this.validateIPInput(e.target));
        }
        
        if (detectCurrentIPBtn) detectCurrentIPBtn.addEventListener('click', () => this.detectCurrentIP());
        if (copyIPBtn) copyIPBtn.addEventListener('click', () => this.copyIP());
        if (downloadReportBtn) downloadReportBtn.addEventListener('click', () => this.downloadReport());
        if (clearHistoryBtn) clearHistoryBtn.addEventListener('click', () => this.clearSearchHistory());
        if (fullscreenMapBtn) fullscreenMapBtn.addEventListener('click', () => this.toggleFullscreenMap());
    }

    /**
     * Setup theme toggle functionality
     */
    setupThemeToggle() {
        const themeToggle = document.getElementById('themeToggle');
        if (!themeToggle) return;

        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        const savedTheme = localStorage.getItem('theme');
        
        // Set initial theme
        const initialTheme = savedTheme || (prefersDark ? 'dark' : 'light');
        this.setTheme(initialTheme);
        
        themeToggle.addEventListener('click', () => {
            const currentTheme = document.documentElement.getAttribute('data-theme');
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            this.setTheme(newTheme);
        });

        // Listen for system theme changes
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
            if (!localStorage.getItem('theme')) {
                this.setTheme(e.matches ? 'dark' : 'light');
            }
        });
    }

    /**
     * Set application theme
     */
    setTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
        
        const themeIcon = document.querySelector('#themeToggle i');
        if (themeIcon) {
            themeIcon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
        }
    }

    /**
     * Validate IP address input
     */
    validateIPInput(input) {
        const ipPattern = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
        const value = input.value.trim();
        
        if (value && !ipPattern.test(value)) {
            input.setCustomValidity('Please enter a valid IP address (e.g., 192.168.1.1)');
        } else {
            input.setCustomValidity('');
        }
    }

    /**
     * Check if IP address is valid
     */
    isValidIP(ip) {
        const ipPattern = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
        return ipPattern.test(ip);
    }

    /**
     * Handle IP search
     */
    async handleSearch() {
        const ipInput = document.getElementById('ipInput');
        const ip = ipInput.value.trim();
        
        if (!ip) {
            this.showError('Please enter an IP address');
            return;
        }

        if (!this.isValidIP(ip)) {
            this.showError('Please enter a valid IP address');
            return;
        }

        this.showLoadingOverlay();
        this.hideError();

        try {
            const ipData = await this.fetchIPData(ip);
            this.displayResults(ipData);
            this.addToSearchHistory(ipData);
            this.renderSearchHistory();
            ipInput.value = '';
        } catch (error) {
            this.showError(error.message);
        } finally {
            this.hideLoadingOverlay();
        }
    }

    /**
     * Detect current user's IP address
     */
    async detectCurrentIP() {
        this.showLoadingOverlay();
        this.hideError();

        try {
            // First try to get IP from ipinfo.io
            const response = await fetch('https://ipinfo.io/json');
            if (!response.ok) {
                throw new Error('Failed to detect IP address');
            }
            
            const data = await response.json();
            this.displayResults(data);
            this.addToSearchHistory(data);
            this.renderSearchHistory();
            
            this.showToast('Current IP detected successfully!', 'success');
        } catch (error) {
            // Fallback to alternative services
            try {
                const fallbackResponse = await fetch('https://api.ipify.org?format=json');
                const fallbackData = await fallbackResponse.json();
                
                const ipData = await this.fetchIPData(fallbackData.ip);
                this.displayResults(ipData);
                this.addToSearchHistory(ipData);
                this.renderSearchHistory();
                
                this.showToast('Current IP detected successfully!', 'success');
            } catch (fallbackError) {
                this.showError('Unable to detect your IP address. Please try entering it manually.');
            }
        } finally {
            this.hideLoadingOverlay();
        }
    }

    /**
     * Fetch IP data from API
     */
    async fetchIPData(ip) {
        try {
            let url = `https://ipinfo.io/${ip}/json`;
            
            // Add API key if available
            if (this.API_KEY) {
                url += `?token=${this.API_KEY}`;
            }

            const response = await fetch(url);
            
            if (!response.ok) {
                if (response.status === 429) {
                    throw new Error('Rate limit exceeded. Please try again later.');
                } else if (response.status === 401) {
                    throw new Error('Invalid API key. Please check your configuration.');
                } else {
                    throw new Error(`API request failed with status ${response.status}`);
                }
            }

            const data = await response.json();
            
            if (data.error) {
                throw new Error(data.error.message || 'Invalid IP address or API error');
            }

            return data;
        } catch (error) {
            console.error('API Error:', error);
            throw new Error(error.message || 'Failed to fetch IP information');
        }
    }

    /**
     * Display IP results
     */
    displayResults(data) {
        this.currentIPData = data;
        const resultsSection = document.getElementById('resultsSection');
        
        // Update IP information
        this.updateElement('displayIP', data.ip || 'N/A');
        this.updateElement('displayLocation', 
            `${data.city || 'Unknown'}, ${data.region || ''} ${data.country || ''}`.trim());
        this.updateElement('displayCoordinates', data.loc || 'N/A');
        this.updateElement('displayISP', data.org || 'N/A');
        this.updateElement('displayTimezone', data.timezone || 'N/A');
        this.updateElement('displayCountryCode', data.country || 'N/A');

        // Show results section
        if (resultsSection) {
            resultsSection.classList.remove('hidden');
            resultsSection.classList.add('fade-in');
        }

        // Update map
        this.updateMap(data);

        // Scroll to results
        if (resultsSection) {
            resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }

    /**
     * Update element content safely
     */
    updateElement(id, content) {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = content;
        }
    }

    /**
     * Parse and display device information
     */
    parseDeviceInfo() {
        if (this.parser) {
            try {
                const result = this.parser.getResult();
                
                this.updateElement('displayBrowser', 
                    `${result.browser.name || 'Unknown'} ${result.browser.version || ''}`.trim());
                this.updateElement('displayOS', 
                    `${result.os.name || 'Unknown'} ${result.os.version || ''}`.trim());
                this.updateElement('displayDevice', 
                    result.device.type || 'Desktop');
                this.updateElement('displayCPU', 
                    result.cpu.architecture || 'Unknown');
                this.updateElement('displayEngine', 
                    `${result.engine.name || 'Unknown'} ${result.engine.version || ''}`.trim());
            } catch (error) {
                console.warn('Error parsing device info:', error);
                this.setFallbackDeviceInfo();
            }
        } else {
            this.setFallbackDeviceInfo();
        }
        
        const userAgentElement = document.getElementById('displayUserAgent');
        if (userAgentElement) {
            userAgentElement.textContent = navigator.userAgent;
            userAgentElement.title = navigator.userAgent;
        }
    }

    /**
     * Set fallback device information when UAParser is not available
     */
    setFallbackDeviceInfo() {
        const userAgent = navigator.userAgent;
        
        // Basic browser detection
        let browser = 'Unknown';
        if (userAgent.includes('Chrome')) browser = 'Chrome';
        else if (userAgent.includes('Firefox')) browser = 'Firefox';
        else if (userAgent.includes('Safari')) browser = 'Safari';
        else if (userAgent.includes('Edge')) browser = 'Edge';
        
        // Basic OS detection
        let os = 'Unknown';
        if (userAgent.includes('Windows')) os = 'Windows';
        else if (userAgent.includes('Mac')) os = 'macOS';
        else if (userAgent.includes('Linux')) os = 'Linux';
        else if (userAgent.includes('Android')) os = 'Android';
        else if (userAgent.includes('iOS')) os = 'iOS';
        
        // Basic device detection
        let device = 'Desktop';
        if (userAgent.includes('Mobile')) device = 'Mobile';
        else if (userAgent.includes('Tablet')) device = 'Tablet';
        
        this.updateElement('displayBrowser', browser);
        this.updateElement('displayOS', os);
        this.updateElement('displayDevice', device);
        this.updateElement('displayCPU', 'Unknown');
        this.updateElement('displayEngine', 'Unknown');
    }

    /**
     * Update map with location
     */
    updateMap(data) {
        const mapContainer = document.getElementById('map');
        if (!mapContainer) return;
        
        if (!data.loc) {
            mapContainer.innerHTML = '<div class="map-error">Location coordinates not available</div>';
            return;
        }

        const [lat, lng] = data.loc.split(',').map(Number);
        
        if (isNaN(lat) || isNaN(lng)) {
            mapContainer.innerHTML = '<div class="map-error">Invalid coordinates</div>';
            return;
        }

        // Initialize map if not already done
        if (!this.map) {
            try {
                this.map = L.map('map').setView([lat, lng], 10);
                
                L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                    attribution: '© OpenStreetMap contributors',
                    maxZoom: 18
                }).addTo(this.map);
            } catch (error) {
                console.error('Error initializing map:', error);
                mapContainer.innerHTML = '<div class="map-error">Map initialization failed</div>';
                return;
            }
        } else {
            this.map.setView([lat, lng], 10);
        }

        // Remove existing marker
        if (this.currentMarker) {
            this.map.removeLayer(this.currentMarker);
        }

        // Add new marker
        try {
            this.currentMarker = L.marker([lat, lng]).addTo(this.map);
            
            // Create popup content
            const popupContent = `
                <div class="marker-popup">
                    <strong>${data.ip}</strong><br>
                    ${data.city || 'Unknown'}, ${data.region || ''} ${data.country || ''}<br>
                    <small>${data.org || 'Unknown ISP'}</small>
                </div>
            `;
            
            this.currentMarker.bindPopup(popupContent).openPopup();
        } catch (error) {
            console.error('Error adding marker:', error);
        }
    }

    /**
     * Toggle fullscreen map
     */
    toggleFullscreenMap() {
        const mapCard = document.querySelector('.map-card');
        const fullscreenBtn = document.getElementById('fullscreenMap');
        
        if (!mapCard || !fullscreenBtn) return;
        
        if (mapCard.classList.contains('fullscreen')) {
            mapCard.classList.remove('fullscreen');
            fullscreenBtn.innerHTML = '<i class="fas fa-expand"></i>';
            document.body.style.overflow = '';
        } else {
            mapCard.classList.add('fullscreen');
            fullscreenBtn.innerHTML = '<i class="fas fa-compress"></i>';
            document.body.style.overflow = 'hidden';
        }
        
        // Resize map
        setTimeout(() => {
            if (this.map) {
                this.map.invalidateSize();
            }
        }, 300);
    }

    /**
     * Copy IP address to clipboard
     */
    async copyIP() {
        if (!this.currentIPData || !this.currentIPData.ip) {
            this.showToast('No IP address to copy', 'error');
            return;
        }

        try {
            await navigator.clipboard.writeText(this.currentIPData.ip);
            this.showToast('IP address copied to clipboard!', 'success');
        } catch (error) {
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = this.currentIPData.ip;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            this.showToast('IP address copied to clipboard!', 'success');
        }
    }

    /**
     * Download PDF report
     */
    downloadReport() {
        if (!this.currentIPData) {
            this.showToast('No data to download', 'error');
            return;
        }

        try {
            // Check if jsPDF is available
            if (typeof window.jsPDF === 'undefined') {
                this.showToast('PDF generation not available', 'error');
                return;
            }

            const { jsPDF } = window.jsPDF;
            const doc = new jsPDF();
            
            // Add title
            doc.setFontSize(20);
            doc.text('IP Address Tracker Report', 20, 30);
            
            // Add timestamp
            doc.setFontSize(12);
            doc.text(`Generated: ${new Date().toLocaleString()}`, 20, 45);
            
            // Add IP information
            doc.setFontSize(16);
            doc.text('IP Information', 20, 65);
            
            doc.setFontSize(12);
            let yPos = 80;
            const lineHeight = 8;
            
            const info = [
                `IP Address: ${this.currentIPData.ip || 'N/A'}`,
                `Location: ${this.currentIPData.city || 'Unknown'}, ${this.currentIPData.region || ''} ${this.currentIPData.country || ''}`,
                `Coordinates: ${this.currentIPData.loc || 'N/A'}`,
                `ISP/Organization: ${this.currentIPData.org || 'N/A'}`,
                `Timezone: ${this.currentIPData.timezone || 'N/A'}`,
                `Country Code: ${this.currentIPData.country || 'N/A'}`
            ];
            
            info.forEach(line => {
                doc.text(line, 20, yPos);
                yPos += lineHeight;
            });
            
            // Add device information
            yPos += 10;
            doc.setFontSize(16);
            doc.text('Device Information', 20, yPos);
            yPos += 15;
            
            doc.setFontSize(12);
            const browserElement = document.getElementById('displayBrowser');
            const osElement = document.getElementById('displayOS');
            const deviceElement = document.getElementById('displayDevice');
            
            const deviceInfo = [
                `Browser: ${browserElement ? browserElement.textContent : 'Unknown'}`,
                `Operating System: ${osElement ? osElement.textContent : 'Unknown'}`,
                `Device Type: ${deviceElement ? deviceElement.textContent : 'Unknown'}`
            ];
            
            deviceInfo.forEach(line => {
                doc.text(line, 20, yPos);
                yPos += lineHeight;
            });
            
            // Save the PDF
            doc.save(`ip-tracker-report-${this.currentIPData.ip}-${Date.now()}.pdf`);
            this.showToast('Report downloaded successfully!', 'success');
            
        } catch (error) {
            console.error('Error generating PDF:', error);
            this.showToast('Failed to generate PDF report', 'error');
        }
    }

    /**
     * Add to search history
     */
    addToSearchHistory(ipData) {
        const historyItem = {
            ip: ipData.ip,
            location: `${ipData.city || 'Unknown'}, ${ipData.country || ''}`,
            timestamp: Date.now(),
            data: ipData
        };

        // Remove existing entry for same IP
        this.searchHistory = this.searchHistory.filter(item => item.ip !== ipData.ip);
        
        // Add to beginning
        this.searchHistory.unshift(historyItem);
        
        // Limit to 50 items
        this.searchHistory = this.searchHistory.slice(0, 50);
        
        // Save to localStorage
        this.saveSearchHistory();
    }

    /**
     * Load search history from localStorage
     */
    loadSearchHistory() {
        try {
            const saved = localStorage.getItem('ipTracker_history');
            return saved ? JSON.parse(saved) : [];
        } catch (error) {
            console.error('Error loading search history:', error);
            return [];
        }
    }

    /**
     * Save search history to localStorage
     */
    saveSearchHistory() {
        try {
            localStorage.setItem('ipTracker_history', JSON.stringify(this.searchHistory));
        } catch (error) {
            console.error('Error saving search history:', error);
        }
    }

    /**
     * Render search history
     */
    renderSearchHistory() {
        const historyList = document.getElementById('historyList');
        if (!historyList) return;

        if (this.searchHistory.length === 0) {
            historyList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-search"></i>
                    <p>No search history yet. Start by tracking an IP address!</p>
                </div>
            `;
            return;
        }

        historyList.innerHTML = this.searchHistory.map(item => `
            <div class="history-item" onclick="tracker.loadFromHistory('${item.ip}')">
                <div class="history-content">
                    <div class="history-ip">${item.ip}</div>
                    <div class="history-location">${item.location}</div>
                </div>
                <div class="history-time">${this.formatTime(item.timestamp)}</div>
            </div>
        `).join('');
    }

    /**
     * Load IP data from history
     */
    loadFromHistory(ip) {
        const historyItem = this.searchHistory.find(item => item.ip === ip);
        if (historyItem) {
            this.displayResults(historyItem.data);
        }
    }

    /**
     * Clear search history
     */
    clearSearchHistory() {
        if (confirm('Are you sure you want to clear your search history?')) {
            this.searchHistory = [];
            this.saveSearchHistory();
            this.renderSearchHistory();
            this.showToast('Search history cleared', 'success');
        }
    }

    /**
     * Format timestamp for display
     */
    formatTime(timestamp) {
        const now = Date.now();
        const diff = now - timestamp;
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 1) return 'Just now';
        if (minutes < 60) return `${minutes}m ago`;
        if (hours < 24) return `${hours}h ago`;
        return `${days}d ago`;
    }

    /**
     * Show loading overlay
     */
    showLoadingOverlay() {
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) {
            overlay.classList.remove('hidden');
        }
    }

    /**
     * Hide loading overlay
     */
    hideLoadingOverlay() {
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) {
            overlay.classList.add('hidden');
        }
    }

    /**
     * Show error message
     */
    showError(message) {
        const errorDisplay = document.getElementById('errorDisplay');
        const errorMessage = document.getElementById('errorMessage');
        
        if (errorDisplay && errorMessage) {
            errorMessage.textContent = message;
            errorDisplay.classList.remove('hidden');
        }
    }

    /**
     * Hide error message
     */
    hideError() {
        const errorDisplay = document.getElementById('errorDisplay');
        if (errorDisplay) {
            errorDisplay.classList.add('hidden');
        }
    }

    /**
     * Show toast notification
     */
    showToast(message, type = 'success') {
        const container = document.getElementById('toastContainer');
        if (!container) return;

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        const icon = type === 'success' ? 'fas fa-check-circle' : 
                    type === 'error' ? 'fas fa-exclamation-circle' : 
                    'fas fa-info-circle';
        
        toast.innerHTML = `
            <i class="${icon}"></i>
            <span>${message}</span>
        `;
        
        container.appendChild(toast);
        
        // Remove after 3 seconds
        setTimeout(() => {
            toast.style.animation = 'slideOut 0.3s ease-in forwards';
            setTimeout(() => {
                if (container.contains(toast)) {
                    container.removeChild(toast);
                }
            }, 300);
        }, 3000);
    }
}

// Modal functions
function showPrivacyPolicy() {
    const modal = document.getElementById('privacyModal');
    if (modal) {
        modal.classList.remove('hidden');
    }
}

function showTermsOfService() {
    const modal = document.getElementById('termsModal');
    if (modal) {
        modal.classList.remove('hidden');
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('hidden');
    }
}

// Close modals when clicking outside
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal')) {
        e.target.classList.add('hidden');
    }
});

// Close modals with Escape key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        const modals = document.querySelectorAll('.modal:not(.hidden)');
        modals.forEach(modal => modal.classList.add('hidden'));
    }
});

// Add fullscreen map styles
const style = document.createElement('style');
style.textContent = `
    .map-card.fullscreen {
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        z-index: 9998;
        border-radius: 0;
    }
    
    .map-card.fullscreen .map-container {
        height: calc(100vh - 60px);
    }
`;
document.head.appendChild(style);

// Initialize the application
let tracker;
document.addEventListener('DOMContentLoaded', () => {
    tracker = new IPTracker();
});

// Service Worker Registration (Optional)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(() => console.log('SW registered'))
            .catch(() => console.log('SW registration failed'));
    });
}
