"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Copy,
  Pencil,
  Plus,
  Star,
  Trash2,
  Package,
} from "lucide-react";
import { format } from "date-fns";
import {
  formatBRL,
  PRODUCT_TYPE_LABELS,
  AVAILABILITY_LABELS,
} from "@/lib/utils";
import { EmptyState } from "@/components/ui/empty-state";
import {
  FilterChip,
  PageAction,
  PageHeader,
  PageShell,
  StatusDot,
} from "@/components/painel/page-header";
import { RowActionsMenu } from "@/components/painel/row-actions-menu";
import { useToast } from "@/components/ui/toast";

type Category = { id: string; name: string };
type Product = {
  id: string;
  name: string;
  imageUrl: string | null;
  productType: keyof typeof PRODUCT_TYPE_LABELS;
  priceMode: string;
  priceCents: number | null;
  promoPriceCents: number | null;
  availability: keyof typeof AVAILABILITY_LABELS;
  active: boolean;
  featured: boolean;
  stockQty: number;
  trackStock: boolean;
  unit: string;
  updatedAt: string;
  category: Category | null;
};

export default function ProductsAdminPage({
  initialProducts = [],
}: {
  initialProducts?: Product[];
}) {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [loading, setLoading] = useState(initialProducts.length === 0);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<"all" | "active" | "featured" | "inactive">("all");
  const { toast } = useToast();

  async function load() {
    const res = await fetch("/api/products");
    if (res.ok) setProducts(await res.json());
    setLoading(false);
  }

  useEffect(() => {
    if (initialProducts.length === 0) load();
    else setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    return products.filter((p) => {
      if (filter === "active" && !p.active) return false;
      if (filter === "inactive" && p.active) return false;
      if (filter === "featured" && !p.featured) return false;
      if (q && !p.name.toLowerCase().includes(q.toLowerCase())) return false;
      return true;
    });
  }, [products, filter, q]);

  async function patch(id: string, data: Record<string, unknown>) {
    const res = await fetch(`/api/products/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      toast({ title: "Falha ao atualizar", tone: "error" });
      return;
    }
    toast({ title: "Produto atualizado", tone: "success" });
    load();
  }

  async function duplicate(id: string) {
    const res = await fetch(`/api/products/${id}/duplicate`, { method: "POST" });
    if (!res.ok) {
      toast({ title: "Não foi possível duplicar", tone: "error" });
      return;
    }
    toast({ title: "Produto duplicado", tone: "success" });
    load();
  }

  async function remove(id: string) {
    if (!confirm("Excluir este produto?")) return;
    const res = await fetch(`/api/products/${id}`, { method: "DELETE" });
    if (!res.ok) {
      toast({ title: "Não foi possível excluir", tone: "error" });
      return;
    }
    toast({ title: "Produto excluído", tone: "success" });
    load();
  }

  function productActions(p: Product) {
    return [
      {
        label: "Editar",
        icon: Pencil,
        href: `/painel/produtos/${p.id}`,
      },
      {
        label: "Duplicar",
        icon: Copy,
        onClick: () => duplicate(p.id),
      },
      {
        label: p.featured ? "Remover destaque" : "Marcar destaque",
        icon: Star,
        onClick: () => patch(p.id, { featured: !p.featured }),
      },
      {
        label: p.active ? "Desativar" : "Ativar",
        icon: Package,
        onClick: () => patch(p.id, { active: !p.active }),
      },
      {
        label: "Excluir",
        icon: Trash2,
        tone: "danger" as const,
        separator: true,
        onClick: () => remove(p.id),
      },
    ];
  }

  return (
    <PageShell>
      <PageHeader
        title="Produtos"
        description="Cadastre uma vez e use na vitrine, WhatsApp e futuras publicações."
        actions={
          <PageAction href="/painel/produtos/novo">
            <Plus className="h-4 w-4" />
            Novo produto
          </PageAction>
        }
      />

      <div className="flex flex-wrap items-center gap-2">
        <input
          className="input max-w-xs !py-2 text-sm"
          placeholder="Buscar produto…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        {(
          [
            ["all", "Todos"],
            ["active", "Ativos"],
            ["featured", "Destaques"],
            ["inactive", "Inativos"],
          ] as const
        ).map(([id, label]) => (
          <FilterChip
            key={id}
            label={label}
            active={filter === id}
            onClick={() => setFilter(id)}
          />
        ))}
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 animate-pulse rounded-lg bg-white" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Package}
          title="Sua vitrine ainda não possui produtos"
          description="Adicione o primeiro produto para começar a receber pedidos."
          action={{ label: "Adicionar primeiro produto", href: "/painel/produtos/novo" }}
        />
      ) : (
        <>
          <div className="hidden overflow-hidden rounded-lg border border-[#E8E2DE] bg-white md:block">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-[#E8E2DE] bg-[#F0F2F5] text-xs uppercase tracking-wide text-[#8C8682]">
                <tr>
                  <th className="px-4 py-3 font-semibold">Produto</th>
                  <th className="px-4 py-3 font-semibold">Categoria</th>
                  <th className="px-4 py-3 font-semibold">Preço</th>
                  <th className="px-4 py-3 font-semibold">Estoque</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Atualizado</th>
                  <th className="px-4 py-3 font-semibold text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cocoa/6">
                {filtered.map((p) => (
                  <tr key={p.id} className="hover:bg-fog/30">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Thumb src={p.imageUrl} />
                        <div className="min-w-0">
                          <p className="truncate font-medium text-cocoa">
                            {p.name}
                            {p.featured && (
                              <Star className="ml-1 inline h-3.5 w-3.5 fill-warning text-warning" />
                            )}
                          </p>
                          <p className="text-xs text-cocoa-soft/55">
                            {PRODUCT_TYPE_LABELS[p.productType]}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-cocoa-soft/70">
                      {p.category?.name || "—"}
                    </td>
                    <td className="px-4 py-3">
                      {p.promoPriceCents != null ? (
                        <span>
                          <span className="font-medium text-berry-deep">
                            {formatBRL(p.promoPriceCents)}
                          </span>
                          <span className="ml-1 text-xs text-cocoa-soft/45 line-through">
                            {formatBRL(p.priceCents)}
                          </span>
                        </span>
                      ) : (
                        <span className="font-medium text-cocoa">
                          {p.priceMode === "QUOTE"
                            ? "Sob consulta"
                            : formatBRL(p.priceCents)}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-cocoa-soft/70">
                      {p.trackStock ? `${p.stockQty} ${p.unit}` : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <StatusDot
                        tone={
                          !p.active
                            ? "neutral"
                            : p.availability === "SOLD_OUT"
                              ? "danger"
                              : "success"
                        }
                        label={
                          !p.active
                            ? "Inativo"
                            : AVAILABILITY_LABELS[p.availability]
                        }
                      />
                    </td>
                    <td className="px-4 py-3 text-xs text-cocoa-soft/55">
                      {format(new Date(p.updatedAt), "dd/MM/yy")}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end">
                        <RowActionsMenu items={productActions(p)} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="space-y-3 md:hidden">
            {filtered.map((p) => (
              <div
                key={p.id}
                className="rounded-lg border border-[#E8E2DE] bg-white p-4"
              >
                <div className="flex gap-3">
                  <Thumb src={p.imageUrl} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-medium text-cocoa">{p.name}</p>
                      <RowActionsMenu items={productActions(p)} />
                    </div>
                    <p className="text-xs text-cocoa-soft/60">
                      {p.category?.name || "Sem categoria"} ·{" "}
                      {formatBRL(p.promoPriceCents ?? p.priceCents)}
                    </p>
                    <div className="mt-2">
                      <StatusDot
                        tone={p.active ? "success" : "neutral"}
                        label={p.active ? "Ativo" : "Inativo"}
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </PageShell>
  );
}

function Thumb({ src }: { src: string | null }) {
  return (
    <div className="h-11 w-11 shrink-0 overflow-hidden rounded-md bg-[#F0F2F5]">
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="" className="h-full w-full object-cover" />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-[10px] text-[#B0AAA6]">
          Sem foto
        </div>
      )}
    </div>
  );
}
