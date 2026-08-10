import { useState, useMemo, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '@/components/providers/app-provider';
import { supabase } from '@/lib/supabase';
import { SAMPLE_IMAGES } from '@/lib/mock-data';
import type { StoredImage } from '@/lib/admin-types';

const FALLBACK: StoredImage[] = SAMPLE_IMAGES.map(img => ({
  id: img.id, url: img.url, prompt: img.prompt, model: img.model,
  width: img.width, height: img.height, favorite: img.favorite,
  tags: [], created_at: img.createdAt,
}));

const FILTERS = ['All', 'Fantasy', 'Portraits', 'Product', 'Abstract', 'Cinematic'];

export function GalleryView() {
  const { setPrompt, setActiveView } = useApp();
  const [images, setImages] = useState<StoredImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<StoredImage | null>(null);

  const fetch_ = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from('stored_images').select('*').order('created_at', { ascending: false });
      setImages(!error && data && data.length > 0 ? (data as StoredImage[]) : FALLBACK);
    } catch { setImages(FALLBACK); }
    setLoading(false);
  }, []);

  useEffect(() => { fetch_(); }, [fetch_]);

  const filtered = useMemo(() => {
    let r = images;
    if (filter !== 'All') r = r.filter(i => (i.tags ?? []).some((t: string) => t.toLowerCase().includes(filter.toLowerCase())) || i.model.toLowerCase().includes(filter.toLowerCase()));
    if (search) { const q = search.toLowerCase(); r = r.filter(i => i.prompt.toLowerCase().includes(q) || i.model.toLowerCase().includes(q)); }
    return r;
  }, [images, filter, search]);

  const toggleFav = async (img: StoredImage) => {
    await supabase.from('stored_images').update({ favorite: !img.favorite }).eq('id', img.id);
    setImages(p => p.map(i => i.id === img.id ? { ...i, favorite: !i.favorite } : i));
  };
  const deleteImg = async (id: string) => {
    await supabase.from('stored_images').delete().eq('id', id);
    setImages(p => p.filter(i => i.id !== id));
    if (selected?.id === id) setSelected(null);
  };

  return (
    <div style={{ padding: 'clamp(16px,3vw,30px)', paddingBottom: 50, maxWidth: 1460, margin: '0 auto' }}>
      {/* Header */}
      <div className="vhead">
        <div>
          <h2>Gallery</h2>
          <p id="galCount">{filtered.length} assets in your library</p>
        </div>
        <label style={{ cursor: 'pointer' }}>
          <input type="file" accept="image/*" style={{ display: 'none' }} onChange={() => {}} />
          <span className="btn ghost sm">
            <svg style={{ width:15,height:15,fill:'none',stroke:'currentColor',strokeWidth:1.8 }} viewBox="0 0 24 24">
              <path d="M12 21V9M7 14l5-5 5 5M4 3h16"/>
            </svg>
            Upload
          </span>
        </label>
      </div>

      {/* Search + filters */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', marginBottom: 18 }}>
        <input
          className="ie-inp"
          style={{ maxWidth: 260 }}
          placeholder="Search assets…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {FILTERS.map(f => (
            <button key={f} className={`chip${filter === f ? ' on' : ''}`} onClick={() => setFilter(f)}>{f}</button>
          ))}
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
          <div style={{ width: 32, height: 32, borderRadius: '50%', border: '2px solid var(--acc)', borderTopColor: 'transparent', animation: 'spin 1s linear infinite' }} />
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--mut)' }}>
          <p style={{ fontSize: 15, marginBottom: 6 }}>No results.</p>
          <span className="mic">try another tag or clear search</span>
        </div>
      ) : (
        <div style={{ columns: '4 230px', columnGap: 14 }}>
          {filtered.map((img, i) => (
            <motion.div
              key={img.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i * 0.03, 0.3) }}
              style={{ position: 'relative', borderRadius: 14, overflow: 'hidden', marginBottom: 14, breakInside: 'avoid', border: '1px solid var(--line)', background: 'var(--card)', cursor: 'pointer' }}
              className="gitem-wrap"
              onClick={() => setSelected(img)}
            >
              <img
                src={img.url} alt={img.prompt}
                style={{ width: '100%', display: 'block', transition: 'transform .45s' }}
                loading="lazy"
                onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.04)')}
                onMouseLeave={e => (e.currentTarget.style.transform = '')}
                onError={e => { (e.currentTarget as HTMLImageElement).style.opacity = '0.3'; }}
              />
              {/* Overlay */}
              <div className="gitem-ov" style={{
                position: 'absolute', inset: 'auto 0 0 0',
                padding: '34px 12px 10px',
                background: 'linear-gradient(transparent, rgba(10,9,7,.88))',
                display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 8,
                opacity: 0, transition: '.22s',
              }}>
                <span style={{ color: '#fff', fontSize: 12.5, fontWeight: 500 }}>
                  {img.prompt.slice(0, 40)}…
                  <span style={{ display: 'block', fontFamily: 'var(--mono)', fontSize: 10, color: 'rgba(255,255,255,.6)' }}>
                    {img.model} · {new Date(img.created_at).toLocaleDateString()}
                  </span>
                </span>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button className="ibtn d" onClick={e => { e.stopPropagation(); toggleFav(img); }} aria-label="Favorite">
                    <svg style={{ width:15,height:15,fill: img.favorite ? 'var(--acc)' : 'none',stroke: img.favorite ? 'var(--acc)' : 'currentColor',strokeWidth:1.8 }} viewBox="0 0 24 24">
                      <path d="M12 3l2 5 5 2-5 2-2 5-2-5-5-2 5-2z"/>
                    </svg>
                  </button>
                  <a className="ibtn d" href={img.url} download={`image-${img.id}.png`} onClick={e => e.stopPropagation()} aria-label="Download">
                    <svg style={{ width:15,height:15,fill:'none',stroke:'currentColor',strokeWidth:1.8 }} viewBox="0 0 24 24">
                      <path d="M12 3v12M7 10l5 5 5-5M4 21h16"/>
                    </svg>
                  </a>
                  <button className="ibtn d" onClick={e => { e.stopPropagation(); setPrompt(img.prompt); setActiveView('generate'); }} aria-label="Reuse">
                    <svg style={{ width:15,height:15,fill:'none',stroke:'currentColor',strokeWidth:1.8 }} viewBox="0 0 24 24">
                      <path d="M21 3v6h-6"/><path d="M20.5 9A8.5 8.5 0 1 0 21 12"/>
                    </svg>
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Lightbox */}
      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setSelected(null)}
            style={{ position: 'fixed', inset: 0, zIndex: 110, background: 'rgba(20,19,16,.85)', backdropFilter: 'blur(4px)', display: 'grid', placeItems: 'center', padding: 18 }}
          >
            <motion.div
              initial={{ scale: 0.94, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.94, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              style={{ width: 'min(1060px,100%)', maxHeight: '92vh', background: 'var(--dark)', border: '1px solid var(--dline)', borderRadius: 22, overflow: 'hidden', display: 'grid', gridTemplateColumns: '1fr 300px', position: 'relative' }}
              className="lb-box"
            >
              <button className="ibtn d" onClick={() => setSelected(null)} style={{ position: 'absolute', top: 14, right: 14, zIndex: 2 }}>
                <svg style={{ width:16,height:16,fill:'none',stroke:'currentColor',strokeWidth:1.8 }} viewBox="0 0 24 24"><path d="M6 6l12 12M18 6 6 18"/></svg>
              </button>
              {/* Image side */}
              <div style={{ background: 'var(--dark2)', display: 'grid', placeItems: 'center', padding: 16, minHeight: 0 }}>
                <img src={selected.url} alt={selected.prompt} style={{ maxHeight: '74vh', borderRadius: 10, objectFit: 'contain', width: '100%' }} />
              </div>
              {/* Info side */}
              <div style={{ padding: 20, color: 'var(--dtext)', display: 'flex', flexDirection: 'column', gap: 16, overflowY: 'auto' }}>
                <h3 style={{ fontSize: 17, fontWeight: 700 }}>{selected.prompt.slice(0, 60)}</h3>
                <div style={{ display: 'grid', gap: 8, fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--dmut)' }}>
                  {[['Model', selected.model], ['Size', `${selected.width}×${selected.height}`], ['Created', new Date(selected.created_at).toLocaleDateString()]].map(([k, v]) => (
                    <div key={k} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed var(--dline)', paddingBottom: 8 }}>
                      <span>{k}</span><span style={{ color: 'var(--dtext)' }}>{v}</span>
                    </div>
                  ))}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 'auto' }}>
                  <button className="btn dark" onClick={() => { setPrompt(selected.prompt); setActiveView('editor'); setSelected(null); }}>
                    <svg style={{ width:16,height:16,fill:'none',stroke:'currentColor',strokeWidth:1.8 }} viewBox="0 0 24 24"><path d="M4 20l4-1L19 8l-3-3L5 16z"/></svg>
                    Open in editor
                  </button>
                  <button className="btn dark" onClick={() => { setPrompt(selected.prompt); setActiveView('generate'); setSelected(null); }}>
                    <svg style={{ width:16,height:16,fill:'none',stroke:'currentColor',strokeWidth:1.8 }} viewBox="0 0 24 24"><path d="M21 3v6h-6"/><path d="M20.5 9A8.5 8.5 0 1 0 21 12"/></svg>
                    Create variation
                  </button>
                  <a className="btn dark" href={selected.url} download={`image-${selected.id}.png`}>
                    <svg style={{ width:16,height:16,fill:'none',stroke:'currentColor',strokeWidth:1.8 }} viewBox="0 0 24 24"><path d="M12 3v12M7 10l5 5 5-5M4 21h16"/></svg>
                    Download
                  </a>
                  <button onClick={() => deleteImg(selected.id)} style={{ background: 'var(--dark2)', border: '1px solid var(--dline)', color: '#ff8f80', borderRadius: 12, padding: '10px 16px', fontSize: 14, display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontFamily: 'var(--ui)' }}>
                    <svg style={{ width:16,height:16,fill:'none',stroke:'currentColor',strokeWidth:1.8 }} viewBox="0 0 24 24"><path d="M4 7h16M9 7V4h6v3M6 7l1 14h10l1-14M10 11v6M14 11v6"/></svg>
                    Delete
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .gitem-wrap:hover .gitem-ov { opacity: 1 !important; }
        @media(hover:none) { .gitem-ov { opacity: 1 !important; } }
        @media(max-width:860px) { .lb-box { grid-template-columns: 1fr !important; overflow: auto; } }
      `}</style>
    </div>
  );
}
