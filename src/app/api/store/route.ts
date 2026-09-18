import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const schema = z.object({
  name: z.string().min(2).optional(),
  tagline: z.string().optional(),
  description: z.string().optional(),
  whatsapp: z.string().min(10).optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  coverUrl: z.string().url().optional().or(z.literal("")),
  logoUrl: z.string().url().optional().or(z.literal("")),
  accentColor: z.string().optional(),
  pickupEnabled: z.boolean().optional(),
  deliveryEnabled: z.boolean().optional(),
  minAdvanceDays: z.number().int().min(0).optional(),
  productionNote: z.string().optional(),
  paymentMethods: z.array(z.string()).optional(),
  isPublished: z.boolean().optional(),
});

export async function PATCH(req: Request) {
  const session = await auth();
  if (!session?.user?.storeId) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  try {
    const data = schema.parse(await req.json());
    const store = await prisma.store.update({
      where: { id: session.user.storeId },
      data: {
        ...data,
        coverUrl: data.coverUrl === "" ? null : data.coverUrl,
        logoUrl: data.logoUrl === "" ? null : data.logoUrl,
      },
    });
    return NextResponse.json(store);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
    }
    return NextResponse.json({ error: "Erro ao salvar" }, { status: 500 });
  }
}
