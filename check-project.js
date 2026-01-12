require('dotenv').config({ path: '.env.local' });

console.log('\n========================================');
console.log('🔍 VERIFICAÇÃO DO PROJETO FIREBASE');
console.log('========================================\n');

const projectId = process.env.FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;

console.log('📋 Projeto Firebase Configurado:');
console.log('   Project ID:', projectId);
console.log('   Client Email:', clientEmail);
console.log('');

// Extract project from email if possible
if (clientEmail) {
  const match = clientEmail.match(/@(.+)\.iam\.gserviceaccount\.com/);
  if (match) {
    console.log('📧 Projeto extraído do email:', match[1]);
  }
}

console.log('\n⚠️  IMPORTANTE:');
console.log('   Se você criou um NOVO projeto Firebase hoje,');
console.log('   você precisa atualizar as credenciais no .env.local');
console.log('   com as novas chaves do projeto novo.');
console.log('');
console.log('   As quotas do Firebase são POR PROJETO.');
console.log('   Se o projeto acima for o antigo (que esgotou),');
console.log('   você precisa trocar para o novo projeto.');
console.log('========================================\n');
