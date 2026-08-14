import { useState, useEffect, useRef } from 'react';
import { useApp } from '@/components/providers/app-provider';
import { SAMPLE_IMAGES } from '@/lib/mock-data';
import { ImageCarouselHero } from '@/components/ui/image-carousel-hero';

const HERO_IMAGES = [
  { id: '1', src: 'https://images.unsplash.com/photo-1684369176170-463e84248b70?auto=format&fit=crop&q=60&w=900', alt: 'AI generated art', rotation: -15 },
  { id: '2', src: 'https://plus.unsplash.com/premium_photo-1677269465314-d5d2247a0b0c?auto=format&fit=crop&q=60&w=900', alt: 'Abstract AI', rotation: -8 },
  { id: '3', src: 'https://images.unsplash.com/photo-1524673360092-e07b7ae58845?auto=format&fit=crop&q=60&w=900', alt: 'City skyline AI', rotation: 5 },
  { id: '4', src: 'https://plus.unsplash.com/premium_photo-1680610653084-6e4886519caf?auto=format&fit=crop&q=60&w=900', alt: 'Nature photography AI', rotation: 12 },
  { id: '5', src: 'https://plus.unsplash.com/premium_photo-1680608979589-e9349ed066d5?auto=format&fit=crop&q=60&w=900', alt: 'Digital art AI', rotation: -12 },
  { id: '6', src: 'https://images.unsplash.com/photo-1562575214-da9fcf59b907?auto=format&fit=crop&q=60&w=900', alt: 'Cinematic AI', rotation: 8 },
  { id: '7', src: 'https://plus.unsplash.com/premium_photo-1676637656210-390da73f4951?auto=format&fit=crop&q=60&w=900', alt: 'Futuristic AI', rotation: -5 },
  { id: '8', src: 'https://images.unsplash.com/photo-1664448003794-2d446c53dcae?auto=format&fit=crop&q=60&w=900', alt: 'Abstract composition', rotation: 10 },
];

/* ── Icon style — defined BEFORE TILES ─────────────────────────── */
const ICON_S: React.CSSProperties = {
  width: 22, height: 22,
  fill: 'none', stroke: 'var(--acc)',
  strokeWidth: 1.8,
};

/* ── Tile definitions ────────────────────────────────────────────── */
const TILES = [
  {
    id: 'generate' as const,
    num: '01', label: 'Create image',
    icon: <svg style={ICON_S} viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="9" cy="10" r="1.8"/><path d="M3 17l6-5 4 3 4-4 4 4"/></svg>,
  },
  {
    id: 'editor' as const,
    num: '02', label: 'Edit image',
    icon: <svg style={ICON_S} viewBox="0 0 24 24"><path d="M4 20l4-1L19 8l-3-3L5 16z"/><path d="M13 6l3 3"/></svg>,
  },
  {
    id: 'chat' as const,
    num: '03', label: 'Ask the engine',
    icon: <svg style={ICON_S} viewBox="0 0 24 24"><path d="M21 11.5a8.5 8.5 0 0 1-8.5 8.5c-1.5 0-3-.4-4.2-1.1L3 20l1.1-5.3A8.5 8.5 0 1 1 21 11.5z"/></svg>,
  },
  {
    id: 'videos' as const,
    num: '04', label: 'Create video',
    icon: <svg style={ICON_S} viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M7 5v14M17 5v14M3 10h4M3 14h4M17 10h4M17 14h4"/></svg>,
  },
  {
    id: 'tts' as const,
    num: '05', label: 'Generate voice',
    icon: <svg style={ICON_S} viewBox="0 0 24 24"><path d="M4 10v4M8 7v10M12 4v16M16 7v10M20 10v4"/></svg>,
  },
  {
    id: 'workflows' as const,
    num: '06', label: 'Run workflow',
    icon: <svg style={ICON_S} viewBox="0 0 24 24"><circle cx="5" cy="6" r="2"/><circle cx="19" cy="6" r="2"/><circle cx="12" cy="18" r="2"/><path d="M7 6h10M6 8l4.5 8M18 8l-4.5 8"/></svg>,
  },
];

export function HomeView() {
  const { setActiveView, setPrompt, credits, isAdmin } = useApp();
  const [promptVal, setPromptVal] = useState('');
  const [stats, setStats] = useState({ visits: 0, edits: 0, videos: 0 });
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch('/api/stats')
      .then(r => r.json())
      .then((d: any) => {
        if (d.ok) setStats({ visits: d.visits, edits: d.edits, videos: d.videos });
      })
      .catch(() => {});
  }, []);

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    if (promptVal.trim()) setPrompt(promptVal.trim());
    setActiveView('generate');
  };

  return (
    <div style={{ padding: 'clamp(16px,3vw,30px)', paddingBottom: 110, maxWidth: 1460, margin: '0 auto' }}>

      {/* ── Carousel Hero ── */}
      <ImageCarouselHero
        title="Make something unreal."
        description="One workspace for images, video, voice and conversation. Describe it — the engine handles the rest."
        ctaText="Start Editing Images"
        onCtaClick={() => setActiveView('editor')}
        images={HERO_IMAGES}
        features={[
          { title: 'Multiple Providers', description: 'Gemini, DALL·E, Stability AI, fal.ai and more.' },
          { title: 'Fast Generation', description: 'Turn ideas into images in seconds.' },
          { title: 'Full Workflow', description: 'Generate, edit, upscale — all in one place.' },
        ]}
      />

      {/* Command bar */}
      <form onSubmit={handleGenerate} style={{
        display: 'flex', gap: 10, alignItems: 'center',
        background: 'var(--dark)', border: '1px solid var(--dline)',
        borderRadius: 18, padding: '10px 10px 10px 20px',
        maxWidth: 760, boxShadow: '0 20px 50px rgba(20,19,16,.18)',
      }}>
        <svg style={{ width:20,height:20,flexShrink:0,stroke:'var(--acc)',fill:'none',strokeWidth:1.8 }} viewBox="0 0 24 24">
          <path d="M12 3l2 5 5 2-5 2-2 5-2-5-5-2 5-2z"/>
          <path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8z"/>
        </svg>
        <input
          ref={inputRef}
          value={promptVal}
          onChange={e => setPromptVal(e.target.value)}
          placeholder="A crystal city above the clouds at golden hour…"
          aria-label="Describe what you want to create"
          style={{ flex:1, background:'none', border:0, color:'var(--dtext)', fontFamily:'var(--ui)', fontSize:15, minWidth:0, outline:'none' }}
        />
        <button type="submit" className="btn acc">Generate</button>
      </form>

      {/* Launch tiles */}
      <div className="launch-grid" style={{ display:'grid', gridTemplateColumns:'repeat(6,1fr)', gap:12, margin:'26px 0 30px', maxWidth:980 }}>
        {TILES.map(tile => (
          <button key={tile.id} onClick={() => setActiveView(tile.id)}
            style={{
              position:'relative', display:'flex', flexDirection:'column',
              gap:22, alignItems:'flex-start',
              background:'var(--card)', border:'1px solid var(--line)',
              borderRadius:'var(--r2)', padding:16, minHeight:118,
              transition:'.2s', overflow:'hidden', textAlign:'left', cursor:'pointer',
            }}
            onMouseEnter={e => { const el=e.currentTarget; el.style.transform='translateY(-3px)'; el.style.borderColor='var(--ink)'; el.style.boxShadow='var(--sh)'; }}
            onMouseLeave={e => { const el=e.currentTarget; el.style.transform=''; el.style.borderColor='var(--line)'; el.style.boxShadow='none'; }}
          >
            {tile.icon}
            <b style={{ fontSize:14, fontWeight:500 }}>{tile.label}</b>
            <span className="mic" style={{ position:'absolute', top:16, right:16 }}>{tile.num}</span>
          </button>
        ))}
      </div>

      {/* Status strip */}
      <div style={{ display:'flex', alignItems:'center', gap:14, flexWrap:'wrap', fontFamily:'var(--mono)', fontSize:11.5, color:'var(--mut)', marginBottom:26 }}>
        <span style={{ width:7,height:7,borderRadius:'50%',background:'var(--ok)',animation:'pulse-dot 2s infinite',display:'inline-block' }} />
        <span>QUEUE 00</span><span>·</span>
        <span>CREDITS {isAdmin ? '∞' : credits.toLocaleString()}</span><span>·</span>
        <span>VISITS {stats.visits.toLocaleString()}</span><span>·</span>
        <span>EDITS {stats.edits.toLocaleString()}</span><span>·</span>
        <span>VIDEOS {stats.videos.toLocaleString()}</span><span>·</span>
        <span>ALL SYSTEMS NOMINAL</span>
      </div>

      {/* Resume row */}
      <div>
        <h3 className="mic" style={{ marginBottom:12 }}>Pick up where you left off</h3>
        <div style={{ display:'flex', gap:14, overflowX:'auto', paddingBottom:10, scrollbarWidth:'thin' }}>
          {SAMPLE_IMAGES.slice(0,7).map(img => (
            <button key={img.id} onClick={() => setActiveView('gallery')}
              style={{ flex:'0 0 200px', borderRadius:14, overflow:'hidden', background:'var(--card)', border:'1px solid var(--line)', transition:'.2s', textAlign:'left', padding:0, cursor:'pointer' }}
              onMouseEnter={e => { e.currentTarget.style.transform='translateY(-3px)'; e.currentTarget.style.boxShadow='var(--sh)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform=''; e.currentTarget.style.boxShadow='none'; }}
            >
              <img src={img.url} alt={img.prompt.slice(0,40)} loading="lazy"
                style={{ height:120, width:'100%', objectFit:'cover', display:'block' }}
                onError={e => { (e.currentTarget as HTMLImageElement).style.display='none'; }}
              />
              <div style={{ padding:'10px 12px' }}>
                <b style={{ display:'block', fontSize:13, fontWeight:500 }}>{img.prompt.slice(0,28)}…</b>
                <span style={{ fontFamily:'var(--mono)', fontSize:10.5, color:'var(--mut)' }}>{img.model}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      <style>{`
        @media(max-width:980px){.launch-grid{grid-template-columns:repeat(3,1fr)!important}}
        @media(max-width:560px){.launch-grid{grid-template-columns:repeat(2,1fr)!important}}
        @media(max-width:899px){.launch-grid{margin-bottom:120px}}
        @keyframes pulse-dot{0%,100%{box-shadow:0 0 0 0 rgba(23,143,95,.4)}50%{box-shadow:0 0 0 6px rgba(23,143,95,0)}}
      `}</style>
    </div>
  );
}
