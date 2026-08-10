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
  { label: '1:1',  w: 1024, h: 1024 },
  { label: '3:2',  w: 1536, h: 1024 },
  { label: '2:3',  w: 1024, h: 1536 },
  { label: '16:9', w: 1536, h: 864  },
  { label: '9:16', w: 864,  h: 1536 },
];

export function EditorView() {
  const { toast } = useToast();
  const { credits, deductCredits, editCost, isAdmin } = useApp();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [uploaded, setUploaded]           = useState<string | null>(null);
  const [uploadedName, setUploadedName]   = useState('');
  const [result, setResult]               = useState<string | null>(null);
  const [prompt, setPrompt]               = useState('');
  const [activeTool, setActiveTool]       = useState('select');
  const [zoom, setZoom]                   = useState(100);
  const [dragging, setDragging]           = useState(false);
  const [isLoading, setIsLoading]         = useState(false);
  const [activeFilter, setActiveFilter]   = useState('None');
  const [lbOpen, setLbOpen]               = useState(false);
  const [aspect, setAspect]               = useState('1:1');
  const [panelOpen, setPanelOpen]         = useState(false); // mobile panel

  const [exp, setExp] = useState(0);
  const [con, setCon] = useState(0);
  const [sat, setSat] = useState(0);
  const [tmp, setTmp] = useState(0);

  const [allowCustomSize, setAllowCustomSize] = useState(false);
  useEffect(() => {
    supabase.from('feature_settings').select('config').eq('id', 'image_editor').maybeSingle()
      .then(({ data }) => {
        if (data?.config && typeof data.config === 'object')
          setAllowCustomSize(!!(data.config as Record<string, unknown>).allow_custom_size);
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
    if (!uploaded)      { toast({ title: 'Upload an image first' }); return; }
    if (!prompt.trim()) { toast({ title: 'Add a prompt first' }); return; }
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
      toast({ title: 'Image edited!' });
      setPanelOpen(false);
    } catch (err) {
      toast({ title: 'Error', description: String(err), variant: 'destructive' });
    } finally { setIsLoading(false); }
  };

  const imgFilter = `brightness(${100+exp*0.3}%) contrast(${100+con*0.4}%) saturate(${100+sat*0.6}%) sepia(${Math.max(0,tmp)*0.3}%) hue-rotate(${Math.min(0,tmp)*0.2}deg)`;
  const displayImg = result ?? uploaded;

  return (
    <div style={{ padding: 'clamp(12px,2vw,24px)', paddingBottom: 80, maxWidth: 1460, margin: '0 auto' }}>

      {/* ══ TOP BAR ══ */}
      <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'nowrap', marginBottom:14, overflowX:'auto' }}>
        {/* File name */}
        <span className="mic" style={{ flex:1, minWidth:0, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
          {uploadedName || 'No file selected'}
        </span>

        {/* Upload btn — always visible */}
        <button className="btn ghost sm" onClick={() => fileInputRef.current?.click()} style={{ flexShrink:0 }}>
          <svg style={{ width:14,height:14,fill:'none',stroke:'currentColor',strokeWidth:1.8 }} viewBox="0 0 24 24">
            <path d="M12 21V9M7 14l5-5 5 5M4 3h16"/>
          </svg>
          <span className="ed-show-sm">Upload</span>
        </button>

        {/* Zoom */}
        <button className="ibtn" onClick={() => setZoom(z=>Math.max(40,z-10))} aria-label="Zoom out">
          <svg style={{ width:15,height:15,fill:'none',stroke:'currentColor',strokeWidth:1.8 }} viewBox="0 0 24 24"><path d="M5 12h14"/></svg>
        </button>
        <span className="mic" style={{ minWidth:38, textAlign:'center', flexShrink:0 }}>{zoom}%</span>
        <button className="ibtn" onClick={() => setZoom(z=>Math.min(200,z+10))} aria-label="Zoom in">
          <svg style={{ width:15,height:15,fill:'none',stroke:'currentColor',strokeWidth:1.8 }} viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>
        </button>

        {/* Export */}
        {displayImg && (
          <a href={displayImg} download={`edited-${Date.now()}.png`} className="btn ink sm" style={{ flexShrink:0 }}>
            <svg style={{ width:14,height:14,fill:'none',stroke:'currentColor',strokeWidth:1.8 }} viewBox="0 0 24 24">
              <path d="M12 3v12M7 10l5 5 5-5M4 21h16"/>
            </svg>
            <span className="ed-show-sm">Export</span>
          </a>
        )}
      </div>

      {/* ══ MOBILE: prompt + edit button (above canvas) ══ */}
      <div className="ed-mobile-prompt">
        <textarea
          className="ie-inp"
          value={prompt}
          onChange={e => setPrompt(e.target.value)}
          placeholder='Describe the edit… e.g. "add sunset sky", "remove background"'
          rows={2}
          style={{ resize:'none', marginBottom:8 }}
        />
        <button
          className="btn acc"
          disabled={!uploaded || !prompt.trim() || isLoading || (!isAdmin && credits < editCost)}
          onClick={handleEdit}
          style={{ width:'100%', padding:13, fontSize:15, fontWeight:700 }}
        >
          {isLoading
            ? <><div className="ed-spinner" />Editing…</>
            : <>
                <svg style={{ width:16,height:16,fill:'none',stroke:'currentColor',strokeWidth:1.8 }} viewBox="0 0 24 24">
                  <path d="M4 20l4-1L19 8l-3-3L5 16z"/><path d="M13 6l3 3"/>
                </svg>
                Apply Edit
              </>
          }
        </button>
      </div>

      {/* ══ 3-COLUMN LAYOUT (desktop) / STACKED (mobile) ══ */}
      <div className="ed-layout">

        {/* ── Tools rail ── */}
        <div className="ed-tools">
          {TOOLS.map(tool => (
            <button key={tool.id}
              className={`ibtn d${activeTool===tool.id?' on':''}`}
              onClick={() => { setActiveTool(tool.id); toast({ title:`${tool.label} tool` }); }}
              aria-label={tool.label} title={tool.label}
            >
              <svg style={{ width:16,height:16,fill:'none',stroke:'currentColor',strokeWidth:1.8 }} viewBox="0 0 24 24">
                <path d={tool.icon}/>
              </svg>
            </button>
          ))}
        </div>

        {/* ── Canvas ── */}
        <div
          className="ed-canvas"
          onDragOver={e=>{ e.preventDefault(); setDragging(true); }}
          onDragLeave={()=>setDragging(false)}
          onDrop={handleDrop}
          style={{ border:`1px solid ${dragging?'var(--acc)':'var(--dline)'}` }}
        >
          {/* Loading */}
          {isLoading && (
            <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:16 }}>
              <div className="ed-spinner" style={{ width:48, height:48 }} />
              <span className="mic d">PROCESSING EDIT…</span>
            </div>
          )}

          {/* Empty */}
          {!isLoading && !displayImg && (
            <div onClick={() => fileInputRef.current?.click()} className="ed-drop-zone"
              style={{ borderColor: dragging?'var(--acc)':'var(--dline)' }}>
              <svg style={{ width:34,height:34,fill:'none',stroke:'var(--acc)',strokeWidth:1.8 }} viewBox="0 0 24 24">
                <path d="M12 21V9M7 14l5-5 5 5M4 3h16"/>
              </svg>
              <h4 style={{ fontSize:17, fontWeight:500, color:'var(--dtext)' }}>Drop an image here</h4>
              <p style={{ color:'var(--dmut)', fontSize:13.5 }}>or click — PNG, JPG, WEBP</p>
              <button className="btn dark sm" type="button">Choose file</button>
            </div>
          )}

          {/* Image */}
          {!isLoading && displayImg && (
            <>
              <img src={displayImg} alt="Canvas" onClick={() => setLbOpen(true)}
                style={{
                  maxHeight:'55vh', maxWidth:'100%', borderRadius:8,
                  boxShadow:'0 24px 70px rgba(0,0,0,.55)',
                  transform:`scale(${zoom/100})`,
                  filter:imgFilter,
                  transition:'transform .25s, filter .25s',
                  cursor:'zoom-in', position:'relative',
                }}
              />
              <button onClick={() => fileInputRef.current?.click()}
                style={{
                  position:'absolute', bottom:14, left:'50%', translate:'-50% 0',
                  background:'rgba(20,19,16,.7)', border:'1px solid var(--dline)',
                  color:'var(--dmut)', borderRadius:10, padding:'6px 14px',
                  fontFamily:'var(--mono)', fontSize:11, cursor:'pointer',
                  backdropFilter:'blur(6px)', letterSpacing:'.08em',
                }}>
                CHANGE IMAGE
              </button>
            </>
          )}

          <input ref={fileInputRef} type="file" accept="image/*" style={{ display:'none' }}
            onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
        </div>

        {/* ── Right panel (desktop only) ── */}
        <div className="ie-card ed-panel">
          <div style={{ display:'grid', gap:8 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <span className="mic">Edit Prompt</span>
              {!uploaded && <span className="mic" style={{ color:'var(--err)', fontSize:9 }}>upload first</span>}
            </div>
            <textarea className="ie-inp" value={prompt} onChange={e=>setPrompt(e.target.value)}
              placeholder='e.g. "add sunset sky background"'
              style={{ minHeight:88, resize:'vertical' }} />

            {!uploaded && (
              <button className="btn ghost sm" type="button" onClick={() => fileInputRef.current?.click()} style={{ width:'100%' }}>
                <svg style={{ width:14,height:14,fill:'none',stroke:'currentColor',strokeWidth:1.8 }} viewBox="0 0 24 24"><path d="M12 21V9M7 14l5-5 5 5M4 3h16"/></svg>
                Upload Image
              </button>
            )}

            <button className="btn acc"
              disabled={!uploaded || !prompt.trim() || isLoading || (!isAdmin && credits < editCost)}
              onClick={handleEdit}
              style={{ width:'100%', padding:13, fontSize:15, fontWeight:700 }}>
              {isLoading
                ? <><div className="ed-spinner" />Editing…</>
                : <>
                    <svg style={{ width:16,height:16,fill:'none',stroke:'currentColor',strokeWidth:1.8 }} viewBox="0 0 24 24">
                      <path d="M4 20l4-1L19 8l-3-3L5 16z"/><path d="M13 6l3 3"/>
                    </svg>
                    Apply Edit{editCost>0 && !isAdmin && <span style={{ fontSize:11, opacity:.7, marginLeft:4 }}>({editCost} cr)</span>}
                  </>
              }
            </button>

            {result && (
              <button className="btn ghost sm" type="button" style={{ width:'100%' }}
                onClick={() => { setUploaded(result); setResult(null); setPrompt(''); }}>
                <svg style={{ width:14,height:14,fill:'none',stroke:'currentColor',strokeWidth:1.8 }} viewBox="0 0 24 24"><path d="M21 3v6h-6"/><path d="M20.5 9A8.5 8.5 0 1 0 21 12"/></svg>
                Re-edit result
              </button>
            )}
          </div>

          <div style={{ borderTop:'1px dashed var(--line2)', paddingTop:14, display:'grid', gap:14, marginTop:4 }}>
            <span className="mic">Adjustments</span>
            {[
              { label:'EXPOSURE',   val:exp, set:setExp },
              { label:'CONTRAST',   val:con, set:setCon },
              { label:'SATURATION', val:sat, set:setSat },
              { label:'TEMP',       val:tmp, set:setTmp },
            ].map(({ label, val, set }) => (
              <div key={label} style={{ display:'grid', gap:4 }}>
                <div style={{ display:'flex', justifyContent:'space-between' }}>
                  <span className="mic">{label}</span>
                  <span className="mic">{val}</span>
                </div>
                <input type="range" min="-100" max="100" value={val}
                  onChange={e=>set(+e.target.value)}
                  style={{ width:'100%', accentColor:'var(--acc)' }} />
              </div>
            ))}

            <div>
              <span className="mic" style={{ display:'block', marginBottom:8 }}>Filters</span>
              <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                {FILTERS.map(f => (
                  <button key={f} className={`chip${activeFilter===f?' on':''}`}
                    onClick={() => { setActiveFilter(f); toast({ title:`${f} filter` }); }}>
                    {f}
                  </button>
                ))}
              </div>
            </div>

            <button className="btn acc" onClick={() => toast({ title:'AI Upscale ×2' })} style={{ width:'100%' }}>
              <svg style={{ width:15,height:15,fill:'none',stroke:'currentColor',strokeWidth:1.8 }} viewBox="0 0 24 24"><path d="M13 2 4 14h6l-1 8 9-12h-6z"/></svg>
              AI Upscale ×2
            </button>
          </div>
        </div>
      </div>

      {/* ══ MOBILE: Adjustments FAB + Sheet ══ */}
      <button className="ed-adj-fab btn acc" onClick={() => setPanelOpen(true)}>
        <svg style={{ width:16,height:16,fill:'none',stroke:'currentColor',strokeWidth:1.8 }} viewBox="0 0 24 24">
          <path d="M4 8h10M18 8h2M16 6v4M4 16h2M10 16h10M8 14v4"/>
        </svg>
        Adjustments
      </button>

      {/* Mobile bottom sheet */}
      <AnimatePresence>
        {panelOpen && (
          <>
            <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
              onClick={() => setPanelOpen(false)}
              style={{ position:'fixed',inset:0,zIndex:80,background:'rgba(20,19,16,.45)',backdropFilter:'blur(3px)' }} />
            <motion.div
              initial={{ y:'100%' }} animate={{ y:0 }} exit={{ y:'100%' }}
              transition={{ type:'spring', stiffness:320, damping:30 }}
              style={{
                position:'fixed', left:0, right:0, bottom:0, zIndex:90,
                background:'var(--card)', borderRadius:'20px 20px 0 0',
                borderTop:'1px solid var(--line)',
                padding:'14px 18px 32px', maxHeight:'78vh', overflowY:'auto',
              }}>
              <div style={{ width:44,height:5,borderRadius:99,background:'var(--line2)',margin:'0 auto 16px' }} />
              <h3 style={{ fontSize:16, fontWeight:700, marginBottom:14 }}>Adjustments</h3>

              {[
                { label:'EXPOSURE',   val:exp, set:setExp },
                { label:'CONTRAST',   val:con, set:setCon },
                { label:'SATURATION', val:sat, set:setSat },
                { label:'TEMP',       val:tmp, set:setTmp },
              ].map(({ label, val, set }) => (
                <div key={label} style={{ marginBottom:14 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                    <span className="mic">{label}</span>
                    <span className="mic">{val}</span>
                  </div>
                  <input type="range" min="-100" max="100" value={val}
                    onChange={e=>set(+e.target.value)}
                    style={{ width:'100%', accentColor:'var(--acc)' }} />
                </div>
              ))}

              <div style={{ marginBottom:14 }}>
                <span className="mic" style={{ display:'block', marginBottom:8 }}>Filters</span>
                <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                  {FILTERS.map(f => (
                    <button key={f} className={`chip${activeFilter===f?' on':''}`}
                      onClick={() => setActiveFilter(f)}>{f}</button>
                  ))}
                </div>
              </div>

              <button className="btn acc" onClick={() => { toast({ title:'AI Upscale ×2' }); setPanelOpen(false); }}
                style={{ width:'100%', marginBottom:10 }}>
                <svg style={{ width:15,height:15,fill:'none',stroke:'currentColor',strokeWidth:1.8 }} viewBox="0 0 24 24"><path d="M13 2 4 14h6l-1 8 9-12h-6z"/></svg>
                AI Upscale ×2
              </button>
              <button className="btn ghost sm" onClick={() => setPanelOpen(false)} style={{ width:'100%' }}>Close</button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Lightbox */}
      <AnimatePresence>
        {lbOpen && displayImg && (
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
            onClick={() => setLbOpen(false)}
            style={{ position:'fixed',inset:0,zIndex:110,background:'rgba(20,19,16,.92)',backdropFilter:'blur(4px)',display:'grid',placeItems:'center',padding:18 }}>
            <button className="ibtn d" onClick={()=>setLbOpen(false)}
              style={{ position:'absolute',top:14,right:14 }}>
              <svg style={{ width:16,height:16,fill:'none',stroke:'currentColor',strokeWidth:1.8 }} viewBox="0 0 24 24"><path d="M6 6l12 12M18 6 6 18"/></svg>
            </button>
            <motion.img initial={{ scale:.92,opacity:0 }} animate={{ scale:1,opacity:1 }} exit={{ scale:.92,opacity:0 }}
              src={displayImg} alt="Preview" onClick={e=>e.stopPropagation()}
              style={{ maxHeight:'82vh',maxWidth:'92vw',borderRadius:12,objectFit:'contain' }} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ════ RESPONSIVE CSS ════ */}
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }

        .ed-spinner {
          display: inline-block;
          width: 18px; height: 18px;
          border-radius: 50%;
          border: 2px solid rgba(255,255,255,.3);
          border-top-color: #fff;
          animation: spin 1s linear infinite;
          flex-shrink: 0;
        }

        .ed-drop-zone {
          border: 1px dashed var(--dline);
          border-radius: 16px;
          padding: 48px 24px;
          display: flex; flex-direction: column;
          align-items: center; gap: 12px;
          cursor: pointer; max-width: 420px;
          text-align: center; transition: .2s;
        }
        .ed-drop-zone:hover { border-color: var(--acc); }

        /* ── Desktop 3-col ── */
        .ed-layout {
          display: grid;
          grid-template-columns: 56px 1fr 280px;
          gap: 14px;
          align-items: start;
        }
        .ed-tools {
          display: flex; flex-direction: column; gap: 8px;
          background: var(--dark); border: 1px solid var(--dline);
          border-radius: 14px; padding: 8px;
        }
        .ed-canvas {
          background: var(--dark); border-radius: var(--r2);
          min-height: 480px; display: grid; place-items: center;
          padding: 24px; overflow: hidden; position: relative;
          background-image:
            linear-gradient(rgba(255,255,255,.045) 1px,transparent 1px),
            linear-gradient(90deg,rgba(255,255,255,.045) 1px,transparent 1px);
          background-size: 34px 34px;
        }
        .ed-panel { padding: 18px; display: flex; flex-direction: column; gap: 16px; }
        .ed-mobile-prompt { display: none; }
        .ed-adj-fab { display: none; }
        .ed-show-sm { display: inline; }

        /* ── Tablet: hide right panel, show FAB ── */
        @media (max-width: 1080px) {
          .ed-layout { grid-template-columns: 56px 1fr; }
          .ed-panel { display: none; }
          .ed-adj-fab {
            display: inline-flex !important;
            position: fixed; right: 16px; bottom: 90px; z-index: 70;
            box-shadow: 0 12px 30px rgba(255,77,31,.4);
          }
          .ed-mobile-prompt { display: block; margin-bottom: 12px; }
        }

        /* ── Mobile: tools go horizontal, canvas fills width ── */
        @media (max-width: 640px) {
          .ed-layout { grid-template-columns: 1fr; gap: 10px; }
          .ed-tools {
            flex-direction: row; overflow-x: auto;
            padding: 8px; gap: 6px;
            scrollbar-width: none;
          }
          .ed-tools::-webkit-scrollbar { display: none; }
          .ed-canvas { min-height: 280px; padding: 16px; }
          .ed-show-sm { display: none; }
          .ed-adj-fab { bottom: 80px; right: 12px; }
          .ed-drop-zone { padding: 32px 16px; }
        }
      `}</style>
    </div>
  );
}
