// =====================================================
// server.js — Versione per Migrazione Vercel
// =====================================================
// Questa versione del file non avvia più il server
// autonomamente (app.listen rimosso).
// La logica è stata migrata nelle singole Serverless Functions
// all'interno della cartella /api nella root del progetto.
// =====================================================

require('dotenv').config();

const express  = require('express');
const cors     = require('cors');
const pool     = require('./database');

const routerAutenticazione   = require('./routes/autenticazione');
const routerBiblioteca       = require('./routes/biblioteca');
const routerCalendario       = require('./routes/calendario');
const routerPrestiti         = require('./routes/prestiti');

const app = express();

app.use(cors({
  origin: [
    process.env.FRONTEND_URL,
    'https://villa-medusa.vercel.app',
    'http://localhost:5173'
  ].filter(Boolean),
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
}));
app.use(express.json());

// Rotte (utilizzate per riferimento dai file in /api o se esportate)
app.use('/api/auth',       routerAutenticazione);
app.use('/api/biblioteca', routerBiblioteca);
app.use('/api/calendario', routerCalendario);
app.use('/api/prestiti',   routerPrestiti);

app.get('/api/ping', (req, res) => {
  res.json({ messaggio: '🏛️ Il server della biblioteca è attivo su Vercel (base Express)!' });
});

app.get('/api/keepalive', async (req, res) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  try {
    await pool.query('SELECT 1');
    res.status(200).json({ server: 'active', database: 'active' });
  } catch (err) {
    console.error('[keepalive] Errore database:', err);
    res.status(500).json({ server: 'active', database: 'error' });
  }
});

module.exports = app; // Esportiamo l'app per eventuale uso come funzione unica
