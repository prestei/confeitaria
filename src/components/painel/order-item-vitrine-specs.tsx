import { Check, Sparkles } from "lucide-react";
import { visibleCustomizations } from "@/lib/addons";
import { cn } from "@/lib/cn";

function formatValue(value: unknown): string {
  if (Array.isArray(value)) return value.map(String).join(", ");
  if (value == null) return "";
  return String(value);
}

function addonLabels(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map((entry) => {
      const s = String(entry).trim();
      const m = s.match(/^\d+x\s+(.+)$/i);
      return m ? m[1] : s;
    });
  }
  if (value == null || value === "") return [];
  const s = String(value).trim();
  const m = s.match(/^\d+x\s+(.+)$/i);
  return [m ? m[1] : s];
}

/** Opções e adicionais como na vitrine / checkout. */
export function OrderItemVitrineSpecs({
  customizations,
  className,
}: {
  customizations?: Record<string, unknown> | null;
  className?: string;
}) {
  const visible = visibleCustomizations(customizations);
  const specs = Object.entries(visible).filter(
    ([key, value]) => key !== "Adicionais" && formatValue(value),
  );
  const addons = addonLabels(visible.Adicionais);

  if (!specs.length && !addons.length) return null;

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      {specs.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {specs.map(([key, value]) => (
            <span
              key={key}
              className="inline-flex items-center gap-1 rounded-md bg-[#F3EEE8] px-2 py-0.5 text-[10px] font-semibold text-[#483129]"
            >
              <Sparkles className="h-2.5 w-2.5 text-[#C85A5A]" aria-hidden />
              <span className="text-[#8C8682]">{key}</span>
              <span>{formatValue(value)}</span>
            </span>
          ))}
        </div>
      )}
      {addons.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {addons.map((label) => (
            <span
              key={label}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[#E8E2DE] bg-white px-2 py-1 text-[10px] font-semibold text-[#2D2926] shadow-[0_1px_2px_rgba(45,41,38,0.05)]"
            >
              <span className="flex h-4 w-4 items-center justify-center rounded bg-[#E7F8ED] text-[#31A24C]">
                <Check className="h-2.5 w-2.5" strokeWidth={3} aria-hidden />
              </span>
              {label}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
