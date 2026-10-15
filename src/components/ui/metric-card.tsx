import { type LucideIcon } from "lucide-react";
import { PainelMetricCard } from "@/components/painel/metric-card";

/** Métricas no painel — mesmo visual dos cards de insumos / home. */
export function MetricCard({
  label,
  value,
  hint,
  icon,
  className,
}: {
  label: string;
  value: string | number;
  hint?: string;
  icon?: LucideIcon;
  className?: string;
}) {
  return (
    <PainelMetricCard
      label={label}
      value={value}
      hint={hint}
      icon={icon}
      className={className}
    />
  );
}
