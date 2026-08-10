import { useState, useRef, useCallback, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';
import { useApp } from '@/components/providers/app-provider';
import { supabase } from '@/lib/supabase';

const TOOLS = [
  { id: 'select',  label: 'Select',  icon: 'M8 3H3v5M16 3h5v5M8 21H3v-5M16 21h5v-5' },
  { id: 'crop',    label: 'Crop',    icon: 'M6 2v16a2 2 0 0 0 2 2h14M2 6h16a2 2 0 0 1 2 2v14' },
  { id: 'brush',   label: 'Brush',   icon: 'M3 21c4 0 6-2 7-5l-4-4c-3 1-3 5-3 9zM10 12l8-9 3 3-9 8z' },
  { id: 'eraser',  label: 'Eraser',  icon: 'M16 3l5 5-11 11H5v-5zM4 21h16' },
  { id: 'text',    label: 'Text',    icon: 'M4 6V4h16v2M12 4v16M9 20h6' },
  { id: 'layers',  label: 'Layers',  icon: 'M12 3l9 5-9 5-9-5zM3 13l9 5 9-5' },
];

const FILTERS = ['None', 'Noir', 'Chrome', 'Fade', 'Ember'];
const ASPECT_OPTIONS = [
  { label: '1:1', w: 1024, h: 1024 },
  { label: '3:2', w: 1536, h: 1024 },
  { label: '2:3', w: 1024, h: 1536 },
  { label: '16:9', w: 1536, h: 864 },
  { label: '9:16', w: 864,  h: 1536 },
];

export function EditorView() {
  const { toast } = useToast();
  const { credits, deductCredits, editCost, isAdmin } = useApp();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [uploaded, setUploaded] = useState<string | null>(null);
  const [uploadedName, setUploadedName] = useState('');
  const [result, setResult] = useState<string | null>(null);
  const [prompt, setPrompt] = useState('');
  const [activeTool, setActiveTool] = useState('select');
  const [zoom, setZoom] = useState(100);
  const [dragging, setDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [activeFilter, setActiveFilter] = useState('None');
  const [lbOpen, setLbOpen] = useState(false);

  // Adjust sliders
  const [exp, setExp] = useState(0);
  const [con, setCon] = useState(0);
  const [sat, setSat] = useState(0);
  const [tmp, setTmp] = useState(0);

  // Mobile adjust panel
  const [adjustOpen, setAdjustOpen] = useState(false);

  // Allow custom size setting
  const [allowCustomSize, setAllowCustomSize] = useState(false);
  const [aspect, setAspect] = useState('1:1');
  useEffect(() => {
    supabase.from('feature_settings').select('config').eq('id', 'image_editor').maybeSingle()
      .then(({ data }) => {
        if (data?.config && typeof data.config === 'object') {
          setAllowCustomSize(!!(data.config as Record<string, unknown>).allow_custom_size);
        }
      });
  }, []);

  const currentRatio = ASPECT_OPTIONS.find(r => r.label === aspect) ?? ASPECT_OPTIONS[0];

  const handleFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast({ title: 'Invalid file', description: 'Upload an image file', variant: 'destructive' });
      return;
    }
    setUploadedName(file.name);
    const reader = new FileReader();
    reader.onload = e => { setUploaded(e.target?.result as string); setResult(null); };
    reader.readAsDataURL(file);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, []);

  const handleEdit = async () => {
    if (!uploaded || !prompt.trim()) return;
    if (!isAdmin && credits < editCost) {
      toast({ title: 'Insufficient credits', variant: 'destructive' }); return;
    }
    setIsLoading(true); setResult(null);
    try {
      const res = await fetch('/api/edit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: prompt, imageUrl: uploaded, width: currentRatio.w, height: currentRatio.h }),
      });
      const data = await res.json() as { ok: boolean; imageUrl?: string; imageData?: string; error?: string };
      if (!data.ok) { toast({ title: 'Edit failed', description: data.error, variant: 'destructive' }); return; }
      deductCredits(editCost);
      if (data.imageData) setResult(`data:image/png;base64,${data.imageData}`);
      else if (data.imageUrl) setResult(data.imageUrl);
      toast({ title: 'Image edited' });
    } catch (err) {
      toast({ title: 'Error', description: String(err), variant: 'destructive' });
    } finally { setIsLoading(false); }
  };

  const imgFilter = `brightness(${100 + exp * 0.3}%) contrast(${100 + con * 0.4}%) saturate(${100 + sat * 0.6}%) sepia(${Math.max(0, tmp) * 0.3}%) hue-rotate(${Math.min(0, tmp) * 0.2}deg)`;

  const displayImg = result ?? uploaded;

  return (
    <div style={{ padding: 'clamp(16px,3vw,30px)', paddingBottom: 50, maxWidth: 1460, margin: '0 auto' }}>

      {/* ── Top bar ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 14 }}>
        <span className="mic" style={{ marginRight: 'auto' }}>
          {uploadedName || 'No file selected'}{displayImg ? ' · 1024×1024' : ''}
        </span>
        <button className="ibtn" onClick={() => toast({ title: 'Undo' })} aria-label="Undo">
          <svg style={{ width:16,height:16,fill:'none',stroke:'currentColor',strokeWidth:1.8 }} viewBox="0 0 24 24">
            <path d="M9 14 4 9l5-5M4 9h10a6 6 0 0 1 0 12h-3"/>
          </svg>
        </button>
        <button className="ibtn" onClick={() => toast({ title: 'Redo' })} aria-label="Redo">
          <svg style={{ width:16,height:16,fill:'none',stroke:'currentColor',strokeWidth:1.8 }} viewBox="0 0 24 24">
            <path d="M15 14l5-5-5-5M20 9H10a6 6 0 0 0 0 12h3"/>
          </svg>
        </button>
        <button className="ibtn" onClick={() => setZoom(z => Math.max(40, z - 10))} aria-label="Zoom out">
          <svg style={{ width:16,height:16,fill:'none',stroke:'currentColor',strokeWidth:1.8 }} viewBox="0 0 24 24"><path d="M5 12h14"/></svg>
        </button>
        <span className="mic" style={{ minWidth: 44, textAlign: 'center' }}>{zoom}%</span>
        <button className="ibtn" onClick={() => setZoom(z => Math.min(200, z + 10))} aria-label="Zoom in">
          <svg style={{ width:16,height:16,fill:'none',stroke:'currentColor',strokeWidth:1.8 }} viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>
        </button>
        {displayImg && (
          <a href={displayImg} download={`edited-${Date.now()}.png`} className="btn ink sm">
            <svg style={{ width:15,height:15,fill:'none',stroke:'currentColor',strokeWidth:1.8 }} viewBox="0 0 24 24">
              <path d="M12 3v12M7 10l5 5 5-5M4 21h16"/>
            </svg>
            Export
          </a>
        )}
      </div>

      {/* ── Editor layout ── */}
      <div className="ed-layout" style={{ display: 'grid', gridTemplateColumns: '56px 1fr 292px', gap: 14, alignItems: 'start' }}>

        {/* Tools column */}
        <div style={{
          display: 'flex', flexDirection: 'column', gap: 8,
          background: 'var(--dark)', border: '1px solid var(--dline)',
          borderRadius: 14, padding: 8,
        }}>
          {TOOLS.map(tool => (
            <button
              key={tool.id}
              className={`ibtn d${activeTool === tool.id ? ' on' : ''}`}
              onClick={() => { setActiveTool(tool.id); toast({ title: `${tool.label} tool` }); }}
              aria-label={tool.label}
              title={tool.label}
            >
              <svg style={{ width:16,height:16,fill:'none',stroke:'currentColor',strokeWidth:1.8 }} viewBox="0 0 24 24">
                <path d={tool.icon}/>
              </svg>
            </button>
          ))}
        </div>

        {/* Canvas */}
        <div
          style={{
            background: 'var(--dark)', border: '1px solid var(--dline)',
            borderRadius: 'var(--r2)', minHeight: 520,
            display: 'grid', placeItems: 'center',
            padding: 26, overflow: 'hidden', position: 'relative',
            backgroundImage: 'linear-gradient(rgba(255,255,255,.045) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.045) 1px,transparent 1px)',
            backgroundSize: '34px 34px',
          }}
          onDragOver={e => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
        >
          {isLoading && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, color: 'var(--dtext)' }}>
              <div style={{
                width: 48, height: 48, borderRadius: '50%',
                border: '2px solid transparent', borderTopColor: 'var(--acc)', borderRightColor: 'var(--acc)',
                animation: 'spin 1s linear infinite',
              }} />
              <span className="mic d">PROCESSING EDIT…</span>
            </div>
          )}

          {!isLoading && !displayImg && (
            <div
              onClick={() => fileInputRef.current?.click()}
              style={{
                border: `1px dashed ${dragging ? 'var(--acc)' : 'var(--dline)'}`,
                borderRadius: 16, padding: '56px 30px',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14,
                cursor: 'pointer', transition: '.2s', maxWidth: 440, textAlign: 'center',
              }}
            >
              <svg style={{ width:34,height:34,fill:'none',stroke:'var(--acc)',strokeWidth:1.8 }} viewBox="0 0 24 24">
                <path d="M12 21V9M7 14l5-5 5 5M4 3h16"/>
              </svg>
              <h4 style={{ fontSize: 17, fontWeight: 500, color: 'var(--dtext)' }}>Drop an image here</h4>
              <p style={{ color: 'var(--dmut)', fontSize: 13.5 }}>or click to upload — PNG, JPG, WEBP supported</p>
              <button className="btn dark sm">Choose file</button>
            </div>
          )}

          {!isLoading && displayImg && (
            <img
              src={displayImg}
              alt="Canvas"
              onClick={() => setLbOpen(true)}
              style={{
                maxHeight: '58vh', borderRadius: 8,
                boxShadow: '0 24px 70px rgba(0,0,0,.55)',
                transform: `scale(${zoom / 100})`,
                filter: imgFilter,
                transition: 'transform .25s, filter .25s',
                cursor: 'zoom-in',
                position: 'relative',
              }}
            />
          )}

          <input
            ref={fileInputRef}
            type="file" accept="image/*" className="hidden"
            onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])}
          />
        </div>

        {/* Adjust panel (desktop) */}
        <div className="ie-card" style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 16 }}>

          <span className="mic">Adjustments</span>

          {/* Edit prompt */}
          {uploaded && (
            <div style={{ display: 'grid', gap: 8 }}>
              <label style={{ fontSize: 13, fontWeight: 500 }}>Edit Prompt</label>
              <textarea
                className="ie-inp"
                value={prompt}
                onChange={e => setPrompt(e.target.value)}
                placeholder="Describe the edit…"
                style={{ minHeight: 72 }}
              />
              <button
                className="btn acc"
                disabled={!prompt.trim() || isLoading || (!isAdmin && credits < editCost)}
                onClick={handleEdit}
                style={{ width: '100%' }}
              >
                <svg style={{ width:15,height:15,fill:'none',stroke:'currentColor',strokeWidth:1.8 }} viewBox="0 0 24 24">
                  <path d="M4 20l4-1L19 8l-3-3L5 16z"/><path d="M13 6l3 3"/>
                </svg>
                {isLoading ? 'Editing…' : 'Apply Edit'}
              </button>
            </div>
          )}

          {/* Sliders */}
          {[
            { label: 'EXPOSURE',    val: exp, set: setExp },
            { label: 'CONTRAST',    val: con, set: setCon },
            { label: 'SATURATION',  val: sat, set: setSat },
            { label: 'TEMPERATURE', val: tmp, set: setTmp },
          ].map(({ label, val, set }) => (
            <div key={label} style={{ display: 'grid', gap: 6 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span className="mic">{label}</span>
                <span className="mic">{val}</span>
              </div>
              <input
                type="range" min="-100" max="100" value={val}
                onChange={e => set(+e.target.value)}
                style={{ width: '100%', accentColor: 'var(--acc)' }}
              />
            </div>
          ))}

          {/* Filters */}
          <div>
            <span className="mic" style={{ display: 'block', marginBottom: 8 }}>Filters</span>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {FILTERS.map(f => (
                <button
                  key={f}
                  className={`chip${activeFilter === f ? ' on' : ''}`}
                  onClick={() => { setActiveFilter(f); toast({ title: `${f} filter` }); }}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          {/* Upscale */}
          <button
            className="btn acc"
            onClick={() => toast({ title: 'AI Upscale running — ×2' })}
            style={{ width: '100%' }}
          >
            <svg style={{ width:15,height:15,fill:'none',stroke:'currentColor',strokeWidth:1.8 }} viewBox="0 0 24 24">
              <path d="M13 2 4 14h6l-1 8 9-12h-6z"/>
            </svg>
            AI Upscale ×2
          </button>
        </div>
      </div>

      {/* Mobile adjust fab */}
      <button
        className="btn acc"
        onClick={() => setAdjustOpen(true)}
        style={{
          position: 'fixed', right: 16, bottom: 86, zIndex: 70,
          boxShadow: '0 12px 30px rgba(255,77,31,.4)',
          display: 'none',
        }}
        id="adjustFab"
      >
        <svg style={{ width:16,height:16,fill:'none',stroke:'currentColor',strokeWidth:1.8 }} viewBox="0 0 24 24">
          <path d="M4 8h10M18 8h2M16 6v4M4 16h2M10 16h10M8 14v4"/>
        </svg>
        Adjust
      </button>

      {/* Lightbox */}
      <AnimatePresence>
        {lbOpen && displayImg && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setLbOpen(false)}
            style={{
              position: 'fixed', inset: 0, zIndex: 110,
              background: 'rgba(20,19,16,.9)', backdropFilter: 'blur(4px)',
              display: 'grid', placeItems: 'center', padding: 18,
            }}
          >
            <button className="ibtn d" onClick={() => setLbOpen(false)}
              style={{ position: 'absolute', top: 14, right: 14 }}>
              <svg style={{ width:16,height:16,fill:'none',stroke:'currentColor',strokeWidth:1.8 }} viewBox="0 0 24 24">
                <path d="M6 6l12 12M18 6 6 18"/>
              </svg>
            </button>
            <motion.img
              initial={{ scale: 0.92, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.92, opacity: 0 }}
              src={displayImg} alt="Preview"
              onClick={e => e.stopPropagation()}
              style={{ maxHeight: '80vh', maxWidth: '90vw', borderRadius: 12, objectFit: 'contain' }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (max-width: 1080px) {
          .ed-layout { grid-template-columns: 56px 1fr !important; }
          #adjustFab { display: inline-flex !important; }
        }
        @media (max-width: 640px) {
          .ed-layout { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
