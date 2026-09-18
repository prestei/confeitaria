import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
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

  const customers = await prisma.customer.findMany({
    where: { storeId: session.user.storeId },
    orderBy: { name: "asc" },
  });
  return NextResponse.json(customers);
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

    const existing = await prisma.customer.findUnique({
      where: {
        storeId_phone: {
          storeId: session.user.storeId,
          phone,
        },
      },
    });
    if (existing) {
      return NextResponse.json(
        { error: "Já existe um cliente com este WhatsApp" },
        { status: 409 },
      );
    }

    const customer = await prisma.customer.create({
      data: {
        storeId: session.user.storeId,
        name: data.name.trim(),
        phone,
        email: data.email?.trim() || null,
        notes: data.notes?.trim() || null,
      },
    });

    return NextResponse.json(customer, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
    }
    return NextResponse.json({ error: "Erro ao criar cliente" }, { status: 500 });
  }
}
