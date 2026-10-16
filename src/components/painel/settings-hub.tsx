import Link from "next/link";
import {
  ChevronRight,
  ExternalLink,
  Info,
  ShieldCheck,
  Store,
  type LucideIcon,
} from "lucide-react";
import { SETTINGS_SECTIONS } from "@/components/painel/settings-sections";
import { cn } from "@/lib/cn";

export type SettingsHubStatus = {
  storeName: string;
  planLabel: string;
  isPublished: boolean;
  storeSlug: string | null;
};

const SECTION_ICON_TONE: Record<string, string> = {
  "/painel/configuracoes/estabelecimento":
    "bg-[#E8F3EF] text-[var(--painel-brand,#0f352e)]",
  "/painel/configuracoes/atendimento": "bg-[#FFF4E8] text-[#C45C26]",
  "/painel/configuracoes/horarios": "bg-[#E8F3EF] text-[#1e6b5c]",
  "/painel/configuracoes/agendamento": "bg-[#F3EEF9] text-[#6B4E9B]",
  "/painel/configuracoes/geral": "bg-[#E8F0FA] text-[#3B6EA8]",
};

export function SettingsHub({ status }: { status: SettingsHubStatus }) {
  const planLine = `Plano ${status.planLabel} · Sua vitrine online e profissional`;

  return (
    <div className="space-y-4">
      <div
        className="flex flex-col gap-4 rounded-xl border border-[var(--painel-border)] bg-white p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5"
      >
        <div className="flex min-w-0 items-start gap-3.5 sm:items-center">
          <div
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#E8F3EF] text-[var(--painel-brand,#0f352e)]"
            aria-hidden
          >
            <Store className="h-6 w-6" />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-base font-bold text-[var(--painel-brand,#0f352e)]">
                {status.storeName}
              </p>
              <span
                className={cn(
                  "inline-flex rounded-md px-2 py-0.5 text-[11px] font-semibold",
                  status.isPublished
                    ? "bg-[#E8F3EF] text-[#1e6b5c]"
                    : "bg-[#F0F2F5] text-[#65676B]",
                )}
              >
                {status.isPublished ? "Vitrine publicada" : "Vitrine oculta"}
              </span>
            </div>
            <p className="mt-1 text-sm text-[var(--painel-muted,#6b7280)]">
              {planLine}
            </p>
          </div>
        </div>
        {status.storeSlug ? (
          <Link
            href={`/${status.storeSlug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-lg border border-[#CED0D4] bg-white px-4 py-2 text-sm font-semibold text-[var(--painel-brand,#0f352e)] transition hover:bg-[#F9FAFB]"
          >
            Ver vitrine
            <ExternalLink className="h-4 w-4" aria-hidden />
          </Link>
        ) : null}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {SETTINGS_SECTIONS.map(({ href, title, description, icon: Icon }) => (
          <SettingsCard
            key={href}
            href={href}
            title={title}
            description={description}
            icon={Icon}
            iconClass={SECTION_ICON_TONE[href]}
          />
        ))}
      </div>

      <div
        className="flex flex-col gap-3 rounded-xl border border-[#C5E0D8] bg-[#EEF7F4] px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:px-5"
      >
        <div className="flex min-w-0 items-start gap-3">
          <span
            className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#D4EBE4] text-[#1e6b5c]"
            aria-hidden
          >
            <Info className="h-4 w-4" />
          </span>
          <p className="text-sm leading-snug text-[var(--painel-brand,#0f352e)]">
            <span className="font-semibold">
              Todas as alterações são salvas automaticamente.
            </span>{" "}
            <span className="text-[var(--painel-muted,#6b7280)]">
              Mantenha seus dados sempre atualizados para garantir o melhor
              funcionamento da sua loja.
            </span>
          </p>
        </div>
        <p
          className="inline-flex shrink-0 items-center gap-1.5 text-sm font-medium text-[#1e6b5c] sm:pl-2"
        >
          <ShieldCheck className="h-4 w-4" aria-hidden />
          Ambiente seguro
        </p>
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
}: {
  href: string;
  title: string;
  description: string;
  icon: LucideIcon;
  iconClass?: string;
}) {
  return (
    <Link
      href={href}
      className="group flex items-center gap-3.5 rounded-xl border border-[var(--painel-border)] bg-white p-4 transition hover:border-[#CED0D4] hover:bg-[#FAFAF9] sm:p-5"
    >
      <div
        className={cn(
          "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl",
          iconClass || "bg-[#F0F2F5] text-cocoa",
        )}
      >
        <Icon className="h-5 w-5" aria-hidden />
      </div>
      <div className="min-w-0 flex-1">
        <h2 className="text-sm font-bold text-[var(--painel-brand,#0f352e)]">
          {title}
        </h2>
        <p className="mt-1 text-sm leading-snug text-[var(--painel-muted,#6b7280)]">
          {description}
        </p>
      </div>
      <ChevronRight
        className="h-5 w-5 shrink-0 text-[#B0AAA6] transition group-hover:translate-x-0.5 group-hover:text-[var(--painel-brand,#0f352e)]"
        aria-hidden
      />
    </Link>
  );
}
