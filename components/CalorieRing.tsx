'use client';
import { motion } from 'framer-motion';

export function CalorieRing({
  eaten,
  norm,
  size = 220,
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

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <defs>
          <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#a78bfa" />
            <stop offset="50%" stopColor="#ec4899" />
            <stop offset="100%" stopColor="#fb923c" />
          </linearGradient>
        </defs>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke="rgba(255,255,255,0.06)"
          strokeWidth={stroke}
          fill="none"
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke="url(#ringGrad)"
          strokeWidth={stroke}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: c * (1 - pct) }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
          style={{ filter: 'drop-shadow(0 0 12px rgba(236,72,153,0.6))' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <p className="text-4xl font-bold gradient-text">{eaten}</p>
        <p className="text-white/40 text-sm">/ {norm} ккал</p>
        <p
          className={`text-xs mt-2 font-medium ${
            left < 0 ? 'text-red-400' : 'text-emerald-400'
          }`}
        >
          {left >= 0 ? `${left} залишилось` : `${Math.abs(left)} перебір`}
        </p>
      </div>
    </div>
  );
}