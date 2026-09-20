import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { withIds } from "@/lib/serialize";
import { Customer } from "@/models/Customer";
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
  const body = z.object({ notes: z.string().optional() }).parse(await req.json());

  await connectDB();
  const customer = await Customer.findOne({
    _id: id,
    storeId: session.user.storeId,
  }).lean();
  if (!customer) {
    return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
  }

  const updated = await Customer.findOneAndUpdate(
    { _id: id, storeId: session.user.storeId },
    { $set: { notes: body.notes ?? null } },
    { new: true },
  ).lean();

  return NextResponse.json(withIds(updated));
}
