"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";

type Feedback = { ok: boolean; text: string } | null;

function FeedbackBanner({ feedback }: { feedback: Feedback }) {
  if (!feedback) return null;
  return (
    <p
      className={`rounded-lg border px-4 py-3 text-sm ${
        feedback.ok
          ? "border-[#E8E2DE] bg-white text-[#5C5652]"
          : "border-red-200 bg-red-50 text-red-700"
      }`}
    >
      {feedback.text}
    </p>
  );
}

async function patchStore(payload: Record<string, unknown>) {
  return fetch("/api/store", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export function EstablishmentForm({
  store,
}: {
  store: {
    name: string;
    description: string;
    logoUrl: string;
    whatsapp: string;
    address: string;
    city: string;
  };
}) {
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [saving, setSaving] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setFeedback(null);
    const fd = new FormData(e.currentTarget);
    const res = await patchStore({
      name: String(fd.get("name")),
      whatsapp: String(fd.get("whatsapp")),
      description: String(fd.get("description") || ""),
      logoUrl: String(fd.get("logoUrl") || ""),
      address: String(fd.get("address") || ""),
      city: String(fd.get("city") || ""),
    });
    setSaving(false);
    setFeedback({
      ok: res.ok,
      text: res.ok ? "Estabelecimento salvo" : "Erro ao salvar",
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <FeedbackBanner feedback={feedback} />
      <div className="grid gap-4 rounded-lg border border-[#E8E2DE] bg-white p-5 sm:grid-cols-2">
        <div>
          <label className="label">Nome</label>
          <input name="name" className="input" defaultValue={store.name} required />
        </div>
        <div>
          <label className="label">WhatsApp</label>
          <input
            name="whatsapp"
            className="input"
            defaultValue={store.whatsapp}
            required
          />
        </div>
        <div className="sm:col-span-2">
          <label className="label">Descrição</label>
          <textarea
            name="description"
            className="input min-h-20"
            defaultValue={store.description}
          />
        </div>
        <div className="sm:col-span-2">
          <label className="label">Logo (URL)</label>
          <input name="logoUrl" className="input" defaultValue={store.logoUrl} />
        </div>
        <div>
          <label className="label">Endereço</label>
          <input name="address" className="input" defaultValue={store.address} />
        </div>
        <div>
          <label className="label">Cidade</label>
          <input name="city" className="input" defaultValue={store.city} />
        </div>
        <div className="sm:col-span-2">
          <button type="submit" className="btn-primary !py-2 text-sm" disabled={saving}>
            {saving ? "Salvando..." : "Salvar estabelecimento"}
          </button>
        </div>
      </div>
    </form>
  );
}

export function HoursForm({ businessHours }: { businessHours: string }) {
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [saving, setSaving] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setFeedback(null);
    const fd = new FormData(e.currentTarget);
    const res = await patchStore({
      businessHours: String(fd.get("businessHours") || ""),
    });
    setSaving(false);
    setFeedback({
      ok: res.ok,
      text: res.ok ? "Horários salvos" : "Erro ao salvar",
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <FeedbackBanner feedback={feedback} />
      <div className="rounded-lg border border-[#E8E2DE] bg-white p-5">
        <div>
          <label className="label">Horário de funcionamento</label>
          <input
            name="businessHours"
            className="input"
            defaultValue={businessHours}
            placeholder="Ex.: Seg–Sex 9h–18h · Sáb 9h–13h"
          />
          <p className="mt-2 text-xs text-[#8C8682]">
            Texto livre exibido na vitrine e no painel. Ex.: Seg–Sex 9h–18h · Sáb
            9h–13h
          </p>
        </div>
        <button
          type="submit"
          className="btn-primary mt-4 !py-2 text-sm"
          disabled={saving}
        >
          {saving ? "Salvando..." : "Salvar horários"}
        </button>
      </div>
    </form>
  );
}

export function PaymentForm({
  store,
}: {
  store: {
    paymentMethods: string[];
    pickupEnabled: boolean;
    deliveryEnabled: boolean;
    minAdvanceDays: number;
    productionNote: string;
  };
}) {
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [saving, setSaving] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setFeedback(null);
    const fd = new FormData(e.currentTarget);
    const res = await patchStore({
      paymentMethods: String(fd.get("paymentMethods") || "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      pickupEnabled: fd.get("pickupEnabled") === "on",
      deliveryEnabled: fd.get("deliveryEnabled") === "on",
      minAdvanceDays: Number(fd.get("minAdvanceDays") || 0),
      productionNote: String(fd.get("productionNote") || ""),
    });
    setSaving(false);
    setFeedback({
      ok: res.ok,
      text: res.ok ? "Pagamento salvo" : "Erro ao salvar",
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <FeedbackBanner feedback={feedback} />
      <div className="grid gap-4 rounded-lg border border-[#E8E2DE] bg-white p-5 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="label">Formas de pagamento</label>
          <input
            name="paymentMethods"
            className="input"
            defaultValue={store.paymentMethods.join(", ")}
            placeholder="Pix, Dinheiro, Cartão na retirada"
          />
          <p className="mt-2 text-xs text-[#8C8682]">
            Separe por vírgula. Aparecem no checkout da vitrine.
          </p>
        </div>
        <div>
          <label className="label">Prazo mínimo (dias)</label>
          <input
            name="minAdvanceDays"
            type="number"
            min={0}
            className="input"
            defaultValue={store.minAdvanceDays}
          />
        </div>
        <div className="flex flex-col justify-end gap-3 pb-1">
          <label className="flex items-center gap-2 text-sm text-[#2D2926]">
            <input
              name="pickupEnabled"
              type="checkbox"
              defaultChecked={store.pickupEnabled}
            />
            Retirada no local
          </label>
          <label className="flex items-center gap-2 text-sm text-[#2D2926]">
            <input
              name="deliveryEnabled"
              type="checkbox"
              defaultChecked={store.deliveryEnabled}
            />
            Entrega
          </label>
        </div>
        <div className="sm:col-span-2">
          <label className="label">Nota de produção / agenda</label>
          <textarea
            name="productionNote"
            className="input min-h-20"
            defaultValue={store.productionNote}
            placeholder="Ex.: Encomendas personalizadas com 3 dias de antecedência"
          />
        </div>
        <div className="sm:col-span-2">
          <button type="submit" className="btn-primary !py-2 text-sm" disabled={saving}>
            {saving ? "Salvando..." : "Salvar pagamento"}
          </button>
        </div>
      </div>
    </form>
  );
}

export function AccountForm({
  user,
}: {
  user: { name: string; email: string; phone: string };
}) {
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [saving, setSaving] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setFeedback(null);
    const fd = new FormData(e.currentTarget);
    const res = await fetch("/api/account", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: String(fd.get("name")),
        phone: String(fd.get("phone") || ""),
        password: String(fd.get("password") || "") || undefined,
      }),
    });
    setSaving(false);
    setFeedback({
      ok: res.ok,
      text: res.ok ? "Conta atualizada" : "Erro ao atualizar conta",
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <FeedbackBanner feedback={feedback} />
      <div className="grid gap-4 rounded-lg border border-[#E8E2DE] bg-white p-5 sm:grid-cols-2">
        <h2 className="text-sm font-semibold text-[#2D2926] sm:col-span-2">Conta</h2>
        <div>
          <label className="label">Nome</label>
          <input name="name" className="input" defaultValue={user.name} required />
        </div>
        <div>
          <label className="label">E-mail</label>
          <input className="input bg-[#F0F2F5]/60" value={user.email} disabled />
        </div>
        <div>
          <label className="label">Telefone</label>
          <input name="phone" className="input" defaultValue={user.phone} />
        </div>
        <div>
          <label className="label">Nova senha</label>
          <input
            name="password"
            type="password"
            className="input"
            placeholder="Deixe em branco para manter"
            minLength={6}
          />
        </div>
        <div className="sm:col-span-2">
          <button type="submit" className="btn-primary !py-2 text-sm" disabled={saving}>
            {saving ? "Salvando..." : "Salvar conta"}
          </button>
        </div>
      </div>
    </form>
  );
}

export function NotificationsForm({
  store,
}: {
  store: {
    notifyNewOrders: boolean;
    notifyLowStock: boolean;
    notifyNewCustomers: boolean;
  };
}) {
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [saving, setSaving] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setFeedback(null);
    const fd = new FormData(e.currentTarget);
    const res = await patchStore({
      notifyNewOrders: fd.get("notifyNewOrders") === "on",
      notifyLowStock: fd.get("notifyLowStock") === "on",
      notifyNewCustomers: fd.get("notifyNewCustomers") === "on",
    });
    setSaving(false);
    setFeedback({
      ok: res.ok,
      text: res.ok ? "Notificações salvas" : "Erro ao salvar",
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <FeedbackBanner feedback={feedback} />
      <div className="rounded-lg border border-[#E8E2DE] bg-white p-5">
        <h2 className="text-sm font-semibold text-[#2D2926]">Notificações</h2>
        <div className="mt-4 space-y-3">
          <label className="flex items-center gap-2 text-sm text-[#2D2926]">
            <input
              type="checkbox"
              name="notifyNewOrders"
              defaultChecked={store.notifyNewOrders}
            />
            Novos pedidos
          </label>
          <label className="flex items-center gap-2 text-sm text-[#2D2926]">
            <input
              type="checkbox"
              name="notifyLowStock"
              defaultChecked={store.notifyLowStock}
            />
            Estoque baixo
          </label>
          <label className="flex items-center gap-2 text-sm text-[#2D2926]">
            <input
              type="checkbox"
              name="notifyNewCustomers"
              defaultChecked={store.notifyNewCustomers}
            />
            Novos clientes
          </label>
        </div>
        <button
          type="submit"
          className="btn-primary mt-4 !py-2 text-sm"
          disabled={saving}
        >
          {saving ? "Salvando..." : "Salvar notificações"}
        </button>
      </div>
    </form>
  );
}

export function PlanCard({
  plan,
}: {
  plan: string;
}) {
  const planLabel =
    plan === "pro" ? "Pro" : plan === "business" ? "Business" : "Starter";

  return (
    <div id="plano" className="space-y-4 rounded-lg border border-[#E8E2DE] bg-white p-5">
      <h2 className="text-sm font-semibold text-[#2D2926]">Plano atual</h2>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="font-display text-2xl text-[#2D2926]">{planLabel}</p>
          <p className="mt-1 text-sm text-[#8C8682]">
            Vitrine digital, pedidos, agenda e estoque inclusos.
          </p>
        </div>
        <button type="button" className="btn-secondary !py-2 text-sm" disabled>
          Upgrade em breve
        </button>
      </div>
      <ul className="grid gap-2 text-sm text-[#8C8682] sm:grid-cols-2">
        <li>• Vitrine personalizada</li>
        <li>• Produtos e categorias ilimitados</li>
        <li>• Pedidos e WhatsApp</li>
        <li>• Analytics básico</li>
      </ul>
      <div className="rounded-xl border border-dashed border-[#E8E2DE] px-4 py-3 text-sm text-[#8C8682]">
        Histórico de cobrança: nenhum lançamento ainda (conta demo).
      </div>
      <Link
        href="/painel/vitrine"
        className="inline-block text-sm font-medium text-[#2D2926] underline-offset-2 hover:underline"
      >
        Ir para Minha vitrine
      </Link>
    </div>
  );
}
