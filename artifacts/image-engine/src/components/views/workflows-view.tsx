
import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Workflow, Plus, Play, Copy, MoreHorizontal, GitBranch, Loader2, Check } from 'lucide-react';
import { PageContainer, PageHeader } from './shared';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import { useApp } from '@/components/providers/app-provider';
import { useToast } from '@/hooks/use-toast';
import type { ComfyUIWorkflow } from '@/lib/admin-types';
import { WORKFLOWS } from '@/lib/mock-data';

// Fallback shape for mock data compatibility
interface WorkflowItem {
  id: string;
  name: string;
  description: string;
  nodes: number;
  category: string;
  updatedAt: string;
  active: boolean;
  // real fields (optional — only on Supabase rows)
  workflow_json?: Record<string, unknown>;
  server_url?: string;
}

function toWorkflowItem(wf: ComfyUIWorkflow): WorkflowItem {
  const nodeCount = (wf.input_nodes?.length ?? 0) + (wf.output_nodes?.length ?? 0);
  return {
    id: wf.id,
    name: wf.workflow_name,
    description: wf.server_url,
    nodes: nodeCount,
    category: 'ComfyUI',
    updatedAt: wf.updated_at,
    active: true,
    workflow_json: wf.workflow_json,
    server_url: wf.server_url,
  };
}

export function WorkflowsView() {
  const { toast } = useToast();
  const { setActiveView } = useApp();
  const [workflows, setWorkflows] = useState<WorkflowItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [runningId, setRunningId] = useState<string | null>(null);
  const [duplicatingId, setDuplicatingId] = useState<string | null>(null);

  const fetchWorkflows = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('comfyui_workflows')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data && data.length > 0) {
        setWorkflows((data as ComfyUIWorkflow[]).map(toWorkflowItem));
      } else {
        // Supabase empty or unavailable — show mock data as fallback
        setWorkflows(WORKFLOWS.map((wf) => ({ ...wf, updatedAt: wf.updatedAt })));
      }
    } catch {
      setWorkflows(WORKFLOWS.map((wf) => ({ ...wf, updatedAt: wf.updatedAt })));
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchWorkflows(); }, [fetchWorkflows]);

  const handleRun = async (wf: WorkflowItem) => {
    if (!wf.workflow_json) {
      toast({ title: 'لا يوجد Workflow JSON', description: 'افتح الـ Admin وأضف workflow_api.json أولاً', variant: 'destructive' });
      return;
    }
    setRunningId(wf.id);
    try {
      const res = await fetch('/api/comfy/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: wf.workflow_json }),
      });
      const data = await res.json() as { ok: boolean; imageUrl?: string; downloadUrl?: string; error?: string };
      if (data.ok && data.imageUrl) {
        toast({ title: 'تم التوليد!', description: 'الصورة جاهزة' });
      } else {
        toast({ title: 'فشل التوليد', description: data.error ?? 'خطأ غير متوقع', variant: 'destructive' });
      }
    } catch (err) {
      toast({ title: 'خطأ', description: String(err), variant: 'destructive' });
    } finally {
      setRunningId(null);
    }
  };

  const handleDuplicate = async (wf: WorkflowItem) => {
    if (!wf.workflow_json) {
      toast({ title: 'لا يمكن النسخ', description: 'هذا الـ workflow لا يحتوي على JSON', variant: 'destructive' });
      return;
    }
    setDuplicatingId(wf.id);
    try {
      const { error } = await supabase.from('comfyui_workflows').insert({
        provider_id: null,
        server_url: wf.server_url ?? '',
        workflow_name: `${wf.name} (نسخة)`,
        workflow_json: wf.workflow_json,
        input_nodes: [],
        output_nodes: [],
      });
      if (!error) {
        toast({ title: 'تم النسخ' });
        fetchWorkflows();
      } else {
        toast({ title: 'فشل النسخ', description: error.message, variant: 'destructive' });
      }
    } catch (err) {
      toast({ title: 'خطأ', description: String(err), variant: 'destructive' });
    } finally {
      setDuplicatingId(null);
    }
  };

  return (
    <PageContainer>
      <PageHeader
        title="Workflows"
        description="ComfyUI pipelines and generation flows"
        icon={Workflow}
        actions={
          <button
            onClick={() => setActiveView('admin')}
            className="flex items-center gap-2 rounded-xl gradient-amber px-4 py-2 text-sm font-semibold text-black transition-all hover:glow-amber"
          >
            <Plus className="h-4 w-4" />
            New Workflow
          </button>
        }
      />

      {loading ? (
        <div className="mt-16 flex flex-col items-center justify-center gap-3 text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm">Loading workflows...</p>
        </div>
      ) : workflows.length === 0 ? (
        <div className="mt-16 flex flex-col items-center justify-center gap-3 text-muted-foreground">
          <Workflow className="h-12 w-12 opacity-40" />
          <p className="text-sm">لا توجد workflows — اذهب إلى <span className="text-primary">Admin → ComfyUI</span> لإضافة workflow</p>
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {workflows.map((wf, i) => {
            const isRunning = runningId === wf.id;
            const isDuplicating = duplicatingId === wf.id;
            return (
              <motion.div
                key={wf.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.05, 0.3) }}
                whileHover={{ y: -2 }}
                className="group rounded-2xl border border-border bg-card/40 p-5 transition-all hover:border-primary/30 hover:glow-soft"
              >
                <div className="flex items-start justify-between">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-border bg-secondary">
                    <GitBranch className="h-5 w-5 text-primary" />
                  </div>
                  <span
                    className={cn(
                      'flex items-center gap-1.5 rounded-lg px-2 py-1 text-[10px] font-semibold uppercase tracking-wide',
                      wf.active
                        ? 'bg-success/10 text-success'
                        : 'bg-secondary text-muted-foreground',
                    )}
                  >
                    <span
                      className={cn(
                        'h-1.5 w-1.5 rounded-full',
                        wf.active ? 'bg-success animate-pulse' : 'bg-muted-foreground',
                      )}
                    />
                    {wf.active ? 'Active' : 'Inactive'}
                  </span>
                </div>

                <h3 className="mt-4 font-display text-base font-bold tracking-tight">{wf.name}</h3>
                <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{wf.description}</p>

                <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Workflow className="h-3.5 w-3.5" />
                    {wf.nodes} nodes
                  </span>
                  <span className="rounded-md bg-secondary px-2 py-0.5">{wf.category}</span>
                </div>

                <div className="mt-4 flex items-center gap-2 border-t border-border/50 pt-4">
                  <button
                    onClick={() => handleRun(wf)}
                    disabled={isRunning}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-secondary py-2 text-xs font-medium transition-colors hover:bg-secondary/70 disabled:opacity-60"
                  >
                    {isRunning
                      ? <><Loader2 className="h-3.5 w-3.5 animate-spin" />Running...</>
                      : <><Play className="h-3.5 w-3.5" />Run</>
                    }
                  </button>
                  <button
                    onClick={() => handleDuplicate(wf)}
                    disabled={isDuplicating}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground disabled:opacity-60"
                    title="Duplicate"
                  >
                    {isDuplicating
                      ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      : <Copy className="h-3.5 w-3.5" />
                    }
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
