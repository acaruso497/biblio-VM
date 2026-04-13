import React, { useState, useEffect } from 'react';
import {
  leggiAttivitaMese,
  salvaAttivitaCalendario,
  modificaAttivitaCalendario,
  eliminaAttivitaCalendario
} from '../servizi/api';
import WheelTimePicker from './WheelPicker';
import './Calendario.css';

const GIORNI_SETTIMANA = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'];

// ─────────────────────────────────────────────────────
// Icona orologio SVG inline leggera
// ─────────────────────────────────────────────────────
function IconOrologio() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: 'middle', marginRight: 4 }}>
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

function CalendarioAdmin() {
  const [dataVisualizzata, setDataVisualizzata] = useState(new Date());
  const [attivitaMese, setAttivitaMese]         = useState([]);

  // Stato form inserimento
  const [giornoSelezionato, setGiornoSelezionato] = useState(null);
  const [formTitolo, setFormTitolo]               = useState('');
  const [formDescrizione, setFormDescrizione]     = useState('');
  const [formStartTime, setFormStartTime]         = useState('09:00');
  const [formEndTime, setFormEndTime]             = useState('');
  const [formIsRecurring, setFormIsRecurring]    = useState(false);
  const [mostraEndTime, setMostraEndTime]         = useState(false);

  // Stato modifica
  const [modalitaModifica, setModalitaModifica] = useState(false);
  const [idAttivitaInModifica, setIdAttivitaInModifica] = useState(null);

  const [salvataggioInCorso, setSalvataggioInCorso] = useState(false);
  const [modale, setModale] = useState(null);

  function formattaDataItaliana(dataIso) {
    if (!dataIso) return '';
    const [anno, mese, giorno] = dataIso.split('-');
    return `${giorno}/${mese}/${anno}`;
  }

  function formattaOrario(start, end) {
    if (!start) return '';
    return end ? `${start} – ${end}` : start;
  }

  const annoVis = dataVisualizzata.getFullYear();
  const meseVis = dataVisualizzata.getMonth() + 1;

  useEffect(() => {
    caricaAttivita();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [annoVis, meseVis]);

  async function caricaAttivita() {
    try {
      const dati = await leggiAttivitaMese(annoVis, meseVis);
      setAttivitaMese(dati);
    } catch (e) {
      console.error('Errore caricamento calendario:', e);
    }
  }

  function mesePrecedente() {
    setDataVisualizzata(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
    chiudiForm();
  }

  function meseSuccessivo() {
    setDataVisualizzata(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
    chiudiForm();
  }

  // ─── Apri giorno (clic su cella) ───────────────────
  function apriGiorno(dataIsoStr, attivitaEsistente) {
    setGiornoSelezionato(dataIsoStr);
    setModalitaModifica(false);
    setIdAttivitaInModifica(null);
    if (attivitaEsistente) {
      setFormTitolo(attivitaEsistente.titolo);
      setFormDescrizione(attivitaEsistente.descrizione || '');
      setFormStartTime(attivitaEsistente.start_time || '09:00');
      setFormEndTime(attivitaEsistente.end_time || '');
      setMostraEndTime(!!(attivitaEsistente.end_time));
    } else {
      setFormTitolo('');
      setFormDescrizione('');
      setFormStartTime('09:00');
      setFormEndTime('');
      setMostraEndTime(false);
    }
    setFormIsRecurring(false);
  }

  function chiudiForm() {
    setGiornoSelezionato(null);
    setFormTitolo('');
    setFormDescrizione('');
    setFormStartTime('09:00');
    setFormEndTime('');
    setFormIsRecurring(false);
    setMostraEndTime(false);
    setModalitaModifica(false);
    setIdAttivitaInModifica(null);
  }

  // ─── Attiva modalità modifica ────────────────────────
  function attivaModifica(attivita) {
    setModalitaModifica(true);
    setIdAttivitaInModifica(attivita.id);
    setFormTitolo(attivita.titolo);
    setFormDescrizione(attivita.descrizione || '');
    setFormStartTime(attivita.start_time || '09:00');
    setFormEndTime(attivita.end_time || '');
    setMostraEndTime(!!(attivita.end_time));
  }

  // ─── Salva (inserimento) ─────────────────────────────
  async function gestisciSalvaAttivita() {
    const oggiObj = new Date();
    const oggiGiorno = `${oggiObj.getFullYear()}-${String(oggiObj.getMonth() + 1).padStart(2, '0')}-${String(oggiObj.getDate()).padStart(2, '0')}`;

    if (giornoSelezionato < oggiGiorno) {
      return mostramiModale('Azione non permessa', 'Non è possibile salvare attività in giorni passati.', 'info');
    }
    if (!formTitolo.trim()) {
      return mostramiModale('Dati Mancanti', 'Inserisci un titolo per l\'attività.', 'info');
    }
    if (!formStartTime) {
      return mostramiModale('Orario Mancante', 'L\'ora di inizio è obbligatoria.', 'info');
    }

    setSalvataggioInCorso(true);
    try {
      const risultato = await salvaAttivitaCalendario(
        giornoSelezionato,
        formTitolo,
        formDescrizione,
        formStartTime,
        mostraEndTime ? formEndTime : '',
        formIsRecurring
      );
      await caricaAttivita();
      chiudiForm();

      const numAttivita = risultato.attivita ? risultato.attivita.length : 1;
      mostramiModale(
        'Successo ✓',
        numAttivita > 1
          ? `${numAttivita} attività ricorrenti salvate con successo nel calendario!`
          : 'Attività salvata con successo nel calendario!',
        'info'
      );
    } catch (e) {
      console.error(e);
      mostramiModale('Errore di Salvataggio', e.response?.data?.messaggio || 'Errore durante il salvataggio.', 'info');
    } finally {
      setSalvataggioInCorso(false);
    }
  }

  // ─── Salva modifica esistente ────────────────────────
  async function gestisciConfermaModifica() {
    if (!formTitolo.trim()) {
      return mostramiModale('Dati Mancanti', 'Il titolo è obbligatorio.', 'info');
    }
    if (!formStartTime) {
      return mostramiModale('Orario Mancante', 'L\'ora di inizio è obbligatoria.', 'info');
    }

    setSalvataggioInCorso(true);
    try {
      await modificaAttivitaCalendario(
        idAttivitaInModifica,
        formTitolo,
        formDescrizione,
        formStartTime,
        mostraEndTime ? formEndTime : ''
      );
      await caricaAttivita();

      // Aggiorna il form con i nuovi dati senza chiudere
      setModalitaModifica(false);
      setIdAttivitaInModifica(null);
      mostramiModale('Aggiornamento ✓', 'Attività modificata con successo!', 'info');

    } catch (e) {
      console.error(e);
      mostramiModale('Errore', e.response?.data?.messaggio || 'Errore durante la modifica.', 'info');
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
      await caricaAttivita();
      chiudiForm();
      mostramiModale('Eliminata ✓', 'L\'attività è stata eliminata con successo.', 'info');
    } catch (e) {
      console.error(e);
      mostramiModale('Errore', 'Impossibile eliminare: ' + (e.response?.data?.messaggio || e.message), 'info');
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

  // ─── Logica Griglia ─────────────────────────────────
  const primoGiornoDelMese  = new Date(annoVis, meseVis - 1, 1);
  const ultimoGiornoDelMese = new Date(annoVis, meseVis, 0);
  const numeroGiorniMese    = ultimoGiornoDelMese.getDate();

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
    const attivita   = attivitaMese.find(a => a.data_esatta.startsWith(dataIsoStr));
    const eOggi      = dataIsoStr === oggiIso;
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
            {attivita.start_time && (
              <span className="preview-orario">
                <IconOrologio />{attivita.start_time}
              </span>
            )}
            <span className="preview-titolo">{attivita.titolo}</span>
          </div>
        )}
      </div>
    );
  }

  const meseNome = dataVisualizzata.toLocaleString('it-IT', { month: 'long', year: 'numeric' });

  // Attività corrente selezionata (per mostrare dati in sola lettura)
  const attivitaSelezionata = giornoSelezionato
    ? attivitaMese.find(a => a.data_esatta.startsWith(giornoSelezionato))
    : null;

  // Sono in modalità inserimento (giorno aperto ma non è modifica)
  const eInserimento = giornoSelezionato && !attivitaSelezionata;
  // Sono in visualizzazione di un'attività esistente (non modifica)
  const eVisualizzazione = attivitaSelezionata && !modalitaModifica;

  return (
    <div className="calendario-contenitore">

      {/* Header navigazione mese */}
      <div className="calendario-header-controlli">
        <button className="btn-mese-freccia" onClick={mesePrecedente} title="Mese Precedente">&#x276E;</button>
        <div className="mese-titolo">{meseNome}</div>
        <button className="btn-mese-freccia" onClick={meseSuccessivo} title="Mese Successivo">&#x276F;</button>
      </div>

      {/* Griglia */}
      <div className="calendario-griglia-wrapper">
        <div className="calendario-griglia">
          {GIORNI_SETTIMANA.map(g => <div key={g} className="giorno-intestazione">{g}</div>)}
          {celleGriglia}
        </div>
      </div>

      {/* ─── Pannello dettaglio / form ────────────────── */}
      {giornoSelezionato && (
        <div className="calendario-modale-overlay">
          <div className="calendario-modale animazione-entrata" style={{ maxWidth: '520px' }}>

            {/* Header pannello */}
            <div className="dettaglio-header">
              <h3 className="modale-titolo" style={{ margin: 0 }}>
                {eVisualizzazione ? '📅 ' : '✏️ '}
                {formattaDataItaliana(giornoSelezionato)}
              </h3>
              <button className="btn-chiudi" onClick={chiudiForm} style={{ fontSize: '24px', color: '#000' }}>✕</button>
            </div>

            {/* Avviso data passata */}
            {giornoSelezionato < oggiIso && (
              <div className="messaggio-errore" style={{ marginBottom: '16px' }}>
                Impossibile salvare attività in giorni passati.
              </div>
            )}

            {/* ─── MODALITÀ VISUALIZZAZIONE ─── */}
            {eVisualizzazione && (
              <div className="form-attivita" style={{ marginTop: '16px' }}>
                <div className="attivita-vista-titolo">{attivitaSelezionata.titolo}</div>
                {(attivitaSelezionata.start_time) && (
                  <div className="attivita-vista-orario">
                    <IconOrologio />
                    {formattaOrario(attivitaSelezionata.start_time, attivitaSelezionata.end_time)}
                  </div>
                )}
                {attivitaSelezionata.descrizione && (
                  <div className="attivita-vista-desc">{attivitaSelezionata.descrizione}</div>
                )}

                <div className="modale-azioni" style={{ marginTop: '20px' }}>
                  {giornoSelezionato >= oggiIso && (
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
                  {giornoSelezionato >= oggiIso && (
                    <button
                      className="btn-modifica-attivita"
                      onClick={() => attivaModifica(attivitaSelezionata)}
                    >
                      ✏️ Modifica
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* ─── MODALITÀ INSERIMENTO / MODIFICA ─── */}
            {(eInserimento || modalitaModifica) && (
              <div className="form-attivita" style={{ marginTop: '20px' }}>

                {/* Titolo */}
                <div className="gruppo-campo">
                  <label className="etichetta-campo">Titolo Attività *</label>
                  <input
                    type="text"
                    className="campo-input"
                    placeholder="es. Presentazione Libro"
                    value={formTitolo}
                    onChange={e => setFormTitolo(e.target.value)}
                  />
                </div>

                {/* Descrizione */}
                <div className="gruppo-campo">
                  <label className="etichetta-campo">Descrizione (Opzionale)</label>
                  <textarea
                    className="campo-input campo-textarea"
                    rows="3"
                    placeholder="Dettagli aggiuntivi..."
                    value={formDescrizione}
                    onChange={e => setFormDescrizione(e.target.value)}
                  />
                </div>

                {/* Selettori orario */}
                <div className="gruppo-campo">
                  <label className="etichetta-campo">Ora Inizio *</label>
                  <WheelTimePicker
                    value={formStartTime}
                    onChange={setFormStartTime}
                  />
                </div>

                <div className="gruppo-campo">
                  <div className="etichetta-campo-riga">
                    <label className="etichetta-campo">Ora Fine</label>
                    <label className="switch-toggle" style={{ marginLeft: 'auto' }}>
                      <input
                        type="checkbox"
                        checked={mostraEndTime}
                        onChange={e => {
                          setMostraEndTime(e.target.checked);
                          if (!e.target.checked) setFormEndTime('');
                          else if (!formEndTime) setFormEndTime('10:00');
                        }}
                      />
                      <span className="toggle-slider"></span>
                      <span style={{ marginLeft: 8, fontSize: 13, color: 'rgba(255,255,255,0.6)' }}>
                        {mostraEndTime ? 'Imposta' : 'Facoltativa'}
                      </span>
                    </label>
                  </div>
                  {mostraEndTime && (
                    <WheelTimePicker
                      value={formEndTime || '10:00'}
                      onChange={setFormEndTime}
                    />
                  )}
                </div>

                {/* Checkbox ricorrenza (solo inserimento, non modifica) */}
                {eInserimento && (
                  <label className="checkbox-ricorrenza">
                    <input
                      type="checkbox"
                      checked={formIsRecurring}
                      onChange={e => setFormIsRecurring(e.target.checked)}
                    />
                    <span className="checkbox-ricorrenza-testo">
                      🔁 Ripeti per tutto il mese
                      <small>ogni {['Dom','Lun','Mar','Mer','Gio','Ven','Sab'][new Date(giornoSelezionato + 'T00:00:00').getDay()]} fino al fine mese</small>
                    </span>
                  </label>
                )}

                {/* Azioni */}
                <div className="modale-azioni" style={{ marginTop: '20px' }}>
                  {!modalitaModifica && attivitaSelezionata && giornoSelezionato >= oggiIso && (
                    <button
                      className="btn-elimina"
                      onClick={chiediConfermaEliminazione}
                      disabled={salvataggioInCorso}
                      style={{ marginRight: 'auto' }}
                    >
                      Elimina
                    </button>
                  )}
                  <button type="button" className="btn-modale-annulla" onClick={modalitaModifica ? () => setModalitaModifica(false) : chiudiForm}>
                    {modalitaModifica ? 'Annulla' : 'Chiudi'}
                  </button>
                  <button
                    className="btn-modale-conferma"
                    onClick={modalitaModifica ? gestisciConfermaModifica : gestisciSalvaAttivita}
                    disabled={salvataggioInCorso}
                  >
                    {salvataggioInCorso
                      ? 'Salvataggio...'
                      : modalitaModifica
                        ? 'Salva Modifiche'
                        : (formIsRecurring ? '🔁 Salva Ricorrenze' : 'Salva')}
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      )}

      {/* ─── Modale custom ──────────────────────────── */}
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
