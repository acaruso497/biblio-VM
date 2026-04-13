// =====================================================
// main.jsx — Punto di ingresso dell'applicazione React
// =====================================================
// Questo è il file che "monta" la nostra app React
// nell'elemento HTML con id="root" (nel file index.html).
// È il punto di partenza di tutto il frontend.
// =====================================================

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

// --- SICUREZZA & ENTRY POINT ---
// Forza il ritorno alla Home Page pubblica ad ogni ricaricamento del sito.
// Questo assicura che l'area amministratore non sia raggiungibile direttamente
// via URL o dopo un refresh, forzando l'utente a passare per la home.
/* 
if (window.location.pathname !== '/') {
  window.history.replaceState(null, '', '/');
}
*/

// Importiamo lo stile globale — viene applicato a tutta l'app
import './index.css'

// Importiamo il componente radice che contiene il router
import App from './App.jsx'

// Montiamo l'app dentro l'elemento <div id="root"> dell'HTML
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
