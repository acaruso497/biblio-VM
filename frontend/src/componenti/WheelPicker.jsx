// =====================================================
// WheelPicker.jsx — Selettore Orario a Rotella v3
// =====================================================
// STABLE VERSION: nessun doppio-render condizionale.
// - WheelColumn sempre montata, mai smontata/rimontata.
// - Stato neutro gestito solo via CSS (opacity), non
//   montando/smontando elementi diversi.
// - DualWheelPicker: Inizio | Fine affiancati, compatti.
// =====================================================

import React, { useRef, useEffect, useCallback } from 'react';
import './WheelPicker.css';

const ITEM_HEIGHT   = 36;  // px per voce
const VISIBLE_ITEMS = 3;   // sempre dispari → 1 padding sopra/sotto

// ─────────────────────────────────────────────────────
// WheelColumn — colonna scorrevole STABILE
// Props:
//   items    : string[]
//   value    : string  (elemento selezionato)
//   onChange : (val: string) => void
//   dimmed   : bool — se true i numeri appaiono sbiaditi
//              (effetto "neutro" senza rimontaggio)
// ─────────────────────────────────────────────────────
function WheelColumn({ items, value, onChange, dimmed = false }) {
  const containerRef = useRef(null);
  const isDragging   = useRef(false);
  const startY       = useRef(0);
  const startScroll  = useRef(0);
  const snapTimer    = useRef(null);
  // Previene che snapToNearest giri durante lo scroll programmato
  const isProgrammatic = useRef(false);

  const scrollToIndex = useCallback((index, behavior = 'smooth') => {
    if (!containerRef.current) return;
    isProgrammatic.current = true;
    containerRef.current.scrollTo({ top: index * ITEM_HEIGHT, behavior });
    // Resetta il flag dopo che l'animazione è completata
    setTimeout(() => { isProgrammatic.current = false; }, 300);
  }, []);

  // Posizione iniziale (solo al mount)
  useEffect(() => {
    const idx = items.indexOf(value);
    if (idx >= 0) scrollToIndex(idx, 'instant');
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Segue cambiamenti di value provenienti dall'esterno
  useEffect(() => {
    const idx = items.indexOf(value);
    if (idx >= 0) scrollToIndex(idx, 'smooth');
  }, [value]); // eslint-disable-line react-hooks/exhaustive-deps

  function snapToNearest() {
    if (!containerRef.current || isProgrammatic.current) return;
    const scrollTop = containerRef.current.scrollTop;
    const idx       = Math.round(scrollTop / ITEM_HEIGHT);
    const clamped   = Math.max(0, Math.min(idx, items.length - 1));
    // Notifica solo se il valore è cambiato
    if (items[clamped] !== value) {
      onChange(items[clamped]);
    }
    scrollToIndex(clamped, 'smooth');
  }

  // ── Scroll nativo ──────────────────────────────────
  function onScroll() {
    if (isProgrammatic.current) return;
    clearTimeout(snapTimer.current);
    snapTimer.current = setTimeout(snapToNearest, 120);
  }

  // ── Drag mouse ────────────────────────────────────
  function onMouseDown(e) {
    isDragging.current  = true;
    startY.current      = e.clientY;
    startScroll.current = containerRef.current.scrollTop;
    e.preventDefault(); // evita selezione testo
  }

  function onMouseMove(e) {
    if (!isDragging.current) return;
    containerRef.current.scrollTop = startScroll.current + (startY.current - e.clientY);
  }

  function onMouseUp() {
    if (!isDragging.current) return;
    isDragging.current = false;
    clearTimeout(snapTimer.current);
    snapToNearest();
  }

  // ── Touch ─────────────────────────────────────────
  function onTouchStart(e) {
    startY.current      = e.touches[0].clientY;
    startScroll.current = containerRef.current.scrollTop;
  }

  function onTouchMove(e) {
    containerRef.current.scrollTop = startScroll.current + (startY.current - e.touches[0].clientY);
  }

  function onTouchEnd() {
    clearTimeout(snapTimer.current);
    snapToNearest();
  }

  const padding = Math.floor(VISIBLE_ITEMS / 2); // = 1

  return (
    <div className="wc-wrapper">
      <div className="wc-indicator" />

      <div
        ref={containerRef}
        className={`wc-scroll${dimmed ? ' wc-dimmed' : ''}`}
        style={{ height: `${ITEM_HEIGHT * VISIBLE_ITEMS}px` }}
        onScroll={onScroll}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {Array.from({ length: padding }).map((_, i) => (
          <div key={`t${i}`} className="wc-item wc-pad" />
        ))}

        {items.map((item) => (
          <div
            key={item}
            className={`wc-item${item === value ? ' wc-selected' : ''}`}
            onClick={() => { onChange(item); scrollToIndex(items.indexOf(item)); }}
          >
            {item}
          </div>
        ))}

        {Array.from({ length: padding }).map((_, i) => (
          <div key={`b${i}`} className="wc-item wc-pad" />
        ))}
      </div>

      <div className="wc-fade wc-fade-top" />
      <div className="wc-fade wc-fade-bottom" />
    </div>
  );
}

// ─────────────────────────────────────────────────────
// WheelTimePicker — singolo orologio HH:mm
//   value    : "HH:mm" | "" (vuoto = visualizzazione neutra)
//   onChange : (val: string) => void
//   label    : string
// NOTA: non fa più il render condizionale di WheelColumn.
//       Lo stato neutro è solo visivo (dimmed=true).
//       Quando l'utente interagisce, onChange riceve il
//       primo valore reale e il parent aggiorna il state.
// ─────────────────────────────────────────────────────
export function WheelTimePicker({ value, onChange, label }) {
  const ore    = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
  const minuti = ['00', '05', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55'];

  const isNeutral = !value; // true se vuoto → stile sbiadito, nessun rimontaggio

  const hh    = value ? value.split(':')[0] : '09';
  const mmRaw = value ? value.split(':')[1] : '00';
  const mm    = minuti.includes(mmRaw) ? mmRaw : '00';

  function onOraChange(nuovaOra) {
    onChange(`${nuovaOra}:${mm}`);
  }

  function onMinutoChange(nuovoMinuto) {
    onChange(`${hh}:${nuovoMinuto}`);
  }

  return (
    <div className="wtp-root">
      {label && <span className="wtp-label">{label}</span>}
      <div className={`wtp-columns${isNeutral ? ' wtp-is-neutral' : ''}`}>
        {/* Le WheelColumn sono SEMPRE montate — nessun ramo condizionale */}
        <WheelColumn
          items={ore}
          value={hh}
          onChange={onOraChange}
          dimmed={isNeutral}
        />
        <div className="wc-sep">:</div>
        <WheelColumn
          items={minuti}
          value={mm}
          onChange={onMinutoChange}
          dimmed={isNeutral}
        />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────
// DualWheelPicker — Inizio e Fine affiancati
// ─────────────────────────────────────────────────────
export function DualWheelPicker({ startTime, onStartChange, endTime, onEndChange }) {
  return (
    <div className="dwp-root">
      <div className="dwp-slot">
        <WheelTimePicker
          value={startTime}
          onChange={onStartChange}
          label="Inizio"
        />
      </div>
      <div className="dwp-divider" />
      <div className="dwp-slot">
        <WheelTimePicker
          value={endTime}
          onChange={onEndChange}
          label="Fine"
        />
      </div>
    </div>
  );
}

export default WheelTimePicker;
