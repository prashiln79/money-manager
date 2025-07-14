// index.js

const admin = require('firebase-admin');
const readline = require('readline');

// Path to your service account key JSON file
const serviceAccount = require('./key.json'); // Replace with your actual filename

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Prompt for email
rl.question('Enter the user email to assign admin role: ', async (email) => {
  try {
    const user = await admin.auth().getUserByEmail(email);

    // Set custom claims
    await admin.auth().setCustomUserClaims(user.uid, { admin: true });

    console.log(`✅ Successfully set admin claim for ${email} (UID: ${user.uid})`);
  } catch (error) {
    console.error('❌ Error setting admin claim:', error.message);
  } finally {
    rl.close();
  }
});
