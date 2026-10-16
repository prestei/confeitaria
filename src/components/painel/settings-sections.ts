import {
  Clock3,
  Settings2,
  Store,
  Truck,
  CalendarClock,
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
    description:
      "Dados da sua loja, endereço, telefone e informações sobre o seu negócio.",
    icon: Store,
  },
  {
    href: "/painel/configuracoes/atendimento",
    title: "Retirada e entrega",
    short: "Atendimento",
    description:
      "Configure as regras de retirada, entrega, taxas e instruções para seus pedidos.",
    icon: Truck,
  },
  {
    href: "/painel/configuracoes/horarios",
    title: "Horários",
    short: "Horários",
    description: "Defina os dias e horários de funcionamento da sua loja.",
    icon: Clock3,
  },
  {
    href: "/painel/configuracoes/agendamento",
    title: "Agendamento",
    short: "Agenda",
    description:
      "Configure regras de agendamento, horários e preferências de atendimento.",
    icon: CalendarClock,
  },
  {
    href: "/painel/configuracoes/geral",
    title: "Configurações gerais",
    short: "Geral",
    description: "Conta, notificações e plano da assinatura.",
    icon: Settings2,
  },
];
