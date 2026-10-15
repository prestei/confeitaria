"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { Camera, MapPin, MessageCircle } from "lucide-react";
import { digitsOnly } from "@/lib/utils";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { trackStoreEvent } from "@/lib/analytics";

export function StoreFooter({
  store,
}: {
  store: {
    slug: string;
    name: string;
    logoUrl: string | null;
    whatsapp: string;
    city: string | null;
    address: string | null;
    tagline?: string | null;
  };
}) {
  const reduced = useReducedMotion();
  const wa = `https://wa.me/55${digitsOnly(store.whatsapp)}`;
  const location = [store.address, store.city].filter(Boolean).join(" · ");
  const phoneDisplay = store.whatsapp.replace(
    /(\d{2})(\d{4,5})(\d{4})/,
    "($1) $2-$3",
  );

  function trackWhatsApp() {
    trackStoreEvent({
      storeSlug: store.slug,
      type: "WHATSAPP_CLICK",
      source: "footer",
    });
  }

  return (
    <footer className="bg-[var(--store-chrome)] text-[var(--store-chrome-fg)]">
      <div className="shell grid gap-10 py-14 md:grid-cols-[1.2fr_1fr] md:gap-16">
        <div>
          <p className="font-display text-3xl tracking-tight">{store.name}</p>
          {store.tagline && (
            <p className="mt-2 max-w-md text-sm leading-relaxed opacity-60">
              {store.tagline}
            </p>
          )}
          {location && (
            <p className="mt-5 flex items-start gap-2 text-sm opacity-80">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-terracotta" />
              {location}
            </p>
          )}
          <motion.a
            href={wa}
            target="_blank"
            rel="noreferrer"
            onClick={trackWhatsApp}
            whileHover={reduced ? undefined : { y: -1 }}
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-rosewood px-4 py-2.5 text-sm font-semibold text-white"
          >
            <MessageCircle className="h-4 w-4" />
            {phoneDisplay || "WhatsApp"}
          </motion.a>
        </div>

        <div className="grid grid-cols-2 gap-8 text-sm sm:grid-cols-3">
          <div className="space-y-2.5">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-terracotta">
              Explorar
            </p>
            <a href="#destaques" className="block opacity-70 hover:opacity-100">
              Destaques
            </a>
            <a href="#cardapio" className="block opacity-70 hover:opacity-100">
              Cardápio
            </a>
            <Link
              href={`/${store.slug}/encomenda`}
              className="block opacity-70 hover:opacity-100"
            >
              Encomenda
            </Link>
          </div>
          <div className="space-y-2.5">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-terracotta">
              Pedido
            </p>
            <Link
              href={`/${store.slug}/carrinho`}
              className="block opacity-70 hover:opacity-100"
            >
              Carrinho
            </Link>
            <a
              href={wa}
              target="_blank"
              rel="noreferrer"
              onClick={trackWhatsApp}
              className="block opacity-70 hover:opacity-100"
            >
              WhatsApp
            </a>
          </div>
          <div className="col-span-2 space-y-2.5 sm:col-span-1">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-terracotta">
              Redes
            </p>
            <span className="inline-flex items-center gap-2 opacity-50">
              <Camera className="h-4 w-4" />
              Em breve
            </span>
          </div>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="shell flex flex-col gap-2 py-4 text-xs opacity-40 sm:flex-row sm:items-center sm:justify-between">
          <p>Feito com cuidado para quem vende e para quem encomenda.</p>
          <p>Powered by DocePedido</p>
        </div>
      </div>
    </footer>
  );
}
