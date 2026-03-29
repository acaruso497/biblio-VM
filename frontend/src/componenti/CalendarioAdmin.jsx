import React, { useState, useEffect } from 'react';
import { leggiAttivitaMese, salvaAttivitaCalendario, eliminaAttivitaCalendario } from '../servizi/api';
import './Calendario.css';

const GIORNI_SETTIMANA = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'];

function CalendarioAdmin() {
  // Data corrente per navigazione mese
  const [dataVisualizzata, setDataVisualizzata] = useState(new Date());
  // Elenco delle attività del mese scaricate dal backend
  const [attivitaMese, setAttivitaMese] = useState([]);
  
  // Stato per il modale/form di aggiunta o modifica
  const [giornoSelezionato, setGiornoSelezionato] = useState(null); // Es: "2024-03-15"
  const [formTitolo, setFormTitolo] = useState('');
  const [formDescrizione, setFormDescrizione] = useState('');
  const [salvataggioInCorso, setSalvataggioInCorso] = useState(false);
  const [modale, setModale] = useState(null); // { titolo: '', testo: '', tipo: 'info'|'conferma', onConferma: () => {} }

  // Helper per mostrare all'utente le date nel formato italiano DD/MM/YYYY
  function formattaDataItaliana(dataIso) {
    if (!dataIso) return '';
    const [anno, mese, giorno] = dataIso.split('-');
    return `${giorno}/${mese}/${anno}`;
  }

  const annoVis = dataVisualizzata.getFullYear();
  const meseVis = dataVisualizzata.getMonth() + 1; // 1-12

  useEffect(() => {
    caricaAttivita();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [annoVis, meseVis]); // Ricarica quando cambia mese o anno

  async function caricaAttivita() {
    try {
      const dati = await leggiAttivitaMese(annoVis, meseVis);
      setAttivitaMese(dati);
    } catch (e) {
      console.error('Errore caricamento calendario:', e);
    }
  }

  // --- Funzioni di navigazione ---
  function mesePrecedente() {
    setDataVisualizzata(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
    chiudiForm();
  }

  function meseSuccessivo() {
    setDataVisualizzata(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
    chiudiForm();
  }

  // --- Funzioni per il Form ---
  function apriGiorno(dataIsoStr, attivitaEsistente) {
    setGiornoSelezionato(dataIsoStr);
    if (attivitaEsistente) {
      setFormTitolo(attivitaEsistente.titolo);
      setFormDescrizione(attivitaEsistente.descrizione || '');
    } else {
      setFormTitolo('');
      setFormDescrizione('');
    }
  }

  function chiudiForm() {
    setGiornoSelezionato(null);
    setFormTitolo('');
    setFormDescrizione('');
  }

  async function gestisciSalvaAttivita() {
    // Controllo data passata usando il tempo locale
    const oggiObj = new Date();
    const oggiGiorno = `${oggiObj.getFullYear()}-${String(oggiObj.getMonth() + 1).padStart(2, '0')}-${String(oggiObj.getDate()).padStart(2, '0')}`;
    
    if (giornoSelezionato < oggiGiorno) {
      return mostramiModale('Azione non permessa', 'Non è possibile salvare o modificare attività in giorni passati.', 'info');
    }

    if (!formTitolo.trim()) {
      return mostramiModale('Dati Mancanti', 'Per favore, inserisci un titolo per l\'attività prima di salvare.', 'info');
    }
    
    setSalvataggioInCorso(true);
    try {
      await salvaAttivitaCalendario(giornoSelezionato, formTitolo, formDescrizione);
      await caricaAttivita(); // Ricarica aggiornato
      chiudiForm();
      mostramiModale('Successo', 'Attività salvata con successo nel calendario!', 'info');
    } catch (e) {
      console.error(e);
      mostramiModale('Errore di Salvataggio', "Si è verificato un errore durato il salvataggio.", 'info');
    } finally {
      setSalvataggioInCorso(false);
    }
  }

  function chiediConfermaEliminazione() {
    mostramiModale(
      'Conferma Eliminazione', 
      'Sei sicuro di voler eliminare definitivamente questa attività dal calendario?', 
      'conferma', 
      eseguiEliminazione
    );
  }

  async function eseguiEliminazione() {
    setSalvataggioInCorso(true);
    try {
      await eliminaAttivitaCalendario(giornoSelezionato);
      await caricaAttivita(); // Ricarica aggiornato
      chiudiForm();
      mostramiModale('Attività Eliminata', 'L\'attività selezionata è stata eliminata con successo.', 'info');
    } catch (e) {
      console.error(e);
      mostramiModale('Errore di Eliminazione', "Impossibile eliminare l'attività: " + (e.response?.data?.messaggio || e.message), 'info');
    } finally {
      setSalvataggioInCorso(false);
    }
  }

  function mostramiModale(titolo, testo, tipo, onConferma = null) {
    setModale({ titolo, testo, tipo, onConferma });
  }

  function chiudiModale() {
    setModale(null);
  }

  // --- Logica costruzione Griglia Calendario ---
  const primoGiornoDelMese = new Date(annoVis, meseVis - 1, 1);
  const ultimoGiornoDelMese = new Date(annoVis, meseVis, 0);
  const numeroGiorniMese = ultimoGiornoDelMese.getDate();
  
  // getDay() ritorna 0 per Domenica, 1 per Lunedì. Noi vogliamo Lunedì = 0
  let indiceGiornoInizio = primoGiornoDelMese.getDay() - 1;
  if (indiceGiornoInizio === -1) indiceGiornoInizio = 6; // Se era Domenica (0), diventa 6
  
  const celleGriglia = [];
  
  // Aggiungi celle vuote all'inizio
  for (let i = 0; i < indiceGiornoInizio; i++) {
    celleGriglia.push(<div key={`vuoto-${i}`} className="giorno-vuoto" />);
  }

  const oggiCorrenteObj = new Date();
  const oggiIso = `${oggiCorrenteObj.getFullYear()}-${String(oggiCorrenteObj.getMonth() + 1).padStart(2, '0')}-${String(oggiCorrenteObj.getDate()).padStart(2, '0')}`;

  // Aggiungi i giorni del mese
  for (let giorno = 1; giorno <= numeroGiorniMese; giorno++) {
    // Formato stringa YYYY-MM-DD "Giorno Corrente nel Loop"
    // PadStart per avere lo "0" iniziale (es. "05" invece di "5")
    const dataIsoStr = `${annoVis}-${String(meseVis).padStart(2, '0')}-${String(giorno).padStart(2, '0')}`;
    
    // Cerca se c'è un'attività in questa data scaricata dal backend
    // Format dal DB: "2024-03-15T00:00:00.000Z", prendiamo la prima parte
    const attivita = attivitaMese.find(a => a.data_esatta.startsWith(dataIsoStr));
    
    const eOggi = dataIsoStr === oggiIso;
    const eSelezionato = dataIsoStr === giornoSelezionato;

    celleGriglia.push(
      <div 
        key={giorno} 
        className={`giorno-cella cliccabile ${attivita ? 'giorno-con-attivita' : ''} ${eOggi ? 'giorno-oggi' : ''} ${eSelezionato ? 'giorno-selezionato' : ''}`}
        onClick={() => apriGiorno(dataIsoStr, attivita)}
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

  // --- Render ---
  const meseNome = dataVisualizzata.toLocaleString('it-IT', { month: 'long', year: 'numeric' });

  return (
    <div className="calendario-contenitore">
      
      {/* Controlli Header */}
      <div className="calendario-header-controlli">
        <button className="btn-mese" onClick={mesePrecedente}>&lt; Precedente</button>
        <div className="mese-titolo">{meseNome}</div>
        <button className="btn-mese" onClick={meseSuccessivo}>Successivo &gt;</button>
      </div>

      {/* Griglia Calendario */}
      <div className="calendario-griglia-wrapper">
        <div className="calendario-griglia">
          {GIORNI_SETTIMANA.map(g => <div key={g} className="giorno-intestazione">{g}</div>)}
          {celleGriglia}
        </div>
      </div>

      {/* Pannello Modifica Attività (Pop-up Overlay per evitare salti di immagine) */}
      {giornoSelezionato && (
        <div className="calendario-modale-overlay">
          <div className="calendario-modale animazione-entrata" style={{ maxWidth: '500px' }}>
            <div className="dettaglio-header">
              <h3 className="modale-titolo" style={{ margin: 0 }}>Giorno: {formattaDataItaliana(giornoSelezionato)}</h3>
              <button className="btn-chiudi" onClick={chiudiForm} style={{ fontSize: '24px', color: '#000' }}>✕</button>
            </div>
            
              {/* Avviso per date passate */}
              {giornoSelezionato < oggiIso && (
                <div className="messaggio-errore" style={{ marginBottom: '16px' }}>
                  Impossibile salvare attività in giorni passati.
                </div>
              )}
              
              <div className="form-attivita" style={{ marginTop: '20px' }}>
                <div className="gruppo-campo">
                  <label className="etichetta-campo">Titolo Attività</label>
                  <input 
                    type="text" 
                    className="campo-input" 
                    placeholder="es. Presentazione Libro" 
                    value={formTitolo}
                    onChange={e => setFormTitolo(e.target.value)}
                    disabled={giornoSelezionato < oggiIso}
                  />
                </div>
                
                <div className="gruppo-campo">
                  <label className="etichetta-campo">Descrizione (Opzionale)</label>
                  <textarea 
                    className="campo-input campo-textarea" 
                    rows="4"
                    placeholder="Dettagli aggiuntivi..."
                    value={formDescrizione}
                    onChange={e => setFormDescrizione(e.target.value)}
                    disabled={giornoSelezionato < oggiIso}
                  />
                </div>
  
                <div className="modale-azioni" style={{ marginTop: '20px' }}>
                  {/* Mostra bottone Elimina solo se modifichiamo un'attività già esistente e non è nel passato */}
                  {attivitaMese.find(a => a.data_esatta.startsWith(giornoSelezionato)) && giornoSelezionato >= oggiIso && (
                    <button 
                      className="btn-elimina" 
                      onClick={chiediConfermaEliminazione}
                      disabled={salvataggioInCorso}
                      style={{ marginRight: 'auto' }}
                    >
                      Elimina
                    </button>
                  )}
  
                  <button type="button" className="btn-modale-annulla" onClick={chiudiForm}>Chiudi</button>
                  <button 
                    className={`btn-modale-conferma ${giornoSelezionato < oggiIso ? 'bottone-disabilitato' : ''}`}
                    onClick={gestisciSalvaAttivita}
                    disabled={salvataggioInCorso || giornoSelezionato < oggiIso}
                  >
                    {salvataggioInCorso ? 'Salvataggio...' : 'Salva'}
                  </button>
                </div>
              </div>
          </div>
        </div>
      )}

      {/* Modale Custom Sovrapposto */}
      {modale && (
        <div className="calendario-modale-overlay">
          <div className="calendario-modale">
            <h3 className="modale-titolo">{modale.titolo}</h3>
            <p className="modale-testo">{modale.testo}</p>
            <div className="modale-azioni">
              {modale.tipo === 'conferma' ? (
                <>
                  <button className="btn-modale-annulla" onClick={chiudiModale}>Annulla</button>
                  <button className="btn-modale-conferma" onClick={() => { modale.onConferma(); chiudiModale(); }}>Conferma</button>
                </>
              ) : (
                <button className="btn-modale-ok" onClick={chiudiModale}>OK</button>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default CalendarioAdmin;
