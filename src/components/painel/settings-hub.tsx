import Link from "next/link";
import {
  ChevronRight,
  ExternalLink,
  type LucideIcon,
} from "lucide-react";
import { SETTINGS_SECTIONS } from "@/components/painel/settings-sections";
import { cn } from "@/lib/cn";

export type SettingsHubStatus = {
  storeName: string;
  planLabel: string;
  isPublished: boolean;
  hasHours: boolean;
  hasAddress: boolean;
  paymentCount: number;
  mpConfigured: boolean;
  storeSlug: string | null;
};

const SECTION_HINT: Record<
  string,
  (s: SettingsHubStatus) => { label: string; tone: "ok" | "warn" | "neutral" }
> = {
  "/painel/configuracoes/estabelecimento": (s) =>
    s.hasAddress
      ? { label: "Completo", tone: "ok" }
      : { label: "Endereço pendente", tone: "warn" },
  "/painel/configuracoes/aparencia": () => ({
    label: "Tempo real",
    tone: "ok" as const,
  }),
  "/painel/configuracoes/horarios": (s) =>
    s.hasHours
      ? { label: "Definido", tone: "ok" }
      : { label: "Não definido", tone: "warn" },
  "/painel/configuracoes/pagamento": (s) => {
    if (s.mpConfigured) {
      return { label: "Online ativo", tone: "ok" as const };
    }
    if (s.paymentCount > 0) {
      return {
        label: `${s.paymentCount} manual${s.paymentCount === 1 ? "" : "is"} · online off`,
        tone: "warn" as const,
      };
    }
    return { label: "Pendente", tone: "warn" as const };
  },
  "/painel/configuracoes/geral": (s) => ({
    label: `Plano ${s.planLabel}`,
    tone: "neutral",
  }),
};

const ICON_TONE: Record<string, string> = {
  "/painel/configuracoes/estabelecimento": "bg-[#EEF2FF] text-[#4338CA]",
  "/painel/configuracoes/aparencia": "bg-[#FDF2F8] text-[#9D174D]",
  "/painel/configuracoes/horarios": "bg-[#ECFDF5] text-[#047857]",
  "/painel/configuracoes/pagamento": "bg-[#FFF7ED] text-[#C2410C]",
  "/painel/configuracoes/geral": "bg-[#F0F2F5] text-[#2D2926]",
};

function StatusPill({
  label,
  tone,
}: {
  label: string;
  tone: "ok" | "warn" | "neutral";
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-semibold",
        tone === "ok" && "bg-emerald-50 text-success",
        tone === "warn" && "bg-amber-50 text-warning",
        tone === "neutral" && "bg-[#F0F2F5] text-[#65676B]",
      )}
    >
      {label}
    </span>
  );
}

export function SettingsHub({ status }: { status: SettingsHubStatus }) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[#E8E2DE] bg-white px-4 py-3.5">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-[#2D2926]">{status.storeName}</p>
          <p className="mt-0.5 text-xs text-[#8C8682]">
            {status.isPublished ? "Vitrine publicada" : "Vitrine oculta"} · Plano{" "}
            {status.planLabel}
          </p>
        </div>
        {status.storeSlug ? (
          <Link
            href={`/${status.storeSlug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-md border border-[#CED0D4] bg-white px-3 py-1.5 text-xs font-semibold text-[#2D2926] transition hover:bg-[#F0F2F5]"
          >
            Ver vitrine
            <ExternalLink className="h-3.5 w-3.5" aria-hidden />
          </Link>
        ) : null}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {SETTINGS_SECTIONS.map(({ href, title, description, icon: Icon }) => {
          const hint = SECTION_HINT[href]?.(status);
          return (
            <SettingsCard
              key={href}
              href={href}
              title={title}
              description={description}
              icon={Icon}
              iconClass={ICON_TONE[href]}
              hint={hint}
            />
          );
        })}
      </div>
    </div>
  );
}

function SettingsCard({
  href,
  title,
  description,
  icon: Icon,
  iconClass,
  hint,
}: {
  href: string;
  title: string;
  description: string;
  icon: LucideIcon;
  iconClass?: string;
  hint?: { label: string; tone: "ok" | "warn" | "neutral" };
}) {
  return (
    <Link
      href={href}
      className="group flex items-start gap-3.5 rounded-lg border border-[#E8E2DE] bg-white p-4 transition hover:border-[#CED0D4] hover:bg-[#FAFAF9]"
    >
      <div
        className={cn(
          "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl",
          iconClass || "bg-[#F0F2F5] text-[#2D2926]",
        )}
      >
        <Icon className="h-5 w-5" aria-hidden />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h2 className="text-sm font-semibold text-[#2D2926]">{title}</h2>
            {hint ? (
              <div className="mt-1">
                <StatusPill label={hint.label} tone={hint.tone} />
              </div>
            ) : null}
          </div>
          <ChevronRight
            className="mt-0.5 h-4 w-4 shrink-0 text-[#8C8682] transition group-hover:translate-x-0.5 group-hover:text-[#2D2926]"
            aria-hidden
          />
        </div>
        <p className="mt-1.5 text-sm leading-snug text-[#8C8682]">
          {description}
        </p>
      </div>
    </Link>
  );
}
