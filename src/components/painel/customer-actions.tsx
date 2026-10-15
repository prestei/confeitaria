"use client";

import { useState } from "react";
import { MessageCircle, Store, UserPlus } from "lucide-react";
import { StatusDot } from "@/components/painel/page-header";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/cn";
import { whatsappLink } from "@/lib/utils";
import type { CustomerRow } from "@/components/painel/customers-table";

export function CustomerSourceBadge({
  source,
}: {
  source: CustomerRow["source"];
}) {
  if (source === "registered") {
    return <StatusDot tone="success" label="CRM" />;
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-fog/80 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-cocoa-soft">
      <Store className="h-3 w-3" aria-hidden />
      Vitrine
    </span>
  );
}

export function CustomerWhatsappButton({
  name,
  phone,
  className,
}: {
  name: string;
  phone: string;
  className?: string;
}) {
  const href = whatsappLink(
    phone,
    `Olá ${name}! Sobre seu pedido na nossa confeitaria…`,
  );
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "inline-flex w-fit items-center gap-1.5 rounded-lg border border-[#25D366]/25 bg-[#25D366]/8 px-2.5 py-1.5 text-xs font-semibold text-[#128C7E] transition hover:bg-[#25D366]/15",
        className,
      )}
    >
      <MessageCircle className="h-3.5 w-3.5" strokeWidth={2} />
      WhatsApp
    </a>
  );
}

export function RegisterFromVitrineButton({
  name,
  phone,
  email,
}: {
  name: string;
  phone: string;
  email: string | null;
}) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  async function register() {
    setLoading(true);
    const res = await fetch("/api/customers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, phone, email: email || "" }),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      toast({
        title: data.error || "Não foi possível cadastrar",
        tone: "error",
      });
      return;
    }
    const customer = await res.json();
    toast({ title: "Cliente salvo no CRM", tone: "success" });
    window.location.href = `/painel/clientes/${customer.id}`;
  }

  return (
    <button
      type="button"
      onClick={() => void register()}
      disabled={loading}
      className="inline-flex items-center gap-1.5 rounded-lg bg-cocoa px-3 py-2 text-xs font-semibold text-white transition hover:bg-cocoa/90 disabled:opacity-60"
    >
      <UserPlus className="h-3.5 w-3.5" />
      {loading ? "Salvando…" : "Salvar no CRM"}
    </button>
  );
}
