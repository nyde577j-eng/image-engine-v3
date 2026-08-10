import { useState } from 'react';
import { useApp } from '@/components/providers/app-provider';
import type { ViewId } from '@/lib/types';

const BB_ITEMS = [
  {
    id: 'home' as ViewId,
    label: 'HOME',
    icon: (
      <svg style={{ width:20,height:20,fill:'none',stroke:'currentColor',strokeWidth:1.8,strokeLinecap:'round',strokeLinejoin:'round' }} viewBox="0 0 24 24">
        <path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V21h14V9.5"/>
      </svg>
    ),
  },
  {
    id: 'generate' as ViewId,
    label: 'CREATE',
    icon: (
      <svg style={{ width:20,height:20,fill:'none',stroke:'currentColor',strokeWidth:1.8,strokeLinecap:'round',strokeLinejoin:'round' }} viewBox="0 0 24 24">
        <path d="M12 3l2 5 5 2-5 2-2 5-2-5-5-2 5-2z"/>
        <path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8z"/>
      </svg>
    ),
  },
  {
    id: 'gallery' as ViewId,
    label: 'GALLERY',
    icon: (
      <svg style={{ width:20,height:20,fill:'none',stroke:'currentColor',strokeWidth:1.8,strokeLinecap:'round',strokeLinejoin:'round' }} viewBox="0 0 24 24">
        <rect x="3" y="3" width="7" height="7" rx="1.5"/>
        <rect x="14" y="3" width="7" height="7" rx="1.5"/>
        <rect x="3" y="14" width="7" height="7" rx="1.5"/>
        <rect x="14" y="14" width="7" height="7" rx="1.5"/>
      </svg>
    ),
  },
  {
    id: 'chat' as ViewId,
    label: 'CHAT',
    icon: (
      <svg style={{ width:20,height:20,fill:'none',stroke:'currentColor',strokeWidth:1.8,strokeLinecap:'round',strokeLinejoin:'round' }} viewBox="0 0 24 24">
        <path d="M21 11.5a8.5 8.5 0 0 1-8.5 8.5c-1.5 0-3-.4-4.2-1.1L3 20l1.1-5.3A8.5 8.5 0 1 1 21 11.5z"/>
      </svg>
    ),
  },
];

const MORE_ITEMS: { id: ViewId; label: string }[] = [
  { id: 'generate',    label: 'Generate' },
  { id: 'editor',      label: 'Editor' },
  { id: 'collections', label: 'Collections' },
  { id: 'history',     label: 'History' },
  { id: 'models',      label: 'Models' },
  { id: 'workflows',   label: 'Workflows' },
  { id: 'videos',      label: 'Videos' },
  { id: 'tts',         label: 'Voice' },
  { id: 'api',         label: 'API' },
  { id: 'settings',    label: 'Settings' },
  { id: 'admin',       label: 'Admin' },
];

export function MobileBottomBar() {
  const { activeView, setActiveView } = useApp();
  const [sheetOpen, setSheetOpen] = useState(false);

  return (
    <>
      {/* Bottom bar */}
      <nav
        aria-label="Mobile navigation"
        style={{
          position: 'fixed', left: 0, right: 0, bottom: 0,
          zIndex: 85,
          background: 'var(--dark)',
          borderTop: '1px solid var(--dline)',
          padding: '8px 10px calc(8px + env(safe-area-inset-bottom))',
          display: 'none',
          justifyContent: 'space-around',
        }}
        className="mobile-bbar"
      >
        {BB_ITEMS.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveView(item.id)}
            style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              gap: 3, border: 0, background: 'none',
              color: activeView === item.id ? 'var(--acc)' : 'var(--dmut)',
              fontFamily: 'var(--mono)', fontSize: 9, letterSpacing: '.08em',
              padding: '6px 12px', borderRadius: 10, cursor: 'pointer',
            }}
          >
            {item.icon}
            {item.label}
          </button>
        ))}

        {/* More button */}
        <button
          onClick={() => setSheetOpen(true)}
          style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            gap: 3, border: 0, background: 'none',
            color: 'var(--dmut)',
            fontFamily: 'var(--mono)', fontSize: 9, letterSpacing: '.08em',
            padding: '6px 12px', borderRadius: 10, cursor: 'pointer',
          }}
        >
          <svg style={{ width:20,height:20,fill:'none',stroke:'currentColor',strokeWidth:1.8 }} viewBox="0 0 24 24">
            <circle cx="5" cy="12" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="19" cy="12" r="1.6"/>
          </svg>
          MORE
        </button>
      </nav>

      {/* Bottom sheet (more) */}
      {sheetOpen && (
        <>
          {/* Scrim */}
          <div
            onClick={() => setSheetOpen(false)}
            style={{
              position: 'fixed', inset: 0,
              background: 'rgba(20,19,16,.5)',
              backdropFilter: 'blur(4px)',
              zIndex: 199,
            }}
          />
          {/* Sheet */}
          <div
            role="dialog"
            aria-label="All modules"
            style={{
              position: 'fixed', left: 0, right: 0, bottom: 0,
              zIndex: 200, background: 'var(--card)',
              borderRadius: '24px 24px 0 0',
              borderTop: '1px solid var(--line)',
              padding: '14px 18px 26px',
              maxHeight: '76vh', overflow: 'auto',
              boxShadow: '0 -20px 60px rgba(0,0,0,.15)',
            }}
          >
            {/* Grab handle */}
            <div style={{ width:44,height:5,borderRadius:99,background:'var(--line2)',margin:'2px auto 16px' }} />
            <h3 style={{ fontSize:16,fontWeight:700,marginBottom:14 }}>All modules</h3>
            <div style={{ display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:10 }}>
              {MORE_ITEMS.map((item) => (
                <button
                  key={item.id}
                  onClick={() => { setActiveView(item.id); setSheetOpen(false); }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    border: '1px solid var(--line)', borderRadius: 14,
                    background: 'var(--panel)', padding: '13px 14px',
                    fontFamily: 'var(--ui)', fontSize: 14, cursor: 'pointer',
                    color: 'var(--ink)', textAlign: 'left',
                  }}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Show bbar only on mobile */}
      <style>{`
        @media (max-width: 899px) {
          .mobile-bbar { display: flex !important; }
        }
      `}</style>
    </>
  );
}
