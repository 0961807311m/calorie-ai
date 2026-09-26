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
      {/* Фонові анімовані плями */}
      <motion.div
        className="absolute rounded-full pointer-events-none"
        style={{
          width: 500,
          height: 500,
          background:
            'radial-gradient(circle, rgba(124,58,237,0.4) 0%, rgba(236,72,153,0.2) 40%, transparent 70%)',
          filter: 'blur(80px)',
          top: '10%',
          left: '-20%',
        }}
        animate={{
          x: [0, 100, 0],
          y: [0, 50, 0],
          scale: [1, 1.2, 1],
        }}
        transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute rounded-full pointer-events-none"
        style={{
          width: 400,
          height: 400,
          background:
            'radial-gradient(circle, rgba(236,72,153,0.35) 0%, rgba(251,146,60,0.15) 40%, transparent 70%)',
          filter: 'blur(70px)',
          bottom: '5%',
          right: '-15%',
        }}
        animate={{
          x: [0, -80, 0],
          y: [0, -40, 0],
          scale: [1, 1.3, 1],
        }}
        transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Плаваючі частинки */}
      {mounted && [...Array(15)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 rounded-full pointer-events-none"
          style={{
            background: i % 3 === 0 ? '#a78bfa' : i % 3 === 1 ? '#ec4899' : '#fb923c',
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            boxShadow: `0 0 8px ${i % 3 === 0 ? '#a78bfa' : i % 3 === 1 ? '#ec4899' : '#fb923c'}`,
          }}
          animate={{
            y: [0, -100 - Math.random() * 100, 0],
            x: [0, Math.random() * 50 - 25, 0],
            opacity: [0, 0.8, 0],
          }}
          transition={{
            duration: 8 + Math.random() * 6,
            repeat: Infinity,
            delay: Math.random() * 5,
            ease: 'easeInOut',
          }}
        />
      ))}

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-md relative z-10"
      >
        {/* Логотип з glow */}
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{
            type: 'spring',
            stiffness: 200,
            damping: 15,
            delay: 0.2,
          }}
          className="flex justify-center mb-6"
        >
          <div className="relative">
            <motion.div
              animate={{
                scale: [1, 1.15, 1],
                opacity: [0.4, 0.7, 0.4],
              }}
              transition={{ duration: 3, repeat: Infinity }}
              className="absolute inset-0 rounded-full"
              style={{
                background:
                  'radial-gradient(circle, rgba(167,139,250,0.6) 0%, transparent 70%)',
                filter: 'blur(30px)',
              }}
            />
            <motion.div
              animate={{
                scale: [1, 1.08, 1],
                rotate: [0, 5, -5, 0],
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
              className="text-7xl relative"
            >
              🍎
            </motion.div>
          </div>
        </motion.div>

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
          {/* Gradient border верхній */}
          <div
            className="absolute top-0 left-0 right-0 h-px"
            style={{
              background:
                'linear-gradient(90deg, transparent, rgba(167,139,250,0.6), rgba(236,72,153,0.6), transparent)',
            }}
          />

          {/* Перемикач Вхід / Реєстрація */}
          <div className="relative flex gap-2 mb-4 p-1 rounded-2xl" style={{ background: 'rgba(255,255,255,0.03)' }}>
            {(['signin', 'signup'] as const).map((m) => {
              const active = mode === m;
              return (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMode(m)}
                  className="relative flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors z-10"
                  style={{ color: active ? '#fff' : 'rgba(255,255,255,0.5)' }}
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
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 }}
            className="relative group"
          >
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30 group-focus-within:text-purple-400 transition-colors" />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@example.com"
              className="w-full rounded-2xl pl-12 pr-4 py-4 text-sm transition-all"
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
              }}
            />
          </motion.div>

          {/* Password */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.7 }}
            className="relative group"
          >
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30 group-focus-within:text-purple-400 transition-colors" />
            <input
              type={showPassword ? 'text' : 'password'}
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Пароль (мін. 6)"
              className="w-full rounded-2xl pl-12 pr-12 py-4 text-sm transition-all"
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
              }}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </motion.div>

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
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full py-4 rounded-2xl font-semibold flex items-center justify-center gap-2 disabled:opacity-50 relative overflow-hidden group"
            style={{
              background: 'linear-gradient(135deg, #7c3aed, #ec4899)',
              boxShadow: '0 12px 40px rgba(124,58,237,0.4)',
            }}
          >
            {/* Shimmer ефект */}
            <motion.div
              className="absolute inset-0 pointer-events-none"
              initial={{ x: '-100%' }}
              animate={{ x: '100%' }}
              transition={{
                duration: 2,
                repeat: Infinity,
                repeatDelay: 3,
                ease: 'easeInOut',
              }}
              style={{
                background:
                  'linear-gradient(90deg, transparent, rgba(255,255,255,0.25), transparent)',
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

        {/* Нижній текст */}
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