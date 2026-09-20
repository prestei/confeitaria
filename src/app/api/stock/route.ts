import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { withIds } from "@/lib/serialize";
import { Product } from "@/models/Product";
import { StockMovement } from "@/models/StockMovement";
import { maybeNotifyLowStockTransition } from "@/lib/notify";
import { z } from "zod";

export async function GET() {
  const session = await auth();
  if (!session?.user?.storeId) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  await connectDB();
  const storeId = session.user.storeId;
  const [products, movements] = await Promise.all([
    Product.find({ storeId, trackStock: true }).sort({ name: 1 }).lean(),
    StockMovement.find({ storeId }).sort({ createdAt: -1 }).limit(40).lean(),
  ]);

  const productIds = [
    ...new Set(movements.map((m) => m.productId).filter(Boolean)),
  ];
  const movementProducts = productIds.length
    ? await Product.find({ _id: { $in: productIds }, storeId })
        .select({ name: 1 })
        .lean()
    : [];
  const nameMap = new Map(
    movementProducts.map((p) => [String(p._id), p.name as string]),
  );

  const movementsWithId = withIds(movements) as Array<
    (typeof movements)[number] & { id: string }
  >;
  return NextResponse.json({
    products: withIds(products),
    movements: movementsWithId.map((m) => ({
      ...m,
      product: { name: nameMap.get(m.productId) ?? "" },
    })),
  });
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

  await connectDB();
  const product = await Product.findOne({
    _id: data.productId,
    storeId: session.user.storeId,
  }).lean();
  if (!product) {
    return NextResponse.json({ error: "Produto não encontrado" }, { status: 404 });
  }

  let nextQty = product.stockQty;
  if (data.type === "IN") nextQty += data.quantity;
  else if (data.type === "OUT") nextQty = Math.max(0, nextQty - data.quantity);
  else nextQty = data.quantity;

  const availability =
    product.trackStock && nextQty <= 0
      ? "SOLD_OUT"
      : product.availability === "SOLD_OUT" && nextQty > 0
        ? "AVAILABLE"
        : product.availability;

  const [movement] = await Promise.all([
    StockMovement.create({
      storeId: session.user.storeId,
      productId: String(product._id),
      type: data.type,
      quantity: data.quantity,
      note: data.note || null,
    }),
    Product.updateOne(
      { _id: product._id },
      {
        $set: {
          stockQty: nextQty,
          trackStock: true,
          availability,
        },
      },
    ),
  ]);

  void maybeNotifyLowStockTransition({
    storeId: session.user.storeId,
    productName: product.name,
    previousQty: product.stockQty,
    nextQty,
    stockMin: product.stockMin,
    trackStock: true,
  }).catch((err) => console.error("[notify:stock]", err));

  return NextResponse.json(withIds(movement.toObject()));
}
