-- =====================================================
-- aggiorna-db.sql — Migrazione al nuovo schema
-- =====================================================
-- Questo script aggiorna il database esistente
-- senza cancellare nulla. Va eseguito UNA VOLTA SOLA.
--
-- Come eseguirlo (pgAdmin → Query Tool):
-- Incolla tutto e premi F5
-- =====================================================


-- ─── 1. Aggiungiamo la colonna "reset_mezzanotte" ───
-- Se la colonna esiste già (run multiplo), l'istruzione
-- viene semplicemente ignorata grazie a "IF NOT EXISTS"
ALTER TABLE impostazioni_biblioteca
  ADD COLUMN IF NOT EXISTS reset_mezzanotte BOOLEAN DEFAULT false;


-- ─── 2. Migriamo il formato degli orari ─────────────
-- Il vecchio formato era una semplice stringa per giorno:
--   { "Lunedì": "9:00 - 19:00", ... }
--
-- Il nuovo formato è un oggetto ricco per giorno:
--   { "Lunedì": { "dalle": "09:00", "alle": "19:00",
--                 "chiuso": false, "evento": "" }, ... }
--
-- Sostituiamo direttamente il JSONB con il nuovo schema.
-- Nota: questo sovrascrive gli orari esistenti con
-- i valori di default. L'admin li potrà modificare
-- subito dopo dall'interfaccia.
UPDATE impostazioni_biblioteca
SET orari = '{
  "Lunedì":    {"dalle": "09:00", "alle": "19:00", "chiuso": false, "evento": ""},
  "Martedì":   {"dalle": "09:00", "alle": "19:00", "chiuso": false, "evento": ""},
  "Mercoledì": {"dalle": "09:00", "alle": "19:00", "chiuso": false, "evento": ""},
  "Giovedì":   {"dalle": "09:00", "alle": "19:00", "chiuso": false, "evento": ""},
  "Venerdì":   {"dalle": "09:00", "alle": "18:00", "chiuso": false, "evento": ""},
  "Sabato":    {"dalle": "10:00", "alle": "13:00", "chiuso": false, "evento": ""},
  "Domenica":  {"dalle": "",      "alle": "",       "chiuso": true,  "evento": ""}
}'::jsonb
WHERE id = 1;


-- ─── 3. Verifica finale del risultato ────────────────
SELECT
  'Migrazione completata!' AS stato,
  reset_mezzanotte,
  jsonb_object_keys(orari) AS giorni_configurati
FROM impostazioni_biblioteca
WHERE id = 1;
