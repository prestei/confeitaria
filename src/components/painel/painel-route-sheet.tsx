"use client";

import { useRouter } from "next/navigation";
import { useCallback, useState, type ReactNode } from "react";
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetHeader,
} from "@/components/ui/sheet";

export type PainelSheetSize = "sm" | "md" | "lg" | "xl" | "2xl";

/** Sheet lateral aberto por rota; ao fechar, volta para `backHref`. */
export function PainelRouteSheet({
  backHref,
  title,
  size = "md",
  children,
  bodyClassName,
}: {
  backHref: string;
  title: string;
  size?: PainelSheetSize;
  children: ReactNode;
  bodyClassName?: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(true);

  const onOpenChange = useCallback(
    (next: boolean) => {
      if (!next) {
        setOpen(false);
        router.push(backHref);
      }
    },
    [backHref, router],
  );

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent size={size} side="right">
        <SheetHeader title={title} />
        <SheetBody className={bodyClassName}>{children}</SheetBody>
      </SheetContent>
    </Sheet>
  );
}
