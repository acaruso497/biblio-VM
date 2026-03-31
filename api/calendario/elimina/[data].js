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
    // Su Vercel, i parametri dinamici [data] sono in req.query
    const dataDaCancellare = req.query.data; 

    if (!dataDaCancellare) {
      return res.status(400).json({ messaggio: 'Data non fornita.' });
    }

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
};
