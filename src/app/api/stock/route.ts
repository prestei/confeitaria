import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

export async function GET() {
  const session = await auth();
  if (!session?.user?.storeId) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const storeId = session.user.storeId;
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

  return NextResponse.json({ products, movements });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.storeId) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const data = z
    .object({
      productId: z.string(),
      type: z.enum(["IN", "OUT", "ADJUST"]),
      quantity: z.number().int().positive(),
      note: z.string().optional(),
    })
    .parse(await req.json());

  const product = await prisma.product.findFirst({
    where: { id: data.productId, storeId: session.user.storeId },
  });
  if (!product) {
    return NextResponse.json({ error: "Produto não encontrado" }, { status: 404 });
  }

  let nextQty = product.stockQty;
  if (data.type === "IN") nextQty += data.quantity;
  else if (data.type === "OUT") nextQty = Math.max(0, nextQty - data.quantity);
  else nextQty = data.quantity;

  const availability =
    product.trackStock && nextQty <= 0 ? "SOLD_OUT" : product.availability === "SOLD_OUT" && nextQty > 0
      ? "AVAILABLE"
      : product.availability;

  const [movement] = await prisma.$transaction([
    prisma.stockMovement.create({
      data: {
        storeId: session.user.storeId,
        productId: product.id,
        type: data.type,
        quantity: data.quantity,
        note: data.note || null,
      },
    }),
    prisma.product.update({
      where: { id: product.id },
      data: {
        stockQty: nextQty,
        trackStock: true,
        availability,
      },
    }),
  ]);

  return NextResponse.json(movement);
}
