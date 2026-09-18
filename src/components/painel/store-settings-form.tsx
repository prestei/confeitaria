"use client";

import { FormEvent, useState } from "react";

type Store = {
  name: string;
  tagline: string | null;
  description: string | null;
  whatsapp: string;
  address: string | null;
  city: string | null;
  coverUrl: string | null;
  logoUrl: string | null;
  accentColor: string;
  pickupEnabled: boolean;
  deliveryEnabled: boolean;
  minAdvanceDays: number;
  productionNote: string | null;
  paymentMethods: string[];
  isPublished: boolean;
};

export function StoreSettingsForm({ store }: { store: Store }) {
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    const fd = new FormData(e.currentTarget);
    const res = await fetch("/api/store", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: String(fd.get("name")),
        tagline: String(fd.get("tagline") || ""),
        description: String(fd.get("description") || ""),
        whatsapp: String(fd.get("whatsapp")),
        address: String(fd.get("address") || ""),
        city: String(fd.get("city") || ""),
        coverUrl: String(fd.get("coverUrl") || ""),
        logoUrl: String(fd.get("logoUrl") || ""),
        accentColor: String(fd.get("accentColor") || "#C45B7A"),
        pickupEnabled: fd.get("pickupEnabled") === "on",
        deliveryEnabled: fd.get("deliveryEnabled") === "on",
        minAdvanceDays: Number(fd.get("minAdvanceDays") || 0),
        productionNote: String(fd.get("productionNote") || ""),
        paymentMethods: String(fd.get("paymentMethods") || "")
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        isPublished: fd.get("isPublished") === "on",
      }),
    });
    setLoading(false);
    setMessage(res.ok ? "Salvo com sucesso" : "Erro ao salvar");
  }

  return (
    <form onSubmit={onSubmit} className="panel grid gap-4 p-6 sm:grid-cols-2">
      <div>
        <label className="label">Nome da marca</label>
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
        <label className="label">Tagline</label>
        <input
          name="tagline"
          className="input"
          defaultValue={store.tagline || ""}
        />
      </div>
      <div className="sm:col-span-2">
        <label className="label">Descrição</label>
        <textarea
          name="description"
          className="input min-h-24"
          defaultValue={store.description || ""}
        />
      </div>
      <div>
        <label className="label">Endereço</label>
        <input name="address" className="input" defaultValue={store.address || ""} />
      </div>
      <div>
        <label className="label">Cidade</label>
        <input name="city" className="input" defaultValue={store.city || ""} />
      </div>
      <div>
        <label className="label">URL da capa</label>
        <input name="coverUrl" className="input" defaultValue={store.coverUrl || ""} />
      </div>
      <div>
        <label className="label">URL do logo</label>
        <input name="logoUrl" className="input" defaultValue={store.logoUrl || ""} />
      </div>
      <div>
        <label className="label">Cor de destaque</label>
        <input
          name="accentColor"
          type="color"
          className="input !h-12 !p-1"
          defaultValue={store.accentColor}
        />
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
      <div className="sm:col-span-2">
        <label className="label">Nota de produção / agenda</label>
        <textarea
          name="productionNote"
          className="input min-h-20"
          defaultValue={store.productionNote || ""}
        />
      </div>
      <div className="sm:col-span-2">
        <label className="label">Formas de pagamento (vírgula)</label>
        <input
          name="paymentMethods"
          className="input"
          defaultValue={store.paymentMethods.join(", ")}
        />
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input name="pickupEnabled" type="checkbox" defaultChecked={store.pickupEnabled} />
        Retirada no local
      </label>
      <label className="flex items-center gap-2 text-sm">
        <input
          name="deliveryEnabled"
          type="checkbox"
          defaultChecked={store.deliveryEnabled}
        />
        Entrega
      </label>
      <label className="flex items-center gap-2 text-sm sm:col-span-2">
        <input name="isPublished" type="checkbox" defaultChecked={store.isPublished} />
        Cardápio publicado
      </label>
      {message && <p className="sm:col-span-2 text-sm text-berry-deep">{message}</p>}
      <button type="submit" className="btn-primary sm:col-span-2" disabled={loading}>
        {loading ? "Salvando..." : "Salvar alterações"}
      </button>
    </form>
  );
}
