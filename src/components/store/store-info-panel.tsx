"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { motion } from "motion/react";
import {
  Clock3,
  MapPin,
  MessageCircle,
  Truck,
  Wallet,
} from "lucide-react";
import { digitsOnly, formatBRL } from "@/lib/utils";
import { useReducedMotion } from "@/hooks/use-reduced-motion";

type Zone = { id: string; name: string; feeCents: number };

export function StoreInfoPanel({
  storeSlug,
  storeName,
  address,
  city,
  whatsapp,
  minAdvanceDays,
  productionNote,
  pickupEnabled,
  deliveryEnabled,
  deliveryZones,
  paymentMethods,
}: {
  storeSlug: string;
  storeName: string;
  address: string | null;
  city: string | null;
  whatsapp: string;
  minAdvanceDays: number;
  productionNote: string | null;
  pickupEnabled: boolean;
  deliveryEnabled: boolean;
  deliveryZones: Zone[];
  paymentMethods: string[];
}) {
  const ref = useRef<HTMLElement>(null);
  const reduced = useReducedMotion();
  const wa = `https://wa.me/55${digitsOnly(whatsapp)}?text=${encodeURIComponent(
    `Olá! Vim pelo cardápio da ${storeName} 😊`,
  )}`;
  const location = [address, city].filter(Boolean).join(" · ");

  useEffect(() => {
    if (reduced || !ref.current) return;
    let ctx: { revert: () => void } | undefined;
    let cancelled = false;

    (async () => {
      const gsap = (await import("gsap")).default;
      const { ScrollTrigger } = await import("gsap/ScrollTrigger");
      if (cancelled || !ref.current) return;
      gsap.registerPlugin(ScrollTrigger);

      ctx = gsap.context(() => {
        gsap.from("[data-close-block]", {
          opacity: 0,
          y: 32,
          duration: 0.8,
          stagger: 0.1,
          ease: "power3.out",
          immediateRender: false,
          scrollTrigger: {
            trigger: ref.current,
            start: "top 82%",
            once: true,
          },
        });
      }, ref);
    })();

    return () => {
      cancelled = true;
      ctx?.revert();
    };
  }, [reduced]);

  return (
    <section ref={ref} className="relative overflow-hidden">
      {/* Infos práticas */}
      <div className="bg-gradient-to-b from-sand to-ivory">
        <div className="shell grid gap-8 py-14 lg:grid-cols-[1.15fr_0.85fr] lg:gap-10 lg:py-16">
          <div data-close-block className="space-y-6">
            <div className="overflow-hidden rounded-2xl border border-cocoa/10 bg-surface shadow-[0_12px_40px_rgba(51,37,34,0.06)]">
              <div className="flex items-center gap-3 border-b border-cocoa/8 bg-rosewood/8 px-5 py-4">
                <Truck className="h-5 w-5 text-rosewood" aria-hidden />
                <div>
                  <p className="font-display text-xl text-cocoa">
                    Entrega e retirada
                  </p>
                  <p className="text-xs text-cocoa-soft">
                    Confira as opções disponíveis nesta loja
                  </p>
                </div>
              </div>
              <div className="p-5">
                <ul className="space-y-3">
                  {pickupEnabled && (
                    <li className="flex items-start gap-3 rounded-xl bg-sand/70 px-4 py-3">
                      <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-rosewood" />
                      <div>
                        <p className="text-sm font-semibold text-cocoa">
                          Retirada no local
                        </p>
                        {location && (
                          <p className="mt-0.5 text-sm text-cocoa-soft">
                            {location}
                          </p>
                        )}
                      </div>
                    </li>
                  )}
                  {deliveryEnabled && deliveryZones.length > 0 && (
                    <li className="rounded-xl bg-sand/70 px-4 py-3">
                      <p className="mb-3 flex items-center gap-2 text-sm font-semibold text-cocoa">
                        <Truck className="h-4 w-4 text-rosewood" />
                        Entrega por região
                      </p>
                      <ul className="space-y-2">
                        {deliveryZones.map((z) => (
                          <li
                            key={z.id}
                            className="flex items-center justify-between gap-3 border-b border-cocoa/8 pb-2 text-sm last:border-0 last:pb-0"
                          >
                            <span className="text-cocoa-soft">{z.name}</span>
                            <span className="font-semibold text-cocoa">
                              {formatBRL(z.feeCents)}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </li>
                  )}
                  {!pickupEnabled &&
                    !deliveryEnabled &&
                    deliveryZones.length === 0 && (
                      <li className="text-sm text-cocoa-soft">
                        Consulte disponibilidade no WhatsApp
                      </li>
                    )}
                </ul>
              </div>
            </div>

            <div className="overflow-hidden rounded-2xl border border-cocoa/10 bg-surface shadow-[0_12px_40px_rgba(51,37,34,0.06)]">
              <div className="flex items-center gap-3 border-b border-cocoa/8 bg-terracotta/10 px-5 py-4">
                <Wallet className="h-5 w-5 text-terracotta" aria-hidden />
                <div>
                  <p className="font-display text-xl text-cocoa">Pagamento</p>
                  <p className="text-xs text-cocoa-soft">
                    Combine o melhor formato no atendimento
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 p-5">
                {paymentMethods.map((m) => (
                  <span
                    key={m}
                    className="rounded-full border border-rosewood/20 bg-blush/50 px-3.5 py-1.5 text-sm font-medium text-rosewood-deep"
                  >
                    {m}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <aside data-close-block className="flex flex-col gap-5">
            <div className="relative flex flex-1 flex-col overflow-hidden rounded-2xl bg-rosewood px-6 py-7 text-ivory shadow-[0_20px_50px_rgba(185,111,125,0.28)]">
              <div
                className="pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full bg-terracotta/30 blur-2xl"
                aria-hidden
              />
              <Clock3 className="h-6 w-6 text-terracotta" aria-hidden />
              <h4 className="mt-4 font-display text-2xl leading-tight">
                Prazos e encomendas
              </h4>
              <p className="mt-3 text-sm leading-relaxed text-ivory/80">
                {productionNote ||
                  (minAdvanceDays > 0
                    ? `Encomendas personalizadas pedem pelo menos ${minAdvanceDays} dia${minAdvanceDays > 1 ? "s" : ""} de antecedência.`
                    : "Peça com antecedência para garantir a data do seu evento.")}
              </p>
              {minAdvanceDays > 0 && (
                <p className="mt-5 inline-flex w-fit rounded-full bg-white/15 px-3 py-1.5 text-xs font-semibold text-ivory">
                  Antecedência mínima: {minAdvanceDays}{" "}
                  {minAdvanceDays === 1 ? "dia" : "dias"}
                </p>
              )}
              <div className="mt-auto flex flex-col gap-2.5 pt-8">
                <motion.a
                  href={wa}
                  target="_blank"
                  rel="noreferrer"
                  whileHover={reduced ? undefined : { y: -2 }}
                  whileTap={reduced ? undefined : { scale: 0.98 }}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-ivory px-5 py-3.5 text-sm font-semibold text-rosewood-deep"
                >
                  <MessageCircle className="h-4 w-4" />
                  Falar no WhatsApp
                </motion.a>
                <div className="flex flex-wrap gap-2">
                  <Link
                    href={`/${storeSlug}/carrinho`}
                    className="inline-flex flex-1 items-center justify-center rounded-xl border border-white/25 px-4 py-3 text-sm font-semibold text-ivory transition hover:bg-white/10"
                  >
                    Finalizar pedido
                  </Link>
                  <Link
                    href={`/${storeSlug}/encomenda`}
                    className="inline-flex flex-1 items-center justify-center rounded-xl border border-white/25 px-4 py-3 text-sm font-semibold text-ivory transition hover:bg-white/10"
                  >
                    Orçamento
                  </Link>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}
