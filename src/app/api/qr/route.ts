import { NextResponse } from "next/server";
import QRCode from "qrcode";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const url = searchParams.get("url");
  if (!url) {
    return NextResponse.json({ error: "url obrigatória" }, { status: 400 });
  }

  const sizeRaw = Number(searchParams.get("size") || "512");
  const size = Math.min(1024, Math.max(256, Number.isFinite(sizeRaw) ? sizeRaw : 512));
  const download = searchParams.get("download") === "1";
  const slug = (searchParams.get("slug") || "cardapio")
    .replace(/[^a-z0-9-_]/gi, "")
    .slice(0, 40);

  const png = await QRCode.toBuffer(url, {
    type: "png",
    width: size,
    margin: 2,
    color: { dark: "#24140F", light: "#FFF8F5" },
    errorCorrectionLevel: "M",
  });

  const headers: Record<string, string> = {
    "Content-Type": "image/png",
    "Cache-Control": "public, max-age=86400",
  };

  if (download) {
    headers["Content-Disposition"] = `attachment; filename="qr-${slug || "cardapio"}.png"`;
  }

  return new NextResponse(new Uint8Array(png), { headers });
}
