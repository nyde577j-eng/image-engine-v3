import { useState } from 'react';
import { Search, Zap } from 'lucide-react';
import { useApp } from '@/components/providers/app-provider';
import { useAdminAuth } from '@/components/providers/admin-auth-provider';
import { useCommandPalette } from '@/components/ui/command-palette';
import type { ViewId } from '@/lib/types';

const VIEW_TITLES: Record<ViewId, string> = {
  home:        'Studio Home',
  generate:    'Image Generation',
  editor:      'Image Editor',
  gallery:     'Gallery',
  history:     'History',
  collections: 'Collections',
  workflows:   'Workflows',
  models:      'Models',
  api:         'API',
  chat:        'Assistant Chat',
  settings:    'Settings',
  admin:       'Control Center',
  videos:      'Videos',
  tts:         'Text to Speech',
};

export function TopBar() {
  const { activeView, credits, isAdmin } = useApp();
  const { isAuthenticated } = useAdminAuth();
  const { open: openPalette } = useCommandPalette();

  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 30,
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        padding: '14px clamp(16px,3vw,32px)',
        background: 'color-mix(in srgb, var(--bg) 82%, transparent)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        borderBottom: '1px solid var(--line)',
      }}
    >
      {/* Breadcrumb */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 1, minWidth: 0 }}>
        <span className="mic" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          IMAGE ENGINE
          {(isAdmin || isAuthenticated) && (
            <span style={{
              background: 'var(--err)', color: '#fff',
              padding: '2px 7px', borderRadius: 5, fontSize: 9.5,
              fontFamily: 'var(--mono)', letterSpacing: '.12em', textTransform: 'uppercase',
            }}>
              CONTROL CENTER
            </span>
          )}
        </span>
        <h1 style={{ fontSize: 'clamp(17px,2.2vw,21px)', fontWeight: 700, letterSpacing: '-.01em', lineHeight: 1.2 }}>
          {VIEW_TITLES[activeView] ?? activeView}
        </h1>
      </div>

      {/* Spacer */}
      <div style={{ flex: 1 }} />

      {/* Search / Palette button */}
      <button
        onClick={openPalette}
        style={{
          display: 'flex', alignItems: 'center', gap: 10,
          border: '1px solid var(--line2)', background: 'var(--card)',
          borderRadius: 12, padding: '9px 12px', color: 'var(--mut)',
          cursor: 'pointer', transition: '.18s', fontSize: 14,
          fontFamily: 'var(--ui)',
        }}
        onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--ink)'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--ink)'; }}
        onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--line2)'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--mut)'; }}
        aria-label="Open command palette"
      >
        <Search style={{ width: 16, height: 16 }} />
        <span className="hide-sm">Search or jump to…</span>
        <kbd style={{
          fontFamily: 'var(--mono)', fontSize: 10.5,
          border: '1px solid var(--line2)', borderRadius: 6,
          padding: '2px 6px', background: 'var(--panel)',
          display: 'none',
        }} className="show-lg">⌘K</kbd>
      </button>

      {/* Credits / Admin badge */}
      {isAdmin || isAuthenticated ? (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          fontFamily: 'var(--mono)', fontSize: 12,
          border: '1px solid #fde8e5', background: '#fde8e5',
          borderRadius: 12, padding: '9px 12px', color: 'var(--err)',
        }}>
          <svg style={{ width:16,height:16,fill:'none',stroke:'currentColor',strokeWidth:1.8 }} viewBox="0 0 24 24">
            <path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/>
          </svg>
          Admin
        </div>
      ) : (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          fontFamily: 'var(--mono)', fontSize: 12,
          border: '1px solid var(--line2)', background: 'var(--card)',
          borderRadius: 12, padding: '9px 12px',
        }} className="hide-sm">
          <svg style={{ width:16,height:16,fill:'none',stroke:'var(--acc)',strokeWidth:1.8 }} viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="8"/><path d="M12 7v10M15 9.5c-1-1-5-1-5 1s5 1.5 5 3.5-4 2-5 1"/>
          </svg>
          {credits.toLocaleString()}
        </div>
      )}

      {/* Avatar */}
      <div style={{
        width: 38, height: 38, borderRadius: 12,
        background: 'var(--ink)', color: 'var(--bg)',
        display: 'grid', placeItems: 'center',
        fontWeight: 700, fontSize: 13, flexShrink: 0,
        userSelect: 'none',
      }}>
        S
      </div>

      {/* Inline responsive overrides */}
      <style>{`
        @media (max-width: 640px) {
          .hide-sm { display: none !important; }
        }
        @media (min-width: 900px) {
          .show-lg { display: inline !important; }
        }
      `}</style>
    </header>
  );
}

// Keep for backward compat
export const _SettingsIcon = null;
