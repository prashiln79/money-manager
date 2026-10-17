#!/usr/bin/env node

/**
 * Static SEO Generator for MoneyManager on GitHub Pages
 *
 * Generates static HTML entry points with pre-populated metadata,
 * Open Graph, Twitter cards, canonical tags, JSON-LD structured data,
 * and semantic fallback content for public routes.
 *
 * Also creates 404.html for GitHub Pages SPA deep link fallback.
 */

const fs = require('fs');
const path = require('path');

const BASE_URL = process.env.BASE_URL || 'https://prashiln79.github.io/money-manager';
const BROWSER_DIR = path.join(__dirname, '../dist/money-manager/browser');
const ROOT_DIST_DIR = path.join(__dirname, '../dist/money-manager');

if (!fs.existsSync(BROWSER_DIR)) {
  console.error(`❌ Browser build directory not found: ${BROWSER_DIR}`);
  process.exit(1);
}

const baseHtmlPath = path.join(BROWSER_DIR, 'index.html');
if (!fs.existsSync(baseHtmlPath)) {
  console.error(`❌ Base index.html not found: ${baseHtmlPath}`);
  process.exit(1);
}

const baseHtml = fs.readFileSync(baseHtmlPath, 'utf-8');

// Public routes to generate static SEO pages for
const publicPages = [
  {
    path: 'landing',
    title: 'MoneyManager - Family Expense Tracker & Budget Planner',
    description: 'Free, privacy-focused family expense tracker and personal finance manager. Track daily expenses, plan budgets, analyze spending trends, and organize accounts offline and online.',
    canonicalUrl: `${BASE_URL}/landing`,
    heading: 'Take Control of Your Personal & Family Finances',
    semanticContent: `
      <section style="padding: 2rem; max-width: 900px; margin: 0 auto; font-family: sans-serif;">
        <h1>Take Control of Your Personal & Family Finances</h1>
        <p>MoneyManager is a comprehensive personal finance and family expense tracker progressive web application. Built for simplicity, security, and power.</p>
        <h2>Key Features</h2>
        <ul>
          <li><strong>Family Collaboration:</strong> Synchronize shared expenses and family budgets in real-time.</li>
          <li><strong>Offline-First:</strong> Works completely offline with instant local storage and automatic cloud synchronization.</li>
          <li><strong>Smart Categorization:</strong> Custom categories, sub-categories, and tags for detailed spending analysis.</li>
          <li><strong>Goal Tracking:</strong> Set savings goals and track milestone progress with visual dashboards.</li>
          <li><strong>Privacy Focused:</strong> Your data is protected with secure encryption and private guest session modes.</li>
        </ul>
      </section>
    `
  },
  {
    path: 'privacy-policy',
    title: 'Privacy Policy | MoneyManager',
    description: 'Learn how MoneyManager protects your personal financial data. Transparent privacy practices, local-first storage, and secure encryption.',
    canonicalUrl: `${BASE_URL}/privacy-policy`,
    heading: 'Privacy Policy',
    semanticContent: `
      <section style="padding: 2rem; max-width: 900px; margin: 0 auto; font-family: sans-serif;">
        <h1>Privacy Policy</h1>
        <p>At MoneyManager, your privacy is our top priority. We are committed to transparency in how your personal and financial information is handled.</p>
        <h2>Information We Collect</h2>
        <p>We only collect the data necessary to provide expense tracking and budgeting services, including account credentials (if signed in) and financial records you choose to input.</p>
        <h2>Data Storage & Security</h2>
        <p>Data is stored locally on your device using IndexedDB and securely synchronized via Firebase using industry-standard encryption protocols.</p>
        <h2>Your Data Rights</h2>
        <p>You have full ownership of your data, with the ability to export or request complete data deletion at any time.</p>
      </section>
    `
  },
  {
    path: 'terms-conditions',
    title: 'Terms & Conditions | MoneyManager',
    description: 'Review the terms and conditions for using MoneyManager family expense tracker and personal finance web application.',
    canonicalUrl: `${BASE_URL}/terms-conditions`,
    heading: 'Terms & Conditions',
    semanticContent: `
      <section style="padding: 2rem; max-width: 900px; margin: 0 auto; font-family: sans-serif;">
        <h1>Terms & Conditions</h1>
        <p>By using MoneyManager, you agree to these Terms and Conditions. Please review them carefully.</p>
        <h2>Service Use</h2>
        <p>MoneyManager is provided as a personal finance management and expense tracking tool for informational and personal budgeting purposes.</p>
        <h2>Account Responsibility</h2>
        <p>Users are responsible for maintaining the confidentiality of their account credentials and pin codes.</p>
      </section>
    `
  },
  {
    path: 'feedback',
    title: 'Feedback & Support | MoneyManager',
    description: 'Send feedback, ask questions, or request support for the MoneyManager family expense tracker and personal finance app.',
    canonicalUrl: `${BASE_URL}/feedback`,
    heading: 'Feedback & Support',
    semanticContent: `
      <section style="padding: 2rem; max-width: 900px; margin: 0 auto; font-family: sans-serif;">
        <h1>Feedback & Support</h1>
        <p>We welcome your questions, feature suggestions, and bug reports. Contact the MoneyManager team to help improve your expense tracking experience.</p>
      </section>
    `
  },
  {
    path: 'data-deletion',
    title: 'Data Deletion Instructions | MoneyManager',
    description: 'Instructions for requesting permanent account and financial data deletion from MoneyManager in compliance with privacy regulations.',
    canonicalUrl: `${BASE_URL}/data-deletion`,
    heading: 'Data Deletion Instructions',
    semanticContent: `
      <section style="padding: 2rem; max-width: 900px; margin: 0 auto; font-family: sans-serif;">
        <h1>Data Deletion Instructions</h1>
        <p>You can request the permanent deletion of your account and all associated financial records at any time either via the in-app settings or by contacting support.</p>
        <h2>Processing Timeline</h2>
        <p>Deletion requests are processed within 48 to 72 hours, permanently purging all personal records from active databases.</p>
      </section>
    `
  }
];

console.log('Generating static SEO pages for GitHub Pages...');

// Generate static page for each public route
publicPages.forEach(page => {
  const pageDir = path.join(BROWSER_DIR, page.path);
  if (!fs.existsSync(pageDir)) {
    fs.mkdirSync(pageDir, { recursive: true });
  }

  let html = baseHtml;

  // Replace Title
  html = html.replace(/<title>.*?<\/title>/i, `<title>${page.title}</title>`);

  // Replace Meta Description
  html = html.replace(
    /<meta name="description" content=".*?"/i,
    `<meta name="description" content="${page.description}"`
  );

  // Replace Open Graph Tags
  html = html.replace(
    /<meta property="og:title" content=".*?"/i,
    `<meta property="og:title" content="${page.title}"`
  );
  html = html.replace(
    /<meta property="og:description" content=".*?"/i,
    `<meta property="og:description" content="${page.description}"`
  );
  html = html.replace(
    /<meta property="og:url" content=".*?"/i,
    `<meta property="og:url" content="${page.canonicalUrl}"`
  );

  // Replace Twitter Tags
  html = html.replace(
    /<meta name="twitter:title" content=".*?"/i,
    `<meta name="twitter:title" content="${page.title}"`
  );
  html = html.replace(
    /<meta name="twitter:description" content=".*?"/i,
    `<meta name="twitter:description" content="${page.description}"`
  );

  // Replace Canonical Link
  html = html.replace(
    /<link rel="canonical" href=".*?"\s*\/?>/i,
    `<link rel="canonical" href="${page.canonicalUrl}">`
  );

  // Inject prerendered semantic fallback inside app-root for non-JS crawlers
  const prerenderedAppRoot = `<app-root>
    <div id="seo-prerender-content" style="display:none;">
      ${page.semanticContent}
    </div>
    <script>
      // Seamlessly sync route with Angular hash navigation on client side
      (function() {
        if (!window.location.hash || window.location.hash === '#' || window.location.hash === '#/') {
          window.location.replace('${BASE_URL}/#/${page.path}');
        }
      })();
    </script>`;

  html = html.replace('<app-root>', prerenderedAppRoot);

  const outputPath = path.join(pageDir, 'index.html');
  fs.writeFileSync(outputPath, html);
  console.log(`✅ Generated: ${outputPath} (Canonical: ${page.canonicalUrl})`);
});

// Generate 404.html for GitHub Pages SPA Routing
const spa404Html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>MoneyManager - Redirecting...</title>
  <meta name="robots" content="noindex, nofollow">
  <script>
    // GitHub Pages SPA Single-Page-App deep link redirector
    // Preserves path and query parameters by transferring them to the hash route
    (function() {
      var pathSegmentsToKeep = 1; // repository subpath '/money-manager'
      var l = window.location;
      var repoBase = l.pathname.split('/').slice(0, 1 + pathSegmentsToKeep).join('/');
      var routePath = l.pathname.slice(repoBase.length);
      var destination = repoBase + '/#' + (routePath.startsWith('/') ? routePath : '/' + routePath) + (l.search || '') + (l.hash || '');
      l.replace(destination);
    })();
  </script>
</head>
<body>
  <p>Redirecting to <a href="${BASE_URL}/">MoneyManager</a>...</p>
</body>
</html>
`;

fs.writeFileSync(path.join(BROWSER_DIR, '404.html'), spa404Html);
console.log(`✅ Generated: ${path.join(BROWSER_DIR, '404.html')}`);

// Ensure sitemap.xml and robots.txt are placed in both dist directories
const srcRobots = path.join(__dirname, '../src/robots.txt');
const srcSitemap = path.join(__dirname, '../src/sitemap.xml');

if (fs.existsSync(srcRobots)) {
  fs.copyFileSync(srcRobots, path.join(BROWSER_DIR, 'robots.txt'));
  if (fs.existsSync(ROOT_DIST_DIR)) {
    fs.copyFileSync(srcRobots, path.join(ROOT_DIST_DIR, 'robots.txt'));
  }
  console.log('✅ Synchronized robots.txt into dist');
}

if (fs.existsSync(srcSitemap)) {
  fs.copyFileSync(srcSitemap, path.join(BROWSER_DIR, 'sitemap.xml'));
  if (fs.existsSync(ROOT_DIST_DIR)) {
    fs.copyFileSync(srcSitemap, path.join(ROOT_DIST_DIR, 'sitemap.xml'));
  }
  console.log('✅ Synchronized sitemap.xml into dist');
}

console.log('🎉 Static SEO pages generation completed successfully!');
