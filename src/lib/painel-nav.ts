import {
  LayoutDashboard,
  Package,
  Tag,
  Ticket,
  History,
  Users,
  CalendarDays,
  Layers,
  Percent,
  BarChart3,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  badgeKey?: "orders" | "stock";
};

export type NavSection = {
  id: string;
  label: string;
  items: NavItem[];
};

export const NAV_SECTIONS: NavSection[] = [
  {
    id: "principal",
    label: "Principal",
    items: [
      { href: "/painel", label: "Visão geral", icon: LayoutDashboard },
    ],
  },
  {
    id: "catalogo",
    label: "Catálogo",
    items: [
      { href: "/painel/produtos", label: "Produtos", icon: Package },
      { href: "/painel/categorias", label: "Categorias", icon: Tag },
    ],
  },
  {
    id: "vendas",
    label: "Vendas",
    items: [
      {
        href: "/painel/pedidos",
        label: "Central",
        icon: Ticket,
        badgeKey: "orders",
      },
      { href: "/painel/historico", label: "Histórico", icon: History },
      { href: "/painel/clientes", label: "Clientes", icon: Users },
      { href: "/painel/promocoes", label: "Promoções", icon: Percent },
    ],
  },
  {
    id: "operacao",
    label: "Operação",
    items: [
      { href: "/painel/agenda", label: "Agenda", icon: CalendarDays },
      {
        href: "/painel/estoque",
        label: "Estoque",
        icon: Layers,
        badgeKey: "stock",
      },
    ],
  },
  {
    id: "analises",
    label: "Análises",
    items: [
      { href: "/painel/analytics", label: "Relatórios", icon: BarChart3 },
    ],
  },
];

/** Lista plana para busca e atalhos. */
export const MAIN_NAV: NavItem[] = NAV_SECTIONS.flatMap((s) => s.items);

export function isNavActive(pathname: string, href: string) {
  if (href === "/painel") return pathname === "/painel";
  // Central de pedidos: /painel/pedidos e detalhes, sem marcar no histórico
  if (href === "/painel/pedidos") {
    if (pathname === "/painel/pedidos") return true;
    if (!pathname.startsWith("/painel/pedidos/")) return false;
    return !pathname.startsWith("/painel/pedidos/historico");
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}
