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
    description: "Nome, WhatsApp, endereço, logo e dados da loja.",
    icon: Store,
  },
  {
    href: "/painel/configuracoes/atendimento",
    title: "Retirada e entrega",
    short: "Atendimento",
    description: "Modalidades, taxa de entrega e instruções para o cliente.",
    icon: Truck,
  },
  {
    href: "/painel/configuracoes/horarios",
    title: "Horários",
    short: "Horários",
    description: "Dias e horários de funcionamento exibidos na vitrine.",
    icon: Clock3,
  },
  {
    href: "/painel/configuracoes/agendamento",
    title: "Agendamento",
    short: "Agenda",
    description: "Data e horário desejados no pedido pelo WhatsApp.",
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
