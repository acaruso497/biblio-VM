const database = require('../../../backend/database');
const verificaToken = require('../../../backend/middleware/verificaToken');

module.exports = async (req, res) => {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method !== 'DELETE') return res.status(405).json({ messaggio: 'Metodo non consentito.' });

  return verificaToken(req, res, async () => {
    const idPrestito = parseInt(req.query.id);

    try {
      const risultato = await database.query(
        `DELETE FROM prestiti_libri 
         WHERE id = $1 AND stato = 'RESTITUITO' 
         RETURNING id`,
        [idPrestito]
      );

      if (risultato.rowCount === 0) {
        const infoLibro = await database.query('SELECT stato FROM prestiti_libri WHERE id = $1', [idPrestito]);
        if (infoLibro.rowCount === 0) {
          return res.status(404).json({ messaggio: 'Prestito non trovato.' });
        } else {
          return res.status(403).json({ messaggio: 'Non puoi cancellare un prestito ancora in corso.' });
        }
      }

      res.status(200).json({ messaggio: 'Record eliminato con successo.' });
    } catch (errore) {
      console.error("Errore nell'eliminare il prestito:", errore);
      res.status(500).json({ messaggio: 'Errore interno del server.' });
    }
  });
};
