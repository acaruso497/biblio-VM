const database = require('../../backend/database');

module.exports = async (req, res) => {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method !== 'GET') return res.status(405).json({ messaggio: 'Metodo non consentito.' });

  try {
    const dataOdierna = new Date();
    const anno = req.query.anno ? parseInt(req.query.anno) : dataOdierna.getFullYear();
    const mese = req.query.mese ? parseInt(req.query.mese) : dataOdierna.getMonth() + 1;

    if (isNaN(anno) || isNaN(mese) || mese < 1 || mese > 12) {
      return res.status(400).json({ messaggio: 'Anno o mese non validi.' });
    }

    const dataInizio = `${anno}-${String(mese).padStart(2, '0')}-01`;
    const dataFine = new Date(anno, mese, 0).toISOString().split('T')[0];

    const risultato = await database.query(
      `SELECT TO_CHAR(data_esatta, 'YYYY-MM-DD') AS data_esatta, titolo, descrizione
       FROM calendario_attivita
       WHERE data_esatta BETWEEN $1::DATE AND $2::DATE
       ORDER BY data_esatta ASC`,
      [dataInizio, dataFine]
    );

    res.status(200).json(risultato.rows);
  } catch (errore) {
    console.error('Errore nel leggere le attività del mese:', errore);
    res.status(500).json({ messaggio: 'Errore interno del server.' });
  }
};
