import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';

/* ─── Types ──────────────────────────────────────────────────────── */
interface VideoFormat { quality: string; ext: string; url: string; filesize?: number }
interface PageVideo {
  id: string; title: string; thumbnail_url: string;
  published_at: string | null; duration_seconds: number;
  post_url: string; download_formats: VideoFormat[];
}

/* ─── Helpers ────────────────────────────────────────────────────── */
function fmtDur(s: number) {
  if (!s) return '';
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
  if (h > 0) return `${h}:${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`;
  return `${m}:${String(sec).padStart(2,'0')}`;
}
function fmtSize(b?: number) {
  if (!b) return '';
  if (b > 1e9) return `${(b/1e9).toFixed(1)} GB`;
  if (b > 1e6) return `${(b/1e6).toFixed(0)} MB`;
  return `${(b/1e3).toFixed(0)} KB`;
}
function fmtDate(iso: string | null) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString(undefined, { month:'short', day:'numeric', year:'numeric' });
}
function dlUrl(videoUrl: string, title: string) {
  return `/api/videos/download?${new URLSearchParams({ url: videoUrl, filename: title })}`;
}

const QC: Record<string, { bg: string; color: string }> = {
  '1080p': { bg:'#f3e8ff', color:'#7c3aed' },
  '720p':  { bg:'#dbeafe', color:'#1d4ed8' },
  '480p':  { bg:'#dcfce7', color:'#166534' },
  '360p':  { bg:'#fef9c3', color:'#854d0e' },
  'HD':    { bg:'#f3e8ff', color:'#7c3aed' },
  'SD':    { bg:'#dbeafe', color:'#1d4ed8' },
  'audio': { bg:'#fce7f3', color:'#9d174d' },
};

/* ─── Download Modal ─────────────────────────────────────────────── */
function DownloadModal({ video, onClose }: { video: PageVideo; onClose: () => void }) {
  return (
    <>
      <div onClick={onClose} style={{ position:'fixed',inset:0,zIndex:110,background:'rgba(20,19,16,.6)',backdropFilter:'blur(4px)' }} />
      <motion.div initial={{ opacity:0, y:30 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:30 }}
        style={{ position:'fixed',bottom:0,left:'50%',translate:'-50% 0',zIndex:120,width:'min(480px,100vw)',background:'var(--card)',borderRadius:'22px 22px 0 0',border:'1px solid var(--line)',boxShadow:'0 -20px 60px rgba(0,0,0,.15)',overflow:'hidden' }}>

        {/* Grab */}
        <div style={{ width:44,height:5,borderRadius:99,background:'var(--line2)',margin:'12px auto 0' }} />

        {/* Header */}
        <div style={{ display:'flex',alignItems:'flex-start',gap:12,padding:'14px 18px',borderBottom:'1px solid var(--line)' }}>
          {video.thumbnail_url
            ? <img src={video.thumbnail_url} alt="" style={{ width:100,height:60,borderRadius:10,objectFit:'cover',flexShrink:0 }} onError={e=>{(e.currentTarget as HTMLImageElement).style.display='none';}} />
            : <div style={{ width:100,height:60,borderRadius:10,background:'var(--dark)',display:'grid',placeItems:'center',flexShrink:0 }}>
                <svg style={{ width:24,height:24,fill:'none',stroke:'var(--dmut)',strokeWidth:1.8 }} viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M7 5v14M17 5v14"/></svg>
              </div>
          }
          <div style={{ flex:1,minWidth:0 }}>
            <p style={{ fontSize:14,fontWeight:600,lineHeight:1.3 }}>{video.title}</p>
            {video.duration_seconds > 0 && (
              <p style={{ fontFamily:'var(--mono)',fontSize:10.5,color:'var(--mut)',marginTop:4 }}>{fmtDur(video.duration_seconds)}</p>
            )}
          </div>
          <button onClick={onClose} className="ibtn" style={{ flexShrink:0 }}>
            <svg style={{ width:16,height:16,fill:'none',stroke:'currentColor',strokeWidth:1.8 }} viewBox="0 0 24 24"><path d="M6 6l12 12M18 6 6 18"/></svg>
          </button>
        </div>

        {/* Formats */}
        <div style={{ padding:'14px 18px 20px',display:'flex',flexDirection:'column',gap:8 }}>
          <span className="mic" style={{ marginBottom:4 }}>Choose quality</span>

          {video.download_formats.length === 0 ? (
            <div style={{ textAlign:'center',padding:'20px 0',color:'var(--mut)' }}>
              <p style={{ fontSize:13,marginBottom:10 }}>No download links available</p>
              <a href={video.post_url} target="_blank" rel="noopener noreferrer" className="btn ghost sm">
                Open original post
              </a>
            </div>
          ) : video.download_formats.map(fmt => {
            const qc = QC[fmt.quality] ?? { bg:'var(--panel)', color:'var(--mut)' };
            return (
              <a key={fmt.quality}
                href={dlUrl(fmt.url, video.title)}
                download={`${video.title}.${fmt.ext}`}
                style={{ display:'flex',alignItems:'center',gap:12,padding:'12px 14px',border:'1px solid var(--line)',borderRadius:12,background:'var(--panel)',textDecoration:'none',color:'var(--ink)',transition:'.15s' }}
                onMouseEnter={e=>{e.currentTarget.style.borderColor='var(--acc)';}}
                onMouseLeave={e=>{e.currentTarget.style.borderColor='var(--line)';}}>
                <span style={{ borderRadius:8,padding:'3px 10px',fontSize:11,fontWeight:700,background:qc.bg,color:qc.color,flexShrink:0 }}>
                  {fmt.quality}
                </span>
                <div style={{ flex:1 }}>
                  <p style={{ fontSize:13,fontWeight:500 }}>{fmt.quality === 'audio' ? 'Audio only' : `Video ${fmt.quality}`}</p>
                  <p style={{ fontFamily:'var(--mono)',fontSize:10.5,color:'var(--mut)' }}>
                    {fmt.ext.toUpperCase()}{fmt.filesize ? ` · ${fmtSize(fmt.filesize)}` : ''}
                  </p>
                </div>
                <svg style={{ width:16,height:16,fill:'none',stroke:'var(--mut)',strokeWidth:1.8,flexShrink:0 }} viewBox="0 0 24 24">
                  <path d="M12 3v12M7 10l5 5 5-5M4 21h16"/>
                </svg>
              </a>
            );
          })}

          {video.post_url && (
            <a href={video.post_url} target="_blank" rel="noopener noreferrer"
              style={{ textAlign:'center',fontSize:12,color:'var(--mut)',marginTop:4,textDecoration:'none' }}
              onMouseEnter={e=>{e.currentTarget.style.color='var(--ink)';}}
              onMouseLeave={e=>{e.currentTarget.style.color='var(--mut)';}}>
              Open original post →
            </a>
          )}
        </div>
      </motion.div>
    </>
  );
}

/* ─── Video Card — matches reference HTML design ─────────────────── */
function VideoCard({ video, onDownload }: { video: PageVideo; onDownload: (v: PageVideo) => void }) {
  const [imgErr, setImgErr] = useState(false);
  const [hovered, setHovered] = useState(false);

  return (
    <motion.div
      initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }}
      style={{ borderRadius:'var(--r2)', overflow:'hidden', border:'1px solid var(--line)', background:'var(--card)', transition:'.2s', cursor:'pointer' }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Thumbnail */}
      <div style={{ position:'relative', aspectRatio:'16/9', overflow:'hidden', background:'var(--dark)' }}>
        {!imgErr && video.thumbnail_url
          ? <img src={video.thumbnail_url} alt="" loading="lazy"
              style={{ width:'100%', height:'100%', objectFit:'cover', opacity:.92, transform: hovered ? 'scale(1.05)' : 'scale(1)', transition:'transform .45s' }}
              onError={() => setImgErr(true)} />
          : <div style={{ width:'100%', height:'100%', display:'grid', placeItems:'center' }}>
              <svg style={{ width:40,height:40,fill:'none',stroke:'var(--dmut)',strokeWidth:1.5,opacity:.4 }} viewBox="0 0 24 24">
                <rect x="3" y="5" width="18" height="14" rx="2"/><path d="M7 5v14M17 5v14M3 10h4M3 14h4M17 10h4M17 14h4"/>
              </svg>
            </div>
        }

        {/* Play button overlay */}
        <div style={{ position:'absolute', inset:0, display:'grid', placeItems:'center' }}>
          <div style={{ width:52, height:52, borderRadius:'50%', background: hovered ? 'var(--acc)' : 'rgba(10,9,7,.65)', backdropFilter:'blur(4px)', display:'grid', placeItems:'center', transition:'.2s', transform: hovered ? 'scale(1.08)' : 'scale(1)' }}>
            <svg style={{ width:20,height:20,fill:'#fff',marginLeft:2 }} viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
          </div>
        </div>

        {/* Duration badge */}
        {video.duration_seconds > 0 && (
          <div style={{ position:'absolute', bottom:10, right:10, fontFamily:'var(--mono)', fontSize:10.5, background:'rgba(10,9,7,.75)', color:'#fff', padding:'3px 8px', borderRadius:6 }}>
            {fmtDur(video.duration_seconds)}
          </div>
        )}
      </div>

      {/* Info + download */}
      <div style={{ padding:'12px 14px' }}>
        <b style={{ fontSize:14, fontWeight:500, display:'block', marginBottom:4, lineHeight:1.3 }}>{video.title}</b>
        {video.published_at && (
          <span style={{ fontFamily:'var(--mono)', fontSize:10.5, color:'var(--mut)' }}>
            {fmtDate(video.published_at)}
            {video.download_formats.length > 0 && ` · ${video.download_formats.length} quality`}
          </span>
        )}

        {/* Download button */}
        <button
          onClick={() => onDownload(video)}
          className="btn acc sm"
          style={{ width:'100%', marginTop:10, justifyContent:'center' }}
        >
          <svg style={{ width:14,height:14,fill:'none',stroke:'currentColor',strokeWidth:1.8 }} viewBox="0 0 24 24">
            <path d="M12 3v12M7 10l5 5 5-5M4 21h16"/>
          </svg>
          Download
        </button>
      </div>
    </motion.div>
  );
}

/* ─── Main View ──────────────────────────────────────────────────── */
const PAGE_SIZE = 20;

export function VideosView() {
  const { toast } = useToast();
  const [videos, setVideos]       = useState<PageVideo[]>([]);
  const [total, setTotal]         = useState(0);
  const [page, setPage]           = useState(1);
  const [search, setSearch]       = useState('');
  const [query, setQuery]         = useState('');
  const [loading, setLoading]     = useState(true);
  const [selected, setSelected]   = useState<PageVideo | null>(null);
  const [syncing, setSyncing]     = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async (p: number, q: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(p), limit: String(PAGE_SIZE) });
      if (q) params.set('search', q);
      const res = await fetch(`/api/videos?${params}`);
      const data = await res.json() as { ok: boolean; videos?: PageVideo[]; total?: number };
      if (data.ok) { setVideos(data.videos ?? []); setTotal(data.total ?? 0); }
    } catch { /* silent */ } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(page, query); }, [page, query, load]);

  const handleSearch = (e: React.FormEvent) => { e.preventDefault(); setPage(1); setQuery(search); };

  const handleSync = async () => {
    setSyncing(true);
    toast({ title: 'Syncing videos…' });
    try {
      const res = await fetch('/api/videos/sync', { method: 'POST' });
      const data = await res.json() as { ok: boolean; added?: number; error?: string };
      if (data.ok) {
        toast({ title: `Sync complete — ${data.added ?? 0} new videos` });
        load(1, query);
      } else {
        toast({ title: 'Sync failed', description: data.error, variant: 'destructive' });
      }
    } catch (err) {
      toast({ title: 'Sync error', description: String(err), variant: 'destructive' });
    } finally { setSyncing(false); }
  };

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div style={{ padding:'clamp(16px,3vw,30px)', paddingBottom:80, maxWidth:1460, margin:'0 auto' }}>

      {/* ── Header ── */}
      <div className="vhead">
        <div>
          <h2>Videos</h2>
          <p>{total > 0 ? `${total} videos available` : 'Motion output from your stills and prompts'}</p>
        </div>
        <button className="btn acc sm" onClick={handleSync} disabled={syncing}>
          {syncing
            ? <><div style={{ width:14,height:14,borderRadius:'50%',border:'2px solid rgba(255,255,255,.4)',borderTopColor:'#fff',animation:'spin 1s linear infinite' }} />Syncing…</>
            : <><svg style={{ width:14,height:14,fill:'none',stroke:'currentColor',strokeWidth:1.8 }} viewBox="0 0 24 24"><path d="M4 12a8 8 0 0 1 14-5M20 12a8 8 0 0 1-14 5M18 3v4h-4M6 21v-4h4"/></svg>Sync videos</>
          }
        </button>
      </div>

      {/* ── Search ── */}
      <form onSubmit={handleSearch} style={{ display:'flex', gap:10, marginBottom:20, maxWidth:520 }}>
        <div style={{ position:'relative', flex:1 }}>
          <svg style={{ position:'absolute',left:12,top:'50%',transform:'translateY(-50%)',width:16,height:16,fill:'none',stroke:'var(--mut)',strokeWidth:1.8,pointerEvents:'none' }} viewBox="0 0 24 24">
            <circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/>
          </svg>
          <input
            ref={searchRef}
            className="ie-inp"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search videos…"
            style={{ paddingLeft:38 }}
          />
        </div>
        <button type="submit" className="btn ink sm">Search</button>
        {query && (
          <button type="button" className="btn ghost sm" onClick={() => { setSearch(''); setQuery(''); setPage(1); }}>
            Clear
          </button>
        )}
      </form>

      {/* ── Grid ── */}
      {loading ? (
        /* Skeleton */
        <div className="vid-grid">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} style={{ borderRadius:'var(--r2)', overflow:'hidden', border:'1px solid var(--line)', background:'var(--card)' }}>
              <div style={{ aspectRatio:'16/9', background:'var(--panel)', animation:'pulse 1.5s ease-in-out infinite' }} />
              <div style={{ padding:'12px 14px' }}>
                <div style={{ height:14, background:'var(--line)', borderRadius:6, marginBottom:8 }} />
                <div style={{ height:10, background:'var(--line)', borderRadius:6, width:'60%', marginBottom:12 }} />
                <div style={{ height:32, background:'var(--line)', borderRadius:10 }} />
              </div>
            </div>
          ))}
        </div>
      ) : videos.length === 0 ? (
        <div style={{ textAlign:'center', padding:'60px 20px', color:'var(--mut)' }}>
          <svg style={{ width:56,height:56,fill:'none',stroke:'currentColor',strokeWidth:1.5,margin:'0 auto 16px',display:'block',opacity:.2 }} viewBox="0 0 24 24">
            <rect x="3" y="5" width="18" height="14" rx="2"/><path d="M7 5v14M17 5v14M3 10h4M3 14h4M17 10h4M17 14h4"/>
          </svg>
          <p style={{ fontSize:15, marginBottom:6 }}>{query ? `No results for "${query}"` : 'No videos yet'}</p>
          <p style={{ fontSize:13 }}>{query ? 'Try a different search' : 'Sync from Admin → Video Sync to fetch videos'}</p>
        </div>
      ) : (
        <>
          <div className="vid-grid">
            <AnimatePresence mode="popLayout">
              {videos.map((v, i) => (
                <motion.div key={v.id} layout initial={{ opacity:0,scale:.96 }} animate={{ opacity:1,scale:1 }} transition={{ delay:i*0.03 }}>
                  <VideoCard video={v} onDownload={setSelected} />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:8, marginTop:28 }}>
              <button className="ibtn" disabled={page === 1} onClick={() => setPage(p => p - 1)} aria-label="Previous">
                <svg style={{ width:16,height:16,fill:'none',stroke:'currentColor',strokeWidth:1.8 }} viewBox="0 0 24 24"><path d="M15 18l-6-6 6-6"/></svg>
              </button>
              {Array.from({ length: Math.min(7, totalPages) }, (_, i) => {
                let p = i + 1;
                if (totalPages > 7) {
                  if (page <= 4) p = i + 1;
                  else if (page >= totalPages - 3) p = totalPages - 6 + i;
                  else p = page - 3 + i;
                }
                return (
                  <button key={p} onClick={() => setPage(p)}
                    style={{ width:36, height:36, borderRadius:10, border:'1px solid var(--line2)', background: p === page ? 'var(--ink)' : 'var(--card)', color: p === page ? 'var(--bg)' : 'var(--ink)', fontFamily:'var(--mono)', fontSize:13, cursor:'pointer', transition:'.15s' }}>
                    {p}
                  </button>
                );
              })}
              <button className="ibtn" disabled={page === totalPages} onClick={() => setPage(p => p + 1)} aria-label="Next">
                <svg style={{ width:16,height:16,fill:'none',stroke:'currentColor',strokeWidth:1.8 }} viewBox="0 0 24 24"><path d="M9 18l6-6-6-6"/></svg>
              </button>
            </div>
          )}
        </>
      )}

      {/* Download modal */}
      <AnimatePresence>
        {selected && <DownloadModal video={selected} onClose={() => setSelected(null)} />}
      </AnimatePresence>

      <style>{`
        .vid-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
          gap: 16px;
        }
        @keyframes spin  { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.5} }
        @media(max-width:480px){ .vid-grid{ grid-template-columns:1fr; } }
      `}</style>
    </div>
  );
}
