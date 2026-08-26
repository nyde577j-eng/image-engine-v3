import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'wouter';

export default function NotFound() {
  return (
    <div
      className="w-full h-screen overflow-hidden flex justify-center items-center relative"
      style={{ background: '#0d0d0d' }}
    >
      {/* Canvas behind everything */}
      <CircleAnimation />
      {/* Stick figures above canvas but below text */}
      <CharactersAnimation />
      {/* Text always on top */}
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
      >
        {/* Text with dark backdrop so it's readable over white circles */}
        <div
          className="text-[35px] font-semibold m-[1%] px-4 py-1 rounded"
          style={{
            color: '#f4f2ea',
            textShadow: '0 2px 12px #0d0d0d, 0 0 24px #0d0d0d',
          }}
        >
          Page Not Found
        </div>
        <div
          className="text-[80px] font-bold m-[1%] leading-none"
          style={{
            color: '#f4f2ea',
            textShadow: '0 2px 24px #0d0d0d, 0 0 40px #0d0d0d',
          }}
        >
          404
        </div>
        <div
          className="text-[15px] w-1/2 min-w-[280px] text-center m-[1%] px-2"
          style={{
            color: '#c9c4ba',
            textShadow: '0 1px 8px #0d0d0d',
          }}
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

/* ── 2. Characters Animation — inline SVGs (no external URLs) ────── */
// Stick figures as inline SVG strings to avoid CSP/CORS issues
const STICK_SVGS = [
  // stick0 — simple falling figure
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 200" fill="none" stroke="#f4f2ea" stroke-width="4" stroke-linecap="round">
    <circle cx="50" cy="20" r="14" fill="#f4f2ea"/>
    <line x1="50" y1="34" x2="50" y2="110"/>
    <line x1="50" y1="60" x2="20" y2="90"/>
    <line x1="50" y1="60" x2="80" y2="90"/>
    <line x1="50" y1="110" x2="25" y2="160"/>
    <line x1="50" y1="110" x2="75" y2="160"/>
  </svg>`,
  // stick1 — running figure
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 200" fill="none" stroke="#f4f2ea" stroke-width="4" stroke-linecap="round">
    <circle cx="50" cy="20" r="14" fill="#f4f2ea"/>
    <line x1="50" y1="34" x2="50" y2="110"/>
    <line x1="50" y1="55" x2="15" y2="75"/>
    <line x1="50" y1="55" x2="82" y2="65"/>
    <line x1="50" y1="110" x2="20" y2="165"/>
    <line x1="50" y1="110" x2="80" y2="150"/>
  </svg>`,
  // stick2 — arms up figure
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 200" fill="none" stroke="#f4f2ea" stroke-width="4" stroke-linecap="round">
    <circle cx="50" cy="20" r="14" fill="#f4f2ea"/>
    <line x1="50" y1="34" x2="50" y2="110"/>
    <line x1="50" y1="55" x2="10" y2="35"/>
    <line x1="50" y1="55" x2="90" y2="35"/>
    <line x1="50" y1="110" x2="30" y2="170"/>
    <line x1="50" y1="110" x2="70" y2="170"/>
  </svg>`,
  // stick3 — standing figure (bottom, no movement)
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 200" fill="none" stroke="#f4f2ea" stroke-width="4" stroke-linecap="round">
    <circle cx="50" cy="20" r="14" fill="#f4f2ea"/>
    <line x1="50" y1="34" x2="50" y2="110"/>
    <line x1="50" y1="60" x2="20" y2="80"/>
    <line x1="50" y1="60" x2="80" y2="80"/>
    <line x1="50" y1="110" x2="35" y2="170"/>
    <line x1="50" y1="110" x2="65" y2="170"/>
  </svg>`,
];

type StickFigure = {
  top?: string;
  bottom?: string;
  svgIndex: number;
  transform?: string;
  speedX: number;
  speedRotation?: number;
};

const STICK_FIGURES: StickFigure[] = [
  { top: '0%',   svgIndex: 0, transform: 'rotateZ(-90deg)', speedX: 1500 },
  { top: '10%',  svgIndex: 1, speedX: 3000, speedRotation: 2000 },
  { top: '20%',  svgIndex: 2, speedX: 5000, speedRotation: 1000 },
  { top: '25%',  svgIndex: 0, speedX: 2500, speedRotation: 1500 },
  { top: '35%',  svgIndex: 0, speedX: 2000, speedRotation: 300 },
  { bottom: '5%', svgIndex: 3, speedX: 0 },
];

function CharactersAnimation() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    container.innerHTML = '';

    STICK_FIGURES.forEach((figure, index) => {
      const wrapper = document.createElement('div');
      wrapper.style.position = 'absolute';
      wrapper.style.width = '80px';
      wrapper.style.height = '160px';
      if (figure.top)    wrapper.style.top    = figure.top;
      if (figure.bottom) wrapper.style.bottom = figure.bottom;
      if (figure.transform) wrapper.style.transform = figure.transform;
      wrapper.innerHTML = STICK_SVGS[figure.svgIndex];
      const svg = wrapper.querySelector('svg');
      if (svg) { svg.style.width = '100%'; svg.style.height = '100%'; }
      container.appendChild(wrapper);

      if (index === 5) return;

      wrapper.animate(
        [{ left: '110%' }, { left: '-15%' }],
        { duration: figure.speedX, easing: 'linear', fill: 'forwards' },
      );

      if (index === 0) return;

      if (figure.speedRotation) {
        wrapper.animate(
          [{ transform: 'rotate(0deg)' }, { transform: 'rotate(-360deg)' }],
          { duration: figure.speedRotation, iterations: Infinity, easing: 'linear' },
        );
      }
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
