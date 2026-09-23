import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  Users,
  CalendarDays,
  Layers,
  Wallet,
  Percent,
  Store,
  Settings,
  Tags,
  Gift,
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
  label: string | null;
  items: NavItem[];
};

export const NAV_SECTIONS: NavSection[] = [
  {
    id: "inicio",
    label: null,
    items: [{ href: "/painel", label: "Início", icon: LayoutDashboard }],
  },
  {
    id: "confeitaria",
    label: "Minha confeitaria",
    items: [
      { href: "/painel/produtos", label: "Produtos", icon: Package },
      { href: "/painel/categorias", label: "Categorias", icon: Tags },
      { href: "/painel/adicionais", label: "Adicionais", icon: Gift },
      {
        href: "/painel/pedidos",
        label: "Encomendas",
        icon: ShoppingBag,
        badgeKey: "orders",
      },
      { href: "/painel/clientes", label: "Clientes", icon: Users },
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
    id: "vendas",
    label: "Vendas",
    items: [
      { href: "/painel/analytics", label: "Financeiro", icon: Wallet },
      { href: "/painel/promocoes", label: "Promoções", icon: Percent },
    ],
  },
  {
    id: "config",
    label: "Configurações",
    items: [
      { href: "/painel/vitrine", label: "Perfil da loja", icon: Store },
      {
        href: "/painel/configuracoes",
        label: "Preferências",
        icon: Settings,
      },
    ],
  },
];

/** Lista plana para busca e atalhos. */
export const MAIN_NAV: NavItem[] = NAV_SECTIONS.flatMap((s) => s.items);

export function isNavActive(pathname: string, href: string) {
  if (href === "/painel") return pathname === "/painel";
  if (href === "/painel/pedidos") {
    if (pathname === "/painel/pedidos") return true;
    if (!pathname.startsWith("/painel/pedidos/")) return false;
    return !pathname.startsWith("/painel/pedidos/historico");
  }
  if (href === "/painel/configuracoes") {
    return pathname.startsWith("/painel/configuracoes");
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}
