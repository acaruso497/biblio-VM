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

module.exports = app; // Esportiamo l'app per eventuale uso come funzione unica
