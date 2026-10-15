import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { withIds } from "@/lib/serialize";
import { Promotion } from "@/models/Promotion";
import { z } from "zod";

export async function GET() {
  const session = await auth();
  if (!session?.user?.storeId) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  await connectDB();
  const promotions = await Promotion.find({ storeId: session.user.storeId })
    .sort({ createdAt: -1 })
    .lean();
  return NextResponse.json(withIds(promotions));
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.storeId) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const data = z
    .object({
      name: z.string().min(2),
      code: z.string().nullable().optional(),
      type: z.enum(["PERCENT", "FIXED", "PRODUCT"]),
      percentOff: z.number().int().min(0).max(100).nullable().optional(),
      amountOffCents: z.number().int().nullable().optional(),
      startsAt: z.string().nullable().optional(),
      endsAt: z.string().nullable().optional(),
      usageLimit: z.number().int().nullable().optional(),
      productIds: z.array(z.string()).optional(),
      active: z.boolean().optional(),
    })
    .parse(await req.json());

  await connectDB();
  const promotion = await Promotion.create({
    storeId: session.user.storeId,
    name: data.name,
    code: data.code ? data.code.trim().toUpperCase() : null,
    type: data.type,
    percentOff: data.percentOff ?? null,
    amountOffCents: data.amountOffCents ?? null,
    startsAt: data.startsAt ? new Date(data.startsAt) : null,
    endsAt: data.endsAt ? new Date(data.endsAt) : null,
    usageLimit: data.usageLimit ?? null,
    productIds: data.productIds || [],
    active: data.active ?? true,
  });

  return NextResponse.json(withIds(promotion.toObject()));
}

export async function PATCH(req: Request) {
  const session = await auth();
  if (!session?.user?.storeId) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const data = z
    .object({
      id: z.string(),
      active: z.boolean().optional(),
    })
    .parse(await req.json());

  await connectDB();
  const existing = await Promotion.findOne({
    _id: data.id,
    storeId: session.user.storeId,
  }).lean();
  if (!existing) {
    return NextResponse.json({ error: "Não encontrada" }, { status: 404 });
  }

  const updated = await Promotion.findOneAndUpdate(
    { _id: data.id, storeId: session.user.storeId },
    { $set: { active: data.active } },
    { new: true },
  ).lean();

  return NextResponse.json(withIds(updated));
}
