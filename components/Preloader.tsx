'use client';
import { motion } from 'framer-motion';

export function Preloader() {
  const letters = 'CalorieAI'.split('');

  return (
    <div
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center overflow-hidden"
      style={{ background: '#07070c' }}
    >
      {/* М'яке світіння на фоні */}
      <motion.div
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: [0, 0.4, 0.6, 0.4], scale: [0.5, 1, 1.2, 1] }}
        transition={{ duration: 5, times: [0, 0.3, 0.6, 1] }}
        className="absolute w-[500px] h-[500px] rounded-full pointer-events-none"
        style={{
          background:
            'radial-gradient(circle, rgba(236,72,153,0.25) 0%, rgba(167,139,250,0.15) 40%, transparent 70%)',
          filter: 'blur(60px)',
        }}
      />

      {/* Яблуко зі стрічкою */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="relative"
        style={{ width: 200, height: 200 }}
      >
        <svg
          width="200"
          height="200"
          viewBox="0 0 200 200"
          style={{ overflow: 'visible' }}
        >
          <defs>
            {/* Градієнт заливки яблука */}
            <radialGradient id="appleGrad" cx="40%" cy="35%" r="70%">
              <stop offset="0%" stopColor="#ec4899" />
              <stop offset="60%" stopColor="#a78bfa" />
              <stop offset="100%" stopColor="#7c3aed" />
            </radialGradient>

            {/* Градієнт стрічки */}
            <linearGradient id="tapeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#fbbf24" />
              <stop offset="100%" stopColor="#f59e0b" />
            </linearGradient>

            {/* Тінь */}
            <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            {/* Контур яблука для малювання */}
            <path
              id="applePath"
              d="M 100 55
                 C 100 40, 110 30, 120 25
                 C 115 35, 108 42, 100 48
                 C 90 35, 75 30, 60 35
                 C 35 45, 25 75, 30 105
                 C 35 140, 60 170, 85 170
                 C 95 170, 100 165, 100 165
                 C 100 165, 105 170, 115 170
                 C 140 170, 165 140, 170 105
                 C 175 75, 165 45, 140 35
                 C 125 30, 110 35, 100 48
                 Z"
              fill="none"
            />
          </defs>

          {/* Фаза 1: контур малюється */}
          <motion.use
            href="#applePath"
            stroke="#a78bfa"
            strokeWidth="2"
            strokeLinecap="round"
            strokeDasharray="0 1"
            initial={{ strokeDasharray: '0 1', opacity: 0 }}
            animate={{
              strokeDasharray: '1 0',
              opacity: [0, 1, 1, 0.6, 1, 1],
            }}
            transition={{
              strokeDasharray: { duration: 1.2, ease: 'easeInOut' },
              opacity: { duration: 4, times: [0, 0.1, 0.4, 0.6, 0.9, 1] },
            }}
            style={{ pathLength: 1 }}
          />

          {/* Фаза 3: заливка яблука (з'являється після контуру) */}
          <motion.path
            d="M 100 55
               C 100 40, 110 30, 120 25
               C 115 35, 108 42, 100 48
               C 90 35, 75 30, 60 35
               C 35 45, 25 75, 30 105
               C 35 140, 60 170, 85 170
               C 95 170, 100 165, 100 165
               C 100 165, 105 170, 115 170
               C 140 170, 165 140, 170 105
               C 175 75, 165 45, 140 35
               C 125 30, 110 35, 100 48
               Z"
            fill="url(#appleGrad)"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: [0, 0, 0.9, 1], scale: [0.9, 0.9, 1, 1] }}
            transition={{
              duration: 3,
              times: [0, 0.5, 0.75, 1],
              ease: 'easeOut',
            }}
            style={{ transformOrigin: '100px 100px', filter: 'drop-shadow(0 0 20px rgba(236,72,153,0.6))' }}
          />

          {/* Фаза 2: сантиметрова стрічка в'ється навколо яблука */}
          <motion.path
            d="M 100 55
               C 100 40, 110 30, 120 25
               C 115 35, 108 42, 100 48
               C 90 35, 75 30, 60 35
               C 35 45, 25 75, 30 105
               C 35 140, 60 170, 85 170
               C 95 170, 100 165, 100 165
               C 100 165, 105 170, 115 170
               C 140 170, 165 140, 170 105
               C 175 75, 165 45, 140 35
               C 125 30, 110 35, 100 48
               Z"
            fill="none"
            stroke="url(#tapeGrad)"
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray="1 0"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: [0, 0, 1, 1, 0] }}
            transition={{
              pathLength: { duration: 1.5, delay: 1.2, ease: 'easeInOut' },
              opacity: { duration: 3, times: [0, 0.4, 0.5, 0.9, 1] },
            }}
            style={{ filter: 'drop-shadow(0 0 6px rgba(251,191,36,0.8))' }}
          />

          {/* Поділки на стрічці — маленькі штрихи */}
          {[...Array(24)].map((_, i) => {
            const angle = (i / 24) * 360;
            const rad = (angle * Math.PI) / 180;
            const cx = 100 + Math.cos(rad) * 68;
            const cy = 100 + Math.sin(rad) * 68;
            return (
              <motion.circle
                key={i}
                cx={cx}
                cy={cy}
                r="1.5"
                fill="#fef3c7"
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: [0, 0, 1, 1, 0], scale: [0, 0, 1, 1, 0] }}
                transition={{
                  duration: 3,
                  delay: 1.2 + (i / 24) * 1.5,
                  times: [0, 0.4, 0.5, 0.9, 1],
                }}
              />
            );
          })}

          {/* Пульсуючий пульс при завершенні */}
          <motion.circle
            cx="100"
            cy="100"
            r="80"
            fill="none"
            stroke="#ec4899"
            strokeWidth="2"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: [0, 0, 0, 0.6, 0], scale: [0.5, 0.5, 0.5, 1.3, 1.6] }}
            transition={{ duration: 3.5, times: [0, 0.5, 0.75, 0.9, 1] }}
            style={{ transformOrigin: '100px 100px' }}
          />
        </svg>
      </motion.div>

      {/* Фаза 4: друкування тексту */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2.8, duration: 0.3 }}
        className="mt-8 text-center"
      >
        <div className="flex justify-center items-baseline">
          {letters.map((letter, i) => (
            <motion.span
              key={i}
              initial={{ opacity: 0, y: 10, filter: 'blur(8px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              transition={{
                delay: 2.8 + i * 0.1,
                duration: 0.4,
                ease: 'easeOut',
              }}
              className="text-3xl font-bold gradient-text"
              style={{ display: 'inline-block' }}
            >
              {letter}
            </motion.span>
          ))}
        </div>

        {/* Підзаголовок */}
        <motion.p
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 4.2, duration: 0.6 }}
          className="text-xs text-white/40 mt-2 tracking-widest uppercase"
        >
          Розумний щоденник калорій
        </motion.p>
      </motion.div>

      {/* Фаза 5: плавне зникнення всього екрану */}
      <motion.div
        initial={{ opacity: 1 }}
        animate={{ opacity: 0 }}
        transition={{ delay: 4.8, duration: 0.5 }}
        className="absolute inset-0 pointer-events-none"
        style={{ background: '#07070c' }}
      />
    </div>
  );
}