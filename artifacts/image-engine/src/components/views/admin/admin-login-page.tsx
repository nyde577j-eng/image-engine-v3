
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, Loader2, ShieldAlert, Lock, ShieldX, AlertTriangle } from 'lucide-react';
import { useAdminAuth } from '@/components/providers/admin-auth-provider';
import { BrandLogo } from '@/components/layout/logo';
import { cn } from '@/lib/utils';

// Shake animation keyframes
const shakeVariants = {
  idle: { x: 0 },
  shake: {
    x: [0, -10, 10, -10, 10, -6, 6, -3, 3, 0],
    transition: { duration: 0.5 },
  },
};

export function AdminLoginPage() {
  const { login } = useAdminAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [shakeKey, setShakeKey] = useState(0);
  const [showModal, setShowModal] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) return;
    setError('');
    setLoading(true);
    const result = await login(username.trim(), password);
    setLoading(false);
    if (result.error) {
      setError(result.error);
      // trigger shake + show modal
      setShakeKey((k) => k + 1);
      setShowModal(true);
    }
  };

  const hasError = !!error;

  return (
    <div className="admin-login-bg relative flex min-h-screen items-center justify-center overflow-hidden p-4">

      {/* ── Animated background ── */}
      <div style={{
        position: 'absolute', inset: 0, zIndex: 0,
        background: 'linear-gradient(135deg, #0f0e0c 0%, #1c1a14 50%, #0f0e0c 100%)',
      }} />

      {/* Floating orbs animation */}
      {[
        { w:400, h:400, top:'10%', left:'5%',  color:'rgba(255,77,31,.12)', delay:0, dur:8 },
        { w:300, h:300, top:'60%', left:'70%', color:'rgba(255,77,31,.08)', delay:2, dur:10 },
        { w:250, h:250, top:'30%', left:'55%', color:'rgba(255,120,50,.06)', delay:4, dur:7 },
        { w:200, h:200, top:'70%', left:'20%', color:'rgba(255,77,31,.07)', delay:1, dur:9 },
      ].map((orb, i) => (
        <motion.div key={i}
          style={{
            position: 'absolute', zIndex: 0,
            width: orb.w, height: orb.h,
            top: orb.top, left: orb.left,
            borderRadius: '50%',
            background: `radial-gradient(circle, ${orb.color}, transparent 70%)`,
            filter: 'blur(40px)',
          }}
          animate={{ scale: [1, 1.2, 1], opacity: [0.6, 1, 0.6], y: [0, -30, 0] }}
          transition={{ duration: orb.dur, delay: orb.delay, repeat: Infinity, ease: 'easeInOut' }}
        />
      ))}

      {/* Subtle grid lines */}
      <div style={{
        position: 'absolute', inset: 0, zIndex: 0,
        backgroundImage: 'linear-gradient(rgba(255,255,255,.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.03) 1px, transparent 1px)',
        backgroundSize: '40px 40px',
      }} />

      {/* ── Unauthorized Modal ── */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
            onClick={() => setShowModal(false)}
          >
            <motion.div
              initial={{ scale: 0.7, opacity: 0, y: 40 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.85, opacity: 0, y: 20 }}
              transition={{ type: 'spring', stiffness: 320, damping: 24 }}
              className="w-full max-w-sm overflow-hidden rounded-2xl border border-destructive/40 bg-card shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Red top bar */}
              <div className="h-1.5 w-full bg-gradient-to-r from-destructive via-red-500 to-destructive" />

              <div className="flex flex-col items-center gap-4 px-8 py-8 text-center">
                {/* Animated icon */}
                <motion.div
                  initial={{ rotate: -15, scale: 0.5 }}
                  animate={{ rotate: 0, scale: 1 }}
                  transition={{ type: 'spring', stiffness: 260, damping: 16, delay: 0.1 }}
                  className="flex h-16 w-16 items-center justify-center rounded-2xl bg-destructive/15 border border-destructive/30"
                >
                  <ShieldX className="h-8 w-8 text-destructive" />
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <h2 className="font-display text-xl font-bold tracking-tight text-destructive">
                    Access Denied
                  </h2>
                  <p className="mt-1.5 text-sm text-muted-foreground">
                    Unauthorized access attempt detected.
                  </p>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="flex w-full items-center gap-2 rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3"
                >
                  <AlertTriangle className="h-4 w-4 shrink-0 text-destructive" />
                  <p className="text-left text-xs text-destructive/80">
                    {error}
                  </p>
                </motion.div>

                <motion.button
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  onClick={() => setShowModal(false)}
                  className="mt-1 h-10 w-full rounded-xl border border-destructive/30 bg-destructive/10 text-sm font-semibold text-destructive transition-all hover:bg-destructive/20"
                >
                  Try Again
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Login Card ── */}
      <motion.div
        key={shakeKey}
        variants={shakeVariants}
        animate={shakeKey > 0 ? 'shake' : 'idle'}
        className="relative w-full max-w-md"
        style={{ zIndex: 1 }}
      >
        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
          className={cn(
            'overflow-hidden rounded-2xl border bg-card/80 shadow-2xl backdrop-blur-xl transition-colors duration-300',
            hasError ? 'border-destructive/40' : 'border-border',
          )}
        >
          {/* Top accent bar — turns red on error */}
          <motion.div
            className="h-1 w-full"
            animate={{
              background: hasError
                ? 'linear-gradient(to right, hsl(var(--destructive)), #ef4444, hsl(var(--destructive)))'
                : 'linear-gradient(to right, hsl(43 96% 56%), hsl(32 95% 50%), hsl(43 96% 56%))',
            }}
            transition={{ duration: 0.4 }}
          />

          {/* Header */}
          <div className="border-b border-border bg-gradient-to-r from-card to-card/50 px-8 pt-7 pb-6">
            <div className="mb-6 flex justify-center">
              <BrandLogo size="lg" />
            </div>
            <div className="flex items-center gap-3">
              <motion.div
                animate={hasError ? { backgroundColor: 'hsl(var(--destructive) / 0.15)' } : {}}
                className="flex h-10 w-10 items-center justify-center rounded-xl gradient-amber transition-colors duration-300"
              >
                {hasError
                  ? <ShieldX className="h-5 w-5 text-destructive" />
                  : <ShieldAlert className="h-5 w-5 text-black" />
                }
              </motion.div>
              <div>
                <h1 className="font-display text-xl font-bold tracking-tight">
                  Admin Access
                </h1>
                <p className="text-xs text-muted-foreground">
                  Engine Control Center — restricted area
                </p>
              </div>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4 px-8 py-6">
            {/* Username */}
            <div>
              <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Username
              </label>
              <motion.input
                animate={hasError ? { borderColor: 'hsl(var(--destructive) / 0.6)' } : { borderColor: '' }}
                type="text"
                autoComplete="username"
                value={username}
                onChange={(e) => { setUsername(e.target.value); setError(''); }}
                placeholder="Enter your username"
                className={cn(
                  'h-11 w-full rounded-xl border bg-background/60 px-3 text-sm outline-none transition-all placeholder:text-muted-foreground/50 focus:ring-2',
                  hasError
                    ? 'border-destructive/50 focus:border-destructive/60 focus:ring-destructive/20'
                    : 'border-border focus:border-primary/60 focus:ring-primary/20',
                )}
              />
            </div>

            {/* Password */}
            <div>
              <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Password
              </label>
              <div className="relative">
                <motion.input
                  animate={hasError ? { borderColor: 'hsl(var(--destructive) / 0.6)' } : { borderColor: '' }}
                  type={showPw ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(''); }}
                  placeholder="Enter your password"
                  className={cn(
                    'h-11 w-full rounded-xl border bg-background/60 px-3 pr-10 text-sm outline-none transition-all placeholder:text-muted-foreground/50 focus:ring-2',
                    hasError
                      ? 'border-destructive/50 focus:border-destructive/60 focus:ring-destructive/20'
                      : 'border-border focus:border-primary/60 focus:ring-primary/20',
                  )}
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowPw((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                >
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Inline error hint */}
            <AnimatePresence>
              {hasError && (
                <motion.div
                  initial={{ opacity: 0, height: 0, y: -4 }}
                  animate={{ opacity: 1, height: 'auto', y: 0 }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="flex items-center gap-2 rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2.5 text-sm text-destructive">
                    <Lock className="h-4 w-4 shrink-0" />
                    {error}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading || !username.trim() || !password.trim()}
              className={cn(
                'flex h-11 w-full items-center justify-center gap-2 rounded-xl text-sm font-bold transition-all disabled:cursor-not-allowed disabled:opacity-50',
                'gradient-amber text-black hover:glow-amber',
              )}
            >
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  <ShieldAlert className="h-4 w-4" />
                  Sign In to Admin
                </>
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="border-t border-border px-8 py-4">
            <p className="text-center text-xs text-muted-foreground">
              Unauthorized access is prohibited and monitored.
            </p>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
