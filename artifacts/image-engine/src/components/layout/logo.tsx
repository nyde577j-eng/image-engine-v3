import { cn } from '@/lib/utils';
import { LayoutGroup, motion } from 'framer-motion';
import { TextRotate } from '@/components/ui/text-rotate';

type BrandLogoProps = {
  collapsed?: boolean;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  forceLight?: boolean;
};

const SIZE_PX: Record<NonNullable<BrandLogoProps['size']>, number> = {
  sm: 14,
  md: 16,
  lg: 20,
  xl: 22,
};

export function BrandLogo({
  collapsed = false,
  className,
  size = 'md',
  forceLight = false,
}: BrandLogoProps) {
  const fontSize = SIZE_PX[size];

  if (collapsed) {
    /* لما الـ sidebar مغلق — نعرض الحرف الأول بس */
    return (
      <div className={cn('flex shrink-0 items-center justify-center', className)}>
        <span
          style={{
            fontSize: fontSize + 4,
            fontWeight: 700,
            color: forceLight ? '#fff' : 'var(--ink)',
            lineHeight: 1,
            letterSpacing: '-0.04em',
          }}
        >
          N
        </span>
      </div>
    );
  }

  return (
    <div className={cn('flex shrink-0 items-center gap-1 overflow-hidden', className)}>
      <LayoutGroup>
        <motion.div
          className="flex items-baseline gap-0"
          layout
          style={{ lineHeight: 1 }}
        >
          {/* "Nova" — ثابت */}
          <motion.span
            layout
            style={{
              fontSize,
              fontWeight: 700,
              color: forceLight ? '#fff' : 'var(--ink)',
              letterSpacing: '-0.04em',
              whiteSpace: 'nowrap',
              lineHeight: 1,
            }}
          >
            Nova&nbsp;
          </motion.span>

          {/* الكلمة المتحركة */}
          <TextRotate
            texts={['AI', 'Studio', 'Vision', 'Create']}
            rotationInterval={2800}
            staggerFrom="last"
            staggerDuration={0.03}
            splitBy="characters"
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '-120%', opacity: 0 }}
            transition={{ type: 'spring', damping: 30, stiffness: 400 }}
            splitLevelClassName="overflow-hidden"
            mainClassName="rounded-md text-white overflow-hidden"
            style={{
              fontSize,
              fontWeight: 700,
              letterSpacing: '-0.04em',
              background: '#ff4d1f',
              lineHeight: 1,
              padding: '2px 5px',
            }}
          />
        </motion.div>
      </LayoutGroup>
    </div>
  );
}

export const Logo = BrandLogo;
