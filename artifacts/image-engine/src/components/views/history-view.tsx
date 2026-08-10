import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Check, X, Ban, Clock, RotateCcw, Copy, Loader2, Image as ImageIcon } from 'lucide-react';
import { useApp } from '@/components/providers/app-provider';
import { PageContainer, PageHeader } from './shared';
import { supabase } from '@/lib/supabase';
import type { GenerationJobDB } from '@/lib/admin-types';

const STATUS: Record<string, { tag: string; label: string }> = {
  complete: { tag: 'ok',   label: 'done' },
  failed:   { tag: 'err',  label: 'failed' },
  canceled: { tag: 'dim',  label: 'canceled' },
  queued:   { tag: 'dim',  label: 'queued' },
  running:  { tag: 'warn', label: 'running' },
};

const FILTERS = ['all', 'complete', 'failed', 'canceled'] as const;
type F = typeof FILTERS[number];

export function HistoryView() {
  const { setPrompt, setActiveView } = useApp();
  const [jobs, setJobs] = useState<GenerationJobDB[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<F>('all');

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from('generation_jobs').select('*').order('created_at', { ascending: false }).limit(100);
    if (data) setJobs(data as GenerationJobDB[]);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const entries = filter === 'all' ? jobs : jobs.filter(j => j.status === filter);

  const dur = (j: GenerationJobDB) => {
    if (!j.started_at || !j.completed_at) return null;
    return Math.round((new Date(j.completed_at).getTime() - new Date(j.started_at).getTime()) / 1000);
  };

  // Group by day
  const byDay = entries.reduce<Record<string, GenerationJobDB[]>>((acc, j) => {
    const d = new Date(j.created_at).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });
    if (!acc[d]) acc[d] = [];
    acc[d].push(j);
    return acc;
  }, {});

  return (
    <PageContainer>
      <PageHeader title="History" description="Every operation, in order. Reuse anything." />

      {/* Filters */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
        {FILTERS.map(f => (
          <button key={f} className={`chip${filter === f ? ' on' : ''}`} onClick={() => setFilter(f)}
            style={{ textTransform: 'capitalize' }}>
            {f}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
          <Loader2 style={{ width: 32, height: 32, animation: 'spin 1s linear infinite', color: 'var(--acc)' }} />
        </div>
      ) : entries.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--mut)' }}>
          <Clock style={{ width: 48, height: 48, opacity: .3, margin: '0 auto 12px' }} />
          <p>No history yet — generate your first image!</p>
        </div>
      ) : (
        Object.entries(byDay).map(([day, dayJobs]) => (
          <div key={day} style={{ marginBottom: 26 }}>
            {/* Day label */}
            <h4 className="mic" style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
              {day}
              <span style={{ flex: 1, height: 1, background: 'var(--line)' }} />
            </h4>

            {dayJobs.map((job, i) => {
              const s = STATUS[job.status] ?? STATUS.complete;
              const d = dur(job);
              return (
                <motion.div key={job.id}
                  initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                  style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 14px', border: '1px solid var(--line)', borderRadius: 14, background: 'var(--card)', marginBottom: 10, transition: '.15s' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--line2)'; e.currentTarget.style.boxShadow = 'var(--sh)'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--line)'; e.currentTarget.style.boxShadow = ''; }}
                  className="hrow"
                >
                  {/* Thumb */}
                  <div style={{ width: 52, height: 52, borderRadius: 10, overflow: 'hidden', background: 'var(--panel)', flexShrink: 0, border: '1px solid var(--line)' }}>
                    {job.image_url
                      ? <img src={job.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : <div style={{ display: 'grid', placeItems: 'center', height: '100%' }}><ImageIcon style={{ width: 20, height: 20, opacity: .3 }} /></div>
                    }
                  </div>

                  {/* Text */}
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <b style={{ display: 'block', fontSize: 13.5, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {job.prompt}
                    </b>
                    <span style={{ fontFamily: 'var(--mono)', fontSize: 10.5, color: 'var(--mut)' }}>
                      {job.model?.toUpperCase()} · {d !== null ? `${d}s` : '—'} · {new Date(job.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  {/* Status + actions */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                    <span className={`ie-tag ${s.tag}`}>{s.label}</span>
                    <button className="ibtn" onClick={() => navigator.clipboard?.writeText(job.prompt)} aria-label="Copy">
                      <Copy style={{ width: 15, height: 15 }} />
                    </button>
                    <button className="ibtn" onClick={() => { setPrompt(job.prompt); setActiveView('generate'); }} aria-label="Reuse" title="Reuse prompt">
                      <RotateCcw style={{ width: 15, height: 15 }} />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        ))
      )}
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </PageContainer>
  );
}
