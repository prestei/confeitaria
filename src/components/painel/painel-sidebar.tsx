"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  CalendarDays,
  Users,
  Settings,
  Store,
  Menu,
  X,
  QrCode,
} from "lucide-react";
import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { cn } from "@/lib/cn";

const links = [
  { href: "/painel", label: "Dashboard", icon: LayoutDashboard },
  { href: "/painel/pedidos", label: "Pedidos", icon: ShoppingBag },
  { href: "/painel/produtos", label: "Produtos", icon: Package },
  { href: "/painel/agenda", label: "Agenda", icon: CalendarDays },
  { href: "/painel/clientes", label: "Clientes", icon: Users },
  { href: "/painel/qrcode", label: "QR Code", icon: QrCode },
  { href: "/painel/loja", label: "Configurações", icon: Settings },
];

export function PainelSidebar({
  storeName,
  storeSlug,
}: {
  storeName: string;
  storeSlug: string | null;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const Nav = (
    <nav className="flex flex-1 flex-col gap-1 p-3" aria-label="Painel">
      {links.map((l) => {
        const active =
          l.href === "/painel"
            ? pathname === "/painel"
            : pathname.startsWith(l.href);
        const Icon = l.icon;
        return (
          <Link
            key={l.href}
            href={l.href}
            onClick={() => setOpen(false)}
            className={cn(
              "flex items-center gap-3 rounded-2xl px-3.5 py-2.5 text-sm font-medium transition",
              active
                ? "bg-cocoa text-white shadow-sm"
                : "text-cocoa-soft hover:bg-white hover:text-cocoa",
            )}
          >
            <Icon className="h-4 w-4 shrink-0" aria-hidden />
            {l.label}
          </Link>
        );
      })}
      {storeSlug && (
        <Link
          href={`/${storeSlug}`}
          target="_blank"
          onClick={() => setOpen(false)}
          className="mt-auto flex items-center gap-3 rounded-2xl px-3.5 py-2.5 text-sm font-medium text-berry-deep hover:bg-blush/60"
        >
          <Store className="h-4 w-4" aria-hidden />
          Ver cardápio
        </Link>
      )}
    </nav>
  );

  return (
    <>
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-cocoa/8 bg-cream/95 lg:flex">
        <div className="border-b border-cocoa/8 px-5 py-5">
          <Link href="/painel" className="font-display text-2xl text-cocoa">
            Doce<span className="text-berry">Pedido</span>
          </Link>
          <p className="mt-1 truncate text-sm text-cocoa-soft/70">{storeName}</p>
        </div>
        {Nav}
      </aside>

      <div className="sticky top-0 z-30 flex items-center justify-between border-b border-cocoa/8 bg-cream/95 px-4 py-3 backdrop-blur lg:hidden">
        <div>
          <p className="font-display text-lg text-cocoa">Painel</p>
          <p className="text-xs text-cocoa-soft/70">{storeName}</p>
        </div>
        <button
          type="button"
          className="rounded-xl border border-cocoa/10 bg-white p-2"
          onClick={() => setOpen(true)}
          aria-label="Abrir menu"
        >
          <Menu className="h-5 w-5" />
        </button>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div className="fixed inset-0 z-50 lg:hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <button
              type="button"
              className="absolute inset-0 bg-cocoa/40"
              aria-label="Fechar"
              onClick={() => setOpen(false)}
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 280 }}
              className="absolute inset-y-0 left-0 flex w-[min(100%,18rem)] flex-col bg-cream shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-cocoa/8 px-4 py-4">
                <span className="font-display text-lg text-cocoa">{storeName}</span>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-xl p-2 hover:bg-cocoa/5"
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
