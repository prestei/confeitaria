import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { withIds } from "@/lib/serialize";
import { Store } from "@/models/Store";
import { maskSecret, storeHasMercadoPago } from "@/lib/mercadopago";
import { z } from "zod";

const schema = z.object({
  name: z.string().min(2).optional(),
  tagline: z.string().optional(),
  description: z.string().optional(),
  whatsapp: z.string().min(10).optional(),
  whatsappMessage: z.string().optional(),
  instagram: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  coverUrl: z.string().url().optional().or(z.literal("")),
  logoUrl: z.string().url().optional().or(z.literal("")),
  accentColor: z.string().optional(),
  secondaryColor: z.string().optional(),
  typography: z.string().optional(),
  cardStyle: z.string().optional(),
  pageLayout: z.string().optional(),
  businessHours: z.string().optional(),
  pickupEnabled: z.boolean().optional(),
  deliveryEnabled: z.boolean().optional(),
  minAdvanceDays: z.number().int().min(0).optional(),
  productionNote: z.string().optional(),
  paymentMethods: z.array(z.string()).optional(),
  isPublished: z.boolean().optional(),
  notifyNewOrders: z.boolean().optional(),
  notifyLowStock: z.boolean().optional(),
  notifyNewCustomers: z.boolean().optional(),
  plan: z.string().optional(),
  mpPublicKey: z.string().optional(),
  mpAccessToken: z.string().optional(),
  mpEnabled: z.boolean().optional(),
});

function sanitizeStoreResponse(store: {
  mpAccessToken: string | null;
  mpPublicKey: string | null;
  mpEnabled: boolean;
  [key: string]: unknown;
}) {
  const { mpAccessToken, ...rest } = store;
  return {
    ...rest,
    mpAccessTokenMasked: maskSecret(mpAccessToken),
    mpConfigured: storeHasMercadoPago({
      mpEnabled: store.mpEnabled,
      mpPublicKey: store.mpPublicKey,
      mpAccessToken,
    }),
  };
}

export async function PATCH(req: Request) {
  const session = await auth();
  if (!session?.user?.storeId) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  try {
    const data = schema.parse(await req.json());
    const {
      mpAccessToken,
      mpPublicKey,
      coverUrl,
      logoUrl,
      instagram,
      whatsappMessage,
      businessHours,
      ...rest
    } = data;

    await connectDB();
    const store = await Store.findOneAndUpdate(
      { _id: session.user.storeId },
      {
        $set: {
          ...rest,
          ...(coverUrl !== undefined
            ? { coverUrl: coverUrl === "" ? null : coverUrl }
            : {}),
          ...(logoUrl !== undefined
            ? { logoUrl: logoUrl === "" ? null : logoUrl }
            : {}),
          ...(instagram !== undefined
            ? { instagram: instagram === "" ? null : instagram }
            : {}),
          ...(whatsappMessage !== undefined
            ? {
                whatsappMessage:
                  whatsappMessage === "" ? null : whatsappMessage,
              }
            : {}),
          ...(businessHours !== undefined
            ? { businessHours: businessHours === "" ? null : businessHours }
            : {}),
          ...(mpPublicKey !== undefined
            ? { mpPublicKey: mpPublicKey.trim() || null }
            : {}),
          ...(mpAccessToken !== undefined && mpAccessToken.trim()
            ? { mpAccessToken: mpAccessToken.trim() }
            : {}),
        },
      },
      { new: true },
    ).lean();

    if (!store) {
      return NextResponse.json({ error: "Loja não encontrada" }, { status: 404 });
    }

    const serialized = withIds(store) as typeof store & {
      id: string;
      mpAccessToken: string | null;
      mpPublicKey: string | null;
      mpEnabled: boolean;
    };
    return NextResponse.json(sanitizeStoreResponse(serialized));
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
    }
    return NextResponse.json({ error: "Erro ao salvar" }, { status: 500 });
  }
}
