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

    if (isNaN(anno) || isNaN(mese) || mese < 1 || mese > 12) {
      return res.status(400).json({ messaggio: 'Anno o mese non validi.' });
    }

    const dataInizio = `${anno}-${String(mese).padStart(2, '0')}-01`;
    const dataFine = new Date(anno, mese, 0).toISOString().split('T')[0];

    const risultato = await database.query(
      `SELECT
         id,
         TO_CHAR(data_esatta, 'YYYY-MM-DD') AS data_esatta,
         titolo,
         descrizione,
         TO_CHAR(start_time, 'HH24:MI') AS start_time,
         TO_CHAR(end_time, 'HH24:MI')   AS end_time
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
// Aggiunge un'attività in una data specifica.
// Se isRecurring = true, genera un inserimento per ogni
// istanza dello stesso giorno della settimana fino alla
// fine del mese corrente, escludendo i giorni passati.
routerCalendario.post('/', verificaToken, async (req, res) => {
  const { dataEsatta, titolo, descrizione, startTime, endTime, isRecurring } = req.body;

  if (!dataEsatta || !titolo) {
    return res.status(400).json({ messaggio: 'Data e titolo sono obbligatori.' });
  }
  if (!startTime) {
    return res.status(400).json({ messaggio: 'L\'ora di inizio è obbligatoria.' });
  }

  try {
    // Calcola tutte le date da inserire
    const dateTarget = [];
    const dataBase = new Date(dataEsatta + 'T00:00:00'); // evita shift timezone

    if (isRecurring) {
      // Genera tutte le occorrenze dello stesso giorno della settimana
      // dalla data selezionata fino alla fine del mese
      const annoBase = dataBase.getFullYear();
      const meseBase = dataBase.getMonth(); // 0-indexed
      const giornoSettimana = dataBase.getDay(); // 0=Dom, 1=Lun, ...

      // Oggi per non inserire giorni passati
      const oggiObj = new Date();
      oggiObj.setHours(0, 0, 0, 0);

      // Fine del mese
      const fineDelMese = new Date(annoBase, meseBase + 1, 0);

      let corrente = new Date(dataBase);
      while (corrente <= fineDelMese) {
        if (corrente >= oggiObj) {
          const isoStr = `${corrente.getFullYear()}-${String(corrente.getMonth() + 1).padStart(2, '0')}-${String(corrente.getDate()).padStart(2, '0')}`;
          dateTarget.push(isoStr);
        }
        // Avanza di 7 giorni (prossima settimana, stesso giorno)
        corrente = new Date(corrente.getTime() + 7 * 24 * 60 * 60 * 1000);
      }
    } else {
      // Singola data
      dateTarget.push(dataEsatta);
    }

    if (dateTarget.length === 0) {
      return res.status(400).json({ messaggio: 'Nessuna data valida da inserire (tutte nel passato).' });
    }

    // Inserisci tutte le date con UPSERT
    const righeInserite = [];
    for (const dataTarget of dateTarget) {
      const ris = await database.query(
        `INSERT INTO calendario_attivita (data_esatta, titolo, descrizione, start_time, end_time)
         VALUES ($1::DATE, $2, $3, $4::TIME, $5::TIME)
         ON CONFLICT (data_esatta)
         DO UPDATE SET
           titolo      = EXCLUDED.titolo,
           descrizione = EXCLUDED.descrizione,
           start_time  = EXCLUDED.start_time,
           end_time    = EXCLUDED.end_time,
           creato_il   = NOW()
         RETURNING
           id,
           TO_CHAR(data_esatta, 'YYYY-MM-DD') AS data_esatta,
           titolo,
           descrizione,
           TO_CHAR(start_time, 'HH24:MI') AS start_time,
           TO_CHAR(end_time, 'HH24:MI')   AS end_time`,
        [dataTarget, titolo, descrizione || null, startTime, endTime || null]
      );
      righeInserite.push(ris.rows[0]);
    }

    res.status(200).json({
      messaggio: `${righeInserite.length} attività salvate con successo!`,
      attivita: righeInserite
    });

  } catch (errore) {
    console.error("Errore nel salvare l'attività:", errore);
    res.status(500).json({ messaggio: 'Errore interno del server.' });
  }
});

// ─────────────────────────────────────────────────────
// PUT /api/calendario/:id — Rotta protetta (solo admin)
// ─────────────────────────────────────────────────────
// Modifica titolo, descrizione, ora inizio e ora fine
// di un'attività esistente identificata per ID.
routerCalendario.put('/:id', verificaToken, async (req, res) => {
  const idAttivita = parseInt(req.params.id);
  const { titolo, descrizione, startTime, endTime } = req.body;

  if (isNaN(idAttivita)) {
    return res.status(400).json({ messaggio: 'ID non valido.' });
  }
  if (!titolo || !titolo.trim()) {
    return res.status(400).json({ messaggio: 'Il titolo è obbligatorio.' });
  }
  if (!startTime) {
    return res.status(400).json({ messaggio: 'L\'ora di inizio è obbligatoria.' });
  }

  try {
    const risultato = await database.query(
      `UPDATE calendario_attivita
       SET
         titolo      = $1,
         descrizione = $2,
         start_time  = $3::TIME,
         end_time    = $4::TIME
       WHERE id = $5
       RETURNING
         id,
         TO_CHAR(data_esatta, 'YYYY-MM-DD') AS data_esatta,
         titolo,
         descrizione,
         TO_CHAR(start_time, 'HH24:MI') AS start_time,
         TO_CHAR(end_time, 'HH24:MI')   AS end_time`,
      [titolo.trim(), descrizione || null, startTime, endTime || null, idAttivita]
    );

    if (risultato.rowCount === 0) {
      return res.status(404).json({ messaggio: 'Attività non trovata.' });
    }

    res.status(200).json({
      messaggio: 'Attività aggiornata con successo!',
      attivita: risultato.rows[0]
    });

  } catch (errore) {
    console.error("Errore nell'aggiornare l'attività:", errore);
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
