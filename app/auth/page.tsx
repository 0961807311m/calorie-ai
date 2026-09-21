'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { motion } from 'framer-motion';
import { Mail, Lock, Loader2 } from 'lucide-react';

export default function AuthPage() {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ text: string; type: 'error' | 'success' } | null>(null);
  const router = useRouter();

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
    <main className="min-h-screen flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <div className="text-6xl mb-3">🍎</div>
          <h1 className="text-4xl font-bold gradient-text mb-2">CalorieAI</h1>
          <p className="text-white/60">Розумний щоденник калорій з ШІ</p>
        </div>

        <form onSubmit={submit} className="glass p-6 space-y-4 glow">
          <div className="flex gap-2 mb-4">
            {(['signin', 'signup'] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMode(m)}
                className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  mode === m ? 'btn-grad' : 'bg-white/5 text-white/60 hover:bg-white/10'
                }`}
              >
                {m === 'signin' ? 'Вхід' : 'Реєстрація'}
              </button>
            ))}
          </div>

          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@example.com"
              className="w-full rounded-xl pl-11 pr-4 py-3.5"
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Пароль (мін. 6)"
              className="w-full rounded-xl pl-11 pr-4 py-3.5"
            />
          </div>

          {msg && (
            <div
              className={`text-sm p-3 rounded-xl ${
                msg.type === 'error'
                  ? 'bg-red-500/10 text-red-300 border border-red-400/30'
                  : 'bg-emerald-500/10 text-emerald-300 border border-emerald-400/30'
              }`}
            >
              {msg.text}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn-grad w-full py-3.5 rounded-xl font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading && <Loader2 className="w-5 h-5 animate-spin" />}
            {mode === 'signin' ? 'Увійти' : 'Створити акаунт'}
          </button>
        </form>
      </motion.div>
    </main>
  );
}