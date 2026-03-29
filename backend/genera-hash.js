// Script temporaneo: genera l'hash bcrypt della password admin
// Esegui con: node genera-hash.js
const bcrypt = require('bcrypt');

async function main() {
  const passwordAdminApp = 'biblioteca2025';
  const hash = await bcrypt.hash(passwordAdminApp, 10);
  console.log('\n✅ Hash bcrypt generato:');
  console.log(hash);
  console.log('\nCopia questo hash nel file seed.sql');
}

main().catch(console.error);
