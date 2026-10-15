"use client";

import type { ReactNode } from "react";
import {
  PainelRouteSheet,
  type PainelSheetSize,
} from "@/components/painel/painel-route-sheet";

export function SettingsPageSheet({
  title,
  size = "lg",
  children,
}: {
  title: string;
  size?: PainelSheetSize;
  children: ReactNode;
}) {
  return (
    <PainelRouteSheet
      backHref="/painel/configuracoes"
      title={title}
      size={size}
    >
      {children}
    </PainelRouteSheet>
  );
}
