import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/supabase';

/* ─── Data ───────────────────────────────────────────────────────── */
const ENDPOINTS = [
  { method:'POST', path:'/api/image-providers/generate', desc:'Generate image via configured provider' },
  { method:'GET',  path:'/api/image-providers',          desc:'List all enabled image providers' },
  { method:'POST', path:'/api/edit',                     desc:'AI-powered image editing' },
  { method:'POST', path:'/api/chat',                     desc:'Send chat message to AI' },
  { method:'GET',  path:'/api/chat/sessions',            desc:'List chat sessions (filtered by user_key)' },
  { method:'POST', path:'/api/chat/sessions',            desc:'Create a new chat session' },
  { method:'POST', path:'/api/comfy/generate',           desc:'Run a ComfyUI workflow' },
  { method:'GET',  path:'/api/comfy/check',              desc:'Check ComfyUI connectivity' },
  { method:'GET',  path:'/api/videos',                   desc:'List page videos with search & pagination' },
  { method:'POST', path:'/api/videos/sync',              desc:'Sync videos from Facebook Graph API' },
  { method:'POST', path:'/api/tts/generate',             desc:'Generate speech from text' },
  { method:'POST', path:'/api/tts/clone',                desc:'Clone a voice from audio file' },
  { method:'GET',  path:'/api/tts/voices',               desc:'Browse voice library' },
  { method:'GET',  path:'/api/stats',                    desc:'Site statistics' },
  { method:'GET',  path:'/api/healthz',                  desc:'Health check' },
] as const;

const SAMPLES = {
  generate: `POST /api/image-providers/generate
{
  "provider_type": "pollinations",
  "model": "flux",
  "prompt": "cinematic portrait, golden hour",
  "width": 1024,
  "height": 1024
}`,
  edit: `POST /api/edit
{
  "text": "add a sunset sky background",
  "imageUrl": "https://example.com/image.png",
  "width": 1024,
  "height": 1024
}`,
  chat: `POST /api/chat
{
  "message": "Help me write a prompt",
  "providerId": "your-provider-id",
  "history": []
}`,
  tts: `POST /api/tts/generate
{
  "text": "Welcome to Image Engine",
  "format": "mp3",
  "speed": 1.0,
  "reference_id": "voice-id-optional"
}`,
} as const;
type Tab = keyof typeof SAMPLES;

/* ─── method colors ─────────────────────────────────────────────── */
const MC: Record<string, { bg:string; color:string }> = {
  GET:    { bg:'#e2f6ec', color:'var(--ok)' },
  POST:   { bg:'var(--accsoft)', color:'var(--acc2)' },
  DELETE: { bg:'#fde8e5', color:'var(--err)' },
};

/* ─── API Keys panel ─────────────────────────────────────────────── */
const API_KEYS = [
  { key:'ie_live_••••••••4f2a', scope:'full',  created:'Jan 12' },
  { key:'ie_test_••••••••91ce', scope:'read',  created:'Mar 03' },
] as const;

/* ─── Usage bars ─────────────────────────────────────────────────── */
const USAGE: { label: string; val: string; pct: number; hot?: boolean }[] = [
  { label:'REQUESTS',       val:'8,412 / 20,000', pct:42 },
  { label:'COMPUTE MINUTES',val:'311 / 500',       pct:62 },
  { label:'STORAGE',        val:'31 / 50 GB',      pct:62, hot:true },
];

export function ApiView() {
  const [tab, setTab] = useState<Tab>('generate');
  const [apiTab, setApiTab] = useState<'keys'|'endpoints'|'usage'>('keys');
  const [copied, setCopied] = useState(false);
  const [stats, setStats] = useState({ images:0, jobs:0, chats:0, videos:0, loading:true });

  useEffect(() => {
    Promise.all([
      supabase.from('stored_images').select('id',{count:'exact',head:true}),
      supabase.from('generation_jobs').select('id',{count:'exact',head:true}),
      supabase.from('chat_messages').select('id',{count:'exact',head:true}),
      supabase.from('page_videos').select('id',{count:'exact',head:true}),
    ]).then(([i,j,c,v]) => {
      setStats({ images:i.count??0, jobs:j.count??0, chats:c.count??0, videos:v.count??0, loading:false });
    }).catch(() => setStats(s => ({...s, loading:false})));
  }, []);

  const copy = () => {
    navigator.clipboard?.writeText(SAMPLES[tab]);
    setCopied(true); setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div style={{ padding:'clamp(16px,3vw,30px)', paddingBottom:80, maxWidth:1460, margin:'0 auto' }}>

      {/* ── Header ── */}
      <div className="vhead">
        <div><h2>API</h2><p>Programmatic access to every engine capability</p></div>
      </div>

      {/* ── Live stats row ── */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:24 }} className="api-stats-row">
        {[
          { label:'Images',  val:stats.images,  color:'var(--acc)' },
          { label:'Jobs',    val:stats.jobs,    color:'#f59e0b' },
          { label:'Chats',   val:stats.chats,   color:'#3b82f6' },
          { label:'Videos',  val:stats.videos,  color:'var(--ok)' },
        ].map(item => (
          <motion.div key={item.label} initial={{opacity:0,y:8}} animate={{opacity:1,y:0}}
            className="ie-stat">
            <span className="mic" style={{display:'block',marginBottom:6}}>{item.label}</span>
            {stats.loading
              ? <div style={{width:24,height:24,borderRadius:'50%',border:'2px solid var(--line)',borderTopColor:'var(--acc)',animation:'spin 1s linear infinite'}} />
              : <b style={{fontFamily:'var(--mono)',fontSize:22,fontWeight:700,color:item.color}}>{item.val.toLocaleString()}</b>
            }
          </motion.div>
        ))}
      </div>

      {/* ── Duo layout: sidenav + content ── */}
      <div className="api-duo" style={{display:'grid',gridTemplateColumns:'220px 1fr',gap:18,alignItems:'start'}}>

        {/* Side nav */}
        <nav style={{display:'flex',flexDirection:'column',gap:4,position:'sticky',top:86}} className="api-sidenav">
          {(['keys','endpoints','usage'] as const).map(t => (
            <button key={t} onClick={()=>setApiTab(t)}
              style={{
                display:'flex',alignItems:'center',gap:10,border:0,borderRadius:10,padding:'10px 12px',
                background: apiTab===t ? 'var(--ink)' : 'none',
                color: apiTab===t ? 'var(--bg)' : 'var(--mut)',
                fontFamily:'var(--ui)',fontSize:13.5,cursor:'pointer',transition:'.15s',textAlign:'left',
                textTransform:'capitalize',
              }}
              onMouseEnter={e=>{if(apiTab!==t){e.currentTarget.style.background='var(--card)';e.currentTarget.style.color='var(--ink)';}}}
              onMouseLeave={e=>{if(apiTab!==t){e.currentTarget.style.background='none';e.currentTarget.style.color='var(--mut)';}}}
            >
              {t==='keys' && <svg style={{width:16,height:16,fill:'none',stroke:'currentColor',strokeWidth:1.8}} viewBox="0 0 24 24"><circle cx="8" cy="14" r="4"/><path d="M11 11l9-9M17 5l3 3M14 8l3 3"/></svg>}
              {t==='endpoints' && <svg style={{width:16,height:16,fill:'none',stroke:'currentColor',strokeWidth:1.8}} viewBox="0 0 24 24"><path d="M8 8l-5 4 5 4M16 8l5 4-5 4"/></svg>}
              {t==='usage' && <svg style={{width:16,height:16,fill:'none',stroke:'currentColor',strokeWidth:1.8}} viewBox="0 0 24 24"><path d="M13 2 4 14h6l-1 8 9-12h-6z"/></svg>}
              {t === 'keys' ? 'API Keys' : t === 'endpoints' ? 'Endpoints' : 'Usage'}
            </button>
          ))}
        </nav>

        {/* Content panels */}
        <div>

          {/* ── API Keys ── */}
          {apiTab === 'keys' && (
            <motion.div initial={{opacity:0,y:6}} animate={{opacity:1,y:0}} className="ie-card" style={{padding:22}}>
              <h3 style={{fontSize:17,fontWeight:700,marginBottom:4}}>API Keys</h3>
              <p style={{color:'var(--mut)',fontSize:13.5,marginBottom:18}}>Programmatic access to every engine capability.</p>

              <table style={{width:'100%',borderCollapse:'collapse',fontSize:13.5}}>
                <thead>
                  <tr>
                    {['Key','Scope','Created',''].map(h => (
                      <th key={h} style={{fontFamily:'var(--mono)',fontSize:10.5,letterSpacing:'.12em',textTransform:'uppercase',color:'var(--mut)',textAlign:'left',padding:'10px 14px',borderBottom:'1px solid var(--line)'}}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {API_KEYS.map(k => (
                    <tr key={k.key} onMouseEnter={e=>e.currentTarget.style.background='var(--panel)'} onMouseLeave={e=>e.currentTarget.style.background=''}>
                      <td style={{padding:'12px 14px',borderBottom:'1px solid var(--line)',fontFamily:'var(--mono)',fontSize:12}}>{k.key}</td>
                      <td style={{padding:'12px 14px',borderBottom:'1px solid var(--line)'}}>
                        <span className={k.scope==='full'?'ie-tag ok':'ie-tag dim'}>{k.scope}</span>
                      </td>
                      <td style={{padding:'12px 14px',borderBottom:'1px solid var(--line)',color:'var(--mut)'}}>{k.created}</td>
                      <td style={{padding:'12px 14px',borderBottom:'1px solid var(--line)',textAlign:'right'}}>
                        <button className="ibtn" onClick={()=>{navigator.clipboard?.writeText(k.key);}} aria-label="Copy">
                          <svg style={{width:15,height:15,fill:'none',stroke:'currentColor',strokeWidth:1.8}} viewBox="0 0 24 24"><rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/></svg>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div style={{marginTop:14}}>
                <button className="btn ink sm">
                  <svg style={{width:14,height:14,fill:'none',stroke:'currentColor',strokeWidth:1.8}} viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>
                  Create key
                </button>
              </div>
            </motion.div>
          )}

          {/* ── Endpoints ── */}
          {apiTab === 'endpoints' && (
            <motion.div initial={{opacity:0,y:6}} animate={{opacity:1,y:0}}>
              {/* Code samples */}
              <div className="ie-card" style={{overflow:'hidden',marginBottom:16}}>
                <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',borderBottom:'1px solid var(--dline)',padding:'8px 12px',background:'var(--dark)'}}>
                  <div style={{display:'flex',gap:4}}>
                    {(Object.keys(SAMPLES) as Tab[]).map(t => (
                      <button key={t} onClick={()=>setTab(t)}
                        style={{padding:'6px 12px',borderRadius:8,fontSize:12,fontFamily:'var(--ui)',fontWeight:500,border:0,cursor:'pointer',transition:'.15s',background:tab===t?'rgba(255,77,31,.2)':'transparent',color:tab===t?'var(--acc)':'var(--dmut)'}}>
                        {t.charAt(0).toUpperCase()+t.slice(1)}
                      </button>
                    ))}
                  </div>
                  <button onClick={copy}
                    style={{display:'flex',alignItems:'center',gap:6,padding:'5px 10px',borderRadius:8,fontSize:11,fontFamily:'var(--mono)',border:'1px solid var(--dline)',background:'none',color:'var(--dmut)',cursor:'pointer'}}>
                    {copied
                      ? <><svg style={{width:12,height:12,fill:'none',stroke:'var(--ok)',strokeWidth:2}} viewBox="0 0 24 24"><path d="M5 12l5 5L20 7"/></svg>Copied</>
                      : <><svg style={{width:12,height:12,fill:'none',stroke:'currentColor',strokeWidth:2}} viewBox="0 0 24 24"><rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/></svg>Copy</>
                    }
                  </button>
                </div>
                <pre style={{padding:18,fontFamily:'var(--mono)',fontSize:12.5,color:'var(--dtext)',overflowX:'auto',lineHeight:1.7,margin:0,background:'var(--dark)'}}>
                  <code>{SAMPLES[tab]}</code>
                </pre>
              </div>

              {/* Endpoints table */}
              <div className="ie-card" style={{overflow:'hidden'}}>
                <div style={{display:'flex',alignItems:'center',gap:8,borderBottom:'1px solid var(--line)',padding:'12px 18px'}}>
                  <svg style={{width:16,height:16,fill:'none',stroke:'var(--acc)',strokeWidth:1.8}} viewBox="0 0 24 24"><path d="M21 7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2zM3 7l9 6 9-6"/></svg>
                  <span style={{fontSize:14,fontWeight:600}}>Available Endpoints</span>
                  <span className="ie-tag dim" style={{marginLeft:'auto'}}>{ENDPOINTS.length} endpoints</span>
                </div>
                {ENDPOINTS.map((ep, i) => {
                  const mc = MC[ep.method] ?? {bg:'var(--panel)',color:'var(--mut)'};
                  return (
                    <div key={ep.path}
                      style={{display:'flex',alignItems:'center',gap:12,padding:'11px 18px',transition:'.12s',borderBottom:i<ENDPOINTS.length-1?'1px solid var(--line)':'none'}}
                      onMouseEnter={e=>{e.currentTarget.style.background='var(--panel)';}}
                      onMouseLeave={e=>{e.currentTarget.style.background='';}}>
                      <span style={{width:52,flexShrink:0,borderRadius:6,padding:'3px 0',textAlign:'center',fontFamily:'var(--mono)',fontSize:10,fontWeight:700,textTransform:'uppercase',background:mc.bg,color:mc.color}}>
                        {ep.method}
                      </span>
                      <code style={{fontFamily:'var(--mono)',fontSize:12.5,flexShrink:0}}>{ep.path}</code>
                      <span style={{marginLeft:'auto',fontSize:12,color:'var(--mut)',textAlign:'right'}} className="ep-desc">{ep.desc}</span>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* ── Usage ── */}
          {apiTab === 'usage' && (
            <motion.div initial={{opacity:0,y:6}} animate={{opacity:1,y:0}} className="ie-card" style={{padding:22}}>
              <h3 style={{fontSize:17,fontWeight:700,marginBottom:4}}>Usage</h3>
              <p style={{color:'var(--mut)',fontSize:13.5,marginBottom:18}}>Current billing period.</p>
              <div style={{display:'grid',gap:18}}>
                {USAGE.map(u => (
                  <div key={u.label} className={`ie-ubar${u.hot?' hot':''}`}>
                    <div style={{display:'flex',justifyContent:'space-between',fontFamily:'var(--mono)',fontSize:11,color:'var(--mut)',marginBottom:6}}>
                      <span>{u.label}</span><span>{u.val}</span>
                    </div>
                    <i><b style={{width:`${u.pct}%`}} /></i>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

        </div>
      </div>

      <style>{`
        @keyframes spin{to{transform:rotate(360deg)}}
        @media(max-width:700px){ .api-stats-row{grid-template-columns:repeat(2,1fr)!important} }
        @media(max-width:900px){ .api-duo{grid-template-columns:1fr!important} .api-sidenav{flex-direction:row!important;overflow-x:auto;position:static!important} }
        @media(min-width:640px){ .ep-desc{display:block!important} }
        .ep-desc{display:none}
      `}</style>
    </div>
  );
}
