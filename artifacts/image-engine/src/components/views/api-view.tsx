
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Code2, Copy, Check, Webhook, Zap, Loader2, Image as ImageIcon, MessageSquare, Wand2, Video } from 'lucide-react';
import { PageContainer, PageHeader } from './shared';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';

// ── Real endpoints that actually exist on the backend ──────────────
const ENDPOINTS = [
  { method: 'POST', path: '/api/image-providers/generate', desc: 'Generate an image via configured provider (Gemini, Pollinations, OpenAI, etc.)' },
  { method: 'GET',  path: '/api/image-providers',          desc: 'List all enabled image providers' },
  { method: 'POST', path: '/api/edit',                     desc: 'AI-powered image editing — upload + prompt' },
  { method: 'POST', path: '/api/chat',                     desc: 'Send a chat message to the configured AI provider' },
  { method: 'GET',  path: '/api/chat/sessions',            desc: 'List all chat sessions' },
  { method: 'POST', path: '/api/chat/sessions',            desc: 'Create a new chat session' },
  { method: 'POST', path: '/api/comfy/generate',           desc: 'Run a ComfyUI workflow and wait for the image' },
  { method: 'GET',  path: '/api/comfy/check',              desc: 'Check connectivity to the ComfyUI instance' },
  { method: 'POST', path: '/api/generate',                 desc: 'Proxy a raw ComfyUI workflow to /prompt' },
  { method: 'GET',  path: '/api/videos',                   desc: 'List Facebook page videos with pagination & search' },
  { method: 'POST', path: '/api/videos/sync',              desc: 'Sync all videos from Facebook Graph API (SSE stream)' },
  { method: 'GET',  path: '/api/stats',                    desc: 'Fetch site statistics (visits, edits, videos)' },
  { method: 'GET',  path: '/api/healthz',                  desc: 'Health check endpoint' },
];

// ── Code samples for the most useful endpoints ─────────────────────
const CODE_SAMPLES: Record<string, string> = {
  generate: `# Generate an image
curl -X POST /api/image-providers/generate \\
  -H "Content-Type: application/json" \\
  -d '{
    "provider_type": "pollinations",
    "model": "flux",
    "prompt": "cinematic portrait, golden hour",
    "width": 1024,
    "height": 1024
  }'`,
  edit: `# Edit an image with AI
curl -X POST /api/edit \\
  -H "Content-Type: application/json" \\
  -d '{
    "text": "add a sunset sky background",
    "imageUrl": "https://example.com/image.png",
    "width": 1024,
    "height": 1024
  }'`,
  chat: `# Chat with AI
curl -X POST /api/chat \\
  -H "Content-Type: application/json" \\
  -d '{
    "message": "Describe this image in detail",
    "providerId": "your-provider-id"
  }'`,
  comfy: `# Run a ComfyUI workflow
curl -X POST /api/comfy/generate \\
  -H "Content-Type: application/json" \\
  -d '{
    "prompt": { "3": { "class_type": "KSampler", "inputs": { ... } } }
  }'`,
};

type SampleKey = keyof typeof CODE_SAMPLES;

interface RealStats {
  totalImages: number;
  totalJobs: number;
  totalChats: number;
  totalVideos: number;
  loading: boolean;
}

export function ApiView() {
  const [copiedCode, setCopiedCode] = useState(false);
  const [activeTab, setActiveTab] = useState<SampleKey>('generate');
  const [stats, setStats] = useState<RealStats>({
    totalImages: 0, totalJobs: 0, totalChats: 0, totalVideos: 0, loading: true,
  });

  // Fetch real stats from Supabase
  useEffect(() => {
    async function load() {
      try {
        const [imagesRes, jobsRes, chatsRes, videosRes] = await Promise.all([
          supabase.from('stored_images').select('id', { count: 'exact', head: true }),
          supabase.from('generation_jobs').select('id', { count: 'exact', head: true }),
          supabase.from('chat_messages').select('id', { count: 'exact', head: true }),
          supabase.from('page_videos').select('id', { count: 'exact', head: true }),
        ]);
        setStats({
          totalImages: imagesRes.count ?? 0,
          totalJobs:   jobsRes.count   ?? 0,
          totalChats:  chatsRes.count  ?? 0,
          totalVideos: videosRes.count ?? 0,
          loading: false,
        });
      } catch {
        setStats(s => ({ ...s, loading: false }));
      }
    }
    load();
  }, []);

  const copy = (text: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 1500);
  };

  const SAMPLE_TABS: { key: SampleKey; label: string; icon: React.ElementType }[] = [
    { key: 'generate', label: 'Generate',  icon: ImageIcon },
    { key: 'edit',     label: 'Edit',      icon: Wand2 },
    { key: 'chat',     label: 'Chat',      icon: MessageSquare },
    { key: 'comfy',    label: 'ComfyUI',   icon: Zap },
  ];

  return (
    <PageContainer>
      <PageHeader
        title="API Reference"
        description="All available backend endpoints and live usage stats"
        icon={Code2}
      />

      {/* Live stats */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4"
      >
        {[
          { label: 'Images Stored',  value: stats.totalImages, icon: ImageIcon,     color: 'text-primary' },
          { label: 'Generation Jobs',value: stats.totalJobs,   icon: Zap,           color: 'text-amber-400' },
          { label: 'Chat Messages',  value: stats.totalChats,  icon: MessageSquare, color: 'text-blue-400' },
          { label: 'Videos',         value: stats.totalVideos, icon: Video,         color: 'text-emerald-400' },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.label} className="rounded-2xl border border-border bg-card/40 p-4">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Icon className={cn('h-4 w-4', item.color)} />
                <span className="text-xs font-medium">{item.label}</span>
              </div>
              <div className="mt-2">
                {stats.loading ? (
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                ) : (
                  <span className="font-display text-2xl font-bold">
                    {item.value.toLocaleString()}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </motion.div>

      {/* Code samples */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08 }}
        className="mt-6 overflow-hidden rounded-2xl border border-border bg-card/40"
      >
        {/* Tab bar */}
        <div className="flex items-center justify-between border-b border-border px-2 py-1.5">
          <div className="flex gap-1">
            {SAMPLE_TABS.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={cn(
                    'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors',
                    activeTab === tab.key
                      ? 'bg-primary/15 text-primary'
                      : 'text-muted-foreground hover:bg-secondary/50 hover:text-foreground',
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {tab.label}
                </button>
              );
            })}
          </div>
          <button
            onClick={() => copy(CODE_SAMPLES[activeTab])}
            className="mr-2 flex items-center gap-1.5 rounded-lg bg-secondary px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            {copiedCode ? <Check className="h-3.5 w-3.5 text-success" /> : <Copy className="h-3.5 w-3.5" />}
            {copiedCode ? 'Copied' : 'Copy'}
          </button>
        </div>
        <pre className="overflow-x-auto p-5 font-mono text-sm leading-relaxed text-muted-foreground">
          <code>{CODE_SAMPLES[activeTab]}</code>
        </pre>
      </motion.div>

      {/* Endpoints table */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.14 }}
        className="mt-6 overflow-hidden rounded-2xl border border-border bg-card/40"
      >
        <div className="flex items-center gap-2 border-b border-border px-5 py-3">
          <Webhook className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold">Available Endpoints</h3>
          <span className="ml-auto rounded-md bg-secondary px-2 py-0.5 text-xs text-muted-foreground">
            {ENDPOINTS.length} endpoints
          </span>
        </div>
        <div>
          {ENDPOINTS.map((ep, i) => (
            <div
              key={ep.path}
              className={cn(
                'flex items-center gap-3 px-5 py-3 transition-colors hover:bg-secondary/30',
                i !== ENDPOINTS.length - 1 && 'border-b border-border/50',
              )}
            >
              <span
                className={cn(
                  'w-16 shrink-0 rounded-md px-2 py-1 text-center text-[10px] font-bold uppercase',
                  ep.method === 'GET'    ? 'bg-success/10 text-success'
                  : ep.method === 'POST'  ? 'bg-primary/10 text-primary'
                  : ep.method === 'PATCH' ? 'bg-amber-400/10 text-amber-400'
                  : ep.method === 'DELETE'? 'bg-destructive/10 text-destructive'
                  : 'bg-secondary text-muted-foreground',
                )}
              >
                {ep.method}
              </span>
              <code className="shrink-0 font-mono text-sm">{ep.path}</code>
              <span className="ml-auto hidden text-right text-xs text-muted-foreground sm:block">
                {ep.desc}
              </span>
            </div>
          ))}
        </div>
      </motion.div>
    </PageContainer>
  );
}
