import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
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

  await connectDB();
  const updated = await User.findOneAndUpdate(
    { _id: session.user.id },
    {
      $set: {
        ...(data.name !== undefined ? { name: data.name } : {}),
        ...(data.phone !== undefined ? { phone: data.phone || null } : {}),
        ...(data.password
          ? { passwordHash: await bcrypt.hash(data.password, 10) }
          : {}),
      },
    },
    { new: true },
  ).lean();

  if (!updated) {
    return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
  }

  return NextResponse.json({
    id: String(updated._id),
    name: updated.name,
    email: updated.email,
    phone: updated.phone,
  });
}
