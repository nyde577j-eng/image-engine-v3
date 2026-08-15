import { useEffect } from 'react';
import { AppProvider, useApp } from '@/components/providers/app-provider';
import { AdminAuthProvider } from '@/components/providers/admin-auth-provider';
import { Rail } from './rail';
import { TopBar } from './topbar';
import { ViewRouter } from '@/components/views/view-router';
import { CommandPalette } from '@/components/ui/command-palette';
import { MobileBottomBar } from './mobile-bottom-bar';
import { AnnouncementBar } from './announcement-bar';

function ShellContent() {
  const { locale, theme } = useApp();

  /* ── Apply RTL + lang + dark class on every locale/theme change ── */
  useEffect(() => {
    const html = document.documentElement;
    html.setAttribute('lang', locale);
    html.setAttribute('dir', locale === 'ar' ? 'rtl' : 'ltr');
    if (theme === 'dark') {
      html.classList.add('dark');
    } else {
      html.classList.remove('dark');
    }
  }, [locale, theme]);

  return (
    <>
      <style>{`
        html, body, #root { overflow-x: hidden; }

        /* ── Dark mode CSS variables ── */
        html.dark {
          --bg:     #141310;
          --panel:  #1c1a16;
          --card:   #1e1c18;
          --ink:    #f4f2ea;
          --mut:    #938f83;
          --line:   #2e2b24;
          --line2:  #3a3730;
          --accsoft: rgba(255,77,31,.18);

          /* Tailwind semantic tokens — dark overrides */
          --background:         24 6% 8%;
          --foreground:         40 15% 94%;
          --border:             30 8% 18%;
          --input:              30 8% 18%;
          --card-bg:            30 6% 12%;
          --card-fg:            40 15% 94%;
          --popover:            30 6% 12%;
          --muted:              30 6% 14%;
          --muted-foreground:   36 8% 57%;
          --accent:             17 100% 56%;
          --accent-foreground:  0 0% 100%;
          --secondary:          30 6% 16%;
          --secondary-foreground: 40 15% 94%;
          --popover-foreground: 40 15% 94%;
        }
        html.dark body { background: var(--bg); color: var(--ink); }

        /* Dark mode — Tailwind @theme inline bridge */
        html.dark {
          color-scheme: dark;
        }

        /* ── RTL layout fixes ── */
        html[dir="rtl"] .topbar-title { text-align: right; }
        html[dir="rtl"] .rail-sidebar { right: 0; left: auto; }
        html[dir="rtl"] .app-shell    { direction: rtl; }
        html[dir="rtl"] .rbtn::after  {
          left: auto;
          right: calc(100% + 12px);
          translate: 0 -50%;
        }

        /* ── Shell grid ── */
        .app-shell {
          display: grid;
          grid-template-columns: 68px 1fr;
          min-height: 100vh;
          min-height: 100dvh;
          position: relative;
          z-index: 1;
        }
        @media (max-width: 899px) {
          .app-shell { grid-template-columns: 1fr; }
          .app-main-content { padding-bottom: env(safe-area-inset-bottom); }
        }
      `}</style>

      {/* ── Announcement banner (top of everything) ── */}
      <AnnouncementBar />

      <div className="app-shell">
        <Rail />
        <div
          className="app-main-content"
          style={{ minWidth: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
        >
          <TopBar />
          <main style={{ flex: 1 }}>
            <ViewRouter />
          </main>
        </div>
      </div>

      <MobileBottomBar />
      <CommandPalette />
    </>
  );
}

export function AppShell() {
  return (
    <AppProvider>
      <AdminAuthProvider>
        <ShellContent />
      </AdminAuthProvider>
    </AppProvider>
  );
}
