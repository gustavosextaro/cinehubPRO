const https = require('https');

console.log('Testing endpoint existence...\n');

// Test 1: Check if main site is up
https.get('https://cinehub-gustavosextaro.netlify.app/', (res) => {
  console.log(`✅ Main site status: ${res.statusCode}`);
}).on('error', (e) => {
  console.error(`❌ Main site error: ${e.message}`);
});

// Test 2: Check migration endpoint
setTimeout(() => {
const options = {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer change-me-in-production',
    'Content-Type': 'application/json'
  }
};

const req = https.request('https://cinehub-gustavosextaro.netlify.app/api/migrate-analytics', options, (res) => {
  console.log(`\n📡 Migration endpoint status: ${res.statusCode}`);
  
  let body = '';
  res.on('data', (chunk) => { body += chunk; });
  res.on('end', () => {
    console.log('Response:', body);
    
    if (res.statusCode === 404) {
      console.log('\n⚠️  Endpoint not found - deploy may not be complete yet');
    } else if (res.statusCode === 401) {
      console.log('\n⚠️  Unauthorized - wrong API key');
    } else if (res.statusCode === 200) {
      console.log('\n✅ Migration successful!');
      try {
        const json = JSON.parse(body);
        console.log(JSON.stringify(json, null, 2));
      } catch(e) {}
    }
  });
});

req.on('error', (e) => {
  console.error('❌ Error:', e.message);
});

req.end();
}, 1000);
