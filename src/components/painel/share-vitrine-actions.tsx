"use client";

import { Copy } from "lucide-react";
import { useToast } from "@/components/ui/toast";

export function ShareVitrineActions({
  url,
}: {
  url: string;
  slug?: string;
}) {
  const { toast } = useToast();

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      toast({ title: "Link copiado", tone: "success" });
    } catch {
      toast({ title: "Não foi possível copiar", tone: "error" });
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      className="inline-flex items-center gap-1.5 rounded-lg border border-cocoa/10 bg-white px-3 py-2 text-xs font-semibold text-cocoa hover:bg-fog/40"
    >
      <Copy className="h-3.5 w-3.5" aria-hidden />
      Copiar
    </button>
  );
}
