import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { withIds } from "@/lib/serialize";
import { Category } from "@/models/Category";
import { Product } from "@/models/Product";
import { z } from "zod";
import { slugify } from "@/lib/utils";

export async function GET() {
  const session = await auth();
  if (!session?.user?.storeId) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  await connectDB();
  const storeId = session.user.storeId;
  const categories = await Category.find({ storeId })
    .sort({ sortOrder: 1 })
    .lean();

  const counts = await Product.aggregate<{ _id: string; count: number }>([
    { $match: { storeId, categoryId: { $ne: null } } },
    { $group: { _id: "$categoryId", count: { $sum: 1 } } },
  ]);
  const countMap = new Map(counts.map((c) => [c._id, c.count]));

  const withId = withIds(categories) as Array<
    (typeof categories)[number] & { id: string }
  >;
  return NextResponse.json(
    withId.map((c) => ({
      ...c,
      _count: { products: countMap.get(c.id) ?? 0 },
    })),
  );
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.storeId) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const data = z
    .object({
      name: z.string().min(2),
      emoji: z.string().optional(),
    })
    .parse(await req.json());

  await connectDB();
  const maxSort = await Category.findOne({ storeId: session.user.storeId })
    .sort({ sortOrder: -1 })
    .select("sortOrder")
    .lean();

  const category = await Category.create({
    storeId: session.user.storeId,
    name: data.name,
    emoji: data.emoji ?? null,
    slug: slugify(data.name),
    sortOrder: (maxSort?.sortOrder || 0) + 1,
    active: true,
  });

  return NextResponse.json(withIds(category.toObject()));
}

export async function PATCH(req: Request) {
  const session = await auth();
  if (!session?.user?.storeId) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const data = z
    .object({
      id: z.string().optional(),
      name: z.string().min(2).optional(),
      active: z.boolean().optional(),
      sortOrder: z.number().int().optional(),
      direction: z.enum(["up", "down"]).optional(),
      orderedIds: z.array(z.string()).optional(),
    })
    .parse(await req.json());

  await connectDB();
  const storeId = session.user.storeId;

  if (data.orderedIds?.length) {
    const owned = await Category.find({
      storeId,
      _id: { $in: data.orderedIds },
    })
      .select("_id")
      .lean();
    const ownedSet = new Set(owned.map((c) => String(c._id)));
    const ids = data.orderedIds.filter((id) => ownedSet.has(id));
    await Promise.all(
      ids.map((id, index) =>
        Category.updateOne({ _id: id, storeId }, { $set: { sortOrder: index } }),
      ),
    );
    return NextResponse.json({ ok: true });
  }

  if (!data.id) {
    return NextResponse.json({ error: "id obrigatório" }, { status: 400 });
  }

  const category = await Category.findOne({
    _id: data.id,
    storeId,
  }).lean();
  if (!category) {
    return NextResponse.json({ error: "Não encontrada" }, { status: 404 });
  }

  if (data.direction) {
    const siblings = await Category.find({ storeId })
      .sort({ sortOrder: 1 })
      .lean();
    const idx = siblings.findIndex((c) => String(c._id) === String(category._id));
    const swapIdx = data.direction === "up" ? idx - 1 : idx + 1;
    if (swapIdx >= 0 && swapIdx < siblings.length) {
      const other = siblings[swapIdx];
      await Promise.all([
        Category.updateOne(
          { _id: category._id },
          { $set: { sortOrder: other.sortOrder } },
        ),
        Category.updateOne(
          { _id: other._id },
          { $set: { sortOrder: category.sortOrder } },
        ),
      ]);
    }
    return NextResponse.json({ ok: true });
  }

  const updated = await Category.findOneAndUpdate(
    { _id: category._id, storeId },
    {
      $set: {
        ...(data.name !== undefined
          ? { name: data.name, slug: slugify(data.name) }
          : {}),
        ...(data.active !== undefined ? { active: data.active } : {}),
        ...(data.sortOrder !== undefined ? { sortOrder: data.sortOrder } : {}),
      },
    },
    { new: true },
  ).lean();

  return NextResponse.json(withIds(updated));
}

export async function DELETE(req: Request) {
  const session = await auth();
  if (!session?.user?.storeId) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const { id } = z.object({ id: z.string() }).parse(await req.json());
  await connectDB();
  const category = await Category.findOne({
    _id: id,
    storeId: session.user.storeId,
  }).lean();
  if (!category) {
    return NextResponse.json({ error: "Não encontrada" }, { status: 404 });
  }

  await Category.deleteOne({ _id: id, storeId: session.user.storeId });
  return NextResponse.json({ ok: true });
}
