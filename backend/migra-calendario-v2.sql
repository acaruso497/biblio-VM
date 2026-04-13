-- =====================================================
-- migra-calendario-v2.sql — Estensione Calendario
-- =====================================================
-- Aggiunge i campi start_time, end_time e is_recurring
-- alla tabella calendario_attivita.
-- Anche aggiunge la colonna id alla tabella se manca.
--
-- Eseguire UNA VOLTA in pgAdmin → Query Tool (F5).
-- Utilizza "IF NOT EXISTS" per essere sicuri di non
-- creare errori in caso di esecuzione multipla.
-- =====================================================

-- ─── 1. Rimuovi il vincolo UNIQUE su data_esatta ────
-- Non serve più: più attività possono avere la stessa data
-- (la logica di ricorrenza usa l'ID come chiave primaria).
-- ATTENZIONE: questo cambia il comportamento del POST!

-- Prima vediamo se esiste il constraint unique
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'calendario_attivita_data_esatta_key'
  ) THEN
    ALTER TABLE calendario_attivita DROP CONSTRAINT calendario_attivita_data_esatta_key;
    RAISE NOTICE 'Constraint UNIQUE su data_esatta rimosso.';
  ELSE
    RAISE NOTICE 'Constraint UNIQUE su data_esatta già assente, nessuna azione.';
  END IF;
END
$$;

-- ─── 2. Aggiungi start_time ──────────────────────────
ALTER TABLE calendario_attivita
  ADD COLUMN IF NOT EXISTS start_time TIME;

-- ─── 3. Aggiungi end_time ────────────────────────────
ALTER TABLE calendario_attivita
  ADD COLUMN IF NOT EXISTS end_time TIME;

-- ─── 4. Aggiungi is_recurring ────────────────────────
ALTER TABLE calendario_attivita
  ADD COLUMN IF NOT EXISTS is_recurring BOOLEAN DEFAULT false;

-- ─── 5. Verifica finale ──────────────────────────────
SELECT
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'calendario_attivita'
ORDER BY ordinal_position;
