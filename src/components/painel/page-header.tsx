import Link from "next/link";
import { type LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";
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
  return <div className={cn("space-y-4", className)}>{children}</div>;
}

export function PageHeader({
  title,
  description,
  actions,
  className,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <header
      className={cn(
        "flex flex-wrap items-center justify-between gap-3",
        className,
      )}
    >
      <div className="min-w-0 flex-1">
        <h1 className="font-sans text-xl font-bold leading-tight tracking-tight text-[#2D2926] sm:text-2xl">
          {title}
        </h1>
        {description && (
          <p className="mt-0.5 max-w-2xl text-sm leading-snug text-[#8C8682]">
            {description}
          </p>
        )}
      </div>
      {actions ? (
        <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>
      ) : null}
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
}: {
  children: React.ReactNode;
  href?: string;
  onClick?: () => void;
  type?: "button" | "submit";
  variant?: Extract<ButtonVariant, "primary" | "secondary" | "accent" | "ghost">;
  className?: string;
}) {
  const styles = buttonClassName({ variant, className });

  if (href) {
    return (
      <Link href={href} className={styles}>
        {children}
      </Link>
    );
  }

  return (
    <button type={type} onClick={onClick} className={styles}>
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
        "overflow-hidden rounded-lg border border-[#E8E2DE] bg-white",
        className,
      )}
    >
      {(title || action) && (
        <div className="flex items-center justify-between gap-3 border-b border-[#E8E2DE] px-4 py-3">
          {title ? (
            <h2 className="text-sm font-semibold text-[#2D2926]">{title}</h2>
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
}: {
  label: string;
  value: string | number;
  hint?: string;
  href?: string;
}) {
  const content = (
    <>
      <p className="text-xs font-medium uppercase tracking-wide text-[#8C8682]">
        {label}
      </p>
      <p className="mt-2 text-2xl font-bold tabular-nums text-[#2D2926]">
        {value}
      </p>
      {hint && <p className="mt-1 text-xs text-[#8C8682]">{hint}</p>}
    </>
  );

  if (href) {
    return (
      <Link
        href={href}
        className="block rounded-lg border border-[#E8E2DE] bg-white px-4 py-3.5 transition hover:border-[#CED0D4]"
      >
        {content}
      </Link>
    );
  }

  return (
    <div className="rounded-lg border border-[#E8E2DE] bg-white px-4 py-3.5">
      {content}
    </div>
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
    "inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-md text-[#8C8682] transition hover:bg-[#F0F2F5] hover:text-[#2D2926]";
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
