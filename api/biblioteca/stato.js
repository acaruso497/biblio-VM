const database = require('../../backend/database');

module.exports = async (req, res) => {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method !== 'GET') return res.status(405).json({ messaggio: 'Metodo non consentito.' });
  
  try {
    const risultato = await database.query(
      `SELECT e_aperta, orari, messaggio_speciale, reset_mezzanotte, aggiornato_il
       FROM impostazioni_biblioteca WHERE id = 1`
    );

    if (risultato.rows.length === 0) {
      return res.status(404).json({ messaggio: 'Impostazioni della biblioteca non trovate.' });
    }

    const riga = risultato.rows[0];
    res.status(200).json({
      eAperta:           riga.e_aperta,
      orari:             riga.orari,
      messaggioSpeciale: riga.messaggio_speciale,
      resetMezzanotte:   riga.reset_mezzanotte,
      aggiornatoIl:      riga.aggiornato_il
    });
  } catch (errore) {
    console.error('Errore nel leggere lo stato della biblioteca:', errore);
    res.status(500).json({ messaggio: 'Errore interno del server.' });
  }
};
