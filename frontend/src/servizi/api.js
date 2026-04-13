// =====================================================
// servizi/api.js — Tutte le chiamate al backend
// =====================================================
// Questo file centralizza TUTTE le comunicazioni
// tra il frontend React e il server backend.
// In questo modo, se il backend cambia indirizzo,
// basta aggiornare un solo file!
//
// Usiamo "axios" — una libreria che rende le chiamate
// HTTP molto più semplici e leggibili rispetto al
// fetch() nativo del browser.
// =====================================================

import axios from 'axios';

// Variabile temporanea per il token (non persiste al refresh)
let tokenCorrente = null;
let usernameCorrente = null;

// L'indirizzo base del nostro server (relativo per Vercel).
const URL_BASE_SERVER = '/api';

// Creiamo un'istanza di axios pre-configurata.
const chiamataHTTP = axios.create({
  baseURL: URL_BASE_SERVER,
  timeout: 25000, 
});

/**
 * Permette di impostare il token e l'username dopo il login.
 * Essendo salvati in variabili e non in localStorage/sessionStorage,
 * andranno perduti ad ogni ricaricamento della pagina.
 */
export function impostaToken(nuovoToken, nuovoUsername = null) {
  tokenCorrente = nuovoToken;
  if (nuovoUsername !== null) {
    usernameCorrente = nuovoUsername;
  }
}

export function ottieniToken() {
  return tokenCorrente;
}

export function ottieniUsername() {
  return usernameCorrente;
}

// ─────────────────────────────────────────────────────
// Interceptor delle richieste — si esegue PRIMA
// di ogni chiamata al server.
// ─────────────────────────────────────────────────────
chiamataHTTP.interceptors.request.use((configurazioneRichiesta) => {

  // Se il token è stato impostato in memoria, lo aggiungiamo
  if (tokenCorrente) {
    configurazioneRichiesta.headers['Authorization'] = `Bearer ${tokenCorrente}`;
  }

  return configurazioneRichiesta;
});


// ─────────────────────────────────────────────────────
// FUNZIONI ESPORTATE — L'interfaccia pubblica di questo file
// ─────────────────────────────────────────────────────

/**
 * Effettua il login dell'amministratore.
 * Manda username e password al server e riceve un token JWT.
 *
 * @param {string} username - Nome utente dell'admin
 * @param {string} password - Password dell'admin
 * @returns {object} - Oggetto con il token e il messaggio del server
 */
export async function effettuaLogin(username, password) {
  const risposta = await chiamataHTTP.post('/auth/login', { username, password });
  return risposta.data;
}


/**
 * Legge lo stato attuale della biblioteca dal server.
 * Questa chiamata è pubblica: non richiede autenticazione.
 *
 * @returns {object} - { eAperta, orari, messaggioSpeciale, aggiornatoIl }
 */
export async function leggiStatoBiblioteca() {
  const risposta = await chiamataHTTP.get('/biblioteca/stato');
  return risposta.data;
}


/**
 * Aggiorna i dati della biblioteca nel database.
 * Questa chiamata richiede autenticazione (il token viene
 * aggiunto automaticamente dall'interceptor sopra).
 *
 * @param {object} nuoviDati - { eAperta, orari, messaggioSpeciale }
 * @returns {object} - I dati aggiornati con conferma dal server
 */
export async function aggiornaDatiBiblioteca(nuoviDati) {
  const risposta = await chiamataHTTP.put('/biblioteca/aggiorna', nuoviDati);
  return risposta.data;
}

// ─────────────────────────────────────────────────────
// CHIAMATE PER IL CALENDARIO
// ─────────────────────────────────────────────────────

/**
 * Legge le attività mensili.
 * @param {number} anno 
 * @param {number} mese 
 * @returns {Array} Array di attività
 */
export async function leggiAttivitaMese(anno, mese) {
  const risposta = await chiamataHTTP.get(`/calendario/mese?anno=${anno}&mese=${mese}`);
  return risposta.data;
}

/**
 * Salva un'attività per una data specifica.
 * Supporta ricorrenze settimanali e orari.
 * Solo per admin.
 *
 * @param {string} dataEsatta  - Formato YYYY-MM-DD
 * @param {string} titolo
 * @param {string} descrizione
 * @param {string} startTime   - Formato HH:mm (obbligatorio)
 * @param {string} endTime     - Formato HH:mm (opzionale)
 * @param {boolean} isRecurring - Se true, ripete ogni settimana fino a fine mese
 */
export async function salvaAttivitaCalendario(dataEsatta, titolo, descrizione, startTime, endTime, isRecurring) {
  const risposta = await chiamataHTTP.post('/calendario', {
    dataEsatta, titolo, descrizione, startTime, endTime, isRecurring
  });
  return risposta.data;
}

/**
 * Modifica titolo, descrizione e orari di un'attività esistente.
 * Solo per admin.
 *
 * @param {number} id
 * @param {string} titolo
 * @param {string} descrizione
 * @param {string} startTime   - Formato HH:mm
 * @param {string} endTime     - Formato HH:mm (opzionale)
 */
export async function modificaAttivitaCalendario(id, titolo, descrizione, startTime, endTime) {
  const risposta = await chiamataHTTP.put(`/calendario/${id}`, {
    titolo, descrizione, startTime, endTime
  });
  return risposta.data;
}

/**
 * Elimina un'attività per una data specifica.
 * Solo per admin.
 */
export async function eliminaAttivitaCalendario(dataEsatta) {
  const risposta = await chiamataHTTP.delete(`/calendario/${dataEsatta}`);
  return risposta.data;
}

// ─────────────────────────────────────────────────────
// CHIAMATE PER I PRESTITI LIBRI
// ─────────────────────────────────────────────────────

export async function leggiPrestiti() {
  const risposta = await chiamataHTTP.get('/prestiti');
  return risposta.data;
}

export async function registraPrestito(datiPrestito) {
  const risposta = await chiamataHTTP.post('/prestiti', datiPrestito);
  return risposta.data;
}

export async function restituisciLibro(idPrestito) {
  const risposta = await chiamataHTTP.put(`/prestiti/${idPrestito}/restituisci`);
  return risposta.data;
}

export async function svuotaArchivioPrestiti() {
  const risposta = await chiamataHTTP.delete('/prestiti/svuota-tutto');
  return risposta.data;
}

export async function eliminaPrestito(idPrestito) {
  const risposta = await chiamataHTTP.delete(`/prestiti/${idPrestito}`);
  return risposta.data;
}

// ─────────────────────────────────────────────────────
// CHIAMATE PER GESTIONE ACCOUNT ADMIN
// ─────────────────────────────────────────────────────

export async function cambiaUsernameAdmin(usernameAttuale, usernameNuovo, passwordAttuale, chiaveSicurezza) {
  const risposta = await chiamataHTTP.post('/auth/cambia-username', { usernameAttuale, usernameNuovo, passwordAttuale, chiaveSicurezza });
  return risposta.data;
}

export async function cambiaPasswordAdmin(passwordAttuale, passwordNuova, chiaveSicurezza) {
  const risposta = await chiamataHTTP.post('/auth/cambia-password', { passwordAttuale, passwordNuova, chiaveSicurezza });
  return risposta.data;
}
