import bcrypt from "bcryptjs";
import { PrismaClient, ProductType, PriceMode, Availability } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
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
      passwordHash,
      store: {
        create: {
          slug: "doce-arte",
          name: "Doce Arte Confeitaria",
          tagline: "Bolos, doces e kits que transformam ocasiões em memórias",
          description:
            "Atendemos pronta entrega, bolos personalizados, kits festa e pedidos corporativos. Escolha no cardápio e envie tudo organizado pelo WhatsApp.",
          whatsapp: "11999998888",
          coverUrl:
            "https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=1600&q=80",
          logoUrl:
            "https://images.unsplash.com/photo-1486427944299-d1955d23e343?auto=format&fit=crop&w=200&q=80",
          accentColor: "#C45B7A",
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

  const cats = await Promise.all(
    [
      { name: "Bolos", emoji: "🍰", slug: "bolos", sortOrder: 1 },
      { name: "Doces", emoji: "🍫", slug: "doces", sortOrder: 2 },
      { name: "Cupcakes", emoji: "🧁", slug: "cupcakes", sortOrder: 3 },
      { name: "Kits festa", emoji: "🎉", slug: "kits-festa", sortOrder: 4 },
      { name: "Presentes", emoji: "🎁", slug: "presentes", sortOrder: 5 },
      { name: "Encomendas", emoji: "📦", slug: "encomendas", sortOrder: 6 },
      { name: "Corporativo", emoji: "🏢", slug: "corporativo", sortOrder: 7 },
    ].map((c) =>
      prisma.category.create({
        data: { ...c, storeId },
      }),
    ),
  );

  const bySlug = Object.fromEntries(cats.map((c) => [c.slug, c.id]));

  const bolo = await prisma.product.create({
    data: {
      storeId,
      categoryId: bySlug.bolos,
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
            name: "Massa",
            required: true,
            sortOrder: 2,
            options: {
              create: [
                { name: "Chocolate", priceDeltaCents: 0, sortOrder: 1 },
                { name: "Baunilha", priceDeltaCents: 0, sortOrder: 2 },
                { name: "Red velvet", priceDeltaCents: 1500, sortOrder: 3 },
              ],
            },
          },
          {
            name: "Recheio",
            required: true,
            sortOrder: 3,
            options: {
              create: [
                { name: "Ninho", priceDeltaCents: 0, sortOrder: 1 },
                { name: "Brigadeiro", priceDeltaCents: 0, sortOrder: 2 },
                { name: "Doce de leite", priceDeltaCents: 500, sortOrder: 3 },
                { name: "Ninho com morango", priceDeltaCents: 1200, sortOrder: 4 },
              ],
            },
          },
          {
            name: "Cobertura",
            required: true,
            sortOrder: 4,
            options: {
              create: [
                { name: "Chantininho", priceDeltaCents: 0, sortOrder: 1 },
                { name: "Ganache", priceDeltaCents: 800, sortOrder: 2 },
              ],
            },
          },
        ],
      },
    },
  });

  await prisma.product.create({
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
      availability: Availability.AVAILABLE,
      featured: true,
      optionGroups: {
        create: [
          {
            name: "Quantidade",
            required: true,
            options: {
              create: [
                { name: "Caixa com 6", priceDeltaCents: 0, sortOrder: 1 },
                { name: "Caixa com 12", priceDeltaCents: 3500, sortOrder: 2 },
                { name: "Caixa com 24", priceDeltaCents: 8500, sortOrder: 3 },
              ],
            },
          },
        ],
      },
      addons: {
        create: [
          { name: "Embalagem presente", priceCents: 800 },
          { name: "Cartão personalizado", priceCents: 500 },
        ],
      },
    },
  });

  await prisma.product.create({
    data: {
      storeId,
      categoryId: bySlug.doces,
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
    },
  });

  await prisma.product.create({
    data: {
      storeId,
      categoryId: bySlug["kits-festa"],
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
      categoryId: bySlug.corporativo,
      name: "Kit corporativo personalizado",
      slug: "kit-corporativo",
      description:
        "Brindes e cestas com logo. Informe quantidade, prazo e dados da empresa.",
      imageUrl:
        "https://images.unsplash.com/photo-1481391319762-47dff72954d9?auto=format&fit=crop&w=900&q=80",
      productType: ProductType.CORPORATE,
      priceMode: PriceMode.QUOTE,
      availability: Availability.MADE_TO_ORDER,
      featured: true,
      minAdvanceDays: 7,
    },
  });

  await prisma.product.create({
    data: {
      storeId,
      categoryId: bySlug.encomendas,
      name: "Encomenda sob medida",
      slug: "encomenda-sob-medida",
      description:
        "Formulário guiado para bolos com referência, lembrancinhas e datas especiais.",
      imageUrl:
        "https://images.unsplash.com/photo-1557925923-cd4648e211a0?auto=format&fit=crop&w=900&q=80",
      productType: ProductType.CUSTOM,
      priceMode: PriceMode.QUOTE,
      availability: Availability.MADE_TO_ORDER,
      featured: false,
      minAdvanceDays: 4,
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
    },
  });

  console.log("Seed OK");
  console.log("Login: demo@docearte.com / demo1234");
  console.log("Cardápio: /doce-arte");
  console.log("Produto demo:", bolo.slug);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
