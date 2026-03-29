const pool = require('./database');
const fs = require('fs');
const path = require('path');

async function initDb() {
  try {
    console.log('Leggo seed.sql...');
    const seedSql = fs.readFileSync(path.join(__dirname, 'seed.sql'), 'utf-8');
    console.log('Eseguo seed.sql...');
    await pool.query(seedSql);
    console.log('✅ seed.sql eseguito!');

    console.log('Leggo aggiorna-db.sql...');
    const aggiornaSql = fs.readFileSync(path.join(__dirname, 'aggiorna-db.sql'), 'utf-8');
    console.log('Eseguo aggiorna-db.sql...');
    await pool.query(aggiornaSql);
    console.log('✅ aggiorna-db.sql eseguito!');

    console.log('🎉 Database inizializzato con successo su Neon!');
  } catch (error) {
    console.error('❌ Errore durante l\'inizializzazione del database:', error);
  } finally {
    process.exit(0);
  }
}

initDb();
