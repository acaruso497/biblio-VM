const database = require('../../backend/database');
const verificaToken = require('../../backend/middleware/verificaToken');

module.exports = async (req, res) => {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method !== 'PUT') return res.status(405).json({ messaggio: 'Metodo non consentito.' });

  return verificaToken(req, res, async () => {
    const { eAperta, orari, messaggioSpeciale, resetMezzanotte } = req.body;

    if (eAperta === undefined && !orari && messaggioSpeciale === undefined && resetMezzanotte === undefined) {
      return res.status(400).json({ messaggio: 'Nessun dato da aggiornare fornito.' });
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
        [eAperta, orari ? JSON.stringify(orari) : null, messaggioSpeciale, resetMezzanotte]
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
};
