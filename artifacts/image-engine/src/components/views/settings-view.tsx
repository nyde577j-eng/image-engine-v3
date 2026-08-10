import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Bell, Shield, CreditCard, LifeBuoy, BookOpen, Globe, Check,
  Loader2, ExternalLink, Lock, Database, Monitor, Ban, Zap,
  Sparkles, Pencil, Images, SlidersHorizontal, Languages,
  Globe2, Mail, Phone, Linkedin,
} from 'lucide-react';
import { SiTelegram, SiFacebook, SiX, SiInstagram, SiYoutube, SiDiscord } from 'react-icons/si';
import { PageContainer, PageHeader } from './shared';
import { useApp } from '@/components/providers/app-provider';
import { t } from '@/lib/i18n';
import { supabase } from '@/lib/supabase';

const SECTIONS = [
  { id: 'notifications', label: 'Notifications',  icon: Bell },
  { id: 'security',      label: 'Security',        icon: Shield },
  { id: 'billing',       label: 'Billing',         icon: CreditCard },
  { id: 'support',       label: 'Support',         icon: LifeBuoy },
  { id: 'docs',          label: 'Docs',            icon: BookOpen },
  { id: 'language',      label: 'Language',        icon: Globe },
] as const;
type Sec = typeof SECTIONS[number]['id'];

const SOCIAL_ICONS: Record<string, React.ComponentType<{ className?: string; size?: number }>> = {
  telegram: SiTelegram, facebook: SiFacebook, twitter: SiX, x: SiX,
  instagram: SiInstagram, youtube: SiYoutube, email: Mail, mail: Mail,
  website: Globe2, linkedin: Linkedin, discord: SiDiscord, phone: Phone,
};

function SocialIcon({ icon }: { icon: string }) {
  const key = icon.toLowerCase().replace(/[^a-z]/g, '');
  const Icon = SOCIAL_ICONS[key] ?? Globe2;
  return <Icon className="h-5 w-5 shrink-0" style={{ color: 'var(--acc)' }} size={20} />;
}

function Toggle({ label, desc, checked, onChange }: { label: string; desc: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '13px 0', borderBottom: '1px dashed var(--line)' }}>
      <div>
        <b style={{ fontSize: 14, fontWeight: 500, display: 'block' }}>{label}</b>
        <span style={{ fontSize: 12.5, color: 'var(--mut)' }}>{desc}</span>
      </div>
      <label className="ie-sw">
        <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} />
        <i />
      </label>
    </div>
  );
}

function RowLine({ label, desc, right }: { label: string; desc?: string; right: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14, padding: '13px 0', borderBottom: '1px dashed var(--line)' }}>
      <div>
        <b style={{ fontSize: 14, fontWeight: 500, display: 'block' }}>{label}</b>
        {desc && <span style={{ fontSize: 12.5, color: 'var(--mut)' }}>{desc}</span>}
      </div>
      {right}
    </div>
  );
}

export function SettingsView({ initialSection }: { initialSection?: string }) {
  const { locale, setLocale, credits, settingsSection, setSettingsSection } = useApp();
  const [section, setSection] = useState<Sec>((initialSection as Sec) ?? 'notifications');
  const [supportLinks, setSupportLinks] = useState<{ id: string; label: string; url: string; icon: string }[]>([]);
  const [notifs, setNotifs] = useState({ generationComplete: true, modelUpdates: true, creditAlerts: false, productNews: false });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    supabase.from('support_links').select('*').order('sort_order').then(({ data }) => { if (data) setSupportLinks(data); });
  }, []);

  useEffect(() => {
    if (initialSection) setSection(initialSection as Sec);
  }, [initialSection]);

  useEffect(() => {
    if (settingsSection) { setSection(settingsSection as Sec); setSettingsSection(''); }
  }, [settingsSection, setSettingsSection]);

  const saveNotifs = async () => {
    setSaving(true);
    const key = window.localStorage.getItem('ie_user_key') ?? 'anon';
    await supabase.from('user_settings').upsert({ user_key: key, notifications: notifs, updated_at: new Date().toISOString() }, { onConflict: 'user_key' });
    setSaving(false); setSaved(true); setTimeout(() => setSaved(false), 2000);
  };

  return (
    <PageContainer>
      <PageHeader title={t(locale, 'settings.title')} description={t(locale, 'settings.description')} />

      <div style={{ display: 'grid', gridTemplateColumns: '230px 1fr', gap: 18, alignItems: 'start', marginTop: 6 }} className="settings-layout">

        {/* Side nav */}
        <nav style={{ display: 'flex', flexDirection: 'column', gap: 4, position: 'sticky', top: 86 }}>
          {SECTIONS.map(s => {
            const Icon = s.icon;
            const on = section === s.id;
            return (
              <button key={s.id} onClick={() => setSection(s.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  border: 0, borderRadius: 10,
                  background: on ? 'var(--ink)' : 'none',
                  color: on ? 'var(--bg)' : 'var(--mut)',
                  padding: '10px 12px', fontFamily: 'var(--ui)', fontSize: 13.5, cursor: 'pointer', transition: '.15s', textAlign: 'left',
                }}
                onMouseEnter={e => { if (!on) { e.currentTarget.style.background = 'var(--card)'; e.currentTarget.style.color = 'var(--ink)'; } }}
                onMouseLeave={e => { if (!on) { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'var(--mut)'; } }}
              >
                <Icon style={{ width: 16, height: 16, flexShrink: 0 }} />
                {s.label}
              </button>
            );
          })}
        </nav>

        {/* Panel */}
        <motion.div key={section} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .2 }}
          className="ie-card" style={{ padding: 22 }}>

          {section === 'notifications' && (
            <div>
              <h3 style={{ fontSize: 17, fontWeight: 700, marginBottom: 4 }}>Notifications</h3>
              <p style={{ color: 'var(--mut)', fontSize: 13.5, marginBottom: 18 }}>Choose what reaches you.</p>
              <Toggle label="Batch finished" desc="When a generation completes" checked={notifs.generationComplete} onChange={v => setNotifs(p => ({ ...p, generationComplete: v }))} />
              <Toggle label="Model updates" desc="New model releases" checked={notifs.modelUpdates} onChange={v => setNotifs(p => ({ ...p, modelUpdates: v }))} />
              <Toggle label="Credit alerts" desc="Low balance warnings" checked={notifs.creditAlerts} onChange={v => setNotifs(p => ({ ...p, creditAlerts: v }))} />
              <Toggle label="Product news" desc="Feature announcements" checked={notifs.productNews} onChange={v => setNotifs(p => ({ ...p, productNews: v }))} />
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 16 }}>
                <button className="btn ink sm" onClick={saveNotifs} disabled={saving}>
                  {saving ? <Loader2 style={{ width: 14, height: 14, animation: 'spin 1s linear infinite' }} /> : null}
                  Save Preferences
                </button>
                {saved && <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--ok)' }}><Check style={{ width: 14, height: 14 }} />Saved</span>}
              </div>
            </div>
          )}

          {section === 'security' && (
            <div>
              <h3 style={{ fontSize: 17, fontWeight: 700, marginBottom: 4 }}>Security</h3>
              <p style={{ color: 'var(--mut)', fontSize: 13.5, marginBottom: 18 }}>Your session and data protection details.</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: '#e2f6ec', borderRadius: 12, padding: '14px 16px', marginBottom: 16 }}>
                <Shield style={{ width: 20, height: 20, color: 'var(--ok)', flexShrink: 0 }} />
                <div>
                  <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--ok)' }}>Session is secure</p>
                  <p style={{ fontSize: 11.5, color: 'var(--mut)' }}>All data encrypted over HTTPS / TLS 1.3</p>
                </div>
              </div>
              {[
                { icon: Lock, t: 'End-to-End Encryption', d: 'All images transmitted over HTTPS with TLS 1.3.' },
                { icon: Database, t: 'No Permanent Storage', d: 'Preferences saved only in your browser.' },
                { icon: Ban, t: 'No Tracking', d: 'No advertising trackers or data sales.' },
                { icon: Zap, t: 'Secure API Connections', d: 'API keys never exposed to the browser.' },
                { icon: Monitor, t: 'Browser Security', d: 'Keep your browser updated for best security.' },
              ].map(item => (
                <div key={item.t} style={{ display: 'flex', gap: 14, padding: '12px 0', borderBottom: '1px dashed var(--line)' }}>
                  <item.icon style={{ width: 18, height: 18, color: 'var(--acc)', flexShrink: 0, marginTop: 2 }} />
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 500 }}>{item.t}</p>
                    <p style={{ fontSize: 12, color: 'var(--mut)', marginTop: 2 }}>{item.d}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {section === 'billing' && (
            <div>
              <h3 style={{ fontSize: 17, fontWeight: 700, marginBottom: 4 }}>Billing</h3>
              <p style={{ color: 'var(--mut)', fontSize: 13.5, marginBottom: 18 }}>Plan and credit balance.</p>
              <RowLine label="Studio Pro" desc="$29/mo · active" right={<span className="ie-tag ok">active</span>} />
              <RowLine label="Credits" desc={`${credits} remaining`}
                right={<button className="btn ghost sm">Top up</button>} />
              <RowLine label="Next renewal" desc="Aug 15" right={null} />
            </div>
          )}

          {section === 'support' && (
            <div>
              <h3 style={{ fontSize: 17, fontWeight: 700, marginBottom: 4 }}>Support</h3>
              <p style={{ color: 'var(--mut)', fontSize: 13.5, marginBottom: 18 }}>Reach us through any channel below.</p>
              {supportLinks.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--mut)', border: '1.5px dashed var(--line2)', borderRadius: 12 }}>
                  <LifeBuoy style={{ width: 32, height: 32, opacity: .3, margin: '0 auto 8px' }} />
                  <p style={{ fontSize: 13 }}>No support links yet</p>
                </div>
              ) : supportLinks.map(link => (
                <a key={link.id} href={link.url} target="_blank" rel="noopener noreferrer"
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', border: '1px solid var(--line)', borderRadius: 12, background: 'var(--panel)', marginBottom: 8, textDecoration: 'none', color: 'var(--ink)', transition: '.15s' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--acc)'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--line)'; }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <SocialIcon icon={link.icon} />
                    <span style={{ fontSize: 14, fontWeight: 500 }}>{link.label}</span>
                  </div>
                  <ExternalLink style={{ width: 14, height: 14, color: 'var(--mut)' }} />
                </a>
              ))}
            </div>
          )}

          {section === 'docs' && (
            <div>
              <h3 style={{ fontSize: 17, fontWeight: 700, marginBottom: 4 }}>Documentation</h3>
              <p style={{ color: 'var(--mut)', fontSize: 13.5, marginBottom: 18 }}>Get the most out of Image Engine.</p>
              {[
                { icon: Sparkles, t: 'Generate Images', d: 'Go to Generate, write a detailed prompt, choose your settings, then press Generate.' },
                { icon: Pencil,   t: 'Edit Images',     d: 'Go to Editor, upload an image, describe the change, then press Apply Edit.' },
                { icon: Zap,      t: 'Credits System',  d: 'Each visitor starts with credits. Each generation/edit deducts a set amount.' },
                { icon: Images,   t: 'Gallery',         d: 'All generated images are saved in Gallery for download and reuse.' },
                { icon: SlidersHorizontal, t: 'Advanced Settings', d: 'In Generate, expand Advanced controls to tune steps, CFG, scheduler.' },
                { icon: Languages, t: 'Language', d: 'Switch interface language in Settings → Language.' },
              ].map(item => (
                <div key={item.t} style={{ display: 'flex', gap: 14, padding: '12px 0', borderBottom: '1px dashed var(--line)' }}>
                  <item.icon style={{ width: 18, height: 18, color: 'var(--acc)', flexShrink: 0, marginTop: 2 }} />
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 500 }}>{item.t}</p>
                    <p style={{ fontSize: 12, color: 'var(--mut)', marginTop: 2 }}>{item.d}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {section === 'language' && (
            <div>
              <h3 style={{ fontSize: 17, fontWeight: 700, marginBottom: 4 }}>Language</h3>
              <p style={{ color: 'var(--mut)', fontSize: 13.5, marginBottom: 18 }}>Choose the interface language.</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                {(['en', 'ar'] as const).map(lang => (
                  <button key={lang} onClick={() => setLocale(lang)}
                    style={{
                      borderRadius: 14, border: locale === lang ? '1px solid rgba(255,77,31,.4)' : '1px solid var(--line2)',
                      padding: '16px 20px', background: locale === lang ? 'var(--accsoft)' : 'var(--card)',
                      color: locale === lang ? 'var(--acc2)' : 'var(--mut)',
                      fontFamily: 'var(--ui)', fontSize: 14, fontWeight: 500, cursor: 'pointer', transition: '.15s',
                      display: 'flex', alignItems: 'center', gap: 10,
                    }}>
                    {locale === lang && <Check style={{ width: 16, height: 16 }} />}
                    {lang === 'en' ? '🇺🇸 English' : '🇸🇦 العربية'}
                  </button>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      </div>

      <style>{`
        @keyframes spin{to{transform:rotate(360deg)}}
        @media(max-width:900px){
          .settings-layout{ grid-template-columns:1fr !important; }
          .settings-layout nav{ flex-direction:row; overflow-x:auto; position:static !important; padding-bottom:6px; }
        }
      `}</style>
    </PageContainer>
  );
}
