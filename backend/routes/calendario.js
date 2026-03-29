// =====================================================
// routes/calendario.js — Gestione del Calendario Mensile
// =====================================================
// API per gestire le attività del calendario.
// Contiene metodi pubblici (lettura) e protetti (scrittura).
// =====================================================

const express       = require('express');
const database      = require('../database');
const verificaToken = require('../middleware/verificaToken');

const routerCalendario = express.Router();

// ─────────────────────────────────────────────────────
// GET /api/calendario/mese — Rotta pubblica
// ─────────────────────────────────────────────────────
// Restituisce tutte le attività di un mese specifico.
// Si aspetta due query parameters: ?anno=2024&mese=5
// (Mese da 1 a 12). Se non specificati, restituisce il mese corrente.
routerCalendario.get('/mese', async (req, res) => {
  try {
    const dataOdierna = new Date();
    const anno = req.query.anno ? parseInt(req.query.anno) : dataOdierna.getFullYear();
    const mese = req.query.mese ? parseInt(req.query.mese) : dataOdierna.getMonth() + 1;

    // Assicuriamoci che i parametri siano validi
    if (isNaN(anno) || isNaN(mese) || mese < 1 || mese > 12) {
      return res.status(400).json({ messaggio: 'Anno o mese non validi.' });
    }

    // Costruiamo le date di inizio e fine mese per la query
    // es per Marzo: dal 2024-03-01 al 2024-03-31
    const dataInizio = `${anno}-${String(mese).padStart(2, '0')}-01`;
    // Per avere l'ultimo giorno del mese usiamo un trucchetto: il giorno 0 del mese SUCCESSIVO
    const dataFine = new Date(anno, mese, 0).toISOString().split('T')[0];

    // Selezioniamo tutte le attività in quel range
    const risultato = await database.query(
      `SELECT
         TO_CHAR(data_esatta, 'YYYY-MM-DD') AS data_esatta,
         titolo,
         descrizione
       FROM calendario_attivita
       WHERE data_esatta BETWEEN $1::DATE AND $2::DATE
       ORDER BY data_esatta ASC`,
      [dataInizio, dataFine]
    );

    res.status(200).json(risultato.rows);

  } catch (errore) {
    console.error('Errore nel leggere le attività del mese:', errore);
    res.status(500).json({ messaggio: 'Errore interno del server.' });
  }
});

// ─────────────────────────────────────────────────────
// POST /api/calendario — Rotta protetta (solo admin)
// ─────────────────────────────────────────────────────
// Aggiunge o aggiorna un'attività in una data specifica.
// Siccome la 'data_esatta' è UNIQUE nel database, se
// esiste già la sovrascrive (UPSERT).
routerCalendario.post('/', verificaToken, async (req, res) => {
  const { dataEsatta, titolo, descrizione } = req.body;

  if (!dataEsatta || !titolo) {
    return res.status(400).json({ messaggio: 'Data e titolo sono obbligatori.' });
  }

  try {
    const risultato = await database.query(
      `INSERT INTO calendario_attivita (data_esatta, titolo, descrizione)
       VALUES ($1::DATE, $2, $3)
       ON CONFLICT (data_esatta)
       DO UPDATE SET
         titolo = EXCLUDED.titolo,
         descrizione = EXCLUDED.descrizione,
         creato_il = NOW()
       RETURNING TO_CHAR(data_esatta, 'YYYY-MM-DD') AS data_esatta, titolo, descrizione`,
      [dataEsatta, titolo, descrizione]
    );

    res.status(200).json({
      messaggio: 'Attività salvata con successo!',
      attivita: risultato.rows[0]
    });

  } catch (errore) {
    console.error("Errore nel salvare l'attività:", errore);
    res.status(500).json({ messaggio: 'Errore interno del server.' });
  }
});

// ─────────────────────────────────────────────────────
// DELETE /api/calendario/:data — Rotta protetta (solo admin)
// ─────────────────────────────────────────────────────
// Rimuove un'attività in base alla data esatta.
routerCalendario.delete('/:data', verificaToken, async (req, res) => {
  const dataDaCancellare = req.params.data; // Formato YYYY-MM-DD

  try {
    const risultato = await database.query(
      `DELETE FROM calendario_attivita
       WHERE data_esatta = $1::DATE
       RETURNING TO_CHAR(data_esatta, 'YYYY-MM-DD') AS data_esatta`,
      [dataDaCancellare]
    );

    if (risultato.rowCount === 0) {
      return res.status(404).json({ messaggio: 'Nessuna attività trovata in questa data.' });
    }

    res.status(200).json({ messaggio: 'Attività eliminata con successo.' });

  } catch (errore) {
    console.error("Errore nell'eliminare l'attività:", errore);
    res.status(500).json({ messaggio: 'Errore interno del server.' });
  }
});

module.exports = routerCalendario;
