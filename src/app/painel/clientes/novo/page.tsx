import { redirect } from "next/navigation";

export default function NovoClientePage() {
  redirect("/painel/clientes?novo=1");
}
