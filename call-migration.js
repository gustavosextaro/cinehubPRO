const https = require('https');

const options = {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer change-me-in-production',
    'Content-Type': 'application/json'
  }
};

console.log('🔄 Calling migration endpoint...\n');

const req = https.request('https://cinehub-gustavosextaro.netlify.app/api/migrate-analytics', options, (res) => {
  console.log(`Status Code: ${res.statusCode}\n`);
  
  let body = '';
  
  res.on('data', (chunk) => {
    body += chunk;
  });

  res.on('end', () => {
    console.log('Response Body:');
    console.log(body);
    console.log('\n---\n');
    
    try {
      const json = JSON.parse(body);
      console.log('Parsed JSON:');
      console.log(JSON.stringify(json, null, 2));
    } catch (e) {
      console.log('(Not valid JSON)');
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Request Error:', error.message);
});

req.end();
