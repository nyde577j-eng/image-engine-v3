
import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Boxes, Search, Heart, Upload, Check, Loader2, Star, Zap } from 'lucide-react';
import { PageContainer, PageHeader } from './shared';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import { useApp } from '@/components/providers/app-provider';
import { useToast } from '@/hooks/use-toast';
import { MODELS } from '@/lib/mock-data';

interface ImageProvider {
  id: string;
  name: string;
  provider_type: string;
  base_url: string;
  model_name: string;
  enabled: boolean;
  is_default: boolean;
  notes: string;
  created_at: string;
}

// Map provider_type to a human-friendly category label
const TYPE_LABELS: Record<string, string> = {
  gemini:       'Google Gemini',
  pollinations: 'Pollinations',
  openrouter:   'OpenRouter',
  openai:       'OpenAI',
  stability:    'Stability AI',
  fal:          'fal.ai',
  replicate:    'Replicate',
  comfyui:      'ComfyUI',
  custom:       'Custom',
};

const TYPE_FILTERS = ['all', 'gemini', 'openai', 'stability', 'fal', 'replicate', 'pollinations', 'comfyui', 'custom'] as const;
type TypeFilter = (typeof TYPE_FILTERS)[number];

export function ModelsView() {
  const { toast } = useToast();
  const { setActiveView } = useApp();
  const [providers, setProviders] = useState<ImageProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<TypeFilter>('all');
  const [search, setSearch] = useState('');
  const [activeId, setActiveId] = useState<string>('');
  const [settingDefault, setSettingDefault] = useState<string | null>(null);

  const fetchProviders = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('image_providers')
        .select('*')
        .eq('enabled', true)
        .order('is_default', { ascending: false });

      if (!error && data && data.length > 0) {
        const list = data as ImageProvider[];
        setProviders(list);
        const def = list.find((p) => p.is_default) ?? list[0];
        setActiveId(def.id);
      } else {
        // Supabase empty or unavailable — show mock data
        setProviders([]);
      }
    } catch {
      setProviders([]);
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchProviders(); }, [fetchProviders]);

  const handleSetDefault = async (p: ImageProvider) => {
    setSettingDefault(p.id);
    try {
      // unset all defaults then set the chosen one
      await supabase.from('image_providers').update({ is_default: false }).neq('id', '');
      await supabase.from('image_providers').update({ is_default: true }).eq('id', p.id);
      setActiveId(p.id);
      toast({ title: `${p.name} — تم تعيينه كنموذج افتراضي` });
      fetchProviders();
    } catch (err) {
      toast({ title: 'خطأ', description: String(err), variant: 'destructive' });
    } finally {
      setSettingDefault(null);
    }
  };

  // Visible types for filter tabs (only those that have providers)
  const presentTypes = Array.from(new Set(providers.map((p) => p.provider_type)));

  const visibleProviders = providers.filter((p) => {
    if (filter !== 'all' && p.provider_type !== filter) return false;
    if (search && !p.name.toLowerCase().includes(search.toLowerCase()) && !p.model_name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  // ── Fallback: no Supabase data — show mock models (read-only) ──
  if (!loading && providers.length === 0) {
    return (
      <PageContainer>
        <PageHeader
          title="Models"
          description="Manage your image generation providers"
          icon={Boxes}
          actions={
            <button
              onClick={() => setActiveView('admin')}
              className="flex items-center gap-2 rounded-xl gradient-amber px-4 py-2 text-sm font-semibold text-black transition-all hover:glow-amber"
            >
              <Upload className="h-4 w-4" />
              Add Provider
            </button>
          }
        />
        <div className="mt-4 rounded-xl border border-warning/30 bg-warning/5 px-4 py-3 text-xs text-warning">
          لم يتم إضافة أي نماذج — اذهب إلى <span className="font-semibold">Admin → Image Providers</span> لإضافة provider
        </div>
        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {MODELS.map((m, i) => (
            <motion.div
              key={m.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i * 0.05, 0.3) }}
              className="rounded-2xl border border-border bg-card/40 p-5 opacity-60"
            >
              <div className="flex items-start justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl gradient-amber text-black">
                  <Boxes className="h-6 w-6" />
                </div>
                <span className="rounded-lg bg-secondary px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                  {m.type}
                </span>
              </div>
              <h3 className="mt-4 font-display text-base font-bold tracking-tight">{m.name}</h3>
              <p className="mt-0.5 text-xs text-muted-foreground">Base: {m.base}</p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {m.tags.map((tag) => (
                  <span key={tag} className="rounded-md border border-border bg-secondary/50 px-2 py-0.5 text-[10px] font-medium text-muted-foreground">{tag}</span>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader
        title="Models"
        description={`${visibleProviders.length} image provider${visibleProviders.length !== 1 ? 's' : ''} configured`}
        icon={Boxes}
        actions={
          <button
            onClick={() => setActiveView('admin')}
            className="flex items-center gap-2 rounded-xl gradient-amber px-4 py-2 text-sm font-semibold text-black transition-all hover:glow-amber"
          >
            <Upload className="h-4 w-4" />
            Add Provider
          </button>
        }
      />

      {/* Filters */}
      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search providers..."
            className="h-10 w-full rounded-xl border border-border bg-card/50 pl-9 pr-3 text-sm outline-none transition-colors focus:border-primary/40"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setFilter('all')}
            className={cn(
              'rounded-xl border px-3 py-2 text-sm font-medium capitalize transition-all',
              filter === 'all'
                ? 'border-primary/40 bg-primary/10 text-primary'
                : 'border-border bg-card/40 text-muted-foreground hover:text-foreground',
            )}
          >
            All
          </button>
          {presentTypes.map((type) => (
            <button
              key={type}
              onClick={() => setFilter(type as TypeFilter)}
              className={cn(
                'rounded-xl border px-3 py-2 text-sm font-medium capitalize transition-all',
                filter === type
                  ? 'border-primary/40 bg-primary/10 text-primary'
                  : 'border-border bg-card/40 text-muted-foreground hover:text-foreground',
              )}
            >
              {TYPE_LABELS[type] ?? type}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="mt-16 flex flex-col items-center justify-center gap-3 text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm">Loading providers...</p>
        </div>
      ) : visibleProviders.length === 0 ? (
        <div className="mt-16 flex flex-col items-center justify-center gap-3 text-muted-foreground">
          <Boxes className="h-12 w-12 opacity-40" />
          <p>لا توجد نتائج</p>
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {visibleProviders.map((p, i) => {
            const isActive = activeId === p.id;
            const isSettingThis = settingDefault === p.id;
            const isFree = p.provider_type === 'pollinations';

            return (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.05, 0.3) }}
                whileHover={{ y: -2 }}
                className={cn(
                  'group rounded-2xl border bg-card/40 p-5 transition-all hover:glow-soft',
                  isActive ? 'border-primary/40' : 'border-border hover:border-primary/30',
                )}
              >
                <div className="flex items-start justify-between">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl gradient-amber text-black">
                    <Boxes className="h-6 w-6" />
                  </div>
                  <div className="flex items-center gap-1.5">
                    {isFree && (
                      <span className="flex items-center gap-0.5 rounded-lg bg-emerald-500/15 px-2 py-1 text-[10px] font-semibold text-emerald-500">
                        <Zap className="h-2.5 w-2.5" />Free
                      </span>
                    )}
                    {p.is_default && (
                      <span className="flex items-center gap-1 rounded-lg bg-primary/10 px-2 py-1 text-[10px] font-semibold text-primary">
                        <Star className="h-2.5 w-2.5 fill-current" />Default
                      </span>
                    )}
                    <span className="rounded-lg bg-secondary px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                      {TYPE_LABELS[p.provider_type] ?? p.provider_type}
                    </span>
                  </div>
                </div>

                <h3 className="mt-4 font-display text-base font-bold tracking-tight">{p.name}</h3>
                <p className="mt-0.5 font-mono text-xs text-muted-foreground">{p.model_name}</p>
                {p.notes && (
                  <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">{p.notes}</p>
                )}

                <div className="mt-4 flex items-center gap-2 border-t border-border/50 pt-4">
                  <button
                    onClick={() => handleSetDefault(p)}
                    disabled={isSettingThis || isActive}
                    className={cn(
                      'flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-semibold transition-all',
                      isActive
                        ? 'bg-primary/15 text-primary cursor-default'
                        : 'bg-secondary text-foreground hover:bg-secondary/70 disabled:opacity-50',
                    )}
                  >
                    {isSettingThis ? (
                      <><Loader2 className="h-3.5 w-3.5 animate-spin" />Setting...</>
                    ) : isActive ? (
                      <><Check className="h-3.5 w-3.5" />Active</>
                    ) : (
                      'Set as Default'
                    )}
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </PageContainer>
  );
}
