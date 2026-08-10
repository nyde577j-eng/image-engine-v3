import { AppProvider, useApp } from '@/components/providers/app-provider';
import { AdminAuthProvider } from '@/components/providers/admin-auth-provider';
import { Rail } from './rail';
import { TopBar } from './topbar';
import { ViewRouter } from '@/components/views/view-router';
import { CommandPalette } from '@/components/ui/command-palette';
import { MobileBottomBar } from './mobile-bottom-bar';

function ShellContent() {
  const { activeView } = useApp();

  return (
    <div
      style={{ display: 'grid', gridTemplateColumns: '68px 1fr', minHeight: '100vh', position: 'relative', zIndex: 1 }}
    >
      {/* ── Rail (desktop) ── */}
      <Rail />

      {/* ── Main column ── */}
      <div style={{ minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        <TopBar />
        <main style={{ flex: 1, overflow: 'hidden' }}>
          <ViewRouter />
        </main>
      </div>

      {/* ── Mobile bottom bar ── */}
      <MobileBottomBar />

      {/* ── Command Palette (global) ── */}
      <CommandPalette />
    </div>
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
