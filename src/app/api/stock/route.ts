import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { withIds } from "@/lib/serialize";
import { Category } from "@/models/Category";
import { Product, type ProductDoc } from "@/models/Product";
import { StockMovement } from "@/models/StockMovement";
import { maybeNotifyLowStockTransition } from "@/lib/notify";
import { z } from "zod";

const movementSchema = z
  .object({
    productId: z.string(),
    type: z.enum(["IN", "OUT", "ADJUST"]),
    quantity: z.number().int(),
    note: z.string().optional(),
  })
  .refine(
    (d) => (d.type === "ADJUST" ? d.quantity >= 0 : d.quantity > 0),
    { message: "Quantidade inválida", path: ["quantity"] },
  );

const patchSchema = z.object({
  productId: z.string(),
  trackStock: z.boolean().optional(),
  stockMin: z.number().int().min(0).optional(),
  unit: z.string().min(1).max(12).optional(),
  stockQty: z.number().int().min(0).optional(),
  note: z.string().optional(),
});

function nextAvailability(
  product: Pick<ProductDoc, "availability">,
  nextQty: number,
  trackStock: boolean,
) {
  if (!trackStock) return product.availability;
  if (nextQty <= 0) return "SOLD_OUT";
  if (product.availability === "SOLD_OUT") return "AVAILABLE";
  return product.availability;
}

function productSelect() {
  return {
    name: 1,
    imageUrl: 1,
    stockQty: 1,
    stockMin: 1,
    unit: 1,
    trackStock: 1,
    availability: 1,
    active: 1,
    categoryId: 1,
    sortOrder: 1,
  };
}

async function productsWithCategories(
  storeId: string,
  products: Record<string, unknown>[],
) {
  const list = withIds(products) as Array<
    Record<string, unknown> & { id: string; categoryId?: string | null }
  >;
  const categoryIds = [
    ...new Set(
      list
        .map((p) => p.categoryId)
        .filter((id): id is string => typeof id === "string" && id.length > 0),
    ),
  ];
  const categories = categoryIds.length
    ? (withIds(
        await Category.find({ _id: { $in: categoryIds }, storeId })
          .select({ name: 1, sortOrder: 1 })
          .lean(),
      ) as Array<{ id: string; name: string; sortOrder?: number }>)
    : [];
  const catMap = new Map(categories.map((c) => [c.id, c]));
  return list.map((p) => ({
    ...p,
    category: p.categoryId ? (catMap.get(p.categoryId) ?? null) : null,
  }));
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.storeId) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  await connectDB();
  const storeId = session.user.storeId;
  const [products, movements] = await Promise.all([
    Product.find({ storeId })
      .select(productSelect())
      .sort({ sortOrder: 1, name: 1 })
      .lean(),
    StockMovement.find({ storeId }).sort({ createdAt: -1 }).limit(80).lean(),
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
    products: await productsWithCategories(storeId, products),
    movements: movementsWithId.map((m) => ({
      ...m,
      product: { name: nameMap.get(m.productId) ?? "Produto" },
    })),
  });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.storeId) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const data = movementSchema.parse(await req.json());

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
          availability: nextAvailability(product, nextQty, true),
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

export async function PATCH(req: Request) {
  const session = await auth();
  if (!session?.user?.storeId) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const data = patchSchema.parse(await req.json());
  await connectDB();

  const product = await Product.findOne({
    _id: data.productId,
    storeId: session.user.storeId,
  }).lean();
  if (!product) {
    return NextResponse.json({ error: "Produto não encontrado" }, { status: 404 });
  }

  const trackStock = data.trackStock ?? product.trackStock;
  const stockMin = data.stockMin ?? product.stockMin;
  const unit = data.unit ?? product.unit;
  const qtyChanged =
    data.stockQty !== undefined && data.stockQty !== product.stockQty;
  const nextQty = data.stockQty ?? product.stockQty;

  const $set: Record<string, unknown> = {
    trackStock,
    stockMin,
    unit,
    stockQty: nextQty,
    availability: nextAvailability(product, nextQty, trackStock),
  };

  const tasks: Promise<unknown>[] = [
    Product.updateOne({ _id: product._id }, { $set }),
  ];

  if (qtyChanged && trackStock) {
    tasks.push(
      StockMovement.create({
        storeId: session.user.storeId,
        productId: String(product._id),
        type: "ADJUST",
        quantity: nextQty,
        note: data.note?.trim() || "Ajuste pelo painel de estoque",
      }),
    );
  }

  await Promise.all(tasks);

  if (qtyChanged && trackStock) {
    void maybeNotifyLowStockTransition({
      storeId: session.user.storeId,
      productName: product.name,
      previousQty: product.stockQty,
      nextQty,
      stockMin,
      trackStock: true,
    }).catch((err) => console.error("[notify:stock]", err));
  }

  const updated = await Product.findById(product._id)
    .select(productSelect())
    .lean();
  return NextResponse.json(withIds(updated));
}
