import {
  LayoutDashboard,
  Package,
  Layers,
  Settings,
  Tags,
  Calculator,
  Clock3,
  CreditCard,
  Truck,
  CalendarClock,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  badgeKey?: "stock";
};

export type NavSection = {
  id: string;
  label: string | null;
  items: NavItem[];
};

/** Menu plano como no layout Doce Link. */
export const NAV_SECTIONS: NavSection[] = [
  {
    id: "main",
    label: null,
    items: [
      { href: "/painel", label: "Visão geral", icon: LayoutDashboard },
      { href: "/painel/produtos", label: "Produtos", icon: Package },
      { href: "/painel/categorias", label: "Categorias", icon: Tags },
      { href: "/painel/precificacao", label: "Precificação", icon: Calculator },
      {
        href: "/painel/estoque",
        label: "Estoque",
        icon: Layers,
        badgeKey: "stock",
      },
      {
        href: "/painel/pagamentos",
        label: "Pagamentos",
        icon: CreditCard,
      },
      {
        href: "/painel/configuracoes/atendimento",
        label: "Retirada e entrega",
        icon: Truck,
      },
      {
        href: "/painel/configuracoes/horarios",
        label: "Horário de funcionamento",
        icon: Clock3,
      },
      {
        href: "/painel/configuracoes/agendamento",
        label: "Agendamento",
        icon: CalendarClock,
      },
      {
        href: "/painel/configuracoes",
        label: "Configurações",
        icon: Settings,
      },
    ],
  },
];

export const MAIN_NAV: NavItem[] = NAV_SECTIONS.flatMap((s) => s.items);

export function isNavActive(pathname: string, href: string) {
  if (href === "/painel") return pathname === "/painel";
  if (href === "/painel/configuracoes") {
    return pathname === "/painel/configuracoes";
  }
  if (href.startsWith("/painel/configuracoes/")) {
    return pathname === href || pathname.startsWith(`${href}/`);
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}
