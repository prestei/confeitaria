import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { withIds } from "@/lib/serialize";
import { Customer } from "@/models/Customer";
import { digitsOnly } from "@/lib/utils";
import { z } from "zod";

const createSchema = z.object({
  name: z.string().min(2),
  phone: z.string().min(8),
  email: z.string().email().optional().or(z.literal("")),
  notes: z.string().optional(),
});

export async function GET() {
  const session = await auth();
  if (!session?.user?.storeId) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  await connectDB();
  const customers = await Customer.find({ storeId: session.user.storeId })
    .sort({ name: 1 })
    .lean();
  return NextResponse.json(withIds(customers));
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.storeId) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  try {
    const data = createSchema.parse(await req.json());
    const phone = digitsOnly(data.phone);
    if (phone.length < 8) {
      return NextResponse.json(
        { error: "WhatsApp inválido" },
        { status: 400 },
      );
    }

    await connectDB();
    const existing = await Customer.findOne({
      storeId: session.user.storeId,
      phone,
    }).lean();
    if (existing) {
      return NextResponse.json(
        { error: "Já existe um cliente com este WhatsApp" },
        { status: 409 },
      );
    }

    const customer = await Customer.create({
      storeId: session.user.storeId,
      name: data.name.trim(),
      phone,
      email: data.email?.trim() || null,
      notes: data.notes?.trim() || null,
    });

    return NextResponse.json(withIds(customer.toObject()), { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
    }
    return NextResponse.json({ error: "Erro ao criar cliente" }, { status: 500 });
  }
}
