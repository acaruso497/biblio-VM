-- =====================================================
-- SCRIPT DA ESEGUIRE IN pgAdmin — Query Tool
-- =====================================================
-- Istruzioni:
-- 1. Apri pgAdmin
-- 2. Clicca col tasto destro su "Databases" → "Create" → "Database"
--    Nomina il database: biblioteca_db
-- 3. Clicca su "biblioteca_db" per selezionarla
-- 4. Vai su Tools → Query Tool
-- 5. Incolla TUTTO questo script e clicca "Execute (F5)"
-- =====================================================


-- ─── Tabella degli amministratori ───────────────────
CREATE TABLE IF NOT EXISTS amministratori (
  id             SERIAL PRIMARY KEY,
  username       VARCHAR(100) UNIQUE NOT NULL,
  password_hash  TEXT NOT NULL,
  creato_il      TIMESTAMP DEFAULT NOW()
);


-- ─── Tabella delle impostazioni della biblioteca ────
CREATE TABLE IF NOT EXISTS impostazioni_biblioteca (
  id                 SERIAL PRIMARY KEY,
  e_aperta           BOOLEAN DEFAULT false,
  orari              JSONB DEFAULT '{}',
  messaggio_speciale TEXT DEFAULT '',
  aggiornato_il      TIMESTAMP DEFAULT NOW()
);


-- ─── Tabella delle attività del calendario Mensile ──
CREATE TABLE IF NOT EXISTS calendario_attivita (
  id             SERIAL PRIMARY KEY,
  data_esatta    DATE NOT NULL UNIQUE,
  titolo         VARCHAR(255) NOT NULL,
  descrizione    TEXT,
  creato_il      TIMESTAMP DEFAULT NOW()
);

-- ─── Tabella dei Prestiti dei Libri ─────────────────
CREATE TABLE IF NOT EXISTS prestiti_libri (
  id                SERIAL PRIMARY KEY,
  titolo_libro      VARCHAR(255) NOT NULL,
  genere            VARCHAR(100),
  nome_utente       VARCHAR(255) NOT NULL,
  telefono_utente   VARCHAR(50),
  data_prestito     TIMESTAMP DEFAULT NOW(),
  data_restituzione TIMESTAMP,
  stato             VARCHAR(20) DEFAULT 'IN_PRESTITO'
);


-- ─── Admin di default ───────────────────────────────
-- username: admin
-- password: biblioteca2025
-- (hashata con bcrypt 10 rounds)
INSERT INTO amministratori (username, password_hash)
VALUES (
  'admin',
  '$2b$10$lndjiCTFbVNN054k5cARg.KI2728ijDs5Dl798zaACbhchel6AGbi'
)
ON CONFLICT (username) DO NOTHING;


-- ─── Impostazioni iniziali della biblioteca ─────────
INSERT INTO impostazioni_biblioteca (id, e_aperta, orari, messaggio_speciale)
VALUES (
  1,
  false,
  '{
    "Lunedì":    "9:00 - 19:00",
    "Martedì":   "9:00 - 19:00",
    "Mercoledì": "9:00 - 19:00",
    "Giovedì":   "9:00 - 19:00",
    "Venerdì":   "9:00 - 18:00",
    "Sabato":    "10:00 - 13:00",
    "Domenica":  "Chiusa"
  }',
  'Benvenuti nella nostra biblioteca! Per informazioni chiamate il 0123-456789.'
)
ON CONFLICT (id) DO NOTHING;


-- ─── Un evento di esempio nel calendario ────────────
INSERT INTO calendario_attivita (data_esatta, titolo, descrizione)
VALUES (
  CURRENT_DATE + INTERVAL '2 days',
  'Presentazione Libro: Storia e Lotta',
  'Un incontro aperto a tutti per discutere del nuovo volume.'
)
ON CONFLICT (data_esatta) DO NOTHING;


-- ─── Verifica finale ────────────────────────────────
SELECT 'Tabella amministratori OK' AS stato, COUNT(*) AS righe FROM amministratori
UNION ALL
SELECT 'Tabella impostazioni OK',  COUNT(*) FROM impostazioni_biblioteca
UNION ALL
SELECT 'Tabella calendario OK',    COUNT(*) FROM calendario_attivita;
