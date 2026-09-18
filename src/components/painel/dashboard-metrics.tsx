"use client";

import {
  CalendarDays,
  Package,
  ShoppingBag,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { AnimatedNumber } from "@/components/ui/animated-number";
import { formatBRL } from "@/lib/utils";

const iconMap = {
  orders: ShoppingBag,
  calendar: CalendarDays,
  products: Package,
  revenue: Wallet,
  customers: Users,
} as const;

type Metric = {
  label: string;
  value: number;
  icon: keyof typeof iconMap;
  money?: boolean;
};

export function DashboardMetrics({ metrics }: { metrics: Metric[] }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
      {metrics.map((m) => {
        const Icon: LucideIcon = iconMap[m.icon];
        return (
          <Card key={m.label} className="p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-cocoa-soft/70">{m.label}</p>
                <p className="mt-2 font-display text-3xl tracking-tight text-cocoa">
                  <AnimatedNumber
                    value={m.value}
                    format={
                      m.money
                        ? (n) => formatBRL(Math.round(n))
                        : (n) => String(Math.round(n))
                    }
                  />
                </p>
              </div>
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-blush text-berry">
                <Icon className="h-5 w-5" aria-hidden />
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
