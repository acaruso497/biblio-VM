// =====================================================
// App.jsx — Router principale dell'applicazione
// =====================================================
// Questo è il componente radice dell'app React.
// Si occupa di un'unica cosa importante: decidere
// quale "pagina" mostrare in base all'URL corrente.
//
// Rotte disponibili:
//   /        → Pagina pubblica (orari per tutti)
//   /admin   → Dashboard admin (richiede login)
// =====================================================

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// Importiamo le due pagine principali dell'applicazione
import PaginaPubblica from './pagine/PaginaPubblica';
import PaginaAdmin    from './pagine/PaginaAdmin';

function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* Rotta principale — tutti possono vederla */}
        <Route path="/" element={<PaginaPubblica />} />

        {/* Rotta admin — la pagina gestisce il login internamente */}
        <Route path="/admin" element={<PaginaAdmin />} />

        {/* Qualsiasi altra rotta → torniamo alla home */}
        <Route path="*" element={<Navigate to="/" replace />} />

      </Routes>
    </BrowserRouter>
  );
}

export default App;
