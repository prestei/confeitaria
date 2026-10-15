import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { withIds } from "@/lib/serialize";
import { Customer } from "@/models/Customer";
import { digitsOnly } from "@/lib/utils";
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
  const body = z
    .object({
      name: z.string().min(2).optional(),
      phone: z.string().min(8).optional(),
      email: z.string().email().optional().or(z.literal("")),
      notes: z.string().optional(),
      instagram: z.string().optional(),
    })
    .parse(await req.json());

  await connectDB();
  const customer = await Customer.findOne({
    _id: id,
    storeId: session.user.storeId,
  }).lean();
  if (!customer) {
    return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
  }

  let phone = customer.phone;
  if (body.phone !== undefined) {
    phone = digitsOnly(body.phone);
    if (phone.length < 8) {
      return NextResponse.json({ error: "WhatsApp inválido" }, { status: 400 });
    }
    const taken = await Customer.findOne({
      storeId: session.user.storeId,
      phone,
      _id: { $ne: id },
    }).lean();
    if (taken) {
      return NextResponse.json(
        { error: "Já existe um cliente com este WhatsApp" },
        { status: 409 },
      );
    }
  }

  const updated = await Customer.findOneAndUpdate(
    { _id: id, storeId: session.user.storeId },
    {
      $set: {
        ...(body.name !== undefined ? { name: body.name.trim() } : {}),
        ...(body.phone !== undefined ? { phone } : {}),
        ...(body.email !== undefined ? { email: body.email.trim() || null } : {}),
        ...(body.notes !== undefined ? { notes: body.notes || null } : {}),
        ...(body.instagram !== undefined
          ? { instagram: body.instagram.trim() || null }
          : {}),
      },
    },
    { returnDocument: "after" },
  ).lean();

  return NextResponse.json(withIds(updated));
}
