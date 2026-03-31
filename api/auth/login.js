const database = require('../../backend/database');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

module.exports = async (req, res) => {
  // CORS BASIC
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method !== 'POST') {
    return res.status(405).json({ messaggio: 'Metodo non consentito.' });
  }

  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ messaggio: 'Username e password sono obbligatori.' });
  }

  try {
    const risultatoQuery = await database.query(
      'SELECT * FROM amministratori WHERE username = $1',
      [username]
    );

    if (risultatoQuery.rows.length === 0) {
      return res.status(401).json({ messaggio: 'Credenziali non valide.' });
    }

    const amministratoreNelDB = risultatoQuery.rows[0];
    const passwordCorrispondente = await bcrypt.compare(password, amministratoreNelDB.password_hash);

    if (!passwordCorrispondente) {
      return res.status(401).json({ messaggio: 'Credenziali non valide.' });
    }

    const tokenJWT = jwt.sign(
      { id: amministratoreNelDB.id, username: amministratoreNelDB.username },
      process.env.JWT_SEGRETO,
      { expiresIn: '8h' }
    );

    res.status(200).json({
      messaggio: 'Login effettuato con successo!',
      token: tokenJWT,
      username: amministratoreNelDB.username
    });
  } catch (errore) {
    console.error('Errore durante il login:', errore);
    res.status(500).json({ messaggio: 'Errore interno del server durante il login.' });
  }
};
