"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { AnimatePresence, motion } from "motion/react";
import { CheckCircle2, Info, AlertTriangle, X } from "lucide-react";
import { cn } from "@/lib/cn";

type ToastTone = "success" | "info" | "warning" | "error";

type ToastItem = {
  id: string;
  title: string;
  description?: string;
  tone: ToastTone;
};

type ToastCtx = {
  toast: (input: Omit<ToastItem, "id"> & { tone?: ToastTone }) => void;
};

const ToastContext = createContext<ToastCtx | null>(null);

const icons = {
  success: CheckCircle2,
  info: Info,
  warning: AlertTriangle,
  error: AlertTriangle,
};

const tones: Record<ToastTone, string> = {
  success: "border-success/20 bg-white text-success",
  info: "border-cocoa/10 bg-white text-cocoa",
  warning: "border-warning/25 bg-white text-warning",
  error: "border-red-200 bg-white text-red-800",
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);

  const toast = useCallback(
    (input: Omit<ToastItem, "id"> & { tone?: ToastTone }) => {
      const id = crypto.randomUUID();
      setItems((prev) => [
        ...prev,
        { id, title: input.title, description: input.description, tone: input.tone ?? "info" },
      ]);
      window.setTimeout(() => {
        setItems((prev) => prev.filter((t) => t.id !== id));
      }, 3800);
    },
    [],
  );

  const value = useMemo(() => ({ toast }), [toast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        className="pointer-events-none fixed bottom-4 right-4 z-[60] flex w-[min(100%-2rem,22rem)] flex-col gap-2"
        aria-live="polite"
      >
        <AnimatePresence>
          {items.map((item) => {
            const Icon = icons[item.tone];
            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 12, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8 }}
                className={cn(
                  "pointer-events-auto flex gap-3 rounded-lg border p-3.5 shadow-lg shadow-cocoa/10",
                  tones[item.tone],
                )}
              >
                <Icon className="mt-0.5 h-5 w-5 shrink-0" aria-hidden />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-cocoa">{item.title}</p>
                  {item.description && (
                    <p className="mt-0.5 text-xs text-cocoa-soft/75">{item.description}</p>
                  )}
                </div>
                <button
                  type="button"
                  className="rounded-lg p-1 text-cocoa-soft/60 hover:bg-cocoa/5"
                  onClick={() => setItems((prev) => prev.filter((t) => t.id !== item.id))}
                  aria-label="Dispensar"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
