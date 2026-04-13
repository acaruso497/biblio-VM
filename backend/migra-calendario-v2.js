// =====================================================
// migra-calendario-v2.js — Esegue la migrazione DB
// =====================================================
// Aggiunge start_time, end_time, is_recurring alla
// tabella calendario_attivita su Neon.tech.
//
// Esegui con: node migra-calendario-v2.js
// (dalla cartella backend/)
// =====================================================

const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function eseguiMigrazione() {
  const client = await pool.connect();
  try {
    console.log('🔄 Avvio migrazione calendario v2...\n');

    // ─── 1. Rimuovi UNIQUE constraint su data_esatta ───
    // (se esiste) per permettere più attività per giorno
    const checkConstraint = await client.query(`
      SELECT 1 FROM pg_constraint
      WHERE conname = 'calendario_attivita_data_esatta_key'
    `);

    if (checkConstraint.rowCount > 0) {
      await client.query(`
        ALTER TABLE calendario_attivita
        DROP CONSTRAINT calendario_attivita_data_esatta_key;
      `);
      console.log('✅ Constraint UNIQUE su data_esatta rimosso.');
    } else {
      console.log('ℹ️  Constraint UNIQUE assente, nessuna azione.');
    }

    // ─── 2. Aggiungi start_time ────────────────────────
    await client.query(`
      ALTER TABLE calendario_attivita
      ADD COLUMN IF NOT EXISTS start_time TIME;
    `);
    console.log('✅ Colonna start_time aggiunta (o già esistente).');

    // ─── 3. Aggiungi end_time ──────────────────────────
    await client.query(`
      ALTER TABLE calendario_attivita
      ADD COLUMN IF NOT EXISTS end_time TIME;
    `);
    console.log('✅ Colonna end_time aggiunta (o già esistente).');

    // ─── 4. Aggiungi is_recurring ──────────────────────
    await client.query(`
      ALTER TABLE calendario_attivita
      ADD COLUMN IF NOT EXISTS is_recurring BOOLEAN DEFAULT false;
    `);
    console.log('✅ Colonna is_recurring aggiunta (o già esistente).\n');

    // ─── 5. Verifica struttura finale ─────────────────
    const struttura = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'calendario_attivita'
      ORDER BY ordinal_position;
    `);

    console.log('📋 Struttura tabella calendario_attivita:');
    struttura.rows.forEach(r => {
      console.log(`   ${r.column_name.padEnd(20)} ${r.data_type.padEnd(25)} nullable=${r.is_nullable}`);
    });

    console.log('\n🎉 Migrazione completata con successo!');

  } catch (errore) {
    console.error('❌ Errore durante la migrazione:', errore.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

eseguiMigrazione();
