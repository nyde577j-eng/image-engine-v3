/**
 * tts-keys-page.tsx
 * صفحة إدارة Fish Audio API Keys في لوحة الأدمن
 */
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Trash2, CheckCircle2, XCircle,
  Loader2, Eye, EyeOff, TestTube2, ArrowUp, ArrowDown, KeyRound,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';

interface TtsKey {
  id: string;
  name: string;
  key_value: string;
  enabled: boolean;
  sort_order: number;
  created_at: string;
  last_used_at: string | null;
}

export function TtsKeysPage() {
  const { toast } = useToast();
  const [keys, setKeys] = useState<TtsKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Add form state
  const [newName, setNewName] = useState('');
  const [newKey, setNewKey] = useState('');
  const [showNewKey, setShowNewKey] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; msg: string } | null>(null);

  // Visibility per key
  const [visibleKeys, setVisibleKeys] = useState<Set<string>>(new Set());

  /* ── Load keys ── */
  const loadKeys = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('tts_api_keys')
      .select('*')
      .order('sort_order', { ascending: true });
    if (!error && data) setKeys(data as TtsKey[]);
    setLoading(false);
  };

  useEffect(() => { loadKeys(); }, []);

  /* ── Add key ── */
  const handleAdd = async () => {
    if (!newName.trim() || !newKey.trim()) {
      toast({ title: 'الاسم والـ Key مطلوبان', variant: 'destructive' });
      return;
    }
    setSaving(true);
    const maxOrder = keys.length > 0 ? Math.max(...keys.map(k => k.sort_order)) + 1 : 0;
    const { error } = await supabase.from('tts_api_keys').insert({
      name: newName.trim(),
      key_value: newKey.trim(),
      enabled: true,
      sort_order: maxOrder,
    });
    setSaving(false);
    if (error) {
      toast({ title: 'خطأ في الإضافة', description: error.message, variant: 'destructive' });
    } else {
      setNewName(''); setNewKey(''); setTestResult(null);
      toast({ title: 'تم إضافة الـ Key' });
      loadKeys();
    }
  };

  /* ── Toggle enabled ── */
  const handleToggle = async (key: TtsKey) => {
    const { error } = await supabase
      .from('tts_api_keys')
      .update({ enabled: !key.enabled })
      .eq('id', key.id);
    if (!error) setKeys(prev => prev.map(k => k.id === key.id ? { ...k, enabled: !k.enabled } : k));
  };

  /* ── Delete key ── */
  const handleDelete = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا الـ Key؟')) return;
    const { error } = await supabase.from('tts_api_keys').delete().eq('id', id);
    if (!error) { setKeys(prev => prev.filter(k => k.id !== id)); toast({ title: 'تم الحذف' }); }
  };

  /* ── Reorder ── */
  const handleReorder = async (id: string, dir: 'up' | 'down') => {
    const idx = keys.findIndex(k => k.id === id);
    if (dir === 'up' && idx === 0) return;
    if (dir === 'down' && idx === keys.length - 1) return;
    const swap = dir === 'up' ? idx - 1 : idx + 1;
    const updated = [...keys];
    [updated[idx], updated[swap]] = [updated[swap], updated[idx]];
    const reordered = updated.map((k, i) => ({ ...k, sort_order: i }));
    setKeys(reordered);
    for (const k of reordered) {
      await supabase.from('tts_api_keys').update({ sort_order: k.sort_order }).eq('id', k.id);
    }
  };

  /* ── Test key ── */
  const handleTest = async () => {
    if (!newKey.trim()) return;
    setTesting(true); setTestResult(null);
    try {
      const r = await fetch('/api/tts/test-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key_value: newKey.trim() }),
      });
      const data = await r.json() as { ok: boolean; message?: string; error?: string };
      setTestResult({ ok: data.ok, msg: data.ok ? (data.message ?? 'صالح') : (data.error ?? 'غير صالح') });
    } catch (err) {
      setTestResult({ ok: false, msg: String(err) });
    } finally { setTesting(false); }
  };

  const toggleVisibility = (id: string) => {
    setVisibleKeys(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const maskKey = (k: string) => k.slice(0, 6) + '•'.repeat(Math.max(0, k.length - 10)) + k.slice(-4);


  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold">إدارة Fish Audio API Keys</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          أضف أكثر من key — النظام يستخدم أول key مفعّل حسب الترتيب تلقائياً.
        </p>
      </div>

      {/* ── Add new key form ── */}
      <div className="rounded-2xl border border-border bg-card/60 p-5 space-y-4">
        <h3 className="flex items-center gap-2 text-sm font-semibold">
          <Plus className="h-4 w-4 text-primary" />إضافة Key جديد
        </h3>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">الاسم</label>
            <input value={newName} onChange={e => setNewName(e.target.value)}
              placeholder="مثال: Key الرئيسي"
              className="h-10 w-full rounded-xl border border-border bg-background/50 px-3 text-sm outline-none focus:border-primary/40" />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Fish Audio API Key</label>
            <div className="relative">
              <input
                type={showNewKey ? 'text' : 'password'}
                value={newKey} onChange={e => { setNewKey(e.target.value); setTestResult(null); }}
                placeholder="fish_sk_..."
                className="h-10 w-full rounded-xl border border-border bg-background/50 px-3 pr-10 text-sm outline-none focus:border-primary/40" />
              <button onClick={() => setShowNewKey(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                {showNewKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Test button */}
          <button onClick={handleTest} disabled={!newKey.trim() || testing}
            className="flex items-center gap-2 rounded-xl border border-border bg-secondary/50 px-4 py-2 text-sm font-medium transition-colors hover:border-primary/40 disabled:opacity-50">
            {testing ? <Loader2 className="h-4 w-4 animate-spin" /> : <TestTube2 className="h-4 w-4" />}
            اختبر الـ Key
          </button>

          {/* Test result */}
          <AnimatePresence>
            {testResult && (
              <motion.div initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
                className={cn('flex items-center gap-1.5 text-sm font-medium',
                  testResult.ok ? 'text-success' : 'text-destructive')}>
                {testResult.ok ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                {testResult.msg}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Add button */}
          <button onClick={handleAdd} disabled={saving || !newName.trim() || !newKey.trim()}
            className="ml-auto flex items-center gap-2 rounded-xl gradient-amber px-5 py-2 text-sm font-semibold text-black transition-all hover:glow-amber disabled:opacity-50">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            إضافة
          </button>
        </div>
      </div>


      {/* ── Keys list ── */}
      <div className="rounded-2xl border border-border bg-card/60 overflow-hidden">
        <div className="flex items-center justify-between border-b border-border px-5 py-3">
          <h3 className="flex items-center gap-2 text-sm font-semibold">
            <KeyRound className="h-4 w-4 text-primary" />الـ Keys المضافة
            <span className="rounded-md bg-primary/15 px-1.5 py-0.5 text-[10px] font-semibold text-primary">{keys.length}</span>
          </h3>
          <button onClick={loadKeys} className="text-xs text-muted-foreground hover:text-foreground">تحديث</button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : keys.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-12 text-muted-foreground">
            <KeyRound className="h-8 w-8 opacity-30" />
            <p className="text-sm">لا توجد keys بعد — أضف key أعلاه</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {keys.map((key, idx) => (
              <motion.div key={key.id} layout
                className="flex items-center gap-3 px-5 py-4">

                {/* Order buttons */}
                <div className="flex flex-col gap-0.5">
                  <button onClick={() => handleReorder(key.id, 'up')} disabled={idx === 0}
                    className="flex h-5 w-5 items-center justify-center rounded text-muted-foreground hover:text-foreground disabled:opacity-30">
                    <ArrowUp className="h-3 w-3" />
                  </button>
                  <button onClick={() => handleReorder(key.id, 'down')} disabled={idx === keys.length - 1}
                    className="flex h-5 w-5 items-center justify-center rounded text-muted-foreground hover:text-foreground disabled:opacity-30">
                    <ArrowDown className="h-3 w-3" />
                  </button>
                </div>

                {/* Priority badge */}
                {idx === 0 && (
                  <span className="hidden shrink-0 rounded-md bg-primary/15 px-1.5 py-0.5 text-[10px] font-semibold text-primary sm:block">
                    أولوية
                  </span>
                )}

                {/* Info */}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{key.name}</p>
                  <div className="mt-0.5 flex items-center gap-2">
                    <code className="text-xs text-muted-foreground font-mono">
                      {visibleKeys.has(key.id) ? key.key_value : maskKey(key.key_value)}
                    </code>
                    <button onClick={() => toggleVisibility(key.id)}
                      className="text-muted-foreground hover:text-foreground">
                      {visibleKeys.has(key.id) ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                    </button>
                  </div>
                  {key.last_used_at && (
                    <p className="mt-0.5 text-[10px] text-muted-foreground">
                      آخر استخدام: {new Date(key.last_used_at).toLocaleString('ar-EG')}
                    </p>
                  )}
                </div>

                {/* Toggle enabled */}
                <button onClick={() => handleToggle(key)}
                  className={cn('flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors',
                    key.enabled
                      ? 'bg-success/15 text-success hover:bg-success/25'
                      : 'bg-secondary text-muted-foreground hover:bg-secondary/70')}>
                  {key.enabled
                    ? <><CheckCircle2 className="h-3.5 w-3.5" />مفعّل</>
                    : <><XCircle className="h-3.5 w-3.5" />معطّل</>}
                </button>

                {/* Delete */}
                <button onClick={() => handleDelete(key.id)}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-destructive/15 hover:text-destructive">
                  <Trash2 className="h-4 w-4" />
                </button>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Info box */}
      <div className="rounded-xl border border-border bg-card/40 p-4 text-xs text-muted-foreground space-y-1.5">
        <p className="font-medium text-foreground">كيف يعمل النظام؟</p>
        <p>• النظام يستخدم أول key مفعّل حسب الترتيب تلقائياً في كل طلب.</p>
        <p>• لو عندك أكثر من key، رتّبهم حسب الأولوية باستخدام أزرار الترتيب.</p>
        <p>• احصل على API Key مجاني من <a href="https://fish.audio/app/developers" target="_blank" rel="noopener noreferrer" className="text-primary underline underline-offset-2">fish.audio/app/developers</a></p>
      </div>
    </div>
  );
}
