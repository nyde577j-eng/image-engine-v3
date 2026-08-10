import { AppProvider } from '@/components/providers/app-provider';
import { AdminAuthProvider } from '@/components/providers/admin-auth-provider';
import { Rail } from './rail';
import { TopBar } from './topbar';
import { ViewRouter } from '@/components/views/view-router';
import { CommandPalette } from '@/components/ui/command-palette';
import { MobileBottomBar } from './mobile-bottom-bar';

function ShellContent() {
  return (
    <>
      {/* ── Global layout styles ── */}
      <style>{`
        /* Reset any overflow that breaks mobile */
        html, body, #root { overflow-x: hidden; }

        /* App shell: rail + main */
        .app-shell {
          display: grid;
          grid-template-columns: 68px 1fr;
          min-height: 100vh;
          min-height: 100dvh;
          position: relative;
          z-index: 1;
        }

        /* On mobile: single column, rail hidden */
        @media (max-width: 899px) {
          .app-shell {
            grid-template-columns: 1fr;
          }
          /* extra bottom padding so content clears the bottom nav */
          .app-main-content {
            padding-bottom: env(safe-area-inset-bottom);
          }
        }
      `}</style>

      <div className="app-shell">
        {/* Rail — hidden on mobile via its own CSS */}
        <Rail />

        {/* Main column */}
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

      {/* Mobile bottom bar — renders outside grid so it's always on top */}
      <MobileBottomBar />

      {/* Command Palette — portal-like, always on top */}
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
