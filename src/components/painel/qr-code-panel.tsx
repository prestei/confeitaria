"use client";

import { useMemo, useState } from "react";
import {
  Check,
  Copy,
  Download,
  ExternalLink,
  ImageIcon,
  Printer,
  RotateCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Label } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/cn";

const SIZES = [
  { label: "Pequeno", value: 256, hint: "Stories / destaque" },
  { label: "Médio", value: 512, hint: "Posts e cartões" },
  { label: "Grande", value: 1024, hint: "Impressão e embalagens" },
] as const;

const DEFAULT_CTA = "Escaneie e peça pelo cardápio";

function formatInstagram(handle: string | null | undefined) {
  if (!handle?.trim()) return "";
  const h = handle.trim().replace(/^@/, "");
  return `@${h}`;
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("image"));
    img.src = src;
  });
}

export function QrCodePanel({
  publicUrl,
  storeName,
  storeSlug,
  tagline,
  city,
  instagram,
  logoUrl,
  accentColor = "#8B3A3A",
}: {
  publicUrl: string;
  storeName: string;
  storeSlug: string;
  tagline?: string | null;
  city?: string | null;
  instagram?: string | null;
  logoUrl?: string | null;
  accentColor?: string;
}) {
  const { toast } = useToast();
  const [size, setSize] = useState<number>(512);
  const [copied, setCopied] = useState(false);
  const [downloadingPoster, setDownloadingPoster] = useState(false);

  const defaultExtra = useMemo(() => {
    const parts: string[] = [];
    const ig = formatInstagram(instagram);
    if (ig) parts.push(ig);
    if (city?.trim()) parts.push(city.trim());
    return parts.join(" · ");
  }, [instagram, city]);

  const [headline, setHeadline] = useState(storeName);
  const [subtitle, setSubtitle] = useState(tagline?.trim() || "");
  const [cta, setCta] = useState(DEFAULT_CTA);
  const [extraLine, setExtraLine] = useState(defaultExtra);

  const qrSrc = useMemo(
    () =>
      `/api/qr?url=${encodeURIComponent(publicUrl)}&size=${size}&slug=${storeSlug}`,
    [publicUrl, size, storeSlug],
  );

  const downloadHref = `${qrSrc}&download=1`;

  function resetPersonalization() {
    setHeadline(storeName);
    setSubtitle(tagline?.trim() || "");
    setCta(DEFAULT_CTA);
    setExtraLine(defaultExtra);
  }

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

  async function downloadPoster() {
    setDownloadingPoster(true);
    try {
      const qrImg = await loadImage(qrSrc);
      let logoImg: HTMLImageElement | null = null;
      if (logoUrl) {
        try {
          logoImg = await loadImage(logoUrl);
        } catch {
          logoImg = null;
        }
      }

      const w = 1080;
      const h = 1520;
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("canvas");

      ctx.fillStyle = "#FFF8F5";
      ctx.fillRect(0, 0, w, h);

      ctx.strokeStyle = "#E8E2DE";
      ctx.lineWidth = 4;
      ctx.strokeRect(48, 48, w - 96, h - 96);

      const accent = accentColor?.startsWith("#") ? accentColor : "#8B3A3A";
      ctx.fillStyle = accent;
      ctx.fillRect(48, 48, w - 96, 12);

      let y = 140;

      if (logoImg) {
        const logoSize = 120;
        const lx = (w - logoSize) / 2;
        ctx.save();
        ctx.beginPath();
        ctx.arc(lx + logoSize / 2, y + logoSize / 2, logoSize / 2, 0, Math.PI * 2);
        ctx.clip();
        ctx.drawImage(logoImg, lx, y, logoSize, logoSize);
        ctx.restore();
        y += logoSize + 36;
      }

      ctx.fillStyle = "#24140F";
      ctx.textAlign = "center";
      ctx.font = "bold 56px system-ui, sans-serif";
      wrapText(ctx, headline.trim() || storeName, w / 2, y, w - 160, 64);
      y += measureWrappedHeight(ctx, headline.trim() || storeName, w - 160, 64);

      if (subtitle.trim()) {
        y += 16;
        ctx.fillStyle = "#5C4A42";
        ctx.font = "32px system-ui, sans-serif";
        wrapText(ctx, subtitle.trim(), w / 2, y, w - 180, 40);
        y += measureWrappedHeight(ctx, subtitle.trim(), w - 180, 40);
      }

      if (cta.trim()) {
        y += 28;
        ctx.fillStyle = accent;
        ctx.font = "600 28px system-ui, sans-serif";
        wrapText(ctx, cta.trim(), w / 2, y, w - 180, 36);
        y += measureWrappedHeight(ctx, cta.trim(), w - 180, 36);
      }

      const qrBox = Math.min(520, w - 200);
      const qrX = (w - qrBox) / 2;
      y += 48;
      ctx.fillStyle = "#FFFFFF";
      roundRect(ctx, qrX - 24, y - 24, qrBox + 48, qrBox + 48, 32);
      ctx.fill();
      ctx.drawImage(qrImg, qrX, y, qrBox, qrBox);
      y += qrBox + 56;

      if (extraLine.trim()) {
        ctx.fillStyle = "#8C8682";
        ctx.font = "26px system-ui, sans-serif";
        wrapText(ctx, extraLine.trim(), w / 2, y, w - 180, 34);
        y += measureWrappedHeight(ctx, extraLine.trim(), w - 180, 34) + 12;
      }

      ctx.fillStyle = "#9AA0A6";
      ctx.font = "22px system-ui, sans-serif";
      const urlShort = publicUrl.replace(/^https?:\/\//, "");
      wrapText(ctx, urlShort, w / 2, y + 8, w - 160, 30);

      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, "image/png"),
      );
      if (!blob) throw new Error("blob");

      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `cartaz-qr-${storeSlug || "vitrine"}.png`;
      a.click();
      URL.revokeObjectURL(a.href);
      toast({ title: "Cartaz baixado", tone: "success" });
    } catch {
      toast({
        title: "Não foi possível gerar o cartaz",
        description: "Tente baixar só o QR Code em PNG.",
        tone: "error",
      });
    } finally {
      setDownloadingPoster(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
      <Card className="flex flex-col items-center p-6 sm:p-8">
        <p className="text-sm font-medium text-cocoa-soft/70">Pré-visualização</p>
        <div className="mt-5 w-full max-w-sm rounded-3xl border border-cocoa/8 bg-cream p-6 shadow-[0_8px_28px_rgba(36,20,15,0.06)]">
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={logoUrl}
              alt=""
              className="mx-auto h-14 w-14 rounded-full object-cover ring-2 ring-white"
            />
          ) : null}
          <p className="mt-4 text-center font-display text-xl text-cocoa">
            {headline.trim() || storeName}
          </p>
          {subtitle.trim() ? (
            <p className="mt-1 text-center text-sm text-cocoa-soft/75">{subtitle}</p>
          ) : null}
          {cta.trim() ? (
            <p
              className="mt-3 text-center text-xs font-semibold uppercase tracking-wide"
              style={{ color: accentColor }}
            >
              {cta}
            </p>
          ) : null}
          <div className="mt-5 rounded-2xl bg-white p-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              key={qrSrc}
              src={qrSrc}
              alt={`QR Code do cardápio de ${storeName}`}
              width={size}
              height={size}
              className="h-auto w-full rounded-xl"
            />
          </div>
          {extraLine.trim() ? (
            <p className="mt-3 text-center text-xs text-cocoa-soft/65">{extraLine}</p>
          ) : null}
          <p className="mt-2 break-all text-center text-[11px] text-berry/80">
            {publicUrl.replace(/^https?:\/\//, "")}
          </p>
        </div>
      </Card>

      <div className="space-y-5">
        <Card className="p-5 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <h2 className="font-display text-xl text-cocoa">Textos do cartão</h2>
              <p className="mt-1 text-sm text-cocoa-soft/70">
                Nome e informações que aparecem junto ao QR da sua página{" "}
                <span className="font-medium text-cocoa">/{storeSlug}</span>.
              </p>
            </div>
            <Button
              type="button"
              variant="ghost"
              className="shrink-0 text-xs"
              onClick={resetPersonalization}
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Restaurar padrão
            </Button>
          </div>
          <div className="mt-4 space-y-4">
            <div>
              <Label htmlFor="qr-headline">Nome na arte</Label>
              <Input
                id="qr-headline"
                value={headline}
                onChange={(e) => setHeadline(e.target.value)}
                placeholder={storeName}
                maxLength={80}
              />
            </div>
            <div>
              <Label htmlFor="qr-subtitle">Tagline ou frase curta</Label>
              <Input
                id="qr-subtitle"
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
                placeholder="Ex.: Bolos artesanais sob encomenda"
                maxLength={120}
              />
            </div>
            <div>
              <Label htmlFor="qr-cta">Chamada (CTA)</Label>
              <Input
                id="qr-cta"
                value={cta}
                onChange={(e) => setCta(e.target.value)}
                placeholder={DEFAULT_CTA}
                maxLength={80}
              />
            </div>
            <div>
              <Label htmlFor="qr-extra">Instagram, cidade ou contato</Label>
              <Input
                id="qr-extra"
                value={extraLine}
                onChange={(e) => setExtraLine(e.target.value)}
                placeholder="@sualoja · São Paulo"
                maxLength={120}
              />
              <p className="mt-1.5 text-xs text-cocoa-soft/55">
                Preenchido com os dados da vitrine; você pode editar só para este
                cartão.
              </p>
            </div>
          </div>
        </Card>

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
            <Button
              variant="berry"
              type="button"
              disabled={downloadingPoster}
              onClick={() => void downloadPoster()}
            >
              <Download className="h-4 w-4" />
              {downloadingPoster ? "Gerando…" : "Baixar cartaz PNG"}
            </Button>
            <a href={downloadHref}>
              <Button variant="secondary" type="button">
                <Download className="h-4 w-4" />
                Só o QR (PNG)
              </Button>
            </a>
            <Button variant="secondary" type="button" onClick={copyLink}>
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copied ? "Copiado" : "Copiar link"}
            </Button>
            <a href={publicUrl} target="_blank" rel="noreferrer">
              <Button variant="ghost" type="button">
                <ExternalLink className="h-4 w-4" />
                Abrir vitrine
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
                Use o cartão personalizado no destaque do Instagram, stories ou
                impresso na embalagem.
              </span>
            </li>
            <li className="flex gap-3">
              <Printer className="mt-0.5 h-4 w-4 shrink-0 text-berry" aria-hidden />
              <span>
                Para mesas e balcão, baixe no tamanho grande e imprima o cartaz
                completo.
              </span>
            </li>
          </ul>
        </Card>
      </div>
    </div>
  );
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
) {
  const words = text.split(/\s+/);
  let line = "";
  let cy = y;
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      ctx.fillText(line, x, cy);
      line = word;
      cy += lineHeight;
    } else {
      line = test;
    }
  }
  if (line) ctx.fillText(line, x, cy);
}

function measureWrappedHeight(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  lineHeight: number,
) {
  const words = text.split(/\s+/);
  let line = "";
  let lines = 1;
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines += 1;
      line = word;
    } else {
      line = test;
    }
  }
  return lines * lineHeight;
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}
