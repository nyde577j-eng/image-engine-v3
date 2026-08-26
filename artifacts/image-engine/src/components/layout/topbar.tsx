import { useApp } from '@/components/providers/app-provider';
import { useAdminAuth } from '@/components/providers/admin-auth-provider';
import { useCommandPalette } from '@/components/ui/command-palette';
import { BrandLogo } from '@/components/layout/logo';
import type { ViewId } from '@/lib/types';

const VIEW_TITLES: Record<ViewId, string> = {
  home:'Studio Home', generate:'Generate', editor:'Image Editor',
  gallery:'Gallery', history:'History', collections:'Collections',
  workflows:'Workflows', models:'Models', api:'API', chat:'Chat',
  settings:'Settings', admin:'Control Center', videos:'Videos', tts:'Voice',
};

const VIEW_TITLES_AR: Record<ViewId, string> = {
  home:'الرئيسية', generate:'توليد', editor:'المحرر',
  gallery:'المعرض', history:'السجل', collections:'المجموعات',
  workflows:'سير العمل', models:'النماذج', api:'API', chat:'الشات',
  settings:'الإعدادات', admin:'لوحة التحكم', videos:'الفيديوهات', tts:'الصوت',
};

export function TopBar() {
  const { activeView, credits, isAdmin, locale, theme, setTheme } = useApp();
  const { isAuthenticated } = useAdminAuth();
  const { open: openPalette } = useCommandPalette();

  const isAdminMode = isAdmin || isAuthenticated;
  const isRTL = locale === 'ar';
  const titles = isRTL ? VIEW_TITLES_AR : VIEW_TITLES;
  const isDark = theme === 'dark';

  return (
    <>
      <style>{`
        .topbar {
          position: sticky; top: 0; z-index: 30;
          display: flex; align-items: center; gap: 8px;
          padding: 10px 16px;
          background: color-mix(in srgb, var(--bg) 88%, transparent);
          backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);
          border-bottom: 1px solid var(--line);
          min-width: 0; overflow: hidden;
        }
        .topbar-title {
          display: flex; flex-direction: column; gap: 1px;
          min-width: 0; flex: 1;
        }
        .topbar-label {
          font-family: var(--mono); font-size: 10px;
          letter-spacing: .12em; text-transform: uppercase;
          color: var(--mut); white-space: nowrap;
          overflow: hidden; text-overflow: ellipsis;
        }
        .topbar-heading {
          font-size: clamp(15px,2vw,20px); font-weight: 700;
          letter-spacing: -.01em; line-height: 1.2;
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
          color: var(--ink);
        }
        .topbar-btn {
          display: flex; align-items: center; gap: 7px;
          border: 1px solid var(--line2); background: var(--card);
          border-radius: 10px; padding: 7px 10px;
          color: var(--mut); cursor: pointer;
          transition: .18s; font-size: 13px;
          font-family: var(--ui); flex-shrink: 0; white-space: nowrap;
        }
        .topbar-btn:hover { border-color: var(--ink); color: var(--ink); }
        .topbar-avatar {
          width: 34px; height: 34px; border-radius: 10px;
          background: var(--ink); color: var(--bg);
          display: grid; place-items: center;
          font-weight: 700; font-size: 13px;
          flex-shrink: 0; user-select: none;
        }
        @media (max-width: 640px) {
          .topbar { padding: 8px 12px; }
          .topbar-search-text { display: none !important; }
          .topbar-credits { display: none !important; }
        }
        @media (min-width: 900px) {
          .topbar { padding: 12px clamp(16px,3vw,32px); gap: 10px; }
        }
      `}</style>

      <header className="topbar">
        {/* Brand */}
        <div className="topbar-title">
          <BrandLogo size="sm" />
          <h1 className="topbar-heading">{activeView ? (titles[activeView] ?? activeView) : '404'}</h1>
        </div>

        {/* Search */}
        <button className="topbar-btn" onClick={openPalette} aria-label="Search">
          <svg style={{ width:15,height:15,fill:'none',stroke:'currentColor',strokeWidth:1.8,flexShrink:0 }} viewBox="0 0 24 24">
            <circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/>
          </svg>
          <span className="topbar-search-text">{isRTL ? 'بحث…' : 'Search…'}</span>
        </button>

        {/* Dark / Light toggle */}
        <button
          className="topbar-btn"
          onClick={() => setTheme(isDark ? 'light' : 'dark')}
          aria-label="Toggle theme"
          title={isDark ? 'Switch to light' : 'Switch to dark'}
        >
          {isDark ? (
            /* Sun icon */
            <svg style={{ width:15,height:15,fill:'none',stroke:'currentColor',strokeWidth:1.8 }} viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="4"/>
              <path d="M12 2v2M12 20v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M2 12h2M20 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
            </svg>
          ) : (
            /* Moon icon */
            <svg style={{ width:15,height:15,fill:'none',stroke:'currentColor',strokeWidth:1.8 }} viewBox="0 0 24 24">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
            </svg>
          )}
        </button>

        {/* Credits / Admin */}
        {isAdminMode ? (
          <div className="topbar-btn topbar-credits" style={{ borderColor:'#fde8e5', background:'#fde8e5', color:'var(--err)' }}>
            <svg style={{ width:13,height:13,fill:'none',stroke:'currentColor',strokeWidth:1.8 }} viewBox="0 0 24 24">
              <path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/>
            </svg>
            Admin
          </div>
        ) : (
          <div className="topbar-btn topbar-credits">
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
