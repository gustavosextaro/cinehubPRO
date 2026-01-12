const https = require('https');

const projects = [
  'gustavosextarocinehub.vercel.app',
  'cinehub-gustavosextaro.vercel.app',
  'cine-hub-gustavo.vercel.app',
  'cinehub-delta.vercel.app'
];

console.log('🔍 Scanning for deployed URL...\n');

projects.forEach(domain => {
  const url = `https://${domain}`;
  https.get(url, (res) => {
    if (res.statusCode !== 404) {
      console.log(`✅ FOUND: ${url} (Status: ${res.statusCode})`);
    }
  }).on('error', () => {});
});
