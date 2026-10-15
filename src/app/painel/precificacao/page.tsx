import { redirect } from "next/navigation";

/** Rota antiga — menu e links passaram a usar /painel/insumos. */
export default function PrecificacaoLegacyPage() {
  redirect("/painel/insumos");
}
