import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { withIds } from "@/lib/serialize";
import { BlockedDate } from "@/models/BlockedDate";
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
  const storeId = session.user.storeId;

  await connectDB();
  let blocked = await BlockedDate.findOne({ storeId, date });
  if (blocked) {
    blocked.reason = data.reason || null;
    await blocked.save();
  } else {
    blocked = await BlockedDate.create({
      storeId,
      date,
      reason: data.reason || null,
    });
  }

  return NextResponse.json(withIds(blocked.toObject()));
}

export async function DELETE(req: Request) {
  const session = await auth();
  if (!session?.user?.storeId) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const data = z.object({ date: z.string() }).parse(await req.json());
  const date = new Date(`${data.date}T12:00:00`);

  await connectDB();
  await BlockedDate.deleteMany({
    storeId: session.user.storeId,
    date,
  });

  return NextResponse.json({ ok: true });
}
