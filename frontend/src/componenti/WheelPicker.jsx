// =====================================================
// WheelPicker.jsx — Selettore Orario a Rotella
// =====================================================
// Versione 2: compatta (3 voci visibili), tema chiaro,
// doppio picker affiancato (Inizio | Fine), ora fine
// con stato neutro "--:--" finché l'utente non scorre.
// =====================================================

import React, { useRef, useEffect, useCallback } from 'react';
import './WheelPicker.css';

const ITEM_HEIGHT  = 36;  // px per ogni voce
const VISIBLE_ITEMS = 3;  // voci visibili (sempre dispari)

// ─────────────────────────────────────────────────────
// WheelColumn — singola colonna scorrevole
// ─────────────────────────────────────────────────────
function WheelColumn({ items, value, onChange, neutral = false }) {
  const containerRef  = useRef(null);
  const isDragging    = useRef(false);
  const startY        = useRef(0);
  const startScroll   = useRef(0);
  const scrollTimer   = useRef(null);

  const padding = Math.floor(VISIBLE_ITEMS / 2); // = 1 per VISIBLE_ITEMS=3

  const scrollToIndex = useCallback((index, behavior = 'smooth') => {
    if (!containerRef.current) return;
    containerRef.current.scrollTo({ top: index * ITEM_HEIGHT, behavior });
  }, []);

  // Posizione iniziale
  useEffect(() => {
    if (neutral) return; // se neutro non scrolliamo
    const idx = items.indexOf(value);
    if (idx >= 0) scrollToIndex(idx, 'instant');
  }, []); // eslint-disable-line

  // Aggiorna quando value cambia dall'esterno
  useEffect(() => {
    if (neutral) return;
    const idx = items.indexOf(value);
    if (idx >= 0) scrollToIndex(idx, 'smooth');
  }, [value, neutral, scrollToIndex, items]);

  function snapToNearest() {
    if (!containerRef.current) return;
    const scrollTop  = containerRef.current.scrollTop;
    const newIndex   = Math.round(scrollTop / ITEM_HEIGHT);
    const clamped    = Math.max(0, Math.min(newIndex, items.length - 1));
    onChange(items[clamped]);
    scrollToIndex(clamped, 'smooth');
  }

  // ── Scroll nativo ──
  function onScroll() {
    clearTimeout(scrollTimer.current);
    scrollTimer.current = setTimeout(snapToNearest, 100);
  }

  // ── Drag mouse ──
  function onMouseDown(e) {
    isDragging.current = true;
    startY.current     = e.clientY;
    startScroll.current = containerRef.current.scrollTop;
    e.preventDefault();
  }

  function onMouseMove(e) {
    if (!isDragging.current) return;
    containerRef.current.scrollTop = startScroll.current + (startY.current - e.clientY);
  }

  function onMouseUp() {
    if (!isDragging.current) return;
    isDragging.current = false;
    snapToNearest();
  }

  // ── Touch ──
  function onTouchStart(e) {
    startY.current     = e.touches[0].clientY;
    startScroll.current = containerRef.current.scrollTop;
  }

  function onTouchMove(e) {
    containerRef.current.scrollTop = startScroll.current + (startY.current - e.touches[0].clientY);
  }

  function onTouchEnd() { snapToNearest(); }

  return (
    <div className="wc-wrapper">
      {/* Indicatore selezione centrale */}
      <div className="wc-indicator" />

      <div
        ref={containerRef}
        className="wc-scroll"
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
        {/* Padding top */}
        {Array.from({ length: padding }).map((_, i) => (
          <div key={`t${i}`} className="wc-item wc-pad" />
        ))}

        {items.map((item) => (
          <div
            key={item}
            className={`wc-item ${!neutral && item === value ? 'wc-selected' : ''}`}
            onClick={() => { onChange(item); scrollToIndex(items.indexOf(item)); }}
          >
            {item}
          </div>
        ))}

        {/* Padding bottom */}
        {Array.from({ length: padding }).map((_, i) => (
          <div key={`b${i}`} className="wc-item wc-pad" />
        ))}
      </div>

      {/* Maschere sfumatura chiare */}
      <div className="wc-fade wc-fade-top" />
      <div className="wc-fade wc-fade-bottom" />
    </div>
  );
}

// ─────────────────────────────────────────────────────
// WheelTimePicker — singolo orologio HH:mm
//   value   : "HH:mm" | "" (stringa vuota = neutro)
//   onChange: (val: string | "") => void
//   label   : string
//   neutral : bool — se true, mostra "--:--" inizialmente
// ─────────────────────────────────────────────────────
export function WheelTimePicker({ value, onChange, label, neutral = false }) {
  const ore    = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
  const minuti = ['00', '05', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55'];

  const isNeutral = neutral && !value;

  // Estrae ore/minuti dal value, con fallback sicuro
  const hh = value ? value.split(':')[0] : '09';
  const mmRaw = value ? value.split(':')[1] : '00';
  const mm = minuti.includes(mmRaw) ? mmRaw : '00';

  function onOraChange(nuovaOra) {
    onChange(`${nuovaOra}:${mm}`);
  }

  function onMinutoChange(nuovoMinuto) {
    onChange(`${hh}:${nuovoMinuto}`);
  }

  // Quando l'utente interagisce con un picker neutro, attiva con un default
  function onNeutralInteract(tipo) {
    return (val) => {
      if (tipo === 'ora')    onChange(`${val}:00`);
      if (tipo === 'minuto') onChange(`${hh}:${val}`);
    };
  }

  return (
    <div className="wtp-root">
      {label && <span className="wtp-label">{label}</span>}
      <div className={`wtp-columns ${isNeutral ? 'wtp-neutral' : ''}`}>
        {isNeutral ? (
          // Mostra "--:--" e aspetta interazione
          <>
            <WheelColumn items={ore}    value="09" onChange={onNeutralInteract('ora')}    neutral />
            <div className="wc-sep">:</div>
            <WheelColumn items={minuti} value="00" onChange={onNeutralInteract('minuto')} neutral />
          </>
        ) : (
          <>
            <WheelColumn items={ore}    value={hh} onChange={onOraChange}    />
            <div className="wc-sep">:</div>
            <WheelColumn items={minuti} value={mm} onChange={onMinutoChange} />
          </>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────
// DualWheelPicker — Inizio e Fine affiancati
//   startTime  : "HH:mm"       onChange per start
//   endTime    : "HH:mm" | ""  onChange per end (neutro se "")
// ─────────────────────────────────────────────────────
export function DualWheelPicker({ startTime, onStartChange, endTime, onEndChange }) {
  return (
    <div className="dwp-root">
      <div className="dwp-slot">
        <WheelTimePicker
          value={startTime}
          onChange={onStartChange}
          label="Inizio"
          neutral={false}
        />
      </div>
      <div className="dwp-divider" />
      <div className="dwp-slot">
        <WheelTimePicker
          value={endTime}
          onChange={onEndChange}
          label="Fine"
          neutral
        />
      </div>
    </div>
  );
}

export default WheelTimePicker;
