"use client";

import { useRef, useState } from "react";
import { ImagePlus, Link2, Loader2, Trash2, Upload } from "lucide-react";
import { Input, Label, Textarea } from "@/components/ui/input";
import { cn } from "@/lib/cn";

async function uploadFile(file: File): Promise<string> {
  const body = new FormData();
  body.append("file", file);
  const res = await fetch("/api/uploads", { method: "POST", body });
  const json = (await res.json().catch(() => null)) as {
    url?: string;
    error?: string;
  } | null;
  if (!res.ok || !json?.url) {
    throw new Error(json?.error || "Falha no upload");
  }
  return json.url;
}

export function ImageField({
  label,
  value,
  onChange,
  hint,
  className,
  variant = "compact",
  required,
}: {
  label: string;
  value: string;
  onChange: (url: string) => void;
  hint?: string;
  className?: string;
  variant?: "compact" | "dropzone";
  required?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [showUrl, setShowUrl] = useState(Boolean(value && !value.startsWith("/uploads/")));

  async function onPick(files: FileList | null) {
    const file = files?.[0];
    if (!file) return;
    setError("");
    setUploading(true);
    try {
      const url = await uploadFile(file);
      onChange(url);
      setShowUrl(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Falha no upload");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  if (variant === "dropzone") {
    return (
      <div className={cn("space-y-2", className)}>
        <Label>
          {label}
          {required ? (
            <span className="text-berry-deep" aria-hidden> *</span>
          ) : null}
        </Label>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="sr-only"
          onChange={(e) => onPick(e.target.files)}
        />
        <button
          type="button"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            onPick(e.dataTransfer.files);
          }}
          className={cn(
            "flex w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-10 text-center transition",
            value
              ? "border-[#CED0D4] bg-[#FAFAFA]"
              : dragOver
                ? "border-cocoa/40 bg-[#F7F5F3]"
                : "border-[var(--painel-border)] bg-[#FAFAFA] hover:border-[#CED0D4]",
          )}
        >
          {value ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={value}
              alt=""
              className="max-h-40 w-full rounded-lg object-contain"
            />
          ) : (
            <>
              <ImagePlus className="h-10 w-10 text-[#B0AAA6]" aria-hidden />
              <p className="text-sm font-medium text-cocoa">
                {uploading
                  ? "Enviando…"
                  : "Arraste a imagem ou clique para enviar"}
              </p>
              <p className="text-xs text-[#8C8682]">
                {hint ?? "JPG, PNG ou WebP · até 5 MB"}
              </p>
            </>
          )}
        </button>
        {value ? (
          <div className="flex justify-end gap-2">
            <button
              type="button"
              className="text-xs font-semibold text-[#65676B] hover:underline"
              onClick={() => inputRef.current?.click()}
            >
              Trocar imagem
            </button>
            <button
              type="button"
              className="text-xs font-semibold text-berry-deep hover:underline"
              onClick={() => onChange("")}
            >
              Remover
            </button>
          </div>
        ) : null}
        {error ? (
          <p className="text-xs font-medium text-warning">{error}</p>
        ) : null}
      </div>
    );
  }

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between gap-2">
        <Label className="!mb-0">
          {label}
          {required ? (
            <span className="text-berry-deep" aria-hidden> *</span>
          ) : null}
        </Label>
        {value ? (
          <button
            type="button"
            className="inline-flex items-center gap-1 text-xs font-semibold text-[#C2410C] hover:underline"
            onClick={() => onChange("")}
          >
            <Trash2 className="h-3.5 w-3.5" aria-hidden />
            Remover
          </button>
        ) : null}
      </div>

      <div className="flex flex-wrap items-start gap-3">
        <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-[var(--painel-border)] bg-[#F7F5F3]">
          {value ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={value} alt="" className="h-full w-full object-cover" />
          ) : (
            <ImagePlus className="h-7 w-7 text-[#C8C2BE]" aria-hidden />
          )}
        </div>

        <div className="min-w-0 flex-1 space-y-2">
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="sr-only"
            onChange={(e) => onPick(e.target.files)}
          />
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="btn-secondary inline-flex items-center gap-1.5 !py-2 text-sm"
              disabled={uploading}
              onClick={() => inputRef.current?.click()}
            >
              {uploading ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              ) : (
                <Upload className="h-4 w-4" aria-hidden />
              )}
              {uploading ? "Enviando…" : value ? "Trocar imagem" : "Enviar imagem"}
            </button>
            <button
              type="button"
              className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-2 text-xs font-semibold text-[#65676B] hover:bg-[#F0F2F5]"
              onClick={() => setShowUrl((v) => !v)}
            >
              <Link2 className="h-3.5 w-3.5" aria-hidden />
              {showUrl ? "Ocultar URL" : "Usar URL"}
            </button>
          </div>
          {hint ? (
            <p className="text-xs leading-relaxed text-[#8C8682]">{hint}</p>
          ) : (
            <p className="text-xs leading-relaxed text-[#8C8682]">
              JPEG, PNG, WebP ou GIF · até 5 MB
            </p>
          )}
          {error ? (
            <p className="text-xs font-medium text-warning">{error}</p>
          ) : null}
        </div>
      </div>

      {showUrl ? (
        <Input
          className="font-mono text-sm"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="https://… ou /uploads/…"
        />
      ) : null}
    </div>
  );
}

export function GalleryField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (urlsText: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const urls = value
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);

  function setUrls(next: string[]) {
    onChange(next.join("\n"));
  }

  async function onPick(files: FileList | null) {
    if (!files?.length) return;
    setError("");
    setUploading(true);
    try {
      const uploaded: string[] = [];
      for (const file of Array.from(files)) {
        uploaded.push(await uploadFile(file));
      }
      setUrls([...urls, ...uploaded]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Falha no upload");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Label className="!mb-0">{label}</Label>
        <button
          type="button"
          className="btn-secondary inline-flex items-center gap-1.5 !py-1.5 text-xs"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
        >
          {uploading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
          ) : (
            <Upload className="h-3.5 w-3.5" aria-hidden />
          )}
          {uploading ? "Enviando…" : "Adicionar fotos"}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          multiple
          className="sr-only"
          onChange={(e) => onPick(e.target.files)}
        />
      </div>

      {urls.length > 0 ? (
        <ul className="flex flex-wrap gap-2.5">
          {urls.map((url) => (
            <li
              key={url}
              className="group relative h-20 w-20 overflow-hidden rounded-lg border border-[var(--painel-border)] bg-[#F7F5F3]"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt="" className="h-full w-full object-cover" />
              <button
                type="button"
                className="absolute inset-0 flex items-center justify-center bg-black/45 text-white opacity-0 transition group-hover:opacity-100"
                onClick={() => setUrls(urls.filter((u) => u !== url))}
                aria-label="Remover foto"
              >
                <Trash2 className="h-4 w-4" aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      <Textarea
        className="min-h-20 font-mono text-sm"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Ou cole uma URL por linha"
      />
      {error ? (
        <p className="text-xs font-medium text-warning">{error}</p>
      ) : (
        <p className="text-xs leading-relaxed text-[#8C8682]">
          Envie arquivos ou cole URLs. JPEG, PNG, WebP ou GIF · até 5 MB cada.
        </p>
      )}
    </div>
  );
}
