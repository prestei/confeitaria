"use client";

import Link from "next/link";
import {
  Bell,
  ChevronDown,
  Clock,
  ExternalLink,
  MapPin,
  MessageCircle,
  Truck,
} from "lucide-react";
import { useMemo, useState } from "react";
import { formatPhone } from "@/lib/utils";

export function PainelTopbar({
  storeName,
  storeSlug,
  storeCity,
  storeWhatsapp,
  businessHours,
  isPublished = false,
  pickupEnabled = true,
  deliveryEnabled = true,
  planLabel = "Starter",
  userName,
  notificationCount = 0,
}: {
  storeName?: string;
  storeSlug?: string | null;
  storeCity?: string | null;
  storeWhatsapp?: string | null;
  businessHours?: string | null;
  isPublished?: boolean;
  pickupEnabled?: boolean;
  deliveryEnabled?: boolean;
  planLabel?: string;
  userName: string;
  notificationCount?: number;
}) {
  const [openNotifs, setOpenNotifs] = useState(false);

  const displayName = storeName?.trim() || userName;

  const initials = useMemo(() => {
    return displayName
      .split(" ")
      .slice(0, 2)
      .map((p) => p[0])
      .join("")
      .toUpperCase();
  }, [displayName]);

  const fulfillment = [
    pickupEnabled ? "Retirada" : null,
    deliveryEnabled ? "Entrega" : null,
  ]
    .filter(Boolean)
    .join(" · ");

  const hoursLabel = businessHours?.trim() || null;

  return (
    <header className="sticky top-0 z-20 border-b border-[#CED0D4] bg-[#F0F2F5]/95 backdrop-blur">
      <div className="flex items-center gap-4 px-4 py-3.5 sm:px-6 lg:px-8">
        <div className="hidden min-w-0 flex-1 items-center gap-3 md:flex">
          <span
            className={`inline-flex shrink-0 items-center gap-1.5 rounded-md px-2.5 py-1 text-[11px] font-semibold ${
              isPublished
                ? "bg-[#E8F5EC] text-[#2F7A4A]"
                : "bg-[#F3EEEA] text-[#8C8682]"
            }`}
            title={
              isPublished
                ? "Clientes podem ver e pedir na vitrine"
                : "Vitrine oculta — clientes não conseguem acessar"
            }
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                isPublished ? "bg-[#2F7A4A]" : "bg-[#B0AAA6]"
              }`}
            />
            {isPublished ? "Aberta" : "Fechada"}
          </span>

          {hoursLabel ? (
            <span className="hidden max-w-[14rem] items-center gap-1 truncate text-[13px] text-[#8C8682] lg:inline-flex">
              <Clock className="h-3.5 w-3.5 shrink-0" />
              {hoursLabel}
            </span>
          ) : null}

          {storeSlug ? (
            <Link
              href={`/${storeSlug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex max-w-[12rem] items-center gap-1 truncate text-[13px] font-medium text-[#5C5652] transition hover:text-[#C85A5A]"
            >
              /{storeSlug}
              <ExternalLink className="h-3 w-3 shrink-0 opacity-60" />
            </Link>
          ) : null}

          {storeCity ? (
            <span className="hidden items-center gap-1 truncate text-[13px] text-[#8C8682] xl:inline-flex">
              <MapPin className="h-3.5 w-3.5 shrink-0" />
              {storeCity}
            </span>
          ) : null}

          {storeWhatsapp ? (
            <span className="hidden items-center gap-1 truncate text-[13px] text-[#8C8682] 2xl:inline-flex">
              <MessageCircle className="h-3.5 w-3.5 shrink-0" />
              {formatPhone(storeWhatsapp)}
            </span>
          ) : null}

          {fulfillment ? (
            <span className="hidden items-center gap-1 truncate text-[13px] text-[#8C8682] 2xl:inline-flex">
              <Truck className="h-3.5 w-3.5 shrink-0" />
              {fulfillment}
            </span>
          ) : null}

          <span className="hidden rounded-md border border-[#E8E2DE] bg-white px-2 py-0.5 text-[11px] font-semibold text-[#6B6560] sm:inline">
            Plano {planLabel}
          </span>
        </div>

        <div className="ml-auto flex items-center gap-3">
          <div className="relative">
            <button
              type="button"
              onClick={() => setOpenNotifs((v) => !v)}
              className="relative inline-flex h-9 w-9 items-center justify-center rounded-full text-[#6B6560] transition hover:bg-[#F3EEEA]"
              aria-label="Notificações"
            >
              <Bell className="h-[18px] w-[18px]" strokeWidth={1.75} />
              {notificationCount > 0 && (
                <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-[#C85A5A]" />
              )}
            </button>
            {openNotifs && (
              <div className="absolute right-0 mt-2 w-72 overflow-hidden rounded-lg border border-[#E8E2DE] bg-white shadow-lg">
                <div className="border-b border-[#F0EBE7] px-4 py-3">
                  <p className="text-sm font-semibold text-[#2D2926]">
                    Notificações
                  </p>
                </div>
                {notificationCount === 0 ? (
                  <p className="px-4 py-6 text-center text-sm text-[#8C8682]">
                    Nenhuma novidade por agora.
                  </p>
                ) : (
                  <div className="px-4 py-3 text-sm text-[#5C5652]">
                    Você tem {notificationCount} pedido
                    {notificationCount > 1 ? "s" : ""} aguardando resposta.
                    <Link
                      href="/painel/pedidos"
                      className="mt-2 block font-medium text-[#C85A5A]"
                      onClick={() => setOpenNotifs(false)}
                    >
                      Abrir central
                    </Link>
                  </div>
                )}
              </div>
            )}
          </div>

          <button
            type="button"
            className="flex items-center gap-2.5 rounded-full py-1 pl-1 pr-2 transition hover:bg-[#F3EEEA]"
          >
            <div className="min-w-0 text-right">
              <p className="truncate text-[13px] font-semibold leading-tight text-[#2D2926]">
                {displayName}
              </p>
              <p className="truncate text-[11px] leading-tight text-[#8C8682]">
                {storeCity?.trim() || "Brasil"}
              </p>
            </div>
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#F3D5C8] text-[11px] font-bold text-[#2D2926]">
              {initials}
            </span>
            <ChevronDown className="h-3.5 w-3.5 shrink-0 text-[#8C8682]" />
          </button>
        </div>
      </div>
    </header>
  );
}
