const fs = require('fs');
const crypto = require('crypto');

const serviceAccount = require('./apps/web/firebase-service-account.json');
const pem = serviceAccount.private_key;

const pemHeader = "-----BEGIN PRIVATE KEY-----";
const pemFooter = "-----END PRIVATE KEY-----";
const pemContents = pem.substring(
    pem.indexOf(pemHeader) + pemHeader.length,
    pem.indexOf(pemFooter)
);

// Function to test
function sanitizeAndDecode(base64) {
    // Mimic the fix: remove everything except base64 chars
    const sanitized = base64.replace(/[^a-zA-Z0-9+/=]/g, "");
    console.log("Original length:", base64.length);
    console.log("Sanitized length:", sanitized.length);
    return Buffer.from(sanitized, 'base64');
}

try {
    const binaryDer = sanitizeAndDecode(pemContents);
    console.log("Successfully decoded private key. Byte length:", binaryDer.length);

    // Verify it's a valid key by trying to create a KeyObject (Node specific check)
    crypto.createPrivateKey(pem);
    console.log("Encryption key is valid.");

} catch (e) {
    console.error("Failed to decode or verify key:", e);
    process.exit(1);
}
