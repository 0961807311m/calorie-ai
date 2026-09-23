'use client';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, TrendingUp } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export function PointsCounter({ userId }: { userId: string }) {
  const [points, setPoints] = useState(0);
  const [animated, setAnimated] = useState(0);
  const [showBubble, setShowBubble] = useState(false);
  const [lastPoints, setLastPoints] = useState(0);

  // Анімація лічби від 0 до поточного значення
  useEffect(() => {
    let start = 0;
    const end = points;
    if (end === 0) {
      setAnimated(0);
      return;
    }

    const duration = 1500;
    const step = end / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= end) {
        setAnimated(end);
        clearInterval(timer);
      } else {
        setAnimated(Math.floor(start));
      }
    }, 16);

    return () => clearInterval(timer);
  }, [points]);

  // Завантаження балів + real-time оновлення
  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('profiles')
        .select('points')
        .eq('id', userId)
        .single();
      if (data) {
        setLastPoints(data.points || 0);
        setPoints(data.points || 0);
      }
    }
    load();

    // Real-time підписка на зміни балів
    const channel = supabase
      .channel('points-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${userId}`,
        },
        (payload: any) => {
          const newPoints = payload.new.points || 0;
          if (newPoints > lastPoints) {
            setShowBubble(true);
            setTimeout(() => setShowBubble(false), 2500);
          }
          setPoints(newPoints);
          setLastPoints(newPoints);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, lastPoints]);

  return (
    <div className="relative">
      {/* Основна плашка балів */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="flex items-center gap-2 px-3 py-2 rounded-full"
        style={{
          background: 'linear-gradient(135deg, rgba(251,191,36,0.15), rgba(251,146,60,0.15))',
          border: '1px solid rgba(251,191,36,0.3)',
        }}
      >
        <motion.div
          animate={{ rotate: [0, 10, -10, 0] }}
          transition={{ duration: 3, repeat: Infinity, repeatDelay: 2 }}
        >
          <Sparkles className="w-4 h-4 text-yellow-400" />
        </motion.div>
        <div className="flex items-baseline gap-1">
          <motion.span
            key={animated}
            initial={{ y: -10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="text-lg font-bold text-yellow-400 tabular-nums"
          >
            {animated}
          </motion.span>
          <span className="text-xs text-white/50">балів</span>
        </div>
      </motion.div>

      {/* Спливаючий бульбашка +1 */}
      <AnimatePresence>
        {showBubble && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.5 }}
            animate={{ opacity: 1, y: -40, scale: 1 }}
            exit={{ opacity: 0, y: -60 }}
            transition={{ duration: 1.5 }}
            className="absolute -top-2 left-1/2 -translate-x-1/2 whitespace-nowrap px-3 py-1 rounded-full font-bold text-white text-sm"
            style={{
              background: 'linear-gradient(135deg, #fbbf24, #fb923c)',
              boxShadow: '0 0 20px rgba(251, 191, 36, 0.6)',
            }}
          >
            +1 🎉
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}