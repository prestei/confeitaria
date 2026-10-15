"use client";

import { Copy, ExternalLink, Share2 } from "lucide-react";
import { useToast } from "@/components/ui/toast";

export function OverviewLinkCard({
  publicUrl,
  displayHost,
}: {
  publicUrl: string;
  displayHost: string;
}) {
  const { toast } = useToast();

  async function copy() {
    try {
      await navigator.clipboard.writeText(publicUrl);
      toast({ title: "Link copiado", tone: "success" });
    } catch {
      toast({ title: "Não foi possível copiar", tone: "error" });
    }
  }

  return (
    <section className="relative overflow-hidden rounded-2xl border border-[#F0D4DC] bg-gradient-to-br from-[#FDF2F5] via-[#FCE8EE] to-[#F9E4D0] p-5 sm:p-6">
      <p className="text-xs font-semibold uppercase tracking-wide text-[#9A6B7A]">
        Link da vitrine
      </p>
      <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center">
        <button
          type="button"
          onClick={copy}
          className="flex min-w-0 flex-1 items-center gap-2 rounded-xl bg-white/80 px-4 py-3 text-left shadow-sm ring-1 ring-[#F0D4DC]/60 transition hover:bg-white"
        >
          <span className="truncate text-sm font-medium text-[#4A3728]">
            {displayHost}
          </span>
          <Copy className="ml-auto h-4 w-4 shrink-0 text-[#9A6B7A]" aria-hidden />
        </button>
        <div className="flex shrink-0 gap-2">
          <a
            href={publicUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#4A3728] px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#3D2E22]"
          >
            <ExternalLink className="h-4 w-4" aria-hidden />
            Visualizar
          </a>
          <a
            href={`https://wa.me/?text=${encodeURIComponent(`Confira nossa vitrine: ${publicUrl}`)}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-[#4A3728]/20 bg-white px-4 py-2.5 text-sm font-semibold text-[#4A3728] hover:bg-white/90"
          >
            <Share2 className="h-4 w-4" aria-hidden />
            Compartilhar
          </a>
        </div>
      </div>
      <p
        className="mt-4 text-right text-sm text-[var(--painel-accent)] sm:text-base"
        style={{ fontFamily: "var(--font-display), cursive" }}
      >
        Compartilhe seu link e conquiste mais clientes!
      </p>
    </section>
  );
}
