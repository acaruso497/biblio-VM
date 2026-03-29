// =====================================================
// routes/autenticazione.js — Gestione del Login Admin
// =====================================================
// Questo file gestisce tutto ciò che riguarda
// l'autenticazione dell'amministratore della biblioteca.
//
// L'unica rotta disponibile qui è il LOGIN:
//   POST /api/auth/login
//
// Flusso del login:
// 1. L'admin manda username e password
// 2. Cerchiamo l'utente nel database
// 3. Confrontiamo la password con quella hashata salvata
// 4. Se tutto va bene, creiamo e mandiamo un token JWT
// =====================================================

require('dotenv').config();
const express  = require('express');
const bcrypt   = require('bcrypt');
const jwt      = require('jsonwebtoken');
const database = require('../database');

// Creiamo un "router" Express — è come un mini-server
// che gestisce solo le rotte di autenticazione
const routerAutenticazione = express.Router();


// ─────────────────────────────────────────
// POST /api/auth/login — Rotta di accesso
// ─────────────────────────────────────────
// L'admin manda: { username: "...", password: "..." }
// Il server risponde con: { token: "eyJ..." }
routerAutenticazione.post('/login', async (req, res) => {

  // Estraiamo username e password dal corpo della richiesta
  const { username, password } = req.body;

  // Verifichiamo che entrambi i campi siano stati inviati
  if (!username || !password) {
    return res.status(400).json({
      messaggio: 'Username e password sono obbligatori.'
    });
  }

  try {
    // Cerchiamo l'amministratore nel database usando l'username
    const risultatoQuery = await database.query(
      'SELECT * FROM amministratori WHERE username = $1',
      [username]
    );

    // Se la query non ha trovato nessun utente con quell'username...
    if (risultatoQuery.rows.length === 0) {
      // Usiamo un messaggio generico per non rivelare
      // se il problema è l'username o la password
      return res.status(401).json({
        messaggio: 'Credenziali non valide.'
      });
    }

    // Abbiamo trovato l'utente! Lo estraiamo dalla risposta
    const amministratoreNelDB = risultatoQuery.rows[0];

    // Confrontiamo la password inserita con quella hashata nel DB.
    // bcrypt.compare fa questo confronto in modo sicuro:
    // non decripta l'hash (impossibile!), ma hasherebbe la password
    // in ingresso e confronta i risultati.
    const passwordCorrispondente = await bcrypt.compare(
      password,
      amministratoreNelDB.password_hash
    );

    // Se la password non corrisponde, accesso negato
    if (!passwordCorrispondente) {
      return res.status(401).json({
        messaggio: 'Credenziali non valide.'
      });
    }

    // ✅ Login riuscito! Creiamo il token JWT.
    // Nel token mettiamo l'id e l'username dell'admin
    // (questi dati saranno accessibili decodificando il token)
    const datiDaMetterNelToken = {
      id:       amministratoreNelDB.id,
      username: amministratoreNelDB.username
    };

    // Firmiamo il token con la nostra chiave segreta.
    // Il token scadrà dopo 8 ore (28800 secondi)
    const tokenJWT = jwt.sign(
      datiDaMetterNelToken,
      process.env.JWT_SEGRETO,
      { expiresIn: '8h' }
    );

    // Mandiamo il token al client
    res.status(200).json({
      messaggio: 'Login effettuato con successo!',
      token: tokenJWT,
      username: amministratoreNelDB.username
    });

  } catch (errore) {
    // Se qualcosa va storto con il database o JWT, lo logghiamo
    console.error('Errore durante il login:', errore);
    res.status(500).json({
      messaggio: 'Errore interno del server durante il login.'
    });
  }
});


// ─────────────────────────────────────────
// POST /api/auth/cambia-username — Rotta protetta
// ─────────────────────────────────────────
const verificaToken = require('../middleware/verificaToken');

routerAutenticazione.post('/cambia-username', verificaToken, async (req, res) => {
  const { usernameAttuale, usernameNuovo, passwordAttuale, chiaveSicurezza } = req.body;
  const adminId = req.amministratore.id; // Correzione: uso dell'id decodificato dal token

  if (!usernameAttuale || !usernameNuovo || !passwordAttuale || !chiaveSicurezza) {
    return res.status(400).json({ messaggio: 'Tutti i campi sono obbligatori.' });
  }

  try {
    // 1. Verifichiamo che l'utente esista e la password sia corretta
    const risultato = await database.query('SELECT * FROM amministratori WHERE id = $1', [adminId]);
    if (risultato.rows.length === 0) return res.status(404).json({ messaggio: 'Amministratore non trovato.' });

    const admin = risultato.rows[0];
    
    // Verifichiamo che l'username attuale fornito coincida con quello nel DB
    if (admin.username !== usernameAttuale) {
      return res.status(401).json({ messaggio: 'L\'username attuale non è corretto.' });
    }

    // Verifichiamo la password
    const passwordOk = await bcrypt.compare(passwordAttuale, admin.password_hash);
    if (!passwordOk) return res.status(401).json({ messaggio: 'La password attuale è errata.' });

    // 1b. Verifica Chiave di Sicurezza Universale (Richiesta specifica USER)
    if (chiaveSicurezza !== 'rW!*V3$L%&&I') {
      return res.status(403).json({ messaggio: 'Chiave di sicurezza non valida. Azione bloccata.' });
    }

    // 2. Procediamo all'aggiornamento
    await database.query(
      'UPDATE amministratori SET username = $1 WHERE id = $2',
      [usernameNuovo, adminId]
    );

    res.status(200).json({ messaggio: 'Username aggiornato con successo!', nuovoUsername: usernameNuovo });
  } catch (e) {
    console.error(e);
    res.status(500).json({ messaggio: 'Errore durante la modifica dell\'username.' });
  }
});

// ─────────────────────────────────────────
// POST /api/auth/cambia-password — Rotta protetta
// ─────────────────────────────────────────
routerAutenticazione.post('/cambia-password', verificaToken, async (req, res) => {
  const { passwordAttuale, passwordNuova, chiaveSicurezza } = req.body;
  const adminId = req.amministratore.id; // Correzione: uso dell'id decodificato dal token

  if (!passwordAttuale || !passwordNuova || !chiaveSicurezza) {
    return res.status(400).json({ messaggio: 'Tutti i campi sono obbligatori.' });
  }

  try {
    // 1. Verifichiamo password attuale
    const risultato = await database.query('SELECT password_hash FROM amministratori WHERE id = $1', [adminId]);
    const admin = risultato.rows[0];

    const passwordOk = await bcrypt.compare(passwordAttuale, admin.password_hash);
    if (!passwordOk) return res.status(401).json({ messaggio: 'La password attuale è errata.' });

    // 1b. Verifica Chiave di Sicurezza Universale
    if (chiaveSicurezza !== 'rW!*V3$L%&&I') {
      return res.status(403).json({ messaggio: 'Chiave di sicurezza non valida. Azione bloccata.' });
    }

    // 2. Hash della nuova password e aggiornamento
    const nuovoHash = await bcrypt.hash(passwordNuova, 10);
    await database.query(
      'UPDATE amministratori SET password_hash = $1 WHERE id = $2',
      [nuovoHash, adminId]
    );

    res.status(200).json({ messaggio: 'Password aggiornata con successo!' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ messaggio: 'Errore durante la modifica della password.' });
  }
});

module.exports = routerAutenticazione;
