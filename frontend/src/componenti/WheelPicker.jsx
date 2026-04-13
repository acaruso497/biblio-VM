// =====================================================
// WheelPicker.jsx — Selettore Orario a Rotella
// =====================================================
// Componente per selezionare l'ora (HH:mm) tramite
// interfaccia scroll/touch, senza digitazione testuale.
// =====================================================

import React, { useRef, useEffect, useCallback } from 'react';
import './WheelPicker.css';

const ITEM_HEIGHT = 44; // px per ogni voce della rotella
const VISIBLE_ITEMS = 5; // quante voci visibili (must be odd)

function WheelColumn({ items, value, onChange }) {
  const containerRef = useRef(null);
  const isDragging = useRef(false);
  const startY = useRef(0);
  const startScrollTop = useRef(0);

  const selectedIndex = items.indexOf(value);

  // Scroll alla voce selezionata senza animazione
  const scrollToIndex = useCallback((index, behavior = 'smooth') => {
    if (containerRef.current) {
      containerRef.current.scrollTo({
        top: index * ITEM_HEIGHT,
        behavior,
      });
    }
  }, []);

  // Inizializza posizione
  useEffect(() => {
    const idx = items.indexOf(value);
    if (idx >= 0) scrollToIndex(idx, 'instant');
  }, []); // eslint-disable-line

  // Aggiorna quando il valore cambia esternamente
  useEffect(() => {
    const idx = items.indexOf(value);
    if (idx >= 0) scrollToIndex(idx, 'smooth');
  }, [value, scrollToIndex, items]);

  // Calcola l'indice più vicino al centro dopo uno scroll
  function handleScrollEnd() {
    if (!containerRef.current) return;
    const scrollTop = containerRef.current.scrollTop;
    const newIndex = Math.round(scrollTop / ITEM_HEIGHT);
    const clampedIndex = Math.max(0, Math.min(newIndex, items.length - 1));
    onChange(items[clampedIndex]);
    scrollToIndex(clampedIndex, 'smooth');
  }

  // Gestione touch/mouse drag
  function onPointerDown(e) {
    isDragging.current = true;
    startY.current = e.type === 'touchstart' ? e.touches[0].clientY : e.clientY;
    startScrollTop.current = containerRef.current.scrollTop;
  }

  function onPointerMove(e) {
    if (!isDragging.current) return;
    const clientY = e.type === 'touchmove' ? e.touches[0].clientY : e.clientY;
    const delta = startY.current - clientY;
    containerRef.current.scrollTop = startScrollTop.current + delta;
  }

  function onPointerUp() {
    isDragging.current = false;
    handleScrollEnd();
  }

  // Gestione scroll nativo
  let scrollTimer = useRef(null);
  function onScroll() {
    clearTimeout(scrollTimer.current);
    scrollTimer.current = setTimeout(handleScrollEnd, 120);
  }

  const paddingItems = Math.floor(VISIBLE_ITEMS / 2);

  return (
    <div className="wheel-column-wrapper">
      {/* Indicatore di selezione (linee centrali) */}
      <div className="wheel-selection-indicator" />

      <div
        ref={containerRef}
        className="wheel-column"
        style={{ height: `${ITEM_HEIGHT * VISIBLE_ITEMS}px` }}
        onScroll={onScroll}
        onMouseDown={onPointerDown}
        onMouseMove={onPointerMove}
        onMouseUp={onPointerUp}
        onMouseLeave={onPointerUp}
        onTouchStart={onPointerDown}
        onTouchMove={onPointerMove}
        onTouchEnd={onPointerUp}
      >
        {/* Padding superiore */}
        {Array.from({ length: paddingItems }).map((_, i) => (
          <div key={`top-${i}`} className="wheel-item wheel-item-padding" />
        ))}

        {/* Voci reali */}
        {items.map((item) => (
          <div
            key={item}
            className={`wheel-item ${item === value ? 'wheel-item-selected' : ''}`}
            onClick={() => {
              onChange(item);
              scrollToIndex(items.indexOf(item));
            }}
          >
            {item}
          </div>
        ))}

        {/* Padding inferiore */}
        {Array.from({ length: paddingItems }).map((_, i) => (
          <div key={`bot-${i}`} className="wheel-item wheel-item-padding" />
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────
// Componente principale WheelTimePicker
// Props:
//   value    : string "HH:mm" o ""
//   onChange : (newValue: string) => void
//   label    : string (etichetta)
// ─────────────────────────────────────────────────────
function WheelTimePicker({ value, onChange, label }) {
  const ore = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
  const minuti = ['00', '05', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55'];

  const [hh, mm] = value ? value.split(':') : ['09', '00'];

  // Arrotonda i minuti al multiplo di 5 più vicino
  const mmArrotondato = minuti.includes(mm) ? mm : minuti.reduce((prev, curr) =>
    Math.abs(parseInt(curr) - parseInt(mm)) < Math.abs(parseInt(prev) - parseInt(mm)) ? curr : prev
  );

  function handleOraChange(nuovaOra) {
    onChange(`${nuovaOra}:${mmArrotondato}`);
  }

  function handleMinutoChange(nuovoMinuto) {
    onChange(`${hh}:${nuovoMinuto}`);
  }

  return (
    <div className="wheel-time-picker">
      {label && <div className="wheel-time-label">{label}</div>}
      <div className="wheel-time-columns">
        <WheelColumn items={ore} value={hh} onChange={handleOraChange} />
        <div className="wheel-separator">:</div>
        <WheelColumn items={minuti} value={mmArrotondato} onChange={handleMinutoChange} />
      </div>
    </div>
  );
}

export default WheelTimePicker;
