"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";

export function StorePublishedToggle({
  initialPublished,
}: {
  initialPublished: boolean;
}) {
  const [published, setPublished] = useState(initialPublished);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function onToggle() {
    const next = !published;
    setLoading(true);
    setError("");
    const res = await fetch("/api/store", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isPublished: next }),
    });
    setLoading(false);
    if (res.ok) {
      setPublished(next);
      return;
    }
    setError("Não foi possível atualizar");
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        role="switch"
        aria-checked={published}
        disabled={loading}
        onClick={onToggle}
        className={cn(
          "relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4338CA]",
          published ? "bg-emerald-600" : "bg-[#CED0D4]",
          loading && "opacity-60",
        )}
      >
        <span
          className={cn(
            "inline-block h-5 w-5 transform rounded-full bg-white shadow transition",
            published ? "translate-x-6" : "translate-x-1",
          )}
        />
        <span className="sr-only">
          {published ? "Vitrine publicada" : "Vitrine oculta"}
        </span>
      </button>
      <p className="text-[11px] font-medium text-[#8C8682]">
        {published ? "Publicada" : "Oculta"}
        {loading ? " · salvando…" : null}
      </p>
      {error ? (
        <p className="text-[11px] font-medium text-danger">{error}</p>
      ) : null}
    </div>
  );
}
