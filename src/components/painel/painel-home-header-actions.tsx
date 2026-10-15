"use client";

import Link from "next/link";
import { Bell, CalendarDays, ChevronDown } from "lucide-react";
import { useState } from "react";

export function PainelHomeHeaderActions({
  notificationCount = 0,
  userName,
  userInitials,
  dateLabel,
}: {
  notificationCount?: number;
  userName: string;
  userInitials: string;
  dateLabel: string;
}) {
  const [openNotifs, setOpenNotifs] = useState(false);

  return (
    <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
      <button
        type="button"
        className="inline-flex h-9 items-center gap-2 rounded-lg border border-[#E4E6EB] bg-white px-3 text-sm font-medium text-[#3D2B1F] shadow-sm"
        aria-label="Data selecionada"
      >
        <CalendarDays className="h-4 w-4 text-[#6B6560]" strokeWidth={1.75} />
        <span className="hidden sm:inline">{dateLabel}</span>
        <ChevronDown className="h-4 w-4 text-[#9CA3AF]" aria-hidden />
      </button>

      <div className="relative">
        <button
          type="button"
          onClick={() => setOpenNotifs((v) => !v)}
          className="relative inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg border border-[#E4E6EB] bg-white text-[#6B6560] transition hover:bg-[#F8FAFC]"
          aria-label="Notificações"
          aria-expanded={openNotifs}
        >
          <Bell className="h-4 w-4" strokeWidth={1.75} />
          {notificationCount > 0 && (
            <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-[#E05A5A] ring-2 ring-white" />
          )}
        </button>
        {openNotifs && (
          <div className="absolute right-0 z-30 mt-2 w-72 overflow-hidden rounded-xl border border-[#E4E6EB] bg-white shadow-lg">
            <div className="border-b border-[#E4E6EB] px-4 py-3">
              <p className="text-sm font-semibold text-[var(--painel-brand,#0f352e)]">
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
                  className="mt-2 block font-medium text-[var(--painel-accent,#1e6b5c)]"
                  onClick={() => setOpenNotifs(false)}
                >
                  Abrir encomendas
                </Link>
              </div>
            )}
          </div>
        )}
      </div>

      <Link
        href="/painel/configuracoes"
        className="inline-flex h-9 max-w-[10rem] items-center gap-2 rounded-lg border border-[#E4E6EB] bg-white px-2.5 text-sm font-semibold text-[#3D2B1F] shadow-sm transition hover:bg-[#F8FAFC] sm:max-w-none sm:px-3"
      >
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#E8F0EE] text-[11px] font-bold text-[var(--painel-brand,#0f352e)]">
          {userInitials}
        </span>
        <span className="hidden truncate sm:inline">{userName}</span>
      </Link>
    </div>
  );
}
