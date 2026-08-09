import { cn } from '@/lib/utils';

const LOGO_ICON = '/logo.png';

type BrandLogoProps = {
  collapsed?: boolean;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  forceLight?: boolean;
};

// الارتفاع لكل حجم — العرض يتحسب أوتوماتيك من نسبة الصورة
const ICON_HEIGHT: Record<NonNullable<BrandLogoProps['size']>, number> = {
  sm: 28,
  md: 36,
  lg: 48,
  xl: 60,
};

export function BrandLogo({
  collapsed = false,
  className,
  size = 'md',
  forceLight = false,
}: BrandLogoProps) {
  const h = ICON_HEIGHT[size];

  return (
    <div className={cn('flex shrink-0 items-center', className)}>
      {collapsed ? (
        // لما الـ sidebar مغلق — نعرض الأيقونة بس (الجزء الأيسر من اللوجو)
        <div
          style={{ width: h, height: h, overflow: 'hidden' }}
          className="shrink-0"
        >
          <img
            src={LOGO_ICON}
            alt="Image Engine Studio"
            style={{ height: h, width: 'auto', maxWidth: 'none' }}
            className={cn(forceLight && 'brightness-110')}
          />
        </div>
      ) : (
        // لما مفتوح — اللوجو كامل بعرض يملأ الـ sidebar
        <img
          src={LOGO_ICON}
          alt="Image Engine Studio"
          style={{ height: h, width: 'auto', maxWidth: 224 }}
          className={cn(forceLight && 'brightness-110')}
        />
      )}
    </div>
  );
}

export const Logo = BrandLogo;
