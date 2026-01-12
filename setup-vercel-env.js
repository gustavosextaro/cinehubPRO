const fs = require('fs');
const { spawn } = require('child_process');
const path = require('path');

// Read .env.local
const envPath = path.join(__dirname, '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');

// Parse simple dotenv
const envVars = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    const key = match[1].trim();
    let value = match[2].trim();
    // Remove quotes if present
    if (value.startsWith('"') && value.endsWith('"')) {
      value = value.slice(1, -1);
    }
    envVars[key] = value;
  }
});

const keysToAdd = ['FIREBASE_PROJECT_ID', 'FIREBASE_CLIENT_EMAIL', 'FIREBASE_PRIVATE_KEY'];

async function addEnv(key, value) {
  return new Promise((resolve, reject) => {
    console.log(`Setting ${key}...`);
    
    // Command: npx vercel env add [key] production
    const child = spawn('cmd.exe', ['/c', 'npx', 'vercel', 'env', 'add', key, 'production'], {
      stdio: ['pipe', 'inherit', 'inherit']
    });

    // Write value to stdin
    child.stdin.write(value);
    child.stdin.end();

    child.on('close', (code) => {
      if (code === 0) {
        console.log(`✅ ${key} added successfully`);
        resolve();
      } else {
        console.error(`❌ Failed to add ${key}`);
        reject(new Error(`Exit code ${code}`));
      }
    });
  });
}

async function run() {
  for (const key of keysToAdd) {
    if (envVars[key]) {
      try {
        await addEnv(key, envVars[key]);
      } catch (e) {
        console.error(e);
      }
    } else {
      console.warn(`⚠️ ${key} not found in .env.local`);
    }
  }
}

run();
