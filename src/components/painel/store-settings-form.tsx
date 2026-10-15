"use client";

import { FormEvent, useState } from "react";
import { Field } from "@/components/ui/input";

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
        accentColor: String(fd.get("accentColor") || "#0F352E"),
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
      <Field
        label="Nome da marca"
        name="name"
        defaultValue={store.name}
        required
      />
      <Field
        label="WhatsApp"
        name="whatsapp"
        defaultValue={store.whatsapp}
        required
      />
      <Field
        label="Tagline"
        name="tagline"
        defaultValue={store.tagline || ""}
        className="sm:col-span-2"
      />
      <Field
        as="textarea"
        label="Descrição"
        name="description"
        controlClassName="min-h-24"
        defaultValue={store.description || ""}
        className="sm:col-span-2"
      />
      <Field
        label="Endereço"
        name="address"
        defaultValue={store.address || ""}
      />
      <Field label="Cidade" name="city" defaultValue={store.city || ""} />
      <Field
        label="URL da capa"
        name="coverUrl"
        defaultValue={store.coverUrl || ""}
      />
      <Field
        label="URL do logo"
        name="logoUrl"
        defaultValue={store.logoUrl || ""}
      />
      <Field
        label="Cor de destaque"
        name="accentColor"
        type="color"
        controlClassName="!h-12 !p-1"
        defaultValue={store.accentColor}
      />
      <Field
        label="Prazo mínimo (dias)"
        name="minAdvanceDays"
        type="number"
        min={0}
        defaultValue={store.minAdvanceDays}
      />
      <Field
        as="textarea"
        label="Nota de produção / agenda"
        name="productionNote"
        controlClassName="min-h-20"
        defaultValue={store.productionNote || ""}
        className="sm:col-span-2"
      />
      <Field
        label="Formas de pagamento (vírgula)"
        name="paymentMethods"
        defaultValue={store.paymentMethods.join(", ")}
        className="sm:col-span-2"
      />
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
