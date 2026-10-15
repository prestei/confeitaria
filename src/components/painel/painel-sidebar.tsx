"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Menu,
  MoreHorizontal,
  Package,
  Settings,
  X,
} from "lucide-react";
import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { cn } from "@/lib/cn";
import { NAV_SECTIONS, isNavActive } from "@/lib/painel-nav";
import { DoceLinkMark } from "@/components/painel/doce-link-mark";

const SIDEBAR_BG = "bg-[#2A2522]";
const SIDEBAR_BORDER = "border-[#3D3632]";
const BRAND_ROW = cn(
  "flex shrink-0 items-center border-b px-4 py-4",
  SIDEBAR_BORDER,
);

export function PainelSidebar({
  storeName,
  badges = {},
}: {
  storeName: string;
  storeLogoUrl?: string | null;
  storeSlug?: string | null;
  plan?: string;
  badges?: { orders?: number; stock?: number };
  onLogout?: () => Promise<void>;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const Brand = () => (
    <div className={BRAND_ROW}>
      <Link
        href="/painel"
        onClick={() => setOpen(false)}
        className="flex h-9 min-w-0 items-center gap-2.5"
        aria-label="Doce Link — início do painel"
      >
        <DoceLinkMark className="h-9 w-9" />
        <span className="truncate text-[17px] font-semibold tracking-tight text-[#F5EDE8]">
          Doce Link
        </span>
      </Link>
    </div>
  );

  const Nav = () => (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-2 py-3">
      <nav className="flex flex-col gap-0.5" aria-label="Painel">
        {NAV_SECTIONS.flatMap((section) =>
          section.items.map((l) => {
            const active = isNavActive(pathname, l.href);
            const Icon = l.icon;
            const badge =
              l.badgeKey === "stock" ? badges.stock : undefined;
            return (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-[13px] font-medium transition",
                  active
                    ? "bg-[#C45B7A]/20 text-[#FCE4EC] ring-1 ring-[#C45B7A]/35"
                    : "text-[#B8AEA8] hover:bg-white/5 hover:text-[#F5EDE8]",
                )}
              >
                <Icon
                  className={cn(
                    "h-[18px] w-[18px] shrink-0",
                    active ? "text-[#F4A9BC]" : "opacity-80",
                  )}
                  strokeWidth={1.75}
                  aria-hidden
                />
                <span className="flex-1 truncate">{l.label}</span>
                {badge != null && badge > 0 && (
                  <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[#8A6A2A]/90 px-1.5 text-[10px] font-bold text-[#F5E8C8]">
                    {badge > 99 ? "99+" : badge}
                  </span>
                )}
              </Link>
            );
          }),
        )}
      </nav>
    </div>
  );

  return (
    <>
      <aside
        className={cn(
          "hidden h-screen w-[15.75rem] shrink-0 flex-col overflow-hidden border-r md:flex",
          SIDEBAR_BG,
          SIDEBAR_BORDER,
        )}
      >
        <Brand />
        <Nav />
      </aside>

      <div
        className={cn(
          "flex items-center justify-between border-b px-4 py-3 md:hidden",
          SIDEBAR_BG,
          SIDEBAR_BORDER,
        )}
      >
        <div className="flex items-center gap-2">
          <DoceLinkMark className="h-8 w-8" />
          <p className="min-w-0 truncate text-sm font-semibold text-[#F5EDE8]">
            {storeName}
          </p>
        </div>
        <button
          type="button"
          className="rounded-xl border border-[#4A4340] bg-[#332E2B] p-2 text-[#F5EDE8]"
          onClick={() => setOpen(true)}
          aria-label="Abrir menu"
        >
          <Menu className="h-5 w-5" />
        </button>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-50 md:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <button
              type="button"
              className="absolute inset-0 bg-[#1A1715]/60"
              aria-label="Fechar"
              onClick={() => setOpen(false)}
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 280 }}
              className={cn(
                "absolute inset-y-0 left-0 flex w-[min(100%,18rem)] flex-col overflow-hidden border-r shadow-xl",
                SIDEBAR_BG,
                SIDEBAR_BORDER,
              )}
            >
              <div className={cn(BRAND_ROW, "justify-between gap-2")}>
                <Link
                  href="/painel"
                  onClick={() => setOpen(false)}
                  className="flex h-9 min-w-0 items-center gap-2.5"
                >
                  <DoceLinkMark className="h-9 w-9" />
                  <span className="truncate text-[17px] font-semibold text-[#F5EDE8]">
                    Doce Link
                  </span>
                </Link>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-xl p-2 text-[#B8AEA8] hover:bg-white/5"
                  aria-label="Fechar"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <Nav />
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>

      <nav
        className={cn(
          "fixed inset-x-0 bottom-0 z-40 grid grid-cols-4 border-t pb-[env(safe-area-inset-bottom)] md:hidden",
          SIDEBAR_BG,
          SIDEBAR_BORDER,
        )}
      >
        <MobileTab
          href="/painel"
          label="Início"
          icon={LayoutDashboard}
          pathname={pathname}
        />
        <MobileTab
          href="/painel/produtos"
          label="Produtos"
          icon={Package}
          pathname={pathname}
        />
        <MobileTab
          href="/painel/configuracoes"
          label="Config."
          icon={Settings}
          pathname={pathname}
        />
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex flex-col items-center gap-1 py-2 text-[11px] font-medium text-[#B8AEA8]"
        >
          <MoreHorizontal className="h-5 w-5" />
          Mais
        </button>
      </nav>
    </>
  );
}

function MobileTab({
  href,
  label,
  icon: Icon,
  pathname,
}: {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  pathname: string;
}) {
  const active = isNavActive(pathname, href);
  return (
    <Link
      href={href}
      className={cn(
        "flex flex-col items-center gap-1 py-2 text-[11px] font-medium",
        active ? "text-[#F4A9BC]" : "text-[#B8AEA8]",
      )}
    >
      <Icon className="h-5 w-5" />
      {label}
    </Link>
  );
}
