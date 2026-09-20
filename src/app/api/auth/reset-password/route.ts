import { createHash } from "crypto";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { connectDB } from "@/lib/db";
import { PasswordResetToken } from "@/models/PasswordResetToken";
import { User } from "@/models/User";

const schema = z.object({
  token: z.string().min(20),
  password: z.string().min(6),
});

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function POST(req: Request) {
  try {
    const { token, password } = schema.parse(await req.json());
    await connectDB();

    const record = await PasswordResetToken.findOne({
      tokenHash: hashToken(token),
      usedAt: null,
      expiresAt: { $gt: new Date() },
    });

    if (!record) {
      return NextResponse.json(
        { error: "Link inválido ou expirado. Solicite um novo." },
        { status: 400 },
      );
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.findOneAndUpdate(
      { _id: record.userId },
      { $set: { passwordHash } },
      { new: true },
    ).lean();

    if (!user) {
      return NextResponse.json(
        { error: "Conta não encontrada" },
        { status: 404 },
      );
    }

    record.usedAt = new Date();
    await record.save();
    await PasswordResetToken.deleteMany({
      userId: record.userId,
      _id: { $ne: record._id },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Dados inválidos. A senha precisa ter ao menos 6 caracteres." },
        { status: 400 },
      );
    }
    console.error("[reset-password]", error);
    return NextResponse.json(
      { error: "Não foi possível redefinir a senha" },
      { status: 500 },
    );
  }
}
