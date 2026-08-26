import { Mail, ShieldCheck, Lock, FileText } from 'lucide-react';
import { TextHoverEffect, FooterBackgroundGradient } from '@/components/ui/hover-footer';
import { useApp } from '@/components/providers/app-provider';

const LEGAL_LINKS = [
  { label: 'Privacy Policy', href: '#privacy' },
  { label: 'Terms of Use',   href: '#terms'   },
  { label: 'Cookie Policy',  href: '#cookies' },
];

export function Footer() {
  const year = new Date().getFullYear();
  const { theme } = useApp();
  const isDark = theme === 'dark';

  return (
    <footer
      className="relative overflow-hidden border-t"
      style={{
        borderColor: isDark ? 'var(--dline)' : 'var(--line)',
        background: isDark ? '#141310' : 'transparent',
        paddingBottom: 'calc(24px + env(safe-area-inset-bottom))',
      }}
    >

      {/* ── Main footer content ── */}
      <div className="relative z-10 mx-auto max-w-[1600px] px-6 pt-14 pb-4">

        <div className="grid grid-cols-1 gap-10 md:grid-cols-3 pb-12">

          {/* Brand */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <span style={{
                width: 32, height: 32, borderRadius: 9,
                background: '#ff4d1f', display: 'grid', placeItems: 'center',
                flexShrink: 0,
              }}>
                <svg style={{ width: 16, height: 16, fill: '#fff' }} viewBox="0 0 24 24">
                  <path d="M13 2 4 14h6l-1 8 9-12h-6z"/>
                </svg>
              </span>
              <span style={{ fontSize: 18, fontWeight: 800, letterSpacing: '-.02em' }}>
                Nova AI
              </span>
            </div>
            <p style={{ fontSize: 13.5, color: 'var(--mut)', lineHeight: 1.7, maxWidth: 280 }}>
              One workspace for images, video, voice and conversation.
              Powered by the world's best AI models.
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--ok)', flexShrink: 0 }} />
              <span style={{ fontSize: 11, fontFamily: 'var(--mono)', color: 'var(--mut)', letterSpacing: '.06em' }}>
                ALL SYSTEMS OPERATIONAL
              </span>
            </div>
          </div>

          {/* Legal */}
          <div className="flex flex-col gap-4">
            <h4 style={{ fontSize: 13, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--mut)' }}>
              Legal
            </h4>
            <ul style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {LEGAL_LINKS.map(link => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: 7,
                      fontSize: 13.5, color: 'var(--mut)', textDecoration: 'none',
                      transition: 'color .15s',
                    }}
                    onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.color = 'var(--ink)'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.color = 'var(--mut)'; }}
                  >
                    <FileText style={{ width: 14, height: 14, flexShrink: 0 }} />
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div className="flex flex-col gap-4">
            <h4 style={{ fontSize: 13, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--mut)' }}>
              Contact
            </h4>
            <a
              href="mailto:joogamil63@gmail.com"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                fontSize: 13.5, color: 'var(--mut)', textDecoration: 'none',
                transition: 'color .15s',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.color = '#ff4d1f'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.color = 'var(--mut)'; }}
            >
              <Mail style={{ width: 15, height: 15, flexShrink: 0 }} />
              joogamil63@gmail.com
            </a>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11.5, color: 'var(--mut)' }}>
                <Lock style={{ width: 12, height: 12 }} />
                SSL Secured
              </span>
              <span style={{ width: 1, height: 12, background: 'var(--line2)' }} />
              <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11.5, color: 'var(--mut)' }}>
                <ShieldCheck style={{ width: 12, height: 12 }} />
                Data Protected
              </span>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: 'var(--line)', margin: '0 0 16px' }} />

        {/* Bottom bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
          <p style={{ fontSize: 11.5, color: 'var(--mut)', fontFamily: 'var(--mono)' }}>
            © {year} Nova AI. All rights reserved.
          </p>
          <p style={{ fontSize: 11.5, color: 'var(--mut)', fontFamily: 'var(--mono)' }}>
            Powered by AI · Free to use
          </p>
        </div>
      </div>

      {/* ── Text hover effect ── */}
      <div className="relative z-10 flex px-4" style={{ height: 80, marginTop: 8, marginBottom: 16 }}>
        <TextHoverEffect text="NOVA AI" />
      </div>

      {/* ── Background gradient ── */}
      <FooterBackgroundGradient />
    </footer>
  );
}
