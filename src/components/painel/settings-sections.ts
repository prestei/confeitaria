import {
  Clock3,
  CreditCard,
  Palette,
  Settings2,
  Store,
  type LucideIcon,
} from "lucide-react";

export type SettingsSection = {
  href: string;
  title: string;
  short: string;
  description: string;
  icon: LucideIcon;
};

/** Shared (no "use client") so Server Components can import this array. */
export const SETTINGS_SECTIONS: SettingsSection[] = [
  {
    href: "/painel/configuracoes/estabelecimento",
    title: "Estabelecimento",
    short: "Loja",
    description: "Nome, WhatsApp, endereço, logo, banner e dados da loja.",
    icon: Store,
  },
  {
    href: "/painel/configuracoes/aparencia",
    title: "Cores do cardápio",
    short: "Cores",
    description: "Cores primária e secundária do cardápio — atualiza na hora.",
    icon: Palette,
  },
  {
    href: "/painel/configuracoes/horarios",
    title: "Horários",
    short: "Horários",
    description: "Dias e horários de funcionamento exibidos na vitrine.",
    icon: Clock3,
  },
  {
    href: "/painel/configuracoes/pagamento",
    title: "Pagamento",
    short: "Pagamento",
    description: "Mercado Pago online, Pix e sinal 50% pelo WhatsApp.",
    icon: CreditCard,
  },
  {
    href: "/painel/configuracoes/geral",
    title: "Configurações gerais",
    short: "Geral",
    description: "Conta, notificações e plano da assinatura.",
    icon: Settings2,
  },
];
