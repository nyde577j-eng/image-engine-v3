import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

/* ── PageHeader ────────────────────────────────────────────────────
   نفس الشكل السابق — الـ views الأخرى تستدعيه
────────────────────────────────────────────────────────────────── */
export function PageHeader({
  title,
  description,
  icon: Icon,
  actions,
}: {
  title: string;
  description?: string;
  icon?: React.ComponentType<{ className?: string }>;
  actions?: React.ReactNode;
}) {
  return (
    <div className="vhead">
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {Icon && (
          <div style={{
            width: 44, height: 44, borderRadius: 12,
            background: 'var(--accsoft)', display: 'grid', placeItems: 'center', flexShrink: 0,
          }}>
            <Icon className="h-5 w-5" style={{ color: 'var(--acc)' }} />
          </div>
        )}
        <div>
          <h2>{title}</h2>
          {description && <p>{description}</p>}
        </div>
      </div>
      {actions && <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>{actions}</div>}
    </div>
  );
}

/* ── PageContainer ─────────────────────────────────────────────────
   wrapper مع padding يطابق التصميم الجديد
────────────────────────────────────────────────────────────────── */
export function PageContainer({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, ease: 'easeOut' }}
      style={{
        padding: 'clamp(16px,3vw,30px)',
        paddingBottom: 50,
        maxWidth: 1460,
        margin: '0 auto',
        width: '100%',
      }}
      className={cn(className)}
    >
      {children}
    </motion.div>
  );
}

/* ── Card ──────────────────────────────────────────────────────────
   بطاقة خفيفة مع border — تستخدمها views كثيرة
────────────────────────────────────────────────────────────────── */
export function Card({
  children,
  className,
  hover = false,
}: {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
}) {
  return (
    <div
      className={cn(
        'ie-card',
        hover && 'transition-all hover:-translate-y-0.5 hover:shadow-md',
        className,
      )}
    >
      {children}
    </div>
  );
}
