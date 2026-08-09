/**
 * admin.ts — Admin Authentication Routes
 *
 * POST /api/admin/login  — تسجيل دخول الأدمن عبر Supabase + bcrypt
 *
 * الـ table المطلوبة في Supabase:
 *   admin_credentials (id uuid, username text unique, password_hash text, created_at timestamptz)
 *
 * لإنشاء أدمن جديد من Supabase SQL editor:
 *   INSERT INTO admin_credentials (username, password_hash)
 *   VALUES ('admin', crypt('YOUR_PASSWORD', gen_salt('bf')));
 */

import { Router } from "express";
import bcrypt from "bcryptjs";

const router = Router();

const SUPABASE_URL = process.env["VITE_SUPABASE_URL"] ?? process.env["SUPABASE_URL"] ?? "";
const SUPABASE_KEY =
  process.env["VITE_SUPABASE_SERVICE_KEY"] ??
  process.env["SUPABASE_SERVICE_KEY"] ??
  process.env["VITE_SUPABASE_ANON_KEY"] ??
  process.env["SUPABASE_ANON_KEY"] ??
  "";

/**
 * POST /api/admin/login
 * body: { username: string, password: string }
 */
router.post("/admin/login", async (req, res) => {
  const { username, password } = req.body as {
    username?: string;
    password?: string;
  };

  if (!username?.trim() || !password?.trim()) {
    return res.status(400).json({ ok: false, error: "Username and password are required." });
  }

  // لو Supabase مش configured — ارفض بدل ما تسمح بأي دخول
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    req.log.error("[admin/login] Supabase not configured — login blocked");
    return res.status(503).json({ ok: false, error: "Auth service not configured." });
  }

  try {
    // جيب الـ hash من Supabase
    const r = await fetch(
      `${SUPABASE_URL}/rest/v1/admin_credentials?username=eq.${encodeURIComponent(username.trim())}&select=username,password_hash&limit=1`,
      {
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!r.ok) {
      req.log.error({ status: r.status }, "[admin/login] Supabase error");
      return res.status(502).json({ ok: false, error: "Auth service error." });
    }

    const data = await r.json() as { username: string; password_hash: string }[];

    // نفس الرسالة سواء ما لقيناش user أو الـ password غلط (timing-safe)
    if (!data || data.length === 0) {
      // simulate bcrypt delay to prevent timing attacks
      await bcrypt.compare(password, "$2b$10$invalidhashfortimingprotection000000000000000000000000");
      return res.status(401).json({ ok: false, error: "Invalid username or password." });
    }

    const record = data[0];
    const valid = await bcrypt.compare(password, record.password_hash);

    if (!valid) {
      return res.status(401).json({ ok: false, error: "Invalid username or password." });
    }

    req.log.info({ username: record.username }, "[admin/login] successful login");
    return res.json({ ok: true, username: record.username });

  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    req.log.error({ err: msg }, "[admin/login] unexpected error");
    return res.status(500).json({ ok: false, error: "Internal error." });
  }
});

export default router;
