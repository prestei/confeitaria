import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { slugify } from "@/lib/utils";

export async function GET() {
  const session = await auth();
  if (!session?.user?.storeId) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const categories = await prisma.category.findMany({
    where: { storeId: session.user.storeId },
    orderBy: { sortOrder: "asc" },
  });
  return NextResponse.json(categories);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.storeId) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const data = z
    .object({
      name: z.string().min(2),
      emoji: z.string().optional(),
    })
    .parse(await req.json());

  const category = await prisma.category.create({
    data: {
      storeId: session.user.storeId,
      name: data.name,
      emoji: data.emoji,
      slug: slugify(data.name),
      sortOrder: Date.now() % 1000,
    },
  });

  return NextResponse.json(category);
}
