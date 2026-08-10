import { useApp } from '@/components/providers/app-provider';
import { useAdminAuth } from '@/components/providers/admin-auth-provider';
import { useCommandPalette } from '@/components/ui/command-palette';
import type { ViewId } from '@/lib/types';

const VIEW_TITLES: Record<ViewId, string> = {
  home:        'Studio Home',
  generate:    'Generate',
  editor:      'Image Editor',
  gallery:     'Gallery',
  history:     'History',
  collections: 'Collections',
  workflows:   'Workflows',
  models:      'Models',
  api:         'API',
  chat:        'Chat',
  settings:    'Settings',
  admin:       'Control Center',
  videos:      'Videos',
  tts:         'Voice',
};

export function TopBar() {
  const { activeView, credits, isAdmin } = useApp();
  const { isAuthenticated } = useAdminAuth();
  const { open: openPalette } = useCommandPalette();

  const isAdminMode = isAdmin || isAuthenticated;

  return (
    <>
      <style>{`
        .topbar {
          position: sticky;
          top: 0;
          z-index: 30;
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 16px;
          background: color-mix(in srgb, var(--bg) 88%, transparent);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border-bottom: 1px solid var(--line);
          min-width: 0;
          overflow: hidden;
        }

        .topbar-title {
          display: flex;
          flex-direction: column;
          gap: 1px;
          min-width: 0;
          flex: 1;
        }

        .topbar-label {
          font-family: var(--mono);
          font-size: 10px;
          letter-spacing: .14em;
          text-transform: uppercase;
          color: var(--mut);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .topbar-heading {
          font-size: clamp(15px, 2vw, 20px);
          font-weight: 700;
          letter-spacing: -.01em;
          line-height: 1.2;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .topbar-search {
          display: flex;
          align-items: center;
          gap: 8px;
          border: 1px solid var(--line2);
          background: var(--card);
          border-radius: 10px;
          padding: 7px 11px;
          color: var(--mut);
          cursor: pointer;
          transition: .18s;
          font-size: 13px;
          font-family: var(--ui);
          flex-shrink: 0;
          white-space: nowrap;
        }
        .topbar-search:hover {
          border-color: var(--ink);
          color: var(--ink);
        }

        .topbar-credits {
          display: flex;
          align-items: center;
          gap: 6px;
          font-family: var(--mono);
          font-size: 11px;
          border: 1px solid var(--line2);
          background: var(--card);
          border-radius: 10px;
          padding: 7px 10px;
          flex-shrink: 0;
          white-space: nowrap;
        }

        .topbar-admin-badge {
          display: flex;
          align-items: center;
          gap: 6px;
          font-family: var(--mono);
          font-size: 11px;
          border: 1px solid #fde8e5;
          background: #fde8e5;
          border-radius: 10px;
          padding: 7px 10px;
          color: var(--err);
          flex-shrink: 0;
          white-space: nowrap;
        }

        .topbar-avatar {
          width: 34px;
          height: 34px;
          border-radius: 10px;
          background: var(--ink);
          color: var(--bg);
          display: grid;
          place-items: center;
          font-weight: 700;
          font-size: 13px;
          flex-shrink: 0;
          user-select: none;
        }

        /* Mobile: hide search text, credits; show only icon */
        @media (max-width: 640px) {
          .topbar { padding: 8px 12px; gap: 8px; }
          .topbar-search-text { display: none; }
          .topbar-credits { display: none; }
          .topbar-search { padding: 7px 9px; }
        }

        /* Large: show keyboard shortcut */
        @media (min-width: 900px) {
          .topbar { padding: 12px clamp(16px,3vw,32px); }
          .topbar-kbd { display: inline !important; }
        }
      `}</style>

      <header className="topbar">
        {/* Title */}
        <div className="topbar-title">
          <span className="topbar-label">
            IMAGE ENGINE
            {isAdminMode && (
              <span style={{
                marginLeft: 6,
                background: 'var(--err)', color: '#fff',
                padding: '2px 6px', borderRadius: 4,
                fontSize: 9, letterSpacing: '.1em',
              }}>
                ADMIN
              </span>
            )}
          </span>
          <h1 className="topbar-heading">
            {VIEW_TITLES[activeView] ?? activeView}
          </h1>
        </div>

        {/* Search */}
        <button className="topbar-search" onClick={openPalette} aria-label="Search">
          <svg style={{ width:15,height:15,fill:'none',stroke:'currentColor',strokeWidth:1.8,flexShrink:0 }} viewBox="0 0 24 24">
            <circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/>
          </svg>
          <span className="topbar-search-text">Search…</span>
          <kbd className="topbar-kbd" style={{
            display: 'none',
            fontFamily: 'var(--mono)', fontSize: 10,
            border: '1px solid var(--line2)', borderRadius: 5,
            padding: '2px 5px', background: 'var(--panel)',
          }}>⌘K</kbd>
        </button>

        {/* Credits or Admin badge */}
        {isAdminMode ? (
          <div className="topbar-admin-badge">
            <svg style={{ width:14,height:14,fill:'none',stroke:'currentColor',strokeWidth:1.8 }} viewBox="0 0 24 24">
              <path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/>
            </svg>
            Admin
          </div>
        ) : (
          <div className="topbar-credits">
            <svg style={{ width:13,height:13,fill:'none',stroke:'var(--acc)',strokeWidth:1.8 }} viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="8"/>
              <path d="M12 7v10M15 9.5c-1-1-5-1-5 1s5 1.5 5 3.5-4 2-5 1"/>
            </svg>
            {credits.toLocaleString()}
          </div>
        )}

        {/* Avatar */}
        <div className="topbar-avatar">S</div>
      </header>
    </>
  );
}

export const _SettingsIcon = null;
