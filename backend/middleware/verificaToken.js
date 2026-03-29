// =====================================================
// verificaToken.js — Middleware di autenticazione JWT
// =====================================================
// Un "middleware" in Express è una funzione che si
// mette "in mezzo" tra la richiesta del client e la
// risposta del server. In questo caso, verifichiamo
// che chi sta facendo la richiesta abbia un token
// JWT valido — cioè che sia davvero l'amministratore.
//
// Funzionamento:
// 1. Il client manda la richiesta con nell'intestazione:
//    Authorization: Bearer <il_token_jwt>
// 2. Questo middleware legge quell'intestazione
// 3. Verifica che il token sia valido e non scaduto
// 4. Se va bene → passa alla rotta successiva
// 5. Se il token manca o è invalido → risponde con 401
// =====================================================

require('dotenv').config();
const jwt = require('jsonwebtoken');

// Questa funzione è il nostro middleware.
// Riceve la richiesta (req), la risposta (res),
// e la funzione "next" che passa al passo successivo.
function verificaTokenJWT(req, res, next) {

  // Leggiamo l'intestazione "Authorization" dalla richiesta.
  // Di solito ha la forma: "Bearer eyJhbGci..."
  const intestazioneAutorizzazione = req.headers['authorization'];

  // Se l'intestazione non c'è proprio, l'utente non è autenticato
  if (!intestazioneAutorizzazione) {
    return res.status(401).json({
      messaggio: 'Accesso negato: nessun token fornito.'
    });
  }

  // Il token è la seconda parte dopo "Bearer "
  // Usiamo split(' ') per dividere la stringa sullo spazio
  // e prendiamo l'elemento [1] (il secondo pezzo)
  const token = intestazioneAutorizzazione.split(' ')[1];

  // Se dopo "Bearer" non c'è niente, il formato è sbagliato
  if (!token) {
    return res.status(401).json({
      messaggio: 'Accesso negato: formato del token non valido.'
    });
  }

  // Proviamo a verificare il token con la nostra chiave segreta.
  // jwt.verify decodifica il token e controlla che non sia scaduto.
  try {
    const datiDecodificati = jwt.verify(token, process.env.JWT_SEGRETO);

    // Se arriviamo qui, il token è valido!
    // Salviamo i dati dell'admin nella richiesta così
    // le rotte successive possono usarli se necessario.
    req.amministratore = datiDecodificati;

    // Passiamo al prossimo middleware o alla rotta vera e propria
    next();

  } catch (errore) {
    // jwt.verify lancia un errore se il token è
    // scaduto, falso, o manomesso.
    return res.status(401).json({
      messaggio: 'Accesso negato: token non valido o scaduto.'
    });
  }
}

module.exports = verificaTokenJWT;
