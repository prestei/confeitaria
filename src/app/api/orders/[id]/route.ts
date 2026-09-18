import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.storeId) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const { id } = await params;
  const { status } = z
    .object({
      status: z.enum([
        "NEW",
        "REVIEWING",
        "CONFIRMED",
        "IN_PRODUCTION",
        "READY",
        "DELIVERED",
        "CANCELLED",
      ]),
    })
    .parse(await req.json());

  const order = await prisma.order.findFirst({
    where: { id, storeId: session.user.storeId },
  });
  if (!order) {
    return NextResponse.json({ error: "Pedido não encontrado" }, { status: 404 });
  }

  const updated = await prisma.order.update({
    where: { id },
    data: { status },
  });

  return NextResponse.json(updated);
}
