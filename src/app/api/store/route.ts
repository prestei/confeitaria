import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { withIds } from "@/lib/serialize";
import { Store } from "@/models/Store";
import {
  maskSecret,
  prepareMpAccessTokenForStorage,
  prepareMpWebhookSecretForStorage,
  storeHasMercadoPago,
} from "@/lib/mercadopago";
import { mediaUrlSchema } from "@/lib/media-url";
import {
  HEX_COLOR,
  resolveStoreTheme,
  sanitizeThemePartial,
} from "@/lib/store-theme";
import { z } from "zod";

const hexColor = z.string().regex(HEX_COLOR);

const schema = z.object({
  name: z.string().min(2).optional(),
  tagline: z.string().optional(),
  description: z.string().optional(),
  whatsapp: z.string().min(10).optional(),
  whatsappMessage: z.string().optional(),
  instagram: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  coverUrl: mediaUrlSchema,
  logoUrl: mediaUrlSchema,
  accentColor: hexColor.optional(),
  secondaryColor: hexColor.optional(),
  themeColors: z
    .object({
      background: hexColor.optional(),
      surface: hexColor.optional(),
      muted: hexColor.optional(),
      accent: hexColor.optional(),
      accentDeep: hexColor.optional(),
      text: hexColor.optional(),
      textMuted: hexColor.optional(),
      secondary: hexColor.optional(),
      chrome: hexColor.optional(),
      complement: hexColor.optional(),
    })
    .optional(),
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
  notifyViaEmail: z.boolean().optional(),
  notifyViaWhatsApp: z.boolean().optional(),
  autoDeductStock: z.boolean().optional(),
  plan: z.string().optional(),
  mpPublicKey: z.string().optional(),
  mpAccessToken: z.string().optional(),
  mpWebhookSecret: z.string().optional(),
  mpEnabled: z.boolean().optional(),
});

function sanitizeStoreResponse(store: {
  mpAccessToken: string | null;
  mpWebhookSecret: string | null;
  mpPublicKey: string | null;
  mpEnabled: boolean;
  [key: string]: unknown;
}) {
  const { mpAccessToken, mpWebhookSecret, ...rest } = store;
  return {
    ...rest,
    mpAccessTokenMasked: maskSecret(mpAccessToken),
    mpWebhookSecretMasked: maskSecret(mpWebhookSecret),
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
      mpWebhookSecret,
      mpPublicKey,
      coverUrl,
      logoUrl,
      instagram,
      whatsappMessage,
      businessHours,
      themeColors,
      accentColor,
      secondaryColor,
      ...rest
    } = data;

    await connectDB();
    const current = await Store.findById(session.user.storeId).lean();
    if (!current) {
      return NextResponse.json({ error: "Loja não encontrada" }, { status: 404 });
    }

    const nextTheme = resolveStoreTheme({
      accentColor: accentColor ?? current.accentColor,
      secondaryColor: secondaryColor ?? current.secondaryColor,
      themeColors: {
        ...sanitizeThemePartial(current.themeColors),
        ...sanitizeThemePartial(themeColors),
        ...(accentColor ? { accent: accentColor } : {}),
        ...(secondaryColor ? { secondary: secondaryColor } : {}),
      },
    });

    const store = await Store.findOneAndUpdate(
      { _id: session.user.storeId },
      {
        $set: {
          ...rest,
          themeColors: nextTheme,
          accentColor: nextTheme.accent,
          secondaryColor: nextTheme.secondary,
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
          // Empty string clears; omit the field to keep the current token.
          ...(mpAccessToken !== undefined
            ? {
                mpAccessToken: mpAccessToken.trim()
                  ? prepareMpAccessTokenForStorage(mpAccessToken.trim())
                  : null,
              }
            : {}),
          ...(mpWebhookSecret !== undefined
            ? {
                mpWebhookSecret: mpWebhookSecret.trim()
                  ? prepareMpWebhookSecretForStorage(mpWebhookSecret.trim())
                  : null,
              }
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
      mpWebhookSecret: string | null;
      mpPublicKey: string | null;
      mpEnabled: boolean;
    };
    return NextResponse.json(sanitizeStoreResponse(serialized));
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
    }
    const message =
      error instanceof Error ? error.message : "Erro ao salvar";
    console.error("[api/store PATCH]", error);
    if (
      message.includes("TOKEN_ENCRYPTION_KEY") ||
      message.includes("AUTH_SECRET") ||
      message.includes("criptograf")
    ) {
      return NextResponse.json(
        {
          error:
            "Não foi possível criptografar o Access Token. Confira AUTH_SECRET (ou TOKEN_ENCRYPTION_KEY) no .env.local.",
        },
        { status: 500 },
      );
    }
    return NextResponse.json({ error: "Erro ao salvar" }, { status: 500 });
  }
}
