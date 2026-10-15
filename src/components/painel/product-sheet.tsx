"use client";

import { useRouter } from "next/navigation";
import {
  Sheet,
  SheetContent,
  SheetHeader,
} from "@/components/ui/sheet";
import { ProductForm, type ProductFormInitial } from "@/components/painel/product-form";

export function ProductSheet({
  open,
  onOpenChange,
  initial,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial?: ProductFormInitial;
  onSaved?: () => void;
}) {
  const router = useRouter();

  function handleSaved() {
    onOpenChange(false);
    router.replace("/painel/produtos");
    onSaved?.();
    router.refresh();
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        size="xl"
        side="right"
        className="!max-w-[min(100%,32rem)] sm:!max-w-lg"
      >
        <SheetHeader
          title="Novo produto"
          description="Adicione um item à sua vitrine"
        />
        {open ? (
          <ProductForm
            key="create"
            layout="sheet"
            initial={initial}
            onSaved={handleSaved}
            onCancel={() => onOpenChange(false)}
          />
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
