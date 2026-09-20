import { createHash, randomBytes } from "crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { connectDB } from "@/lib/db";
import { appBaseUrl, sendMail } from "@/lib/mail";
import { PasswordResetToken } from "@/models/PasswordResetToken";
import { User } from "@/models/User";

const schema = z.object({
  email: z.string().email(),
});

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function POST(req: Request) {
  try {
    const { email } = schema.parse(await req.json());
    await connectDB();

    const user = await User.findOne({
      email: email.toLowerCase().trim(),
    }).lean();

    // Always return ok to avoid account enumeration.
    if (!user) {
      return NextResponse.json({
        ok: true,
        message:
          "Se existir uma conta com este e-mail, enviaremos o link de recuperação.",
      });
    }

    await PasswordResetToken.deleteMany({
      userId: String(user._id),
      usedAt: null,
    });

    const token = randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    await PasswordResetToken.create({
      userId: String(user._id),
      tokenHash: hashToken(token),
      expiresAt,
    });

    const resetUrl = `${appBaseUrl()}/redefinir-senha?token=${token}`;
    await sendMail({
      to: user.email,
      subject: "Redefinir senha — DocePedido",
      text: [
        `Olá${user.name ? `, ${user.name}` : ""}!`,
        "",
        "Recebemos um pedido para redefinir a senha da sua conta.",
        `Abra o link abaixo (válido por 1 hora):`,
        resetUrl,
        "",
        "Se você não solicitou isso, ignore este e-mail.",
      ].join("\n"),
      html: `
        <p>Olá${user.name ? `, ${user.name}` : ""}!</p>
        <p>Recebemos um pedido para redefinir a senha da sua conta.</p>
        <p><a href="${resetUrl}">Redefinir senha</a></p>
        <p style="color:#666;font-size:13px">O link expira em 1 hora. Se você não solicitou isso, ignore este e-mail.</p>
      `,
    });

    return NextResponse.json({
      ok: true,
      message:
        "Se existir uma conta com este e-mail, enviaremos o link de recuperação.",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "E-mail inválido" }, { status: 400 });
    }
    console.error("[forgot-password]", error);
    return NextResponse.json(
      { error: "Não foi possível processar o pedido" },
      { status: 500 },
    );
  }
}
