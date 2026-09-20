"use client";

import Link from "next/link";
import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Menu, X } from "lucide-react";
import { useReducedMotion } from "@/hooks/use-reduced-motion";

const nav = [
  { href: "#produto", label: "Produto" },
  { href: "#como-funciona", label: "Como funciona" },
  { href: "#modos", label: "Modos de venda" },
  { href: "#experiencia", label: "Painel" },
];

export function LandingHeader() {
  const [open, setOpen] = useState(false);
  const reduced = useReducedMotion();

  return (
    <header className="shell relative z-30 flex items-center justify-between py-5 md:py-7">
      <Link
        href="/"
        className="font-display text-[1.65rem] leading-none tracking-tight text-cocoa md:text-[1.85rem]"
      >
        Doce<span className="text-rosewood">Pedido</span>
      </Link>

      <nav className="hidden items-center gap-8 lg:flex" aria-label="Principal">
        {nav.map((item) => (
          <a
            key={item.href}
            href={item.href}
            className="text-sm font-medium text-cocoa-soft transition-colors hover:text-cocoa"
          >
            {item.label}
          </a>
        ))}
      </nav>

      <div className="hidden items-center gap-2 sm:flex">
        <Link href="/entrar" className="btn-ghost !py-2.5 !px-3 text-sm">
          Entrar
        </Link>
        <motion.div
          whileHover={reduced ? undefined : { y: -1 }}
          whileTap={reduced ? undefined : { scale: 0.98 }}
        >
          <Link href="/cadastrar" className="btn-berry !py-2.5 !px-4 text-sm">
            Começar gratuitamente
          </Link>
        </motion.div>
      </div>

      <button
        type="button"
        className="flex h-10 w-10 items-center justify-center rounded-md border border-cocoa/10 bg-surface lg:hidden"
        onClick={() => setOpen(true)}
        aria-label="Abrir menu"
      >
        <Menu className="h-5 w-5" />
      </button>

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
              className="absolute inset-0 bg-cocoa/35"
              aria-label="Fechar"
              onClick={() => setOpen(false)}
            />
            <motion.aside
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 320 }}
              className="absolute inset-y-0 right-0 flex w-[min(100%,20rem)] flex-col bg-surface px-5 py-5 shadow-xl"
            >
              <div className="mb-8 flex items-center justify-between">
                <span className="font-display text-xl text-cocoa">Menu</span>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-md p-2 hover:bg-sand"
                  aria-label="Fechar"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <nav className="flex flex-col gap-1" aria-label="Mobile">
                {nav.map((item) => (
                  <a
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className="rounded-md px-3 py-3 text-base font-medium text-cocoa hover:bg-sand"
                  >
                    {item.label}
                  </a>
                ))}
              </nav>
              <div className="mt-auto flex flex-col gap-2 border-t border-cocoa/8 pt-5">
                <Link
                  href="/entrar"
                  onClick={() => setOpen(false)}
                  className="btn-secondary w-full"
                >
                  Entrar
                </Link>
                <Link
                  href="/cadastrar"
                  onClick={() => setOpen(false)}
                  className="btn-berry w-full"
                >
                  Começar gratuitamente
                </Link>
              </div>
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
