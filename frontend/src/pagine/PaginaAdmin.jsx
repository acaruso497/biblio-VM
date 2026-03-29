// =====================================================
// pagine/PaginaAdmin.jsx — Dashboard Amministratore
// =====================================================
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  effettuaLogin, 
  leggiStatoBiblioteca, 
  aggiornaDatiBiblioteca,
  cambiaUsernameAdmin,
  cambiaPasswordAdmin,
  impostaToken,
  ottieniToken,
  ottieniUsername
} from '../servizi/api';
import CalendarioAdmin from '../componenti/CalendarioAdmin';
import GestionePrestiti from '../componenti/GestionePrestiti';
import './PaginaAdmin.css';

const GIORNI_SETTIMANA = ['Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato', 'Domenica'];

function PaginaAdmin() {
  // --- Autenticazione ---
  const [tokenAdmin, setTokenAdmin] = useState(ottieniToken());
  const [nomeAdminLoggato, setNomeAdminLoggato] = useState(ottieniUsername());
  const [usernameLogin, setUsernameLogin] = useState('');
  const [passwordLogin, setPasswordLogin] = useState('');
  const [loginInCorso, setLoginInCorso] = useState(false);
  const [erroreLogin, setErroreLogin] = useState('');

  // --- Dati Biblioteca ---
  const [eAperta, setEAperta] = useState(false);
  const [resetMezzanotte, setResetMezzanotte] = useState(false);
  const [orariInModifica, setOrariInModifica] = useState({});
  const [messaggioSpec, setMessaggioSpec] = useState('');
  const [caricamentoDati, setCaricamentoDati] = useState(true);
  const [salvataggiInCorso, setSalvataggiInCorso] = useState(false);
  const [feedbackSalvataggio, setFeedbackSalvataggio] = useState(null);

  // --- Navigazione ---
  const [vistaAttiva, setVistaAttiva] = useState('impostazioni');

  // --- Modale Credenziali ---
  const [mostraModaleCred, setMostraModaleCred] = useState(false);
  const [tipoModifica, setTipoModifica] = useState('username');
  const [userAttuale, setUserAttuale] = useState('');
  const [userNuovo, setUserNuovo] = useState('');
  const [passAttuale, setPassAttuale] = useState('');
  const [passNuova, setPassNuova] = useState('');
  const [passConferma, setPassConferma] = useState('');
  const [chiaveSicurezza, setChiaveSicurezza] = useState(''); // Dichiarazione mancante ripristinata
  const [invioInCorso, setInvioInCorso] = useState(false);
  const [feedbackModale, setFeedbackModale] = useState(null); // Fix fondamentale per il modale credenziali

  useEffect(() => {
    if (!tokenAdmin) {
      setCaricamentoDati(false);
      return;
    }
    async function caricaDati() {
      try {
        const dati = await leggiStatoBiblioteca();
        setEAperta(dati.eAperta);
        setResetMezzanotte(dati.resetMezzanotte || false);
        setOrariInModifica(dati.orari || {});
        setMessaggioSpec(dati.messaggioSpeciale || '');
      } catch (e) {
        console.error(e);
      } finally {
        setCaricamentoDati(false);
      }
    }
    caricaDati();
  }, [tokenAdmin]);

  async function gestisciLogin(e) {
    e.preventDefault();
    setLoginInCorso(true);
    setErroreLogin('');
    try {
      const ris = await effettuaLogin(usernameLogin, passwordLogin);
      // NON salviamo nel localStorage per richiedere il login ad ogni caricamento,
      // ma salviamo nella variabile in memoria in api.js per resistere ai cambi pagina
      impostaToken(ris.token, ris.username); 
      setTokenAdmin(ris.token);
      setNomeAdminLoggato(ris.username);
    } catch (err) {
      setErroreLogin(err.response?.data?.messaggio || 'Errore login.');
    } finally {
      setLoginInCorso(false);
    }
  }

  function effettuaLogout() {
    impostaToken(null, null);
    setTokenAdmin(null);
    setNomeAdminLoggato(null);
  }

  async function gestisciSalvataggio() {
    setSalvataggiInCorso(true);
    setFeedbackSalvataggio(null);
    try {
      await aggiornaDatiBiblioteca({
        eAperta,
        resetMezzanotte,
        orari: orariInModifica,
        messaggioSpeciale: messaggioSpec
      });
      setFeedbackSalvataggio({ tipo: 'successo', testo: '✅ Salvato con successo!' });
      setTimeout(() => setFeedbackSalvataggio(null), 3000);
    } catch (e) {
      if (e.response?.status === 401) return effettuaLogout();
      setFeedbackSalvataggio({ tipo: 'errore', testo: '❌ Errore nel salvataggio.' });
    } finally {
      setSalvataggiInCorso(false);
    }
  }

  async function eseguiCambioCredenziali(e) {
    e.preventDefault();
    setInvioInCorso(true);
    setFeedbackModale(null);
    try {
      if (tipoModifica === 'username') {
        const ris = await cambiaUsernameAdmin(userAttuale, userNuovo, passAttuale, chiaveSicurezza);
        setFeedbackModale({ tipo: 'successo', testo: '✅ ' + ris.messaggio });
        setNomeAdminLoggato(userNuovo);
        setTimeout(() => chiudiModaleCred(), 2000);
      } else {
        if (passNuova !== passConferma) {
          setFeedbackModale({ tipo: 'errore', testo: '❌ Le password non coincidono!' });
          setInvioInCorso(false);
          return;
        }
        const ris = await cambiaPasswordAdmin(passAttuale, passNuova, chiaveSicurezza);
        setFeedbackModale({ tipo: 'successo', testo: '✅ ' + ris.messaggio });
        setTimeout(() => chiudiModaleCred(), 2000);
      }
    } catch (err) {
      setFeedbackModale({ 
        tipo: 'errore', 
        testo: '❌ ' + (err.response?.data?.messaggio || 'Errore durante la modifica.') 
      });
    } finally {
      setInvioInCorso(false);
    }
  }

  function chiudiModaleCred() {
    setMostraModaleCred(false);
    setUserAttuale(''); setUserNuovo(''); setPassAttuale(''); setPassNuova(''); setPassConferma('');
    setChiaveSicurezza('');
    setFeedbackModale(null);
  }

  if (!tokenAdmin) {
    return (
      <div className="login-sfondo">
        <div className="login-card animazione-entrata">
          <div className="login-header">
            <h1 className="login-titolo">Area Amministratori</h1>
            <p className="login-sottotitolo">Accedi per gestire la biblioteca</p>
          </div>
          <form onSubmit={gestisciLogin} className="login-form">
            <div className="gruppo-campo">
              <label className="etichetta-campo">Username</label>
              <input type="text" className="campo-input" value={usernameLogin} onChange={e => setUsernameLogin(e.target.value)} required />
            </div>
            <div className="gruppo-campo">
              <label className="etichetta-campo">Password</label>
              <input type="password" className="campo-input" value={passwordLogin} onChange={e => setPasswordLogin(e.target.value)} required />
            </div>
            {erroreLogin && <div className="messaggio-errore">{erroreLogin}</div>}
            <button type="submit" className="bottone-primario" style={{ width: '100%' }} disabled={loginInCorso}>
              {loginInCorso ? 'Accesso...' : 'Entra'}
            </button>
          </form>
          <div className="login-footer">
            <Link to="/" className="link-torna-home">← Pagina Pubblica</Link>
          </div>
        </div>
      </div>
    );
  }

  if (caricamentoDati) return <div className="spinner-contenitore"><div className="spinner" /></div>;

  return (
    <div className="pagina-admin-layout">
      <header className="admin-navbar">
        <div className="navbar-contenitore">
          <nav className="navbar-nav">
            <button className={`nav-link ${vistaAttiva === 'impostazioni' ? 'nav-link-attivo' : ''}`} onClick={() => setVistaAttiva('impostazioni')}>Impostazioni</button>
            <button className={`nav-link ${vistaAttiva === 'calendario' ? 'nav-link-attivo' : ''}`} onClick={() => setVistaAttiva('calendario')}>Calendario</button>
            <button className={`nav-link ${vistaAttiva === 'prestiti' ? 'nav-link-attivo' : ''}`} onClick={() => setVistaAttiva('prestiti')}>Prestiti</button>
          </nav>
          <div className="navbar-centro">
            <div className="navbar-logo-wrapper">
              <img src="/logo.jpg" alt="Logo" className="navbar-logo" />
              <span className="navbar-testo-logo">Villa Medusa</span>
            </div>
          </div>
          <div className="navbar-azioni">
            <Link to="/" className="nav-link">Vista Utente</Link>
            <button onClick={() => setMostraModaleCred(true)} className="nav-link">Gestione Credenziali</button>
            <button onClick={effettuaLogout} className="nav-link">Esci</button>
          </div>
        </div>
      </header>

      <main className="admin-main-content">
        <div className="contenitore-dashboard full-width">
          {vistaAttiva === 'impostazioni' && (
            <div className="vista-impostazioni animazione-entrata">
              <div className="admin-header-titolo-vista">
                <h2>Benvenuto, {nomeAdminLoggato}</h2>
                <p>Gestisci lo stato e gli orari della biblioteca.</p>
              </div>

              <div className="admin-salvataggio-bar">
                <button className="bottone-primario" onClick={gestisciSalvataggio} disabled={salvataggiInCorso}>
                  {salvataggiInCorso ? 'Salvataggio...' : 'Salva Modifiche'}
                </button>
                {feedbackSalvataggio && (
                  <div className={feedbackSalvataggio.tipo === 'successo' ? 'messaggio-successo' : 'messaggio-errore'}>
                    {feedbackSalvataggio.testo}
                  </div>
                )}
              </div>

              <div className="admin-grid-layout">
                <section className="card admin-sezione-stato">
                  <h3 className="admin-sezione-titolo">Stato Biblioteca</h3>
                  <div className="stato-toggle-contenitore">
                    <button className={`stato-toggle-opzione ${!eAperta ? 'attivo-chiusa' : ''}`} onClick={() => setEAperta(false)}>Chiusa</button>
                    <button className={`stato-toggle-opzione ${eAperta ? 'attivo-aperta' : ''}`} onClick={() => setEAperta(true)}>Aperta</button>
                  </div>
                  <div className="reset-mezzanotte-box" style={{ marginTop: '20px', borderTop: '1px solid #eee', paddingTop: '15px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                      <input type="checkbox" style={{ width: '20px', height: '20px' }} checked={resetMezzanotte} onChange={e => setResetMezzanotte(e.target.checked)} />
                      <span style={{ fontSize: '14px', fontWeight: '600' }}>Reset automatico a Chiusa a mezzanotte</span>
                    </label>
                  </div>
                </section>

                <section className="card admin-sezione">
                  <h3 className="admin-sezione-titolo">Orari Settimanali</h3>
                  <div className="orari-form-griglia">
                    {GIORNI_SETTIMANA.map(g => (
                      <div key={g} className="orari-form-riga">
                        <label>{g}</label>
                        <input type="text" className="campo-input" value={orariInModifica[g] || ''} onChange={e => setOrariInModifica({...orariInModifica, [g]: e.target.value})} />
                      </div>
                    ))}
                  </div>
                </section>

                <section className="card admin-sezione admin-sezione-bacheca">
                  <h3 className="admin-sezione-titolo">Bacheca Messaggi</h3>
                  <div className="bacheca-contenitore">
                    <textarea 
                      className="campo-input bacheca-textarea" 
                      value={messaggioSpec} 
                      onChange={e => setMessaggioSpec(e.target.value)} 
                    />
                  </div>
                </section>
              </div>
            </div>
          )}

          {vistaAttiva === 'calendario' && <section className="card"><CalendarioAdmin /></section>}
          {vistaAttiva === 'prestiti' && <section className="card"><GestionePrestiti /></section>}
        </div>
      </main>

      {mostraModaleCred && (
        <div className="calendario-modale-overlay">
          <div className="calendario-modale credenziali-modale" style={{ maxWidth: '450px' }}>
            <h3 className="modale-titolo">Modifica Credenziali</h3>
            <div className="tabs-modale" style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
              <button className={`tab-btn ${tipoModifica === 'username' ? 'attivo' : ''}`} style={{ flex: 1 }} onClick={() => setTipoModifica('username')}>Username</button>
              <button className={`tab-btn ${tipoModifica === 'password' ? 'attivo' : ''}`} style={{ flex: 1 }} onClick={() => setTipoModifica('password')}>Password</button>
            </div>

            {feedbackModale && (
              <div className={`messaggio-${feedbackModale.tipo}`} style={{ marginBottom: '20px', padding: '12px', borderRadius: '6px' }}>
                {feedbackModale.testo}
              </div>
            )}

            <form onSubmit={eseguiCambioCredenziali} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              {tipoModifica === 'username' ? (
                <>
                  <input type="text" className="campo-input" placeholder="Username Attuale" value={userAttuale} onChange={e => setUserAttuale(e.target.value)} required />
                  <input type="text" className="campo-input" placeholder="Nuovo Username" value={userNuovo} onChange={e => setUserNuovo(e.target.value)} required />
                  <input type="password" className="campo-input" placeholder="Password Attuale" value={passAttuale} onChange={e => setPassAttuale(e.target.value)} required />
                </>
              ) : (
                <>
                  <input type="password" className="campo-input" placeholder="Password Attuale" value={passAttuale} onChange={e => setPassAttuale(e.target.value)} required />
                  <input type="password" className="campo-input" placeholder="Nuova Password" value={passNuova} onChange={e => setPassNuova(e.target.value)} required />
                  <input type="password" className="campo-input" placeholder="Conferma Nuova Password" value={passConferma} onChange={e => setPassConferma(e.target.value)} required />
                </>
              )}
              <div style={{ marginTop: '10px', padding: '15px', background: '#fff4f4', borderRadius: '8px', border: '1px solid #ffcaca' }}>
                <p style={{ fontSize: '12px', color: '#ef4444', fontWeight: 'bold', marginBottom: '8px', textTransform: 'uppercase' }}>Sicurezza Mandatoria</p>
                <input 
                  type="text" 
                  className="campo-input" 
                  placeholder="Chiave di Sicurezza Universale" 
                  value={chiaveSicurezza} 
                  onChange={e => setChiaveSicurezza(e.target.value)} 
                  required 
                  style={{ borderColor: '#ef4444' }}
                />
              </div>
              <div className="modale-azioni" style={{ marginTop: '10px' }}>
                <button type="button" className="btn-modale-annulla" onClick={chiudiModaleCred}>Annulla</button>
                <button type="submit" className="btn-modale-conferma" disabled={invioInCorso}>{invioInCorso ? 'Invio...' : 'Salva'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default PaginaAdmin;
