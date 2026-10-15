import type { ReactNode } from "react";
import Link from "next/link";
import { type LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";
import { PainelMetricCard } from "@/components/painel/metric-card";
import {
  buttonClassName,
  type ButtonVariant,
} from "@/components/ui/button-styles";

export function PageShell({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={cn("space-y-3 sm:space-y-4", className)}>{children}</div>;
}

/** Título do painel — páginas, painéis laterais e diálogos. */
export function PageTitle({
  as: Tag = "h1",
  children,
  className,
  id,
}: {
  as?: "h1" | "h2";
  children: React.ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <Tag
      id={id}
      className={cn(
        "font-sans text-base font-bold leading-tight tracking-tight text-[var(--painel-brand,#0f352e)] sm:text-xl",
        className,
      )}
    >
      {children}
    </Tag>
  );
}

export function PageHeader({
  title,
  description,
  actions,
  className,
}: {
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <header className={className}>
      <div className="flex items-start justify-between gap-2 sm:gap-3">
        <div className="min-w-0 flex-1">
          <PageTitle>{title}</PageTitle>
          {description ? (
            <p
              className="mt-1 max-w-2xl text-pretty text-[13px] leading-snug text-[var(--painel-muted,#6b7280)] sm:mt-1.5 sm:text-sm sm:leading-normal"
            >
              {description}
            </p>
          ) : null}
        </div>
        {actions ? (
          <div className="flex shrink-0 items-center gap-2 pt-0.5">
            {actions}
          </div>
        ) : null}
      </div>
    </header>
  );
}

/** Ação do cabeçalho — mesmo Button do design system. */
export function PageAction({
  children,
  href,
  onClick,
  type = "button",
  variant = "primary",
  className,
  "aria-label": ariaLabel,
}: {
  children: React.ReactNode;
  href?: string;
  onClick?: () => void;
  type?: "button" | "submit";
  variant?: Extract<ButtonVariant, "primary" | "secondary" | "accent" | "ghost">;
  className?: string;
  "aria-label"?: string;
}) {
  const styles = buttonClassName({ variant, className });

  if (href) {
    return (
      <Link href={href} className={styles} aria-label={ariaLabel}>
        {children}
      </Link>
    );
  }

  return (
    <button
      type={type}
      onClick={onClick}
      className={styles}
      aria-label={ariaLabel}
    >
      {children}
    </button>
  );
}

export function SectionCard({
  title,
  action,
  children,
  className,
}: {
  title?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "overflow-hidden rounded-lg border border-[var(--painel-border)] bg-white",
        className,
      )}
    >
      {(title || action) && (
        <div className="flex items-center justify-between gap-3 border-b border-[var(--painel-border)] px-4 py-3">
          {title ? (
            <h2 className="text-sm font-semibold text-cocoa">{title}</h2>
          ) : (
            <span />
          )}
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

export function StatTile({
  label,
  value,
  hint,
  href,
  icon,
}: {
  label: string;
  value: string | number;
  hint?: string;
  href?: string;
  icon?: LucideIcon;
}) {
  return (
    <PainelMetricCard
      label={label}
      value={value}
      hint={hint}
      href={href}
      icon={icon}
    />
  );
}

export function StatusDot({
  tone = "neutral",
  label,
}: {
  tone?: "success" | "warning" | "danger" | "neutral" | "info";
  label: string;
}) {
  const colors = {
    success: "bg-success",
    warning: "bg-warning",
    danger: "bg-berry",
    neutral: "bg-[#B0AAA6]",
    info: "bg-[#5B8FB8]",
  };
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[#65676B]">
      <span className={cn("h-1.5 w-1.5 rounded-full", colors[tone])} />
      {label}
    </span>
  );
}

export function SoftLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="text-sm font-medium text-[#C85A5A] hover:underline"
    >
      {children}
    </Link>
  );
}

export function IconAction({
  icon: Icon,
  label,
  onClick,
  href,
}: {
  icon: LucideIcon;
  label: string;
  onClick?: () => void;
  href?: string;
}) {
  const className =
    "inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-md text-[#8C8682] transition hover:bg-[#F0F2F5] hover:text-cocoa";
  if (href) {
    return (
      <Link href={href} className={className} aria-label={label} title={label}>
        <Icon className="h-4 w-4" />
      </Link>
    );
  }
  return (
    <button
      type="button"
      onClick={onClick}
      className={className}
      aria-label={label}
      title={label}
    >
      <Icon className="h-4 w-4" />
    </button>
  );
}

/** @deprecated Importe de `@/components/ui/filter-chip`. Reexport para compat. */
export { FilterChip, FilterChipGroup } from "@/components/ui/filter-chip";
export { ListFilterBar } from "@/components/ui/list-filter-bar";
export type { ListFilterOption } from "@/components/ui/list-filter-bar";
