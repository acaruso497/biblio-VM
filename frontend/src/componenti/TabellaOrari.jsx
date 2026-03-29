// =====================================================
// componenti/TabellaOrari.jsx — Versione aggiornata
// =====================================================
// Il componente ora gestisce il NUOVO formato dati
// degli orari, dove ogni giorno è un oggetto:
//
//   { dalle: "09:00", alle: "19:00", chiuso: false, evento: "" }
//
// invece della vecchia stringa "9:00 - 19:00".
//
// Mostra:
//   - "CHIUSO" in grigio se il campo chiuso=true
//   - "09:00 – 19:00" in verde se la biblioteca è aperta
//   - "—" se gli orari non sono stati impostati
// =====================================================

import React from 'react';
import './TabellaOrari.css';

const GIORNI_SETTIMANA = [
  'Lunedì', 'Martedì', 'Mercoledì', 'Giovedì',
  'Venerdì', 'Sabato', 'Domenica'
];

function TabellaOrari({ orari, attivitaSettimana = {} }) {

  // Troviamo il giorno di oggi
  const indiceOggi     = new Date().getDay();
  const indiceItaliano = indiceOggi === 0 ? 6 : indiceOggi - 1;
  const nomeGiornoOggi = GIORNI_SETTIMANA[indiceItaliano];

  if (!orari || Object.keys(orari).length === 0) {
    return <div className="tabella-orari-vuota">Orari non disponibili.</div>;
  }

  return (
    <div className="tabella-orari-contenitore">
      <h3 className="tabella-orari-titolo">Orari</h3>
      <p className="tabella-orari-sottotitolo">Questa settimana</p>

      <div className="tabella-orari-griglia">
        {GIORNI_SETTIMANA.map((giorno) => {
          // Recuperiamo le info di questo giorno
          // Gestiamo sia il nuovo formato (oggetto) sia
          // l'eventuale vecchio formato (stringa) per sicurezza
          const infoGiorno = orari[giorno];
          const eOggi      = giorno === nomeGiornoOggi;

          // ─── Determiniamo il testo dell'orario da mostrare ───

          let testoOrario;
          let classeOrario;

          if (!infoGiorno) {
            // Il giorno non ha dati
            testoOrario = '—';
            classeOrario = 'valore-chiuso';

          } else if (typeof infoGiorno === 'string') {
            // Vecchio formato stringa — compatibilità
            const eChiusoVecchio = infoGiorno.toLowerCase() === 'chiusa' ||
                                   infoGiorno.toLowerCase() === 'chiuso';
            testoOrario = infoGiorno;
            classeOrario = eChiusoVecchio ? 'valore-chiuso' : 'valore-aperto';

          } else if (infoGiorno.chiuso) {
            // Nuovo formato — il giorno è marcato come chiuso
            testoOrario = 'Chiuso';
            classeOrario = 'valore-chiuso';

          } else if (infoGiorno.dalle && infoGiorno.alle) {
            // Nuovo formato — mostriamo la fascia oraria
            testoOrario  = `${infoGiorno.dalle} – ${infoGiorno.alle}`;
            classeOrario = 'valore-aperto';

          } else {
            // Orari non impostati
            testoOrario  = '—';
            classeOrario = 'valore-chiuso';
          }

          return (
            <div
              key={giorno}
              className={`riga-orario ${eOggi ? 'riga-oggi' : ''}`}
            >
              <div className="riga-orario-giorno" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '4px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  {eOggi && <span className="oggi-badge">Oggi</span>}
                  <span className="nome-giorno">{giorno}</span>
                </div>
                {attivitaSettimana[giorno] && (
                  <span style={{ fontSize: '10px', background: 'var(--blu-mare-light)', color: 'white', padding: '2px 6px', borderRadius: '4px', maxWidth: '140px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={attivitaSettimana[giorno]}>
                    🌟 {attivitaSettimana[giorno]}
                  </span>
                )}
              </div>

              <div className={`riga-orario-valore ${classeOrario}`}>
                {testoOrario}
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
}

export default TabellaOrari;
