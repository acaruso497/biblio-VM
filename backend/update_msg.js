const { Pool } = require('pg');
require('dotenv').config({ path: 'c:/Users/39351/Desktop/progetto cose/prova/backend/.env' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const nuovoTesto = "Villa Medusa è online! Uno spazio aperto alla citta di Bagnoli, da oggi anche in digitale. Resta sempre aggiornato in tempo reale: se vedi lo stato APERTA, la Biblioteca Popolare è pronta ad accoglierti. Scorri fino in fondo alla pagina per consultare il Calendario e scoprire tutte le attivita e i laboratori in programma per la nostra comunita.";

pool.query("UPDATE impostazioni_biblioteca SET messaggio_speciale = $1 WHERE id = 1", [nuovoTesto])
  .then(() => {
    console.log('Messaggio speciale aggiornato correttamente nel database.');
    process.exit(0);
  })
  .catch(err => {
    console.error('Errore durante l\'aggiornamento:', err);
    process.exit(1);
  });
