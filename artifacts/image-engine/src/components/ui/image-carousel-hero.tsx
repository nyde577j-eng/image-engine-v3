import type React from 'react';
import { useState, useEffect, useRef } from 'react';
import { ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ImageCard {
  id: string;
  src: string;
  alt: string;
  rotation: number;
}

export interface ImageCarouselHeroProps {
  title: string;
  description: string;
  ctaText: string;
  onCtaClick?: () => void;
  images: ImageCard[];
  features?: Array<{
    title: string;
    description: string;
  }>;
}

const DEFAULT_FEATURES = [
  {
    title: 'Realistic Results',
    description: 'Photos that look professionally crafted.',
  },
  {
    title: 'Fast Generation',
    description: 'Turn ideas into images in seconds.',
  },
  {
    title: 'Diverse Styles',
    description: 'Choose from a wide range of artistic options.',
  },
];

export function ImageCarouselHero({
  title,
  description,
  ctaText,
  onCtaClick,
  images,
  features = DEFAULT_FEATURES,
}: ImageCarouselHeroProps) {
  const [mousePosition, setMousePosition] = useState({ x: 0.5, y: 0.5 });
  const [angles, setAngles] = useState<number[]>(() =>
    images.map((_, i) => i * (360 / images.length)),
  );
  const rafRef = useRef<number>(0);
  const lastRef = useRef<number>(0);

  // Smooth RAF-based rotation — no setInterval jank
  useEffect(() => {
    const tick = (now: number) => {
      const delta = lastRef.current ? (now - lastRef.current) / 1000 : 0;
      lastRef.current = now;
      setAngles(prev => prev.map(a => (a + delta * 18) % 360));
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setMousePosition({
      x: (e.clientX - rect.left) / rect.width,
      y: (e.clientY - rect.top) / rect.height,
    });
  };

  const perspX = (mousePosition.x - 0.5) * 18;
  const perspY = (mousePosition.y - 0.5) * 18;

  return (
    <div className="relative w-full overflow-hidden">
      {/* Subtle background glows */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 60% 40% at 70% 30%, rgba(69,104,255,.07) 0%, transparent 70%),' +
            'radial-gradient(ellipse 50% 40% at 20% 80%, rgba(147,176,255,.05) 0%, transparent 70%)',
        }}
      />

      <div className="relative z-10 flex flex-col items-center">
        {/* ── Carousel ── */}
        <div
          className="relative w-full"
          style={{ height: 'clamp(260px, 38vw, 460px)' }}
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setMousePosition({ x: 0.5, y: 0.5 })}
        >
          <div
            className="absolute inset-0 flex items-center justify-center"
            style={{ perspective: '900px' }}
          >
            {images.map((image, index) => {
              const rad = (angles[index] ?? 0) * (Math.PI / 180);
              const radius = typeof window !== 'undefined' && window.innerWidth < 640 ? 110 : 170;
              const x = Math.cos(rad) * radius;
              const y = Math.sin(rad) * radius * 0.38; // flatten to ellipse
              // Depth cue: cards "behind" are smaller + more transparent
              const depth = Math.sin(rad);
              const scale = 0.78 + (depth + 1) * 0.11;
              const opacity = 0.55 + (depth + 1) * 0.225;
              const zIndex = Math.round((depth + 1) * 50);

              return (
                <div
                  key={image.id}
                  className="absolute transition-none"
                  style={{
                    width: 'clamp(100px, 11vw, 148px)',
                    height: 'clamp(126px, 14vw, 186px)',
                    transform: `
                      translate(${x}px, ${y}px)
                      rotateX(${perspY * 0.5}deg)
                      rotateY(${perspX * 0.5}deg)
                      rotateZ(${image.rotation}deg)
                      scale(${scale})
                    `,
                    transformStyle: 'preserve-3d',
                    zIndex,
                    opacity,
                    willChange: 'transform',
                  }}
                >
                  <div
                    className={cn(
                      'relative w-full h-full rounded-2xl overflow-hidden',
                      'shadow-[0_8px_32px_rgba(0,0,0,.45)]',
                      'hover:shadow-[0_16px_48px_rgba(69,104,255,.35)]',
                      'hover:scale-110 transition-[box-shadow,transform] duration-300',
                      'cursor-pointer group',
                    )}
                  >
                    <img
                      src={image.src}
                      alt={image.alt}
                      loading={index < 3 ? 'eager' : 'lazy'}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        display: 'block',
                        transition: 'transform .5s',
                      }}
                      className="group-hover:scale-110"
                    />
                    {/* Shine overlay */}
                    <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Text content ── */}
        <div className="relative z-20 text-center max-w-2xl mx-auto px-4 mt-2 mb-10">
          <h1
            style={{
              fontSize: 'clamp(28px, 4.8vw, 56px)',
              fontWeight: 700,
              letterSpacing: '-.03em',
              lineHeight: 1.07,
              marginBottom: 16,
            }}
          >
            {title}
          </h1>
          <p
            style={{
              fontSize: 'clamp(14px, 1.5vw, 17px)',
              color: 'var(--mut)',
              marginBottom: 28,
              lineHeight: 1.55,
            }}
          >
            {description}
          </p>

          {/* CTA */}
          <button
            onClick={onCtaClick}
            className={cn(
              'inline-flex items-center gap-2 px-7 py-3 rounded-full font-semibold',
              'bg-[var(--acc)] text-white',
              'hover:shadow-[0_8px_28px_rgba(69,104,255,.45)] hover:scale-105',
              'active:scale-95 focus:outline-none focus:ring-2 focus:ring-[var(--acc)] focus:ring-offset-2',
              'transition-all duration-300 group',
            )}
            style={{ fontSize: 15 }}
          >
            {ctaText}
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200" />
          </button>
        </div>

        {/* ── Feature cards ── */}
        <div
          className="relative z-20 w-full grid gap-4"
          style={{
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            maxWidth: 900,
            padding: '0 16px',
          }}
        >
          {features.map((feature, index) => (
            <div
              key={index}
              className={cn(
                'text-center p-5 rounded-2xl',
                'bg-[var(--card)] border border-[var(--line)]',
                'hover:border-[var(--line2)] hover:shadow-[var(--sh)]',
                'transition-all duration-300 group',
              )}
            >
              <h3
                className="font-semibold mb-1 group-hover:text-[var(--acc)] transition-colors"
                style={{ fontSize: 'clamp(13px,1.2vw,15px)' }}
              >
                {feature.title}
              </h3>
              <p
                style={{
                  fontSize: 'clamp(11px,1vw,13px)',
                  color: 'var(--mut)',
                  lineHeight: 1.5,
                }}
              >
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
