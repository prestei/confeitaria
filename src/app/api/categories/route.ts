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
    include: { _count: { select: { products: true } } },
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

  const maxSort = await prisma.category.aggregate({
    where: { storeId: session.user.storeId },
    _max: { sortOrder: true },
  });

  const category = await prisma.category.create({
    data: {
      storeId: session.user.storeId,
      name: data.name,
      emoji: data.emoji,
      slug: slugify(data.name),
      sortOrder: (maxSort._max.sortOrder || 0) + 1,
      active: true,
    },
  });

  return NextResponse.json(category);
}

export async function PATCH(req: Request) {
  const session = await auth();
  if (!session?.user?.storeId) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const data = z
    .object({
      id: z.string().optional(),
      name: z.string().min(2).optional(),
      active: z.boolean().optional(),
      sortOrder: z.number().int().optional(),
      direction: z.enum(["up", "down"]).optional(),
      orderedIds: z.array(z.string()).optional(),
    })
    .parse(await req.json());

  // Reordenação em lote (drag-and-drop)
  if (data.orderedIds?.length) {
    const owned = await prisma.category.findMany({
      where: {
        storeId: session.user.storeId,
        id: { in: data.orderedIds },
      },
      select: { id: true },
    });
    const ownedSet = new Set(owned.map((c) => c.id));
    const ids = data.orderedIds.filter((id) => ownedSet.has(id));
    await prisma.$transaction(
      ids.map((id, index) =>
        prisma.category.update({
          where: { id },
          data: { sortOrder: index },
        }),
      ),
    );
    return NextResponse.json({ ok: true });
  }

  if (!data.id) {
    return NextResponse.json({ error: "id obrigatório" }, { status: 400 });
  }

  const category = await prisma.category.findFirst({
    where: { id: data.id, storeId: session.user.storeId },
  });
  if (!category) {
    return NextResponse.json({ error: "Não encontrada" }, { status: 404 });
  }

  if (data.direction) {
    const siblings = await prisma.category.findMany({
      where: { storeId: session.user.storeId },
      orderBy: { sortOrder: "asc" },
    });
    const idx = siblings.findIndex((c) => c.id === category.id);
    const swapIdx = data.direction === "up" ? idx - 1 : idx + 1;
    if (swapIdx >= 0 && swapIdx < siblings.length) {
      const other = siblings[swapIdx];
      await prisma.$transaction([
        prisma.category.update({
          where: { id: category.id },
          data: { sortOrder: other.sortOrder },
        }),
        prisma.category.update({
          where: { id: other.id },
          data: { sortOrder: category.sortOrder },
        }),
      ]);
    }
    return NextResponse.json({ ok: true });
  }

  const updated = await prisma.category.update({
    where: { id: category.id },
    data: {
      name: data.name,
      active: data.active,
      sortOrder: data.sortOrder,
      slug: data.name ? slugify(data.name) : undefined,
    },
  });

  return NextResponse.json(updated);
}

export async function DELETE(req: Request) {
  const session = await auth();
  if (!session?.user?.storeId) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const { id } = z.object({ id: z.string() }).parse(await req.json());
  const category = await prisma.category.findFirst({
    where: { id, storeId: session.user.storeId },
  });
  if (!category) {
    return NextResponse.json({ error: "Não encontrada" }, { status: 404 });
  }

  await prisma.category.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
