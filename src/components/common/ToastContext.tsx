import React, { createContext, useContext, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { HiCheckCircle, HiExclamationCircle, HiInformationCircle, HiX } from 'react-icons/hi';

export type ToastType = 'success' | 'error' | 'info';

interface Toast {
  id: string;
  type: ToastType;
  message: string;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
  toast: {
    success: (msg: string) => void;
    error: (msg: string) => void;
    info: (msg: string) => void;
  };
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((message: string, type: ToastType = 'success') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      removeToast(id);
    }, 4000);
  }, [removeToast]);

  const toast = {
    success: (msg: string) => showToast(msg, 'success'),
    error: (msg: string) => showToast(msg, 'error'),
    info: (msg: string) => showToast(msg, 'info'),
  };

  return (
    <ToastContext.Provider value={{ showToast, toast }}>
      {children}
      {/* Toast Overlay Container via Portal */}
      {createPortal(
        <div className="fixed bottom-6 right-6 z-[999999] flex flex-col gap-2 max-w-sm w-full pointer-events-none px-4 sm:px-0">
          <AnimatePresence>
            {toasts.map((t) => (
              <motion.div
                key={t.id}
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className={`pointer-events-auto flex items-center justify-between gap-3 p-4 rounded-2xl shadow-2xl border backdrop-blur-xl ${
                  t.type === 'success'
                    ? 'bg-black/95 dark:bg-gray-900/95 border-gray-800 text-white'
                    : t.type === 'error'
                    ? 'bg-red-950/95 border-red-800 text-red-100'
                    : 'bg-gray-900/95 border-gray-700 text-gray-100'
                }`}
              >
                <div className="flex items-center gap-3">
                  {t.type === 'success' && <HiCheckCircle className="text-emerald-400 text-xl shrink-0" />}
                  {t.type === 'error' && <HiExclamationCircle className="text-red-400 text-xl shrink-0" />}
                  {t.type === 'info' && <HiInformationCircle className="text-blue-400 text-xl shrink-0" />}
                  <span className="font-inter text-xs sm:text-sm font-medium leading-snug">{t.message}</span>
                </div>
                <button
                  onClick={() => removeToast(t.id)}
                  className="p-1 hover:bg-white/10 rounded-lg transition-colors shrink-0"
                >
                  <HiX className="text-sm opacity-60 hover:opacity-100" />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>,
        document.body
      )}
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
