// =====================================================
// pagine/PaginaPubblica.jsx — Tema centro sociale urbano
// =====================================================
// Aggiornata la struttura per il nuovo layout:
// - Header orizzontale con nome + link admin
// - Hero card con sfondo Unsplash (gestita da CardStatoApertura)
// - Griglia a due colonne: orari + messaggio
// - Footer con sfondo blu mare
// Tutta la logica API rimane invariata.
// =====================================================

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import CardStatoApertura              from '../componenti/CardStatoApertura';
import TabellaOrari                   from '../componenti/TabellaOrari';
import CalendarioPubblico             from '../componenti/CalendarioPubblico';
import { leggiStatoBiblioteca }       from '../servizi/api';
import './PaginaPubblica.css';

function PaginaPubblica() {

  const [datiGlobali,      setDatiGlobali]      = useState(null);
  const [statoCaricamento, setStatoCaricamento] = useState(true);
  const [messaggioErrore,  setMessaggioErrore]  = useState(null);
  const [attivitaSettimana, setAttivitaSettimana] = useState({});

  useEffect(() => {
    async function caricaDatiDalServer() {
      try {
        const datiRicevuti = await leggiStatoBiblioteca();
        setDatiGlobali(datiRicevuti);
      } catch (errore) {
        console.error('Errore nel caricare i dati della biblioteca:', errore);
        setMessaggioErrore('Impossibile connettersi al server. Riprova più tardi.');
      } finally {
        setStatoCaricamento(false);
      }
    }
    caricaDatiDalServer();
  }, []);

  // ─── Schermata di caricamento ───
  if (statoCaricamento) {
    return (
      <div className="spinner-contenitore">
        <div className="spinner" />
        <p className="spinner-testo">Risveglio del server in corso, attendi qualche secondo...</p>
      </div>
    );
  }

  // ─── Schermata di errore ───
  if (messaggioErrore) {
    return (
      <div className="spinner-contenitore">
        <p style={{ fontSize: '36px', marginBottom: '12px' }}>⚠</p>
        <p className="spinner-testo">{messaggioErrore}</p>
      </div>
    );
  }

  // ─── Pagina vera e propria ───
  return (
    <div className="pagina-pubblica">

      {/* ─── Header ─── */}
      <header className="pp-header">
        <div className="contenitore">
          <div className="pp-header-interno">

            {/* Sinistra: Collegamenti Social (Instagram) */}
            <div className="pp-header-left-col">
              <a 
                href="https://www.instagram.com/villa_medusa.bagnoli/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="header-social-link"
                title="Seguici su Instagram"
              >
                <svg viewBox="0 0 24 24" width="60" height="60" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                </svg>
              </a>
            </div>

            {/* Centro: Logo Centrale Evidente */}
            <div className="pp-logo-centrale" style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <img 
                src="/logo.jpg" 
                alt="Logo Villa Medusa" 
                className="pp-logo-immagine" 
                onError={(e) => { e.target.src = '/logo.png'; }} /* Tenta l'estensione PNG in caso non trovi JPG */
              />
              <h1 className="pp-nome-biblioteca" style={{ marginTop: '8px', fontSize: '24px' }}>Villa Medusa</h1>
            </div>

            {/* Lato destro: link all'area admin (Bottone Arancione) */}
            <div className="pp-header-right-col">
              <Link to="/admin" className="btn-arancio">
                Area Amministratori
              </Link>
            </div>

          </div>
        </div>

      </header>

      {/* ─── Main ─── */}
      <main className="pp-main">
        <div className="contenitore">

          {/* 1. Card grande con immagine Unsplash e stato aperta/chiusa */}
          <section className="pp-sezione-stato animazione-entrata">
            <CardStatoApertura
              eAperta={datiGlobali.eAperta}
              aggiornatoIl={datiGlobali.aggiornatoIl}
            />
          </section>

          {/* 2. Griglia con orari e messaggio speciale */}
          <div className="pp-griglia-info">

            {/* Orari settimanali */}
            <section
              className="card animazione-entrata"
              style={{ animationDelay: '0.1s' }}
            >
              <TabellaOrari orari={datiGlobali.orari} attivitaSettimana={attivitaSettimana} />
            </section>

            {/* Messaggio speciale — se presente */}
            {datiGlobali.messaggioSpeciale && (
              <section
                className="card pp-card-messaggio animazione-entrata"
                style={{ animationDelay: '0.2s' }}
              >
                {/* Tag "comunicazione" */}
                <span className="tag-urbano" style={{ marginBottom: '16px', display: 'inline-block' }}>
                  Comunicazione
                </span>

                <p className="pp-messaggio-testo">
                  {datiGlobali.messaggioSpeciale}
                </p>

              </section>
            )}

          </div>

          {/* 3. Calendario Mensile delle Attività */}
          <section className="card animazione-entrata" style={{ animationDelay: '0.3s', marginTop: '20px' }}>
            <CalendarioPubblico onAttivitaSettimanaCorrenteCaricate={setAttivitaSettimana} />
          </section>

        </div>
      </main>

      {/* ─── Footer ─── */}
      <footer className="pp-footer">
        <div className="contenitore">
          <div className="pp-footer-interno">
            <p className="pp-footer-nome">Villa Medusa — Biblioteca Popolare</p>
            <p className="pp-footer-copy">
              © {new Date().getFullYear()} — Tutti i diritti riservati
            </p>
          </div>
        </div>
      </footer>

    </div>
  );
}

export default PaginaPubblica;
