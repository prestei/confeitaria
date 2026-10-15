import { redirect } from "next/navigation";

export default async function NovoProdutoPage({
  searchParams,
}: {
  searchParams: Promise<{ preco?: string; nome?: string }>;
}) {
  const sp = await searchParams;
  const params = new URLSearchParams({ novo: "1" });
  if (sp.preco) params.set("preco", sp.preco);
  if (sp.nome) params.set("nome", sp.nome);
  redirect(`/painel/produtos?${params.toString()}`);
}
