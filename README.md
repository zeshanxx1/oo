# IP Address Tracker

A professional, full-featured IP Address Tracker web application with interactive maps, device detection, and comprehensive geolocation data. Built with modern web technologies and optimized for deployment on GitHub and Vercel.

![IP Address Tracker](https://img.shields.io/badge/Status-Production%20Ready-green)
![License](https://img.shields.io/badge/License-MIT-blue)
![Version](https://img.shields.io/badge/Version-1.0.0-brightgreen)

## 🌟 Features

### Core Functionality
- **Automatic IP Detection**: Instantly detects and displays your current IP address on page load
- **Custom IP Tracking**: Input field for tracking any valid IP address
- **Comprehensive IP Data**: Displays IP address, city, region, country, coordinates, ISP, and timezone
- **Interactive Maps**: Real-time location visualization using Leaflet.js and OpenStreetMap
- **Device Detection**: Browser, OS, device type, and CPU architecture information

### Advanced Features
- **Dark/Light Mode**: Automatic system preference detection with manual toggle
- **Search History**: Persistent storage with timestamps and easy access to previous searches
- **Copy Functionality**: One-click IP address copying with confirmation notifications
- **PDF Reports**: Download comprehensive IP reports with all collected data
- **Responsive Design**: Optimized for mobile, tablet, and desktop devices
- **Real-time Notifications**: Toast messages for user feedback and error handling
- **Advertisement Ready**: Pre-configured ad spaces for monetization

### Monetization Features
- **Google AdSense Integration**: Ready-to-use ad placements
- **Multiple Ad Units**: Banner and sidebar advertisements
- **Responsive Ad Layout**: Mobile-optimized advertisement display
- **Privacy Compliant**: Includes privacy policy and terms of service

## 🚀 Live Demo

Visit the live application: [IP Address Tracker](https://your-vercel-deployment.vercel.app)

## 🛠️ Tech Stack

- **Frontend**: HTML5, CSS3, Vanilla JavaScript (ES6+)
- **Styling**: Modern CSS with CSS Custom Properties (CSS Variables)
- **Maps**: Leaflet.js with OpenStreetMap tiles
- **Device Detection**: ua-parser-js library
- **PDF Generation**: jsPDF library
- **API**: IPinfo.io for geolocation data
- **Icons**: Font Awesome
- **Fonts**: Google Fonts (Inter)
- **Deployment**: Vercel with optimized static builds

## 📦 Installation & Setup

### Prerequisites
- Modern web browser with JavaScript enabled
- Internet connection for API calls and CDN resources

### Local Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/ip-address-tracker.git
   cd ip-address-tracker
   ```

2. **API Key Setup (Optional but Recommended)**
   - Sign up for a free account at [IPinfo.io](https://ipinfo.io)
   - Get your API token
   - Create a `.env` file in the root directory:
   ```bash
   IPINFO_API_KEY=your_actual_api_key_here
   ```
   - Or replace the API key in `script.js`:
   ```javascript
   getAPIKey() {
       return 'your_actual_api_key_here';
   }
   ```

3. **Serve the files**
   
   Using Python (recommended):
   ```bash
   # Python 3
   python -m http.server 5000
   
   # Python 2
   python -m SimpleHTTPServer 5000
   ```
   
   Using Node.js:
   ```bash
   npx serve -s . -l 5000
   ```
   
   Using PHP:
   ```bash
   php -S localhost:5000
   ```

4. **Open in browser**
   Navigate to `http://localhost:5000`

### Vercel Deployment

1. **Install Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **Deploy to Vercel**
   ```bash
   vercel --prod
   ```

   Or use the Vercel dashboard to import your GitHub repository.

3. **Environment Variables (Optional)**
   Add your IPinfo.io API key in Vercel dashboard:
   - Go to Project Settings → Environment Variables
   - Add `IPINFO_API_KEY` with your API key value

### GitHub Pages Deployment

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Initial commit"
   git push origin main
   