import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';
import { GeneratingOverlay } from '@/components/ui/generating-overlay';
import { PromptInput } from '@/components/ui/ai-chat-input';

/* ─── Types ──────────────────────────────────────────────────────── */
interface Attachment {
  id: string; name: string; mimeType: string; data: string; previewUrl?: string;
}
interface Message {
  id: string; role: 'user' | 'assistant'; content: string;
  timestamp: Date; attachments?: Attachment[];
  thinking?: string; // extracted reasoning/thinking block
}
interface ChatSession {
  id: string; title: string; created_at: string; updated_at: string;
}
interface Provider {
  id: string; name: string; model_name: string; is_default?: boolean;
}

/* ─── Extract thinking block from model reply ─────────────────────
   Handles patterns from Qwen, DeepSeek-R1, and similar thinking models:
   - <think>...</think> XML tags
   - "Here's a thinking process:\n..." followed by the real reply
   - "Thinking:\n..." block
   Returns { thinking, reply } — thinking may be empty string           */
function parseThinking(raw: string): { thinking: string; reply: string } {
  // Pattern 1: <think>...</think> tags (DeepSeek-R1, some Qwen variants)
  const xmlMatch = raw.match(/^<think>([\s\S]*?)<\/think>\s*([\s\S]*)$/i);
  if (xmlMatch) {
    return { thinking: xmlMatch[1].trim(), reply: xmlMatch[2].trim() };
  }

  // Pattern 2: "Here's a thinking process:\n..." or "Here is a thinking process:"
  const thinkingProcMatch = raw.match(
    /^(?:Here'?s? (?:a |my )?thinking process[:\s]*|Thinking process[:\s]*)([\s\S]+?)(?:\n\n(?=[A-Z\u0600-\u06FF])|---+\n)([\s\S]*)$/i
  );
  if (thinkingProcMatch) {
    return { thinking: thinkingProcMatch[1].trim(), reply: thinkingProcMatch[2].trim() };
  }

  // Pattern 3: numbered steps block ending with "---" separator
  const separatorMatch = raw.match(/^((?:\d+\.\s[\s\S]*?\n)+)\n?---+\n([\s\S]*)$/);
  if (separatorMatch && separatorMatch[1].length > 100) {
    return { thinking: separatorMatch[1].trim(), reply: separatorMatch[2].trim() };
  }

  return { thinking: '', reply: raw };
}

/* ─── Thinking block component ────────────────────────────────────── */
function ThinkingBlock({ thinking }: { thinking: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div style={{ marginBottom: 6 }}>
      {/* Toggle button */}
      <button
        onClick={() => setOpen(v => !v)}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          background: 'none', border: '1px solid var(--line2)',
          borderRadius: 10, padding: '5px 10px',
          fontFamily: 'var(--mono)', fontSize: 10.5,
          letterSpacing: '.08em', textTransform: 'uppercase',
          color: 'var(--mut)', cursor: 'pointer',
          transition: '.15s',
        }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--acc)'; e.currentTarget.style.color = 'var(--acc)'; }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--line2)'; e.currentTarget.style.color = 'var(--mut)'; }}
      >
        {/* Brain icon */}
        <svg style={{ width:13,height:13,fill:'none',stroke:'currentColor',strokeWidth:1.7,flexShrink:0 }} viewBox="0 0 24 24">
          <path d="M9 3a5 5 0 0 0-3.54 8.54A4 4 0 0 0 6 19h12a4 4 0 0 0 .54-7.96 5 5 0 0 0-9.08-7A4.99 4.99 0 0 0 9 3z"/>
        </svg>
        Thinking
        {/* Animated dots while "active", otherwise arrow */}
        <motion.span
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          style={{ display: 'flex' }}
        >
          <svg style={{ width:11,height:11,fill:'none',stroke:'currentColor',strokeWidth:2 }} viewBox="0 0 24 24">
            <path d="M6 9l6 6 6-6"/>
          </svg>
        </motion.span>
      </button>

      {/* Collapsible content */}
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 260, damping: 28 }}
            style={{ overflow: 'hidden' }}
          >
            <div style={{
              marginTop: 8,
              padding: '12px 14px',
              borderRadius: 12,
              border: '1px dashed var(--line2)',
              background: 'var(--panel)',
              fontFamily: 'var(--mono)',
              fontSize: 11.5,
              lineHeight: 1.7,
              color: 'var(--mut)',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              maxHeight: 320,
              overflowY: 'auto',
              scrollbarWidth: 'thin',
            }}>
              {thinking}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─── Unique browser key for privacy ─────────────────────────────── */
function getUserKey(): string {
  let k = window.localStorage.getItem('ie_user_key');
  if (!k) {
    k = `u_${Math.random().toString(36).slice(2, 11)}_${Date.now().toString(36)}`;
    window.localStorage.setItem('ie_user_key', k);
  }
  return k;
}

/* ─── Simple markdown renderer ───────────────────────────────────── */
function renderMd(text: string): React.ReactNode {
  return text.split('\n').map((line, i, arr) => {
    const bold = line.replace(/\*\*(.+?)\*\*/g, (_, m) => `<b>${m}</b>`);
    const code = bold.replace(/`(.+?)`/g, (_, m) => `<code style="background:rgba(0,0,0,.12);border-radius:4px;padding:1px 5px;font-family:var(--mono);font-size:12px">${m}</code>`);
    return (
      <span key={i}>
        <span dangerouslySetInnerHTML={{ __html: code }} />
        {i < arr.length - 1 && <br />}
      </span>
    );
  });
}

/* ─── Typing animation ───────────────────────────────────────────── */
function TypingMsg({ content }: { content: string }) {
  const [shown, setShown] = useState('');
  const [done, setDone] = useState(false);
  useEffect(() => {
    setShown(''); setDone(false);
    let i = 0;
    const iv = setInterval(() => {
      i += 5; setShown(content.slice(0, i));
      if (i >= content.length) { setShown(content); setDone(true); clearInterval(iv); }
    }, 10);
    return () => clearInterval(iv);
  }, [content]);
  return (
    <span style={{ fontSize:14.5, lineHeight:1.6, wordBreak:'break-word' }}>
      {renderMd(shown)}
      {!done && <span style={{ display:'inline-block', width:2, height:14, background:'var(--acc)', borderRadius:1, marginLeft:2, animation:'blink 1s step-end infinite', verticalAlign:'middle' }} />}
    </span>
  );
}

/* ─── Message bubble ─────────────────────────────────────────────── */
function Bubble({ msg, isLatest }: { msg: Message; isLatest: boolean }) {
  const isUser = msg.role === 'user';
  const [copied, setCopied] = useState(false);

  const copy = () => {
    navigator.clipboard?.writeText(msg.content);
    setCopied(true); setTimeout(() => setCopied(false), 1500);
  };

  return (
    <motion.div initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} transition={{ duration:.18 }}
      style={{
        maxWidth: isUser ? '78%' : '92%',
        width: isUser ? undefined : '100%',
        display:'flex', flexDirection:'column', gap:6,
        alignSelf: isUser ? 'flex-end' : 'flex-start',
        alignItems: isUser ? 'flex-end' : 'flex-start',
      }}>
      <span style={{ fontFamily:'var(--mono)', fontSize:10, letterSpacing:'.12em', textTransform:'uppercase', color:'var(--mut)' }}>
        {isUser ? 'YOU' : 'ENGINE'}
      </span>

      {/* Image attachments */}
      {msg.attachments?.filter(a => a.previewUrl).map(a => (
        <img key={a.id} src={a.previewUrl} alt={a.name}
          style={{ maxWidth:240, maxHeight:200, borderRadius:12, border:'1px solid var(--line)', objectFit:'cover' }} />
      ))}

      {/* Thinking block — only for AI messages that have thinking content */}
      {!isUser && msg.thinking && <ThinkingBlock thinking={msg.thinking} />}

      <div style={{
        padding:'13px 16px', borderRadius:16, fontSize:14.5, lineHeight:1.6,
        background: isUser ? 'var(--ink)' : 'transparent',
        color: isUser ? 'var(--bg)' : 'var(--ink)',
        border: isUser ? 'none' : '1px solid var(--line)',
        borderTopRightRadius: isUser ? 4 : 16,
        borderTopLeftRadius: isUser ? 16 : 4,
        wordBreak: 'break-word',
        display: 'inline-block',
        maxWidth: '100%',
      }}>
        {isLatest && !isUser
          ? <TypingMsg content={msg.content} />
          : <span style={{ fontSize:14.5, lineHeight:1.6 }}>{renderMd(msg.content)}</span>
        }
      </div>

      {/* Copy button */}
      <button onClick={copy}
        style={{ background:'none', border:0, cursor:'pointer', color:'var(--mut)', fontSize:11, fontFamily:'var(--mono)', display:'flex', alignItems:'center', gap:4, opacity:.7 }}>
        {copied
          ? <><svg style={{ width:12,height:12,fill:'none',stroke:'var(--ok)',strokeWidth:2 }} viewBox="0 0 24 24"><path d="M5 12l5 5L20 7"/></svg>Copied</>
          : <><svg style={{ width:12,height:12,fill:'none',stroke:'currentColor',strokeWidth:2 }} viewBox="0 0 24 24"><rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/></svg>Copy</>
        }
      </button>
    </motion.div>
  );
}

/* ─── Typing indicator ───────────────────────────────────────────── */
function TypingIndicator() {
  return (
    <div style={{ alignSelf:'flex-start', maxWidth:'78%' }}>
      <span style={{ fontFamily:'var(--mono)', fontSize:10, letterSpacing:'.12em', textTransform:'uppercase', color:'var(--mut)' }}>ENGINE</span>
      <div style={{ marginTop:6, padding:'16px', borderRadius:16, borderTopLeftRadius:4, background:'var(--card)', border:'1px solid var(--line)', display:'inline-flex', gap:5 }}>
        {[0,1,2].map(i => (
          <div key={i} style={{ width:7, height:7, borderRadius:'50%', background:'var(--mut)', animation:`tp 1s ${i*0.18}s infinite` }} />
        ))}
      </div>
    </div>
  );
}

/* ─── Sessions list ──────────────────────────────────────────────── */
function SessionsList({ sessions, onSelect, onNew, onDelete, loading }: {
  sessions: ChatSession[]; onSelect: (s: ChatSession) => void;
  onNew: () => void; onDelete: (id: string) => void; loading: boolean;
}) {
  function relTime(iso: string) {
    const d = new Date(iso); const now = new Date();
    const diff = Math.floor((now.getTime() - d.getTime()) / 86400000);
    if (diff === 0) return d.toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' });
    if (diff === 1) return 'Yesterday';
    if (diff < 7) return `${diff} days ago`;
    return d.toLocaleDateString(undefined, { month:'short', day:'numeric' });
  }

  return (
    <div style={{ padding:'clamp(16px,3vw,30px)', paddingBottom:80, maxWidth:860, margin:'0 auto' }}>
      <div className="vhead">
        <div><h2>Chat</h2><p>Your AI conversations</p></div>
        <button className="btn acc sm" onClick={onNew}>
          <svg style={{ width:15,height:15,fill:'none',stroke:'currentColor',strokeWidth:1.8 }} viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>
          New chat
        </button>
      </div>

      {loading ? (
        <div style={{ padding: '40px 0' }}>
          <GeneratingOverlay
            stage="LOADING SESSIONS"
            variant="inline"
            showGrid={false}
          />
        </div>
      ) : sessions.length === 0 ? (
        <div style={{ textAlign:'center', padding:'60px 20px', color:'var(--mut)' }}>
          <svg style={{ width:48,height:48,fill:'none',stroke:'currentColor',strokeWidth:1.8,margin:'0 auto 16px',display:'block',opacity:.25 }} viewBox="0 0 24 24">
            <path d="M21 11.5a8.5 8.5 0 0 1-8.5 8.5c-1.5 0-3-.4-4.2-1.1L3 20l1.1-5.3A8.5 8.5 0 1 1 21 11.5z"/>
          </svg>
          <p style={{ fontSize:15, marginBottom:8 }}>No conversations yet</p>
          <button className="btn acc sm" onClick={onNew}>Start a new chat</button>
        </div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          {sessions.map((s, i) => (
            <motion.div key={s.id} initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} transition={{ delay:i*0.04 }}
              style={{ display:'flex', alignItems:'center', gap:14, padding:'14px 16px', border:'1px solid var(--line)', borderRadius:14, background:'var(--card)', transition:'.15s', cursor:'pointer' }}
              onClick={() => onSelect(s)}
              onMouseEnter={e => { e.currentTarget.style.borderColor='var(--line2)'; e.currentTarget.style.boxShadow='var(--sh)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor='var(--line)'; e.currentTarget.style.boxShadow=''; }}
              className="hrow">
              {/* Icon */}
              <div style={{ width:38, height:38, borderRadius:10, background:'var(--accsoft)', display:'grid', placeItems:'center', flexShrink:0 }}>
                <svg style={{ width:18,height:18,fill:'none',stroke:'var(--acc)',strokeWidth:1.8 }} viewBox="0 0 24 24">
                  <path d="M21 11.5a8.5 8.5 0 0 1-8.5 8.5c-1.5 0-3-.4-4.2-1.1L3 20l1.1-5.3A8.5 8.5 0 1 1 21 11.5z"/>
                </svg>
              </div>
              {/* Title */}
              <div style={{ flex:1, minWidth:0 }}>
                <b style={{ display:'block', fontSize:14, fontWeight:500, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{s.title}</b>
                <span style={{ fontFamily:'var(--mono)', fontSize:10.5, color:'var(--mut)' }}>{relTime(s.updated_at)}</span>
              </div>
              {/* Delete */}
              <button onClick={e => { e.stopPropagation(); onDelete(s.id); }}
                style={{ background:'none', border:0, cursor:'pointer', color:'var(--mut)', padding:6, borderRadius:8, transition:'.15s', flexShrink:0 }}
                onMouseEnter={e => { e.currentTarget.style.color='var(--err)'; e.currentTarget.style.background='#fde8e5'; }}
                onMouseLeave={e => { e.currentTarget.style.color='var(--mut)'; e.currentTarget.style.background='none'; }}
                aria-label="Delete">
                <svg style={{ width:15,height:15,fill:'none',stroke:'currentColor',strokeWidth:1.8 }} viewBox="0 0 24 24">
                  <path d="M4 7h16M9 7V4h6v3M6 7l1 14h10l1-14M10 11v6M14 11v6"/>
                </svg>
              </button>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Main Chat View ─────────────────────────────────────────────── */
const SUGGESTED = [
  { icon: '✨', text: 'Help me write a prompt for a cinematic image' },
  { icon: '</>', text: 'Write Python code to resize images' },
  { icon: '🌐', text: 'What are the best UI design practices?' },
  { icon: '⚡', text: 'Describe this image in detail' },
];

export function ChatView() {
  const { toast } = useToast();

  /* View: list or chat */
  const [view, setView] = useState<'list' | 'chat'>('list');
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const [activeSession, setActiveSession] = useState<ChatSession | null>(null);

  /* Chat state */
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [latestId, setLatestId] = useState<string | null>(null);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [selectedProvider, setSelectedProvider] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const imageInputRef  = useRef<HTMLInputElement>(null);
  const fileInputRef   = useRef<HTMLInputElement>(null);

  /* Fetch sessions */
  const fetchSessions = useCallback(async () => {
    setSessionsLoading(true);
    try {
      const userKey = getUserKey();
      const r = await fetch(`/api/chat/sessions?user_key=${encodeURIComponent(userKey)}`);
      const d = await r.json() as { ok: boolean; sessions?: ChatSession[] };

      if (d.ok && d.sessions && d.sessions.length > 0) {
        // Backend returned sessions filtered by user_key — use them
        // Also sync to localStorage cache
        localStorage.setItem('ie_chat_sessions', JSON.stringify(d.sessions.slice(0, 50)));
        setSessions(d.sessions);
      } else {
        // Backend returned empty (column may not exist yet) — use localStorage cache
        const cached = JSON.parse(localStorage.getItem('ie_chat_sessions') ?? '[]') as ChatSession[];
        setSessions(cached);
      }
    } catch {
      // Network error — use localStorage cache
      const cached = JSON.parse(localStorage.getItem('ie_chat_sessions') ?? '[]') as ChatSession[];
      setSessions(cached);
    } finally { setSessionsLoading(false); }
  }, []);

  useEffect(() => { fetchSessions(); }, [fetchSessions]);

  /* Fetch providers */
  useEffect(() => {
    fetch('/api/chat/providers')
      .then(r => r.json())
      .then((d: { ok: boolean; providers?: Provider[] }) => {
        if (d.ok && d.providers?.length) {
          setProviders(d.providers);
          setSelectedProvider((d.providers.find(p => p.is_default) ?? d.providers[0]).id);
        }
      }).catch(() => {});
  }, []);

  /* Auto scroll */
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior:'smooth' }); }, [messages, isLoading]);

  const startNew = () => { setActiveSession(null); setMessages([]); setInput(''); setAttachments([]); setLatestId(null); setView('chat'); };
  const goBack   = () => { setView('list'); setActiveSession(null); setMessages([]); fetchSessions(); };

  const openSession = async (s: ChatSession) => {
    setActiveSession(s); setMessages([]); setView('chat');
    try {
      const r = await fetch(`/api/chat/sessions/${s.id}/messages`);
      const d = await r.json() as { ok: boolean; messages?: { id: string; role: string; content: string; created_at: string }[] };
      if (d.ok && d.messages) {
        setMessages(d.messages.map(m => ({ id: m.id, role: m.role as 'user'|'assistant', content: m.content, timestamp: new Date(m.created_at) })));
      }
    } catch { /* silent */ }
  };

  const deleteSession = async (id: string) => {
    try {
      await fetch(`/api/chat/sessions/${id}`, { method:'DELETE' });
    } catch { /* silent */ }
    // Always remove from localStorage cache
    const cached = JSON.parse(localStorage.getItem('ie_chat_sessions') ?? '[]') as ChatSession[];
    localStorage.setItem('ie_chat_sessions', JSON.stringify(cached.filter(s => s.id !== id)));
    setSessions(p => p.filter(s => s.id !== id));
  };

  /* Handle file attachments */
  const handleFiles = useCallback((files: FileList | null) => {
    if (!files) return;
    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = e => {
        const result = e.target?.result as string;
        setAttachments(p => [...p, {
          id: `${Date.now()}-${Math.random()}`, name: file.name,
          mimeType: file.type || 'application/octet-stream',
          data: result.split(',')[1] ?? '',
          previewUrl: file.type.startsWith('image/') ? result : undefined,
        }]);
      };
      reader.readAsDataURL(file);
    });
  }, []);

  /* Send message */
  const send = useCallback(async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed && attachments.length === 0) return;
    if (isLoading) return;

    const curAtts = [...attachments];
    const userMsg: Message = { id: `u-${Date.now()}`, role:'user', content: trimmed, timestamp: new Date(), attachments: curAtts.length ? curAtts : undefined };
    setMessages(p => [...p, userMsg]);
    setInput(''); setAttachments([]); setIsLoading(true);

    /* Create session if needed */
    let sessionId = activeSession?.id;
    if (!sessionId) {
      try {
        const r = await fetch('/api/chat/sessions', {
          method:'POST', headers:{'Content-Type':'application/json'},
          body: JSON.stringify({ title: trimmed.slice(0,80), user_key: getUserKey() }),
        });
        const d = await r.json() as { ok: boolean; session?: ChatSession };
        if (d.ok && d.session) {
          setActiveSession(d.session);
          sessionId = d.session.id;
          // Cache session locally so user can find it on return
          const cached = JSON.parse(localStorage.getItem('ie_chat_sessions') ?? '[]') as ChatSession[];
          cached.unshift(d.session);
          localStorage.setItem('ie_chat_sessions', JSON.stringify(cached.slice(0, 50)));
        }
      } catch { /* silent */ }
    }

    /* Save user message */
    if (sessionId) fetch(`/api/chat/sessions/${sessionId}/messages`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ role:'user', content: trimmed }) }).catch(() => {});

    try {
      const res = await fetch('/api/chat', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({
          message: trimmed,
          providerId: selectedProvider,
          attachments: curAtts.length ? curAtts.map(a => ({ data:a.data, mimeType:a.mimeType, name:a.name })) : undefined,
          history: messages.map(m => ({ role:m.role, content:m.content })),
        }),
      });
      const d = await res.json() as { ok:boolean; reply?:string; error?:string };
      if (!d.ok) { toast({ title:'Error', description: d.error, variant:'destructive' }); setMessages(p => p.filter(m => m.id !== userMsg.id)); return; }
      const rawReply = d.reply ?? '';
      const { thinking, reply } = parseThinking(rawReply);
      const aiMsg: Message = { id:`a-${Date.now()}`, role:'assistant', content: reply, thinking: thinking || undefined, timestamp: new Date() };
      setMessages(p => [...p, aiMsg]); setLatestId(aiMsg.id);
      if (sessionId) fetch(`/api/chat/sessions/${sessionId}/messages`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ role:'assistant', content: reply }) }).catch(() => {});
    } catch (err) {
      toast({ title:'Error', description: String(err), variant:'destructive' });
      setMessages(p => p.filter(m => m.id !== userMsg.id));
    } finally { setIsLoading(false); }
  }, [isLoading, attachments, messages, selectedProvider, activeSession, toast]);

  /* ─── Sessions list view ─────────────────────── */
  if (view === 'list') {
    return <SessionsList sessions={sessions} onSelect={openSession} onNew={startNew} onDelete={deleteSession} loading={sessionsLoading} />;
  }

  /* ─── Chat view ──────────────────────────────── */
  return (
    <div style={{ display:'flex', flexDirection:'column', height:'calc(100vh - 64px)', maxWidth:840, margin:'0 auto', padding:'0 clamp(10px,2vw,20px)', width:'100%', boxSizing:'border-box' }}>

      {/* ── Chat header ── */}
      <div style={{ display:'flex', alignItems:'center', gap:10, padding:'12px 0', borderBottom:'1px solid var(--line)', flexShrink:0 }}>
        <button className="ibtn" onClick={goBack} aria-label="Back">
          <svg style={{ width:16,height:16,fill:'none',stroke:'currentColor',strokeWidth:1.8 }} viewBox="0 0 24 24"><path d="M15 18l-6-6 6-6"/></svg>
        </button>
        <div style={{ flex:1, minWidth:0 }}>
          <b style={{ fontSize:15, fontWeight:600, display:'block', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
            {activeSession?.title ?? 'New Chat'}
          </b>
        </div>
        <button className="btn ghost sm" onClick={startNew}>
          <svg style={{ width:14,height:14,fill:'none',stroke:'currentColor',strokeWidth:1.8 }} viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>
          New chat
        </button>
        <button className="btn ghost sm" onClick={goBack}>
          <svg style={{ width:14,height:14,fill:'none',stroke:'currentColor',strokeWidth:1.8 }} viewBox="0 0 24 24"><path d="M21 11.5a8.5 8.5 0 0 1-8.5 8.5c-1.5 0-3-.4-4.2-1.1L3 20l1.1-5.3A8.5 8.5 0 1 1 21 11.5z"/></svg>
          Chats
        </button>
      </div>

      {/* ── Messages ── */}
      <div style={{ flex:1, overflowY:'auto', scrollbarWidth:'thin', display:'flex', flexDirection:'column', gap:16, padding:'20px 4px' }}>

        {/* Empty state */}
        {messages.length === 0 && (
          <motion.div initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }}
            style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:24, paddingTop:40 }}>
            <div style={{ width:64, height:64, borderRadius:20, background:'var(--accsoft)', display:'grid', placeItems:'center' }}>
              <svg style={{ width:32,height:32,fill:'none',stroke:'var(--acc)',strokeWidth:1.8 }} viewBox="0 0 24 24">
                <path d="M21 11.5a8.5 8.5 0 0 1-8.5 8.5c-1.5 0-3-.4-4.2-1.1L3 20l1.1-5.3A8.5 8.5 0 1 1 21 11.5z"/>
              </svg>
            </div>
            <div style={{ textAlign:'center' }}>
              <h2 style={{ fontSize:20, fontWeight:700, marginBottom:6 }}>Hey — how can I help?</h2>
              <p style={{ color:'var(--mut)', fontSize:14 }}>Ask anything — I can draft prompts, brainstorm ideas, or help with your images.</p>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, width:'100%', maxWidth:480 }}>
              {SUGGESTED.map(s => (
                <button key={s.text} onClick={() => send(s.text)}
                  style={{ display:'flex', alignItems:'flex-start', gap:10, border:'1px solid var(--line)', borderRadius:14, padding:'12px 14px', background:'var(--card)', cursor:'pointer', fontFamily:'var(--ui)', fontSize:13, textAlign:'left', transition:'.15s', color:'var(--mut)' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor='var(--acc)'; e.currentTarget.style.color='var(--ink)'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor='var(--line)'; e.currentTarget.style.color='var(--mut)'; }}>
                  <span style={{ fontSize:16, flexShrink:0 }}>{s.icon}</span>
                  <span style={{ lineHeight:1.4 }}>{s.text}</span>
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {/* Message list */}
        <AnimatePresence initial={false}>
          {messages.map(msg => (
            <Bubble key={msg.id} msg={msg} isLatest={msg.id === latestId && msg.role === 'assistant'} />
          ))}
        </AnimatePresence>

        {/* Typing indicator */}
        <AnimatePresence>
          {isLoading && (
            <motion.div initial={{ opacity:0, y:6 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }}>
              <TypingIndicator />
            </motion.div>
          )}
        </AnimatePresence>

        <div ref={messagesEndRef} />
      </div>

      {/* ── Composer ── */}
      <div style={{ flexShrink:0, paddingBottom:12, width:'100%', display:'flex', justifyContent:'center' }}>
        <PromptInput
          value={input}
          onChange={setInput}
          placeholder="Ask, brainstorm, or command the engine…"
          models={providers.length > 0 ? providers.map(p => p.name) : undefined}
          className="w-full"
          onSubmit={(text, meta) => {
            const matched = providers.find(p => p.name === meta.model);
            if (matched) setSelectedProvider(matched.id);
            if (meta.attachments.length > 0) {
              const dt = new DataTransfer();
              meta.attachments.forEach(f => dt.items.add(f));
              handleFiles(dt.files);
            }
            send(text);
          }}
        />
      </div>

      {/* Hidden file inputs */}
      <input ref={imageInputRef} type="file" accept="image/*" multiple style={{ display:'none' }} onChange={e => { handleFiles(e.target.files); e.target.value=''; }} />
      <input ref={fileInputRef} type="file" accept=".pdf,.txt,.md,.js,.ts,.tsx,.jsx,.py,.json,.csv" multiple style={{ display:'none' }} onChange={e => { handleFiles(e.target.files); e.target.value=''; }} />

      <style>{`
        @keyframes tp{0%,100%{opacity:.25;transform:translateY(0)}50%{opacity:1;transform:translateY(-4px)}}
        @keyframes blink{0%,100%{opacity:1}50%{opacity:0}}
        /* Mobile: collapse suggested grid to 1 col */
        @media(max-width:480px){
          .chat-suggested-grid { grid-template-columns:1fr!important; }
        }
        /* Mobile: AI bubble fills available width */
        @media(max-width:640px){
          .chat-ai-bubble { max-width:96%!important; }
          .chat-user-bubble { max-width:86%!important; }
        }
      `}</style>
    </div>
  );
}
