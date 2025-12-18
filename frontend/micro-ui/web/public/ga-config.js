// Google Analytics configuration
const GA_TRACKING_IDS = {
  production: 'G-P0JH39REGV',
  development: 'G-EPEPNEVTTF'
};

// Determine the current environment
// You can modify this logic based on your environment detection method
const isProduction = window.location.hostname.includes('oncourts');
const isDevelopment = window.location.hostname.includes('localhost') ||  window.location.hostname.includes('dev');

// Select the appropriate tracking ID
let GA_TRACKING_ID = "";

if (isDevelopment) {
  GA_TRACKING_ID = GA_TRACKING_IDS.development;
}

if (isProduction) {
  GA_TRACKING_ID = GA_TRACKING_IDS.production;
}

// Make the tracking ID available globally
window.GA_TRACKING_ID = GA_TRACKING_ID;