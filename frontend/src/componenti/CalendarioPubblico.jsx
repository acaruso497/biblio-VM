import React, { useState, useEffect } from 'react';
import { leggiAttivitaMese } from '../servizi/api';
import './Calendario.css';

const GIORNI_SETTIMANA = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'];

function CalendarioPubblico({ onAttivitaSettimanaCorrenteCaricate }) {
  // Navigazione mese
  const [dataVisualizzata, setDataVisualizzata] = useState(new Date());
  const annoVis = dataVisualizzata.getFullYear();
  const meseVis = dataVisualizzata.getMonth() + 1;

  const [attivitaMese, setAttivitaMese] = useState([]);
  const [attivitaSelezionata, setAttivitaSelezionata] = useState(null);

  useEffect(() => {
    async function caricaAttivita() {
      try {
        const dati = await leggiAttivitaMese(annoVis, meseVis);
        setAttivitaMese(dati);

        // Comunichiamo al padre (TabellaOrari) quali attività ci sono questa settimana (solo se è il mese corrente)
        const oggi = new Date();
        if (onAttivitaSettimanaCorrenteCaricate && annoVis === oggi.getFullYear() && meseVis === (oggi.getMonth()+1)) {
          const attivitaSettimana = estraiAttivitaSettimanaCorrente(dati);
          onAttivitaSettimanaCorrenteCaricate(attivitaSettimana);
        }
      } catch (e) {
        console.error('Errore caricamento calendario pubblico:', e);
      }
    }
    caricaAttivita();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dataVisualizzata]); 

  function mesePrecedente() {
    setDataVisualizzata(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
    setAttivitaSelezionata(null);
  }

  function meseSuccessivo() {
    setDataVisualizzata(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
    setAttivitaSelezionata(null);
  }

  function estraiAttivitaSettimanaCorrente(tutteLeAttivita) {
    // ... (rest of the logic remains same, we just use it when appropriate)
    const oggi = new Date();
    // (Logic truncated for replace_file_content efficiency, but I must keep the valid structure)
    const giornoDellaSettimana = oggi.getDay() || 7;
    const lunedi = new Date(oggi);
    lunedi.setDate(oggi.getDate() - (giornoDellaSettimana - 1));
    lunedi.setHours(0, 0, 0, 0);
    const domenica = new Date(lunedi);
    domenica.setDate(lunedi.getDate() + 6);
    domenica.setHours(23, 59, 59, 999);
    const filtrate = tutteLeAttivita.filter(att => {
      const dataAttivita = new Date(att.data_esatta);
      return dataAttivita >= lunedi && dataAttivita <= domenica;
    });
    const mappaGiorni = {};
    filtrate.forEach(att => {
      const data = new Date(att.data_esatta);
      const indiceGiorno = data.getDay();
      const indiceCorretto = indiceGiorno === 0 ? 6 : indiceGiorno - 1;
      const nomeGiorno = ['Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato', 'Domenica'][indiceCorretto];
      mappaGiorni[nomeGiorno] = att.titolo;
    });
    return mappaGiorni;
  }

  function apriDettaglio(attivita) {
    if (attivita) {
      setAttivitaSelezionata(attivita);
    }
  }

  function chiudiDettaglio() {
    setAttivitaSelezionata(null);
  }

  function formattaDataItaliana(dataIso) {
    if (!dataIso) return '';
    const [anno, mese, giorno] = dataIso.split('-');
    return `${giorno}/${mese}/${anno}`;
  }

  // --- Logica Griglia ---
  const primoGiornoDelMese = new Date(annoVis, meseVis - 1, 1);
  const ultimoGiornoDelMese = new Date(annoVis, meseVis, 0);
  const numeroGiorniMese = ultimoGiornoDelMese.getDate();
  
  let indiceGiornoInizio = primoGiornoDelMese.getDay() - 1;
  if (indiceGiornoInizio === -1) indiceGiornoInizio = 6;
  
  const celleGriglia = [];
  for (let i = 0; i < indiceGiornoInizio; i++) {
    celleGriglia.push(<div key={`vuoto-${i}`} className="giorno-vuoto" />);
  }

  const oggiCorrenteObj = new Date();
  const oggiIso = `${oggiCorrenteObj.getFullYear()}-${String(oggiCorrenteObj.getMonth() + 1).padStart(2, '0')}-${String(oggiCorrenteObj.getDate()).padStart(2, '0')}`;

  for (let giorno = 1; giorno <= numeroGiorniMese; giorno++) {
    const dataIsoStr = `${annoVis}-${String(meseVis).padStart(2, '0')}-${String(giorno).padStart(2, '0')}`;
    const attivita = attivitaMese.find(a => a.data_esatta.startsWith(dataIsoStr));
    const eOggi = dataIsoStr === oggiIso;

    celleGriglia.push(
      <div 
        key={giorno} 
        className={`giorno-cella ${attivita ? 'giorno-con-attivita cliccabile' : ''} ${eOggi ? 'giorno-oggi' : ''}`}
        onClick={() => apriDettaglio(attivita)}
        role={attivita ? 'button' : 'gridcell'}
      >
        <span className="giorno-numero">{giorno}</span>
        {attivita && (
          <div className="attivita-preview">
            {attivita.titolo}
          </div>
        )}
      </div>
    );
  }

  const meseNome = dataVisualizzata.toLocaleString('it-IT', { month: 'long', year: 'numeric' });

  return (
    <div className="calendario-contenitore">
      <div className="calendario-header-controlli">
        <button className="btn-mese" onClick={mesePrecedente}>&lt; Precedente</button>
        <div className="mese-titolo">{meseNome}</div>
        <button className="btn-mese" onClick={meseSuccessivo}>Successivo &gt;</button>
      </div>

      <div className="calendario-griglia-wrapper">
        <div className="calendario-griglia">
          {GIORNI_SETTIMANA.map(g => <div key={g} className="giorno-intestazione">{g}</div>)}
          {celleGriglia}
        </div>
      </div>

      {attivitaSelezionata && (
        <div className="calendario-dettaglio animazione-entrata">
          <div className="dettaglio-header">
            <h3 className="dettaglio-data">
              Dettaglio Attività ({formattaDataItaliana(attivitaSelezionata.data_esatta)})
            </h3>
            <button className="btn-chiudi" onClick={chiudiDettaglio}>✕</button>
          </div>
          <div style={{ padding: '8px 0' }}>
            <h4 style={{ color: 'var(--bianco-sporco)', fontSize: '18px', marginBottom: '8px' }}>
              {attivitaSelezionata.titolo}
            </h4>
            <p style={{ color: '#000000', fontSize: '15px', lineHeight: '1.6', fontWeight: '500', whiteSpace: 'pre-wrap' }}>
              {attivitaSelezionata.descrizione || 'Nessuna descrizione per questa attività.'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default CalendarioPubblico;
