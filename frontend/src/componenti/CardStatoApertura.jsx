// =====================================================
// componenti/CardStatoApertura.jsx — Tema urbano
// =====================================================
// La card principale che mostra lo stato della biblioteca.
// Per lo sfondo usa un'immagine da Unsplash (street art
// o mare) recuperata automaticamente tramite URL.
// Un overlay scuro garantisce che il testo sia sempre
// leggibile anche su sfondi complicati.
// =====================================================

import React from 'react';
import './CardStatoApertura.css';

// Usiamo l'immagine hero locale presente in public
const IMMAGINE_SFONDO = '/hero.png';

function CardStatoApertura({ eAperta, aggiornatoIl }) {

  const immagineSfondo = IMMAGINE_SFONDO;

  // Formattiamo la data in italiano
  const dataFormattata = aggiornatoIl
    ? new Date(aggiornatoIl).toLocaleString('it-IT', {
        day:    'numeric',
        month:  'long',
        year:   'numeric',
        hour:   '2-digit',
        minute: '2-digit',
      })
    : null;

  return (
    <div className={`card-stato ${eAperta ? 'stato-aperta' : 'stato-chiusa'}`}>

      {/* Barra colorata in cima — verde se aperta, rossa se chiusa */}
      <div className="card-stato-barra" />

      {/* Sfondo a tinta unita (gestito da CSS) */}
      <div className="card-stato-sfondo" aria-hidden="true" />

      {/* Overlay gradiente scuro per leggibilità */}
      <div className="card-stato-overlay" aria-hidden="true" />

      {/* Contenuto principale — sopra lo sfondo */}
      <div className="card-stato-contenuto">

        {/* Testo dello stato — ora pulito e centrato */}
        <div className="card-stato-testo" style={{ width: '100%', textAlign: 'center' }}>
          <span className={`stato-valore ${eAperta ? 'testo-verde' : 'testo-rosso'}`}>
            {eAperta ? 'Aperta' : 'Chiusa'}
          </span>
        </div>

        {/* Destra: data dell'ultimo aggiornamento */}
        {dataFormattata && (
          <div className="card-stato-destra">
            <p className="card-stato-data" style={{ color: eAperta ? '#065F46' : '#6E1A0D', fontWeight: 'bold' }}>
              Aggiornato il {dataFormattata}
            </p>
          </div>
        )}

      </div>

    </div>
  );
}

export default CardStatoApertura;
