import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { withIds } from "@/lib/serialize";
import { Integration } from "@/models/Integration";
import { z } from "zod";

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

  const config = data.config ?? {};
  const storeId = session.user.storeId;

  await connectDB();
  const existing = await Integration.findOne({
    storeId,
    provider: data.provider,
  });

  let integration;
  if (existing) {
    existing.status = data.status;
    existing.config = config;
    existing.connectedAt = data.status === "CONNECTED" ? new Date() : null;
    await existing.save();
    integration = existing;
  } else {
    integration = await Integration.create({
      storeId,
      provider: data.provider,
      status: data.status,
      config,
      connectedAt: data.status === "CONNECTED" ? new Date() : null,
    });
  }

  return NextResponse.json(withIds(integration.toObject()));
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.storeId) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  await connectDB();
  const integrations = await Integration.find({
    storeId: session.user.storeId,
  }).lean();
  return NextResponse.json(withIds(integrations));
}
