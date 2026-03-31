const database = require('../../backend/database');
const verificaToken = require('../../backend/middleware/verificaToken');

module.exports = async (req, res) => {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method !== 'DELETE') return res.status(405).json({ messaggio: 'Metodo non consentito.' });

  return verificaToken(req, res, async () => {
    try {
      const risultato = await database.query(
        `DELETE FROM prestiti_libri WHERE stato = 'RESTITUITO'`
      );
      res.status(200).json({ 
        messaggio: `Archivio pulito: eliminati ${risultato.rowCount} prestiti già restituiti.` 
      });
    } catch (errore) {
      console.error("Errore nello svuotare l'archivio:", errore);
      res.status(500).json({ messaggio: 'Errore durante lo svuotamento dell\'archivio.' });
    }
  });
};
