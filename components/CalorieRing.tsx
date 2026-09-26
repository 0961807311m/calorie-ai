'use client';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

export function CalorieRing({
  eaten,
  norm,
  size = 190,
}: {
  eaten: number;
  norm: number;
  size?: number;
}) {
  const stroke = 14;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.min(1, eaten / norm);
  const left = norm - eaten;
  const [count, setCount] = useState(0);
  const isOver = left < 0;
  const isComplete = pct >= 0.95 && pct <= 1.05;

  // Анімація counter
  useEffect(() => {
    let start = 0;
    const duration = 1200;
    const step = eaten / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= eaten) {
        setCount(eaten);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 16);
    return () => clearInterval(timer);
  }, [eaten]);

  return (
    <div className="relative" style={{ width: size, height: size }}>
      {/* Glow pulse навколо кільця */}
      <motion.div
        className="absolute inset-0 rounded-full"
        animate={{
          opacity: isComplete ? [0.3, 0.7, 0.3] : [0.15, 0.3, 0.15],
        }}
        transition={{ duration: isComplete ? 1.5 : 3, repeat: Infinity }}
        style={{
          background: isOver
            ? 'radial-gradient(circle, rgba(239,68,68,0.4) 0%, transparent 70%)'
            : isComplete
            ? 'radial-gradient(circle, rgba(16,185,129,0.5) 0%, transparent 70%)'
            : 'radial-gradient(circle, rgba(167,139,250,0.35) 0%, transparent 70%)',
          filter: 'blur(20px)',
        }}
      />

      <svg width={size} height={size} className="-rotate-90 relative">
        <defs>
          <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#a78bfa" />
            <stop offset="50%" stopColor="#ec4899" />
            <stop offset="100%" stopColor="#fb923c" />
          </linearGradient>
          <linearGradient id="ringGradOver" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ef4444" />
            <stop offset="100%" stopColor="#f97316" />
          </linearGradient>
          <linearGradient id="ringGradComplete" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#10b981" />
            <stop offset="100%" stopColor="#34d399" />
          </linearGradient>
        </defs>

        {/* Фонове кільце */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke="rgba(255,255,255,0.06)"
          strokeWidth={stroke}
          fill="none"
        />

        {/* Прогрес */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={
            isOver
              ? 'url(#ringGradOver)'
              : isComplete
              ? 'url(#ringGradComplete)'
              : 'url(#ringGrad)'
          }
          strokeWidth={stroke}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: c * (1 - pct) }}
          transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1] }}
          style={{
            filter: `drop-shadow(0 0 12px ${
              isOver
                ? 'rgba(239,68,68,0.7)'
                : isComplete
                ? 'rgba(16,185,129,0.7)'
                : 'rgba(236,72,153,0.6)'
            })`,
          }}
        />
      </svg>

      {/* Центральний контент */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.3, type: 'spring', stiffness: 300 }}
          className="text-center"
        >
          <div className="flex items-baseline justify-center gap-0.5">
            <motion.span
              key={count}
              className="text-4xl font-bold gradient-text tabular-nums"
              style={{ letterSpacing: '-0.02em' }}
            >
              {count}
            </motion.span>
            <span className="text-xs text-white/30 ml-1">ккал</span>
          </div>
          <p className="text-[11px] text-white/40 mt-0.5">з {norm}</p>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className={`text-xs mt-2 font-medium flex items-center gap-1 justify-center ${
              isOver ? 'text-red-400' : isComplete ? 'text-emerald-400' : 'text-purple-300'
            }`}
          >
            {isComplete && '🎉 '}
            {left >= 0 ? `${left} залишилось` : `${Math.abs(left)} перебір`}
          </motion.p>
        </motion.div>
      </div>

      {/* Sparkles при 100% */}
      {isComplete && (
        <>
          {[...Array(8)].map((_, i) => {
            const angle = (i / 8) * 360;
            const rad = (angle * Math.PI) / 180;
            return (
              <motion.div
                key={i}
                className="absolute w-1.5 h-1.5 rounded-full pointer-events-none"
                style={{
                  background: '#10b981',
                  boxShadow: '0 0 8px #10b981',
                  left: '50%',
                  top: '50%',
                }}
                animate={{
                  x: [0, Math.cos(rad) * 100],
                  y: [0, Math.sin(rad) * 100],
                  opacity: [1, 0],
                  scale: [1, 0.3],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  delay: i * 0.15,
                  ease: 'easeOut',
                }}
              />
            );
          })}
        </>
      )}
    </div>
  );
}