import React, { useState, useEffect } from 'react';
import { leggiPrestiti, registraPrestito, restituisciLibro, svuotaArchivioPrestiti, eliminaPrestito } from '../servizi/api';
import './GestionePrestiti.css';

function GestionePrestiti() {
  const [prestiti, setPrestiti] = useState([]);
  const [caricamento, setCaricamento] = useState(true);
  const [salvataggioInCorso, setSalvataggioInCorso] = useState(false);
  const [messaggioFeedback, setMessaggioFeedback] = useState(null);

  // Form
  const [titolo, setTitolo] = useState('');
  const [genere, setGenere] = useState('');
  const [nome, setNome] = useState('');
  const [telefono, setTelefono] = useState('');

  // Sfondo modale
  const [modaleAperto, setModaleAperto] = useState(false);
  const [mostraConfermaSvuota, setMostraConfermaSvuota] = useState(false);

  // Gestione Modale Conferma Restituzione
  const [pDaRestituire, setPDaRestituire] = useState(null);
  
  // Gestione Modale Conferma Eliminazione Singola
  const [pDaEliminare, setPDaEliminare] = useState(null);

  useEffect(() => {
    caricaPrestiti();
  }, []);

  async function caricaPrestiti() {
    try {
      setCaricamento(true);
      const dati = await leggiPrestiti();
      setPrestiti(dati);
    } catch (e) {
      console.error(e);
      mostraFeedback('errore', 'Impossibile caricare i prestiti.');
    } finally {
      setCaricamento(false);
    }
  }

  function mostraFeedback(tipo, testo) {
    setMessaggioFeedback({ tipo, testo });
    setTimeout(() => setMessaggioFeedback(null), 4000);
  }

  async function gestisciRegistrazione(e) {
    e.preventDefault();
    if (!titolo.trim() || !nome.trim()) {
      mostraFeedback('errore', 'Titolo e Nome utente sono obbligatori.');
      return;
    }

    setSalvataggioInCorso(true);
    try {
      await registraPrestito({
        titoloLibro: titolo,
        genere: genere,
        nomeUtente: nome,
        telefonoUtente: telefono
      });
      mostraFeedback('successo', 'Prestito registrato con successo!');
      
      // Reset form
      setTitolo('');
      setGenere('');
      setNome('');
      setTelefono('');
      setModaleAperto(false);

      await caricaPrestiti();
    } catch (err) {
      console.error(err);
      mostraFeedback('errore', 'Errore durante la registrazione del prestito.');
    } finally {
      setSalvataggioInCorso(false);
    }
  }

  // Apre il modale di conferma interno
  function chiediConfermaRestituzione(idPrestito) {
    setPDaRestituire(idPrestito);
  }

  // Esegue l'azione dopo la conferma nel modale
  async function confermaRestituzione() {
    if (!pDaRestituire) return;

    setSalvataggioInCorso(true);
    try {
      await restituisciLibro(pDaRestituire);
      mostraFeedback('successo', 'Libro segnato come restituito.');
      setPDaRestituire(null);
      await caricaPrestiti();
    } catch (err) {
      console.error(err);
      mostraFeedback('errore', 'Errore durante l\'aggiornamento.');
    } finally {
      setSalvataggioInCorso(false);
    }
  }

  async function gestisciSvuotaTutto() {
    setSalvataggioInCorso(true);
    try {
      const risposta = await svuotaArchivioPrestiti();
      mostraFeedback('successo', risposta.messaggio);
      setMostraConfermaSvuota(false);
      await caricaPrestiti();
    } catch (err) {
      mostraFeedback('errore', 'Errore durante lo svuotamento.');
    } finally {
      setSalvataggioInCorso(false);
    }
  }

  function chiediConfermaEliminazione(idPrestito) {
    setPDaEliminare(idPrestito);
  }

  async function confermaEliminazione() {
    if (!pDaEliminare) return;

    setSalvataggioInCorso(true);
    try {
      await eliminaPrestito(pDaEliminare);
      mostraFeedback('successo', 'Record eliminato con successo.');
      setPDaEliminare(null);
      await caricaPrestiti();
    } catch (err) {
      if (err.response && err.response.status === 403) {
        mostraFeedback('errore', err.response.data.messaggio);
      } else {
        mostraFeedback('errore', 'Errore durante l\'eliminazione del record.');
      }
    } finally {
      setSalvataggioInCorso(false);
    }
  }

  // Helper per le date
  function formattaData(isoString) {
    if (!isoString) return '-';
    const data = new Date(isoString);
    return data.toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }

  return (
    <div className="gestione-prestiti-contenitore">

      <div className="prestiti-header">
        <h3 className="prestiti-titolo">Catalogo Uscite</h3>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="btn-elimina" onClick={() => setMostraConfermaSvuota(true)}>Pulisci Archivio</button>
          <button className="bottone-primario" onClick={() => setModaleAperto(true)}>
            + Nuovo Prestito
          </button>
        </div>
      </div>

      {messaggioFeedback && (
        <div className={`messaggio-${messaggioFeedback.tipo}`} style={{ margin: '0 24px 16px' }}>
          {messaggioFeedback.testo}
        </div>
      )}

      {caricamento ? (
        <div style={{ padding: '40px', textAlign: 'center', color: 'var(--bianco-sporco-2)' }}>Caricamento archivio...</div>
      ) : (
        <div className="tabella-prestiti-wrapper">
          <table className="tabella-prestiti">
            <thead>
              <tr>
                <th>Libro</th>
                <th>Utente</th>
                <th>Preso il</th>
                <th>Restituito il</th>
                <th>Stato / Azione</th>
              </tr>
            </thead>
            <tbody>
              {prestiti.length === 0 ? (
                <tr>
                  <td colSpan="5" className="cella-vuota">Nessun prestito registrato nel database.</td>
                </tr>
              ) : (
                prestiti.map(p => (
                  <tr key={p.id} className={p.stato === 'RESTITUITO' ? 'riga-restituita' : ''}>
                    <td>
                      <div className="libro-titolo">{p.titolo_libro}</div>
                      <div className="libro-genere">{p.genere || 'N/A'}</div>
                    </td>
                    <td>
                      <div className="utente-nome">{p.nome_utente}</div>
                      <div className="utente-telefono">{p.telefono_utente || 'Nessun recapito'}</div>
                    </td>
                    <td>{formattaData(p.data_prestito)}</td>
                    <td>{p.stato === 'RESTITUITO' ? formattaData(p.data_restituzione) : '-'}</td>
                    <td>
                      {p.stato === 'IN_PRESTITO' ? (
                         <button 
                           className="bottone-rientro" 
                           onClick={() => chiediConfermaRestituzione(p.id)}
                           disabled={salvataggioInCorso}
                         >
                           Segna Rientro
                         </button>
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span className="badge-concluso">Concluso</span>
                          <button 
                            className="btn-mini-elimina" 
                            title="Elimina record"
                            onClick={() => chiediConfermaEliminazione(p.id)}
                            disabled={salvataggioInCorso}
                          >
                            ×
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Modale Inserimento */}
      {modaleAperto && (
        <div className="calendario-modale-overlay">
          <div className="calendario-modale modale-form-largo animazione-entrata">
            <h3 className="modale-titolo">Registra Uscita Libro</h3>
            
            <form onSubmit={gestisciRegistrazione} className="modulo-nuovo-prestito">
              <div className="form-doppia-colonna">
                 <div className="gruppo-campo p-campo">
                    <label className="etichetta-campo">Titolo dell'Opera *</label>
                    <input type="text" className="campo-input" required value={titolo} onChange={e => setTitolo(e.target.value)} placeholder="Es: I Demoni" />
                 </div>
                 <div className="gruppo-campo p-campo">
                    <label className="etichetta-campo">Genere / Categoria</label>
                    <input type="text" className="campo-input" value={genere} onChange={e => setGenere(e.target.value)} placeholder="Es: Letteratura Russa" />
                 </div>
              </div>

              <div className="form-doppia-colonna">
                 <div className="gruppo-campo p-campo">
                    <label className="etichetta-campo">Nome e Cognome *</label>
                    <input type="text" className="campo-input" required value={nome} onChange={e => setNome(e.target.value)} placeholder="A chi stiamo dando il libro?" />
                 </div>
                 <div className="gruppo-campo p-campo">
                    <label className="etichetta-campo">Recapito Telefonico</label>
                    <input type="text" className="campo-input" value={telefono} onChange={e => setTelefono(e.target.value)} placeholder="Per solleciti..." />
                 </div>
              </div>

              <div className="modale-azioni">
                <button type="button" className="btn-modale-annulla" onClick={() => setModaleAperto(false)}>Annulla</button>
                <button type="submit" className="btn-modale-conferma" disabled={salvataggioInCorso}>
                  {salvataggioInCorso ? 'Registrazione...' : 'Conferma Uscita'}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* Modale Conferma Restituzione (Sostituisce Confirm Browser) */}
      {pDaRestituire && (
        <div className="calendario-modale-overlay">
          <div className="calendario-modale animazione-entrata" style={{ maxWidth: '400px' }}>
            <h3 className="modale-titolo">Conferma Restituzione</h3>
            <p style={{ margin: '16px 0', fontSize: '15px', color: 'var(--bianco-sporco-2)' }}>
              Confermi che il libro è stato restituito integro e può essere riammesso in catalogo?
            </p>
            <div className="modale-azioni">
              <button 
                className="btn-modale-annulla" 
                onClick={() => setPDaRestituire(null)}
                disabled={salvataggioInCorso}
              >
                Annulla
              </button>
              <button 
                className="btn-modale-conferma" 
                onClick={confermaRestituzione}
                disabled={salvataggioInCorso}
              >
                {salvataggioInCorso ? 'Attendi...' : 'Sì, libro reso'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modale Conferma Svuota (Pulisci) */}
      {mostraConfermaSvuota && (
        <div className="calendario-modale-overlay">
          <div className="calendario-modale animazione-entrata" style={{ maxWidth: '450px' }}>
            <h3 className="modale-titolo">Pulisci Archivio Storico</h3>
            <p style={{ margin: '16px 0', fontSize: '15px', color: '#000000', fontWeight: 'bold' }}>
              Questa azione eliminerà definitivamente solo i record dei prestiti **già restituiti**. 
              <br/><br/>
              I prestiti attualmente in corso (libri ancora fuori) **non verranno toccati** e rimarranno in elenco.
            </p>
            <div className="modale-azioni">
              <button className="btn-modale-annulla" onClick={() => setMostraConfermaSvuota(false)}>Annulla</button>
              <button 
                className="btn-modale-conferma" 
                style={{ background: 'var(--rosso-allarme)' }}
                onClick={gestisciSvuotaTutto}
                disabled={salvataggioInCorso}
              >
                {salvataggioInCorso ? 'Pulizia...' : 'SÌ, PULISCI STORICO'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modale Conferma Eliminazione Singola */}
      {pDaEliminare && (
        <div className="calendario-modale-overlay">
          <div className="calendario-modale animazione-entrata" style={{ maxWidth: '400px' }}>
            <h3 className="modale-titolo">Elimina Record</h3>
            <p style={{ margin: '16px 0', fontSize: '15px', color: '#000000', fontWeight: 'bold' }}>
              Vuoi eliminare definitivamente questo record dall'archivio dei prestiti conclusi?
            </p>
            <div className="modale-azioni">
              <button 
                className="btn-modale-annulla" 
                onClick={() => setPDaEliminare(null)}
                disabled={salvataggioInCorso}
              >
                Annulla
              </button>
              <button 
                className="btn-modale-conferma" 
                style={{ background: 'var(--rosso-allarme)' }}
                onClick={confermaEliminazione}
                disabled={salvataggioInCorso}
              >
                {salvataggioInCorso ? 'Eliminazione...' : 'Sì, elimina'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default GestionePrestiti;
