const helmet = require('helmet');
const config = require('../config/env');

/**
 * Helmet Security Configuration for AuthRPD API
 * 
 * Helmet helps secure Express apps by setting various HTTP headers.
 * This configuration is tailored for a government-grade treasury API service.
 * 
 * Security Headers Configured:
 * - HSTS (HTTP Strict Transport Security): Forces HTTPS connections
 * - X-Content-Type-Options: Prevents MIME type sniffing
 * - X-Frame-Options: Prevents clickjacking attacks
 * - Referrer-Policy: Controls referrer information
 * - Permissions-Policy: Restricts browser features
 * - X-Powered-By: Removed to hide Express version
 * - CSP: Disabled for API (explained below)
 * 
 * Why CSP is disabled for APIs:
 * - Content Security Policy is primarily for web pages with HTML/CSS/JS
 * - APIs return JSON, not HTML, so CSP provides minimal benefit
 * - CSP can interfere with API clients and CORS
 * - For API security, focus on authentication, rate limiting, and input validation
 * 
 * @returns {Function} Helmet middleware configured for AuthRPD
 */
function configureHelmet() {
  return helmet({
    // HTTP Strict Transport Security (HSTS)
    // Forces browsers to use HTTPS for all future requests
    // maxAge: How long (in seconds) browsers should remember to use HTTPS
    // includeSubDomains: Apply to all subdomains
    // preload: Allow inclusion in HSTS preload lists
    strictTransportSecurity: {
      maxAge: parseInt(process.env.HSTS_MAX_AGE || '31536000', 10), // 1 year default
      includeSubDomains: true,
      preload: config.env === 'production',
    },

    // X-Content-Type-Options: nosniff
    // Prevents browsers from MIME-sniffing responses
    // Critical for preventing XSS attacks via content type confusion
    contentSecurityPolicy: false, // Disabled for API (see explanation above)

    // X-Content-Type-Options header
    // This is set automatically by helmet, but we ensure it's enabled
    // nosniff: true prevents browsers from guessing content types

    // X-Frame-Options: DENY
    // Prevents the page from being displayed in a frame/iframe
    // Protects against clickjacking attacks
    // For APIs, this is less critical but still a good practice
    frameguard: {
      action: 'deny',
    },

    // Referrer-Policy
    // Controls how much referrer information is sent with requests
    // 'strict-origin-when-cross-origin' is a good balance for APIs
    referrerPolicy: {
      policy: 'strict-origin-when-cross-origin',
    },

    // Permissions-Policy (formerly Feature-Policy)
    // Restricts which browser features can be used
    // For APIs, we disable most features since we don't serve HTML
    permissionsPolicy: {
      features: {
        accelerometer: ["'none'"],
        ambientLightSensor: ["'none'"],
        autoplay: ["'none'"],
        camera: ["'none'"],
        crossOriginIsolated: ["'none'"],
        displayCapture: ["'none'"],
        documentDomain: ["'none'"],
        encryptedMedia: ["'none'"],
        executionWhileNotRendered: ["'none'"],
        executionWhileOutOfViewport: ["'none'"],
        fullscreen: ["'none'"],
        geolocation: ["'none'"],
        gyroscope: ["'none'"],
        keyboardMap: ["'none'"],
        magnetometer: ["'none'"],
        microphone: ["'none'"],
        midi: ["'none'"],
        navigationOverride: ["'none'"],
        payment: ["'none'"],
        pictureInPicture: ["'none'"],
        publickeyCredentials: ["'none'"],
        screenWakeLock: ["'none'"],
        syncXhr: ["'none'"],
        usb: ["'none'"],
        webShare: ["'none'"],
        xrSpatialTracking: ["'none'"],
      },
    },

    // Hide X-Powered-By header
    // Removes the "X-Powered-By: Express" header to hide server technology
    // Reduces information disclosure to attackers
    hidePoweredBy: true,

    // X-DNS-Prefetch-Control
    // Controls DNS prefetching (enabled by default in helmet)
    // For APIs, this is less relevant but harmless

    // X-Download-Options
    // Prevents Internet Explorer from executing downloads in the site's context
    // Less relevant for APIs but good practice

    // X-Permitted-Cross-Domain-Policies
    // Controls Adobe products' cross-domain policies
    // Not relevant for APIs but included for completeness
  });
}

module.exports = configureHelmet;

