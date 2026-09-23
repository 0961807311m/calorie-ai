'use client';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export function PointsCounter({ userId }: { userId: string }) {
  const [points, setPoints] = useState(0);
  const [animated, setAnimated] = useState(0);
  const [showBubble, setShowBubble] = useState(false);
  const [lastPoints, setLastPoints] = useState(0);

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
    <div className="relative flex items-center gap-3">
      {/* Мотиваційний текст */}
      <div className="text-right hidden sm:block">
        <p
          className="text-[11px] font-medium tracking-wide"
          style={{
            background: 'linear-gradient(90deg, #fbbf24, #fb923c)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          Збирай бали
        </p>
        <p className="text-[10px] text-white/40 tracking-wide">
          міняй на $
        </p>
      </div>

      {/* Плашка з балами */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="flex items-center gap-2 px-3 py-1.5 rounded-full"
        style={{
          background:
            'linear-gradient(135deg, rgba(251,191,36,0.15), rgba(251,146,60,0.15))',
          border: '1px solid rgba(251,191,36,0.3)',
        }}
      >
        <motion.div
          animate={{ rotate: [0, 10, -10, 0] }}
          transition={{ duration: 3, repeat: Infinity, repeatDelay: 2 }}
        >
          <Sparkles className="w-3.5 h-3.5 text-yellow-400" />
        </motion.div>
        <div className="flex items-baseline gap-1">
          <motion.span
            key={animated}
            initial={{ y: -10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="text-base font-bold text-yellow-400 tabular-nums"
          >
            {animated}
          </motion.span>
          <span className="text-[10px] text-white/50">балів</span>
        </div>
      </motion.div>

      {/* Спливаючий +1 */}
      <AnimatePresence>
        {showBubble && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.5 }}
            animate={{ opacity: 1, y: -40, scale: 1 }}
            exit={{ opacity: 0, y: -60 }}
            transition={{ duration: 1.5 }}
            className="absolute -top-2 right-0 whitespace-nowrap px-3 py-1 rounded-full font-bold text-white text-sm pointer-events-none"
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