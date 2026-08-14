import * as React from 'react';
import { cn } from '@/lib/utils';

export type AnimatedGenerateButtonProps = {
  className?: string;
  labelIdle?: string;
  labelActive?: string;
  generating?: boolean;
  highlightHueDeg?: number;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  type?: 'button' | 'submit' | 'reset';
  disabled?: boolean;
  id?: string;
  ariaLabel?: string;
  width?: string | number;
};

export default function AnimatedGenerateButton({
  className,
  labelIdle = 'Generate',
  labelActive = 'Generating',
  generating = false,
  highlightHueDeg = 17,
  onClick,
  type = 'button',
  disabled = false,
  id,
  ariaLabel,
  width = '100%',
}: AnimatedGenerateButtonProps) {
  return (
    <div className={cn('relative inline-block', className)} id={id} style={{ width, isolation: 'isolate' }}>
      <button
        type={type}
        aria-label={ariaLabel || (generating ? labelActive : labelIdle)}
        aria-pressed={generating}
        disabled={disabled}
        onClick={onClick}
        className="ui-anim-btn relative flex w-full items-center justify-center cursor-pointer select-none rounded-[24px] px-5 py-3"
        style={{ '--highlight-hue': `${highlightHueDeg}deg` } as React.CSSProperties}
      >
        {/* Sparkle icon */}
        <svg
          className="ui-anim-btn-svg mr-2 h-5 w-5 flex-shrink-0"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z"
          />
        </svg>

        {/* Text wrapper */}
        <div className="ui-anim-txt-wrapper relative flex items-center" style={{ minWidth: '6em', height: '1.4em' }}>
          {/* Idle label */}
          <div
            className="ui-anim-txt-1 absolute inset-0 flex items-center justify-center"
            style={{
              opacity: generating ? 0 : 1,
              transition: 'opacity 0.3s ease',
              pointerEvents: 'none',
            }}
          >
            {Array.from(labelIdle).map((ch, i) => (
              <span key={i} className="ui-anim-letter inline-block">
                {ch === ' ' ? '\u00A0' : ch}
              </span>
            ))}
          </div>

          {/* Active label */}
          <div
            className="ui-anim-txt-2 absolute inset-0 flex items-center justify-center"
            style={{
              opacity: generating ? 1 : 0,
              transition: 'opacity 0.3s ease',
              pointerEvents: 'none',
            }}
          >
            {Array.from(labelActive).map((ch, i) => (
              <span key={i} className="ui-anim-letter inline-block">
                {ch === ' ' ? '\u00A0' : ch}
              </span>
            ))}
          </div>
        </div>
      </button>

      <style>{`
        .ui-anim-btn {
          --padding: 4px;
          --radius: 24px;
          --transition: 0.4s;
          --highlight: hsl(var(--highlight-hue), 100%, 70%);
          --highlight-50: hsla(var(--highlight-hue), 100%, 70%, 0.5);
          --highlight-30: hsla(var(--highlight-hue), 100%, 70%, 0.3);
          --highlight-20: hsla(var(--highlight-hue), 100%, 70%, 0.2);
          --highlight-80: hsla(var(--highlight-hue), 100%, 70%, 0.8);
          --ui-anim-svg-fill: #e8e8e8;

          background: #1a1816;
          color: #fff;
          border: 1px solid rgba(255,255,255,0.12);
          font-family: var(--ui);
          font-size: 15px;
          font-weight: 700;
          letter-spacing: .01em;

          box-shadow:
            inset 0px 1px 1px rgba(255,255,255,0.2),
            inset 0px 2px 2px rgba(255,255,255,0.15),
            inset 0px 4px 4px rgba(255,255,255,0.1),
            inset 0px 8px 8px rgba(255,255,255,0.05),
            0 -1px 1px rgba(0,0,0,0.02),
            0 -2px 2px rgba(0,0,0,0.03),
            0 -4px 4px rgba(0,0,0,0.05),
            0 4px 8px rgba(0,0,0,0.3),
            0 8px 20px rgba(0,0,0,0.25);

          transition: box-shadow var(--transition), border-color var(--transition), background-color var(--transition);
        }

        .ui-anim-btn::before {
          content: "";
          position: absolute;
          top: calc(0px - var(--padding));
          left: calc(0px - var(--padding));
          width: calc(100% + var(--padding) * 2);
          height: calc(100% + var(--padding) * 2);
          border-radius: calc(var(--radius) + var(--padding));
          pointer-events: none;
          background-image: linear-gradient(0deg, #0004, #000a);
          z-index: 0;
          transition: box-shadow var(--transition), filter var(--transition);
          box-shadow:
            0 -8px 8px -6px #0000 inset,
            0 -16px 16px -8px #00000000 inset,
            1px 1px 1px #fff2,
            2px 2px 2px #fff1,
            -1px -1px 1px #0002,
            -2px -2px 2px #0001;
        }

        .ui-anim-btn::after {
          content: "";
          position: absolute;
          inset: 0;
          border-radius: inherit;
          pointer-events: none;
          background-image: linear-gradient(0deg, #fff, var(--highlight), var(--highlight-50), 8%, transparent);
          background-position: 0 0;
          opacity: 0;
          transition: opacity var(--transition), filter var(--transition);
        }

        /* SVG fill */
        .ui-anim-btn-svg {
          fill: var(--ui-anim-svg-fill);
          filter: drop-shadow(0 0 2px #fff9);
          animation: ui-flicker 2s linear infinite;
          animation-delay: 0.5s;
          transition: fill var(--transition), filter var(--transition);
        }

        @keyframes ui-flicker {
          50% { opacity: 0.4; }
        }

        /* Letters */
        .ui-anim-letter {
          color: rgba(255,255,255,0.7);
          animation: ui-letter-anim 2s ease-in-out infinite;
          transition: color var(--transition), text-shadow var(--transition);
        }

        @keyframes ui-letter-anim {
          50% {
            text-shadow: 0 0 3px #fff8;
            color: #fff;
          }
        }

        /* Letter stagger delays */
        .ui-anim-txt-1 .ui-anim-letter:nth-child(1),
        .ui-anim-txt-2 .ui-anim-letter:nth-child(1)  { animation-delay: 0s; }
        .ui-anim-txt-1 .ui-anim-letter:nth-child(2),
        .ui-anim-txt-2 .ui-anim-letter:nth-child(2)  { animation-delay: 0.08s; }
        .ui-anim-txt-1 .ui-anim-letter:nth-child(3),
        .ui-anim-txt-2 .ui-anim-letter:nth-child(3)  { animation-delay: 0.16s; }
        .ui-anim-txt-1 .ui-anim-letter:nth-child(4),
        .ui-anim-txt-2 .ui-anim-letter:nth-child(4)  { animation-delay: 0.24s; }
        .ui-anim-txt-1 .ui-anim-letter:nth-child(5),
        .ui-anim-txt-2 .ui-anim-letter:nth-child(5)  { animation-delay: 0.32s; }
        .ui-anim-txt-1 .ui-anim-letter:nth-child(6),
        .ui-anim-txt-2 .ui-anim-letter:nth-child(6)  { animation-delay: 0.40s; }
        .ui-anim-txt-1 .ui-anim-letter:nth-child(7),
        .ui-anim-txt-2 .ui-anim-letter:nth-child(7)  { animation-delay: 0.48s; }
        .ui-anim-txt-1 .ui-anim-letter:nth-child(8),
        .ui-anim-txt-2 .ui-anim-letter:nth-child(8)  { animation-delay: 0.56s; }
        .ui-anim-txt-1 .ui-anim-letter:nth-child(9),
        .ui-anim-txt-2 .ui-anim-letter:nth-child(9)  { animation-delay: 0.64s; }
        .ui-anim-txt-1 .ui-anim-letter:nth-child(10),
        .ui-anim-txt-2 .ui-anim-letter:nth-child(10) { animation-delay: 0.72s; }
        .ui-anim-txt-1 .ui-anim-letter:nth-child(11),
        .ui-anim-txt-2 .ui-anim-letter:nth-child(11) { animation-delay: 0.80s; }
        .ui-anim-txt-1 .ui-anim-letter:nth-child(12),
        .ui-anim-txt-2 .ui-anim-letter:nth-child(12) { animation-delay: 0.88s; }
        .ui-anim-txt-1 .ui-anim-letter:nth-child(13),
        .ui-anim-txt-2 .ui-anim-letter:nth-child(13) { animation-delay: 0.96s; }
        .ui-anim-txt-1 .ui-anim-letter:nth-child(14),
        .ui-anim-txt-2 .ui-anim-letter:nth-child(14) { animation-delay: 1.04s; }
        .ui-anim-txt-1 .ui-anim-letter:nth-child(15),
        .ui-anim-txt-2 .ui-anim-letter:nth-child(15) { animation-delay: 1.12s; }

        /* Hover */
        .ui-anim-btn:hover {
          border-color: hsla(var(--highlight-hue), 100%, 80%, 0.4);
        }

        .ui-anim-btn:hover::before {
          box-shadow:
            0 -8px 8px -6px #fffa inset,
            0 -16px 16px -8px var(--highlight-30) inset,
            1px 1px 1px #fff2,
            2px 2px 2px #fff1,
            -1px -1px 1px #0002,
            -2px -2px 2px #0001;
        }

        .ui-anim-btn:hover::after {
          opacity: 1;
          -webkit-mask-image: linear-gradient(0deg, #fff, transparent);
          mask-image: linear-gradient(0deg, #fff, transparent);
        }

        .ui-anim-btn:hover .ui-anim-btn-svg {
          fill: #fff;
          filter: drop-shadow(0 0 3px var(--highlight)) drop-shadow(0 -4px 6px #0009);
          animation: none;
        }

        .ui-anim-btn:hover .ui-anim-letter {
          color: #fff;
        }

        /* Active / pressed */
        .ui-anim-btn:active {
          border-color: hsla(var(--highlight-hue), 100%, 80%, 0.7);
          background-color: hsla(var(--highlight-hue), 50%, 20%, 0.5);
        }

        .ui-anim-btn:active::before {
          box-shadow:
            0 -8px 12px -6px #fffa inset,
            0 -16px 16px -8px var(--highlight-80) inset,
            1px 1px 1px #fff4,
            2px 2px 2px #fff2,
            -1px -1px 1px #0002,
            -2px -2px 2px #0001;
        }

        .ui-anim-btn:active::after {
          opacity: 1;
          -webkit-mask-image: linear-gradient(0deg, #fff, transparent);
          mask-image: linear-gradient(0deg, #fff, transparent);
          filter: brightness(200%);
        }

        .ui-anim-btn:active .ui-anim-letter {
          text-shadow: 0 0 1px hsla(var(--highlight-hue), 100%, 90%, 0.9);
          animation: none;
        }

        /* Focus */
        .ui-anim-btn:focus-visible {
          outline: 2px solid hsla(var(--highlight-hue), 100%, 70%, 0.6);
          outline-offset: 3px;
        }

        .ui-anim-btn:focus .ui-anim-btn-svg {
          animation-duration: 1.2s;
          animation-delay: 0.2s;
        }

        .ui-anim-btn:focus::before {
          box-shadow:
            0 -8px 12px -6px #fff3 inset,
            0 -16px 16px -8px var(--highlight-20) inset,
            1px 1px 1px #fff3,
            2px 2px 2px #fff1,
            -1px -1px 1px #0002,
            -2px -2px 2px #0001;
        }

        .ui-anim-btn:focus::after {
          opacity: 0.6;
          -webkit-mask-image: linear-gradient(0deg, #fff, transparent);
          mask-image: linear-gradient(0deg, #fff, transparent);
        }

        /* Disabled */
        .ui-anim-btn:disabled {
          opacity: 0.45;
          cursor: not-allowed;
          pointer-events: none;
        }
      `}</style>
    </div>
  );
}
