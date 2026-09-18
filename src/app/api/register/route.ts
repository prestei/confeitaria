import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/utils";

const schema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  storeName: z.string().min(2),
  whatsapp: z.string().min(10),
  slug: z.string().min(2).optional(),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const data = schema.parse(body);
    const email = data.email.toLowerCase();

    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) {
      return NextResponse.json({ error: "E-mail já cadastrado" }, { status: 400 });
    }

    let slug = slugify(data.slug || data.storeName);
    const slugTaken = await prisma.store.findUnique({ where: { slug } });
    if (slugTaken) slug = `${slug}-${Date.now().toString(36).slice(-4)}`;

    const passwordHash = await bcrypt.hash(data.password, 10);

    const user = await prisma.user.create({
      data: {
        name: data.name,
        email,
        passwordHash,
        store: {
          create: {
            name: data.storeName,
            slug,
            whatsapp: data.whatsapp,
            tagline: "Seu cardápio online para pedidos organizados",
            description:
              "Escolha produtos, personalize e envie o pedido estruturado pelo WhatsApp.",
          },
        },
      },
      include: { store: true },
    });

    return NextResponse.json({
      id: user.id,
      storeSlug: user.store?.slug,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
    }
    console.error(error);
    return NextResponse.json({ error: "Erro ao cadastrar" }, { status: 500 });
  }
}
