'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Home, History, Settings, LogOut } from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/supabase';

export function BottomNav() {
  const path = usePathname();
  const router = useRouter();

  async function logout() {
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
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 glass px-2 py-2 flex gap-1 shadow-2xl"
      style={{ borderRadius: 999 }}
    >
      {items.map(({ href, icon: Icon, label }) => {
        const active = path === href;
        return (
          <Link
            key={href}
            href={href}
            className={`relative px-3 py-2.5 rounded-full flex items-center gap-1.5 ${
              active ? 'btn-grad' : ''
            }`}
          >
            <Icon className={`w-5 h-5 ${active ? 'text-white' : 'opacity-50'}`} />
            <span
              className={`text-xs ${
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