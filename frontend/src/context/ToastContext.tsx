import React, { createContext, useContext, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info';

export interface ToastAction {
  label: string;
  url?: string;
  onClick?: () => void;
}

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
  action?: ToastAction;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType, action?: ToastAction) => void;
  success: (message: string, action?: ToastAction) => void;
  error: (message: string, action?: ToastAction) => void;
  info: (message: string, action?: ToastAction) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (message: string, type: ToastType = 'success', action?: ToastAction) => {
      const id = Math.random().toString(36).substring(2, 9);
      setToasts((prev) => [...prev, { id, message, type, action }]);
      setTimeout(() => {
        removeToast(id);
      }, 4000);
    },
    [removeToast]
  );

  const success = useCallback(
    (msg: string, action?: ToastAction) => showToast(msg, 'success', action),
    [showToast]
  );
  const error = useCallback(
    (msg: string, action?: ToastAction) => showToast(msg, 'error', action),
    [showToast]
  );
  const info = useCallback(
    (msg: string, action?: ToastAction) => showToast(msg, 'info', action),
    [showToast]
  );

  return (
    <ToastContext.Provider value={{ showToast, success, error, info }}>
      {children}
      {/* Toast Container */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 max-w-md pointer-events-none">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="pointer-events-auto flex items-center gap-3 px-4 py-3.5 bg-[#FFFFFF] border border-[#E7DFD7] rounded-xl shadow-lg shadow-[#3D2E24]/5 text-[#3D2E24]"
            >
              {toast.type === 'success' && (
                <CheckCircle2 className="w-5 h-5 text-[#8FA57D] flex-shrink-0" />
              )}
              {toast.type === 'error' && (
                <AlertCircle className="w-5 h-5 text-[#C96A6A] flex-shrink-0" />
              )}
              {toast.type === 'info' && (
                <Info className="w-5 h-5 text-[#C6A15B] flex-shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium font-sans leading-snug">{toast.message}</p>
              </div>
              {toast.action && (
                toast.action.url ? (
                  <Link
                    to={toast.action.url}
                    onClick={() => removeToast(toast.id)}
                    className="text-xs font-bold uppercase tracking-wider text-[#5A4335] bg-[#EADCCF]/70 hover:bg-[#5A4335] hover:text-white px-3 py-1.5 rounded-lg transition-colors flex-shrink-0 shadow-2xs whitespace-nowrap"
                  >
                    {toast.action.label}
                  </Link>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      toast.action?.onClick?.();
                      removeToast(toast.id);
                    }}
                    className="text-xs font-bold uppercase tracking-wider text-[#5A4335] bg-[#EADCCF]/70 hover:bg-[#5A4335] hover:text-white px-3 py-1.5 rounded-lg transition-colors flex-shrink-0 shadow-2xs whitespace-nowrap"
                  >
                    {toast.action.label}
                  </button>
                )
              )}
              <button
                onClick={() => removeToast(toast.id)}
                className="text-[#7B6656] hover:text-[#3D2E24] p-1 rounded-md transition-colors flex-shrink-0"
                aria-label="Close notification"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastContextType => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
