// Simple test to check environment variables
require('dotenv').config({ path: '.env.local' });

console.log('=== ENVIRONMENT VARIABLES CHECK ===\n');

const projectId = process.env.FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_PRIVATE_KEY;

console.log('1. FIREBASE_PROJECT_ID:', projectId);
console.log('2. FIREBASE_CLIENT_EMAIL:', clientEmail);
console.log('3. FIREBASE_PRIVATE_KEY exists:', !!privateKey);
console.log('4. FIREBASE_PRIVATE_KEY length:', privateKey?.length);

if (privateKey) {
  console.log('5. FIREBASE_PRIVATE_KEY starts with:', privateKey.substring(0, 30));
  console.log('6. FIREBASE_PRIVATE_KEY has newlines:', privateKey.includes('\\n'));
  console.log('7. FIREBASE_PRIVATE_KEY has actual newlines:', privateKey.includes('\n'));
}

console.log('\n=== VALIDATION ===');
const issues = [];

if (!projectId) issues.push('❌ Missing FIREBASE_PROJECT_ID');
else console.log('✅ FIREBASE_PROJECT_ID is set');

if (!clientEmail) issues.push('❌ Missing FIREBASE_CLIENT_EMAIL');
else console.log('✅ FIREBASE_CLIENT_EMAIL is set');

if (!privateKey) issues.push('❌ Missing FIREBASE_PRIVATE_KEY');
else if (!privateKey.includes('BEGIN PRIVATE KEY')) issues.push('❌ FIREBASE_PRIVATE_KEY format is invalid');
else console.log('✅ FIREBASE_PRIVATE_KEY format looks correct');

if (issues.length > 0) {
  console.log('\n⚠️  Issues found:');
  issues.forEach(issue => console.log(issue));
  process.exit(1);
} else {
  console.log('\n✅ All environment variables are properly configured!');
  process.exit(0);
}
