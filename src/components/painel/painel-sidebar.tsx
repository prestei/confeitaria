"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { cn } from "@/lib/cn";
import { NAV_SECTIONS, isNavActive } from "@/lib/painel-nav";
import { DocePedidoMark } from "@/components/painel/docepedido-mark";

/** Mesma altura do PainelTopbar: py-3 + linha interna h-9. */
const BRAND_ROW =
  "flex shrink-0 items-center border-b border-white/10 px-4 py-3";

export function PainelSidebar({
  storeName,
  badges = {},
}: {
  storeName: string;
  userName: string;
  storeSlug?: string | null;
  plan?: string;
  badges?: { orders?: number; stock?: number };
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const Brand = () => (
    <div className={BRAND_ROW}>
      <Link
        href="/painel"
        onClick={() => setOpen(false)}
        className="flex h-9 min-w-0 items-center gap-2.5"
        aria-label="DocePedido — início do painel"
      >
        <DocePedidoMark className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-lg" />
        <span className="truncate text-[15px] font-semibold tracking-tight text-white">
          DocePedido
        </span>
      </Link>
    </div>
  );

  const Nav = ({ onDark = true }: { onDark?: boolean }) => (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-3 py-4">
      <nav className="flex flex-col gap-3.5" aria-label="Painel">
        {NAV_SECTIONS.map((section) => (
          <div key={section.id}>
            {section.label ? (
              <p
                className={cn(
                  "mb-1 px-3 text-[10px] font-semibold uppercase tracking-[0.14em]",
                  onDark ? "text-white/40" : "text-[#9AA0A6]",
                )}
              >
                {section.label}
              </p>
            ) : null}
            <div className="flex flex-col gap-0.5">
              {section.items.map((l) => {
                const active = isNavActive(pathname, l.href);
                const Icon = l.icon;
                const badge =
                  l.badgeKey === "orders"
                    ? badges.orders
                    : l.badgeKey === "stock"
                      ? badges.stock
                      : undefined;
                return (
                  <Link
                    key={`${section.id}-${l.href}-${l.label}`}
                    href={l.href}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "flex items-center gap-2.5 rounded-xl px-3 py-2 text-[13px] font-medium transition",
                      onDark
                        ? active
                          ? "bg-[#5E4335] text-white shadow-sm"
                          : "text-white/75 hover:bg-white/[0.08] hover:text-white"
                        : active
                          ? "bg-[#483129] text-white"
                          : "text-[#5C656F] hover:bg-[#F3F4F6] hover:text-[#2D2926]",
                    )}
                  >
                    <Icon
                      className={cn(
                        "h-[18px] w-[18px] shrink-0",
                        active ? "opacity-100" : "opacity-70",
                      )}
                      strokeWidth={1.75}
                      aria-hidden
                    />
                    <span className="flex-1 truncate">{l.label}</span>
                    {badge != null && badge > 0 && (
                      <span
                        className={cn(
                          "flex h-5 min-w-5 items-center justify-center rounded px-1.5 text-[10px] font-bold",
                          l.badgeKey === "stock"
                            ? "bg-[#F5E8C8] text-[#8A6A2A]"
                            : "bg-[#E8A0A0] text-[#5C2A2A]",
                        )}
                      >
                        {badge > 99 ? "99+" : badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
    </div>
  );

  return (
    <>
      <aside className="hidden h-screen w-[15.5rem] shrink-0 flex-col overflow-hidden bg-[#483129] md:flex">
        <Brand />
        <Nav onDark />
      </aside>

      <div className="flex items-center justify-between border-b border-[#E4E6EB] bg-white px-4 py-3 md:hidden">
        <p className="min-w-0 truncate text-sm font-semibold text-[#483129]">
          {storeName}
        </p>
        <button
          type="button"
          className="rounded-xl border border-[#E8E2DE] bg-white p-2"
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
              className="absolute inset-0 bg-[#2D2926]/40"
              aria-label="Fechar"
              onClick={() => setOpen(false)}
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 280 }}
              className="absolute inset-y-0 left-0 flex w-[min(100%,17rem)] flex-col overflow-hidden bg-[#483129] shadow-xl"
            >
              <div className={cn(BRAND_ROW, "justify-between gap-2")}>
                <Link
                  href="/painel"
                  onClick={() => setOpen(false)}
                  className="flex h-9 min-w-0 items-center gap-2.5"
                  aria-label="DocePedido — início do painel"
                >
                  <DocePedidoMark className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-lg" />
                  <span className="truncate text-[15px] font-semibold tracking-tight text-white">
                    DocePedido
                  </span>
                </Link>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-xl p-2 text-white/70 hover:bg-white/10"
                  aria-label="Fechar"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <Nav onDark />
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
