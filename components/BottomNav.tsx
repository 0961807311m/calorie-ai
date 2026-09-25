'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Home, History, Settings, LogOut } from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { tapLight } from '@/lib/haptics';

export function BottomNav() {
  const path = usePathname();
  const router = useRouter();

  async function logout() {
    tapLight();
    await supabase.auth.signOut();
    router.push('/auth');
    router.refresh();
  }

  const items = [
    { href: '/dashboard', icon: Home, label: 'День' },
    { href: '/history', icon: History, label: 'Історія' },
    { href: '/settings', icon: Settings, label: 'Ще' },
  ];

  return (
    <motion.nav
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{
        type: 'spring',
        stiffness: 300,
        damping: 25,
        delay: 0.2,
      }}
      className="fixed left-1/2 -translate-x-1/2 z-50 glass px-2 py-2 flex gap-1 shadow-2xl"
      style={{
        bottom: 'calc(1rem + env(safe-area-inset-bottom))',
        borderRadius: 999,
      }}
    >
      {items.map(({ href, icon: Icon, label }) => {
        const active = path === href;
        return (
          <Link
            key={href}
            href={href}
            onClick={() => tapLight()}
            className={`relative px-3 py-2.5 rounded-full flex items-center gap-1.5 transition-colors ${
              active ? 'btn-grad' : ''
            }`}
          >
            <Icon
              className={`w-5 h-5 transition-transform ${
                active ? 'text-white scale-110' : 'opacity-50'
              }`}
            />
            <span
              className={`text-xs transition-all ${
                active ? 'text-white font-medium' : 'opacity-50'
              }`}
            >
              {label}
            </span>
          </Link>
        );
      })}
      <button
        onClick={logout}
        className="px-3 py-2.5 rounded-full flex items-center gap-1.5 hover:bg-white/5 transition"
      >
        <LogOut className="w-5 h-5 opacity-50" />
      </button>
    </motion.nav>
  );
}