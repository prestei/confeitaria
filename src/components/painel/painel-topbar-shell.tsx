"use client";

import { usePathname } from "next/navigation";

export function PainelTopbarShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  if (pathname === "/painel") return null;
  return children;
}
