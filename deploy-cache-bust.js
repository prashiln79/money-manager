#!/usr/bin/env node

/**
 * Cache Busting Script for Money Manager PWA
 * 
 * This script helps invalidate caches on mobile devices after deployments.
 * Run this script after deploying to production.
 */

const fs = require('fs');
const path = require('path');

// Configuration
const config = {
  versionFile: 'src/app/version.ts',
  manifestFile: 'public/manifest.json',
  indexFile: 'src/index.html',
  cacheBustingParam: 'v'
};

// Generate a new version based on timestamp
function generateVersion() {
  const now = new Date();
  const timestamp = now.getTime();
  const dateString = now.toISOString().split('T')[0];
  return {
    timestamp,
    date: dateString,
    version: `${dateString}-${timestamp}`
  };
}

// Update version file
function updateVersionFile(version) {
  const versionContent = `// Auto-generated version file
// This file is updated automatically during deployment

export const APP_VERSION = '${version.version}';
export const APP_BUILD_DATE = '${version.date}';
export const APP_BUILD_TIMESTAMP = ${version.timestamp};

// Cache busting parameter
export const CACHE_BUST_PARAM = '${config.cacheBustingParam}=${version.timestamp}';
`;

  fs.writeFileSync(config.versionFile, versionContent);
  console.log(`✅ Updated version file: ${config.versionFile}`);
}

// Update manifest file with new version
function updateManifest(version) {
  try {
    const manifestPath = path.resolve(config.manifestFile);
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    
    // Update version in manifest
    manifest.version = version.version;
    manifest.short_name = `Money Manager v${version.date}`;
    
    // Add cache busting to icons
    if (manifest.icons) {
      manifest.icons = manifest.icons.map(icon => ({
        ...icon,
        src: `${icon.src}?${config.cacheBustingParam}=${version.timestamp}`
      }));
    }
    
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
    console.log(`✅ Updated manifest file: ${config.manifestFile}`);
  } catch (error) {
    console.error(`❌ Failed to update manifest: ${error.message}`);
  }
}

// Update index.html with cache busting
function updateIndexHtml(version) {
  try {
    const indexPath = path.resolve(config.indexFile);
    let indexContent = fs.readFileSync(indexPath, 'utf8');
    
    // Add cache busting to CSS and JS files
    indexContent = indexContent.replace(
      /(href|src)="([^"]*\.(css|js))"/g,
      `$1="$2?${config.cacheBustingParam}=${version.timestamp}"`
    );
    
    // Add version meta tag
    if (!indexContent.includes('app-version')) {
      indexContent = indexContent.replace(
        '<head>',
        `<head>\n  <meta name="app-version" content="${version.version}">`
      );
    }
    
    fs.writeFileSync(indexPath, indexContent);
    console.log(`✅ Updated index.html: ${config.indexFile}`);
  } catch (error) {
    console.error(`❌ Failed to update index.html: ${error.message}`);
  }
}

// Create deployment info file
function createDeploymentInfo(version) {
  const deploymentInfo = {
    version: version.version,
    date: version.date,
    timestamp: version.timestamp,
    deployedAt: new Date().toISOString(),
    cacheBustingParam: `${config.cacheBustingParam}=${version.timestamp}`
  };
  
  fs.writeFileSync('deployment-info.json', JSON.stringify(deploymentInfo, null, 2));
  console.log('✅ Created deployment-info.json');
}

// Main function
function main() {
  console.log('🚀 Starting cache busting for Money Manager PWA...\n');
  
  const version = generateVersion();
  console.log(`📅 Generated version: ${version.version}\n`);
  
  try {
    updateVersionFile(version);
    updateManifest(version);
    updateIndexHtml(version);
    createDeploymentInfo(version);
    
    console.log('\n✅ Cache busting completed successfully!');
    console.log('\n📋 Next steps:');
    console.log('1. Build your application: npm run build');
    console.log('2. Deploy to your hosting platform');
    console.log('3. Clear browser caches on mobile devices if needed');
    console.log('\n💡 Mobile users can also use the Cache Management option in the app menu');
    
  } catch (error) {
    console.error('\n❌ Cache busting failed:', error.message);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = {
  generateVersion,
  updateVersionFile,
  updateManifest,
  updateIndexHtml,
  createDeploymentInfo
}; 