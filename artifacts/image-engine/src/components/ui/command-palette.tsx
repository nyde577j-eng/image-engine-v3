import { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { useApp } from '@/components/providers/app-provider';
import type { ViewId } from '@/lib/types';

/* ── Context ─────────────────────────────────────────────────────── */
interface PaletteCtx {
  open: () => void;
  close: () => void;
}
const Ctx = createContext<PaletteCtx>({ open: () => {}, close: () => {} });
export const useCommandPalette = () => useContext(Ctx);

/* ── Commands ─────────────────────────────────────────────────────── */
const CMDS: { label: string; view: ViewId; cat: string }[] = [
  { label: 'Studio Home',         view: 'home',        cat: 'NAV' },
  { label: 'Generate image',      view: 'generate',    cat: 'CREATE' },
  { label: 'Open editor',         view: 'editor',      cat: 'CREATE' },
  { label: 'Browse gallery',      view: 'gallery',     cat: 'LIBRARY' },
  { label: 'Open collections',    view: 'collections', cat: 'LIBRARY' },
  { label: 'View history',        view: 'history',     cat: 'LIBRARY' },
  { label: 'Chat with engine',    view: 'chat',        cat: 'AI' },
  { label: 'Synthesize voice',    view: 'tts',         cat: 'AI' },
  { label: 'Create video',        view: 'videos',      cat: 'AI' },
  { label: 'Run workflows',       view: 'workflows',   cat: 'AI' },
  { label: 'Browse models',       view: 'models',      cat: 'AI' },
  { label: 'API console',         view: 'api',         cat: 'SYSTEM' },
  { label: 'Settings',            view: 'settings',    cat: 'SYSTEM' },
  { label: 'Admin control center',view: 'admin',       cat: 'SYSTEM' },
];

/* ── Provider + Component ─────────────────────────────────────────── */
export function CommandPalette() {
  const [visible, setVisible] = useState(false);
  const [query, setQuery] = useState('');
  const [sel, setSel] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const { setActiveView } = useApp();

  const openPalette = useCallback(() => {
    setVisible(true);
    setQuery('');
    setSel(0);
    setTimeout(() => inputRef.current?.focus(), 60);
  }, []);

  const closePalette = useCallback(() => setVisible(false), []);

  const filtered = CMDS.filter(c => c.label.toLowerCase().includes(query.toLowerCase()));

  const go = useCallback((idx: number) => {
    const cmd = filtered[idx];
    if (!cmd) return;
    closePalette();
    setActiveView(cmd.view);
  }, [filtered, closePalette, setActiveView]);

  // Global keyboard shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        openPalette();
      }
      if (e.key === 'Escape') closePalette();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [openPalette, closePalette]);

  return (
    <Ctx.Provider value={{ open: openPalette, close: closePalette }}>
      {visible && (
        <>
          {/* Scrim */}
          <div
            onClick={closePalette}
            style={{
              position: 'fixed', inset: 0,
              background: 'rgba(20,19,16,.5)',
              backdropFilter: 'blur(4px)',
              zIndex: 110,
            }}
          />

          {/* Palette */}
          <div
            role="dialog"
            aria-label="Command palette"
            style={{
              position: 'fixed',
              top: '9vh',
              left: '50%',
              translate: '-50% 0',
              width: 'min(620px, calc(100vw - 32px))',
              zIndex: 120,
              background: 'var(--card)',
              border: '1px solid var(--line2)',
              borderRadius: 20,
              boxShadow: '0 40px 100px rgba(0,0,0,.18)',
              overflow: 'hidden',
            }}
          >
            {/* Search bar */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '16px 18px', borderBottom: '1px solid var(--line)',
            }}>
              <svg style={{ width:20,height:20,flex:'none',stroke:'var(--mut)',fill:'none',strokeWidth:1.8 }} viewBox="0 0 24 24">
                <circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/>
              </svg>
              <input
                ref={inputRef}
                value={query}
                onChange={e => { setQuery(e.target.value); setSel(0); }}
                onKeyDown={e => {
                  if (e.key === 'ArrowDown') { setSel(s => Math.min(filtered.length - 1, s + 1)); e.preventDefault(); }
                  if (e.key === 'ArrowUp')   { setSel(s => Math.max(0, s - 1)); e.preventDefault(); }
                  if (e.key === 'Enter')     { go(sel); e.preventDefault(); }
                }}
                placeholder="Type a command or destination…"
                style={{
                  flex: 1, border: 0, background: 'none',
                  fontFamily: 'var(--ui)', fontSize: 15, color: 'var(--ink)',
                  outline: 'none',
                }}
              />
            </div>

            {/* Results */}
            <div style={{ maxHeight: 320, overflow: 'auto', padding: 8 }}>
              {filtered.length === 0 ? (
                <div style={{ padding: '18px', color: 'var(--mut)', fontSize: 13.5 }}>
                  Nothing matches.
                </div>
              ) : (
                filtered.map((cmd, i) => (
                  <button
                    key={cmd.view}
                    onClick={() => go(i)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 12,
                      width: '100%', padding: '11px 12px',
                      border: 0,
                      borderRadius: 12,
                      background: i === sel ? 'var(--accsoft)' : 'none',
                      color: i === sel ? 'var(--acc2)' : 'var(--ink)',
                      fontFamily: 'var(--ui)', fontSize: 14,
                      textAlign: 'left', cursor: 'pointer',
                      transition: '.12s',
                    }}
                    onMouseEnter={() => setSel(i)}
                  >
                    <span style={{ flex: 1 }}>{cmd.label}</span>
                    <span className="mic">{cmd.cat}</span>
                  </button>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </Ctx.Provider>
  );
}
