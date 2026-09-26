'use client';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { Beef, Droplets, Wheat } from 'lucide-react';

export function MacroBar({
  label,
  current,
  target,
  color,
}: {
  label: string;
  current: number;
  target: number;
  color: string;
}) {
  const pct = Math.min(100, (current / target) * 100);
  const [displayValue, setDisplayValue] = useState(0);
  const isComplete = pct >= 95 && pct <= 105;
  const isOver = pct > 105;

  // Анімація counter
  useEffect(() => {
    let start = 0;
    const duration = 800;
    const step = current / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= current) {
        setDisplayValue(current);
        clearInterval(timer);
      } else {
        setDisplayValue(Math.floor(start));
      }
    }, 16);
    return () => clearInterval(timer);
  }, [current]);

  // Іконка залежно від label
  const Icon =
    label === 'Білки' ? Beef : label === 'Жири' ? Droplets : Wheat;

  return (
    <div className="group">
      <div className="flex items-center justify-between text-xs mb-2">
        <div className="flex items-center gap-2">
          <motion.div
            whileHover={{ scale: 1.2, rotate: 10 }}
            className="w-6 h-6 rounded-lg flex items-center justify-center"
            style={{
              background: `${color}20`,
              border: `1px solid ${color}40`,
            }}
          >
            <Icon className="w-3.5 h-3.5" style={{ color }} />
          </motion.div>
          <span className="text-white/70 font-medium">{label}</span>
        </div>
        <div className="flex items-baseline gap-1">
          <span
            className="font-bold tabular-nums"
            style={{ color: isOver ? '#ef4444' : isComplete ? '#10b981' : color }}
          >
            {displayValue}
          </span>
          <span className="text-white/30 text-[10px]">/ {target}г</span>
          {isComplete && <span className="text-xs ml-1">✓</span>}
        </div>
      </div>

      <div className="relative h-2.5 bg-white/5 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 1, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
          className="h-full rounded-full relative overflow-hidden"
          style={{
            background: isOver
              ? 'linear-gradient(90deg, #ef4444, #f97316)'
              : isComplete
              ? 'linear-gradient(90deg, #10b981, #34d399)'
              : `linear-gradient(90deg, ${color}, ${color}cc)`,
            boxShadow: `0 0 12px ${isOver ? '#ef4444' : isComplete ? '#10b981' : color}80`,
          }}
        >
          {/* Shine ефект */}
          <motion.div
            className="absolute inset-0"
            initial={{ x: '-100%' }}
            animate={{ x: '200%' }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              repeatDelay: 4,
              ease: 'easeInOut',
            }}
            style={{
              background:
                'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)',
              width: '50%',
            }}
          />
        </motion.div>
      </div>
    </div>
  );
}