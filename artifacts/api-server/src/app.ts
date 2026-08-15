import express, { type Express, type Request, type Response, type NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";
import { rateLimit } from "express-rate-limit";
import pinoHttp from "pino-http";
import path from "path";
import { fileURLToPath } from "url";
import router from "./routes";
import { logger } from "./lib/logger";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app: Express = express();

/* ── Logging ──────────────────────────────────────────────────────── */
app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return { id: req.id, method: req.method, url: req.url?.split("?")[0] };
      },
      res(res) {
        return { statusCode: res.statusCode };
      },
    },
  }),
);

/* ── Security Headers (helmet) ────────────────────────────────────── */
// خدمات خارجية الموقع بيحتاجها للصور والـ AI
const ALLOWED_CONNECT = [
  "'self'",
  "https://*.supabase.co",
  "https://supabase.com",
  "wss://*.supabase.co",
  "https://api.openai.com",
  "https://generativelanguage.googleapis.com",
  "https://api.anthropic.com",
  "https://api.replicate.com",
  "https://fal.run",
  "https://*.fal.ai",
  "https://stability.ai",
  "https://api.stability.ai",
  "https://openrouter.ai",
  "https://api.groq.com",
  "https://api.deepseek.com",
  "https://fish.audio",
  "https://prexzyapis.com",
  "https://viscodev.x10.mx",
].join(" ");

const ALLOWED_IMG = [
  "'self'",
  "data:",
  "blob:",
  "https://*.supabase.co",
  "https://images.unsplash.com",
  "https://plus.unsplash.com",
  "https://*.pollinations.ai",
  "https://*.fal.ai",
  "https://replicate.delivery",
  "https://*.replicate.delivery",
  "https://oaidalleapiprodscus.blob.core.windows.net",
  "https://*.blob.core.windows.net",
].join(" ");

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],   // Vite بيحتاج inline scripts
        scriptSrcAttr: ["'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        connectSrc: [ALLOWED_CONNECT],
        imgSrc: [ALLOWED_IMG],
        mediaSrc: ["'self'", "blob:", "data:", "https://fish.audio"],
        fontSrc: ["'self'", "data:"],
        frameSrc: ["'none'"],
        objectSrc: ["'none'"],
        baseUri: ["'self'"],
        formAction: ["'self'"],
        upgradeInsecureRequests: [],
      },
    },
    hsts: {
      maxAge: 31536000,          // سنة
      includeSubDomains: true,
      preload: false,
    },
    referrerPolicy: { policy: "strict-origin-when-cross-origin" },
    xFrameOptions: { action: "sameorigin" },
    xContentTypeOptions: true,
    xDnsPrefetchControl: { allow: false },
    crossOriginEmbedderPolicy: false,   // بيكسر الـ images من domains خارجية
    crossOriginOpenerPolicy: { policy: "same-origin-allow-popups" },
    crossOriginResourcePolicy: { policy: "cross-origin" },
    permittedCrossDomainPolicies: { permittedPolicies: "none" },
  }),
);

// إزالة X-Powered-By
app.disable("x-powered-by");

/* ── Permissions Policy ───────────────────────────────────────────── */
app.use((_req: Request, res: Response, next: NextFunction) => {
  res.setHeader(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(), payment=(), usb=(), bluetooth=(), fullscreen=(self)",
  );
  next();
});

/* ── CORS ─────────────────────────────────────────────────────────── */
const ALLOWED_ORIGINS = [
  "https://remixofficial.online",
  "https://www.remixofficial.online",
];

// في Development نسمح بـ localhost
if (process.env["NODE_ENV"] !== "production") {
  ALLOWED_ORIGINS.push("http://localhost:5173", "http://localhost:3000");
}

app.use(
  cors({
    origin: (origin, callback) => {
      // السيرفر نفسه (SSR / same-origin) أو requests بدون origin (mobile apps, curl)
      if (!origin) return callback(null, true);
      if (ALLOWED_ORIGINS.includes(origin)) return callback(null, true);
      callback(new Error(`CORS: origin '${origin}' not allowed`));
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "x-admin-session"],
    credentials: false,
  }),
);

/* ── Rate Limiting ────────────────────────────────────────────────── */

// Login endpoint — حماية من brute force
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,   // 15 دقيقة
  max: 10,                      // 10 محاولات كل 15 دقيقة
  standardHeaders: true,
  legacyHeaders: false,
  message: { ok: false, error: "Too many login attempts. Try again in 15 minutes." },
  skipSuccessfulRequests: true,
});

// AI Generation — عشان محد يضغط على السيرفر
const generationLimiter = rateLimit({
  windowMs: 60 * 1000,          // دقيقة
  max: 15,                       // 15 طلب في الدقيقة
  standardHeaders: true,
  legacyHeaders: false,
  message: { ok: false, error: "Too many requests. Please slow down." },
});

// General API — حماية عامة
const generalLimiter = rateLimit({
  windowMs: 60 * 1000,           // دقيقة
  max: 120,                       // 120 طلب في الدقيقة
  standardHeaders: true,
  legacyHeaders: false,
  message: { ok: false, error: "Too many requests. Please slow down." },
});

app.use("/api/admin/login",       loginLimiter);
app.use("/api/generate",          generationLimiter);
app.use("/api/comfy",             generationLimiter);
app.use("/api/chat/completions",  generationLimiter);
app.use("/api/tts/generate",      generationLimiter);
app.use("/api",                   generalLimiter);

/* ── Body Parsing ─────────────────────────────────────────────────── */
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

/* ── API Routes ───────────────────────────────────────────────────── */
app.use("/api", router);

/* ── Frontend Static Files ────────────────────────────────────────── */
const frontendDist = path.resolve(__dirname, "../../image-engine/dist/public");
app.use(express.static(frontendDist, {
  setHeaders: (res, filePath) => {
    // Immutable cache للـ assets المهشّة
    if (filePath.includes("/assets/")) {
      res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
    }
  },
}));

// SPA fallback
app.get("/{*path}", (_req: Request, res: Response) => {
  res.sendFile(path.join(frontendDist, "index.html"));
});

/* ── Global Error Handler ─────────────────────────────────────────── */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  // لا نكشف تفاصيل الـ error في production
  const isDev = process.env["NODE_ENV"] !== "production";
  const message = isDev && err instanceof Error
    ? err.message
    : "Internal server error";
  const status =
    (err as { status?: number; statusCode?: number })?.status ??
    (err as { status?: number; statusCode?: number })?.statusCode ?? 500;

  // CORS error
  if (err instanceof Error && err.message.startsWith("CORS:")) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  res.status(status).json({ error: message });
});

export default app;
