import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Store } from "@/models/Store";
import { resolveStoreTheme } from "@/lib/store-theme";

export async function GET(req: Request) {
  const slug = new URL(req.url).searchParams.get("slug")?.trim();
  if (!slug) {
    return NextResponse.json({ error: "Slug obrigatório" }, { status: 400 });
  }

  await connectDB();
  const store = await Store.findOne({ slug, isPublished: true })
    .select({ accentColor: 1, secondaryColor: 1, themeColors: 1 })
    .lean();

  if (!store) {
    return NextResponse.json({ error: "Loja não encontrada" }, { status: 404 });
  }

  return NextResponse.json(resolveStoreTheme(store), {
    headers: { "Cache-Control": "no-store" },
  });
}
