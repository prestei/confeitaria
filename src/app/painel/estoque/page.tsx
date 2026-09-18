import { prisma } from "@/lib/prisma";
import { requireStoreSession } from "@/lib/tenant";
import { EstoqueAdmin } from "@/components/painel/estoque-admin";

export default async function EstoquePage() {
  const session = await requireStoreSession();
  const storeId = session.storeId;
  const [products, movements] = await Promise.all([
    prisma.product.findMany({
      where: { storeId, trackStock: true },
      orderBy: { name: "asc" },
    }),
    prisma.stockMovement.findMany({
      where: { storeId },
      include: { product: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
      take: 40,
    }),
  ]);

  return (
    <EstoqueAdmin
      initialProducts={JSON.parse(JSON.stringify(products))}
      initialMovements={JSON.parse(JSON.stringify(movements))}
    />
  );
}
