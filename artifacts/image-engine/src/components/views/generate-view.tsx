import { useState, useRef, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';
import { useApp } from '@/components/providers/app-provider';
import { supabase } from '@/lib/supabase';
import { PROMPT_TEMPLATES, ASPECT_RATIOS, SAMPLERS } from '@/lib/mock-data';
import { GeneratingOverlay } from '@/components/ui/generating-overlay';

interface ImageProvider {
  id: string;
  name: string;
  model_name: string;
  provider_type: string;
  base_url: string;
  api_key: string;
  is_default?: boolean;
}

const SURPRISE_PROMPTS = [
  'A crystal city above the clouds at golden hour, glass spires, cinematic haze',
  'Portrait made of flowing indigo watercolor and gold leaf, black backdrop',
  'Isometric miniature café, pastel palette, tiny cat on the window seat',
  'Astronaut in black dunes under a giant orange sun, anamorphic film still',
  'Bioluminescent deep-sea forest, ethereal jellyfish, wide angle shot',
  'Neo-Tokyo alley at rain, neon reflections, volumetric fog, cinematic',
];

const STAGES = [
  'PARSING PROMPT',
  'ENCODING CONDITIONING',
  'DIFFUSING LATENTS',
  'DECODING IMAGE',
  'UPSCALING & FINISHING',
];

export function GenerateView() {
  const {
    prompt, setPrompt,
    negativePrompt, setNegativePrompt,
    aspectRatio, setAspectRatio,
    steps, setSteps,
    cfgScale, setCfgScale,
    sampler, setSampler,
    batchCount, setBatchCount,
    credits, deductCredits, generateCost, isAdmin,
  } = useApp();
  const { toast } = useToast();

  const [providers, setProviders] = useState<ImageProvider[]>([]);
  const [selectedProvider, setSelectedProvider] = useState('');
  const [stylePreset, setStylePreset] = useState('None');
  const [advOpen, setAdvOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [stage, setStage] = useState('');
  const [genProgress, setGenProgress] = useState<number | null>(null);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [lbOpen, setLbOpen] = useState(false);
  const stageTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const elapsedTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTime = useRef<number>(0);

  useEffect(() => {
    fetch('/api/image-providers')
      .then(r => r.json())
      .then((d: { ok: boolean; providers: ImageProvider[] }) => {
        if (d.ok && d.providers.length > 0) {
          setProviders(d.providers);
          const def = d.providers.find(p => p.is_default) ?? d.providers[0];
          setSelectedProvider(def.id);
        }
      })
      .catch(() => {});
  }, []);

  const currentRatio = ASPECT_RATIOS.find(r => r.value === aspectRatio) ?? ASPECT_RATIOS[0];
  const prov = providers.find(p => p.id === selectedProvider);

  const handleGenerate = async () => {
    if (!prompt.trim()) { toast({ title: 'Prompt required' }); return; }
    if (!prov) { toast({ title: 'No model selected', description: 'Add a provider from Admin → Image Providers' }); return; }
    if (!isAdmin && credits < generateCost) {
      toast({ title: 'Insufficient credits', variant: 'destructive' }); return;
    }

    setIsLoading(true);
    setGeneratedImage(null);
    setGenProgress(null);

    // Elapsed timer handled internally by GeneratingOverlay

    let si = 0;
    setStage(STAGES[0]);
    stageTimer.current = setInterval(() => {
      si++;
      if (si < STAGES.length) {
        setStage(STAGES[si]);
        setGenProgress(Math.round((si / STAGES.length) * 90));
      }
    }, 700);

    try {
      const res = await fetch('/api/image-providers/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider_type: prov.provider_type,
          base_url: prov.base_url,
          api_key: prov.api_key,
          model: prov.model_name,
          prompt: prompt.trim(),
          width: currentRatio.w,
          height: currentRatio.h,
        }),
      });
      const data = await res.json() as { ok: boolean; imageUrl?: string; error?: string };
      if (!data.ok || !data.imageUrl) {
        toast({ title: 'Generation failed', description: data.error, variant: 'destructive' });
        return;
      }
      setGeneratedImage(data.imageUrl);
      setGenProgress(100);
      deductCredits(generateCost);
      toast({ title: `Image generated` });
      await supabase.from('generation_jobs').insert({
        prompt: prompt.trim(), model: prov.model_name || prov.name,
        status: 'complete', progress: 100, image_url: data.imageUrl,
        started_at: new Date().toISOString(), completed_at: new Date().toISOString(),
        eta_seconds: 0, error_message: '', current_node: '',
      });
    } catch (err) {
      toast({ title: 'Error', description: String(err), variant: 'destructive' });
    } finally {
      if (stageTimer.current) clearInterval(stageTimer.current);
      setIsLoading(false);
      setStage('');
      setGenProgress(null);
    }
  };

  const STYLES = ['None', 'Cinematic', 'Photo', 'Anime', '3D Render'];
  const ASPECTS = ['1:1', '3:4', '4:3', '16:9', '9:16'];

  return (
    <div style={{ padding: 'clamp(16px,3vw,30px)', paddingBottom: 50, maxWidth: 1460, margin: '0 auto' }}>
      <div className="gen-layout" style={{ display: 'grid', gridTemplateColumns: '380px 1fr', gap: 18, alignItems: 'start' }}>

        {/* ── Console panel ── */}
        <div className="ie-card" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 18, position: 'sticky', top: 86 }}>

          {/* Prompt */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="mic">Prompt</span>
              <span className="mic">{prompt.length} / 800</span>
            </div>
            <textarea
              className="ie-inp"
              maxLength={800}
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              placeholder="Describe the image you want to create. Style, lighting, lens, mood…"
              style={{ minHeight: 96 }}
            />
            <button
              onClick={() => setPrompt(SURPRISE_PROMPTS[Math.floor(Math.random() * SURPRISE_PROMPTS.length)])}
              style={{
                alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: 6,
                background: 'none', border: '1px solid var(--line2)', borderRadius: 10,
                padding: '6px 12px', fontSize: 13, color: 'var(--mut)', cursor: 'pointer',
                fontFamily: 'var(--ui)', transition: '.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.color = 'var(--ink)'; e.currentTarget.style.borderColor = 'var(--ink)'; }}
              onMouseLeave={e => { e.currentTarget.style.color = 'var(--mut)'; e.currentTarget.style.borderColor = 'var(--line2)'; }}
            >
              <svg style={{ width:15,height:15,fill:'none',stroke:'currentColor',strokeWidth:1.8 }} viewBox="0 0 24 24">
                <path d="M13 2 4 14h6l-1 8 9-12h-6z"/>
              </svg>
              Surprise me
            </button>
          </div>

          {/* Model */}
          {providers.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <span className="mic">Model</span>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {providers.map(p => (
                  <button
                    key={p.id}
                    className={`chip${selectedProvider === p.id ? ' on' : ''}`}
                    onClick={() => setSelectedProvider(p.id)}
                  >
                    {p.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Aspect */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <span className="mic">Aspect</span>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {ASPECTS.map(a => (
                <button key={a} className={`chip${aspectRatio === a ? ' on' : ''}`} onClick={() => setAspectRatio(a)}>{a}</button>
              ))}
            </div>
          </div>

          {/* Style preset */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <span className="mic">Style preset</span>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {STYLES.map(s => (
                <button key={s} className={`chip${stylePreset === s ? ' on' : ''}`} onClick={() => setStylePreset(s)}>{s}</button>
              ))}
            </div>
          </div>

          {/* Batch */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <span className="mic">Batch size</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <button className="ibtn" onClick={() => setBatchCount(Math.max(1, batchCount - 1))} aria-label="Fewer">
                <svg style={{ width:16,height:16,fill:'none',stroke:'currentColor',strokeWidth:1.8 }} viewBox="0 0 24 24"><path d="M5 12h14"/></svg>
              </button>
              <b style={{ fontFamily: 'var(--mono)', fontSize: 15, minWidth: 18, textAlign: 'center' }}>{batchCount}</b>
              <button className="ibtn" onClick={() => setBatchCount(Math.min(8, batchCount + 1))} aria-label="More">
                <svg style={{ width:16,height:16,fill:'none',stroke:'currentColor',strokeWidth:1.8 }} viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>
              </button>
            </div>
          </div>

          {/* Advanced */}
          <div>
            <button
              onClick={() => setAdvOpen(v => !v)}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                background: 'none', border: 0, color: 'var(--mut)',
                fontFamily: 'var(--ui)', fontSize: 13, cursor: 'pointer', padding: 0,
              }}
            >
              <svg style={{ width:16,height:16,fill:'none',stroke:'currentColor',strokeWidth:1.8, transition:'.25s', rotate: advOpen ? '180deg' : '0deg' }} viewBox="0 0 24 24">
                <path d="M6 9l6 6 6-6"/>
              </svg>
              Advanced controls
            </button>

            <AnimatePresence>
              {advOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  style={{ overflow: 'hidden' }}
                >
                  <div style={{ display: 'grid', gap: 14, paddingTop: 14, borderTop: '1px dashed var(--line2)', marginTop: 10 }}>
                    <div style={{ display: 'grid', gap: 7 }}>
                      <label style={{ fontSize: 13, fontWeight: 500 }}>Negative prompt</label>
                      <textarea
                        className="ie-inp"
                        value={negativePrompt}
                        onChange={e => setNegativePrompt(e.target.value)}
                        placeholder="What to avoid…"
                        style={{ minHeight: 64 }}
                      />
                    </div>

                    <div style={{ display: 'grid', gap: 6 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span className="mic">STEPS</span><span className="mic">{steps}</span>
                      </div>
                      <input type="range" min="10" max="60" value={steps} onChange={e => setSteps(+e.target.value)} style={{ width: '100%', accentColor: 'var(--acc)' }} />
                    </div>

                    <div style={{ display: 'grid', gap: 6 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span className="mic">GUIDANCE</span><span className="mic">{cfgScale}</span>
                      </div>
                      <input type="range" min="1" max="20" step="0.5" value={cfgScale} onChange={e => setCfgScale(+e.target.value)} style={{ width: '100%', accentColor: 'var(--acc)' }} />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                      <div style={{ display: 'grid', gap: 7 }}>
                        <label style={{ fontSize: 13, fontWeight: 500 }}>Scheduler</label>
                        <select className="ie-inp" value={sampler} onChange={e => setSampler(e.target.value)}>
                          {SAMPLERS.map(s => <option key={s}>{s}</option>)}
                        </select>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Generate button */}
          <div>
            <button
              className="btn acc"
              onClick={handleGenerate}
              disabled={isLoading || (!isAdmin && credits < generateCost) || providers.length === 0}
              style={{ width: '100%', padding: 14, fontSize: 15, fontWeight: 700, letterSpacing: '.01em' }}
            >
              <svg style={{ width:18,height:18,fill:'none',stroke:'currentColor',strokeWidth:1.8 }} viewBox="0 0 24 24">
                <path d="M13 2 4 14h6l-1 8 9-12h-6z"/>
              </svg>
              {isLoading ? 'Generating…' : 'Generate'}
            </button>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--mut)', marginTop: 8 }}>
              <span>≈ {batchCount} CR</span>
              <span>~12s · {prov?.name ?? 'no model'}</span>
            </div>
          </div>
        </div>

        {/* ── Canvas ── */}
        <div className="ie-canvas" style={{ minHeight: 620, position: 'relative' }}>

          {/* Loading state */}
          {isLoading && (
            <AnimatePresence>
              <GeneratingOverlay
                progress={genProgress}
                stage={stage || 'INITIALIZING'}
                hint={prov?.name ?? undefined}
                variant="canvas"
              />
            </AnimatePresence>
          )}

          {/* Idle state */}
          {!isLoading && !generatedImage && (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 18, textAlign: 'center', padding: 30 }}>
              <div style={{ border: '1px dashed var(--dline)', borderRadius: 16, padding: '56px 30px', maxWidth: 440, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
                <svg style={{ width:34,height:34,fill:'none',stroke:'var(--acc)',strokeWidth:1.8 }} viewBox="0 0 24 24">
                  <rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="9" cy="10" r="1.8"/><path d="M3 17l6-5 4 3 4-4 4 4"/>
                </svg>
                <h4 style={{ fontSize: 17, fontWeight: 500 }}>The canvas is idle</h4>
                <p style={{ color: 'var(--dmut)', fontSize: 13.5 }}>Your generations will land here. Start with a prompt, or borrow one of ours.</p>
                <button
                  className="btn dark sm"
                  onClick={() => { setPrompt(SURPRISE_PROMPTS[0]); handleGenerate(); }}
                >
                  Try an example prompt
                </button>
              </div>
            </div>
          )}

          {/* Result */}
          {!isLoading && generatedImage && (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <span className="mic d" style={{ marginRight: 'auto' }}>
                  BATCH · {batchCount} IMAGE{batchCount > 1 ? 'S' : ''} · {prov?.name?.toUpperCase() ?? ''}
                </span>
                <a
                  href={generatedImage}
                  download={`image-${Date.now()}.png`}
                  className="btn dark sm"
                >
                  <svg style={{ width:15,height:15,fill:'none',stroke:'currentColor',strokeWidth:1.8 }} viewBox="0 0 24 24">
                    <path d="M12 3v12M7 10l5 5 5-5M4 21h16"/>
                  </svg>
                  Download
                </a>
                <button className="btn dark sm" onClick={() => { setGeneratedImage(null); handleGenerate(); }}>
                  <svg style={{ width:15,height:15,fill:'none',stroke:'currentColor',strokeWidth:1.8 }} viewBox="0 0 24 24">
                    <path d="M21 3v6h-6"/><path d="M20.5 9A8.5 8.5 0 1 0 21 12"/>
                  </svg>
                  Variation
                </button>
              </div>

              <div
                style={{ position: 'relative', borderRadius: 14, overflow: 'hidden', border: '1px solid var(--dline)', cursor: 'zoom-in' }}
                onClick={() => setLbOpen(true)}
              >
                <img
                  src={generatedImage}
                  alt="Generated"
                  style={{ width: '100%', aspectRatio: `${currentRatio.w}/${currentRatio.h}`, objectFit: 'cover', display: 'block', transition: 'transform .4s' }}
                  onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.02)')}
                  onMouseLeave={e => (e.currentTarget.style.transform = '')}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {lbOpen && generatedImage && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setLbOpen(false)}
            style={{ position: 'fixed', inset: 0, zIndex: 300, background: 'rgba(20,19,16,.9)', backdropFilter: 'blur(4px)', display: 'grid', placeItems: 'center', padding: 18 }}
          >
            <button
              onClick={() => setLbOpen(false)}
              className="ibtn d"
              style={{ position: 'absolute', top: 14, right: 14 }}
            >
              <svg style={{ width:16,height:16,fill:'none',stroke:'currentColor',strokeWidth:1.8 }} viewBox="0 0 24 24"><path d="M6 6l12 12M18 6 6 18"/></svg>
            </button>
            <motion.img
              initial={{ scale: 0.92, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.92, opacity: 0 }}
              src={generatedImage}
              alt="Preview"
              onClick={e => e.stopPropagation()}
              style={{ maxHeight: '80vh', maxWidth: '90vw', borderRadius: 12, objectFit: 'contain', boxShadow: '0 40px 100px rgba(0,0,0,.6)' }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Responsive */}
      <style>{`
        @media(max-width:1080px){ .gen-layout{ grid-template-columns:1fr !important; } }
      `}</style>
    </div>
  );
}
