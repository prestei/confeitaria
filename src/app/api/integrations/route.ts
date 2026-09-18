import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import type { Prisma } from "@prisma/client";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.storeId) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const data = z
    .object({
      provider: z.enum(["WHATSAPP", "INSTAGRAM"]),
      status: z.enum(["CONNECTED", "DISCONNECTED", "COMING_SOON"]),
      config: z.record(z.string(), z.unknown()).optional(),
    })
    .parse(await req.json());

  const config = (data.config ?? {}) as Prisma.InputJsonValue;

  const integration = await prisma.integration.upsert({
    where: {
      storeId_provider: {
        storeId: session.user.storeId,
        provider: data.provider,
      },
    },
    create: {
      storeId: session.user.storeId,
      provider: data.provider,
      status: data.status,
      config,
      connectedAt: data.status === "CONNECTED" ? new Date() : null,
    },
    update: {
      status: data.status,
      config,
      connectedAt: data.status === "CONNECTED" ? new Date() : null,
    },
  });

  return NextResponse.json(integration);
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.storeId) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const integrations = await prisma.integration.findMany({
    where: { storeId: session.user.storeId },
  });
  return NextResponse.json(integrations);
}
