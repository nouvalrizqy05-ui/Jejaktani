import { useEffect, useRef, useState } from 'react';
import { Accessibility, Contrast, Minus, Plus, RotateCcw, X } from 'lucide-react';
import { cn } from '../utils.js';

const CONTRAST_KEY = 'jejaktani.a11y.contrast';
const FONT_KEY = 'jejaktani.a11y.font';

const FONT_ORDER = ['sm', 'base', 'lg'];

function applyContrast(on) {
  document.documentElement.classList.toggle('a11y-contrast', on);
}

function applyFont(size) {
  const el = document.documentElement;
  el.classList.toggle('a11y-small-text', size === 'sm');
  el.classList.toggle('a11y-large-text', size === 'lg');
}

export default function AccessibilityMenu() {
  const [open, setOpen] = useState(false);
  const [contrast, setContrast] = useState(false);
  const [font, setFont] = useState('base');
  const panelRef = useRef(null);

  useEffect(() => {
    const savedContrast = localStorage.getItem(CONTRAST_KEY) === '1';
    const savedFont = localStorage.getItem(FONT_KEY) || 'base';
    const validatedFont = FONT_ORDER.includes(savedFont) ? savedFont : 'base';
    
    setContrast(savedContrast);
    setFont(validatedFont);
    applyContrast(savedContrast);
    applyFont(validatedFont);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  function toggleContrast() {
    const next = !contrast;
    setContrast(next);
    applyContrast(next);
    localStorage.setItem(CONTRAST_KEY, next ? '1' : '0');
  }

  function setFontSize(size) {
    setFont(size);
    applyFont(size);
    localStorage.setItem(FONT_KEY, size);
  }

  function stepFont(dir) {
    const idx = FONT_ORDER.indexOf(font);
    const nextIdx = Math.min(FONT_ORDER.length - 1, Math.max(0, idx + dir));
    setFontSize(FONT_ORDER[nextIdx]);
  }

  function reset() {
    setContrast(false);
    applyContrast(false);
    setFontSize('base');
    localStorage.setItem(CONTRAST_KEY, '0');
  }

  return (
    <div className="fixed bottom-24 md:bottom-5 right-5 z-[1000] print:hidden flex flex-col items-end">
      {open && (
        <div
          ref={panelRef}
          role="dialog"
          aria-label="Pengaturan aksesibilitas"
          className="mb-3 w-64 rounded-2xl border border-stone-200 bg-white p-4 shadow-xl"
        >
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-stone-900">Aksesibilitas</h2>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="flex h-7 w-7 items-center justify-center rounded-full text-stone-500 hover:bg-stone-100 hover:text-stone-900 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* High contrast */}
          <button
            type="button"
            onClick={toggleContrast}
            aria-pressed={contrast}
            className={cn(
              "mb-3 flex w-full items-center justify-between rounded-xl border px-3 py-2 text-sm transition-colors",
              contrast
                ? "border-teal-700 bg-teal-700 text-white"
                : "border-stone-200 bg-stone-50 text-stone-900 hover:bg-stone-100"
            )}
          >
            <span className="flex items-center gap-2">
              <Contrast className="h-4 w-4" />
              Kontras tinggi
            </span>
            <span className="text-xs font-medium">{contrast ? 'Aktif' : 'Mati'}</span>
          </button>

          {/* Font size */}
          <div className="mb-3">
            <div className="mb-1.5 text-xs font-medium text-stone-500">Ukuran teks</div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => stepFont(-1)}
                disabled={font === 'sm'}
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-stone-200 text-stone-700 transition-colors hover:bg-stone-100 disabled:opacity-40"
              >
                <Minus className="h-4 w-4" />
              </button>
              <span className="flex-1 text-center text-sm font-medium">
                {font === 'sm' ? 'Kecil' : font === 'lg' ? 'Besar' : 'Normal'}
              </span>
              <button
                type="button"
                onClick={() => stepFont(1)}
                disabled={font === 'lg'}
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-stone-200 text-stone-700 transition-colors hover:bg-stone-100 disabled:opacity-40"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>

          <button
            type="button"
            onClick={reset}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-stone-200 px-3 py-2 text-sm text-stone-500 transition-colors hover:bg-stone-100 hover:text-stone-900"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reset
          </button>
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label="Buka menu aksesibilitas"
        className="flex h-12 w-12 items-center justify-center rounded-full bg-teal-600 text-white shadow-lg hover:shadow-xl transition-all hover:scale-105"
      >
        <Accessibility className="h-6 w-6" />
      </button>
    </div>
  );
}
