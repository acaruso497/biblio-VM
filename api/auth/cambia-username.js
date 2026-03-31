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

  // Utilizza il middleware esistente come wrapper
  return verificaToken(req, res, async () => {
    const { usernameAttuale, usernameNuovo, passwordAttuale, chiaveSicurezza } = req.body;
    const adminId = req.amministratore.id;

    if (!usernameAttuale || !usernameNuovo || !passwordAttuale || !chiaveSicurezza) {
      return res.status(400).json({ messaggio: 'Tutti i campi sono obbligatori.' });
    }

    try {
      const risultato = await database.query('SELECT * FROM amministratori WHERE id = $1', [adminId]);
      if (risultato.rows.length === 0) return res.status(404).json({ messaggio: 'Amministratore non trovato.' });

      const admin = risultato.rows[0];
      if (admin.username !== usernameAttuale) {
        return res.status(401).json({ messaggio: 'L\'username attuale non è corretto.' });
      }

      const passwordOk = await bcrypt.compare(passwordAttuale, admin.password_hash);
      if (!passwordOk) return res.status(401).json({ messaggio: 'La password attuale è errata.' });

      if (chiaveSicurezza !== 'rW!*V3$L%&&I') {
        return res.status(403).json({ messaggio: 'Chiave di sicurezza non valida. Azione bloccata.' });
      }

      await database.query('UPDATE amministratori SET username = $1 WHERE id = $2', [usernameNuovo, adminId]);
      res.status(200).json({ messaggio: 'Username aggiornato con successo!', nuovoUsername: usernameNuovo });
    } catch (e) {
      console.error(e);
      res.status(500).json({ messaggio: 'Errore durante la modifica dell\'username.' });
    }
  });
};
