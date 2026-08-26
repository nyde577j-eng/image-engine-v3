import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'wouter';

export default function NotFound() {
  return (
    <div
      className="w-full h-screen overflow-x-hidden flex justify-center items-center relative"
      style={{ background: '#0d0d0d' }}
    >
      <MessageDisplay />
      <CharactersAnimation />
      <CircleAnimation />
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
    <div className="absolute flex flex-col justify-center items-center w-[90%] h-[90%] z-[100]">
      <div
        className={`flex flex-col items-center transition-opacity duration-500 ${
          isVisible ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <div
          className="text-[35px] font-semibold m-[1%]"
          style={{ color: '#f4f2ea' }}
        >
          Page Not Found
        </div>
        <div
          className="text-[80px] font-bold m-[1%]"
          style={{ color: '#f4f2ea' }}
        >
          404
        </div>
        <div
          className="text-[15px] w-1/2 min-w-[40%] text-center m-[1%]"
          style={{ color: '#938f83' }}
        >
          The page you are looking for might have been removed, had its name
          changed, or is temporarily unavailable.
        </div>

        <div className="flex gap-6 mt-8">
          {/* Go Back */}
          <button
            onClick={() => window.history.back()}
            className="border-2 transition-all duration-300 ease-in-out px-6 py-2 h-auto text-base font-medium flex items-center gap-2 hover:scale-105"
            style={{
              color: '#f4f2ea',
              borderColor: '#f4f2ea',
              background: 'transparent',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = '#f4f2ea';
              (e.currentTarget as HTMLButtonElement).style.color = '#0d0d0d';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
              (e.currentTarget as HTMLButtonElement).style.color = '#f4f2ea';
            }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20" height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m12 19-7-7 7-7" />
              <path d="M19 12H5" />
            </svg>
            Go Back
          </button>

          {/* Go Home */}
          <button
            onClick={() => navigate('/')}
            className="transition-all duration-300 ease-in-out px-6 py-2 h-auto text-base font-medium flex items-center gap-2 hover:scale-105"
            style={{
              background: '#f4f2ea',
              color: '#0d0d0d',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.opacity = '0.85';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.opacity = '1';
            }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20" height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
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

/* ── 2. Characters Animation ─────────────────────────────────────── */
type StickFigure = {
  top?: string;
  bottom?: string;
  src: string;
  transform?: string;
  speedX: number;
  speedRotation?: number;
};

const STICK_FIGURES: StickFigure[] = [
  {
    top: '0%',
    src: 'https://raw.githubusercontent.com/RicardoYare/imagenes/9ef29f5bbe075b1d1230a996d87bca313b9b6a63/sticks/stick0.svg',
    transform: 'rotateZ(-90deg)',
    speedX: 1500,
  },
  {
    top: '10%',
    src: 'https://raw.githubusercontent.com/RicardoYare/imagenes/9ef29f5bbe075b1d1230a996d87bca313b9b6a63/sticks/stick1.svg',
    speedX: 3000,
    speedRotation: 2000,
  },
  {
    top: '20%',
    src: 'https://raw.githubusercontent.com/RicardoYare/imagenes/9ef29f5bbe075b1d1230a996d87bca313b9b6a63/sticks/stick2.svg',
    speedX: 5000,
    speedRotation: 1000,
  },
  {
    top: '25%',
    src: 'https://raw.githubusercontent.com/RicardoYare/imagenes/9ef29f5bbe075b1d1230a996d87bca313b9b6a63/sticks/stick0.svg',
    speedX: 2500,
    speedRotation: 1500,
  },
  {
    top: '35%',
    src: 'https://raw.githubusercontent.com/RicardoYare/imagenes/9ef29f5bbe075b1d1230a996d87bca313b9b6a63/sticks/stick0.svg',
    speedX: 2000,
    speedRotation: 300,
  },
  {
    bottom: '5%',
    src: 'https://raw.githubusercontent.com/RicardoYare/imagenes/9ef29f5bbe075b1d1230a996d87bca313b9b6a63/sticks/stick3.svg',
    speedX: 0,
  },
];

function CharactersAnimation() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.innerHTML = '';

    STICK_FIGURES.forEach((figure, index) => {
      const stick = document.createElement('img');
      stick.style.position = 'absolute';
      stick.style.width = '18%';
      stick.style.height = '18%';
      if (figure.top)    stick.style.top    = figure.top;
      if (figure.bottom) stick.style.bottom = figure.bottom;
      stick.src = figure.src;
      if (figure.transform) stick.style.transform = figure.transform;
      container.appendChild(stick);

      if (index === 5) return;

      stick.animate(
        [{ left: '100%' }, { left: '-20%' }],
        { duration: figure.speedX, easing: 'linear', fill: 'forwards' },
      );

      if (index === 0) return;

      if (figure.speedRotation) {
        stick.animate(
          [{ transform: 'rotate(0deg)' }, { transform: 'rotate(-360deg)' }],
          { duration: figure.speedRotation, iterations: Infinity, easing: 'linear' },
        );
      }
    });

    return () => { container.innerHTML = ''; };
  }, []);

  return <div ref={containerRef} className="absolute w-[99%] h-[95%]" />;
}

/* ── 3. Circle Animation ─────────────────────────────────────────── */
interface Circulo { x: number; y: number; size: number; }

function CircleAnimation() {
  const canvasRef     = useRef<HTMLCanvasElement>(null);
  const requestIdRef  = useRef<number>(0);
  const timerRef      = useRef(0);
  const circulosRef   = useRef<Circulo[]>([]);

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
          Math.random() * (canvas.height - canvas.height * -0.2 + 1),
        ) + canvas.height * -0.2;
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

      // Always white circles on dark background
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
        ctx.arc(c.x, c.y, c.size, 0, 360);
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

  return <canvas ref={canvasRef} className="w-full h-full" />;
}
