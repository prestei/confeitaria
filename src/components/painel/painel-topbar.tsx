"use client";

import Link from "next/link";
import { Bell, ChevronDown } from "lucide-react";
import { useMemo, useState } from "react";

export function PainelTopbar({
  storeName,
  storeLogoUrl,
  userName,
  userImage,
  notificationCount = 0,
}: {
  storeName?: string;
  storeLogoUrl?: string | null;
  storeSlug?: string | null;
  userName: string;
  userImage?: string | null;
  notificationCount?: number;
}) {
  const [openNotifs, setOpenNotifs] = useState(false);

  const displayName = userName.trim() || storeName?.trim() || "Confeiteira";
  const bakeryName = storeName?.trim() || "Sua confeitaria";

  const userInitials = useMemo(() => {
    return displayName
      .split(" ")
      .slice(0, 2)
      .map((p) => p[0])
      .join("")
      .toUpperCase();
  }, [displayName]);

  const storeInitials = useMemo(() => {
    return bakeryName
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0])
      .join("")
      .toUpperCase();
  }, [bakeryName]);

  return (
    <header className="shrink-0 border-b border-[#E4E6EB] bg-white px-4 py-3 sm:px-6 lg:px-8 xl:px-10">
      <div className="flex h-9 items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-2.5">
          {storeLogoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={storeLogoUrl}
              alt=""
              className="h-8 w-8 shrink-0 rounded-lg object-cover ring-1 ring-[#E4E6EB]"
            />
          ) : (
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#F3D5C8] text-[11px] font-bold uppercase tracking-wide text-[#3D2B1F]">
              {storeInitials}
            </span>
          )}
          <p className="min-w-0 truncate font-sans text-[15px] font-semibold leading-none tracking-tight text-[#3D2B1F]">
            {bakeryName}
          </p>
        </div>

        <div className="flex h-9 shrink-0 items-center gap-2">
          <div className="relative">
            <button
              type="button"
              onClick={() => setOpenNotifs((v) => !v)}
              className="relative inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded border border-[#CED0D4] bg-white text-[#6B6560] transition hover:bg-[#F0F2F5]"
              aria-label="Notificações"
              aria-expanded={openNotifs}
            >
              <Bell className="h-4 w-4" strokeWidth={1.75} />
              {notificationCount > 0 && (
                <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-[#E05A5A] ring-2 ring-white" />
              )}
            </button>
            {openNotifs && (
              <div className="absolute right-0 z-30 mt-2 w-72 overflow-hidden rounded-xl border border-[#E4E6EB] bg-white shadow-lg">
                <div className="border-b border-[#E4E6EB] px-4 py-3">
                  <p className="text-sm font-semibold text-[#3D2B1F]">
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
                      Abrir encomendas
                    </Link>
                  </div>
                )}
              </div>
            )}
          </div>

          <button
            type="button"
            className="inline-flex h-9 cursor-pointer items-center gap-2 rounded border border-[#CED0D4] bg-white py-0 pl-1 pr-2.5 transition hover:bg-[#F0F2F5] sm:pr-3"
          >
            {userImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={userImage}
                alt=""
                className="h-7 w-7 shrink-0 rounded-full object-cover"
              />
            ) : (
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#F3D5C8] text-[10px] font-bold uppercase leading-none tracking-wide text-[#3D2B1F]">
                {userInitials}
              </span>
            )}
            <span className="hidden max-w-38 truncate text-[12px] font-semibold leading-none text-[#3D2B1F] sm:inline">
              {displayName}
            </span>
            <ChevronDown
              className="hidden h-3.5 w-3.5 shrink-0 text-[#A39B95] sm:block"
              strokeWidth={2}
              aria-hidden
            />
          </button>
        </div>
      </div>
    </header>
  );
}
