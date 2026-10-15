import { ProductForm } from "@/components/painel/product-form";
import { requireStoreSession } from "@/lib/tenant";

export default async function NovoProdutoPage() {
  const session = await requireStoreSession();
  const origin = process.env.NEXTAUTH_URL || "http://localhost:3000";

  return (
    <ProductForm
      storeSlug={session.storeSlug ?? undefined}
      origin={origin}
    />
  );
}
