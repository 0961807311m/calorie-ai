'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, Loader2, Eye, EyeOff, Sparkles, ArrowRight } from 'lucide-react';

export default function AuthPage() {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ text: string; type: 'error' | 'success' } | null>(null);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMsg(null);
    try {
      if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        router.push('/onboarding');
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('No user');
        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('id', user.id)
          .single();
        router.push(profile ? '/dashboard' : '/onboarding');
      }
    } catch (e: any) {
      setMsg({ text: e.message, type: 'error' });
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden">
      {/* CSS-анімації — працюють у GPU, 60 FPS без JS */}
      <style>{`
        @keyframes floatBlob1 {
          0%, 100% { transform: translate3d(0, 0, 0) scale(1); }
          50% { transform: translate3d(80px, 40px, 0) scale(1.15); }
        }
        @keyframes floatBlob2 {
          0%, 100% { transform: translate3d(0, 0, 0) scale(1); }
          50% { transform: translate3d(-60px, -30px, 0) scale(1.2); }
        }
        @keyframes floatParticle {
          0% {
            transform: translate3d(0, 0, 0);
            opacity: 0;
          }
          20% {
            opacity: 0.8;
          }
          100% {
            transform: translate3d(var(--dx), -220px, 0);
            opacity: 0;
          }
        }
        @keyframes logoPulse {
          0%, 100% {
            transform: translate3d(0, 0, 0) scale(1) rotate(0deg);
          }
          50% {
            transform: translate3d(0, 0, 0) scale(1.08) rotate(5deg);
          }
        }
        @keyframes logoGlow {
          0%, 100% { opacity: 0.4; transform: scale(1); }
          50% { opacity: 0.7; transform: scale(1.15); }
        }
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }
        .blob-1 {
          animation: floatBlob1 15s ease-in-out infinite;
          will-change: transform;
          transform: translate3d(0,0,0);
        }
        .blob-2 {
          animation: floatBlob2 18s ease-in-out infinite;
          will-change: transform;
          transform: translate3d(0,0,0);
        }
        .particle {
          animation: floatParticle var(--dur) linear infinite;
          will-change: transform, opacity;
          transform: translate3d(0,0,0);
        }
        .logo-anim {
          animation: logoPulse 4s ease-in-out infinite;
          will-change: transform;
          transform: translate3d(0,0,0);
        }
        .logo-glow {
          animation: logoGlow 3s ease-in-out infinite;
          will-change: transform, opacity;
        }
        .shimmer-btn {
          animation: shimmer 2.5s ease-in-out infinite;
          animation-delay: 2s;
          will-change: transform;
        }
      `}</style>

      {/* Плями */}
      <div
        className="blob-1 absolute rounded-full pointer-events-none"
        style={{
          width: 500,
          height: 500,
          background:
            'radial-gradient(circle, rgba(124,58,237,0.4) 0%, rgba(236,72,153,0.2) 40%, transparent 70%)',
          filter: 'blur(80px)',
          top: '10%',
          left: '-20%',
        }}
      />
      <div
        className="blob-2 absolute rounded-full pointer-events-none"
        style={{
          width: 400,
          height: 400,
          background:
            'radial-gradient(circle, rgba(236,72,153,0.35) 0%, rgba(251,146,60,0.15) 40%, transparent 70%)',
          filter: 'blur(70px)',
          bottom: '5%',
          right: '-15%',
        }}
      />

      {/* Частинки — 8, CSS-анімація */}
      {mounted && [...Array(8)].map((_, i) => {
        const colors = ['#a78bfa', '#ec4899', '#fb923c'];
        const color = colors[i % 3];
        const startLeft = (i * 12.5) % 100;
        return (
          <div
            key={i}
            className="particle absolute w-1 h-1 rounded-full pointer-events-none"
            style={{
              background: color,
              left: `${startLeft}%`,
              top: '100%',
              boxShadow: `0 0 8px ${color}`,
              ['--dx' as any]: `${(i % 3) * 30 - 30}px`,
              ['--dur' as any]: `${12 + (i % 4) * 2}s`,
              animationDelay: `${i * 1.3}s`,
            }}
          />
        );
      })}

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-md relative z-10"
      >
        {/* Логотип */}
        <div className="flex justify-center mb-6">
          <div className="relative">
            <div
              className="logo-glow absolute inset-0 rounded-full"
              style={{
                background:
                  'radial-gradient(circle, rgba(167,139,250,0.6) 0%, transparent 70%)',
                filter: 'blur(30px)',
              }}
            />
            <div className="logo-anim text-7xl relative">🍎</div>
          </div>
        </div>

        {/* Заголовок */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="text-center mb-8"
        >
          <h1 className="text-5xl font-bold gradient-text mb-2 tracking-tight">
            CalorieAI
          </h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="text-white/50 text-sm flex items-center justify-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Розумний щоденник калорій з ШІ
          </motion.p>
        </motion.div>

        {/* Форма */}
        <motion.form
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          onSubmit={submit}
          className="glass p-6 space-y-4 relative overflow-hidden"
          style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.08)',
            backdropFilter: 'blur(30px)',
          }}
        >
          {/* Gradient border */}
          <div
            className="absolute top-0 left-0 right-0 h-px"
            style={{
              background:
                'linear-gradient(90deg, transparent, rgba(167,139,250,0.6), rgba(236,72,153,0.6), transparent)',
            }}
          />

          {/* Перемикач */}
          <div className="relative flex gap-2 mb-4 p-1 rounded-2xl" style={{ background: 'rgba(255,255,255,0.03)' }}>
            {(['signin', 'signup'] as const).map((m) => {
              const active = mode === m;
              return (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMode(m)}
                  className="relative flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors z-10"
                  style={{
                    color: active ? '#fff' : 'rgba(255,255,255,0.5)',
                    touchAction: 'manipulation',
                  }}
                >
                  {active && (
                    <motion.div
                      layoutId="mode-bg"
                      className="absolute inset-0 rounded-xl -z-10"
                      style={{
                        background: 'linear-gradient(135deg, #7c3aed, #ec4899)',
                        boxShadow: '0 8px 24px rgba(124,58,237,0.4)',
                      }}
                      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    />
                  )}
                  {m === 'signin' ? 'Вхід' : 'Реєстрація'}
                </button>
              );
            })}
          </div>

          {/* Email */}
          <div className="relative group">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30 group-focus-within:text-purple-400 transition-colors z-10" />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@example.com"
              className="w-full rounded-2xl pl-12 pr-4 py-4 text-sm transition-all relative"
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
              }}
            />
          </div>

          {/* Password */}
          <div className="relative group">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30 group-focus-within:text-purple-400 transition-colors z-10" />
            <input
              type={showPassword ? 'text' : 'password'}
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Пароль (мін. 6)"
              className="w-full rounded-2xl pl-12 pr-12 py-4 text-sm transition-all relative"
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
              }}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors z-10 p-1"
              style={{ touchAction: 'manipulation' }}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          {/* Error/Success */}
          <AnimatePresence>
            {msg && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div
                  className={`text-sm p-3 rounded-2xl ${
                    msg.type === 'error'
                      ? 'bg-red-500/10 text-red-300 border border-red-400/30'
                      : 'bg-emerald-500/10 text-emerald-300 border border-emerald-400/30'
                  }`}
                >
                  {msg.text}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Submit */}
          <motion.button
            type="submit"
            disabled={loading}
            whileTap={{ scale: 0.98 }}
            className="w-full py-4 rounded-2xl font-semibold flex items-center justify-center gap-2 disabled:opacity-50 relative overflow-hidden group"
            style={{
              background: 'linear-gradient(135deg, #7c3aed, #ec4899)',
              boxShadow: '0 12px 40px rgba(124,58,237,0.4)',
              touchAction: 'manipulation',
            }}
          >
            {/* Shimmer — CSS */}
            <div
              className="shimmer-btn absolute inset-0 pointer-events-none"
              style={{
                background:
                  'linear-gradient(90deg, transparent, rgba(255,255,255,0.25), transparent)',
                width: '50%',
              }}
            />
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin relative" />
            ) : (
              <>
                <span className="relative">
                  {mode === 'signin' ? 'Увійти' : 'Створити акаунт'}
                </span>
                <ArrowRight className="w-5 h-5 relative group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </motion.button>
        </motion.form>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="text-center text-xs text-white/30 mt-6"
        >
          Продовжуючи, ти погоджуєшся з умовами використання 🔒
        </motion.p>
      </motion.div>
    </main>
  );
}