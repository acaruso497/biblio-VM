// =====================================================
// server.js — Il cuore del backend (versione aggiornata)
// =====================================================
// Rispetto alla versione precedente, in questo file
// aggiungiamo il "task programmato" del reset mezzanotte:
// ogni notte alle 00:00 il server controlla se la
// levetta "Reset Mezzanotte" è attiva nel database
// e, se sì, imposta la biblioteca su "Chiusa".
//
// Per farlo usiamo il pacchetto "node-cron", che ci
// permette di pianificare attività con la stessa
// sintassi dei cron job di Linux/macOS.
// =====================================================

require('dotenv').config();

const express  = require('express');
const cors     = require('cors');
const cron     = require('node-cron'); // ← la novità!

const database               = require('./database');
const routerAutenticazione   = require('./routes/autenticazione');
const routerBiblioteca       = require('./routes/biblioteca');
const routerCalendario       = require('./routes/calendario');
const routerPrestiti         = require('./routes/prestiti');

const app = express();

// ─────────────────────────────────────────────────────
// Middleware globali (non cambiano rispetto a prima)
// ─────────────────────────────────────────────────────
app.use(cors({
  origin: 'http://localhost:5173',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
}));
app.use(express.json());

// Logger richieste
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// ─────────────────────────────────────────────────────
// Rotte
// ─────────────────────────────────────────────────────
app.use('/api/auth',       routerAutenticazione);
app.use('/api/biblioteca', routerBiblioteca);
app.use('/api/calendario', routerCalendario);
app.use('/api/prestiti',   routerPrestiti);

app.get('/api/ping', (req, res) => {
  res.json({ messaggio: '🏛️ Il server della biblioteca è attivo!' });
});


// ─────────────────────────────────────────────────────
// Task Programmato — Reset Mezzanotte
// ─────────────────────────────────────────────────────
// La sintassi cron che usiamo è: '0 0 * * *'
// Significa: al minuto 0 dell'ora 0, ogni giorno.
// In parole povere: ogni notte esattamente alle 00:00.
//
// Attenzione: il server usa il fuso orario della
// macchina su cui gira. Se il server fosse in cloud
// in un fuso diverso, andrebbe configurato esplicitamente.
cron.schedule('0 0 * * *', async () => {
  console.log('🕛 Task mezzanotte avviato — controllo reset automatico...');

  try {
    // Prima leggiamo le impostazioni attuali per capire
    // se la levetta del reset mezzanotte è accesa o spenta
    const risultato = await database.query(
      'SELECT reset_mezzanotte FROM impostazioni_biblioteca WHERE id = 1'
    );

    // Se la tabella è vuota, non facciamo nulla
    if (risultato.rows.length === 0) {
      console.log('⚠️  Nessuna impostazione trovata. Reset saltato.');
      return;
    }

    const resetAttivo = risultato.rows[0].reset_mezzanotte;

    // Se la levetta è disattivata, usciamo senza fare nulla
    if (!resetAttivo) {
      console.log('💤 Reset mezzanotte disabilitato. Nessuna azione.');
      return;
    }

    // La levetta è attiva! Impostiamo la biblioteca su "Chiusa"
    await database.query(
      `UPDATE impostazioni_biblioteca
       SET e_aperta = false, aggiornato_il = NOW()
       WHERE id = 1`
    );

    console.log('🌙 Reset mezzanotte eseguito: biblioteca impostata su CHIUSA.');

  } catch (errore) {
    // Se qualcosa va storto con il database, lo logghiamo
    // ma non crashiamo il server — il task riproverà domani
    console.error('❌ Errore durante il reset mezzanotte:', errore.message);
  }
});


// ─────────────────────────────────────────────────────
// Avvio del server
// ─────────────────────────────────────────────────────
const PORTA = process.env.PORTA || 3001;

app.listen(PORTA, () => {
  console.log('');
  console.log('╔══════════════════════════════════════════════╗');
  console.log('║   🏛️  Server Biblioteca avviato!              ║');
  console.log(`║   📡 In ascolto su http://localhost:${PORTA}    ║`);
  console.log('║   🌙 Reset automatico mezzanotte: attivo      ║');
  console.log('╚══════════════════════════════════════════════╝');
  console.log('');
});
