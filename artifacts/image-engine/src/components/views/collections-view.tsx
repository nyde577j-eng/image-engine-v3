import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Loader2, Check, X, Images, Trash2 } from 'lucide-react';
import { PageContainer, PageHeader } from './shared';
import { supabase } from '@/lib/supabase';
import type { StoredImage } from '@/lib/admin-types';

interface Collection {
  id: string; name: string; description: string;
  created_at: string; cover_url?: string; image_count?: number;
}

export function CollectionsView() {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [saving, setSaving] = useState(false);
  const [selected, setSelected] = useState<Collection | null>(null);
  const [colImages, setColImages] = useState<StoredImage[]>([]);
  const [allImages, setAllImages] = useState<StoredImage[]>([]);

  const fetchCollections = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from('collections').select('*').order('created_at', { ascending: false });
    if (data) {
      const enriched = await Promise.all((data as Collection[]).map(async col => {
        const { data: imgs } = await supabase.from('collection_images').select('stored_images(url)').eq('collection_id', col.id).limit(1);
        const { count } = await supabase.from('collection_images').select('*', { count: 'exact', head: true }).eq('collection_id', col.id);
        const cover = imgs?.[0] ? (imgs[0] as any).stored_images?.url : undefined;
        return { ...col, cover_url: cover, image_count: count ?? 0 };
      }));
      setCollections(enriched);
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchCollections(); }, [fetchCollections]);

  const openCollection = async (col: Collection) => {
    setSelected(col);
    const { data } = await supabase.from('collection_images').select('stored_images(*)').eq('collection_id', col.id).order('added_at', { ascending: false });
    if (data) setColImages(data.map((r: any) => r.stored_images as StoredImage));
    const { data: all } = await supabase.from('stored_images').select('*').order('created_at', { ascending: false });
    if (all) setAllImages(all as StoredImage[]);
  };

  const handleCreate = async () => {
    if (!newName.trim()) return;
    setSaving(true);
    await supabase.from('collections').insert({ name: newName.trim(), description: newDesc.trim() });
    setNewName(''); setNewDesc(''); setShowForm(false); setSaving(false);
    fetchCollections();
  };

  const handleDelete = async (id: string) => {
    await supabase.from('collections').delete().eq('id', id);
    setCollections(p => p.filter(c => c.id !== id));
  };

  return (
    <PageContainer>
      <PageHeader
        title="Collections"
        description="Group work by project, mood or client"
        icon={Images}
        actions={
          <button className="btn acc sm" onClick={() => setShowForm(true)}>
            <Plus className="h-4 w-4" /> New collection
          </button>
        }
      />

      {/* New collection form */}
      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            className="ie-card" style={{ overflow: 'hidden', padding: 20, marginBottom: 20, marginTop: 4 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 14 }}>New Collection</h3>
            <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Collection name…" className="ie-inp" style={{ marginBottom: 10 }} />
            <input value={newDesc} onChange={e => setNewDesc(e.target.value)} placeholder="Description (optional)…" className="ie-inp" style={{ marginBottom: 14 }} />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button className="btn ghost sm" onClick={() => setShowForm(false)}>Cancel</button>
              <button className="btn ink sm" onClick={handleCreate} disabled={!newName.trim() || saving}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} Create
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
          <Loader2 style={{ width: 32, height: 32, animation: 'spin 1s linear infinite', color: 'var(--acc)' }} />
        </div>
      ) : collections.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--mut)' }}>
          <Images style={{ width: 48, height: 48, opacity: .3, margin: '0 auto 12px' }} />
          <p>No collections yet — create your first one!</p>
        </div>
      ) : (
        <div className="cgrid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(240px,1fr))', gap: 16 }}>
          {collections.map((col, i) => (
            <motion.div key={col.id} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              onClick={() => openCollection(col)}
              style={{ borderRadius: 'var(--r2)', overflow: 'hidden', border: '1px solid var(--line)', background: 'var(--card)', cursor: 'pointer', transition: '.2s', position: 'relative' }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = 'var(--sh)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; }}
            >
              {/* Cover */}
              <div style={{ height: 150, background: 'var(--panel)', display: 'grid', placeItems: 'center', overflow: 'hidden' }}>
                {col.cover_url
                  ? <img src={col.cover_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : <Images style={{ width: 40, height: 40, opacity: .2 }} />
                }
              </div>
              <div style={{ padding: '12px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                <div>
                  <b style={{ fontSize: 14, fontWeight: 500 }}>{col.name}</b>
                  <div className="mic" style={{ marginTop: 2 }}>{col.image_count} assets</div>
                </div>
                <button onClick={e => { e.stopPropagation(); handleDelete(col.id); }}
                  style={{ border: 0, background: 'none', color: 'var(--err)', cursor: 'pointer', opacity: 0 }}
                  className="col-del" aria-label="Delete">
                  <Trash2 style={{ width: 15, height: 15 }} />
                </button>
              </div>
            </motion.div>
          ))}
          {/* New col button */}
          <button onClick={() => setShowForm(true)}
            style={{ border: '1.5px dashed var(--line2)', borderRadius: 'var(--r2)', minHeight: 200, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10, color: 'var(--mut)', background: 'none', cursor: 'pointer', transition: '.2s', width: '100%', fontFamily: 'var(--ui)' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--acc)'; e.currentTarget.style.color = 'var(--acc)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--line2)'; e.currentTarget.style.color = 'var(--mut)'; }}
          >
            <Plus style={{ width: 22, height: 22 }} />
            <span className="mic">New collection</span>
          </button>
        </div>
      )}

      {/* Collection detail modal */}
      <AnimatePresence>
        {selected && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setSelected(null)}
            style={{ position: 'fixed', inset: 0, zIndex: 300, background: 'rgba(20,19,16,.75)', backdropFilter: 'blur(4px)', display: 'grid', placeItems: 'center', padding: 18 }}
          >
            <motion.div initial={{ scale: .95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: .95, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              style={{ width: 'min(900px,100%)', maxHeight: '90vh', background: 'var(--card)', border: '1px solid var(--line)', borderRadius: 22, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 20px', borderBottom: '1px solid var(--line)' }}>
                <div>
                  <h2 style={{ fontSize: 18, fontWeight: 700 }}>{selected.name}</h2>
                  {selected.description && <p style={{ color: 'var(--mut)', fontSize: 13 }}>{selected.description}</p>}
                </div>
                <button className="ibtn" onClick={() => setSelected(null)}><X style={{ width: 16, height: 16 }} /></button>
              </div>
              <div style={{ flex: 1, overflowY: 'auto', padding: 20 }}>
                {colImages.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--mut)' }}>
                    <Images style={{ width: 40, height: 40, opacity: .25, margin: '0 auto 10px' }} />
                    <p style={{ fontSize: 13 }}>No images yet — add from gallery below</p>
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(120px,1fr))', gap: 10, marginBottom: 24 }}>
                    {colImages.map(img => (
                      <div key={img.id} style={{ position: 'relative', borderRadius: 10, overflow: 'hidden', aspectRatio: '1', border: '1px solid var(--line)' }}>
                        <img src={img.url} alt={img.prompt} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        <button onClick={() => {
                          supabase.from('collection_images').delete().eq('collection_id', selected.id).eq('image_id', img.id);
                          setColImages(p => p.filter(i => i.id !== img.id));
                        }} style={{ position: 'absolute', top: 4, right: 4, width: 22, height: 22, borderRadius: '50%', background: 'rgba(211,58,44,.85)', border: 0, color: '#fff', cursor: 'pointer', display: 'grid', placeItems: 'center', opacity: 0 }}
                          className="col-rm" aria-label="Remove">
                          <X style={{ width: 11, height: 11 }} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                {/* Add from gallery */}
                {allImages.filter(i => !colImages.find(ci => ci.id === i.id)).length > 0 && (
                  <div>
                    <div className="mic" style={{ marginBottom: 10 }}>Add from Gallery</div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(100px,1fr))', gap: 8 }}>
                      {allImages.filter(i => !colImages.find(ci => ci.id === i.id)).map(img => (
                        <button key={img.id} onClick={async () => {
                          await supabase.from('collection_images').upsert({ collection_id: selected.id, image_id: img.id });
                          openCollection(selected);
                        }} style={{ padding: 0, border: '1px solid var(--line)', borderRadius: 10, overflow: 'hidden', aspectRatio: '1', cursor: 'pointer', opacity: .65, transition: '.15s' }}
                          onMouseEnter={e => { e.currentTarget.style.opacity = '1'; }} onMouseLeave={e => { e.currentTarget.style.opacity = '.65'; }}>
                          <img src={img.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .cgrid > div:hover .col-del { opacity: 1 !important; }
        .col-rm:hover { opacity: 1 !important; }
        div:hover > .col-rm { opacity: 1 !important; }
      `}</style>
    </PageContainer>
  );
}
