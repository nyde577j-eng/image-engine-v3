import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Boxes, Search, Check, Loader2, Star, Zap, Upload } from 'lucide-react';
import { PageContainer, PageHeader } from './shared';
import { supabase } from '@/lib/supabase';
import { useApp } from '@/components/providers/app-provider';
import { useToast } from '@/hooks/use-toast';
import { MODELS } from '@/lib/mock-data';

interface ImageProvider {
  id: string; name: string; provider_type: string; base_url: string;
  model_name: string; enabled: boolean; is_default: boolean; notes: string; created_at: string;
}

const TYPE_LABELS: Record<string, string> = {
  gemini: 'Google Gemini', pollinations: 'Pollinations', openrouter: 'OpenRouter',
  openai: 'OpenAI', stability: 'Stability AI', fal: 'fal.ai',
  replicate: 'Replicate', comfyui: 'ComfyUI', custom: 'Custom',
};

export function ModelsView() {
  const { toast } = useToast();
  const { setActiveView } = useApp();
  const [providers, setProviders] = useState<ImageProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [activeId, setActiveId] = useState('');
  const [settingId, setSettingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from('image_providers').select('*').eq('enabled', true).order('is_default', { ascending: false });
      if (!error && data && data.length > 0) {
        const list = data as ImageProvider[];
        setProviders(list);
        setActiveId((list.find(p => p.is_default) ?? list[0]).id);
      } else { setProviders([]); }
    } catch { setProviders([]); }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const presentTypes = Array.from(new Set(providers.map(p => p.provider_type)));

  const visible = providers.filter(p => {
    if (filter !== 'all' && p.provider_type !== filter) return false;
    if (search && !p.name.toLowerCase().includes(search.toLowerCase()) && !p.model_name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const setDefault = async (p: ImageProvider) => {
    setSettingId(p.id);
    try {
      await supabase.from('image_providers').update({ is_default: false }).neq('id', '');
      await supabase.from('image_providers').update({ is_default: true }).eq('id', p.id);
      setActiveId(p.id);
      toast({ title: `${p.name} — set as default` });
      load();
    } catch (err) { toast({ title: 'Error', description: String(err), variant: 'destructive' }); }
    finally { setSettingId(null); }
  };

  /* ── Fallback: no Supabase data ── */
  if (!loading && providers.length === 0) {
    return (
      <PageContainer>
        <PageHeader title="Models" description="Pick the right engine for the job" icon={Boxes}
          actions={<button className="btn ink sm" onClick={() => setActiveView('admin')}><Upload className="h-4 w-4 mr-1" />Add Provider</button>} />
        <div style={{ background: '#fdf3dc', border: '1px solid #e8c94c', borderRadius: 10, padding: '10px 14px', fontSize: 12, color: 'var(--warn)', marginBottom: 18 }}>
          No models added — go to <strong>Admin → Image Providers</strong>
        </div>
        <div className="mgrid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(270px,1fr))', gap: 16 }}>
          {MODELS.map((m, i) => (
            <motion.div key={m.id} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="ie-card" style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 14, opacity: .6 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
                <div><h4 style={{ fontSize: 16, fontWeight: 700 }}>{m.name}</h4><span className="mic">{m.base}</span></div>
                <span className="ie-tag dim">{m.type}</span>
              </div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {m.tags.map(tag => <span key={tag} className="ie-tag dim">{tag}</span>)}
              </div>
              <div style={{ display: 'grid', gap: 8 }}>
                {[['DOWNLOADS', Math.round(m.downloads / 1000)], ['LIKES', Math.round(m.likes / 100)]].map(([lbl, val]) => (
                  <div key={String(lbl)} style={{ display: 'grid', gridTemplateColumns: '52px 1fr 34px', alignItems: 'center', gap: 10, fontFamily: 'var(--mono)', fontSize: 10.5, color: 'var(--mut)' }}>
                    <span>{lbl}</span>
                    <div style={{ height: 4, borderRadius: 99, background: 'var(--line)', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${val}%`, background: 'var(--ink)', borderRadius: 99 }} />
                    </div>
                    <span>{val}</span>
                  </div>
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
      <PageHeader title="Models" description={`${visible.length} provider${visible.length !== 1 ? 's' : ''} configured`} icon={Boxes}
        actions={<button className="btn ink sm" onClick={() => setActiveView('admin')}><Upload className="h-4 w-4 mr-1" />Add Provider</button>} />

      {/* Filters */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 20, alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 180 }}>
          <Search style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', width: 16, height: 16, color: 'var(--mut)' }} />
          <input className="ie-inp" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search providers…" style={{ paddingLeft: 36 }} />
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {['all', ...presentTypes].map(t => (
            <button key={t} className={`chip${filter === t ? ' on' : ''}`} onClick={() => setFilter(t)}>
              {t === 'all' ? 'All' : (TYPE_LABELS[t] ?? t)}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
          <div style={{ width: 32, height: 32, borderRadius: '50%', border: '2px solid var(--acc)', borderTopColor: 'transparent', animation: 'spin 1s linear infinite' }} />
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(270px,1fr))', gap: 16 }}>
          {visible.map((p, i) => {
            const isActive = activeId === p.id;
            return (
              <motion.div key={p.id} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                whileHover={{ y: -2 }}
                className="ie-card"
                style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 14, border: isActive ? '1px solid rgba(255,77,31,.4)' : '' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
                  <div>
                    <h4 style={{ fontSize: 16, fontWeight: 700, letterSpacing: '-.01em' }}>{p.name}</h4>
                    <span className="mic">{p.model_name}</span>
                  </div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                    {p.provider_type === 'pollinations' && (
                      <span style={{ background: '#e2f6ec', color: 'var(--ok)', fontFamily: 'var(--mono)', fontSize: 10, padding: '3px 8px', borderRadius: 6 }}>FREE</span>
                    )}
                    {p.is_default && (
                      <span className="ie-tag ok" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Star style={{ width: 10, height: 10, fill: 'currentColor' }} /> Default
                      </span>
                    )}
                    <span className="ie-tag dim">{TYPE_LABELS[p.provider_type] ?? p.provider_type}</span>
                  </div>
                </div>
                {p.notes && <p style={{ fontSize: 12, color: 'var(--mut)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.notes}</p>}
                <button
                  onClick={() => setDefault(p)}
                  disabled={settingId === p.id || isActive}
                  className={isActive ? 'btn ghost sm' : 'btn ink sm'}
                  style={{ width: '100%' }}
                >
                  {settingId === p.id
                    ? <><Loader2 style={{ width: 14, height: 14, animation: 'spin 1s linear infinite' }} />Setting…</>
                    : isActive
                    ? <><Check style={{ width: 14, height: 14 }} />Active</>
                    : 'Set as Default'
                  }
                </button>
              </motion.div>
            );
          })}
        </div>
      )}
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </PageContainer>
  );
}
