"use client";

import { Copy, Eye, Heart, Link2, Share2 } from "lucide-react";
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
    <section className="rounded-xl border border-[var(--painel-border)] bg-white p-4 sm:p-5">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-[#9A8F88]">
        Link da vitrine
      </p>
      <div className="mt-2 flex flex-col gap-3 xl:flex-row xl:items-center">
        <button
          type="button"
          onClick={copy}
          className="flex min-w-0 flex-1 items-center gap-2 rounded-lg border border-[#E5E7EB] bg-[#F9FAFB] px-3 py-2.5 text-left transition hover:border-[#D1D5DB] hover:bg-white"
        >
          <Link2
            className="h-4 w-4 shrink-0 text-[#9CA3AF]"
            strokeWidth={1.75}
            aria-hidden
          />
          <span className="truncate text-sm font-medium text-[var(--painel-brand,#0f352e)]">
            {displayHost}
          </span>
          <Copy
            className="ml-auto h-4 w-4 shrink-0 text-[#9CA3AF]"
            aria-hidden
          />
        </button>

        <div className="flex shrink-0 flex-wrap gap-2">
          <a
            href={publicUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-[var(--painel-brand,#0f352e)] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[var(--painel-brand-hover,#164a40)]"
          >
            <Eye className="h-4 w-4" aria-hidden />
            Visualizar
          </a>
          <a
            href={`https://wa.me/?text=${encodeURIComponent(`Confira nossa vitrine: ${publicUrl}`)}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-[#E5E7EB] bg-white px-4 py-2.5 text-sm font-semibold text-[var(--painel-brand,#0f352e)] transition hover:bg-[#F9FAFB]"
          >
            <Share2 className="h-4 w-4" aria-hidden />
            Compartilhar
          </a>
        </div>

        <p
          className="flex shrink-0 items-center justify-center gap-1.5 text-center text-sm text-[#6B6560] xl:max-w-[240px] xl:justify-end xl:text-right"
          style={{ fontFamily: "var(--font-display), cursive" }}
        >
          <Heart
            className="h-4 w-4 shrink-0 fill-[#E05A5A] text-[#E05A5A]"
            aria-hidden
          />
          Compartilhe seu link e conquiste mais clientes!
        </p>
      </div>
    </section>
  );
}
