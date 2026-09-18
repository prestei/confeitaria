import bcrypt from "bcryptjs";
import {
  PrismaClient,
  ProductType,
  PriceMode,
  Availability,
  AnalyticsEventType,
  IntegrationProvider,
  IntegrationStatus,
  PromotionType,
  StockMovementType,
  OrderStatus,
  OrderKind,
  FulfillmentType,
} from "@prisma/client";
import { subDays } from "date-fns";

const prisma = new PrismaClient();

async function main() {
  await prisma.analyticsEvent.deleteMany();
  await prisma.stockMovement.deleteMany();
  await prisma.promotion.deleteMany();
  await prisma.integration.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.productOption.deleteMany();
  await prisma.optionGroup.deleteMany();
  await prisma.addon.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.deliveryZone.deleteMany();
  await prisma.blockedDate.deleteMany();
  await prisma.store.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await bcrypt.hash("demo1234", 10);

  const user = await prisma.user.create({
    data: {
      name: "Juliana Doces",
      email: "demo@docearte.com",
      phone: "11988887777",
      passwordHash,
      store: {
        create: {
          slug: "doce-arte",
          name: "Doce Arte Confeitaria",
          tagline: "Bolos, doces e kits que transformam ocasiões em memórias",
          description:
            "Atendemos pronta entrega, bolos personalizados, kits festa e pedidos corporativos. Cadastre uma vez e divulgue em todos os canais.",
          whatsapp: "11999998888",
          whatsappMessage:
            "Olá! Vi a vitrine da Doce Arte e gostaria de fazer um pedido.",
          instagram: "@docearte.sp",
          coverUrl:
            "https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=1600&q=80",
          logoUrl:
            "https://images.unsplash.com/photo-1486427944299-d1955d23e343?auto=format&fit=crop&w=200&q=80",
          accentColor: "#C45B7A",
          secondaryColor: "#4A2F26",
          typography: "elegant",
          cardStyle: "soft",
          pageLayout: "classic",
          businessHours: "Seg–Sex 9h–18h · Sáb 9h–13h",
          address: "Rua das Flores, 120 — Vila Mariana",
          city: "São Paulo",
          minAdvanceDays: 3,
          productionNote:
            "Encomendas de bolos personalizados com mínimo de 3 dias de antecedência.",
          paymentMethods: [
            "Pix",
            "Dinheiro",
            "Cartão na retirada",
            "Sinal para encomenda",
          ],
          plan: "starter",
          deliveryZones: {
            create: [
              { name: "Vila Mariana", feeCents: 1200 },
              { name: "Moema", feeCents: 1500 },
              { name: "Brooklin", feeCents: 1800 },
            ],
          },
        },
      },
    },
    include: { store: true },
  });

  const storeId = user.store!.id;

  await prisma.integration.createMany({
    data: [
      {
        storeId,
        provider: IntegrationProvider.WHATSAPP,
        status: IntegrationStatus.CONNECTED,
        connectedAt: new Date(),
      },
      {
        storeId,
        provider: IntegrationProvider.INSTAGRAM,
        status: IntegrationStatus.COMING_SOON,
      },
    ],
  });

  const cats = await Promise.all(
    [
      { name: "Bolos", slug: "bolos", sortOrder: 1 },
      { name: "Doces", slug: "doces", sortOrder: 2 },
      { name: "Cupcakes", slug: "cupcakes", sortOrder: 3 },
      { name: "Kits", slug: "kits", sortOrder: 4 },
      { name: "Bolos personalizados", slug: "bolos-personalizados", sortOrder: 5 },
      { name: "Datas comemorativas", slug: "datas", sortOrder: 6 },
      { name: "Brownies", slug: "brownies", sortOrder: 7 },
    ].map((c) =>
      prisma.category.create({
        data: { ...c, storeId, active: true },
      }),
    ),
  );

  const bySlug = Object.fromEntries(cats.map((c) => [c.slug, c.id]));

  const bolo = await prisma.product.create({
    data: {
      storeId,
      categoryId: bySlug["bolos-personalizados"],
      name: "Bolo personalizado",
      slug: "bolo-personalizado",
      description:
        "Monte seu bolo: tamanho, massa, recheio, cobertura e tema. Ideal para aniversários e datas especiais.",
      imageUrl:
        "https://images.unsplash.com/photo-1464349095431-e9a21285b5f3?auto=format&fit=crop&w=900&q=80",
      productType: ProductType.CAKE,
      priceMode: PriceMode.FROM,
      priceCents: 12000,
      availability: Availability.MADE_TO_ORDER,
      featured: true,
      minAdvanceDays: 3,
      optionGroups: {
        create: [
          {
            name: "Tamanho",
            required: true,
            sortOrder: 1,
            options: {
              create: [
                { name: "1 kg", priceDeltaCents: 0, sortOrder: 1 },
                { name: "2 kg", priceDeltaCents: 8000, sortOrder: 2 },
                { name: "3 kg", priceDeltaCents: 16000, sortOrder: 3 },
              ],
            },
          },
          {
            name: "Sabor",
            required: true,
            sortOrder: 2,
            options: {
              create: [
                { name: "Chocolate", priceDeltaCents: 0, sortOrder: 1 },
                { name: "Ninho", priceDeltaCents: 0, sortOrder: 2 },
                { name: "Red Velvet", priceDeltaCents: 1500, sortOrder: 3 },
              ],
            },
          },
        ],
      },
      addons: {
        create: [
          { name: "Morangos", priceCents: 1500 },
          { name: "Brigadeiros", priceCents: 2000 },
          { name: "Decoração especial", priceCents: 3500 },
        ],
      },
    },
  });

  const brigadeiro = await prisma.product.create({
    data: {
      storeId,
      categoryId: bySlug.doces,
      name: "Brigadeiro gourmet",
      slug: "brigadeiro-gourmet",
      description: "Caixa com brigadeiros cremosos. Perfeito para pronta entrega.",
      imageUrl:
        "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=900&q=80",
      productType: ProductType.READY,
      priceMode: PriceMode.FIXED,
      priceCents: 4500,
      promoPriceCents: 3900,
      availability: Availability.AVAILABLE,
      featured: true,
      trackStock: true,
      stockQty: 12,
      stockMin: 5,
      unit: "cx",
    },
  });

  const brownie = await prisma.product.create({
    data: {
      storeId,
      categoryId: bySlug.brownies,
      name: "Brownie tradicional",
      slug: "brownie-tradicional",
      description: "Fatia generosa, casquinha crocante e centro macio.",
      imageUrl:
        "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=900&q=80",
      productType: ProductType.READY,
      priceMode: PriceMode.FIXED,
      priceCents: 800,
      availability: Availability.AVAILABLE,
      featured: true,
      trackStock: true,
      stockQty: 3,
      stockMin: 8,
      unit: "un",
    },
  });

  await prisma.product.create({
    data: {
      storeId,
      categoryId: bySlug.kits,
      name: "Kit Festa 20 pessoas",
      slug: "kit-festa-20",
      description:
        "Ideal para festas íntimas. Veja o que está incluso e solicite com data e horário.",
      imageUrl:
        "https://images.unsplash.com/photo-1535254973040-607b474d7f5f?auto=format&fit=crop&w=900&q=80",
      productType: ProductType.PARTY_KIT,
      priceMode: PriceMode.FROM,
      priceCents: 32000,
      availability: Availability.MADE_TO_ORDER,
      featured: true,
      kitContents: "1 bolo 1,5 kg\n50 brigadeiros\n20 cupcakes\n20 mini brownies",
      minAdvanceDays: 5,
    },
  });

  await prisma.product.create({
    data: {
      storeId,
      categoryId: bySlug.cupcakes,
      name: "Cupcake sortido",
      slug: "cupcake-sortido",
      description: "Unidade com cobertura cremosa. Sabores sortidos do dia.",
      imageUrl:
        "https://images.unsplash.com/photo-1614707267537-b85aaf00c4b7?auto=format&fit=crop&w=900&q=80",
      productType: ProductType.READY,
      priceMode: PriceMode.FIXED,
      priceCents: 1200,
      availability: Availability.LAST_UNITS,
      trackStock: true,
      stockQty: 0,
      stockMin: 10,
      unit: "un",
    },
  });

  await prisma.stockMovement.createMany({
    data: [
      {
        storeId,
        productId: brigadeiro.id,
        type: StockMovementType.IN,
        quantity: 20,
        note: "Produção da semana",
      },
      {
        storeId,
        productId: brigadeiro.id,
        type: StockMovementType.OUT,
        quantity: 8,
        note: "Pedidos",
      },
      {
        storeId,
        productId: brownie.id,
        type: StockMovementType.ADJUST,
        quantity: 3,
        note: "Contagem",
      },
    ],
  });

  await prisma.promotion.create({
    data: {
      storeId,
      name: "10% OFF em kits de aniversário",
      code: "KIT10",
      type: PromotionType.PERCENT,
      percentOff: 10,
      startsAt: subDays(new Date(), 5),
      endsAt: subDays(new Date(), -25),
      usageLimit: 50,
      active: true,
    },
  });

  const customer = await prisma.customer.create({
    data: {
      storeId,
      name: "Ana Paula",
      phone: "11977776666",
      email: "ana@email.com",
      notes: "Prefere retirada. Aniversário da filha em outubro.",
    },
  });

  const order = await prisma.order.create({
    data: {
      storeId,
      customerId: customer.id,
      kind: OrderKind.CART,
      status: OrderStatus.NEW,
      customerName: customer.name,
      customerPhone: customer.phone,
      customerEmail: customer.email,
      fulfillment: FulfillmentType.PICKUP,
      eventDate: subDays(new Date(), -4),
      eventTime: "15:00",
      paymentMethod: "Pix",
      subtotalCents: 4500,
      totalCents: 4500,
      notes: "Sem nozes",
      items: {
        create: [
          {
            productId: brigadeiro.id,
            productName: brigadeiro.name,
            quantity: 1,
            unitPriceCents: 4500,
            lineTotalCents: 4500,
          },
        ],
      },
    },
  });

  await prisma.order.create({
    data: {
      storeId,
      customerId: customer.id,
      kind: OrderKind.QUOTE,
      status: OrderStatus.CONFIRMED,
      customerName: customer.name,
      customerPhone: customer.phone,
      fulfillment: FulfillmentType.DELIVERY,
      deliveryZone: "Moema",
      deliveryFeeCents: 1500,
      eventDate: subDays(new Date(), -2),
      eventTime: "10:30",
      paymentMethod: "Sinal para encomenda",
      subtotalCents: 12000,
      totalCents: 13500,
      items: {
        create: [
          {
            productId: bolo.id,
            productName: bolo.name,
            quantity: 1,
            unitPriceCents: 12000,
            lineTotalCents: 12000,
            customizations: { Tamanho: "2 kg", Sabor: "Ninho" },
          },
        ],
      },
    },
  });

  const eventTypes: AnalyticsEventType[] = [
    AnalyticsEventType.STORE_VIEW,
    AnalyticsEventType.PRODUCT_VIEW,
    AnalyticsEventType.WHATSAPP_CLICK,
    AnalyticsEventType.PRODUCT_CLICK,
  ];

  const analyticsData = [];
  for (let i = 0; i < 60; i++) {
    const day = subDays(new Date(), i % 40);
    analyticsData.push({
      storeId,
      type: eventTypes[i % eventTypes.length],
      productId: i % 3 === 0 ? bolo.id : i % 3 === 1 ? brigadeiro.id : brownie.id,
      source: i % 4 === 0 ? "instagram" : i % 4 === 1 ? "whatsapp" : "direct",
      createdAt: day,
    });
  }
  await prisma.analyticsEvent.createMany({ data: analyticsData });
  await prisma.analyticsEvent.create({
    data: {
      storeId,
      type: AnalyticsEventType.ORDER_COMPLETED,
      meta: { orderId: order.id },
    },
  });

  console.log("Seed OK");
  console.log("Login: demo@docearte.com / demo1234");
  console.log("Vitrine: /doce-arte");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
