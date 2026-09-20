import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Store } from "@/models/Store";
import { storeHasMercadoPago } from "@/lib/mercadopago";

export async function GET(req: Request) {
  const slug = new URL(req.url).searchParams.get("slug");
  if (!slug) {
    return NextResponse.json({ error: "slug obrigatório" }, { status: 400 });
  }

  await connectDB();
  const store = await Store.findOne({ slug })
    .select({
      mpEnabled: 1,
      mpPublicKey: 1,
      mpAccessToken: 1,
      isPublished: 1,
    })
    .lean();

  if (!store || !store.isPublished) {
    return NextResponse.json({ enabled: false, publicKey: null });
  }

  const enabled = storeHasMercadoPago(store);
  return NextResponse.json({
    enabled,
    publicKey: enabled ? store.mpPublicKey : null,
  });
}
