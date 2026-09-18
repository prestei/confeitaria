"use client";

import { useMemo, useState } from "react";
import {
  Check,
  Copy,
  Download,
  ExternalLink,
  ImageIcon,
  Printer,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/cn";

const SIZES = [
  { label: "Pequeno", value: 256, hint: "Stories / stories highlight" },
  { label: "Médio", value: 512, hint: "Posts e cartões" },
  { label: "Grande", value: 1024, hint: "Impressão e embalagens" },
] as const;

export function QrCodePanel({
  publicUrl,
  storeName,
  storeSlug,
}: {
  publicUrl: string;
  storeName: string;
  storeSlug: string;
}) {
  const { toast } = useToast();
  const [size, setSize] = useState<number>(512);
  const [copied, setCopied] = useState(false);

  const qrSrc = useMemo(
    () => `/api/qr?url=${encodeURIComponent(publicUrl)}&size=${size}&slug=${storeSlug}`,
    [publicUrl, size, storeSlug],
  );

  const downloadHref = `${qrSrc}&download=1`;

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(publicUrl);
      setCopied(true);
      toast({ title: "Link copiado", tone: "success" });
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({ title: "Não foi possível copiar", tone: "error" });
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
      <Card className="flex flex-col items-center p-6 sm:p-8">
        <p className="text-sm font-medium text-cocoa-soft/70">Pré-visualização</p>
        <div className="mt-5 rounded-3xl border border-cocoa/8 bg-cream p-4 shadow-[0_8px_28px_rgba(36,20,15,0.06)]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            key={qrSrc}
            src={qrSrc}
            alt={`QR Code do cardápio de ${storeName}`}
            width={size}
            height={size}
            className="h-auto w-[min(100%,280px)] rounded-2xl"
          />
        </div>
        <p className="mt-4 text-center font-display text-xl text-cocoa">{storeName}</p>
        <p className="mt-1 max-w-xs break-all text-center text-xs text-berry">{publicUrl}</p>
      </Card>

      <div className="space-y-5">
        <Card className="p-5 sm:p-6">
          <h2 className="font-display text-xl text-cocoa">Tamanho do QR</h2>
          <p className="mt-1 text-sm text-cocoa-soft/70">
            Escolha conforme o uso: digital ou impressão.
          </p>
          <div className="mt-4 grid gap-2 sm:grid-cols-3">
            {SIZES.map((s) => (
              <button
                key={s.value}
                type="button"
                onClick={() => setSize(s.value)}
                className={cn(
                  "rounded-2xl border px-3 py-3 text-left transition",
                  size === s.value
                    ? "border-berry bg-blush/50"
                    : "border-cocoa/10 bg-white hover:border-cocoa/20",
                )}
              >
                <span className="block text-sm font-semibold text-cocoa">{s.label}</span>
                <span className="mt-0.5 block text-[11px] text-cocoa-soft/65">{s.hint}</span>
              </button>
            ))}
          </div>
        </Card>

        <Card className="p-5 sm:p-6">
          <h2 className="font-display text-xl text-cocoa">Ações</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            <a href={downloadHref}>
              <Button variant="berry" type="button">
                <Download className="h-4 w-4" />
                Baixar PNG
              </Button>
            </a>
            <Button variant="secondary" type="button" onClick={copyLink}>
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copied ? "Copiado" : "Copiar link"}
            </Button>
            <a href={publicUrl} target="_blank" rel="noreferrer">
              <Button variant="ghost" type="button">
                <ExternalLink className="h-4 w-4" />
                Abrir cardápio
              </Button>
            </a>
          </div>
        </Card>

        <Card className="p-5 sm:p-6">
          <h2 className="font-display text-xl text-cocoa">Como usar</h2>
          <ul className="mt-4 space-y-3 text-sm text-cocoa-soft/80">
            <li className="flex gap-3">
              <ImageIcon className="mt-0.5 h-4 w-4 shrink-0 text-berry" aria-hidden />
              <span>
                Coloque o QR no destaque do Instagram, nos stories ou no link da bio
                junto com o endereço do cardápio.
              </span>
            </li>
            <li className="flex gap-3">
              <Printer className="mt-0.5 h-4 w-4 shrink-0 text-berry" aria-hidden />
              <span>
                Imprima no tamanho grande para embalagens, cartões, mesas e
                embalagens de entrega.
              </span>
            </li>
          </ul>
        </Card>
      </div>
    </div>
  );
}
