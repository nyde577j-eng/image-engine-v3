import { useApp } from '@/components/providers/app-provider';
import { useAdminAuth } from '@/components/providers/admin-auth-provider';
import type { ViewId } from '@/lib/types';

interface NavItem {
  id: ViewId;
  tip: string;
  icon: React.ReactNode;
  adm?: boolean;
}

/* ── All nav items in one flat list with optional dividers ────────── */
const NAV: (NavItem | 'div')[] = [
  { id: 'home',        tip: 'STUDIO HOME', icon: <svg style={IC} viewBox="0 0 24 24"><path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V21h14V9.5"/></svg> },
  { id: 'generate',    tip: 'GENERATE',    icon: <svg style={IC} viewBox="0 0 24 24"><path d="M12 3l2 5 5 2-5 2-2 5-2-5-5-2 5-2z"/><path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8z"/></svg> },
  { id: 'editor',      tip: 'EDITOR',      icon: <svg style={IC} viewBox="0 0 24 24"><path d="M4 20l4-1L19 8l-3-3L5 16z"/><path d="M13 6l3 3"/></svg> },
  'div',
  { id: 'gallery',     tip: 'GALLERY',     icon: <svg style={IC} viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg> },
  { id: 'collections', tip: 'COLLECTIONS', icon: <svg style={IC} viewBox="0 0 24 24"><path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg> },
  { id: 'history',     tip: 'HISTORY',     icon: <svg style={IC} viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg> },
  'div',
  { id: 'models',      tip: 'MODELS',      icon: <svg style={IC} viewBox="0 0 24 24"><rect x="7" y="7" width="10" height="10" rx="2"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M7 2v3M17 2v3M7 19v3M17 19v3M2 7h3M2 17h3M19 7h3M19 17h3"/></svg> },
  { id: 'chat',        tip: 'CHAT',        icon: <svg style={IC} viewBox="0 0 24 24"><path d="M21 11.5a8.5 8.5 0 0 1-8.5 8.5c-1.5 0-3-.4-4.2-1.1L3 20l1.1-5.3A8.5 8.5 0 1 1 21 11.5z"/></svg> },
  { id: 'workflows',   tip: 'WORKFLOWS',   icon: <svg style={IC} viewBox="0 0 24 24"><circle cx="5" cy="6" r="2"/><circle cx="19" cy="6" r="2"/><circle cx="12" cy="18" r="2"/><path d="M7 6h10M6 8l4.5 8M18 8l-4.5 8"/></svg> },
  'div',
  { id: 'videos',      tip: 'VIDEOS',      icon: <svg style={IC} viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M7 5v14M17 5v14M3 10h4M3 14h4M17 10h4M17 14h4"/></svg> },
  { id: 'tts',         tip: 'VOICE',       icon: <svg style={IC} viewBox="0 0 24 24"><path d="M4 10v4M8 7v10M12 4v16M16 7v10M20 10v4"/></svg> },
  'div',
  { id: 'api',         tip: 'API',         icon: <svg style={IC} viewBox="0 0 24 24"><path d="M8 8l-5 4 5 4M16 8l5 4-5 4"/></svg> },
  { id: 'settings',    tip: 'SETTINGS',    icon: <svg style={IC} viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M19.1 4.9 17 7M7 17l-2.1 2.1"/></svg> },
  { id: 'admin',       tip: 'ADMIN', adm: true, icon: <svg style={IC} viewBox="0 0 24 24"><path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/></svg> },
];

/* icon style constant — defined before use */
const IC: React.CSSProperties = {
  width: 20, height: 20,
  fill: 'none', stroke: 'currentColor',
  strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round',
  flexShrink: 0,
} as const;

const LogoMark = ({ onClick }: { onClick: () => void }) => (
  <button onClick={onClick}
    style={{ width:40, height:40, borderRadius:12, background:'#ff4d1f', color:'#fff', display:'grid', placeItems:'center', marginBottom:8, flexShrink:0, border:'none', cursor:'pointer', boxShadow:'0 6px 18px rgba(255,77,31,.4)' }}
    title="Studio Home">
    <svg style={{ width:22,height:22,fill:'currentColor' }} viewBox="0 0 24 24">
      <path d="M13 2 4 14h6l-1 8 9-12h-6z"/>
    </svg>
  </button>
);

export function Rail() {
  const { activeView, setActiveView } = useApp();
  const { isAuthenticated } = useAdminAuth();

  return (
    <aside
      aria-label="Primary navigation"
      className="rail-sidebar"
      style={{
        position: 'sticky',
        top: 0,
        height: '100vh',
        width: 68,
        background: '#141310',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        /* ↓ scrollable so no item is hidden */
        overflowY: 'auto',
        overflowX: 'hidden',
        padding: '14px 0 14px',
        gap: 4,
        zIndex: 40,
        scrollbarWidth: 'none',   /* Firefox */
      }}
    >
      <LogoMark onClick={() => setActiveView('home')} />

      {NAV.map((item, i) => {
        if (item === 'div') {
          return <div key={`div-${i}`} style={{ width:26, height:1, background:'#2e2b24', margin:'6px 0', flexShrink:0 }} />;
        }

        const navItem = item as NavItem;
        const active  = activeView === navItem.id;
        const isAdm   = navItem.adm;
        const color   = active && isAdm
          ? '#d33a2c'
          : active
          ? '#ff4d1f'
          : '#938f83';

        return (
          <button
            key={navItem.id}
            data-tip={navItem.tip}
            onClick={() => setActiveView(navItem.id)}
            aria-label={navItem.tip}
            className="rbtn"
            style={{
              color,
              background: active ? '#1c1a16' : 'transparent',
              boxShadow: active ? 'inset 0 0 0 1px #2e2b24' : 'none',
              flexShrink: 0,
            }}
          >
            {navItem.icon}
          </button>
        );
      })}

      <style>{`
        /* Hide scrollbar track on WebKit */
        .rail-sidebar::-webkit-scrollbar { display: none; }

        /* Hide on mobile — MobileBottomBar handles navigation */
        @media (max-width: 899px) {
          .rail-sidebar { display: none !important; }
        }
      `}</style>
    </aside>
  );
}
