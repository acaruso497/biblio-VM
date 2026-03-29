const { Pool } = require('pg');
require('dotenv').config();

const p = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NOME,
  user: process.env.DB_UTENTE,
  password: process.env.DB_PASSWORD,
});

p.query(`
  CREATE TABLE IF NOT EXISTS prestiti_libri (
    id                SERIAL PRIMARY KEY,
    titolo_libro      VARCHAR(255) NOT NULL,
    genere            VARCHAR(100),
    nome_utente       VARCHAR(255) NOT NULL,
    telefono_utente   VARCHAR(50),
    data_prestito     TIMESTAMP DEFAULT NOW(),
    data_restituzione TIMESTAMP,
    stato             VARCHAR(20) DEFAULT 'IN_PRESTITO'
  );
`)
  .then(() => console.log('Tabella prestiti_libri creata con successo.'))
  .catch(console.error)
  .finally(() => p.end());
