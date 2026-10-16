const fs = require('fs');
const path = require('path');
// Load .env file natively if it exists
const envFilePath = path.join(__dirname, '../.env');
if (fs.existsSync(envFilePath)) {
  const envContent = fs.readFileSync(envFilePath, 'utf-8');
  envContent.split(/\r?\n/).forEach(line => {
    line = line.trim();
    if (line && !line.startsWith('#')) {
      const equalsIdx = line.indexOf('=');
      if (equalsIdx > 0) {
        const key = line.slice(0, equalsIdx).trim();
        let value = line.slice(equalsIdx + 1).trim();
        if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
          value = value.slice(1, -1);
        }
        process.env[key] = value;
      }
    }
  });
}


const targetDir = path.join(__dirname, '../src/environments');
const targetPath = path.join(targetDir, 'environment.ts');
const prodTargetPath = path.join(targetDir, 'environment.prod.ts');

// Create environments directory if it doesn't exist
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

const envConfigFile = `export const environment = {
  baseUrl: '${process.env.BASE_URL || 'https://prashiln79.github.io/money-manager'}',
  serviceWorkerScope: '/',
  production: false,
  defaultAppTheme: 'light-theme',
  firebaseConfig: {
    apiKey: "${process.env.FIREBASE_API_KEY || ''}",
    authDomain: "${process.env.FIREBASE_AUTH_DOMAIN || ''}",
    projectId: "${process.env.FIREBASE_PROJECT_ID || ''}",
    storageBucket: "${process.env.FIREBASE_STORAGE_BUCKET || ''}",
    messagingSenderId: "${process.env.FIREBASE_MESSAGING_SENDER_ID || ''}",
    appId: "${process.env.FIREBASE_APP_ID || ''}",
    measurementId: "${process.env.FIREBASE_MEASUREMENT_ID || ''}"
  },
  vapidKey: "${process.env.VAPID_KEY || ''}",
  openAiApiKey: '${process.env.OPENAI_API_KEY || ''}',
  SLACK_WEBHOOK_URL: '${process.env.SLACK_WEBHOOK_URL || ''}',
  googleClientId: '${process.env.GOOGLE_CLIENT_ID || ''}',
  contactSpreadsheetId: '${process.env.CONTACT_SPREADSHEET_ID || ''}'
};
`;

const prodEnvConfigFile = `export const environment = {
  baseUrl: '${process.env.BASE_URL || 'https://prashiln79.github.io/money-manager'}',
  serviceWorkerScope: '/money-manager/',
  production: true,
  defaultAppTheme: 'light-theme',
  firebaseConfig: {
    apiKey: "${process.env.FIREBASE_API_KEY || ''}",
    authDomain: "${process.env.FIREBASE_AUTH_DOMAIN || ''}",
    projectId: "${process.env.FIREBASE_PROJECT_ID || ''}",
    storageBucket: "${process.env.FIREBASE_STORAGE_BUCKET || ''}",
    messagingSenderId: "${process.env.FIREBASE_MESSAGING_SENDER_ID || ''}",
    appId: "${process.env.FIREBASE_APP_ID || ''}",
    measurementId: "${process.env.FIREBASE_MEASUREMENT_ID || ''}"
  },
  vapidKey: "${process.env.VAPID_KEY || ''}",
  openAiApiKey: '${process.env.OPENAI_API_KEY || ''}',
  SLACK_WEBHOOK_URL: '${process.env.SLACK_WEBHOOK_URL || ''}',
  googleClientId: '${process.env.GOOGLE_CLIENT_ID || ''}',
  contactSpreadsheetId: '${process.env.CONTACT_SPREADSHEET_ID || ''}'
};
`;

console.log('Generating environment files...');

fs.writeFileSync(targetPath, envConfigFile);
fs.writeFileSync(prodTargetPath, prodEnvConfigFile);

console.log(`Output generated at ${targetPath} and ${prodTargetPath}`);
