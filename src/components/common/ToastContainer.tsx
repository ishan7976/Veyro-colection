import React from 'react';
import { useToast } from '../../context/ToastContext';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useToast();

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 max-w-md w-full pointer-events-none px-4 sm:px-0">
      <AnimatePresence>
        {toasts.map(toast => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, x: 50, scale: 0.9 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="pointer-events-auto bg-neutral-900/95 dark:bg-neutral-950/95 text-white border border-neutral-800 dark:border-neutral-800 backdrop-blur-md rounded-xl p-4 shadow-2xl flex items-center justify-between gap-3"
          >
            <div className="flex items-center gap-3 min-w-0">
              {toast.image ? (
                <img
                  src={toast.image}
                  alt={toast.title}
                  className="w-12 h-12 rounded-lg object-cover border border-neutral-800 flex-shrink-0"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="flex-shrink-0">
                  {toast.type === 'error' && <AlertCircle className="w-5 h-5 text-red-400" />}
                  {toast.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
                  {(!toast.type || toast.type === 'info') && <Info className="w-5 h-5 text-neutral-300" />}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-white tracking-wide truncate">{toast.title}</p>
                {toast.message && (
                  <p className="text-xs text-neutral-400 truncate mt-0.5">{toast.message}</p>
                )}
              </div>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="p-1.5 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-lg transition"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};
