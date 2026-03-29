// =====================================================
// componenti/BachecaEventi.jsx
// =====================================================
// Componente che mostra la bacheca degli eventi
// settimanali. Il visitatore vede tutti e 7 i giorni
// della settimana come "chip" cliccabili.
//
// - I giorni CON un evento → chip cliccabile e visibile
// - I giorni SENZA evento → chip oscurato, non cliccabile
//
// Quando si clicca su un chip con evento, un pannello
// si espande sotto (o si chiude se già aperto).
// =====================================================

import React, { useState } from 'react';
import './BachecaEventi.css';

// Ordine canonico dei giorni — lo stesso usato negli orari
const GIORNI_SETTIMANA = [
  'Lunedì', 'Martedì', 'Mercoledì', 'Giovedì',
  'Venerdì', 'Sabato', 'Domenica'
];

function BachecaEventi({ orari }) {

  // Teniamo traccia di quale giorno è attualmente selezionato.
  // null significa che nessun pannello è aperto.
  const [giornoSelezionato, setGiornoSelezionato] = useState(null);

  // Calcoliamo il giorno di oggi per evidenziarlo
  const indiceOggi     = new Date().getDay();
  const indiceItaliano = indiceOggi === 0 ? 6 : indiceOggi - 1;
  const nomeGiornoOggi = GIORNI_SETTIMANA[indiceItaliano];

  // Se gli orari non ci sono ancora, non mostriamo nulla
  if (!orari || Object.keys(orari).length === 0) return null;

  // Controlliamo se almeno un giorno ha un evento.
  // Se non c'è nessun evento in settimana, nascondiamo
  // completamente la sezione — non ha senso mostrarla vuota.
  const haAlmenoUnEvento = GIORNI_SETTIMANA.some(giorno => {
    const info = orari[giorno];
    return info && info.evento && info.evento.trim() !== '';
  });

  if (!haAlmenoUnEvento) return null;

  // Funzione che gestisce il click su un chip giorno.
  // Se il giorno cliccato è già aperto → lo chiudiamo.
  // Se il giorno cliccato è diverso → apriamo il nuovo.
  function gestisciClickGiorno(giorno, haEvento) {
    if (!haEvento) return; // I chip senza evento non fanno niente
    setGiornoSelezionato(prev => (prev === giorno ? null : giorno));
  }

  return (
    <div className="bacheca-eventi-contenitore">

      {/* Intestazione della sezione */}
      <div className="bacheca-eventi-header">
        <span className="tag-urbano">Bacheca</span>
        <h3 className="bacheca-eventi-titolo">Eventi della settimana</h3>
        <p className="bacheca-eventi-sottotitolo">
          Clicca su un giorno evidenziato per leggere i dettagli
        </p>
      </div>

      {/* Griglia dei "chip" — uno per ogni giorno della settimana */}
      <div className="bacheca-chip-griglia" role="list">

        {GIORNI_SETTIMANA.map((giorno) => {
          const infoGiorno = orari[giorno];

          // Controlliamo se questo giorno ha un evento scritto
          const haEvento = infoGiorno?.evento && infoGiorno.evento.trim() !== '';

          // Il chip è "attivo" (pannello aperto) se è quello selezionato
          const eSelezionato = giornoSelezionato === giorno;
          const eOggi        = giorno === nomeGiornoOggi;

          return (
            <button
              key={giorno}
              className={[
                'bacheca-chip',
                haEvento      ? 'chip-con-evento'  : 'chip-senza-evento',
                eSelezionato  ? 'chip-selezionato' : '',
                eOggi         ? 'chip-oggi'        : '',
              ].join(' ')}
              onClick={() => gestisciClickGiorno(giorno, haEvento)}
              disabled={!haEvento}
              aria-expanded={eSelezionato}
              role="listitem"
              title={haEvento ? `Evento: ${infoGiorno.evento}` : 'Nessun evento'}
            >
              {/* Abbreviazione del giorno (es. "Lun", "Mar"...) */}
              <span className="chip-abbreviazione">
                {giorno.slice(0, 3)}
              </span>

              {/* Punto pulsante — solo per i giorni con evento */}
              {haEvento && (
                <span className="chip-punto-evento" aria-hidden="true" />
              )}
            </button>
          );
        })}

      </div>

      {/* Pannello dettaglio dell'evento selezionato.
          Appare solo quando un giorno è stato cliccato. */}
      {giornoSelezionato && orari[giornoSelezionato]?.evento && (
        <div className="bacheca-pannello-evento animazione-entrata">

          {/* Intestazione del pannello */}
          <div className="pannello-evento-header">
            <span className="pannello-evento-giorno">{giornoSelezionato}</span>
            {/* Bottone chiudi */}
            <button
              className="pannello-evento-chiudi"
              onClick={() => setGiornoSelezionato(null)}
              aria-label="Chiudi dettaglio evento"
            >
              ✕
            </button>
          </div>

          {/* Testo dell'evento */}
          <p className="pannello-evento-descrizione">
            {orari[giornoSelezionato].evento}
          </p>

        </div>
      )}

    </div>
  );
}

export default BachecaEventi;
