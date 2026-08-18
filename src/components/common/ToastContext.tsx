import React, { createContext, useContext, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { HiCheckCircle, HiExclamationCircle, HiInformationCircle, HiX, HiReply } from 'react-icons/hi';

export type ToastType = 'success' | 'error' | 'info';

export interface ToastAction {
  label: string;
  onClick: () => void | Promise<void>;
}

interface Toast {
  id: string;
  type: ToastType;
  message: string;
  action?: ToastAction;
  duration?: number;
}

interface ToastOptions {
  type?: ToastType;
  action?: ToastAction;
  duration?: number;
}

interface ToastContextType {
  showToast: (message: string, options?: ToastType | ToastOptions) => void;
  toast: {
    success: (msg: string, action?: ToastAction) => void;
    error: (msg: string) => void;
    info: (msg: string, action?: ToastAction) => void;
    undoable: (msg: string, onUndo: () => void | Promise<void>, duration?: number) => void;
  };
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((message: string, options?: ToastType | ToastOptions) => {
    const id = Math.random().toString(36).substring(2, 9);
    let type: ToastType = 'success';
    let action: ToastAction | undefined;
    let duration = 4000;

    if (typeof options === 'string') {
      type = options;
    } else if (options) {
      if (options.type) type = options.type;
      if (options.action) action = options.action;
      if (options.duration) duration = options.duration;
    }

    // If an action is present (like Undo), default duration to 6 seconds for comfortable interaction
    if (action && (!options || typeof options === 'string' || !options.duration)) {
      duration = 6000;
    }

    setToasts((prev) => [...prev, { id, type, message, action, duration }]);

    setTimeout(() => {
      removeToast(id);
    }, duration);
  }, [removeToast]);

  const toast = {
    success: (msg: string, action?: ToastAction) => showToast(msg, { type: 'success', action }),
    error: (msg: string) => showToast(msg, 'error'),
    info: (msg: string, action?: ToastAction) => showToast(msg, { type: 'info', action }),
    undoable: (msg: string, onUndo: () => void | Promise<void>, duration = 6500) => {
      showToast(msg, {
        type: 'success',
        duration,
        action: {
          label: 'Deshacer',
          onClick: onUndo,
        },
      });
    },
  };

  return (
    <ToastContext.Provider value={{ showToast, toast }}>
      {children}
      {/* Toast Overlay Container via Portal */}
      {createPortal(
        <div className="fixed bottom-6 right-6 z-[999999] flex flex-col gap-2.5 max-w-sm sm:max-w-md w-full pointer-events-none px-4 sm:px-0">
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
                    ? 'bg-black/95 dark:bg-gray-900/95 border-gray-800 text-white shadow-emerald-950/20'
                    : t.type === 'error'
                    ? 'bg-red-950/95 border-red-800 text-red-100'
                    : 'bg-gray-900/95 border-gray-700 text-gray-100'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  {t.type === 'success' && <HiCheckCircle className="text-emerald-400 text-xl shrink-0" />}
                  {t.type === 'error' && <HiExclamationCircle className="text-red-400 text-xl shrink-0" />}
                  {t.type === 'info' && <HiInformationCircle className="text-blue-400 text-xl shrink-0" />}
                  <span className="font-inter text-xs sm:text-sm font-medium leading-snug truncate sm:whitespace-normal">
                    {t.message}
                  </span>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {t.action && (
                    <button
                      onClick={async (e) => {
                        e.stopPropagation();
                        removeToast(t.id);
                        try {
                          await t.action?.onClick();
                        } catch (err) {
                          console.error('Error al deshacer:', err);
                        }
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-white/15 hover:bg-white/25 active:bg-white/30 text-amber-300 hover:text-amber-200 rounded-xl font-syne text-xs font-bold uppercase tracking-wider transition-all border border-white/10 shadow-sm"
                    >
                      <HiReply className="text-xs shrink-0" />
                      <span>{t.action.label}</span>
                    </button>
                  )}
                  <button
                    onClick={() => removeToast(t.id)}
                    className="p-1 hover:bg-white/10 rounded-lg transition-colors shrink-0 text-gray-400 hover:text-white"
                  >
                    <HiX className="text-sm opacity-60 hover:opacity-100" />
                  </button>
                </div>
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

