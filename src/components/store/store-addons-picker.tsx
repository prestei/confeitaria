"use client";

import { Minus, Plus } from "lucide-react";
import { formatBRL } from "@/lib/utils";
import { AddonSelectionType } from "@/lib/enums";
import type { ResolvedAddon } from "@/lib/addons";

export function StoreAddonsPicker({
  addons,
  qty,
  notes,
  onQty,
  onNote,
}: {
  addons: ResolvedAddon[];
  qty: Record<string, number>;
  notes: Record<string, string>;
  onQty: (id: string, next: number) => void;
  onNote: (id: string, value: string) => void;
}) {
  if (addons.length === 0) return null;

  return (
    <div>
      <p className="label">Acompanhamentos para a comemoração</p>
      <p className="mb-2 text-xs text-cocoa-soft/70">
        Velas, topos, bexigas e outros extras — o total atualiza na hora.
      </p>
      <div className="space-y-2">
        {addons.map((a) => {
          const selected = (qty[a.id] || 0) > 0;
          const isQty = a.selectionType === AddonSelectionType.QTY;
          const isText = a.selectionType === AddonSelectionType.TEXT;
          return (
            <div
              key={a.id}
              className="rounded-xl border border-cocoa/8 bg-sand/40 px-3.5 py-2.5"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  {a.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={a.imageUrl}
                      alt=""
                      className="h-11 w-11 shrink-0 rounded-lg object-cover"
                    />
                  ) : null}
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-cocoa">{a.name}</p>
                    {a.description ? (
                      <p className="text-[11px] leading-snug text-cocoa-soft/70">
                        {a.description}
                      </p>
                    ) : null}
                    <p className="text-xs text-cocoa-soft">
                      + {formatBRL(a.priceCents)}
                    </p>
                  </div>
                </div>
                {isQty ? (
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      aria-label={`Diminuir ${a.name}`}
                      disabled={!selected}
                      onClick={() => onQty(a.id, Math.max(0, (qty[a.id] || 0) - 1))}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-cocoa/10 bg-surface text-cocoa transition hover:border-rosewood/30 disabled:opacity-40"
                    >
                      <Minus className="h-3.5 w-3.5" />
                    </button>
                    <span className="w-6 text-center text-sm font-semibold tabular-nums text-cocoa">
                      {qty[a.id] || 0}
                    </span>
                    <button
                      type="button"
                      aria-label={`Aumentar ${a.name}`}
                      disabled={(qty[a.id] || 0) >= a.maxQty}
                      onClick={() =>
                        onQty(a.id, Math.min(a.maxQty, (qty[a.id] || 0) + 1))
                      }
                      className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-cocoa/10 bg-surface text-cocoa transition hover:border-rosewood/30 disabled:opacity-40"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ) : (
                  <label className="inline-flex cursor-pointer items-center gap-2 text-sm font-medium text-cocoa">
                    <input
                      type="checkbox"
                      className="h-4 w-4 accent-[var(--berry,#C45B7A)]"
                      checked={selected}
                      onChange={(e) => onQty(a.id, e.target.checked ? 1 : 0)}
                    />
                    Adicionar
                  </label>
                )}
              </div>
              {isText && selected ? (
                <input
                  className="mt-2 w-full rounded-lg border border-cocoa/10 bg-surface px-3 py-2 text-sm text-cocoa outline-none placeholder:text-cocoa-soft/50 focus:border-berry/40"
                  placeholder={a.noteLabel || "Detalhe (número, cor, tema…)"}
                  value={notes[a.id] || ""}
                  onChange={(e) => onNote(a.id, e.target.value)}
                  required={a.noteRequired}
                />
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
