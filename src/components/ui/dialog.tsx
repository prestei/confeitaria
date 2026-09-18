"use client";

import {
  createContext,
  useCallback,
  useContext,
  useId,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { AnimatePresence, motion } from "motion/react";
import { X } from "lucide-react";
import { cn } from "@/lib/cn";
import { motionPresets } from "@/lib/animations/presets";
import { useReducedMotion } from "@/hooks/use-reduced-motion";

type DialogCtx = {
  open: boolean;
  setOpen: (v: boolean) => void;
  titleId: string;
};

const DialogContext = createContext<DialogCtx | null>(null);

export function Dialog({
  open: controlledOpen,
  onOpenChange,
  children,
}: {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: ReactNode;
}) {
  const [uncontrolled, setUncontrolled] = useState(false);
  const open = controlledOpen ?? uncontrolled;
  const setOpen = onOpenChange ?? setUncontrolled;
  const titleId = useId();

  const value = useMemo(() => ({ open, setOpen, titleId }), [open, setOpen, titleId]);

  return <DialogContext.Provider value={value}>{children}</DialogContext.Provider>;
}

function useDialog() {
  const ctx = useContext(DialogContext);
  if (!ctx) throw new Error("Dialog components must be used within Dialog");
  return ctx;
}

export function DialogTrigger({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const { setOpen } = useDialog();
  return (
    <button type="button" className={className} onClick={() => setOpen(true)}>
      {children}
    </button>
  );
}

export function DialogContent({
  children,
  className,
  size = "md",
}: {
  children: ReactNode;
  className?: string;
  size?: "sm" | "md" | "lg";
}) {
  const { open, setOpen, titleId } = useDialog();
  const reduced = useReducedMotion();
  const sizes = { sm: "max-w-md", md: "max-w-lg", lg: "max-w-2xl" };

  const close = useCallback(() => setOpen(false), [setOpen]);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center">
          <motion.button
            type="button"
            aria-label="Fechar"
            className="absolute inset-0 bg-cocoa/40 backdrop-blur-[2px]"
            onClick={close}
            {...(reduced ? {} : motionPresets.modal.overlay)}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            className={cn(
              "relative z-10 w-full overflow-hidden rounded-3xl border border-cocoa/8 bg-cream shadow-2xl shadow-cocoa/20",
              sizes[size],
              className,
            )}
            {...(reduced ? {} : motionPresets.modal.content)}
          >
            <button
              type="button"
              onClick={close}
              className="absolute right-4 top-4 rounded-xl p-2 text-cocoa-soft hover:bg-cocoa/5"
              aria-label="Fechar diálogo"
            >
              <X className="h-4 w-4" />
            </button>
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

export function DialogHeader({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  const { titleId } = useDialog();
  return (
    <div className="border-b border-cocoa/6 px-6 py-5 pr-12">
      <h2 id={titleId} className="font-display text-2xl text-cocoa">
        {title}
      </h2>
      {description && (
        <p className="mt-1 text-sm text-cocoa-soft/75">{description}</p>
      )}
    </div>
  );
}

export function DialogBody({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={cn("px-6 py-5", className)}>{children}</div>;
}

export function DialogFooter({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-center justify-end gap-2 border-t border-cocoa/6 px-6 py-4",
        className,
      )}
    >
      {children}
    </div>
  );
}
