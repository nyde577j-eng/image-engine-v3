/**
 * GeneratingOverlay — professional AI-generation loading screen.
 *
 * Features:
 *  • Pixel/grid wave that ripples outward from centre (pure CSS, no canvas)
 *  • Shimmer text on the stage label
 *  • Live elapsed-seconds timer
 *  • Determinate thin progress bar at the bottom (null = indeterminate shimmer)
 *  • Reduced-motion: all animations collapse to a simple fade pulse
 *  • Variants: "canvas" (full-height centred) | "inline" (compact, fits inside a panel)
 */

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';

/* ─── Types ─────────────────────────────────────────────────────── */
export type GeneratingOverlayProps = {
  /** null = indeterminate; 0–100 = determinate */
  progress?: number | null;
  /** Stage label shown with shimmer, e.g. "DIFFUSING LATENTS" */
  stage?: string;
  /** Sub-label shown below stage, e.g. model name */
  hint?: string;
  /** "canvas" fills its container; "inline" is compact (for panels/buttons) */
  variant?: 'canvas' | 'inline';
  /** Show the pixel grid wave — disable for very small inline use */
  showGrid?: boolean;
};

/* ─── Pixel grid wave ────────────────────────────────────────────── */
const COLS = 14;
const ROWS = 7;
const TOTAL = COLS * ROWS;

function PixelGrid({ reduced }: { reduced: boolean | null }) {
  const [frame, setFrame] = useState(0);
  const raf = useRef<number>(0);
  const t = useRef(0);

  useEffect(() => {
    if (reduced) return;
    const tick = () => {
      t.current += 0.04;
      setFrame(f => f + 1);
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [reduced]);

  return (
    <div
      aria-hidden
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${COLS}, 1fr)`,
        gap: 3,
        width: '100%',
        maxWidth: 280,
        margin: '0 auto',
        opacity: reduced ? 0.2 : 1,
        transition: 'opacity .4s',
      }}
    >
      {Array.from({ length: TOTAL }, (_, i) => {
        const col = i % COLS;
        const row = Math.floor(i / COLS);
        // Wave emanating from centre
        const cx = (COLS - 1) / 2;
        const cy = (ROWS - 1) / 2;
        const dist = Math.sqrt((col - cx) ** 2 + (row - cy) ** 2);
        const wave = reduced
          ? 0.12
          : Math.max(0, Math.sin(t.current * 2.2 - dist * 0.72) * 0.5 + 0.12);

        return (
          <div
            key={i}
            style={{
              width: '100%',
              aspectRatio: '1',
              borderRadius: 2,
              background: `rgba(69,104,255, ${wave})`,
              transition: reduced ? 'none' : 'background 80ms linear',
            }}
          />
        );
      })}
    </div>
  );
}

/* ─── Shimmer text ───────────────────────────────────────────────── */
function ShimmerText({
  text,
  reduced,
  size = 12,
}: {
  text: string;
  reduced: boolean | null;
  size?: number;
}) {
  return (
    <span
      style={{
        fontFamily: 'var(--mono)',
        fontSize: size,
        fontWeight: 600,
        letterSpacing: '.14em',
        textTransform: 'uppercase',
        display: 'inline-block',
        position: 'relative',
        color: 'var(--dmut, #888)',
        ...(reduced
          ? {}
          : {
              background:
                'linear-gradient(90deg, #555 30%, #93B0FF 50%, #555 70%)',
              backgroundSize: '200% 100%',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              animation: 'ie-shimmer 2.4s linear infinite',
            }),
      }}
    >
      {text}
    </span>
  );
}

/* ─── Thin progress bar at bottom ───────────────────────────────── */
function ThinBar({
  progress,
  reduced,
}: {
  progress: number | null | undefined;
  reduced: boolean | null;
}) {
  const indeterminate = progress === null || progress === undefined;

  return (
    <div
      style={{
        width: '100%',
        height: 2,
        borderRadius: 99,
        background: 'rgba(255,255,255,.07)',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      {/* Determinate fill */}
      {!indeterminate && (
        <motion.div
          style={{
            position: 'absolute',
            inset: 0,
            originX: 0,
            background: 'linear-gradient(90deg, #4568FF, #93B0FF)',
            borderRadius: 99,
          }}
          initial={false}
          animate={{ scaleX: Math.min(1, Math.max(0, (progress ?? 0) / 100)) }}
          transition={
            reduced
              ? { duration: 0 }
              : { type: 'spring', stiffness: 180, damping: 28, mass: 0.8 }
          }
        />
      )}

      {/* Indeterminate shimmer sweep */}
      {indeterminate && !reduced && (
        <motion.div
          style={{
            position: 'absolute',
            top: 0,
            bottom: 0,
            width: '40%',
            background: 'linear-gradient(90deg, transparent, #4568FF, #93B0FF, transparent)',
            borderRadius: 99,
          }}
          initial={{ x: '-100%' }}
          animate={{ x: '350%' }}
          transition={{
            duration: 1.6,
            ease: 'easeInOut',
            repeat: Infinity,
            repeatDelay: 0.1,
          }}
        />
      )}
    </div>
  );
}

/* ─── Elapsed timer hook ─────────────────────────────────────────── */
function useElapsed(active: boolean) {
  const [elapsed, setElapsed] = useState(0);
  const start = useRef(Date.now());

  useEffect(() => {
    if (!active) { setElapsed(0); start.current = Date.now(); return; }
    start.current = Date.now();
    const id = setInterval(() => {
      setElapsed(Math.floor((Date.now() - start.current) / 1000));
    }, 1000);
    return () => clearInterval(id);
  }, [active]);

  return elapsed;
}

/* ─── Main component ─────────────────────────────────────────────── */
export function GeneratingOverlay({
  progress,
  stage = 'GENERATING',
  hint,
  variant = 'canvas',
  showGrid = true,
}: GeneratingOverlayProps) {
  const reduced = useReducedMotion();
  const elapsed = useElapsed(true);
  const isCanvas = variant === 'canvas';

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: isCanvas ? 20 : 12,
        padding: isCanvas ? '40px 24px' : '16px 20px',
        width: '100%',
        ...(isCanvas ? { minHeight: '60%' } : {}),
      }}
    >
      {/* Pixel grid */}
      {showGrid && isCanvas && <PixelGrid reduced={reduced} />}

      {/* Stage + timer row */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          width: '100%',
          maxWidth: 320,
          justifyContent: 'center',
        }}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={stage}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.18 }}
          >
            <ShimmerText
              text={stage}
              reduced={reduced}
              size={isCanvas ? 11 : 10}
            />
          </motion.div>
        </AnimatePresence>

        {/* Elapsed timer */}
        <span
          style={{
            fontFamily: 'var(--mono)',
            fontSize: 10,
            color: 'rgba(255,255,255,.28)',
            letterSpacing: '.06em',
            minWidth: 28,
            textAlign: 'right',
            flexShrink: 0,
          }}
        >
          {elapsed}s
        </span>
      </div>

      {/* Hint / model name */}
      {hint && (
        <span
          style={{
            fontFamily: 'var(--mono)',
            fontSize: 9.5,
            color: 'rgba(255,255,255,.18)',
            letterSpacing: '.1em',
            textTransform: 'uppercase',
            marginTop: -8,
          }}
        >
          {hint}
        </span>
      )}

      {/* Progress bar */}
      <div style={{ width: '100%', maxWidth: 320 }}>
        <ThinBar progress={progress} reduced={reduced} />
      </div>

      {/* Global keyframes — injected once */}
      <style>{`
        @keyframes ie-shimmer {
          0%   { background-position: 200% center; }
          100% { background-position: -200% center; }
        }
      `}</style>
    </motion.div>
  );
}
