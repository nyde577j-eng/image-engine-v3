import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'wouter';

export default function NotFound() {
  return (
    <div
      className="w-full h-screen overflow-hidden flex justify-center items-center relative"
      style={{ background: '#0d0d0d' }}
    >
      <CircleAnimation />
      <CharactersAnimation />
      <MessageDisplay />
    </div>
  );
}

/* ── 1. Message Display ──────────────────────────────────────────── */
function MessageDisplay() {
  const [, navigate] = useLocation();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 1200);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div
      className="absolute inset-0 flex flex-col justify-center items-center"
      style={{ zIndex: 100 }}
    >
      <div
        className={`flex flex-col items-center transition-opacity duration-500 ${
          isVisible ? 'opacity-100' : 'opacity-0'
        }`}
        style={{
          background: 'rgba(13,13,13,0.72)',
          backdropFilter: 'blur(6px)',
          WebkitBackdropFilter: 'blur(6px)',
          borderRadius: '20px',
          padding: '40px 48px',
          border: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        <div
          className="text-[35px] font-semibold m-[1%] px-4 py-1 rounded"
          style={{ color: '#f4f2ea' }}
        >
          Page Not Found
        </div>
        <div
          className="text-[80px] font-bold m-[1%] leading-none"
          style={{ color: '#f4f2ea' }}
        >
          404
        </div>
        <div
          className="text-[15px] w-1/2 min-w-[280px] text-center m-[1%] px-2"
          style={{ color: '#c9c4ba' }}
        >
          The page you are looking for might have been removed, had its name
          changed, or is temporarily unavailable.
        </div>

        <div className="flex gap-6 mt-8">
          {/* Go Back */}
          <button
            onClick={() => window.history.back()}
            className="border-2 transition-all duration-300 ease-in-out px-6 py-2 text-base font-medium flex items-center gap-2 hover:scale-105"
            style={{
              color: '#f4f2ea',
              borderColor: '#f4f2ea',
              background: 'rgba(13,13,13,0.5)',
              backdropFilter: 'blur(4px)',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = '#f4f2ea';
              (e.currentTarget as HTMLButtonElement).style.color = '#0d0d0d';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = 'rgba(13,13,13,0.5)';
              (e.currentTarget as HTMLButtonElement).style.color = '#f4f2ea';
            }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20"
              viewBox="0 0 24 24" fill="none" stroke="currentColor"
              strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m12 19-7-7 7-7" /><path d="M19 12H5" />
            </svg>
            Go Back
          </button>

          {/* Go Home */}
          <button
            onClick={() => navigate('/')}
            className="transition-all duration-300 ease-in-out px-6 py-2 text-base font-medium flex items-center gap-2 hover:scale-105"
            style={{ background: '#f4f2ea', color: '#0d0d0d' }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.opacity = '0.85'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.opacity = '1'; }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20"
              viewBox="0 0 24 24" fill="none" stroke="currentColor"
              strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
            Go Home
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── 2. Floating Icons Animation ─────────────────────────────────── */
// Professional icons matching the AI/creative theme of the app
// Each floats across once from right to left — no infinite spinning
const ICON_SVGS = [
  // Sparkles / AI generation
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#f4f2ea" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
    <path d="M12 3l2 5 5 2-5 2-2 5-2-5-5-2 5-2z"/>
    <path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8z"/>
  </svg>`,
  // Image frame
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#f4f2ea" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2"/>
    <circle cx="9" cy="9" r="2"/>
    <path d="m21 15-5-5L5 21"/>
  </svg>`,
  // Wand / editor
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#f4f2ea" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
    <path d="M15 4l5 5L8 21l-5-1 1-5z"/>
    <path d="M13 6l3 3"/>
    <path d="M19 2l1 1-1 1-1-1z"/>
  </svg>`,
  // CPU / model
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#f4f2ea" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
    <rect x="7" y="7" width="10" height="10" rx="1"/>
    <path d="M12 2v3M12 19v3M2 12h3M19 12h3M7 2v3M17 2v3M7 19v3M17 19v3M2 7h3M2 17h3M19 7h3M19 17h3"/>
  </svg>`,
  // Chat bubble
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#f4f2ea" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
    <path d="M21 11.5a8.5 8.5 0 0 1-8.5 8.5c-1.5 0-3-.4-4.2-1.1L3 20l1.1-5.3A8.5 8.5 0 1 1 21 11.5z"/>
  </svg>`,
  // Film / video
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#f4f2ea" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
    <rect x="3" y="5" width="18" height="14" rx="2"/>
    <path d="M7 5v14M17 5v14M3 10h4M3 14h4M17 10h4M17 14h4"/>
  </svg>`,
];

type FloatingIcon = {
  top: string;
  svgIndex: number;
  speedX: number;
  size: number;
  opacity: number;
};

const FLOATING_ICONS: FloatingIcon[] = [
  { top: '8%',  svgIndex: 0, speedX: 6000,  size: 36, opacity: 0.25 },
  { top: '22%', svgIndex: 1, speedX: 9000,  size: 44, opacity: 0.20 },
  { top: '38%', svgIndex: 2, speedX: 7500,  size: 32, opacity: 0.22 },
  { top: '55%', svgIndex: 3, speedX: 10000, size: 40, opacity: 0.18 },
  { top: '70%', svgIndex: 4, speedX: 8000,  size: 36, opacity: 0.20 },
  { top: '82%', svgIndex: 5, speedX: 11000, size: 42, opacity: 0.16 },
];

function CharactersAnimation() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    container.innerHTML = '';

    FLOATING_ICONS.forEach((icon) => {
      const wrapper = document.createElement('div');
      wrapper.style.position = 'absolute';
      wrapper.style.width  = `${icon.size}px`;
      wrapper.style.height = `${icon.size}px`;
      wrapper.style.top    = icon.top;
      wrapper.style.opacity = String(icon.opacity);
      wrapper.innerHTML = ICON_SVGS[icon.svgIndex];
      const svg = wrapper.querySelector('svg');
      if (svg) { svg.style.width = '100%'; svg.style.height = '100%'; }
      container.appendChild(wrapper);

      // Slide once from right to left — no rotation, no infinite loop
      wrapper.animate(
        [{ left: '105%' }, { left: '-8%' }],
        { duration: icon.speedX, easing: 'linear', fill: 'forwards' },
      );
    });

    return () => { container.innerHTML = ''; };
  }, []);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 overflow-hidden"
      style={{ zIndex: 10 }}
    />
  );
}

/* ── 3. Circle Animation ─────────────────────────────────────────── */
interface Circulo { x: number; y: number; size: number; }

function CircleAnimation() {
  const canvasRef    = useRef<HTMLCanvasElement>(null);
  const requestIdRef = useRef<number>(0);
  const timerRef     = useRef(0);
  const circulosRef  = useRef<Circulo[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const initArr = () => {
      circulosRef.current = [];
      for (let i = 0; i < 300; i++) {
        const randomX = Math.floor(
          Math.random() * ((canvas.width * 3) - (canvas.width * 1.2) + 1),
        ) + canvas.width * 1.2;
        const randomY = Math.floor(
          Math.random() * (canvas.height * 1.2),
        ) + canvas.height * -0.1;
        circulosRef.current.push({ x: randomX, y: randomY, size: canvas.width / 1000 });
      }
    };

    const draw = () => {
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      timerRef.current++;
      ctx.setTransform(1, 0, 0, 1, 0, 0);

      const distanceX = canvas.width / 80;
      const growthRate = canvas.width / 1000;

      ctx.fillStyle = '#ffffff';
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      circulosRef.current.forEach((c) => {
        ctx.beginPath();
        if (timerRef.current < 65) {
          c.x    -= distanceX;
          c.size += growthRate;
        }
        if (timerRef.current > 65 && timerRef.current < 500) {
          c.x    -= distanceX * 0.02;
          c.size += growthRate * 0.2;
        }
        ctx.arc(c.x, c.y, c.size, 0, Math.PI * 2);
        ctx.fill();
      });

      if (timerRef.current > 500) {
        if (requestIdRef.current) cancelAnimationFrame(requestIdRef.current);
        return;
      }
      requestIdRef.current = requestAnimationFrame(draw);
    };

    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
    timerRef.current = 0;
    initArr();
    draw();

    const handleResize = () => {
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
      timerRef.current = 0;
      if (requestIdRef.current) cancelAnimationFrame(requestIdRef.current);
      const ctx = canvas.getContext('2d');
      if (ctx) ctx.reset?.();
      initArr();
      draw();
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      if (requestIdRef.current) cancelAnimationFrame(requestIdRef.current);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full"
      style={{ zIndex: 1 }}
    />
  );
}
