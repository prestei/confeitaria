import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

export async function GET() {
  const session = await auth();
  if (!session?.user?.storeId) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const promotions = await prisma.promotion.findMany({
    where: { storeId: session.user.storeId },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(promotions);
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
    })
    .parse(await req.json());

  const promotion = await prisma.promotion.create({
    data: {
      storeId: session.user.storeId,
      name: data.name,
      code: data.code || null,
      type: data.type,
      percentOff: data.percentOff,
      amountOffCents: data.amountOffCents,
      startsAt: data.startsAt ? new Date(data.startsAt) : null,
      endsAt: data.endsAt ? new Date(data.endsAt) : null,
      usageLimit: data.usageLimit,
      productIds: data.productIds || [],
      active: true,
    },
  });

  return NextResponse.json(promotion);
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

  const existing = await prisma.promotion.findFirst({
    where: { id: data.id, storeId: session.user.storeId },
  });
  if (!existing) {
    return NextResponse.json({ error: "Não encontrada" }, { status: 404 });
  }

  const updated = await prisma.promotion.update({
    where: { id: data.id },
    data: { active: data.active },
  });

  return NextResponse.json(updated);
}
