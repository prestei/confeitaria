"use client";

import { FormEvent, useEffect, useState } from "react";
import { formatBRL, PRODUCT_TYPE_LABELS, AVAILABILITY_LABELS } from "@/lib/utils";

type Category = { id: string; name: string; emoji: string | null };
type Product = {
  id: string;
  name: string;
  productType: keyof typeof PRODUCT_TYPE_LABELS;
  priceMode: string;
  priceCents: number | null;
  availability: keyof typeof AVAILABILITY_LABELS;
  active: boolean;
  featured: boolean;
  category: Category | null;
};

export default function ProductsAdminPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const [catName, setCatName] = useState("");

  async function load() {
    const [p, c] = await Promise.all([
      fetch("/api/products").then((r) => r.json()),
      fetch("/api/categories").then((r) => r.json()),
    ]);
    setProducts(p);
    setCategories(c);
  }

  useEffect(() => {
    load();
  }, []);

  async function createCategory() {
    if (!catName.trim()) return;
    await fetch("/api/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: catName }),
    });
    setCatName("");
    load();
  }

  async function toggle(id: string, data: Partial<Product>) {
    await fetch(`/api/products/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    load();
  }

  async function onCreate(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const fd = new FormData(e.currentTarget);
    const priceMode = String(fd.get("priceMode"));
    const priceReais = String(fd.get("price") || "");
    const priceCents =
      priceMode === "QUOTE" || !priceReais
        ? null
        : Math.round(Number(priceReais.replace(",", ".")) * 100);

    const optionGroupName = String(fd.get("optionGroupName") || "");
    const optionNames = String(fd.get("optionNames") || "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    const res = await fetch("/api/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: String(fd.get("name")),
        description: String(fd.get("description") || ""),
        categoryId: String(fd.get("categoryId") || "") || null,
        imageUrl: String(fd.get("imageUrl") || ""),
        productType: String(fd.get("productType")),
        priceMode,
        priceCents,
        availability: String(fd.get("availability")),
        featured: fd.get("featured") === "on",
        kitContents: String(fd.get("kitContents") || "") || null,
        minAdvanceDays: fd.get("minAdvanceDays")
          ? Number(fd.get("minAdvanceDays"))
          : null,
        optionGroups:
          optionGroupName && optionNames.length
            ? [
                {
                  name: optionGroupName,
                  required: true,
                  options: optionNames.map((name) => ({
                    name,
                    priceDeltaCents: 0,
                  })),
                },
              ]
            : [],
      }),
    });
    const json = await res.json();
    if (!res.ok) {
      setError(json.error || "Erro ao criar");
      return;
    }
    setOpen(false);
    (e.target as HTMLFormElement).reset();
    load();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-4xl text-cocoa">Produtos</h1>
          <p className="mt-2 text-cocoa-soft/75">
            Configure pronta entrega, bolos, kits e orçamentos.
          </p>
        </div>
        <button type="button" className="btn-berry" onClick={() => setOpen(true)}>
          Novo produto
        </button>
      </div>

      <div className="panel flex flex-wrap items-end gap-3 p-4">
        <div className="min-w-[200px] flex-1">
          <label className="label">Nova categoria</label>
          <input
            className="input"
            value={catName}
            onChange={(e) => setCatName(e.target.value)}
            placeholder="Ex: Doces"
          />
        </div>
        <button type="button" className="btn-secondary" onClick={createCategory}>
          Adicionar
        </button>
        <div className="w-full text-xs text-cocoa-soft/60">
          {categories.map((c) => `${c.emoji || ""} ${c.name}`).join(" · ") ||
            "Nenhuma categoria ainda"}
        </div>
      </div>

      <div className="space-y-3">
        {products.map((p) => (
          <div
            key={p.id}
            className="panel flex flex-wrap items-center justify-between gap-3 p-4"
          >
            <div>
              <p className="font-semibold text-cocoa">{p.name}</p>
              <p className="text-xs text-cocoa-soft/65">
                {PRODUCT_TYPE_LABELS[p.productType]} ·{" "}
                {p.priceMode === "QUOTE"
                  ? "Orçamento"
                  : p.priceMode === "FROM"
                    ? `A partir de ${formatBRL(p.priceCents)}`
                    : formatBRL(p.priceCents)}{" "}
                · {AVAILABILITY_LABELS[p.availability]}
                {p.category ? ` · ${p.category.name}` : ""}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className="btn-secondary !px-3 !py-1.5 text-xs"
                onClick={() => toggle(p.id, { featured: !p.featured })}
              >
                {p.featured ? "Remover destaque" : "Destacar"}
              </button>
              <button
                type="button"
                className="btn-secondary !px-3 !py-1.5 text-xs"
                onClick={() => toggle(p.id, { active: !p.active })}
              >
                {p.active ? "Desativar" : "Ativar"}
              </button>
            </div>
          </div>
        ))}
      </div>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-cocoa/40 p-4 backdrop-blur-sm">
          <form
            onSubmit={onCreate}
            className="panel max-h-[90vh] w-full max-w-xl overflow-y-auto p-6"
          >
            <h2 className="font-display text-2xl text-cocoa">Novo produto</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="label">Nome</label>
                <input name="name" required className="input" />
              </div>
              <div className="sm:col-span-2">
                <label className="label">Descrição</label>
                <textarea name="description" className="input min-h-20" />
              </div>
              <div>
                <label className="label">Tipo de venda</label>
                <select name="productType" className="input" defaultValue="READY">
                  <option value="READY">Pronta entrega</option>
                  <option value="CAKE">Bolo personalizado</option>
                  <option value="PARTY_KIT">Kit festa</option>
                  <option value="CUSTOM">Sob encomenda</option>
                  <option value="CORPORATE">Corporativo</option>
                </select>
              </div>
              <div>
                <label className="label">Preço</label>
                <select name="priceMode" className="input" defaultValue="FIXED">
                  <option value="FIXED">Preço fixo</option>
                  <option value="FROM">A partir de</option>
                  <option value="QUOTE">Solicitar orçamento</option>
                </select>
              </div>
              <div>
                <label className="label">Valor (R$)</label>
                <input name="price" className="input" placeholder="45,00" />
              </div>
              <div>
                <label className="label">Disponibilidade</label>
                <select name="availability" className="input" defaultValue="AVAILABLE">
                  <option value="AVAILABLE">Disponível</option>
                  <option value="SOLD_OUT">Esgotado</option>
                  <option value="MADE_TO_ORDER">Sob encomenda</option>
                  <option value="LAST_UNITS">Últimas unidades</option>
                </select>
              </div>
              <div>
                <label className="label">Categoria</label>
                <select name="categoryId" className="input">
                  <option value="">Sem categoria</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Prazo mín. (dias)</label>
                <input name="minAdvanceDays" type="number" min={0} className="input" />
              </div>
              <div className="sm:col-span-2">
                <label className="label">URL da foto</label>
                <input name="imageUrl" className="input" placeholder="https://..." />
              </div>
              <div className="sm:col-span-2">
                <label className="label">Conteúdo do kit (opcional)</label>
                <textarea
                  name="kitContents"
                  className="input min-h-16"
                  placeholder="1 bolo&#10;50 brigadeiros"
                />
              </div>
              <div>
                <label className="label">Grupo de opções</label>
                <input
                  name="optionGroupName"
                  className="input"
                  placeholder="Tamanho / Sabor"
                />
              </div>
              <div>
                <label className="label">Opções (vírgula)</label>
                <input
                  name="optionNames"
                  className="input"
                  placeholder="1kg, 2kg, 3kg"
                />
              </div>
              <label className="flex items-center gap-2 text-sm sm:col-span-2">
                <input name="featured" type="checkbox" />
                Destacar na home
              </label>
            </div>
            {error && <p className="mt-3 text-sm text-berry-deep">{error}</p>}
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setOpen(false)}
              >
                Cancelar
              </button>
              <button type="submit" className="btn-primary">
                Salvar
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
