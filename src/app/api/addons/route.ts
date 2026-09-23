import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { isMediaUrl } from "@/lib/media-url";
import { withIds } from "@/lib/serialize";
import { AddonSelectionType } from "@/lib/enums";
import { Category } from "@/models/Category";
import { CatalogAddon } from "@/models/Addon";

const payloadSchema = z.object({
  name: z.string().min(2).max(80),
  description: z.string().max(240).optional().nullable(),
  imageUrl: z
    .string()
    .refine(isMediaUrl, { message: "URL de imagem inválida" })
    .optional()
    .nullable(),
  priceCents: z.number().int().min(0).max(10_000_000),
  selectionType: z.enum([
    AddonSelectionType.TOGGLE,
    AddonSelectionType.QTY,
    AddonSelectionType.TEXT,
  ]),
  maxQty: z.number().int().min(1).max(99).optional(),
  noteLabel: z.string().max(80).optional().nullable(),
  noteRequired: z.boolean().optional(),
  categoryIds: z.array(z.string()).optional(),
  suggestInCart: z.boolean().optional(),
  active: z.boolean().optional(),
});

async function ownedCategoryIds(storeId: string, ids: string[]) {
  if (!ids.length) return [] as string[];
  const unique = [...new Set(ids)];
  const found = await Category.find({
    storeId,
    _id: { $in: unique },
  })
    .select({ _id: 1 })
    .lean();
  return found.map((c) => String(c._id));
}

function maxQtyFor(type: string, requested?: number) {
  if (type === AddonSelectionType.QTY) return requested ?? 10;
  return 1;
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.storeId) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  await connectDB();
  const addons = await CatalogAddon.find({ storeId: session.user.storeId })
    .sort({ sortOrder: 1, name: 1 })
    .lean();
  return NextResponse.json(withIds(addons));
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.storeId) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const data = payloadSchema.parse(await req.json());
  await connectDB();
  const storeId = session.user.storeId;
  const categoryIds = await ownedCategoryIds(storeId, data.categoryIds ?? []);

  const maxSort = await CatalogAddon.findOne({ storeId })
    .sort({ sortOrder: -1 })
    .select("sortOrder")
    .lean();

  const addon = await CatalogAddon.create({
    storeId,
    name: data.name.trim(),
    description: data.description?.trim() || null,
    imageUrl: data.imageUrl || null,
    priceCents: data.priceCents,
    selectionType: data.selectionType,
    maxQty: maxQtyFor(data.selectionType, data.maxQty),
    noteLabel: data.noteLabel?.trim() || null,
    noteRequired:
      data.selectionType === AddonSelectionType.TEXT
        ? Boolean(data.noteRequired)
        : false,
    categoryIds,
    suggestInCart: data.suggestInCart ?? false,
    active: data.active ?? true,
    sortOrder: (maxSort?.sortOrder || 0) + 1,
  });

  return NextResponse.json(withIds(addon.toObject()));
}

export async function PATCH(req: Request) {
  const session = await auth();
  if (!session?.user?.storeId) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const data = payloadSchema
    .partial()
    .extend({
      id: z.string(),
      orderedIds: z.array(z.string()).optional(),
    })
    .parse(await req.json());

  await connectDB();
  const storeId = session.user.storeId;

  if (data.orderedIds?.length) {
    await Promise.all(
      data.orderedIds.map((id, i) =>
        CatalogAddon.updateOne({ _id: id, storeId }, { $set: { sortOrder: i } }),
      ),
    );
    const addons = await CatalogAddon.find({ storeId })
      .sort({ sortOrder: 1, name: 1 })
      .lean();
    return NextResponse.json(withIds(addons));
  }

  const existing = await CatalogAddon.findOne({
    _id: data.id,
    storeId,
  }).lean();
  if (!existing) {
    return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
  }

  const $set: Record<string, unknown> = {};
  if (data.name != null) $set.name = data.name.trim();
  if (data.description !== undefined) {
    $set.description = data.description?.trim() || null;
  }
  if (data.imageUrl !== undefined) $set.imageUrl = data.imageUrl || null;
  if (data.priceCents != null) $set.priceCents = data.priceCents;
  if (data.selectionType) {
    $set.selectionType = data.selectionType;
    $set.maxQty = maxQtyFor(data.selectionType, data.maxQty);
    if (data.selectionType !== AddonSelectionType.TEXT) {
      $set.noteRequired = false;
    }
  } else if (data.maxQty != null) {
    $set.maxQty = maxQtyFor(existing.selectionType, data.maxQty);
  }
  if (data.noteLabel !== undefined) {
    $set.noteLabel = data.noteLabel?.trim() || null;
  }
  if (data.noteRequired != null && (data.selectionType ?? existing.selectionType) === AddonSelectionType.TEXT) {
    $set.noteRequired = data.noteRequired;
  }
  if (data.categoryIds !== undefined) {
    $set.categoryIds = await ownedCategoryIds(storeId, data.categoryIds);
  }
  if (data.suggestInCart != null) $set.suggestInCart = data.suggestInCart;
  if (data.active != null) $set.active = data.active;

  const updated = await CatalogAddon.findOneAndUpdate(
    { _id: data.id, storeId },
    { $set },
    { new: true },
  ).lean();

  return NextResponse.json(withIds(updated));
}

export async function DELETE(req: Request) {
  const session = await auth();
  if (!session?.user?.storeId) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const data = z.object({ id: z.string() }).parse(await req.json());
  await connectDB();
  const res = await CatalogAddon.deleteOne({
    _id: data.id,
    storeId: session.user.storeId,
  });
  if (!res.deletedCount) {
    return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
