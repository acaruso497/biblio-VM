// =====================================================
// routes/calendario.js — Gestione del Calendario Mensile
// =====================================================

const express       = require('express');
const database      = require('../database');
const verificaToken = require('../middleware/verificaToken');

const routerCalendario = express.Router();

// ─────────────────────────────────────────────────────
// GET /api/calendario/mese — Rotta pubblica
// ─────────────────────────────────────────────────────
routerCalendario.get('/mese', async (req, res) => {
  try {
    const dataOdierna = new Date();
    const anno = req.query.anno ? parseInt(req.query.anno) : dataOdierna.getFullYear();
    const mese = req.query.mese ? parseInt(req.query.mese) : dataOdierna.getMonth() + 1;

    if (isNaN(anno) || isNaN(mese) || mese < 1 || mese > 12) {
      return res.status(400).json({ messaggio: 'Anno o mese non validi.' });
    }

    const dataInizio = `${anno}-${String(mese).padStart(2, '0')}-01`;
    const dataFine   = new Date(anno, mese, 0).toISOString().split('T')[0];

    const risultato = await database.query(
      `SELECT
         id,
         TO_CHAR(data_esatta, 'YYYY-MM-DD') AS data_esatta,
         titolo,
         descrizione,
         TO_CHAR(start_time, 'HH24:MI') AS start_time,
         TO_CHAR(end_time,   'HH24:MI') AS end_time
       FROM calendario_attivita
       WHERE data_esatta BETWEEN $1::DATE AND $2::DATE
       ORDER BY data_esatta ASC`,
      [dataInizio, dataFine]
    );

    res.status(200).json(risultato.rows);

  } catch (errore) {
    console.error('[GET /mese] Errore:', errore.message);
    res.status(500).json({ messaggio: 'Errore interno del server.' });
  }
});

// ─────────────────────────────────────────────────────
// POST /api/calendario — Rotta protetta (solo admin)
// ─────────────────────────────────────────────────────
// Aggiunge un'attività. Se isRecurring=true genera una
// riga per ogni occorrenza settimanale (stesso giorno
// della settimana) dalla data selezionata fino alla
// fine del mese, esclusi i giorni già passati.
// ─────────────────────────────────────────────────────
routerCalendario.post('/', verificaToken, async (req, res) => {
  const { dataEsatta, titolo, descrizione, startTime, endTime, isRecurring } = req.body;

  // ── Validazione input ────────────────────────────
  if (!dataEsatta || !titolo || !titolo.trim()) {
    return res.status(400).json({ messaggio: 'Data e titolo sono obbligatori.' });
  }
  if (!startTime || typeof startTime !== 'string' || !startTime.includes(':')) {
    return res.status(400).json({ messaggio: "L'ora di inizio è obbligatoria (formato HH:mm)." });
  }

  // Normalizza endTime: stringa vuota o non valida → null
  const endTimeNorm = (endTime && typeof endTime === 'string' && endTime.includes(':'))
    ? endTime
    : null;

  console.log('[POST /calendario] Payload ricevuto:', {
    dataEsatta, titolo, startTime, endTimeNorm, isRecurring
  });

  try {
    // ── Calcolo date target ──────────────────────────
    const dateTarget = [];

    // Costruiamo la data di partenza come stringa pura (evita shift timezone)
    const [annoBase, meseBase, giornoBase] = dataEsatta.split('-').map(Number);

    if (isRecurring) {
      // Data corrente (solo giorno, senza ore)
      const oggiObj = new Date();
      oggiObj.setHours(0, 0, 0, 0);

      // Ultimo giorno del mese base (0-indexed mese: meseBase-1)
      const ultimoGiornoMese = new Date(annoBase, meseBase, 0).getDate();

      // Giorno della settimana della data di partenza (0=Dom..6=Sab)
      const dataPartenzaObj = new Date(annoBase, meseBase - 1, giornoBase);
      const giornoSettimana  = dataPartenzaObj.getDay();

      console.log('[POST /calendario] Ricorrenze: giorno settimana =', giornoSettimana,
        '| fino al', ultimoGiornoMese, '/', meseBase, '/', annoBase);

      // Itera ogni settimana a partire da giornoBase
      for (let g = giornoBase; g <= ultimoGiornoMese; g += 7) {
        const candidato = new Date(annoBase, meseBase - 1, g);
        // Doppio check: stesso giorno della settimana (sempre vero con +7)
        // e non nel passato
        if (candidato >= oggiObj && candidato.getDay() === giornoSettimana) {
          const iso = `${candidato.getFullYear()}-${String(candidato.getMonth() + 1).padStart(2, '0')}-${String(candidato.getDate()).padStart(2, '0')}`;
          dateTarget.push(iso);
          console.log('[POST /calendario] Aggiunta data ricorrente:', iso);
        }
      }
    } else {
      dateTarget.push(dataEsatta);
    }

    if (dateTarget.length === 0) {
      return res.status(400).json({ messaggio: 'Nessuna data valida da inserire (tutte nel passato).' });
    }

    console.log('[POST /calendario] Date da inserire:', dateTarget);

    // ── Inserimento ─────────────────────────────────
    // Nota: la colonna data_esatta NON ha più il vincolo UNIQUE,
    // quindi usiamo INSERT semplice (no ON CONFLICT).
    const righeInserite = [];

    for (const iso of dateTarget) {
      console.log(`[POST /calendario] Inserisco: ${iso} | start=${startTime} | end=${endTimeNorm}`);

      const ris = await database.query(
        `INSERT INTO calendario_attivita
           (data_esatta, titolo, descrizione, start_time, end_time, is_recurring)
         VALUES
           ($1::DATE, $2, $3, $4::TIME, $5::TIME, $6)
         RETURNING
           id,
           TO_CHAR(data_esatta, 'YYYY-MM-DD') AS data_esatta,
           titolo,
           descrizione,
           TO_CHAR(start_time, 'HH24:MI') AS start_time,
           TO_CHAR(end_time,   'HH24:MI') AS end_time`,
        [iso, titolo.trim(), descrizione || null, startTime, endTimeNorm, !!isRecurring]
      );

      righeInserite.push(ris.rows[0]);
    }

    console.log(`[POST /calendario] Inserite ${righeInserite.length} righe con successo.`);

    res.status(200).json({
      messaggio: `${righeInserite.length} attività salvate con successo!`,
      attivita:  righeInserite
    });

  } catch (errore) {
    console.error("[POST /calendario] ERRORE nel catch:", errore.message);
    console.error("[POST /calendario] STACK:", errore.stack);
    res.status(500).json({ messaggio: 'Errore interno del server: ' + errore.message });
  }
});

// ─────────────────────────────────────────────────────
// PUT /api/calendario/:id — Rotta protetta (solo admin)
// ─────────────────────────────────────────────────────
routerCalendario.put('/:id', verificaToken, async (req, res) => {
  const idAttivita = parseInt(req.params.id);
  const { titolo, descrizione, startTime, endTime } = req.body;

  if (isNaN(idAttivita)) {
    return res.status(400).json({ messaggio: 'ID non valido.' });
  }
  if (!titolo || !titolo.trim()) {
    return res.status(400).json({ messaggio: 'Il titolo è obbligatorio.' });
  }
  if (!startTime || typeof startTime !== 'string' || !startTime.includes(':')) {
    return res.status(400).json({ messaggio: "L'ora di inizio è obbligatoria." });
  }

  const endTimeNorm = (endTime && typeof endTime === 'string' && endTime.includes(':'))
    ? endTime
    : null;

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
         TO_CHAR(end_time,   'HH24:MI') AS end_time`,
      [titolo.trim(), descrizione || null, startTime, endTimeNorm, idAttivita]
    );

    if (risultato.rowCount === 0) {
      return res.status(404).json({ messaggio: 'Attività non trovata.' });
    }

    res.status(200).json({
      messaggio: 'Attività aggiornata con successo!',
      attivita:  risultato.rows[0]
    });

  } catch (errore) {
    console.error("[PUT /calendario/:id] ERRORE:", errore.message);
    res.status(500).json({ messaggio: 'Errore interno del server.' });
  }
});

// ─────────────────────────────────────────────────────
// DELETE /api/calendario/:data — Rotta protetta (solo admin)
// ─────────────────────────────────────────────────────
routerCalendario.delete('/:data', verificaToken, async (req, res) => {
  const dataDaCancellare = req.params.data;

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
    console.error("[DELETE /calendario/:data] ERRORE:", errore.message);
    res.status(500).json({ messaggio: 'Errore interno del server.' });
  }
});

module.exports = routerCalendario;
