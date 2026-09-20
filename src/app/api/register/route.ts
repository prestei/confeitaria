import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { Store } from "@/models/Store";
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

    await connectDB();

    const exists = await User.findOne({ email }).lean();
    if (exists) {
      return NextResponse.json({ error: "E-mail já cadastrado" }, { status: 400 });
    }

    let slug = slugify(data.slug || data.storeName);
    const slugTaken = await Store.findOne({ slug }).lean();
    if (slugTaken) slug = `${slug}-${Date.now().toString(36).slice(-4)}`;

    const passwordHash = await bcrypt.hash(data.password, 10);

    const user = await User.create({
      name: data.name,
      email,
      passwordHash,
    });

    const store = await Store.create({
      userId: String(user._id),
      name: data.storeName,
      slug,
      whatsapp: data.whatsapp,
      tagline: "Seu cardápio online para pedidos organizados",
      description:
        "Escolha produtos, personalize e envie o pedido estruturado pelo WhatsApp.",
    });

    return NextResponse.json({
      id: String(user._id),
      storeSlug: store.slug,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
    }
    console.error(error);
    return NextResponse.json({ error: "Erro ao cadastrar" }, { status: 500 });
  }
}
