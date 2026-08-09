import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mic, Play, Pause, Download, Search, Upload, X,
  Loader2, Volume2, RefreshCw, ChevronLeft, ChevronRight,
  Wand2, AudioLines, Globe, Users,
} from 'lucide-react';
import { PageContainer, PageHeader } from './shared';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

/* ─── Types ──────────────────────────────────────────────────────── */
interface Voice {
  _id: string;
  title: string;
  description?: string;
  cover_image?: string;
  languages?: string[];
  task_count?: number;
  like_count?: number;
  samples?: { text: string; audio: string }[];
}

type Tab = 'generate' | 'clone' | 'library';

const FORMATS = ['mp3', 'wav', 'opus'] as const;
type AudioFormat = typeof FORMATS[number];

const LANGUAGES = [
  { value: '', label: 'كل اللغات' },
  { value: 'ar', label: '🇸🇦 العربية' },
  { value: 'en', label: '🇺🇸 English' },
  { value: 'zh', label: '🇨🇳 中文' },
  { value: 'ja', label: '🇯🇵 日本語' },
  { value: 'ko', label: '🇰🇷 한국어' },
  { value: 'fr', label: '🇫🇷 Français' },
  { value: 'de', label: '🇩🇪 Deutsch' },
  { value: 'es', label: '🇪🇸 Español' },
  { value: 'ru', label: '🇷🇺 Русский' },
  { value: 'tr', label: '🇹🇷 Türkçe' },
];

/* ─── Audio Player Component ─────────────────────────────────────── */
function AudioPlayer({ src, label }: { src: string; label?: string }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);

  const toggle = () => {
    if (!audioRef.current) return;
    if (playing) { audioRef.current.pause(); setPlaying(false); }
    else { audioRef.current.play(); setPlaying(true); }
  };

  const fmt = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

  return (
    <div className="flex items-center gap-3 rounded-xl border border-border bg-card/60 p-3">
      <audio
        ref={audioRef}
        src={src}
        onTimeUpdate={() => setProgress(audioRef.current?.currentTime ?? 0)}
        onLoadedMetadata={() => setDuration(audioRef.current?.duration ?? 0)}
        onEnded={() => setPlaying(false)}
      />
      <button onClick={toggle} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full gradient-amber text-black">
        {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
      </button>
      <div className="min-w-0 flex-1">
        {label && <p className="mb-1 truncate text-xs font-medium text-muted-foreground">{label}</p>}
        <div className="relative h-1.5 w-full cursor-pointer rounded-full bg-secondary"
          onClick={(e) => {
            if (!audioRef.current || !duration) return;
            const rect = e.currentTarget.getBoundingClientRect();
            const ratio = (e.clientX - rect.left) / rect.width;
            audioRef.current.currentTime = ratio * duration;
          }}>
          <div className="h-full rounded-full gradient-amber transition-all" style={{ width: `${duration ? (progress / duration) * 100 : 0}%` }} />
        </div>
        <div className="mt-1 flex justify-between text-[10px] text-muted-foreground">
          <span>{fmt(progress)}</span><span>{fmt(duration)}</span>
        </div>
      </div>
      <a href={src} download={`tts-${Date.now()}.mp3`}
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary">
        <Download className="h-4 w-4" />
      </a>
    </div>
  );
}

/* ─── Voice Card ─────────────────────────────────────────────────── */
function VoiceCard({
  voice, selected, onSelect, playingId, onPlay,
}: {
  voice: Voice;
  selected: boolean;
  onSelect: () => void;
  playingId: string | null;
  onPlay: (id: string | null) => void;
}) {
  const [imgError, setImgError] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const isPlaying = playingId === voice._id;

  // لو صوت تاني اتشغّل — وقّف الـ audio الحالي
  useEffect(() => {
    if (!isPlaying && audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  }, [isPlaying]);

  const handlePreview = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!voice.samples?.[0]?.audio) return;
    if (isPlaying) {
      audioRef.current?.pause();
      onPlay(null);
      return;
    }
    onPlay(voice._id);
    const audio = audioRef.current;
    if (!audio) return;
    audio.src = voice.samples[0].audio;
    audio.play().catch(() => onPlay(null));
    audio.onended = () => onPlay(null);
  };

  return (
    <button onClick={onSelect}
      className={cn(
        'flex flex-col gap-2 rounded-xl border p-3 text-left transition-all hover:border-primary/40',
        selected ? 'border-primary/50 bg-primary/10' : 'border-border bg-card/40',
      )}>
      <audio ref={audioRef} className="hidden" />
      <div className="flex items-center gap-2">
        {voice.cover_image && !imgError ? (
          <img
            src={voice.cover_image}
            alt={voice.title}
            className="h-9 w-9 shrink-0 rounded-lg object-cover"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg gradient-amber">
            <Mic className="h-4 w-4 text-black" />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{voice.title}</p>
          {voice.languages && voice.languages.length > 0 && (
            <p className="text-[10px] text-muted-foreground">{voice.languages.slice(0, 3).join(' · ')}</p>
          )}
        </div>
        {selected && <div className="h-2 w-2 shrink-0 rounded-full bg-primary" />}
      </div>
      <div className="flex items-center justify-between">
        {voice.task_count != null && (
          <p className="text-[10px] text-muted-foreground">{voice.task_count.toLocaleString()} استخدام</p>
        )}
        {voice.samples?.[0]?.audio && (
          <button
            onClick={handlePreview}
            className={cn(
              'flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] font-medium transition-colors',
              isPlaying
                ? 'bg-primary/20 text-primary'
                : 'bg-secondary text-muted-foreground hover:bg-secondary/70 hover:text-foreground',
            )}
          >
            {isPlaying ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
            {isPlaying ? 'إيقاف' : 'معاينة'}
          </button>
        )}
      </div>
    </button>
  );
}

/* ─── Main View ──────────────────────────────────────────────────── */
export function TtsView() {
  const { toast } = useToast();
  const [tab, setTab] = useState<Tab>('generate');

  // Generate tab state
  const [text, setText] = useState('');
  const [format, setFormat] = useState<AudioFormat>('mp3');
  const [speed, setSpeed] = useState(1);
  const [selectedVoiceId, setSelectedVoiceId] = useState('');
  const [selectedVoiceName, setSelectedVoiceName] = useState('');
  const [generating, setGenerating] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  // Clone tab state
  const [cloneText, setCloneText] = useState('');
  const [cloneFile, setCloneFile] = useState<File | null>(null);
  const [cloneTranscript, setCloneTranscript] = useState('');
  const [cloning, setCloning] = useState(false);
  const [cloneAudioUrl, setCloneAudioUrl] = useState<string | null>(null);
  const cloneInputRef = useRef<HTMLInputElement>(null);

  // Library tab state
  const [voices, setVoices] = useState<Voice[]>([]);
  const [voicesTotal, setVoicesTotal] = useState(0);
  const [voicesPage, setVoicesPage] = useState(1);
  const [voicesSearch, setVoicesSearch] = useState('');
  const [voicesLang, setVoicesLang] = useState('');
  const [voicesHasMore, setVoicesHasMore] = useState(false);
  const [voicesLoading, setVoicesLoading] = useState(false);
  const [playingVoiceId, setPlayingVoiceId] = useState<string | null>(null);
  const PAGE_SIZE = 20;

  const fetchVoices = useCallback(async (page: number, search: string, lang: string) => {
    setPlayingVoiceId(null); // وقّف أي صوت شغّال عند تغيير الصفحة
    setVoicesLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page), page_size: String(PAGE_SIZE),
        ...(search ? { title: search } : {}),
        ...(lang ? { language: lang } : {}),
      });
      const r = await fetch(`/api/tts/voices?${params}`);
      const data = await r.json() as { ok: boolean; voices: Voice[]; total: number; has_more?: boolean; error?: string };
      if (!data.ok) throw new Error(data.error);
      setVoices(data.voices);
      setVoicesTotal(data.total);
      setVoicesHasMore(data.has_more ?? (data.voices.length === PAGE_SIZE));
    } catch (err) {
      toast({ title: 'خطأ', description: String(err), variant: 'destructive' });
    } finally {
      setVoicesLoading(false);
    }
  }, [toast]);

  useEffect(() => { fetchVoices(1, '', ''); }, [fetchVoices]);

  /* ── Generate handler ── */
  const handleGenerate = async (): Promise<void> => {
    if (!text.trim()) { toast({ title: 'اكتب النص أولاً' }); return; }
    setGenerating(true);
    if (audioUrl) { URL.revokeObjectURL(audioUrl); setAudioUrl(null); }
    try {
      const res = await fetch('/api/tts/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: text.trim(),
          format,
          speed,
          ...(selectedVoiceId ? { reference_id: selectedVoiceId } : {}),
        }),
      });
      if (!res.ok) {
        const e = await res.json().catch(() => ({ error: `HTTP ${res.status}` })) as { error?: string };
        throw new Error(e.error ?? `HTTP ${res.status}`);
      }
      const blob = await res.blob();
      setAudioUrl(URL.createObjectURL(blob));
      toast({ title: 'تم توليد الصوت' });
    } catch (err) {
      toast({ title: 'فشل التوليد', description: String(err), variant: 'destructive' });
    } finally {
      setGenerating(false);
    }
  };

  /* ── Clone handler ── */
  const handleClone = async (): Promise<void> => {
    if (!cloneText.trim()) { toast({ title: 'اكتب النص أولاً' }); return; }
    if (!cloneFile) { toast({ title: 'ارفع ملف صوتي أولاً' }); return; }
    setCloning(true);
    if (cloneAudioUrl) { URL.revokeObjectURL(cloneAudioUrl); setCloneAudioUrl(null); }
    try {
      const b64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          resolve(result.split(',')[1] ?? '');
        };
        reader.onerror = reject;
        reader.readAsDataURL(cloneFile);
      });
      const res = await fetch('/api/tts/clone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: cloneText.trim(),
          audio_base64: b64,
          audio_mime: cloneFile.type || 'audio/wav',
          transcript: cloneTranscript,
          format: 'mp3',
          speed,
        }),
      });
      if (!res.ok) {
        const e = await res.json().catch(() => ({ error: `HTTP ${res.status}` })) as { error?: string };
        throw new Error(e.error ?? `HTTP ${res.status}`);
      }
      const blob = await res.blob();
      setCloneAudioUrl(URL.createObjectURL(blob));
      toast({ title: 'تم استنساخ الصوت' });
    } catch (err) {
      toast({ title: 'فشل الاستنساخ', description: String(err), variant: 'destructive' });
    } finally {
      setCloning(false);
    }
  };

  /* ── Render ── */
  return (
    <PageContainer>
      <PageHeader title="Text to Speech" description="حوّل النص لصوت طبيعي، استنسخ أي صوت، أو اختر من مكتبة الأصوات" icon={AudioLines} />

      {/* Tabs */}
      <div className="mt-5 flex gap-2 rounded-xl border border-border bg-card/40 p-1">
        {([
          { id: 'generate', label: 'توليد صوت', icon: Wand2 },
          { id: 'clone',    label: 'استنساخ صوت', icon: Mic },
          { id: 'library',  label: 'مكتبة الأصوات', icon: Users },
        ] as { id: Tab; label: string; icon: React.ComponentType<{ className?: string }> }[]).map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setTab(id)}
            className={cn(
              'flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all',
              tab === id ? 'gradient-amber text-black shadow-sm' : 'text-muted-foreground hover:text-foreground',
            )}>
            <Icon className="h-4 w-4" />{label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={tab} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.18 }} className="mt-5">

          {/* ══ GENERATE TAB ══ */}
          {tab === 'generate' && (
            <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1fr_340px]">
              <div className="space-y-4">
                {/* Text input */}
                <div className="rounded-2xl border border-border bg-card/60 p-4">
                  <div className="mb-2 flex items-center justify-between">
                    <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">النص</label>
                    <span className="text-xs text-muted-foreground">{text.length} / 5000</span>
                  </div>
                  <textarea value={text} onChange={e => setText(e.target.value.slice(0, 5000))}
                    placeholder="اكتب النص الذي تريد تحويله لصوت..."
                    className="min-h-[160px] w-full resize-none bg-transparent text-sm leading-relaxed outline-none placeholder:text-muted-foreground/50" />
                </div>

                {/* Selected voice badge */}
                {selectedVoiceId && (
                  <div className="flex items-center gap-2 rounded-xl border border-primary/30 bg-primary/10 px-3 py-2 text-sm">
                    <Mic className="h-4 w-4 text-primary" />
                    <span className="flex-1 truncate font-medium text-primary">{selectedVoiceName}</span>
                    <button onClick={() => { setSelectedVoiceId(''); setSelectedVoiceName(''); }}
                      className="text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
                  </div>
                )}
                {!selectedVoiceId && (
                  <p className="text-xs text-muted-foreground">
                    لم يتم اختيار صوت — سيُستخدم الصوت الافتراضي. اختر صوتاً من{' '}
                    <button onClick={() => setTab('library')} className="text-primary underline underline-offset-2">مكتبة الأصوات</button>
                  </p>
                )}

                {/* Result */}
                {audioUrl && <AudioPlayer src={audioUrl} label="الصوت المُولَّد" />}
              </div>

              {/* Settings panel */}
              <div className="space-y-4">
                <div className="rounded-2xl border border-border bg-card/60 p-4 space-y-4">
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">الإعدادات</h3>
                  {/* Format */}
                  <div>
                    <label className="mb-2 block text-xs font-medium text-muted-foreground">صيغة الصوت</label>
                    <div className="flex gap-2">
                      {FORMATS.map(f => (
                        <button key={f} onClick={() => setFormat(f)}
                          className={cn('flex-1 rounded-lg border px-2 py-1.5 text-xs font-medium uppercase transition-all',
                            format === f ? 'border-primary/40 bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:text-foreground')}>
                          {f}
                        </button>
                      ))}
                    </div>
                  </div>
                  {/* Speed */}
                  <div>
                    <div className="mb-2 flex items-center justify-between">
                      <label className="text-xs font-medium text-muted-foreground">سرعة الكلام</label>
                      <span className="text-xs font-semibold text-primary">{speed.toFixed(1)}x</span>
                    </div>
                    <input type="range" min="0.5" max="2" step="0.1" value={speed}
                      onChange={e => setSpeed(parseFloat(e.target.value))}
                      className="w-full accent-primary" />
                    <div className="flex justify-between text-[10px] text-muted-foreground mt-1"><span>0.5x</span><span>2x</span></div>
                  </div>
                </div>

                {/* Generate button */}
                <button onClick={handleGenerate} disabled={!text.trim() || generating}
                  className={cn('flex w-full items-center justify-center gap-2 rounded-xl py-4 text-base font-bold transition-all',
                    !text.trim() || generating ? 'cursor-not-allowed bg-secondary text-muted-foreground' : 'gradient-amber text-black hover:glow-amber')}>
                  {generating ? <><Loader2 className="h-5 w-5 animate-spin" />جاري التوليد...</> : <><Volume2 className="h-5 w-5" />توليد الصوت</>}
                </button>
              </div>
            </div>
          )}

          {/* ══ CLONE TAB ══ */}
          {tab === 'clone' && (
            <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1fr_340px]">
              <div className="space-y-4">
                {/* Upload area */}
                <div onClick={() => cloneInputRef.current?.click()}
                  className="flex min-h-[120px] cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border bg-card/40 transition-all hover:border-primary/40">
                  <input ref={cloneInputRef} type="file" accept="audio/*" className="hidden"
                    onChange={e => setCloneFile(e.target.files?.[0] ?? null)} />
                  {cloneFile ? (
                    <div className="flex items-center gap-3 p-4">
                      <AudioLines className="h-8 w-8 text-primary" />
                      <div>
                        <p className="text-sm font-medium">{cloneFile.name}</p>
                        <p className="text-xs text-muted-foreground">{(cloneFile.size / 1024).toFixed(0)} KB</p>
                      </div>
                      <button onClick={e => { e.stopPropagation(); setCloneFile(null); }}
                        className="ml-auto rounded-lg p-1 text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2 p-6 text-center">
                      <Upload className="h-8 w-8 text-muted-foreground/50" />
                      <p className="text-sm font-medium">ارفع ملف صوتي للاستنساخ</p>
                      <p className="text-xs text-muted-foreground">WAV, MP3, M4A, OGG — من 10 ثواني لدقيقتين</p>
                    </div>
                  )}
                </div>

                {/* Transcript */}
                <div className="rounded-xl border border-border bg-card/40 p-3">
                  <label className="mb-1.5 block text-xs font-medium text-muted-foreground">نص الصوت المرفوع (اختياري — يحسّن الجودة)</label>
                  <textarea value={cloneTranscript} onChange={e => setCloneTranscript(e.target.value)}
                    placeholder="اكتب ما يقوله الصوت المرفوع..."
                    className="min-h-[60px] w-full resize-none bg-transparent text-sm outline-none placeholder:text-muted-foreground/50" />
                </div>

                {/* Text to speak */}
                <div className="rounded-2xl border border-border bg-card/60 p-4">
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">النص المراد نطقه</label>
                  <textarea value={cloneText} onChange={e => setCloneText(e.target.value.slice(0, 5000))}
                    placeholder="اكتب النص الذي تريد نطقه بالصوت المستنسخ..."
                    className="min-h-[120px] w-full resize-none bg-transparent text-sm leading-relaxed outline-none placeholder:text-muted-foreground/50" />
                </div>

                {cloneAudioUrl && <AudioPlayer src={cloneAudioUrl} label="الصوت المستنسخ" />}
              </div>

              <div className="space-y-4">
                <div className="rounded-2xl border border-border bg-card/60 p-4 space-y-3">
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">ملاحظات</h3>
                  {[
                    'ارفع صوتاً نظيفاً بدون ضوضاء خلفية',
                    'أفضل نتيجة مع 10 ثواني أو أكثر',
                    'صوت شخص واحد فقط بدون موسيقى',
                    'الاستنساخ فوري — لا يحتاج تدريب',
                  ].map((tip, i) => (
                    <div key={i} className="flex gap-2 text-xs text-muted-foreground">
                      <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary/60" />{tip}
                    </div>
                  ))}
                </div>
                <button onClick={handleClone} disabled={!cloneText.trim() || !cloneFile || cloning}
                  className={cn('flex w-full items-center justify-center gap-2 rounded-xl py-4 text-base font-bold transition-all',
                    !cloneText.trim() || !cloneFile || cloning ? 'cursor-not-allowed bg-secondary text-muted-foreground' : 'gradient-amber text-black hover:glow-amber')}>
                  {cloning ? <><Loader2 className="h-5 w-5 animate-spin" />جاري الاستنساخ...</> : <><Mic className="h-5 w-5" />استنسخ الصوت</>}
                </button>
              </div>
            </div>
          )}

          {/* ══ LIBRARY TAB ══ */}
          {tab === 'library' && (
            <div className="space-y-4">
              {/* Filters */}
              <div className="flex flex-wrap gap-3">
                <div className="relative flex-1 min-w-[180px]">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input value={voicesSearch} onChange={e => setVoicesSearch(e.target.value)}
                    placeholder="ابحث عن صوت..."
                    className="h-9 w-full rounded-xl border border-border bg-card/50 pl-9 pr-3 text-sm outline-none focus:border-primary/40" />
                </div>
                <select value={voicesLang} onChange={e => setVoicesLang(e.target.value)}
                  className="h-9 rounded-xl border border-border bg-card/50 px-3 text-sm outline-none focus:border-primary/40">
                  {LANGUAGES.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
                </select>
                <button onClick={() => { setVoicesPage(1); fetchVoices(1, voicesSearch, voicesLang); }}
                  className="flex h-9 items-center gap-1.5 rounded-xl border border-border bg-card/50 px-3 text-sm text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground">
                  <Search className="h-4 w-4" />بحث
                </button>
                <button onClick={() => { setVoicesSearch(''); setVoicesLang(''); setVoicesPage(1); fetchVoices(1, '', ''); }}
                  className="flex h-9 items-center gap-1.5 rounded-xl border border-border bg-card/50 px-3 text-sm text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground">
                  <RefreshCw className="h-4 w-4" />
                </button>
              </div>

              {/* Selected voice info */}
              {selectedVoiceId && (
                <div className="flex items-center gap-2 rounded-xl border border-primary/30 bg-primary/10 px-3 py-2 text-sm">
                  <Mic className="h-4 w-4 shrink-0 text-primary" />
                  <span className="flex-1 text-primary font-medium">محدد: {selectedVoiceName}</span>
                  <button onClick={() => setTab('generate')} className="text-xs text-primary underline underline-offset-2">استخدم هذا الصوت</button>
                </div>
              )}

              {/* Grid */}
              {voicesLoading ? (
                <div className="flex items-center justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
              ) : voices.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-16 text-muted-foreground">
                  <Globe className="h-10 w-10 opacity-30" />
                  <p className="text-sm">لا توجد أصوات — تأكد من وجود API Key في لوحة الأدمن</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                  {voices.map(v => (
                    <VoiceCard key={v._id} voice={v} selected={selectedVoiceId === v._id}
                      playingId={playingVoiceId}
                      onPlay={setPlayingVoiceId}
                      onSelect={() => { setSelectedVoiceId(v._id); setSelectedVoiceName(v.title); }} />
                  ))}
                </div>
              )}

              {/* Pagination */}
              {(voicesTotal > PAGE_SIZE || voicesHasMore) && (
                <div className="flex items-center justify-between border-t border-border pt-4">
                  <p className="text-xs text-muted-foreground">
                    صفحة {voicesPage}
                    {voicesTotal > 0 && ` — ${voicesTotal} صوت`}
                  </p>
                  <div className="flex gap-2">
                    <button disabled={voicesPage === 1} onClick={() => { const p = voicesPage - 1; setVoicesPage(p); fetchVoices(p, voicesSearch, voicesLang); }}
                      className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:border-primary/40 disabled:opacity-40">
                      <ChevronRight className="h-4 w-4" />
                    </button>
                    <button disabled={!voicesHasMore && voices.length < PAGE_SIZE} onClick={() => { const p = voicesPage + 1; setVoicesPage(p); fetchVoices(p, voicesSearch, voicesLang); }}
                      className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:border-primary/40 disabled:opacity-40">
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

        </motion.div>
      </AnimatePresence>
    </PageContainer>
  );
}
