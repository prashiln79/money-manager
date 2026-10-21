#!/usr/bin/env node
/**
 * Android build automation helper for Bubblewrap TWA project.
 * Handles validation, build triggering, and AAB bundle reporting.
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { spawn } = require('child_process');

const PROJECT_ROOT = path.resolve(__dirname, '..');
const EXPECTED_APP_ID = 'io.github.prashiln79.twa';
const MIN_API_LEVEL = 36;

const REQUIRED_FILES = [
  'twa-manifest.json',
  'app/build.gradle',
  'build.gradle',
  'settings.gradle',
  'gradlew',
  'gradle.properties'
];

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(2)} KB`;
  const mb = kb / 1024;
  return `${mb.toFixed(2)} MB (${bytes.toLocaleString()} bytes)`;
}

function getSha256(filePath) {
  const fileBuffer = fs.readFileSync(filePath);
  return crypto.createHash('sha256').update(fileBuffer).digest('hex');
}

function runCheck(isPrebuild = false) {
  console.log('='.repeat(64));
  console.log(isPrebuild ? '🔍 Verifying Android Project Configuration Before Build...' : '🔍 Android Project Configuration Check');
  console.log('='.repeat(64));
  console.log(`Project Directory: ${PROJECT_ROOT}`);

  let hasErrors = false;

  // 1. Verify required files exist
  console.log('\n[1/4] Checking required project files:');
  for (const relFile of REQUIRED_FILES) {
    const fullPath = path.join(PROJECT_ROOT, relFile);
    if (!fs.existsSync(fullPath)) {
      console.error(`  ❌ Missing required file: ${relFile}`);
      hasErrors = true;
    } else {
      console.log(`  ✓ ${relFile}`);
    }
  }

  // 2. Read and parse twa-manifest.json
  console.log('\n[2/4] Inspecting twa-manifest.json:');
  const manifestPath = path.join(PROJECT_ROOT, 'twa-manifest.json');
  let twaManifest = null;
  if (fs.existsSync(manifestPath)) {
    try {
      twaManifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
      console.log(`  ✓ Application Name:    ${twaManifest.name || 'N/A'}`);
      console.log(`  ✓ Package ID:          ${twaManifest.packageId}`);
      console.log(`  ✓ Manifest Version:    ${twaManifest.appVersionName || twaManifest.appVersion || 'N/A'}`);
      console.log(`  ✓ Manifest Code:       ${twaManifest.appVersionCode}`);
      console.log(`  ✓ Host:                ${twaManifest.host}`);
      console.log(`  ✓ Start URL:           ${twaManifest.startUrl}`);

      if (twaManifest.packageId !== EXPECTED_APP_ID) {
        console.error(`  ❌ Invalid packageId in twa-manifest.json: "${twaManifest.packageId}" (expected "${EXPECTED_APP_ID}")`);
        hasErrors = true;
      }

      // Check signing key configuration
      const keyPath = twaManifest.signingKey && twaManifest.signingKey.path;
      const keyAlias = twaManifest.signingKey && twaManifest.signingKey.alias;
      if (!keyPath || !keyAlias) {
        console.error('  ❌ Signing key information is missing in twa-manifest.json');
        hasErrors = true;
      } else {
        console.log(`  ✓ Keystore Path:       ${keyPath}`);
        console.log(`  ✓ Keystore Alias:      ${keyAlias}`);
        if (!fs.existsSync(keyPath)) {
          console.error(`  ❌ Keystore file does not exist at specified path: ${keyPath}`);
          hasErrors = true;
        } else {
          console.log('  ✓ Keystore file exists on disk');
        }
      }
    } catch (e) {
      console.error(`  ❌ Failed to parse twa-manifest.json: ${e.message}`);
      hasErrors = true;
    }
  }

  // 3. Read and inspect app/build.gradle
  console.log('\n[3/4] Inspecting app/build.gradle SDK and Application Settings:');
  const buildGradlePath = path.join(PROJECT_ROOT, 'app', 'build.gradle');
  let compileSdk = null;
  let targetSdk = null;
  let minSdk = null;
  let gradleAppId = null;
  let versionCode = null;
  let versionName = null;

  if (fs.existsSync(buildGradlePath)) {
    const gradleContent = fs.readFileSync(buildGradlePath, 'utf8');

    const compileMatch = gradleContent.match(/compileSdkVersion\s+(\d+)/);
    const targetMatch = gradleContent.match(/targetSdkVersion\s+(\d+)/);
    const minMatch = gradleContent.match(/minSdkVersion\s+(\d+)/);
    const appIdMatch = gradleContent.match(/applicationId\s+["\']([^"\']+)["\']/);
    const codeMatch = gradleContent.match(/versionCode\s+(\d+)/);
    const nameMatch = gradleContent.match(/versionName\s+["\']([^"\']+)["\']/);

    compileSdk = compileMatch ? parseInt(compileMatch[1], 10) : null;
    targetSdk = targetMatch ? parseInt(targetMatch[1], 10) : null;
    minSdk = minMatch ? parseInt(minMatch[1], 10) : null;
    gradleAppId = appIdMatch ? appIdMatch[1] : null;
    versionCode = codeMatch ? parseInt(codeMatch[1], 10) : null;
    versionName = nameMatch ? nameMatch[1] : null;

    console.log(`  ✓ Application ID:      ${gradleAppId}`);
    console.log(`  ✓ compileSdkVersion:   ${compileSdk}`);
    console.log(`  ✓ targetSdkVersion:    ${targetSdk}`);
    console.log(`  ✓ minSdkVersion:       ${minSdk}`);
    console.log(`  ✓ versionCode:         ${versionCode}`);
    console.log(`  ✓ versionName:         "${versionName}"`);

    // Verify Application ID
    if (gradleAppId !== EXPECTED_APP_ID) {
      console.error(`  ❌ Application ID in app/build.gradle is "${gradleAppId}", expected "${EXPECTED_APP_ID}"`);
      hasErrors = true;
    }

    // Verify SDK Levels (API 36 or higher required)
    if (!compileSdk || compileSdk < MIN_API_LEVEL) {
      console.error(`  ❌ compileSdkVersion is ${compileSdk}, but must be API ${MIN_API_LEVEL} or higher`);
      hasErrors = true;
    } else {
      console.log(`  ✓ compileSdkVersion meets requirement (>= API ${MIN_API_LEVEL})`);
    }

    if (!targetSdk || targetSdk < MIN_API_LEVEL) {
      console.error(`  ❌ targetSdkVersion is ${targetSdk}, but must be API ${MIN_API_LEVEL} or higher`);
      hasErrors = true;
    } else {
      console.log(`  ✓ targetSdkVersion meets requirement (>= API ${MIN_API_LEVEL})`);
    }
  }

  // 4. Version code warning (Requirement 7)
  const activeVersionCode = versionCode || (twaManifest && twaManifest.appVersionCode);
  const activeVersionName = versionName || (twaManifest && (twaManifest.appVersionName || twaManifest.appVersion));
  console.log('\n[4/4] Release Version Verification:');
  console.log('⚠️  [VERSION CODE REMINDER]');
  console.log(`   Configured versionCode: ${activeVersionCode} (versionName: "${activeVersionName}")`);
  console.log('   Google Play requires each new release to have a strictly greater versionCode than previous releases.');
  console.log(`   If versionCode ${activeVersionCode} has already been uploaded to Google Play Console,`);
  console.log('   please increment versionCode in twa-manifest.json and app/build.gradle before building.');

  console.log('\n' + '='.repeat(64));
  if (hasErrors) {
    console.error('❌ Check FAILED: Resolve the errors above before building.');
    console.log('='.repeat(64));
    return false;
  }

  console.log('✅ All Android project checks PASSED!');
  console.log('='.repeat(64));
  return true;
}

function runBubblewrapBuild() {
  return new Promise((resolve, reject) => {
    console.log('\n🚀 Starting Bubblewrap build...');
    console.log('   Note: Bubblewrap will use your configured keystore.');
    console.log('   If signing passwords are not in your environment variables,');
    console.log('   you will be prompted securely in the terminal.\n');

    const proc = spawn('bubblewrap', ['build'], {
      cwd: PROJECT_ROOT,
      stdio: 'inherit'
    });

    proc.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Bubblewrap build failed with exit code ${code}`));
      }
    });

    proc.on('error', (err) => {
      reject(new Error(`Failed to execute Bubblewrap CLI: ${err.message}`));
    });
  });
}

function locateAndReportAab() {
  const candidatePaths = [
    path.join(PROJECT_ROOT, 'app-release-bundle.aab'),
    path.join(PROJECT_ROOT, 'app', 'build', 'outputs', 'bundle', 'release', 'app-release.aab')
  ];

  let foundPath = null;
  for (const p of candidatePaths) {
    if (fs.existsSync(p)) {
      foundPath = p;
      break;
    }
  }

  if (!foundPath) {
    console.error('\n❌ Could not find generated .aab bundle file.');
    console.error('Checked locations:');
    candidatePaths.forEach((p) => console.error(` - ${p}`));
    return false;
  }

  const stats = fs.statSync(foundPath);
  const sha256 = getSha256(foundPath);

  console.log('\n' + '='.repeat(64));
  console.log('📦 ANDROID APP BUNDLE (AAB) DETAILS');
  console.log('='.repeat(64));
  console.log(`File:         ${path.basename(foundPath)}`);
  console.log(`Path:         ${foundPath}`);
  console.log(`Size:         ${formatBytes(stats.size)}`);
  console.log(`Modified:     ${stats.mtime.toISOString()}`);
  console.log(`SHA-256:      ${sha256}`);
  console.log('='.repeat(64));
  console.log('\nNext steps for Google Play Store upload:');
  console.log(' 1. Log into Google Play Console: https://play.google.com/console');
  console.log(' 2. Select application "Family Expense Tracker" (io.github.prashiln79.twa)');
  console.log(' 3. Navigate to Release > Production (or Internal / Closed testing)');
  console.log(` 4. Click "Create new release" and upload: ${foundPath}`);
  console.log('='.repeat(64));
  return true;
}

async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'check';
  const shouldSkipBuild = args.includes('--locate') || args.includes('--no-build');

  switch (command) {
    case 'check': {
      const ok = runCheck(false);
      process.exit(ok ? 0 : 1);
      break;
    }
    case 'build': {
      const ok = runCheck(true);
      if (!ok) process.exit(1);
      try {
        await runBubblewrapBuild();
        console.log('\n✅ Build completed successfully.');
      } catch (err) {
        console.error(`\n❌ ${err.message}`);
        process.exit(1);
      }
      break;
    }
    case 'locate': {
      const reported = locateAndReportAab();
      process.exit(reported ? 0 : 1);
      break;
    }
    case 'aab': {
      const ok = runCheck(true);
      if (!ok) process.exit(1);
      try {
        if (!shouldSkipBuild) {
          await runBubblewrapBuild();
        }
        const reported = locateAndReportAab();
        process.exit(reported ? 0 : 1);
      } catch (err) {
        console.error(`\n❌ ${err.message}`);
        process.exit(1);
      }
      break;
    }
    default:
      console.error(`Unknown command "${command}". Available commands: check, build, aab, locate`);
      process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
