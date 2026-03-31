const database = require('../../backend/database');
const verificaToken = require('../../backend/middleware/verificaToken');

module.exports = async (req, res) => {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method !== 'POST') return res.status(405).json({ messaggio: 'Metodo non consentito.' });

  return verificaToken(req, res, async () => {
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
};
