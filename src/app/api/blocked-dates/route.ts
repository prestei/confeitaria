import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.storeId) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const data = z
    .object({
      date: z.string(),
      reason: z.string().optional(),
    })
    .parse(await req.json());

  const date = new Date(`${data.date}T12:00:00`);

  const blocked = await prisma.blockedDate.upsert({
    where: {
      storeId_date: {
        storeId: session.user.storeId,
        date,
      },
    },
    create: {
      storeId: session.user.storeId,
      date,
      reason: data.reason || null,
    },
    update: {
      reason: data.reason || null,
    },
  });

  return NextResponse.json(blocked);
}

export async function DELETE(req: Request) {
  const session = await auth();
  if (!session?.user?.storeId) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const data = z.object({ date: z.string() }).parse(await req.json());
  const date = new Date(`${data.date}T12:00:00`);

  await prisma.blockedDate.deleteMany({
    where: { storeId: session.user.storeId, date },
  });

  return NextResponse.json({ ok: true });
}
