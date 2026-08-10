
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield,
  Workflow,
  FileText,
  SlidersHorizontal,
  ListOrdered,
  HardDrive,
  Users,
  ScrollText,
  ShieldCheck,
  LogOut,
  Wand2,
  Zap,
  LifeBuoy,
  Megaphone,
  MessageSquare,
  Image as ImageIcon,
  Film,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { AdminPageContainer } from './shared';
import { AdminTemplatesPage } from './pages/templates-page';
import { AdminGenerationSettingsPage } from './pages/gen-settings-page';
import { AdminQueuePage } from './pages/queue-page';
import { AdminStoragePage } from './pages/storage-page';
import { AdminUsersPage } from './pages/users-page';
import { AdminLogsPage } from './pages/logs-page';
import { AdminLoginPage } from './admin-login-page';
import { useAdminAuth } from '@/components/providers/admin-auth-provider';
import { useApp } from '@/components/providers/app-provider';
import { AdminImageEditorPage } from './pages/image-editor-page';
import { AdminCreditsPage } from './pages/credits-page';
import { AdminSupportPage } from './pages/support-page';
import { AdminBannerPage } from './pages/banner-page';
import { AdminChatProvidersPage } from './pages/chat-providers-page';
import { AdminImageProvidersPage } from './pages/image-providers-page';
import { AdminVideoSyncPage } from './pages/video-sync-page';
import { TtsKeysPage } from './pages/tts-keys-page';

export type AdminSubPage =
  | 'image-providers'
  | 'chat-providers'
  | 'templates'
  | 'gen-settings'
  | 'queue'
  | 'storage'
  | 'users'
  | 'logs'
  | 'image-editor'
  | 'credits'
  | 'support'
  | 'banner'
  | 'video-sync'
  | 'tts-keys';

const SUB_PAGES: {
  id: AdminSubPage;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
}[] = [
  { id: 'image-providers', label: 'Image Providers', icon: ImageIcon,        description: 'Manage image generation models & API keys' },
  { id: 'chat-providers',  label: 'Chat Providers',  icon: MessageSquare,    description: 'Manage AI chat models & API keys' },
  { id: 'video-sync',      label: 'Video Sync',      icon: Film,             description: 'مزامنة وإدارة فيديوهات Facebook' },
  { id: 'tts-keys',        label: 'TTS Keys',        icon: Workflow,         description: 'إدارة Fish Audio API Keys لنظام Text-to-Speech' },
  { id: 'image-editor',    label: 'Image Editor',    icon: Wand2,            description: 'Enable/disable AI image editing feature' },
  { id: 'credits',         label: 'Credits',         icon: Zap,              description: 'Visitor credits & cost per operation' },
  { id: 'banner',          label: 'Banner',          icon: Megaphone,        description: 'Announcement bar shown at the top of the site' },
  { id: 'support',         label: 'Support Links',   icon: LifeBuoy,         description: 'Manage support & social links shown to users' },
  { id: 'templates',       label: 'Prompt Templates',icon: FileText,         description: 'Reusable prompt library' },
  { id: 'gen-settings',    label: 'Generation Settings', icon: SlidersHorizontal, description: 'Global generation defaults' },
  { id: 'queue',           label: 'Queue Manager',   icon: ListOrdered,      description: 'Real-time generation queue' },
  { id: 'storage',         label: 'Storage',         icon: HardDrive,        description: 'Generated image library' },
  { id: 'users',           label: 'User Management', icon: Users,            description: 'Roles and permissions' },
  { id: 'logs',            label: 'System Logs',     icon: ScrollText,       description: 'API, generation, and error logs' },
];

export function AdminView() {
  const { isAuthenticated, username, logout } = useAdminAuth();
  const { setActiveView } = useApp();
  const [subPage, setSubPage] = useState<AdminSubPage>('image-providers');

  if (!isAuthenticated) {
    return <AdminLoginPage />;
  }

  const current = SUB_PAGES.find((p) => p.id === subPage)!;

  return (
    <div style={{ maxWidth: 1600, margin: '0 auto', padding: 'clamp(16px,3vw,30px)', paddingBottom: 50 }}>

      {/* ── Admin header ── */}
      <div className="ie-admhead" style={{ marginBottom: 18 }}>
        <div style={{ width: 42, height: 42, borderRadius: 12, background: 'var(--err)', display: 'grid', placeItems: 'center', color: '#fff', flexShrink: 0 }}>
          <ShieldCheck style={{ width: 20, height: 20 }} />
        </div>
        <div>
          <span className="mic d" style={{ display: 'block' }}>RESTRICTED · OPERATORS ONLY</span>
          <h2 style={{ fontSize: 19, fontWeight: 700, letterSpacing: '-.01em' }}>Control Center</h2>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <span className="ie-tag ok">env: production</span>
          <span className="ie-tag dim">v2.4</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6, border: '1px solid var(--dline)', borderRadius: 10, padding: '6px 10px', fontSize: 12, fontFamily: 'var(--mono)', color: 'var(--dmut)' }}>
            <Shield style={{ width: 14, height: 14 }} />{username ?? 'admin'}
          </span>
          <button onClick={() => { logout(); setActiveView('generate'); }}
            style={{ display: 'flex', alignItems: 'center', gap: 6, border: '1px solid rgba(211,58,44,.4)', borderRadius: 10, padding: '6px 10px', fontSize: 12, color: 'var(--err)', background: 'none', cursor: 'pointer', fontFamily: 'var(--ui)' }}>
            <LogOut style={{ width: 14, height: 14 }} /> Sign Out
          </button>
        </div>
      </div>

      {/* ── Sub-navigation (tabs) ── */}
      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 8, marginBottom: 16, scrollbarWidth: 'thin' }}>
        {SUB_PAGES.map((p) => {
          const Icon = p.icon;
          const active = subPage === p.id;
          return (
            <button
              key={p.id}
              onClick={() => setSubPage(p.id)}
              style={{
                position: 'relative', display: 'flex', alignItems: 'center', gap: 6,
                flexShrink: 0, padding: '7px 14px', borderRadius: 999,
                border: active ? '1px solid var(--ink)' : '1px solid var(--line2)',
                background: active ? 'var(--ink)' : 'var(--card)',
                color: active ? 'var(--bg)' : 'var(--mut)',
                fontFamily: 'var(--ui)', fontSize: 13, fontWeight: active ? 500 : 400,
                cursor: 'pointer', transition: '.15s', whiteSpace: 'nowrap',
              }}
            >
              <Icon className="h-3.5 w-3.5 shrink-0" />
              {p.label}
            </button>
          );
        })}
      </div>

      {/* ── Content ── */}
      <div style={{ marginTop: 6 }}>
        <AnimatePresence mode="wait">
          <AdminPageContainer key={subPage}>
            {subPage === 'image-providers' && <AdminImageProvidersPage />}
            {subPage === 'chat-providers'  && <AdminChatProvidersPage />}
            {subPage === 'video-sync'      && <AdminVideoSyncPage />}
            {subPage === 'tts-keys'        && <TtsKeysPage />}
            {subPage === 'templates'       && <AdminTemplatesPage />}
            {subPage === 'gen-settings'    && <AdminGenerationSettingsPage />}
            {subPage === 'queue'           && <AdminQueuePage />}
            {subPage === 'storage'         && <AdminStoragePage />}
            {subPage === 'users'           && <AdminUsersPage />}
            {subPage === 'logs'            && <AdminLogsPage />}
            {subPage === 'image-editor'    && <AdminImageEditorPage />}
            {subPage === 'credits'         && <AdminCreditsPage />}
            {subPage === 'banner'          && <AdminBannerPage />}
            {subPage === 'support'         && <AdminSupportPage />}
          </AdminPageContainer>
        </AnimatePresence>
      </div>
    </div>
  );
}
