import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { withIds } from "@/lib/serialize";
import { Customer } from "@/models/Customer";
import { z } from "zod";

const patchSchema = z.object({
  name: z.string().min(2).optional(),
  email: z.string().email().optional().or(z.literal("")).optional(),
  notes: z.string().optional(),
  referenceNote: z.string().optional(),
});

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.storeId) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const { id } = await params;
  let body: z.infer<typeof patchSchema>;
  try {
    body = patchSchema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
  }

  await connectDB();
  const customer = await Customer.findOne({
    _id: id,
    storeId: session.user.storeId,
  }).lean();
  if (!customer) {
    return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
  }

  const $set: Record<string, string | null> = {};
  if (body.name !== undefined) $set.name = body.name.trim();
  if (body.email !== undefined) $set.email = body.email.trim() || null;
  if (body.notes !== undefined) $set.notes = body.notes.trim() || null;
  if (body.referenceNote !== undefined) {
    $set.referenceNote = body.referenceNote.trim() || null;
  }

  const updated = await Customer.findOneAndUpdate(
    { _id: id, storeId: session.user.storeId },
    { $set },
    { new: true },
  ).lean();

  return NextResponse.json(withIds(updated));
}
