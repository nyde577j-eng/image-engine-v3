import { cn } from '@/lib/utils';

const LOGO_ICON = '/logo.png';

type BrandLogoProps = {
  collapsed?: boolean;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  forceLight?: boolean;
};

// اللوجو مربع 1:1 — الارتفاعات محددة لكل حجم
const ICON_HEIGHT: Record<NonNullable<BrandLogoProps['size']>, number> = {
  sm: 32,
  md: 40,
  lg: 56,
  xl: 72,
};

export function BrandLogo({
  collapsed = false,
  className,
  size = 'md',
  forceLight = false,
}: BrandLogoProps) {
  const h = ICON_HEIGHT[size];

  // اللوجو مربع — لما الـ sidebar مفتوح نعرضه بحجم أكبر قليلاً مع النص
  // لما مغلق نعرض الأيقونة بس بنفس الحجم
  const imgClass = cn(
    'object-contain shrink-0',
    // invert على dark mode عشان الكتابة السوداء تبقى بيضاء
    'dark:invert dark:brightness-90',
    forceLight && 'invert brightness-90',
  );

  return (
    <div className={cn('flex shrink-0 items-center', className)}>
      <img
        src={LOGO_ICON}
        alt="Image Engine Studio"
        width={h}
        height={h}
        className={imgClass}
        style={{ width: h, height: h }}
      />
    </div>
  );
}

export const Logo = BrandLogo;
