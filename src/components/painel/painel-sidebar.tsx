"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { HelpCircle, LogOut, Menu, Settings, X } from "lucide-react";
import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { cn } from "@/lib/cn";
import { NAV_SECTIONS, isNavActive } from "@/lib/painel-nav";
import { DocePedidoMark } from "@/components/painel/docepedido-mark";

export function PainelSidebar({
  storeName,
  userName,
  badges = {},
  signOutAction,
}: {
  storeName: string;
  userName: string;
  storeSlug?: string | null;
  plan?: string;
  badges?: { orders?: number; stock?: number };
  signOutAction: () => Promise<void>;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const initial = (userName.trim().charAt(0) || "U").toUpperCase();
  const profileLabel = `${userName.trim() || "Usuário"} (Admin)`;

  const Brand = ({ compact = false }: { compact?: boolean }) => (
    <Link
      href="/painel"
      onClick={() => setOpen(false)}
      className={cn("flex items-center gap-2.5", compact && "min-w-0")}
    >
      <DocePedidoMark className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-[10px]" />
      <div className="min-w-0">
        <span className="block text-[1.05rem] font-bold leading-none tracking-tight text-[#C85A5A]">
          DocePedido
        </span>
        <p className="mt-1 text-[9px] font-semibold uppercase tracking-[0.14em] text-[#9AA0A6]">
          Painel da sua loja
        </p>
      </div>
    </Link>
  );

  const Nav = (
    <>
      <div className="flex flex-1 flex-col overflow-y-auto px-3 py-2">
        <nav className="flex flex-col gap-4" aria-label="Painel">
          {NAV_SECTIONS.map((section) => (
            <div key={section.id}>
              <p className="mb-1 px-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#9AA0A6]">
                {section.label}
              </p>
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
                      key={l.href}
                      href={l.href}
                      onClick={() => setOpen(false)}
                      className={cn(
                        "flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-medium transition",
                        active
                          ? "bg-[#F8E8E8] text-[#C85A5A]"
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
                            "flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[10px] font-bold",
                            l.badgeKey === "stock"
                              ? "bg-[#F5E8C8] text-[#8A6A2A]"
                              : "bg-[#C85A5A] text-white",
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

      <div className="mt-auto border-t border-[#E5E7EB] px-3 py-2.5">
        <div className="space-y-0.5">
          <Link
            href="/painel/configuracoes"
            onClick={() => setOpen(false)}
            className={cn(
              "flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-medium transition",
              pathname.startsWith("/painel/configuracoes")
                ? "bg-[#F8E8E8] text-[#C85A5A]"
                : "text-[#5C656F] hover:bg-[#F3F4F6]",
            )}
          >
            <Settings className="h-[18px] w-[18px]" strokeWidth={1.75} />
            Configurações
          </Link>
          <a
            href="mailto:ajuda@docepedido.app"
            className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-medium text-[#5C656F] hover:bg-[#F3F4F6]"
          >
            <HelpCircle className="h-[18px] w-[18px]" strokeWidth={1.75} />
            Ajuda &amp; Suporte
          </a>
        </div>

        <div className="mt-2.5 flex items-center gap-2.5 border-t border-[#E5E7EB] px-1 pt-2.5">
          <span
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#1B2A4A] text-[13px] font-semibold text-white"
            aria-hidden
          >
            {initial}
          </span>
          <p className="min-w-0 flex-1 truncate text-[13px] font-medium text-[#5C656F]">
            {profileLabel}
          </p>
          <form action={signOutAction}>
            <button
              type="submit"
              className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[#5C656F] transition hover:bg-[#F3F4F6] hover:text-[#2D2926]"
              aria-label="Sair"
              title="Sair"
            >
              <LogOut className="h-4 w-4" strokeWidth={1.75} />
            </button>
          </form>
        </div>
      </div>
    </>
  );

  return (
    <>
      <aside className="sticky top-0 hidden h-screen w-[15.75rem] shrink-0 flex-col border-r border-[#E5E7EB] bg-white lg:flex">
        <div className="px-4 pb-1 pt-5">
          <Brand />
        </div>
        {Nav}
      </aside>

      <div className="sticky top-0 z-30 flex items-center justify-between border-b border-[#E5E7EB] bg-white px-4 py-3 lg:hidden">
        <div className="min-w-0">
          <Brand compact />
          <p className="mt-1 truncate pl-[2.875rem] text-xs text-[#8C8682]">
            {storeName}
          </p>
        </div>
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
            className="fixed inset-0 z-50 lg:hidden"
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
              className="absolute inset-y-0 left-0 flex w-[min(100%,17rem)] flex-col bg-white shadow-xl"
            >
              <div className="flex items-center justify-between px-4 py-4">
                <Brand compact />
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-xl p-2 hover:bg-[#F3F4F6]"
                  aria-label="Fechar"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              {Nav}
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
