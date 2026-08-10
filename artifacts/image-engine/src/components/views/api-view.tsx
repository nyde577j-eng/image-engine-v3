import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Code2, Copy, Check, Webhook, Zap, Loader2, Image as ImageIcon, MessageSquare, Wand2, Video } from 'lucide-react';
import { PageContainer, PageHeader } from './shared';
import { supabase } from '@/lib/supabase';

const ENDPOINTS = [
  { method: 'POST', path: '/api/image-providers/generate', desc: 'Generate image via configured provider' },
  { method: 'GET',  path: '/api/image-providers',          desc: 'List all enabled image providers' },
  { method: 'POST', path: '/api/edit',                     desc: 'AI-powered image editing' },
  { method: 'POST', path: '/api/chat',                     desc: 'Send chat message to AI' },
  { method: 'GET',  path: '/api/chat/sessions',            desc: 'List chat sessions' },
  { method: 'POST', path: '/api/chat/sessions',            desc: 'Create new chat session' },
  { method: 'POST', path: '/api/comfy/generate',           desc: 'Run ComfyUI workflow' },
  { method: 'GET',  path: '/api/comfy/check',              desc: 'Check ComfyUI connectivity' },
  { method: 'POST', path: '/api/generate',                 desc: 'Proxy raw ComfyUI workflow' },
  { method: 'GET',  path: '/api/videos',                   desc: 'List Facebook page videos' },
  { method: 'POST', path: '/api/videos/sync',              desc: 'Sync videos from Facebook Graph API' },
  { method: 'GET',  path: '/api/stats',                    desc: 'Fetch site statistics' },
  { method: 'GET',  path: '/api/healthz',                  desc: 'Health check' },
];

const CODE_SAMPLES = {
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
    "imageUrl": "https://example.com/image.png"
  }'`,
  chat: `# Chat with AI
curl -X POST /api/chat \\
  -H "Content-Type: application/json" \\
  -d '{
    "message": "Describe this image",
    "providerId": "your-provider-id"
  }'`,
  comfy: `# Run a ComfyUI workflow
curl -X POST /api/comfy/generate \\
  -H "Content-Type: application/json" \\
  -d '{
    "prompt": { "3": { "class_type": "KSampler", "inputs": {} } }
  }'`,
} as const;

type SampleKey = keyof typeof CODE_SAMPLES;

const METHOD_COLOR: Record<string, { bg: string; color: string }> = {
  GET:    { bg: '#e2f6ec', color: 'var(--ok)' },
  POST:   { bg: 'var(--accsoft)', color: 'var(--acc2)' },
  PATCH:  { bg: '#fdf3dc', color: 'var(--warn)' },
  DELETE: { bg: '#fde8e5', color: 'var(--err)' },
};

export function ApiView() {
  const [activeTab, setActiveTab] = useState<SampleKey>('generate');
  const [copied, setCopied] = useState(false);
  const [stats, setStats] = useState({ images: 0, jobs: 0, chats: 0, videos: 0, loading: true });

  useEffect(() => {
    Promise.all([
      supabase.from('stored_images').select('id', { count: 'exact', head: true }),
      supabase.from('generation_jobs').select('id', { count: 'exact', head: true }),
      supabase.from('chat_messages').select('id', { count: 'exact', head: true }),
      supabase.from('page_videos').select('id', { count: 'exact', head: true }),
    ]).then(([i, j, c, v]) => {
      setStats({ images: i.count ?? 0, jobs: j.count ?? 0, chats: c.count ?? 0, videos: v.count ?? 0, loading: false });
    }).catch(() => setStats(s => ({ ...s, loading: false })));
  }, []);

  const copy = () => {
    navigator.clipboard?.writeText(CODE_SAMPLES[activeTab]);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const TABS: { key: SampleKey; label: string }[] = [
    { key: 'generate', label: 'Generate' },
    { key: 'edit',     label: 'Edit' },
    { key: 'chat',     label: 'Chat' },
    { key: 'comfy',    label: 'ComfyUI' },
  ];

  const STAT_ITEMS = [
    { label: 'Images',  val: stats.images,  color: 'var(--acc)' },
    { label: 'Jobs',    val: stats.jobs,     color: '#f59e0b' },
    { label: 'Chats',   val: stats.chats,    color: '#3b82f6' },
    { label: 'Videos',  val: stats.videos,   color: 'var(--ok)' },
  ];

  return (
    <PageContainer>
      <PageHeader title="API" description="Available backend endpoints and live usage stats" icon={Code2} />

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 20 }} className="api-stats">
        {STAT_ITEMS.map(item => (
          <motion.div key={item.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="ie-stat">
            <span className="mic" style={{ display: 'block', marginBottom: 6 }}>{item.label}</span>
            {stats.loading
              ? <div style={{ width: 24, height: 24, borderRadius: '50%', border: '2px solid var(--line)', borderTopColor: 'var(--acc)', animation: 'spin 1s linear infinite' }} />
              : <b className="stat-val" style={{ color: item.color }}>{item.val.toLocaleString()}</b>
            }
          </motion.div>
        ))}
      </div>

      {/* Code samples */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.07 }}
        style={{ background: 'var(--dark)', border: '1px solid var(--dline)', borderRadius: 14, overflow: 'hidden', marginBottom: 18 }}>
        {/* Tab bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--dline)', padding: '8px 12px' }}>
          <div style={{ display: 'flex', gap: 4 }}>
            {TABS.map(tab => (
              <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                style={{
                  padding: '6px 12px', borderRadius: 8, fontSize: 12, fontFamily: 'var(--ui)', fontWeight: 500,
                  border: 0, cursor: 'pointer', transition: '.15s',
                  background: activeTab === tab.key ? 'rgba(255,77,31,.2)' : 'transparent',
                  color: activeTab === tab.key ? 'var(--acc)' : 'var(--dmut)',
                }}>
                {tab.label}
              </button>
            ))}
          </div>
          <button onClick={copy}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 10px', borderRadius: 8, fontSize: 11, fontFamily: 'var(--mono)', border: '1px solid var(--dline)', background: 'none', color: 'var(--dmut)', cursor: 'pointer' }}>
            {copied ? <Check style={{ width: 12, height: 12, color: 'var(--ok)' }} /> : <Copy style={{ width: 12, height: 12 }} />}
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>
        <pre style={{ padding: 18, fontFamily: 'var(--mono)', fontSize: 12.5, color: 'var(--dtext)', overflowX: 'auto', lineHeight: 1.7, margin: 0 }}>
          <code>{CODE_SAMPLES[activeTab]}</code>
        </pre>
      </motion.div>

      {/* Endpoints */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.13 }}
        className="ie-card" style={{ overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, borderBottom: '1px solid var(--line)', padding: '12px 18px' }}>
          <Webhook style={{ width: 16, height: 16, color: 'var(--acc)' }} />
          <span style={{ fontSize: 14, fontWeight: 600 }}>Available Endpoints</span>
          <span className="ie-tag dim" style={{ marginLeft: 'auto' }}>{ENDPOINTS.length} endpoints</span>
        </div>
        <div>
          {ENDPOINTS.map((ep, i) => {
            const mc = METHOD_COLOR[ep.method] ?? { bg: 'var(--panel)', color: 'var(--mut)' };
            return (
              <div key={ep.path}
                style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 18px', transition: '.12s', borderBottom: i < ENDPOINTS.length - 1 ? '1px solid var(--line)' : 'none' }}
                onMouseEnter={e => { e.currentTarget.style.background = 'var(--panel)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = ''; }}>
                <span style={{ width: 54, flexShrink: 0, borderRadius: 6, padding: '3px 0', textAlign: 'center', fontFamily: 'var(--mono)', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', background: mc.bg, color: mc.color }}>
                  {ep.method}
                </span>
                <code style={{ fontFamily: 'var(--mono)', fontSize: 13, flexShrink: 0 }}>{ep.path}</code>
                <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--mut)', textAlign: 'right', display: 'none' }} className="ep-desc">
                  {ep.desc}
                </span>
              </div>
            );
          })}
        </div>
      </motion.div>

      <style>{`
        @keyframes spin{to{transform:rotate(360deg)}}
        @media(max-width:700px){ .api-stats{ grid-template-columns:repeat(2,1fr) !important; } }
        @media(min-width:640px){ .ep-desc{ display:block !important; } }
      `}</style>
    </PageContainer>
  );
}
