// =====================================================
// database.js — Connessione a PostgreSQL
// =====================================================
// Questo file si occupa di una cosa sola: connettersi
// al database PostgreSQL e mettere a disposizione
// del resto dell'applicazione un "pool" di connessioni.
//
// Un "pool" è come un gruppo di connessioni già pronte
// all'uso: invece di aprire e chiudere una connessione
// ogni volta che facciamo una query, ne teniamo alcune
// sempre aperte e le riusiamo. È molto più efficiente!
// =====================================================

// Carichiamo le variabili d'ambiente dal file .env
// (chi contiene DB_HOST, DB_PORT, ecc.)
require('dotenv').config();

// Importiamo il modulo 'pg' che ci permette di parlare
// con PostgreSQL da Node.js
const { Pool } = require('pg');

// Creiamo il pool di connessioni usando i valori
// che abbiamo scritto nel file .env
const poolDiConnessioni = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Proviamo subito a connetterci per verificare
// che le credenziali nel .env siano corrette.
// Se qualcosa va storto, lo stampiamo nella console.
poolDiConnessioni.connect((errore, client, rilasciaClient) => {
  if (errore) {
    // Se c'è un errore di connessione, lo mostriamo chiaramente
    console.error('❌ Errore di connessione al database PostgreSQL:', errore.message);
    return;
  }
  // Se arrivamo qui, la connessione è andata a buon fine!
  console.log('✅ Connesso con successo al database PostgreSQL!');
  // Rilasciamo il client (lo "rimettiamo a disposizione" del pool)
  rilasciaClient();
});

// Esportiamo il pool così gli altri file possono usarlo
// per fare query al database con: pool.query('SELECT ...')
module.exports = poolDiConnessioni;
