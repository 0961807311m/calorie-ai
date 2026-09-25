'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Menu,
  X,
  Trophy,
  Flame,
  Droplets,
  ChefHat,
} from 'lucide-react';
import { ChallengeCard } from './ChallengeCard';
import { CalorieHeatmap } from './CalorieHeatmap';
import { WaterTracker } from './WaterTracker';
import { RecipeGenerator } from './RecipeGenerator';

type Feature = 'challenges' | 'heatmap' | 'water' | 'recipes' | null;

export function FeatureMenu({ userId }: { userId: string }) {
  const [open, setOpen] = useState(false);
  const [feature, setFeature] = useState<Feature>(null);

  const items: { key: Feature; icon: any; label: string; color: string }[] = [
    {
      key: 'challenges',
      icon: Trophy,
      label: 'Челенджі',
      color: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
    },
    {
      key: 'heatmap',
      icon: Flame,
      label: 'Heatmap',
      color: 'linear-gradient(135deg, #ec4899, #f43f5e)',
    },
    {
      key: 'water',
      icon: Droplets,
      label: 'Вода',
      color: 'linear-gradient(135deg, #06b6d4, #3b82f6)',
    },
    {
      key: 'recipes',
      icon: ChefHat,
      label: 'Рецепти',
      color: 'linear-gradient(135deg, #10b981, #84cc16)',
    },
  ];

  return (
    <>
      {/* Кнопка-меню */}
      <button
        onClick={() => setOpen(true)}
        className="p-2.5 rounded-full shadow-lg hover:scale-105 transition-transform text-white"
        style={{ background: 'linear-gradient(135deg, #a78bfa, #ec4899)' }}
        title="Меню функцій"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Меню-модалка */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
              className="fixed inset-0 bg-black/70"
              style={{ zIndex: 9998 }}
            />

            <motion.div
              initial={{ opacity: 0, y: 50, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 50, scale: 0.95 }}
              transition={{ type: 'spring', duration: 0.5 }}
              className="fixed inset-x-4 top-20 z-50 rounded-3xl p-5 shadow-2xl"
              style={{
                zIndex: 9999,
                background: '#0d0d14',
                border: '1px solid rgba(255,255,255,0.1)',
              }}
            >
              <div className="flex items-center justify-between mb-5">
                <div>
                  <p className="font-bold text-lg text-white">Функції</p>
                  <p className="text-xs text-white/40">
                    Додаткові інструменти
                  </p>
                </div>
                <button
                  onClick={() => setOpen(false)}
                  className="p-2 hover:bg-white/10 rounded-full transition text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <motion.button
                      key={item.key}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => {
                        setOpen(false);
                        setTimeout(() => setFeature(item.key), 250);
                      }}
                      className="rounded-2xl p-4 flex flex-col items-center gap-2 transition-all"
                      style={{
                        background: 'rgba(255,255,255,0.06)',
                        border: '1px solid rgba(255,255,255,0.1)',
                      }}
                    >
                      <div
                        className="w-11 h-11 rounded-xl flex items-center justify-center"
                        style={{ background: item.color }}
                      >
                        <Icon className="w-5 h-5 text-white" />
                      </div>
                      <span className="text-xs font-semibold text-white">
                        {item.label}
                      </span>
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Контент фічі */}
      <AnimatePresence>
        {feature === 'challenges' && (
          <ChallengeCard
            key="ch"
            userId={userId}
            onClose={() => setFeature(null)}
          />
        )}
        {feature === 'heatmap' && (
          <CalorieHeatmap
            key="hm"
            userId={userId}
            onClose={() => setFeature(null)}
          />
        )}
        {feature === 'water' && (
          <WaterTracker
            key="wt"
            userId={userId}
            onClose={() => setFeature(null)}
          />
        )}
        {feature === 'recipes' && (
          <RecipeGenerator
            key="rc"
            userId={userId}
            onClose={() => setFeature(null)}
          />
        )}
      </AnimatePresence>
    </>
  );
}

// Спільний wrapper для модалок фіч
export function FeatureModal({
  title,
  icon: Icon,
  color,
  onClose,
  children,
}: {
  title: string;
  icon: any;
  color: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/80"
        style={{ zIndex: 10000 }}
      />
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 50 }}
        transition={{ type: 'spring', duration: 0.5 }}
        className="fixed inset-x-2 top-4 bottom-4 rounded-3xl flex flex-col overflow-hidden"
        style={{
          zIndex: 10001,
          background: '#0d0d14',
          border: '1px solid rgba(255,255,255,0.1)',
        }}
      >
        <div className="flex items-center justify-between p-4 border-b border-white/10 flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: color }}
            >
              <Icon className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="font-semibold text-white">{title}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-full transition text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4">{children}</div>
      </motion.div>
    </>
  );
}