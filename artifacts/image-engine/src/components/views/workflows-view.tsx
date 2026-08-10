import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Plus, Play, Copy, Loader2, GitBranch } from 'lucide-react';
import { PageContainer, PageHeader } from './shared';
import { supabase } from '@/lib/supabase';
import { useApp } from '@/components/providers/app-provider';
import { useToast } from '@/hooks/use-toast';
import { WORKFLOWS } from '@/lib/mock-data';
import type { ComfyUIWorkflow } from '@/lib/admin-types';

interface WF {
  id: string; name: string; description: string;
  nodes: number; category: string; updatedAt: string; active: boolean;
  workflow_json?: Record<string, unknown>; server_url?: string;
}

function toWF(wf: ComfyUIWorkflow): WF {
  return {
    id: wf.id, name: wf.workflow_name, description: wf.server_url,
    nodes: (wf.input_nodes?.length ?? 0) + (wf.output_nodes?.length ?? 0),
    category: 'ComfyUI', updatedAt: wf.updated_at, active: true,
    workflow_json: wf.workflow_json, server_url: wf.server_url,
  };
}

const WF_NODES_DEMO = [
  ['Upload', 'Remove BG', 'Relight', 'Upscale'],
  ['Prompt', 'Batch ×8', 'Curate', 'Collection'],
  ['Img2Img', 'Refine', 'Face-fix', 'Export'],
];

export function WorkflowsView() {
  const { toast } = useToast();
  const { setActiveView } = useApp();
  const [workflows, setWorkflows] = useState<WF[]>([]);
  const [loading, setLoading] = useState(true);
  const [runningId, setRunningId] = useState<string | null>(null);
  const [dupId, setDupId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from('comfyui_workflows').select('*').order('created_at', { ascending: false });
      setWorkflows(!error && data && data.length > 0
        ? (data as ComfyUIWorkflow[]).map(toWF)
        : WORKFLOWS.map(w => ({ ...w, updatedAt: w.updatedAt })));
    } catch {
      setWorkflows(WORKFLOWS.map(w => ({ ...w, updatedAt: w.updatedAt })));
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleRun = async (wf: WF) => {
    if (!wf.workflow_json) {
      toast({ title: 'No workflow JSON', description: 'Add from Admin → ComfyUI', variant: 'destructive' }); return;
    }
    setRunningId(wf.id);
    try {
      const res = await fetch('/api/comfy/generate', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: wf.workflow_json }),
      });
      const d = await res.json() as { ok: boolean; error?: string };
      if (d.ok) toast({ title: 'Workflow finished!' });
      else toast({ title: 'Failed', description: d.error, variant: 'destructive' });
    } catch (err) {
      toast({ title: 'Error', description: String(err), variant: 'destructive' });
    } finally { setRunningId(null); }
  };

  const handleDup = async (wf: WF) => {
    if (!wf.workflow_json) { toast({ title: 'Cannot duplicate — no JSON', variant: 'destructive' }); return; }
    setDupId(wf.id);
    const { error } = await supabase.from('comfyui_workflows').insert({
      server_url: wf.server_url ?? '', workflow_name: `${wf.name} (copy)`,
      workflow_json: wf.workflow_json, input_nodes: [], output_nodes: [],
    });
    if (!error) { toast({ title: 'Duplicated' }); load(); }
    else toast({ title: 'Error', description: error.message, variant: 'destructive' });
    setDupId(null);
  };

  return (
    <PageContainer>
      <PageHeader title="Workflows" description="Multi-step creative pipelines, chained and repeatable"
        actions={
          <button className="btn ghost sm" onClick={() => setActiveView('admin')}>
            <Plus style={{ width: 15, height: 15 }} /> New workflow
          </button>
        }
      />

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
          <div style={{ width: 32, height: 32, borderRadius: '50%', border: '2px solid var(--acc)', borderTopColor: 'transparent', animation: 'spin 1s linear infinite' }} />
        </div>
      ) : workflows.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--mut)' }}>
          <p>No workflows — go to <span style={{ color: 'var(--acc)' }}>Admin → ComfyUI</span></p>
        </div>
      ) : (
        <div className="wflist" style={{ display: 'flex', flexDirection: 'column', gap: 14, maxWidth: 900 }}>
          {workflows.map((wf, i) => {
            const isRunning = runningId === wf.id;
            const nodes = WF_NODES_DEMO[i % WF_NODES_DEMO.length] ?? wf.name.split(' ').slice(0, 4);
            return (
              <motion.div key={wf.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                className="ie-card" style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 14 }}>
                {/* Head */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--panel)', border: '1px solid var(--line)', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                    <GitBranch style={{ width: 16, height: 16, color: 'var(--acc)' }} />
                  </div>
                  <b style={{ fontSize: 15, fontWeight: 700 }}>{wf.name}</b>
                  <span className={`ie-tag ${wf.active ? 'ok' : 'dim'}`}>{wf.active ? 'healthy' : 'inactive'}</span>
                  <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
                    <button className="btn ink sm" onClick={() => handleRun(wf)} disabled={isRunning}>
                      {isRunning
                        ? <><div style={{ width: 14, height: 14, borderRadius: '50%', border: '2px solid rgba(255,255,255,.3)', borderTopColor: '#fff', animation: 'spin 1s linear infinite' }} />Running…</>
                        : <><Play style={{ width: 14, height: 14 }} />Run</>}
                    </button>
                    <button className="ibtn" onClick={() => handleDup(wf)} disabled={dupId === wf.id} aria-label="Duplicate">
                      <Copy style={{ width: 14, height: 14 }} />
                    </button>
                  </div>
                </div>

                {/* Nodes pipeline */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 0, overflowX: 'auto', padding: '6px 2px' }}>
                  {nodes.map((n, k) => (
                    <div key={k} style={{ display: 'flex', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, border: '1px solid var(--line2)', background: 'var(--panel)', borderRadius: 10, padding: '8px 12px', fontFamily: 'var(--mono)', fontSize: 11, whiteSpace: 'nowrap', flexShrink: 0, ...(isRunning ? { animation: 'nodepulse 1s infinite' } : {}) }}>
                        <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--acc)', flexShrink: 0 }} />
                        {n}
                      </div>
                      {k < nodes.length - 1 && (
                        <div style={{ width: 26, height: 1.5, background: 'var(--line2)', flexShrink: 0, position: 'relative' }}>
                          <div style={{ position: 'absolute', right: 0, top: -3, border: '3.5px solid transparent', borderLeftColor: 'var(--line2)' }} />
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Meta */}
                <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', fontFamily: 'var(--mono)', fontSize: 10.5, color: 'var(--mut)' }}>
                  <span>{wf.nodes || nodes.length} NODES</span>
                  <span>LAST {new Date(wf.updatedAt).toLocaleDateString().toUpperCase()}</span>
                  <span>{wf.category}</span>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
      <style>{`
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes nodepulse{50%{border-color:var(--acc)}}
      `}</style>
    </PageContainer>
  );
}
