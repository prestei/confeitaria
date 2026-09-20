import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  isAllowedImageMime,
  saveStoreUpload,
  UPLOAD_MAX_BYTES,
} from "@/lib/uploads";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.storeId) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json(
      { error: "Não foi possível ler o arquivo" },
      { status: 400 },
    );
  }

  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json(
      { error: "Envie um arquivo no campo file" },
      { status: 400 },
    );
  }

  if (!isAllowedImageMime(file.type)) {
    return NextResponse.json(
      { error: "Use JPEG, PNG, WebP ou GIF" },
      { status: 400 },
    );
  }

  if (file.size <= 0 || file.size > UPLOAD_MAX_BYTES) {
    return NextResponse.json(
      { error: "Arquivo deve ter até 5 MB" },
      { status: 400 },
    );
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  try {
    const saved = await saveStoreUpload(
      session.user.storeId,
      buffer,
      file.type,
    );
    return NextResponse.json({ url: saved.url });
  } catch (err) {
    console.error("[uploads]", err);
    return NextResponse.json(
      { error: "Falha ao salvar a imagem" },
      { status: 500 },
    );
  }
}
