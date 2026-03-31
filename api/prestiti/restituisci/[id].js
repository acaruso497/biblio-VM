const database = require('../../../backend/database');
const verificaToken = require('../../../backend/middleware/verificaToken');

module.exports = async (req, res) => {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method !== 'PUT') return res.status(405).json({ messaggio: 'Metodo non consentito.' });

  return verificaToken(req, res, async () => {
    const idPrestito = parseInt(req.query.id);

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
};
