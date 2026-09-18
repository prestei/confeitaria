"use client";

import { AnimatePresence, motion } from "motion/react";
import { X } from "lucide-react";
import { cn } from "@/lib/cn";
import { motionPresets } from "@/lib/animations/presets";
import { useReducedMotion } from "@/hooks/use-reduced-motion";

export function Drawer({
  open,
  onClose,
  title,
  children,
  side = "right",
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  side?: "right" | "bottom";
}) {
  const reduced = useReducedMotion();
  const isBottom = side === "bottom";

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50">
          <motion.button
            type="button"
            aria-label="Fechar"
            className="absolute inset-0 bg-cocoa/40"
            onClick={onClose}
            initial={reduced ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
          <motion.aside
            role="dialog"
            aria-modal="true"
            aria-label={title}
            className={cn(
              "absolute flex flex-col bg-cream shadow-2xl shadow-cocoa/25",
              isBottom
                ? "inset-x-0 bottom-0 max-h-[88vh] rounded-t-3xl"
                : "inset-y-0 right-0 h-full w-full max-w-md border-l border-cocoa/8",
            )}
            initial={
              reduced
                ? false
                : isBottom
                  ? { y: "100%" }
                  : { x: "100%" }
            }
            animate={isBottom ? { y: 0 } : { x: 0 }}
            exit={isBottom ? { y: "100%" } : { x: "100%" }}
            transition={
              reduced
                ? { duration: 0 }
                : motionPresets.drawer.transition
            }
          >
            <div className="flex items-center justify-between border-b border-cocoa/6 px-5 py-4">
              {title ? (
                <h2 className="font-display text-xl text-cocoa">{title}</h2>
              ) : (
                <span />
              )}
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl p-2 text-cocoa-soft hover:bg-cocoa/5"
                aria-label="Fechar"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  );
}
