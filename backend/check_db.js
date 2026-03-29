const pool = require('./database');
async function check() {
  try {
    const res = await pool.query("SELECT column_name FROM information_schema.columns WHERE table_name='impostazioni_biblioteca' AND column_name='reset_mezzanotte'");
    if (res.rowCount > 0) {
      console.log("COLONNA_ESISTE");
    } else {
      console.log("COLONNA_MANCANTE");
    }
  } catch (e) {
    console.error("ERRORE:", e.message);
  } finally {
    process.exit(0);
  }
}
check();
