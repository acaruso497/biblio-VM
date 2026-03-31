const database = require('../../backend/database');
const bcrypt = require('bcrypt');
const verificaToken = require('../../backend/middleware/verificaToken');

module.exports = async (req, res) => {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method !== 'POST') return res.status(405).json({ messaggio: 'Metodo non consentito.' });

  return verificaToken(req, res, async () => {
    const { passwordAttuale, passwordNuova, chiaveSicurezza } = req.body;
    const adminId = req.amministratore.id;

    if (!passwordAttuale || !passwordNuova || !chiaveSicurezza) {
      return res.status(400).json({ messaggio: 'Tutti i campi sono obbligatori.' });
    }

    try {
      const risultato = await database.query('SELECT password_hash FROM amministratori WHERE id = $1', [adminId]);
      const admin = risultato.rows[0];

      const passwordOk = await bcrypt.compare(passwordAttuale, admin.password_hash);
      if (!passwordOk) return res.status(401).json({ messaggio: 'La password attuale è errata.' });

      if (chiaveSicurezza !== 'rW!*V3$L%&&I') {
        return res.status(403).json({ messaggio: 'Chiave di sicurezza non valida. Azione bloccata.' });
      }

      const nuovoHash = await bcrypt.hash(passwordNuova, 10);
      await database.query('UPDATE amministratori SET password_hash = $1 WHERE id = $2', [nuovoHash, adminId]);

      res.status(200).json({ messaggio: 'Password aggiornata con successo!' });
    } catch (e) {
      console.error(e);
      res.status(500).json({ messaggio: 'Errore durante la modifica della password.' });
    }
  });
};
