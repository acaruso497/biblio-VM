const database = require('../../backend/database');

module.exports = async (req, res) => {
  // Solo per sicurezza, ma Vercel Cron chiama solitamente con un token o secret
  // Qui lo lasciamo semplice per ora.
  
  console.log('🕛 Vercel Cron — Reset mezzanotte avviato...');

  try {
    const risultato = await database.query(
      'SELECT reset_mezzanotte FROM impostazioni_biblioteca WHERE id = 1'
    );

    if (risultato.rows.length === 0) {
      console.log('⚠️ Nessuna impostazione trovata.');
      return res.status(404).json({ messaggio: 'Impostazioni non trovate.' });
    }

    const resetAttivo = risultato.rows[0].reset_mezzanotte;

    if (!resetAttivo) {
      console.log('💤 Reset mezzanotte disabilitato.');
      return res.status(200).json({ messaggio: 'Reset disabilitato nelle impostazioni.' });
    }

    await database.query(
      `UPDATE impostazioni_biblioteca
       SET e_aperta = false, aggiornato_il = NOW()
       WHERE id = 1`
    );

    console.log('🌙 Reset mezzanotte eseguito.');
    res.status(200).json({ messaggio: 'Reset mezzanotte eseguito con successo.' });

  } catch (errore) {
    console.error('❌ Errore durante il reset mezzanotte:', errore.message);
    res.status(500).json({ messaggio: 'Errore interno durante il reset.' });
  }
};
