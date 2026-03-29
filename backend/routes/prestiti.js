// =====================================================
// routes/prestiti.js — Gestione Prestiti Libri
// =====================================================

const express       = require('express');
const database      = require('../database');
const verificaToken = require('../middleware/verificaToken');

const routerPrestiti = express.Router();

// ─────────────────────────────────────────────────────
// GET /api/prestiti — Legge tutti i prestiti (Protetta)
// ─────────────────────────────────────────────────────
routerPrestiti.get('/', verificaToken, async (req, res) => {
  try {
    const risultato = await database.query(
      `SELECT * FROM prestiti_libri ORDER BY stato ASC, data_prestito DESC`
      // Ordina prima per "IN_PRESTITO" poi per data più recente
    );
    res.status(200).json(risultato.rows);
  } catch (errore) {
    console.error('Errore nel leggere i prestiti:', errore);
    res.status(500).json({ messaggio: 'Errore interno del server.' });
  }
});

// ─────────────────────────────────────────────────────
// POST /api/prestiti — Registra un nuovo prestito (Protetta)
// ─────────────────────────────────────────────────────
routerPrestiti.post('/', verificaToken, async (req, res) => {
  const { titoloLibro, genere, nomeUtente, telefonoUtente } = req.body;

  if (!titoloLibro || !nomeUtente) {
    return res.status(400).json({ messaggio: 'Titolo libro e Nome utente sono obbligatori.' });
  }

  try {
    const risultato = await database.query(
      `INSERT INTO prestiti_libri (titolo_libro, genere, nome_utente, telefono_utente)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [titoloLibro, genere || 'Non specificato', nomeUtente, telefonoUtente || '']
    );

    res.status(201).json({
      messaggio: 'Prestito registrato con successo!',
      prestito: risultato.rows[0]
    });
  } catch (errore) {
    console.error("Errore nella registrazione del prestito:", errore);
    res.status(500).json({ messaggio: 'Errore interno del server.' });
  }
});

// ─────────────────────────────────────────────────────
// PUT /api/prestiti/:id/restituisci — Segna come restituito (Protetta)
// ─────────────────────────────────────────────────────
routerPrestiti.put('/:id/restituisci', verificaToken, async (req, res) => {
  const idPrestito = parseInt(req.params.id);

  if (isNaN(idPrestito)) {
    return res.status(400).json({ messaggio: 'ID Prestito non valido.' });
  }

  try {
    const risultato = await database.query(
      `UPDATE prestiti_libri
       SET stato = 'RESTITUITO', data_restituzione = NOW()
       WHERE id = $1
       RETURNING *`,
      [idPrestito]
    );

    if (risultato.rowCount === 0) {
      return res.status(404).json({ messaggio: 'Nessun prestito trovato con questo ID.' });
    }

    res.status(200).json({
      messaggio: 'Libro segnato come restituito.',
      prestito: risultato.rows[0]
    });
  } catch (errore) {
    console.error("Errore nell'aggiornare il prestito:", errore);
    res.status(500).json({ messaggio: 'Errore interno del server.' });
  }
});

// ─────────────────────────────────────────────────────
// DELETE /api/prestiti/svuota-tutto — Svuota l'intero archivio (Protetta)
// ─────────────────────────────────────────────────────
routerPrestiti.delete('/svuota-tutto', verificaToken, async (req, res) => {
  try {
    const risultato = await database.query(
      `DELETE FROM prestiti_libri WHERE stato = 'RESTITUITO'`
    );
    res.status(200).json({ 
      messaggio: `Archivio pulito: eliminati ${risultato.rowCount} prestiti già restituiti. I prestiti in corso sono stati mantenuti.` 
    });
  } catch (errore) {
    console.error("Errore nello svuotare l'archivio:", errore);
    res.status(500).json({ messaggio: 'Errore durante lo svuotamento dell\'archivio.' });
  }
});

// ─────────────────────────────────────────────────────
// DELETE /api/prestiti/:id — Cancella un record di prestito (Protetta)
// ─────────────────────────────────────────────────────
routerPrestiti.delete('/:id', verificaToken, async (req, res) => {
  const idPrestito = parseInt(req.params.id);

  try {
    const risultato = await database.query(
      `DELETE FROM prestiti_libri 
       WHERE id = $1 AND stato = 'RESTITUITO' 
       RETURNING id`,
      [idPrestito]
    );

    if (risultato.rowCount === 0) {
      // Potrebbe non esistere l'ID, oppure il libro potrebbe essere ancora "IN_PRESTITO"
      const infoLibro = await database.query('SELECT stato FROM prestiti_libri WHERE id = $1', [idPrestito]);
      
      if (infoLibro.rowCount === 0) {
        return res.status(404).json({ messaggio: 'Prestito non trovato.' });
      } else {
        return res.status(403).json({ messaggio: 'Non puoi cancellare un prestito ancora in corso. Deve prima essere restituito!' });
      }
    }

    res.status(200).json({ messaggio: 'Record eliminato con successo.' });
  } catch (errore) {
    console.error("Errore nell'eliminare il prestito:", errore);
    res.status(500).json({ messaggio: 'Errore interno del server.' });
  }
});

module.exports = routerPrestiti;
