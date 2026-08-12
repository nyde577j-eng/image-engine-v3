import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';

interface Voice {
  _id: string; title: string; description?: string;
  cover_image?: string; languages?: string[];
  task_count?: number;
  samples?: { text: string; audio: string }[];
}

const FORMATS = ['mp3', 'wav', 'opus'] as const;
type Fmt = typeof FORMATS[number];

const LANGS = [
  { value: '', label: 'All languages' },
  { value: 'ar', label: '🇸🇦 Arabic' },
  { value: 'en', label: '🇺🇸 English' },
  { value: 'zh', label: '🇨🇳 中文' },
  { value: 'ja', label: '🇯🇵 日本語' },
  { value: 'fr', label: '🇫🇷 Français' },
  { value: 'de', label: '🇩🇪 Deutsch' },
  { value: 'es', label: '🇪🇸 Español' },
  { value: 'tr', label: '🇹🇷 Türkçe' },
];

/* ── Waveform bars for playing audio ─────────────────────────────── */
function WaveformBars({ playing, count = 36 }: { playing: boolean; count?: number }) {
  return (
    <div style={{ flex:1, display:'flex', alignItems:'center', gap:3, height:34, overflow:'hidden' }}>
      {Array.from({ length: count }, (_, k) => (
        <div key={k} style={{
          flex:1, background: playing ? 'var(--acc)' : 'var(--line2)',
          borderRadius:2,
          height: playing ? undefined : `${18 + ((k * 37) % 64)}%`,
          animation: playing ? `wv 0.9s ease-in-out ${k * 40}ms infinite alternate` : 'none',
          transition: 'background .2s',
        }} />
      ))}
    </div>
  );
}

/* ── Audio card (result row) ─────────────────────────────────────── */
function AudioCard({ url, name, voice, duration, onDelete }: {
  url: string; name: string; voice: string; duration: string; onDelete: () => void;
}) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [dur, setDur] = useState(0);

  const toggle = () => {
    if (!audioRef.current) return;
    if (playing) { audioRef.current.pause(); setPlaying(false); }
    else { audioRef.current.play(); setPlaying(true); }
  };

  const fmt = (s: number) => `${Math.floor(s/60)}:${String(Math.floor(s%60)).padStart(2,'0')}`;

  return (
    <motion.div initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }}
      className="ie-card"
      style={{ display:'flex', alignItems:'center', gap:14, padding:'14px 16px' }}>
      <audio ref={audioRef} src={url}
        onTimeUpdate={() => setProgress(audioRef.current?.currentTime ?? 0)}
        onLoadedMetadata={() => setDur(audioRef.current?.duration ?? 0)}
        onEnded={() => setPlaying(false)} />

      {/* Play button */}
      <button onClick={toggle}
        style={{ width:44, height:44, borderRadius:'50%', background:'var(--ink)', color:'var(--bg)', border:0, display:'grid', placeItems:'center', flexShrink:0, cursor:'pointer', transition:'.15s' }}
        onMouseEnter={e => { e.currentTarget.style.background='var(--acc)'; }}
        onMouseLeave={e => { e.currentTarget.style.background='var(--ink)'; }}>
        {playing
          ? <svg style={{ width:16,height:16,fill:'currentColor' }} viewBox="0 0 24 24"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
          : <svg style={{ width:16,height:16,fill:'currentColor' }} viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
        }
      </button>

      {/* Waveform + seek */}
      <div style={{ flex:1, minWidth:0 }}>
        {/* Clickable progress bar */}
        <div
          style={{ width:'100%', height:3, background:'var(--line)', borderRadius:99, overflow:'hidden', cursor:'pointer', marginBottom:6 }}
          onClick={e => {
            if (!audioRef.current || !dur) return;
            const rect = e.currentTarget.getBoundingClientRect();
            audioRef.current.currentTime = ((e.clientX - rect.left) / rect.width) * dur;
          }}
        >
          <div style={{ height:'100%', width:`${dur ? (progress/dur)*100 : 0}%`, background:'var(--acc)', borderRadius:99, transition:'width .1s' }} />
        </div>
        <WaveformBars playing={playing} />
        <div style={{ display:'flex', justifyContent:'space-between', fontFamily:'var(--mono)', fontSize:10, color:'var(--mut)', marginTop:4 }}>
          <span>{fmt(progress)}</span><span>{fmt(dur || 0)}</span>
        </div>
      </div>

      {/* Meta */}
      <div style={{ width:110, flexShrink:0, overflow:'hidden' }} className="tts-meta">
        <b style={{ fontSize:13, display:'block', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{name}</b>
        <span style={{ fontFamily:'var(--mono)', fontSize:10.5, color:'var(--mut)' }}>{voice} · {duration}</span>
      </div>

      {/* Download */}
      <a href={url} download={name}
        style={{ width:32, height:32, borderRadius:8, border:'1px solid var(--line2)', background:'var(--card)', display:'grid', placeItems:'center', color:'var(--mut)', flexShrink:0, transition:'.15s', textDecoration:'none' }}
        onMouseEnter={e => { e.currentTarget.style.borderColor='var(--ink)'; e.currentTarget.style.color='var(--ink)'; }}
        onMouseLeave={e => { e.currentTarget.style.borderColor='var(--line2)'; e.currentTarget.style.color='var(--mut)'; }}>
        <svg style={{ width:14,height:14,fill:'none',stroke:'currentColor',strokeWidth:1.8 }} viewBox="0 0 24 24">
          <path d="M12 3v12M7 10l5 5 5-5M4 21h16"/>
        </svg>
      </a>
    </motion.div>
  );
}

/* ── Mini preview player (used inside VoiceCard) ─────────────────── */
function VoicePreview({ audioUrl, onStop }: { audioUrl: string; onStop: () => void }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [dur, setDur] = useState(0);

  /* auto-play when mounted */
  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;
    el.play().then(() => setPlaying(true)).catch(() => {});
    return () => { el.pause(); };
  }, []);

  const toggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    const el = audioRef.current;
    if (!el) return;
    if (playing) { el.pause(); setPlaying(false); }
    else { el.play(); setPlaying(true); }
  };

  const fmt = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

  return (
    <div
      onClick={e => e.stopPropagation()}
      style={{
        marginTop: 8,
        padding: '8px 10px',
        background: 'rgba(255,77,31,.08)',
        border: '1px solid rgba(255,77,31,.2)',
        borderRadius: 10,
        display: 'flex', alignItems: 'center', gap: 8,
      }}
    >
      <audio
        ref={audioRef}
        src={audioUrl}
        onTimeUpdate={() => setProgress(audioRef.current?.currentTime ?? 0)}
        onLoadedMetadata={() => setDur(audioRef.current?.duration ?? 0)}
        onEnded={() => { setPlaying(false); onStop(); }}
      />

      {/* Play/Pause */}
      <button
        onClick={toggle}
        style={{
          width: 28, height: 28, borderRadius: '50%',
          background: 'var(--acc)', border: 0, color: '#fff',
          display: 'grid', placeItems: 'center', flexShrink: 0, cursor: 'pointer',
        }}
      >
        {playing
          ? <svg style={{ width:11,height:11,fill:'currentColor' }} viewBox="0 0 24 24"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
          : <svg style={{ width:11,height:11,fill:'currentColor' }} viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
        }
      </button>

      {/* Progress bar */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 6 }}>
        <div
          style={{ flex: 1, height: 3, background: 'rgba(255,77,31,.2)', borderRadius: 99, overflow: 'hidden', cursor: 'pointer' }}
          onClick={e => {
            e.stopPropagation();
            if (!audioRef.current || !dur) return;
            const rect = e.currentTarget.getBoundingClientRect();
            audioRef.current.currentTime = ((e.clientX - rect.left) / rect.width) * dur;
          }}
        >
          <div style={{ height: '100%', width: `${dur ? (progress / dur) * 100 : 0}%`, background: 'var(--acc)', borderRadius: 99, transition: 'width .1s' }} />
        </div>
        <span style={{ fontFamily: 'var(--mono)', fontSize: 9.5, color: 'var(--acc)', flexShrink: 0 }}>
          {fmt(progress)}/{fmt(dur || 0)}
        </span>
      </div>

      {/* Stop preview */}
      <button
        onClick={e => { e.stopPropagation(); audioRef.current?.pause(); onStop(); }}
        style={{ background: 'none', border: 0, cursor: 'pointer', color: 'var(--mut)', padding: 2, display: 'grid', placeItems: 'center' }}
        title="Close preview"
      >
        <svg style={{ width:12,height:12,fill:'none',stroke:'currentColor',strokeWidth:2 }} viewBox="0 0 24 24"><path d="M6 6l12 12M18 6 6 18"/></svg>
      </button>
    </div>
  );
}

/* ── Voice card for selector ─────────────────────────────────────── */
function VoiceCard({ voice, selected, onSelect, playingPreviewId, onPreviewToggle }: {
  voice: Voice;
  selected: boolean;
  onSelect: () => void;
  playingPreviewId: string | null;
  onPreviewToggle: (id: string | null) => void;
}) {
  const [imgErr, setImgErr] = useState(false);

  /* pick first available sample audio URL */
  const sampleUrl = voice.samples?.find(s => s.audio)?.audio ?? null;
  const isPreviewing = playingPreviewId === voice._id;

  const handlePreviewClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isPreviewing) {
      onPreviewToggle(null);
    } else {
      onPreviewToggle(voice._id);
    }
  };

  return (
    <div
      style={{
        border: selected ? '1px solid var(--acc)' : '1px solid var(--line2)',
        borderRadius: 14,
        padding: 12,
        background: selected ? 'var(--accsoft)' : 'var(--card)',
        boxShadow: selected ? '0 0 0 3px rgba(255,77,31,.14)' : 'none',
        transition: '.15s',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        gap: 0,
      }}
    >
      {/* Top row — clickable to select */}
      <button
        onClick={onSelect}
        style={{
          display: 'flex', gap: 10, alignItems: 'center',
          background: 'none', border: 0, cursor: 'pointer', textAlign: 'left', width: '100%', padding: 0,
        }}
      >
        {/* Avatar */}
        <div style={{ width: 38, height: 38, borderRadius: 10, background: 'var(--dark)', display: 'grid', placeItems: 'center', flexShrink: 0, color: 'var(--acc)', overflow: 'hidden' }}>
          {voice.cover_image && !imgErr
            ? <img src={voice.cover_image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={() => setImgErr(true)} />
            : <svg style={{ width:18,height:18,fill:'none',stroke:'currentColor',strokeWidth:1.8 }} viewBox="0 0 24 24"><path d="M4 10v4M8 7v10M12 4v16M16 7v10M20 10v4"/></svg>
          }
        </div>

        <div style={{ minWidth: 0, flex: 1 }}>
          <b style={{ fontSize: 13.5, display: 'block' }}>{voice.title}</b>
          <span style={{ fontFamily: 'var(--mono)', fontSize: 10.5, color: 'var(--mut)' }}>
            {voice.languages?.slice(0, 2).join(' · ') ?? '—'}
          </span>
        </div>

        {/* Selected dot OR Preview button */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
          {sampleUrl && (
            <button
              onClick={handlePreviewClick}
              title={isPreviewing ? 'Stop preview' : 'Preview voice sample'}
              style={{
                width: 26, height: 26, borderRadius: '50%',
                background: isPreviewing ? 'var(--acc)' : 'rgba(255,77,31,.15)',
                border: '1px solid rgba(255,77,31,.3)',
                color: isPreviewing ? '#fff' : 'var(--acc)',
                display: 'grid', placeItems: 'center', cursor: 'pointer',
                transition: '.15s', flexShrink: 0,
              }}
            >
              {isPreviewing
                ? <svg style={{ width:10,height:10,fill:'currentColor' }} viewBox="0 0 24 24"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
                : <svg style={{ width:10,height:10,fill:'currentColor' }} viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
              }
            </button>
          )}
          {selected && (
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--acc)' }} />
          )}
        </div>
      </button>

      {/* Inline preview player */}
      {isPreviewing && sampleUrl && (
        <VoicePreview audioUrl={sampleUrl} onStop={() => onPreviewToggle(null)} />
      )}
    </div>
  );
}

/* ── Clone Section ───────────────────────────────────────────────── */
function CloneSection({ onAudioReady }: { onAudioReady: (audio: GeneratedAudio) => void }) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [cloneText, setCloneText]       = useState('');
  const [cloneFormat, setCloneFormat]   = useState<Fmt>('mp3');
  const [cloneSpeed, setCloneSpeed]     = useState(1);
  const [cloneFile, setCloneFile]       = useState<File | null>(null);
  const [transcript, setTranscript]     = useState('');
  const [cloning, setCloning]           = useState(false);
  const [dragging, setDragging]         = useState(false);

  const handleFile = (file: File) => {
    if (!file.type.startsWith('audio/')) {
      toast({ title: 'Audio files only', description: 'Upload a WAV, MP3, or M4A file', variant: 'destructive' });
      return;
    }
    setCloneFile(file);
  };

  const handleClone = async () => {
    if (!cloneText.trim()) { toast({ title: 'Write something first' }); return; }
    if (!cloneFile)        { toast({ title: 'Upload a reference audio file first' }); return; }

    setCloning(true);
    try {
      /* قراءة الملف كـ base64 */
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload  = e => resolve((e.target?.result as string).split(',')[1] ?? '');
        reader.onerror = reject;
        reader.readAsDataURL(cloneFile);
      });

      const res = await fetch('/api/tts/clone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: cloneText.trim(),
          audio_base64: base64,
          audio_mime: cloneFile.type || 'audio/wav',
          transcript: transcript.trim(),
          format: cloneFormat,
          speed: cloneSpeed,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` })) as { error?: string };
        throw new Error(err.error ?? `HTTP ${res.status}`);
      }

      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      const name = `clone-${cloneText.slice(0, 12).toLowerCase().replace(/\s+/g, '-')}.${cloneFormat}`;
      const dur  = `0:${Math.max(8, Math.round(cloneText.length / 15)).toString().padStart(2, '0')}`;

      onAudioReady({ id: Date.now().toString(), url, name, voice: `Clone · ${cloneFile.name}`, duration: dur });
      toast({ title: 'Voice cloned!' });
    } catch (err) {
      toast({ title: 'Clone failed', description: String(err), variant: 'destructive' });
    } finally {
      setCloning(false);
    }
  };

  return (
    <div style={{ marginTop: 28 }}>
      {/* Divider */}
      <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:20 }}>
        <div style={{ flex:1, height:1, background:'var(--line)' }} />
        <span style={{ fontFamily:'var(--mono)', fontSize:10.5, letterSpacing:'.1em', color:'var(--mut)' }}>CLONE VOICE</span>
        <div style={{ flex:1, height:1, background:'var(--line)' }} />
      </div>

      <div className="tts-layout" style={{ display:'grid', gridTemplateColumns:'380px 1fr', gap:18, alignItems:'start' }}>

        {/* ── Clone Console ── */}
        <div className="ie-card" style={{ padding:20, display:'flex', flexDirection:'column', gap:18 }}>

          {/* Reference audio upload */}
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            <span className="mic">Reference audio</span>
            <div
              onDragOver={e => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={e => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
              onClick={() => fileInputRef.current?.click()}
              style={{
                border: `1px dashed ${dragging ? 'var(--acc)' : cloneFile ? 'rgba(255,77,31,.4)' : 'var(--line2)'}`,
                borderRadius: 12,
                padding: '14px 16px',
                background: cloneFile ? 'var(--accsoft)' : dragging ? 'rgba(255,77,31,.05)' : 'transparent',
                cursor: 'pointer', transition: '.2s',
                display: 'flex', alignItems: 'center', gap: 10,
              }}
            >
              <svg style={{ width:20,height:20,fill:'none',stroke: cloneFile ? 'var(--acc)' : 'var(--mut)',strokeWidth:1.8,flexShrink:0 }} viewBox="0 0 24 24">
                <path d="M4 10v4M8 7v10M12 4v16M16 7v10M20 10v4"/>
              </svg>
              <div style={{ minWidth:0 }}>
                {cloneFile ? (
                  <>
                    <b style={{ display:'block', fontSize:13, color:'var(--acc)' }}>{cloneFile.name}</b>
                    <span style={{ fontFamily:'var(--mono)', fontSize:10.5, color:'var(--mut)' }}>
                      {(cloneFile.size / 1024).toFixed(0)} KB · click to change
                    </span>
                  </>
                ) : (
                  <>
                    <b style={{ display:'block', fontSize:13 }}>Drop audio file here</b>
                    <span style={{ fontFamily:'var(--mono)', fontSize:10.5, color:'var(--mut)' }}>WAV, MP3, M4A · 10-30 seconds ideal</span>
                  </>
                )}
              </div>
              {cloneFile && (
                <button
                  onClick={e => { e.stopPropagation(); setCloneFile(null); }}
                  style={{ marginLeft:'auto', background:'none', border:0, cursor:'pointer', color:'var(--mut)', flexShrink:0 }}
                >
                  <svg style={{ width:14,height:14,fill:'none',stroke:'currentColor',strokeWidth:1.8 }} viewBox="0 0 24 24"><path d="M6 6l12 12M18 6 6 18"/></svg>
                </button>
              )}
            </div>
            <input ref={fileInputRef} type="file" accept="audio/*" style={{ display:'none' }}
              onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ''; }} />
          </div>

          {/* Transcript (optional) */}
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            <div style={{ display:'flex', justifyContent:'space-between' }}>
              <span className="mic">Transcript <span style={{ color:'var(--mut)', fontWeight:400 }}>(optional)</span></span>
            </div>
            <input className="ie-inp" value={transcript} onChange={e => setTranscript(e.target.value)}
              placeholder="What is said in the reference file…" />
            <span style={{ fontFamily:'var(--mono)', fontSize:10, color:'var(--mut)' }}>
              Providing the transcript improves clone quality
            </span>
          </div>

          {/* Script */}
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            <div style={{ display:'flex', justifyContent:'space-between' }}>
              <span className="mic">Text to speak</span>
              <span className="mic">{cloneText.length} / 5000</span>
            </div>
            <textarea className="ie-inp" value={cloneText} onChange={e => setCloneText(e.target.value.slice(0, 5000))}
              placeholder="What do you want the cloned voice to say…" style={{ minHeight:100 }} />
          </div>

          {/* Format */}
          <div>
            <span className="mic" style={{ display:'block', marginBottom:8 }}>Format</span>
            <div style={{ display:'flex', gap:8 }}>
              {FORMATS.map(f => (
                <button key={f} className={`chip${cloneFormat === f ? ' on' : ''}`} onClick={() => setCloneFormat(f)}
                  style={{ flex:1, textAlign:'center', textTransform:'uppercase' }}>
                  {f}
                </button>
              ))}
            </div>
          </div>

          {/* Speed */}
          <div>
            <div style={{ display:'flex', justifyContent:'space-between' }}>
              <span className="mic">Speed</span>
              <span className="mic" style={{ color:'var(--acc)' }}>{cloneSpeed.toFixed(1)}x</span>
            </div>
            <input type="range" min=".5" max="2" step=".1" value={cloneSpeed}
              onChange={e => setCloneSpeed(parseFloat(e.target.value))}
              style={{ width:'100%', accentColor:'var(--acc)', marginTop:4 }} />
            <div style={{ display:'flex', justifyContent:'space-between', fontFamily:'var(--mono)', fontSize:10, color:'var(--mut)', marginTop:2 }}>
              <span>0.5x</span><span>2x</span>
            </div>
          </div>

          {/* Clone button */}
          <button className="btn acc" onClick={handleClone}
            disabled={!cloneText.trim() || !cloneFile || cloning}
            style={{ width:'100%', padding:14, fontSize:15, fontWeight:700 }}>
            {cloning
              ? <><div style={{ width:18,height:18,borderRadius:'50%',border:'2px solid rgba(255,255,255,.3)',borderTopColor:'#fff',animation:'spin 1s linear infinite' }} />Cloning…</>
              : <>
                  <svg style={{ width:18,height:18,fill:'none',stroke:'currentColor',strokeWidth:1.8 }} viewBox="0 0 24 24">
                    <path d="M4 10v4M8 7v10M12 4v16M16 7v10M20 10v4"/>
                    <path d="M20 4l-8 8-4-4"/>
                  </svg>
                  Clone voice
                </>
            }
          </button>
        </div>

        {/* ── Clone info panel ── */}
        <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
          <div style={{ border:'1px solid var(--line)', borderRadius:16, padding:'20px 22px', background:'var(--card)' }}>
            <h4 style={{ fontSize:15, fontWeight:700, marginBottom:10 }}>How it works</h4>
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              {[
                { n:'01', t:'Upload a reference', d:'Any audio with a clear voice — 10 to 30 seconds is ideal.' },
                { n:'02', t:'Add transcript', d:'Optionally tell the model what is said in the file for better accuracy.' },
                { n:'03', t:'Write your text', d:'Type what you want the cloned voice to read aloud.' },
                { n:'04', t:'Clone', d:'The engine matches the voice from your reference and generates the audio.' },
              ].map(s => (
                <div key={s.n} style={{ display:'flex', gap:12, alignItems:'flex-start' }}>
                  <span style={{ fontFamily:'var(--mono)', fontSize:10, color:'var(--acc)', flexShrink:0, marginTop:3 }}>{s.n}</span>
                  <div>
                    <b style={{ fontSize:13, display:'block' }}>{s.t}</b>
                    <span style={{ fontSize:12, color:'var(--mut)' }}>{s.d}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ border:'1px solid var(--line2)', borderRadius:12, padding:'12px 14px', background:'var(--panel)', display:'flex', gap:10 }}>
            <svg style={{ width:16,height:16,fill:'none',stroke:'var(--mut)',strokeWidth:1.8,flexShrink:0,marginTop:2 }} viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="9"/><path d="M12 8v5M12 16h.01"/>
            </svg>
            <p style={{ fontSize:12, color:'var(--mut)', lineHeight:1.5 }}>
              Clone uses <b style={{ color:'var(--ink)' }}>instant voice cloning</b> — no training required.
              The cloned audio appears in the Generated audio list below.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}

/* ── Main ────────────────────────────────────────────────────────── */
interface GeneratedAudio {
  id: string; url: string; name: string; voice: string; duration: string;
}

export function TtsView() {
  const { toast } = useToast();

  const [text, setText]               = useState('Welcome to Image Engine. One workspace, every medium.');
  const [format, setFormat]           = useState<Fmt>('mp3');
  const [speed, setSpeed]             = useState(1);
  const [selectedVoiceId, setSelectedVoiceId] = useState('');
  const [selectedVoiceName, setSelectedVoiceName] = useState('');
  const [generating, setGenerating]   = useState(false);
  const [audios, setAudios]           = useState<GeneratedAudio[]>([]);

  /* Clone section toggle */
  const [showClone, setShowClone]     = useState(false);

  /* Library */
  const [voices, setVoices]           = useState<Voice[]>([]);
  const [voicesPage, setVoicesPage]   = useState(1);
  const [voicesSearch, setVoicesSearch] = useState('');
  const [voicesLang, setVoicesLang]   = useState('');
  const [voicesHasMore, setVoicesHasMore] = useState(false);
  const [voicesLoading, setVoicesLoading] = useState(false);
  const [showLibrary, setShowLibrary] = useState(false);
  const [playingPreviewId, setPlayingPreviewId] = useState<string | null>(null);
  const PAGE_SIZE = 12;

  const fetchVoices = useCallback(async (page: number, search: string, lang: string) => {
    setVoicesLoading(true);
    try {
      const p = new URLSearchParams({ page: String(page), page_size: String(PAGE_SIZE), ...(search ? { title: search } : {}), ...(lang ? { language: lang } : {}) });
      const r = await fetch(`/api/tts/voices?${p}`);
      const d = await r.json() as { ok: boolean; voices: Voice[]; total: number; has_more?: boolean };
      if (d.ok) { setVoices(d.voices); setVoicesHasMore(d.has_more ?? d.voices.length === PAGE_SIZE); }
    } catch { /* silent */ } finally { setVoicesLoading(false); }
  }, []);

  useEffect(() => { fetchVoices(1, '', ''); }, [fetchVoices]);

  const handleGenerate = async () => {
    if (!text.trim()) { toast({ title: 'Write something first' }); return; }
    setGenerating(true);
    try {
      const res = await fetch('/api/tts/generate', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: text.trim(), format, speed, ...(selectedVoiceId ? { reference_id: selectedVoiceId } : {}) }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const name = `${text.slice(0, 14).toLowerCase().replace(/\s+/g, '-')}.${format}`;
      const dur = `0:${Math.max(8, Math.round(text.length / 15)).toString().padStart(2, '0')}`;
      setAudios(prev => [{ id: Date.now().toString(), url, name, voice: selectedVoiceName || 'Default', duration: dur }, ...prev]);
      toast({ title: 'Audio ready' });
    } catch (err) {
      toast({ title: 'Generation failed', description: String(err), variant: 'destructive' });
    } finally { setGenerating(false); }
  };

  return (
    <div style={{ padding:'clamp(16px,3vw,30px)', paddingBottom:80, maxWidth:1460, margin:'0 auto' }}>

      {/* Header */}
      <div className="vhead">
        <div>
          <h2>Text to Speech</h2>
          <p>Convert text to natural voice, clone any voice, or browse the voice library.</p>
        </div>
        <button
          className={`btn${showClone ? ' acc' : ' ghost'} sm`}
          onClick={() => setShowClone(v => !v)}
        >
          <svg style={{ width:15,height:15,fill:'none',stroke:'currentColor',strokeWidth:1.8 }} viewBox="0 0 24 24">
            <path d="M4 10v4M8 7v10M12 4v16M16 7v10M20 10v4"/>
            <path d="M20 4l-8 8-4-4"/>
          </svg>
          {showClone ? 'Hide Clone' : 'Clone Voice'}
        </button>
      </div>

      <div className="tts-layout" style={{ display:'grid', gridTemplateColumns:'380px 1fr', gap:18, alignItems:'start' }}>

        {/* ── Console panel ── */}
        <div className="ie-card" style={{ padding:20, display:'flex', flexDirection:'column', gap:18 }}>

          {/* Script */}
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            <span className="mic">Script</span>
            <textarea className="ie-inp" value={text} onChange={e => setText(e.target.value.slice(0,5000))}
              placeholder="Type or paste the text to speak…" style={{ minHeight:120 }} />
            <div style={{ display:'flex', justifyContent:'space-between', fontFamily:'var(--mono)', fontSize:10.5, color:'var(--mut)' }}>
              <span>{text.length} / 5000</span>
              <span>{Math.ceil(text.split(' ').length / 150)} min read</span>
            </div>
          </div>

          {/* Voice selector */}
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <span className="mic">Voice</span>
              <button onClick={() => setShowLibrary(v => !v)}
                style={{ background:'none', border:0, cursor:'pointer', fontFamily:'var(--mono)', fontSize:10.5, color:'var(--acc)', letterSpacing:'.08em' }}>
                {showLibrary ? 'HIDE LIBRARY' : 'BROWSE LIBRARY'}
              </button>
            </div>

            {/* Selected voice badge */}
            {selectedVoiceId ? (
              <div style={{ display:'flex', alignItems:'center', gap:8, border:'1px solid rgba(255,77,31,.35)', borderRadius:12, padding:'9px 12px', background:'var(--accsoft)' }}>
                <svg style={{ width:16,height:16,fill:'none',stroke:'var(--acc)',strokeWidth:1.8,flexShrink:0 }} viewBox="0 0 24 24"><path d="M4 10v4M8 7v10M12 4v16M16 7v10M20 10v4"/></svg>
                <span style={{ flex:1, fontSize:13.5, fontWeight:500, color:'var(--acc2)' }}>{selectedVoiceName}</span>
                <button onClick={() => { setSelectedVoiceId(''); setSelectedVoiceName(''); }}
                  style={{ background:'none', border:0, cursor:'pointer', color:'var(--mut)' }}>
                  <svg style={{ width:14,height:14,fill:'none',stroke:'currentColor',strokeWidth:1.8 }} viewBox="0 0 24 24"><path d="M6 6l12 12M18 6 6 18"/></svg>
                </button>
              </div>
            ) : (
              <div style={{ border:'1px dashed var(--line2)', borderRadius:12, padding:'9px 12px', fontFamily:'var(--mono)', fontSize:11, color:'var(--mut)', textAlign:'center' }}>
                No voice selected — default will be used
              </div>
            )}

            {/* Voice library */}
            <AnimatePresence>
              {showLibrary && (
                <motion.div initial={{ height:0, opacity:0 }} animate={{ height:'auto', opacity:1 }} exit={{ height:0, opacity:0 }}
                  style={{ overflow:'hidden' }}>
                  {/* Search row */}
                  <div style={{ display:'flex', gap:6, marginBottom:10 }}>
                    <input className="ie-inp" value={voicesSearch} onChange={e => setVoicesSearch(e.target.value)}
                      placeholder="Search voices…" style={{ flex:1, padding:'8px 10px', fontSize:13 }} />
                    <select className="ie-inp" value={voicesLang} onChange={e => setVoicesLang(e.target.value)} style={{ width:120, fontSize:12 }}>
                      {LANGS.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
                    </select>
                    <button className="ibtn" onClick={() => fetchVoices(1, voicesSearch, voicesLang)} aria-label="Search">
                      <svg style={{ width:15,height:15,fill:'none',stroke:'currentColor',strokeWidth:1.8 }} viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg>
                    </button>
                  </div>

                  {/* Voice grid */}
                  {voicesLoading ? (
                    <div style={{ textAlign:'center', padding:'20px 0' }}>
                      <div style={{ width:24,height:24,borderRadius:'50%',border:'2px solid var(--acc)',borderTopColor:'transparent',animation:'spin 1s linear infinite',margin:'0 auto' }} />
                    </div>
                  ) : (
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, maxHeight:280, overflowY:'auto', scrollbarWidth:'thin' }}>
                      {voices.map(v => (
                        <VoiceCard key={v._id} voice={v} selected={selectedVoiceId === v._id}
                          playingPreviewId={playingPreviewId}
                          onPreviewToggle={setPlayingPreviewId}
                          onSelect={() => { setSelectedVoiceId(v._id); setSelectedVoiceName(v.title); setShowLibrary(false); setPlayingPreviewId(null); }} />
                      ))}
                    </div>
                  )}

                  {/* Pagination */}
                  {(voicesHasMore || voicesPage > 1) && (
                    <div style={{ display:'flex', justifyContent:'space-between', marginTop:8 }}>
                      <button className="btn ghost sm" disabled={voicesPage === 1} onClick={() => { const p=voicesPage-1; setVoicesPage(p); fetchVoices(p, voicesSearch, voicesLang); }}>← Prev</button>
                      <button className="btn ghost sm" disabled={!voicesHasMore} onClick={() => { const p=voicesPage+1; setVoicesPage(p); fetchVoices(p, voicesSearch, voicesLang); }}>Next →</button>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Format + Speed */}
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            <div>
              <span className="mic" style={{ display:'block', marginBottom:8 }}>Format</span>
              <div style={{ display:'flex', gap:8 }}>
                {FORMATS.map(f => (
                  <button key={f} className={`chip${format===f?' on':''}`} onClick={() => setFormat(f)}
                    style={{ flex:1, textAlign:'center', textTransform:'uppercase' }}>
                    {f}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div style={{ display:'flex', justifyContent:'space-between' }}>
                <span className="mic">Speed</span>
                <span className="mic" style={{ color:'var(--acc)' }}>{speed.toFixed(1)}x</span>
              </div>
              <input type="range" min=".5" max="2" step=".1" value={speed}
                onChange={e => setSpeed(parseFloat(e.target.value))}
                style={{ width:'100%', accentColor:'var(--acc)', marginTop:4 }} />
              <div style={{ display:'flex', justifyContent:'space-between', fontFamily:'var(--mono)', fontSize:10, color:'var(--mut)', marginTop:2 }}>
                <span>0.5x</span><span>2x</span>
              </div>
            </div>
          </div>

          {/* Generate button */}
          <button className="btn acc" onClick={handleGenerate} disabled={!text.trim() || generating}
            style={{ width:'100%', padding:14, fontSize:15, fontWeight:700 }}>
            {generating
              ? <><div style={{ width:18,height:18,borderRadius:'50%',border:'2px solid rgba(255,255,255,.3)',borderTopColor:'#fff',animation:'spin 1s linear infinite' }} />Synthesizing…</>
              : <><svg style={{ width:18,height:18,fill:'none',stroke:'currentColor',strokeWidth:1.8 }} viewBox="0 0 24 24"><path d="M13 2 4 14h6l-1 8 9-12h-6z"/></svg>Synthesize voice</>
            }
          </button>
        </div>

        {/* ── Generated audio list ── */}
        <div>
          <h3 className="mic" style={{ marginBottom:12 }}>Generated audio</h3>

          {audios.length === 0 ? (
            <div style={{ border:'1px dashed var(--line2)', borderRadius:16, padding:'56px 30px', textAlign:'center', color:'var(--mut)' }}>
              <svg style={{ width:32,height:32,fill:'none',stroke:'currentColor',strokeWidth:1.8,margin:'0 auto 12px',display:'block',opacity:.3 }} viewBox="0 0 24 24">
                <path d="M4 10v4M8 7v10M12 4v16M16 7v10M20 10v4"/>
              </svg>
              <p style={{ fontSize:14 }}>No audio yet — synthesize something!</p>
            </div>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
              {audios.map(a => (
                <AudioCard key={a.id} url={a.url} name={a.name} voice={a.voice} duration={a.duration}
                  onDelete={() => setAudios(p => p.filter(x => x.id !== a.id))} />
              ))}
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes wv{from{height:18%}to{height:92%}}
        @media(max-width:1020px){.tts-layout{grid-template-columns:1fr!important}}
        @media(max-width:480px){.tts-meta{display:none!important}}
      `}</style>

      {/* ── Clone section (toggled) ── */}
      <AnimatePresence>
        {showClone && (
          <motion.div
            initial={{ opacity:0, y:12 }}
            animate={{ opacity:1, y:0 }}
            exit={{ opacity:0, y:8 }}
            transition={{ duration:.2 }}
          >
            <CloneSection onAudioReady={a => setAudios(prev => [a, ...prev])} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
