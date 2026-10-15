import { redirect } from "next/navigation";

/** Rota legada — edição da vitrine ficou em Configurações → Estabelecimento. */
export default function VitrinePage() {
  redirect("/painel/configuracoes/estabelecimento");
}
