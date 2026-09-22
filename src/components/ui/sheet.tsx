"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useState,
  type ButtonHTMLAttributes,
  type FormHTMLAttributes,
  type ReactNode,
} from "react";
import { AnimatePresence, motion } from "motion/react";
import { X } from "lucide-react";
import { cn } from "@/lib/cn";
import { motionPresets } from "@/lib/animations/presets";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { Button } from "@/components/ui/button";

type SheetCtx = {
  open: boolean;
  setOpen: (v: boolean) => void;
  titleId: string;
  descriptionId: string;
  hasDescription: boolean;
  setHasDescription: (v: boolean) => void;
};

const SheetContext = createContext<SheetCtx | null>(null);

function useSheet() {
  const ctx = useContext(SheetContext);
  if (!ctx) throw new Error("Sheet components must be used within Sheet");
  return ctx;
}

/** Sheet lateral — padrão para cadastros simples do painel. */
export function Sheet({
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
  const descriptionId = useId();
  const [hasDescription, setHasDescription] = useState(false);

  const value = useMemo(
    () => ({
      open,
      setOpen,
      titleId,
      descriptionId,
      hasDescription,
      setHasDescription,
    }),
    [open, setOpen, titleId, descriptionId, hasDescription],
  );

  return (
    <SheetContext.Provider value={value}>{children}</SheetContext.Provider>
  );
}

export function SheetContent({
  children,
  className,
  size = "md",
  side = "right",
}: {
  children: ReactNode;
  className?: string;
  /** Largura do painel. */
  size?: "sm" | "md" | "lg";
  side?: "right" | "left";
}) {
  const { open, setOpen, titleId, descriptionId, hasDescription } = useSheet();
  const reduced = useReducedMotion();
  const sizes = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
  };
  const fromRight = side === "right";

  const close = useCallback(() => setOpen(false), [setOpen]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") close();
    }
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, close]);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50">
          <motion.button
            type="button"
            aria-label="Fechar"
            className="absolute inset-0 bg-[#2D2926]/40 backdrop-blur-[2px]"
            onClick={close}
            initial={reduced ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          />
          <motion.aside
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            aria-describedby={hasDescription ? descriptionId : undefined}
            className={cn(
              "absolute inset-y-0 flex w-full flex-col bg-white shadow-2xl shadow-[#2D2926]/20",
              fromRight
                ? "right-0 border-l border-[#E8E2DE]"
                : "left-0 border-r border-[#E8E2DE]",
              sizes[size],
              className,
            )}
            initial={
              reduced ? false : { x: fromRight ? "100%" : "-100%" }
            }
            animate={{ x: 0 }}
            exit={{ x: fromRight ? "100%" : "-100%" }}
            transition={
              reduced ? { duration: 0 } : motionPresets.drawer.transition
            }
          >
            <button
              type="button"
              onClick={close}
              className="absolute right-4 top-4 z-10 rounded-md p-1.5 text-[#8C8682] transition hover:bg-[#F0F2F5] hover:text-[#2D2926]"
              aria-label="Fechar"
            >
              <X className="h-4 w-4" />
            </button>
            <div className="flex min-h-0 flex-1 flex-col">{children}</div>
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  );
}

export function SheetHeader({
  title,
  description,
  className,
}: {
  title: string;
  description?: string;
  className?: string;
}) {
  const { titleId, descriptionId, setHasDescription } = useSheet();

  useEffect(() => {
    setHasDescription(Boolean(description));
    return () => setHasDescription(false);
  }, [description, setHasDescription]);

  return (
    <div
      className={cn(
        "shrink-0 border-b border-[#E8E2DE] px-5 pb-4 pt-5 pr-12",
        className,
      )}
    >
      <h2
        id={titleId}
        className="font-sans text-xl font-bold leading-tight tracking-tight text-[#2D2926]"
      >
        {title}
      </h2>
      {description ? (
        <p
          id={descriptionId}
          className="mt-1 text-sm leading-snug text-[#8C8682]"
        >
          {description}
        </p>
      ) : null}
    </div>
  );
}

export function SheetBody({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "min-h-0 flex-1 overflow-y-auto px-5 py-5",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function SheetFooter({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex shrink-0 flex-wrap items-center justify-end gap-2 border-t border-[#E8E2DE] bg-white px-5 py-4",
        className,
      )}
    >
      {children}
    </div>
  );
}

/** Cancelar — fecha o sheet. */
export function SheetCancel({
  children = "Cancelar",
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  const { setOpen } = useSheet();
  return (
    <Button
      type="button"
      variant="ghost"
      className={className}
      onClick={() => setOpen(false)}
      {...props}
    >
      {children}
    </Button>
  );
}

/** Ação primária do footer (submit). */
export function SheetPrimary({
  children,
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <Button type="submit" variant="primary" className={className} {...props}>
      {children}
    </Button>
  );
}

/**
 * Form wrapper que preenche o espaço entre header e footer.
 * Use: SheetHeader + SheetForm > SheetBody + SheetFooter
 */
export function SheetForm({
  children,
  className,
  ...props
}: FormHTMLAttributes<HTMLFormElement>) {
  return (
    <form
      className={cn("flex min-h-0 flex-1 flex-col", className)}
      {...props}
    >
      {children}
    </form>
  );
}
