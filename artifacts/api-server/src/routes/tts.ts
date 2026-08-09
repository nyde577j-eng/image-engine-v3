/**
 * tts.ts — Fish Audio Text-to-Speech Routes
 *
 * GET  /api/tts/keys          — جلب الـ keys المفعّلة (بدون قيم الـ keys)
 * POST /api/tts/generate      — توليد صوت من نص
 * POST /api/tts/clone         — استنساخ صوت من ملف صوتي (instant clone)
 * GET  /api/tts/voices        — جلب الأصوات المشهورة من Fish Audio Voice Library
 */

import { Router } from "express";

const router = Router();

const SUPABASE_URL = process.env["VITE_SUPABASE_URL"] ?? process.env["SUPABASE_URL"] ?? "";
const SUPABASE_KEY =
  process.env["VITE_SUPABASE_SERVICE_KEY"] ??
  process.env["SUPABASE_SERVICE_KEY"] ??
  process.env["VITE_SUPABASE_ANON_KEY"] ??
  process.env["SUPABASE_ANON_KEY"] ??
  "";

const FISH_API_BASE = "https://api.fish.audio";

/* ─── Helper: جيب أول API key فعّال من Supabase ─────────────────── */
async function getActiveKey(): Promise<string | null> {
  if (!SUPABASE_URL || !SUPABASE_KEY) return null;
  try {
    const r = await fetch(
      `${SUPABASE_URL}/rest/v1/tts_api_keys?enabled=eq.true&order=sort_order.asc&limit=1&select=id,key_value`,
      {
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );
    if (!r.ok) return null;
    const data = await r.json() as { id: string; key_value: string }[];
    const entry = data[0];
    if (!entry) return null;

    // حدّث last_used_at
    await fetch(`${SUPABASE_URL}/rest/v1/tts_api_keys?id=eq.${entry.id}`, {
      method: "PATCH",
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        "Content-Type": "application/json",
        Prefer: "return=minimal",
      },
      body: JSON.stringify({ last_used_at: new Date().toISOString() }),
    }).catch(() => {});

    return entry.key_value;
  } catch {
    return null;
  }
}

/* ═══════════════════════════════════════════════════════════════════
   GET /api/tts/keys
   جلب الـ keys مع الاسم فقط (بدون قيمة الـ key للأمان)
═══════════════════════════════════════════════════════════════════ */
router.get("/tts/keys", async (_req, res) => {
  if (!SUPABASE_URL || !SUPABASE_KEY) return res.json({ ok: true, keys: [] });
  try {
    const r = await fetch(
      `${SUPABASE_URL}/rest/v1/tts_api_keys?select=id,name,enabled,sort_order,created_at,last_used_at&order=sort_order.asc`,
      {
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
        },
      }
    );
    if (!r.ok) throw new Error(`Supabase error ${r.status}`);
    const keys = await r.json();
    return res.json({ ok: true, keys });
  } catch (err) {
    return res.status(500).json({ ok: false, error: String(err) });
  }
});

/* ═══════════════════════════════════════════════════════════════════
   POST /api/tts/generate
   توليد صوت من نص
   body: { text, reference_id?, format?, latency?, speed? }
═══════════════════════════════════════════════════════════════════ */
router.post("/tts/generate", async (req, res) => {
  const {
    text,
    reference_id,
    format = "mp3",
    latency = "balanced",
    speed = 1,
  } = req.body as {
    text?: string;
    reference_id?: string;
    format?: "mp3" | "wav" | "opus" | "pcm";
    latency?: "normal" | "balanced" | "low";
    speed?: number;
  };

  if (!text?.trim()) {
    return res.status(400).json({ ok: false, error: "text is required" });
  }

  const apiKey = await getActiveKey();
  if (!apiKey) {
    return res.status(503).json({
      ok: false,
      error: "لا يوجد Fish Audio API Key مفعّل — أضف key من لوحة الأدمن",
    });
  }

  try {
    const body: Record<string, unknown> = {
      text: text.trim(),
      format,
      latency,
      normalize: true,
      prosody: { speed, volume: 0 },
    };

    if (reference_id) body.reference_id = reference_id;

    const fishRes = await fetch(`${FISH_API_BASE}/v1/tts`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        model: "s2.1-pro-free",
      },
      body: JSON.stringify(body),
    });

    if (!fishRes.ok) {
      const errText = await fishRes.text().catch(() => `HTTP ${fishRes.status}`);
      return res.status(502).json({
        ok: false,
        error: `Fish Audio error ${fishRes.status}: ${errText.slice(0, 300)}`,
      });
    }

    const contentType =
      format === "mp3" ? "audio/mpeg"
      : format === "wav" ? "audio/wav"
      : format === "opus" ? "audio/ogg; codecs=opus"
      : "audio/pcm";

    res.setHeader("Content-Type", contentType);
    res.setHeader("Cache-Control", "no-store");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="tts-${Date.now()}.${format}"`
    );

    // Stream الصوت مباشرة
    const reader = fishRes.body?.getReader();
    if (!reader) return res.status(502).end();

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      if (!res.writable) break;
      res.write(value);
    }
    return res.end();
  } catch (err) {
    if (!res.headersSent) {
      return res.status(502).json({ ok: false, error: String(err) });
    }
    return res.end();
  }
});

/* ═══════════════════════════════════════════════════════════════════
   POST /api/tts/clone
   استنساخ صوت instant (بدون حفظ)
   body: { text, audio_base64, audio_mime, transcript? }
   يرجع: audio stream
═══════════════════════════════════════════════════════════════════ */
router.post("/tts/clone", async (req, res) => {
  const {
    text,
    audio_base64,
    audio_mime = "audio/wav",
    transcript = "",
    format = "mp3",
    speed = 1,
  } = req.body as {
    text?: string;
    audio_base64?: string;
    audio_mime?: string;
    transcript?: string;
    format?: "mp3" | "wav" | "opus";
    speed?: number;
  };

  if (!text?.trim()) return res.status(400).json({ ok: false, error: "text is required" });
  if (!audio_base64) return res.status(400).json({ ok: false, error: "audio_base64 is required" });

  const apiKey = await getActiveKey();
  if (!apiKey) {
    return res.status(503).json({
      ok: false,
      error: "لا يوجد Fish Audio API Key مفعّل",
    });
  }

  try {
    const body = {
      text: text.trim(),
      format,
      latency: "balanced",
      normalize: true,
      prosody: { speed, volume: 0 },
      references: [
        {
          audio: audio_base64,
          text: transcript,
        },
      ],
    };

    const fishRes = await fetch(`${FISH_API_BASE}/v1/tts`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        model: "s2.1-pro-free",
      },
      body: JSON.stringify(body),
    });

    if (!fishRes.ok) {
      const errText = await fishRes.text().catch(() => `HTTP ${fishRes.status}`);
      return res.status(502).json({
        ok: false,
        error: `Fish Audio clone error ${fishRes.status}: ${errText.slice(0, 300)}`,
      });
    }

    const contentType = format === "mp3" ? "audio/mpeg" : format === "wav" ? "audio/wav" : "audio/ogg; codecs=opus";
    res.setHeader("Content-Type", contentType);
    res.setHeader("Cache-Control", "no-store");
    res.setHeader("Content-Disposition", `attachment; filename="tts-clone-${Date.now()}.${format}"`);

    const reader = fishRes.body?.getReader();
    if (!reader) return res.status(502).end();
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      if (!res.writable) break;
      res.write(value);
    }
    return res.end();
  } catch (err) {
    if (!res.headersSent) {
      return res.status(502).json({ ok: false, error: String(err) });
    }
    return res.end();
  }
});

/* ═══════════════════════════════════════════════════════════════════
   GET /api/tts/voices
   جلب أصوات من Fish Audio Voice Library
   Query: page?, page_size?, title?, language?, sort_by?
═══════════════════════════════════════════════════════════════════ */
router.get("/tts/voices", async (req, res) => {
  const apiKey = await getActiveKey();
  if (!apiKey) {
    return res.json({ ok: true, voices: [], total: 0 });
  }

  const {
    page = "1",
    page_size = "20",
    title = "",
    language = "",
    sort_by = "task_count",
  } = req.query as Record<string, string>;

  try {
    const pageNum = Math.max(1, parseInt(page, 10));
    const pageSizeNum = Math.min(50, Math.max(1, parseInt(page_size, 10)));

    const params = new URLSearchParams({
      page_size: String(pageSizeNum),
      page_number: String(pageNum),
      sort_by,
      ...(title ? { title } : {}),
      ...(language ? { language } : {}),
    });

    const r = await fetch(`${FISH_API_BASE}/model?${params.toString()}`, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    });

    if (!r.ok) {
      const errText = await r.text().catch(() => `HTTP ${r.status}`);
      return res.status(502).json({ ok: false, error: errText });
    }

    const data = await r.json() as {
      total: number;
      items: {
        _id: string;
        title: string;
        description?: string;
        cover_image?: string;
        languages?: string[];
        task_count?: number;
        like_count?: number;
        samples?: { text: string; audio: string }[];
      }[];
      accessible_upper_bound?: number;
      window_limited?: boolean;
      has_more?: boolean;
    };

    // استخدم accessible_upper_bound لو موجود (Fish Audio بيحد الـ pagination)
    // وإلا استخدم total
    const effectiveTotal = data.accessible_upper_bound ?? data.total ?? 0;

    return res.json({
      ok: true,
      voices: data.items ?? [],
      total: effectiveTotal,
      has_more: data.has_more ?? false,
    });
  } catch (err) {
    return res.status(502).json({ ok: false, error: String(err) });
  }
});

/* ═══════════════════════════════════════════════════════════════════
   POST /api/tts/test-key
   اختبار صلاحية API Key
   body: { key_value }
═══════════════════════════════════════════════════════════════════ */
router.post("/tts/test-key", async (req, res) => {
  const { key_value } = req.body as { key_value?: string };
  if (!key_value?.trim()) {
    return res.status(400).json({ ok: false, error: "key_value is required" });
  }

  try {
    // نجرب نجيب صوت واحد من المكتبة للتحقق من صلاحية الـ key
    const r = await fetch(`${FISH_API_BASE}/model?page=1&page_size=1`, {
      headers: { Authorization: `Bearer ${key_value.trim()}` },
    });

    if (r.status === 401) {
      return res.json({ ok: false, error: "API Key غير صالح" });
    }
    if (!r.ok) {
      return res.json({ ok: false, error: `HTTP ${r.status}` });
    }

    return res.json({ ok: true, message: "API Key صالح وفعّال" });
  } catch (err) {
    return res.json({ ok: false, error: String(err) });
  }
});

export default router;
