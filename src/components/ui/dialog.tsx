"use client";

import {
  createContext,
  useCallback,
  useContext,
  useId,
  useMemo,
  useState,
  type ButtonHTMLAttributes,
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
  closeClassName,
}: {
  children: ReactNode;
  className?: string;
  size?: "sm" | "md" | "lg";
  closeClassName?: string;
}) {
  const { open, setOpen, titleId } = useDialog();
  const reduced = useReducedMotion();
  const sizes = { sm: "max-w-md", md: "max-w-lg", lg: "max-w-2xl" };

  const close = useCallback(() => setOpen(false), [setOpen]);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center p-3 sm:items-center sm:p-4">
          <motion.button
            type="button"
            aria-label="Fechar"
            className="absolute inset-0 bg-cocoa/45 backdrop-blur-[3px]"
            onClick={close}
            {...(reduced ? {} : motionPresets.modal.overlay)}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            className={cn(
              "relative z-10 w-full overflow-hidden rounded-xl bg-white shadow-2xl shadow-[#2D2926]/20",
              sizes[size],
              className,
            )}
            {...(reduced ? {} : motionPresets.modal.content)}
          >
            <button
              type="button"
              onClick={close}
              className={cn(
                "absolute right-4 top-4 rounded-md p-1.5 text-[#8C8682] transition hover:bg-[#F0F2F5] hover:text-[#2D2926]",
                closeClassName,
              )}
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
    <div className="px-6 pb-1 pt-6 pr-12">
      <h2
        id={titleId}
        className="font-sans text-xl font-bold leading-tight tracking-tight text-[#2D2926]"
      >
        {title}
      </h2>
      {description && (
        <p className="mt-1 text-sm leading-snug text-[#8C8682]">{description}</p>
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
        "flex flex-wrap items-center justify-end gap-2 px-6 pb-5 pt-1",
        className,
      )}
    >
      {children}
    </div>
  );
}

/** Cancelar ghost — padrão de todos os footers de modal. */
export function DialogCancel({
  children = "Cancelar",
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  const { setOpen } = useDialog();
  return (
    <button
      type="button"
      onClick={() => setOpen(false)}
      className={cn(
        "rounded-md px-3 py-2 text-sm font-semibold text-[#8C8682] transition",
        "hover:bg-[#F0F2F5] hover:text-[#2D2926]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2D2926]/20",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

/** Ação primária do footer (mesma linguagem do PageAction). */
export function DialogPrimary({
  children,
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="submit"
      className={cn(
        "inline-flex h-9 items-center justify-center gap-1.5 rounded-md px-3.5 text-sm font-semibold",
        "bg-[#2D2926] text-white transition hover:bg-[#3D3834]",
        "disabled:pointer-events-none disabled:opacity-50",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2D2926]/25",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
