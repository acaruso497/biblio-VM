// =====================================================
// routes/biblioteca.js — Versione aggiornata
// =====================================================
// Rispetto alla versione precedente, questa route ora:
//   - Legge e restituisce anche il campo "reset_mezzanotte"
//   - Aggiorna anche "reset_mezzanotte" quando l'admin salva
//
// Il formato degli orari è cambiato: ogni giorno ora
// è un oggetto { dalle, alle, chiuso, evento }
// invece di una semplice stringa.
// Il backend non si preoccupa del formato interno —
// salva e restituisce il JSONB così com'è.
// =====================================================

const express       = require('express');
const database      = require('../database');
const verificaToken = require('../middleware/verificaToken');

const routerBiblioteca = express.Router();


// ─────────────────────────────────────────────────────
// GET /api/biblioteca/stato — Rotta pubblica
// ─────────────────────────────────────────────────────
// Nessuna autenticazione richiesta.
// Restituisce tutti i dati, inclusi il nuovo campo
// reset_mezzanotte (utile per mostrarlo nella dashboard)
// e gli orari nel nuovo formato oggetto per giorno.
routerBiblioteca.get('/stato', async (req, res) => {
  try {
    const risultato = await database.query(
      `SELECT
         e_aperta,
         orari,
         messaggio_speciale,
         reset_mezzanotte,
         aggiornato_il
       FROM impostazioni_biblioteca
       WHERE id = 1`
    );

    if (risultato.rows.length === 0) {
      return res.status(404).json({
        messaggio: 'Impostazioni della biblioteca non trovate.'
      });
    }

    const riga = risultato.rows[0];
    res.status(200).json({
      eAperta:           riga.e_aperta,
      orari:             riga.orari,             // Oggetto JSONB con i dati per giorno
      messaggioSpeciale: riga.messaggio_speciale,
      resetMezzanotte:   riga.reset_mezzanotte,  // La levetta del reset automatico
      aggiornatoIl:      riga.aggiornato_il
    });

  } catch (errore) {
    console.error('Errore nel leggere lo stato della biblioteca:', errore);
    res.status(500).json({
      messaggio: 'Errore interno del server.'
    });
  }
});


// ─────────────────────────────────────────────────────
// PUT /api/biblioteca/aggiorna — Rotta protetta (solo admin)
// ─────────────────────────────────────────────────────
// Aggiorna tutti i campi modificabili dall'admin:
//   - eAperta (boolean)
//   - orari (oggetto JSONB con info per ogni giorno)
//   - messaggioSpeciale (testo libero)
//   - resetMezzanotte (boolean della levetta)
//
// Usiamo COALESCE per aggiornare solo i campi
// effettivamente inviati nella richiesta.
routerBiblioteca.put('/aggiorna', verificaToken, async (req, res) => {

  // Destrutturiamo i dati dalla richiesta
  const { eAperta, orari, messaggioSpeciale, resetMezzanotte } = req.body;

  // Almeno un campo deve essere presente
  if (
    eAperta === undefined &&
    !orari &&
    messaggioSpeciale === undefined &&
    resetMezzanotte === undefined
  ) {
    return res.status(400).json({
      messaggio: 'Nessun dato da aggiornare fornito.'
    });
  }

  try {
    const risultato = await database.query(
      `UPDATE impostazioni_biblioteca
       SET
         e_aperta          = COALESCE($1, e_aperta),
         orari             = COALESCE($2::jsonb, orari),
         messaggio_speciale = COALESCE($3, messaggio_speciale),
         reset_mezzanotte  = COALESCE($4, reset_mezzanotte),
         aggiornato_il     = NOW()
       WHERE id = 1
       RETURNING *`,
      [
        eAperta,
        orari ? JSON.stringify(orari) : null,
        messaggioSpeciale,
        resetMezzanotte
      ]
    );

    if (risultato.rows.length === 0) {
      return res.status(404).json({ messaggio: 'Impostazioni non trovate.' });
    }

    const riga = risultato.rows[0];
    res.status(200).json({
      messaggio: 'Dati aggiornati con successo!',
      dati: {
        eAperta:           riga.e_aperta,
        orari:             riga.orari,
        messaggioSpeciale: riga.messaggio_speciale,
        resetMezzanotte:   riga.reset_mezzanotte,
        aggiornatoIl:      riga.aggiornato_il
      }
    });

  } catch (errore) {
    console.error("Errore nell'aggiornare i dati:", errore);
    res.status(500).json({ messaggio: 'Errore interno del server.' });
  }
});


module.exports = routerBiblioteca;
