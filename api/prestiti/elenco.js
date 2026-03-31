const database = require('../../backend/database');
const verificaToken = require('../../backend/middleware/verificaToken');

module.exports = async (req, res) => {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method !== 'GET') return res.status(405).json({ messaggio: 'Metodo non consentito.' });

  return verificaToken(req, res, async () => {
    try {
      const risultato = await database.query(
        `SELECT * FROM prestiti_libri ORDER BY stato ASC, data_prestito DESC`
      );
      res.status(200).json(risultato.rows);
    } catch (errore) {
      console.error('Errore nel leggere i prestiti:', errore);
      res.status(500).json({ messaggio: 'Errore interno del server.' });
    }
  });
};
