import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

export async function PATCH(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const data = z
    .object({
      name: z.string().min(2).optional(),
      phone: z.string().optional(),
      password: z.string().min(6).optional(),
    })
    .parse(await req.json());

  const updated = await prisma.user.update({
    where: { id: session.user.id },
    data: {
      name: data.name,
      phone: data.phone || null,
      ...(data.password
        ? { passwordHash: await bcrypt.hash(data.password, 10) }
        : {}),
    },
  });

  return NextResponse.json({
    id: updated.id,
    name: updated.name,
    email: updated.email,
    phone: updated.phone,
  });
}
