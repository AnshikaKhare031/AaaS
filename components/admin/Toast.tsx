"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import { X, CheckCircle, AlertCircle, Info } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

type ToastType = "success" | "error" | "info";

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: ToastType = "success") => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);

    // Auto remove after 4 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 max-w-sm w-full">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 16, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -16, scale: 0.98, transition: { duration: 0.2 } }}
              className={`p-4 border rounded-xl flex items-start gap-3 shadow-md transition-all bg-[#FFF9F2] ${
                toast.type === "success"
                  ? "border-[#52734D]/40 text-[#541B1B]"
                  : toast.type === "error"
                  ? "border-[#A83232]/50 text-[#541B1B]"
                  : "border-[#B58A58]/50 text-[#541B1B]"
              }`}
            >
              {toast.type === "success" && <CheckCircle size={16} className="shrink-0 mt-0.5 text-[#52734D]" />}
              {toast.type === "error" && <AlertCircle size={16} className="shrink-0 mt-0.5 text-[#A83232]" />}
              {toast.type === "info" && <Info size={16} className="shrink-0 mt-0.5 text-[#B58A58]" />}
              
              <div className="flex-grow text-xs font-sans font-medium text-[#541B1B] leading-relaxed">
                {toast.message}
              </div>
              
              <button
                onClick={() => removeToast(toast.id)}
                className="text-[#8B454B] hover:text-[#541B1B] transition-colors cursor-pointer"
              >
                <X size={14} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}
