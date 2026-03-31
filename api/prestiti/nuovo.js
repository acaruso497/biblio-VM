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
};
