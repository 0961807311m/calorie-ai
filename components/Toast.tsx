'use client';
import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X, AlertCircle, Info, Loader2 } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info' | 'loading';

export type Toast = {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
};

type ToastContainerProps = {
  toasts: Toast[];
  removeToast: (id: string) => void;
};

const typeConfig: Record<
  ToastType,
  { icon: any; color: string; bg: string; border: string }
> = {
  success: {
    icon: Check,
    color: 'text-emerald-400',
    bg: 'rgba(16,185,129,0.15)',
    border: 'rgba(16,185,129,0.4)',
  },
  error: {
    icon: AlertCircle,
    color: 'text-red-400',
    bg: 'rgba(239,68,68,0.15)',
    border: 'rgba(239,68,68,0.4)',
  },
  info: {
    icon: Info,
    color: 'text-cyan-400',
    bg: 'rgba(6,182,212,0.15)',
    border: 'rgba(6,182,212,0.4)',
  },
  loading: {
    icon: Loader2,
    color: 'text-purple-400',
    bg: 'rgba(167,139,250,0.15)',
    border: 'rgba(167,139,250,0.4)',
  },
};

export function ToastContainer({ toasts, removeToast }: ToastContainerProps) {
  return (
    <div
      className="fixed left-4 right-4 z-[99999] flex flex-col gap-2 pointer-events-none"
      style={{ top: 'calc(1rem + env(safe-area-inset-top))' }}
    >
      <AnimatePresence>
        {toasts.map((toast) => (
          <ToastItem
            key={toast.id}
            toast={toast}
            onClose={() => removeToast(toast.id)}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}

function ToastItem({ toast, onClose }: { toast: Toast; onClose: () => void }) {
  const config = typeConfig[toast.type];
  const Icon = config.icon;
  const isSpinner = toast.type === 'loading';

  useEffect(() => {
    if (isSpinner) return;
    const timer = setTimeout(onClose, toast.duration || 3000);
    return () => clearTimeout(timer);
  }, [toast, onClose, isSpinner]);

  return (
    <motion.div
      initial={{ opacity: 0, y: -30, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -30, scale: 0.9 }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      className="pointer-events-auto rounded-2xl px-4 py-3 flex items-center gap-3 shadow-2xl backdrop-blur-xl mx-auto"
      style={{
        background: config.bg,
        border: `1px solid ${config.border}`,
        maxWidth: 480,
        width: '100%',
      }}
    >
      <Icon
        className={`w-5 h-5 flex-shrink-0 ${config.color} ${
          isSpinner ? 'animate-spin' : ''
        }`}
      />
      <p className="text-sm font-medium text-white flex-1">{toast.message}</p>
      {!isSpinner && (
        <button
          onClick={onClose}
          className="p-1 text-white/50 hover:text-white transition flex-shrink-0"
          aria-label="Закрити"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </motion.div>
  );
}