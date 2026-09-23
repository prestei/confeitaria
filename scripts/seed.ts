import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import bcrypt from "bcryptjs";
import { subDays } from "date-fns";
import mongoose from "mongoose";
import { connectDB } from "../src/lib/db";
import {
  AnalyticsEventType,
  AddonSelectionType,
  Availability,
  FulfillmentType,
  IntegrationProvider,
  IntegrationStatus,
  OrderKind,
  OrderStatus,
  PriceMode,
  ProductType,
  PromotionType,
  StockMovementType,
} from "../src/lib/enums";
import { AnalyticsEvent } from "../src/models/AnalyticsEvent";
import { BlockedDate } from "../src/models/BlockedDate";
import { CatalogAddon } from "../src/models/Addon";
import { Category } from "../src/models/Category";
import { Customer } from "../src/models/Customer";
import { Integration } from "../src/models/Integration";
import { Order } from "../src/models/Order";
import { Product } from "../src/models/Product";
import { Promotion } from "../src/models/Promotion";
import { StockMovement } from "../src/models/StockMovement";
import { Store } from "../src/models/Store";
import { User } from "../src/models/User";

function loadEnv() {
  const envPath = resolve(process.cwd(), ".env");
  if (!existsSync(envPath)) return;
  for (const line of readFileSync(envPath, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (process.env[key] === undefined) process.env[key] = value;
  }
}

loadEnv();

async function main() {
  await connectDB();

  await AnalyticsEvent.deleteMany({});
  await StockMovement.deleteMany({});
  await Promotion.deleteMany({});
  await Integration.deleteMany({});
  await Order.deleteMany({});
  await Customer.deleteMany({});
  await Product.deleteMany({});
  await CatalogAddon.deleteMany({});
  await Category.deleteMany({});
  await BlockedDate.deleteMany({});
  await Store.deleteMany({});
  await User.deleteMany({});

  const passwordHash = await bcrypt.hash("demo1234", 10);

  const user = await User.create({
    name: "Camila Oliveira",
    email: "demo@doceencanto.com",
    phone: "75998123456",
    passwordHash,
  });

  const store = await Store.create({
    userId: String(user._id),
    slug: "doce-encanto",
    name: "Doce Encanto Confeitaria",
    tagline:
      "Bolos e doces artesanais feitos com carinho em Feira de Santana",
    description:
      "Confeitaria artesanal no Centro de Feira de Santana. Pronta entrega, bolos personalizados, kits festa e pedidos corporativos. Monte o pedido no cardápio e finalize pelo WhatsApp.",
    whatsapp: "75998123456",
    whatsappMessage:
      "Olá! Vi a vitrine da Doce Encanto e gostaria de fazer um pedido.",
    instagram: "@doceencanto.fsa",
    coverUrl:
      "https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=1600&q=80",
    logoUrl:
      "https://images.unsplash.com/photo-1486427944299-d1955d23e34d?auto=format&fit=crop&w=200&q=80",
    accentColor: "#C45B7A",
    secondaryColor: "#4A2F26",
    typography: "elegant",
    cardStyle: "soft",
    pageLayout: "classic",
    businessHours:
      "Seg 09:00–18:00 · Ter 09:00–18:00 · Qua 09:00–18:00 · Qui 09:00–18:00 · Sex 09:00–18:00 · Sáb 09:00–13:00 · Dom fechado",
    address: "Rua Conselheiro Franco, 842 — Centro",
    city: "Feira de Santana — BA",
    minAdvanceDays: 3,
    productionNote:
      "Encomendas de bolos personalizados com mínimo de 3 dias úteis. Retirada na Rua Conselheiro Franco ou delivery nos bairros listados.",
    paymentMethods: ["Pix", "Sinal para encomenda"],
    plan: "starter",
    deliveryZones: [
      { name: "Centro", feeCents: 800 },
      { name: "Kalilândia", feeCents: 1000 },
      { name: "Caseb", feeCents: 1200 },
      { name: "Tomba", feeCents: 1400 },
      { name: "Cidade Nova", feeCents: 1500 },
      { name: "Santa Mônica", feeCents: 1600 },
      { name: "Brasília", feeCents: 1800 },
      { name: "Queimadinha", feeCents: 1800 },
    ],
  });

  const storeId = String(store._id);

  await Integration.insertMany([
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
  ]);

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
      Category.create({
        ...c,
        storeId,
        active: true,
      }),
    ),
  );

  const bySlug = Object.fromEntries(
    cats.map((c) => [c.slug, String(c._id)]),
  );

  const cakeCats = [
    bySlug.bolos,
    bySlug.cupcakes,
    bySlug.kits,
    bySlug["bolos-personalizados"],
    bySlug.datas,
  ].filter(Boolean);

  await CatalogAddon.insertMany([
    {
      storeId,
      name: "Velas decorativas",
      description: "Velas para o bolo — informe o número e a cor."
      priceCents: 800,
      selectionType: AddonSelectionType.TEXT,
      maxQty: 1,
      noteLabel: "Número e cor",
      noteRequired: true,
      categoryIds: cakeCats,
      suggestInCart: true,
      sortOrder: 1,
      active: true,
    },
    {
      storeId,
      name: "Topo de bolo impresso",
      description: "Topo personalizado com nome ou tema."
      priceCents: 1800,
      selectionType: AddonSelectionType.TEXT,
      maxQty: 1,
      noteLabel: "Tema ou nome",
      noteRequired: true,
      categoryIds: cakeCats,
      suggestInCart: true,
      sortOrder: 2,
      active: true,
    },
    {
      storeId,
      name: "Bexigas",
      description: "Unidade avulsa para a mesa da festa.",
      priceCents: 600,
      selectionType: AddonSelectionType.QTY,
      maxQty: 20,
      categoryIds: cakeCats,
      sortOrder: 3,
      active: true,
    },
    {
      storeId,
      name: "Pétalas de rosa",
      description: "Pacote para decorar a mesa ou a caixa.",
      priceCents: 1200,
      selectionType: AddonSelectionType.TOGGLE,
      maxQty: 1,
      categoryIds: cakeCats,
      sortOrder: 4,
      active: true,
    },
    {
      storeId,
      name: "Embalagem para presente",
      description: "Caixa pronta para presentear."
      priceCents: 1500,
      selectionType: AddonSelectionType.TOGGLE,
      maxQty: 1,
      categoryIds: [],
      suggestInCart: true,
      sortOrder: 5,
      active: true,
    },
  ]);

  const bolo = await Product.create({
    storeId,
    categoryId: bySlug["bolos-personalizados"],
    name: "Bolo personalizado",
    slug: "bolo-personalizado",
    description:
      "Bolo sob encomenda: tamanho, massa, recheio, cobertura e tema. Ideal para aniversários e datas especiais.",
    imageUrl:
      "https://images.unsplash.com/photo-1464349095431-e9a21285b5f3?auto=format&fit=crop&w=900&q=80",
    productType: ProductType.CAKE,
    priceMode: PriceMode.FROM,
    priceCents: 12000,
    availability: Availability.MADE_TO_ORDER,
    featured: true,
    minAdvanceDays: 3,
    optionGroups: [
      {
        name: "Tamanho",
        required: true,
        sortOrder: 1,
        options: [
          { name: "1 kg", priceDeltaCents: 0, sortOrder: 1 },
          { name: "2 kg", priceDeltaCents: 8000, sortOrder: 2 },
          { name: "3 kg", priceDeltaCents: 16000, sortOrder: 3 },
        ],
      },
      {
        name: "Sabor",
        required: true,
        sortOrder: 2,
        options: [
          { name: "Chocolate", priceDeltaCents: 0, sortOrder: 1 },
          { name: "Ninho", priceDeltaCents: 0, sortOrder: 2 },
          { name: "Red Velvet", priceDeltaCents: 1500, sortOrder: 3 },
        ],
      },
    ],
    addons: [
      { name: "Morangos", priceCents: 1500 },
      { name: "Brigadeiros", priceCents: 2000 },
      { name: "Decoração especial", priceCents: 3500 },
    ],
  });

  const brigadeiro = await Product.create({
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
  });

  const brownie = await Product.create({
    storeId,
    categoryId: bySlug.brownies,
    name: "Brownie tradicional",
    slug: "brownie-tradicional",
    description: "Fatia generosa, casquinha crocante e centro macio.",
    imageUrl:
      "https://images.unsplash.com/photo-1607920591413-4ec007e70023?auto=format&fit=crop&w=900&q=80",
    productType: ProductType.READY,
    priceMode: PriceMode.FIXED,
    priceCents: 800,
    availability: Availability.AVAILABLE,
    featured: true,
    trackStock: true,
    stockQty: 3,
    stockMin: 8,
    unit: "un",
  });

  await Product.create({
    storeId,
    categoryId: bySlug.kits,
    name: "Kit Festa 20 pessoas",
    slug: "kit-festa-20",
    description:
      "Ideal para festas íntimas. Veja o que está incluso e solicite com data e horário.",
    imageUrl:
      "https://images.unsplash.com/photo-1464349095431-e9a21285b5f3?auto=format&fit=crop&w=900&q=80",
    productType: ProductType.PARTY_KIT,
    priceMode: PriceMode.FROM,
    priceCents: 32000,
    availability: Availability.MADE_TO_ORDER,
    featured: true,
    kitContents: "1 bolo 1,5 kg\n50 brigadeiros\n20 cupcakes\n20 mini brownies",
    minAdvanceDays: 5,
  });

  await Product.create({
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
  });

  const unsplash = (id: string) =>
    `https://images.unsplash.com/${id}?auto=format&fit=crop&w=900&q=80`;

  const photoPools: Record<string, string[]> = {
    bolos: [
      unsplash("photo-1578985545062-69928b1d9587"),
      unsplash("photo-1464349095431-e9a21285b5f3"),
      unsplash("photo-1563729784474-d77dbb933a9e"),
      unsplash("photo-1621303837174-89787a7d4729"),
      unsplash("photo-1542826438-bd32f43d626f"),
      unsplash("photo-1587248720327-8eb72564be1e"),
      unsplash("photo-1565958011703-44f9829ba187"),
      unsplash("photo-1488477181946-6428a0291777"),
    ],
    doces: [
      unsplash("photo-1606313564200-e75d5e30476c"),
      unsplash("photo-1551024506-0bccd828d307"),
      unsplash("photo-1558326567-98ae2405596b"),
      unsplash("photo-1563805042-7684c019e1cb"),
      unsplash("photo-1488477181946-6428a0291777"),
      unsplash("photo-1574085733277-851d9d856a3a"),
      unsplash("photo-1519340241574-2cec6aef0c01"),
      unsplash("photo-1607478900766-efe13248b125"),
    ],
    cupcakes: [
      unsplash("photo-1614707267537-b85aaf00c4b7"),
      unsplash("photo-1599785209796-786432b228bc"),
      unsplash("photo-1550617931-e17a7b70dce2"),
      unsplash("photo-1486427944299-d1955d23e34d"),
      unsplash("photo-1558326567-98ae2405596b"),
    ],
    kits: [
      unsplash("photo-1464349095431-e9a21285b5f3"),
      unsplash("photo-1578985545062-69928b1d9587"),
      unsplash("photo-1551024506-0bccd828d307"),
      unsplash("photo-1614707267537-b85aaf00c4b7"),
      unsplash("photo-1607920591413-4ec007e70023"),
      unsplash("photo-1517433670267-08bbd4be890f"),
      unsplash("photo-1555507036-ab1f4038808a"),
    ],
    "bolos-personalizados": [
      unsplash("photo-1464349095431-e9a21285b5f3"),
      unsplash("photo-1621303837174-89787a7d4729"),
      unsplash("photo-1542826438-bd32f43d626f"),
      unsplash("photo-1587248720327-8eb72564be1e"),
      unsplash("photo-1563729784474-d77dbb933a9e"),
      unsplash("photo-1578985545062-69928b1d9587"),
    ],
    datas: [
      unsplash("photo-1464349095431-e9a21285b5f3"),
      unsplash("photo-1565958011703-44f9829ba187"),
      unsplash("photo-1551024506-0bccd828d307"),
      unsplash("photo-1578985545062-69928b1d9587"),
      unsplash("photo-1542826438-bd32f43d626f"),
      unsplash("photo-1606313564200-e75d5e30476c"),
      unsplash("photo-1517433670267-08bbd4be890f"),
      unsplash("photo-1550617931-e17a7b70dce2"),
    ],
    brownies: [
      unsplash("photo-1607920591413-4ec007e70023"),
      unsplash("photo-1606313564200-e75d5e30476c"),
      unsplash("photo-1558961363-fa8fdf82db35"),
      unsplash("photo-1506459225024-1428097a7e18"),
      unsplash("photo-1519340241574-2cec6aef0c01"),
      unsplash("photo-1607478900766-efe13248b125"),
    ],
  };

  const pickPhoto = (categorySlug: string, index: number) => {
    const pool = photoPools[categorySlug] ?? photoPools.bolos;
    return pool[index % pool.length];
  };

  const bulkProducts: Array<{
    categorySlug: string;
    name: string;
    slug: string;
    description: string;
    productType: (typeof ProductType)[keyof typeof ProductType];
    priceMode: (typeof PriceMode)[keyof typeof PriceMode];
    priceCents: number;
    promoPriceCents?: number;
    availability: (typeof Availability)[keyof typeof Availability];
    featured?: boolean;
    trackStock?: boolean;
    stockQty?: number;
    stockMin?: number;
    unit?: string;
    minAdvanceDays?: number;
    kitContents?: string;
    suggestInCart?: boolean;
    sortOrder: number;
  }> = [
    // Bolos prontos
    { categorySlug: "bolos", name: "Bolo de chocolate belga", slug: "bolo-chocolate-belga", description: "Massa fofinha com ganache belga e raspas de chocolate.", productType: ProductType.READY, priceMode: PriceMode.FIXED, priceCents: 8900, availability: Availability.AVAILABLE, featured: true, sortOrder: 10 },
    { categorySlug: "bolos", name: "Bolo de cenoura com cobertura", slug: "bolo-cenoura", description: "Clássico brasileiro com cobertura de chocolate cremosa.", productType: ProductType.READY, priceMode: PriceMode.FIXED, priceCents: 6500, promoPriceCents: 5500, availability: Availability.AVAILABLE, sortOrder: 11 },
    { categorySlug: "bolos", name: "Bolo Red Velvet", slug: "bolo-red-velvet", description: "Camadas aveludadas com cream cheese frosting.", productType: ProductType.READY, priceMode: PriceMode.FIXED, priceCents: 9800, availability: Availability.AVAILABLE, featured: true, sortOrder: 12 },
    { categorySlug: "bolos", name: "Bolo de ninho com Nutella", slug: "bolo-ninho-nutella", description: "Massa de leite ninho e recheio generoso de Nutella.", productType: ProductType.READY, priceMode: PriceMode.FIXED, priceCents: 10500, availability: Availability.AVAILABLE, sortOrder: 13 },
    { categorySlug: "bolos", name: "Bolo de limão siciliano", slug: "bolo-limao", description: "Leve e cítrico, com glacê de limão e raspas.", productType: ProductType.READY, priceMode: PriceMode.FIXED, priceCents: 7200, availability: Availability.AVAILABLE, sortOrder: 14 },
    { categorySlug: "bolos", name: "Bolo de coco queimado", slug: "bolo-coco", description: "Coco fresco, calda e cobertura caramelizada.", productType: ProductType.READY, priceMode: PriceMode.FIXED, priceCents: 6800, availability: Availability.AVAILABLE, sortOrder: 15 },
    { categorySlug: "bolos", name: "Bolo de abacaxi com coco", slug: "bolo-abacaxi", description: "Abacaxi caramelizado e farofa de coco.", productType: ProductType.READY, priceMode: PriceMode.FIXED, priceCents: 7500, availability: Availability.AVAILABLE, sortOrder: 16 },
    { categorySlug: "bolos", name: "Bolo de banana com canela", slug: "bolo-banana", description: "Caseiro, úmido, perfeito para o café da tarde.", productType: ProductType.READY, priceMode: PriceMode.FIXED, priceCents: 4800, availability: Availability.AVAILABLE, trackStock: true, stockQty: 6, stockMin: 3, unit: "un", sortOrder: 17 },
    { categorySlug: "bolos", name: "Bolo formigueiro", slug: "bolo-formigueiro", description: "Chocolate granulado por toda a massa — nostalgia pura.", productType: ProductType.READY, priceMode: PriceMode.FIXED, priceCents: 5200, availability: Availability.AVAILABLE, sortOrder: 18 },
    { categorySlug: "bolos", name: "Bolo de milho cremoso", slug: "bolo-milho", description: "Receita nordestina com milho verde e coco.", productType: ProductType.READY, priceMode: PriceMode.FIXED, priceCents: 5500, availability: Availability.AVAILABLE, sortOrder: 19 },
    { categorySlug: "bolos", name: "Bolo vulcão de chocolate", slug: "bolo-vulcao", description: "Centro derretido de ganache quente na hora.", productType: ProductType.READY, priceMode: PriceMode.FIXED, priceCents: 4200, availability: Availability.AVAILABLE, featured: true, trackStock: true, stockQty: 10, stockMin: 4, unit: "un", sortOrder: 20 },
    { categorySlug: "bolos", name: "Bolo de nozes com doce de leite", slug: "bolo-nozes", description: "Nozes tostadas e doce de leite artesanal.", productType: ProductType.READY, priceMode: PriceMode.FIXED, priceCents: 9200, availability: Availability.AVAILABLE, sortOrder: 21 },

    // Doces
    { categorySlug: "doces", name: "Beijinho de coco", slug: "beijinho-coco", description: "Caixa com 12 beijinhos rolados no coco fresco.", productType: ProductType.READY, priceMode: PriceMode.FIXED, priceCents: 3800, availability: Availability.AVAILABLE, trackStock: true, stockQty: 15, stockMin: 5, unit: "cx", sortOrder: 10 },
    { categorySlug: "doces", name: "Cajuzinho", slug: "cajuzinho", description: "Caixa com 12 cajuzinhos de amendoim.", productType: ProductType.READY, priceMode: PriceMode.FIXED, priceCents: 3600, availability: Availability.AVAILABLE, trackStock: true, stockQty: 10, stockMin: 5, unit: "cx", sortOrder: 11 },
    { categorySlug: "doces", name: "Brigadeiro de pistache", slug: "brigadeiro-pistache", description: "Caixa com 8 brigadeiros gourmet de pistache.", productType: ProductType.READY, priceMode: PriceMode.FIXED, priceCents: 5800, promoPriceCents: 4900, availability: Availability.AVAILABLE, featured: true, trackStock: true, stockQty: 8, stockMin: 4, unit: "cx", sortOrder: 12 },
    { categorySlug: "doces", name: "Brigadeiro de Oreo", slug: "brigadeiro-oreo", description: "Caixa com 10 brigadeiros com pedaços de Oreo.", productType: ProductType.READY, priceMode: PriceMode.FIXED, priceCents: 4800, availability: Availability.AVAILABLE, trackStock: true, stockQty: 14, stockMin: 5, unit: "cx", sortOrder: 13 },
    { categorySlug: "doces", name: "Trufa de maracujá", slug: "trufa-maracuja", description: "Caixa com 6 trufas recheadas de ganache de maracujá.", productType: ProductType.READY, priceMode: PriceMode.FIXED, priceCents: 3200, availability: Availability.AVAILABLE, trackStock: true, stockQty: 20, stockMin: 6, unit: "cx", sortOrder: 14 },
    { categorySlug: "doces", name: "Trufa de chocolate meio amargo", slug: "trufa-amargo", description: "Caixa com 6 trufas 70% cacau.", productType: ProductType.READY, priceMode: PriceMode.FIXED, priceCents: 3400, availability: Availability.AVAILABLE, trackStock: true, stockQty: 18, stockMin: 6, unit: "cx", sortOrder: 15 },
    { categorySlug: "doces", name: "Bem-casado", slug: "bem-casado", description: "Pacote com 20 bem-casados para festas.", productType: ProductType.READY, priceMode: PriceMode.FIXED, priceCents: 7000, availability: Availability.AVAILABLE, trackStock: true, stockQty: 5, stockMin: 3, unit: "pct", sortOrder: 16 },
    { categorySlug: "doces", name: "Olho de sogra", slug: "olho-de-sogra", description: "Caixa com 12 olhos de sogra tradicionais.", productType: ProductType.READY, priceMode: PriceMode.FIXED, priceCents: 4000, availability: Availability.AVAILABLE, trackStock: true, stockQty: 9, stockMin: 4, unit: "cx", sortOrder: 17 },
    { categorySlug: "doces", name: "Docinho de abacaxi", slug: "docinho-abacaxi", description: "Caixa com 12 docinhos de abacaxi cristalizado.", productType: ProductType.READY, priceMode: PriceMode.FIXED, priceCents: 4200, availability: Availability.AVAILABLE, trackStock: true, stockQty: 7, stockMin: 4, unit: "cx", sortOrder: 18 },
    { categorySlug: "doces", name: "Macaron sortido", slug: "macaron-sortido", description: "Caixa com 8 macarons em sabores do dia.", productType: ProductType.READY, priceMode: PriceMode.FIXED, priceCents: 5600, availability: Availability.AVAILABLE, featured: true, trackStock: true, stockQty: 6, stockMin: 4, unit: "cx", sortOrder: 19 },
    { categorySlug: "doces", name: "Palha italiana", slug: "palha-italiana", description: "Caixa com 8 pedaços de palha italiana cremosa.", productType: ProductType.READY, priceMode: PriceMode.FIXED, priceCents: 3000, availability: Availability.AVAILABLE, trackStock: true, stockQty: 12, stockMin: 5, unit: "cx", sortOrder: 20 },
    { categorySlug: "doces", name: "Cone trufado", slug: "cone-trufado", description: "Unidade de cone recheado com brigadeiro e ganache.", productType: ProductType.READY, priceMode: PriceMode.FIXED, priceCents: 900, availability: Availability.AVAILABLE, trackStock: true, stockQty: 25, stockMin: 10, unit: "un", sortOrder: 21 },
    { categorySlug: "doces", name: "Bombom de uva", slug: "bombom-uva", description: "Caixa com 10 bombons de uva com chocolate belga.", productType: ProductType.READY, priceMode: PriceMode.FIXED, priceCents: 4500, availability: Availability.LAST_UNITS, trackStock: true, stockQty: 2, stockMin: 5, unit: "cx", sortOrder: 22 },
    { categorySlug: "doces", name: "Quindim", slug: "quindim", description: "Forminha individual de quindim brilhante.", productType: ProductType.READY, priceMode: PriceMode.FIXED, priceCents: 700, availability: Availability.AVAILABLE, trackStock: true, stockQty: 30, stockMin: 10, unit: "un", sortOrder: 23 },

    // Cupcakes
    { categorySlug: "cupcakes", name: "Cupcake de chocolate", slug: "cupcake-chocolate", description: "Cobertura de ganache e granulado belga.", productType: ProductType.READY, priceMode: PriceMode.FIXED, priceCents: 1400, availability: Availability.AVAILABLE, trackStock: true, stockQty: 20, stockMin: 8, unit: "un", sortOrder: 10 },
    { categorySlug: "cupcakes", name: "Cupcake de baunilha", slug: "cupcake-baunilha", description: "Massa de baunilha com buttercream rosa.", productType: ProductType.READY, priceMode: PriceMode.FIXED, priceCents: 1300, availability: Availability.AVAILABLE, trackStock: true, stockQty: 18, stockMin: 8, unit: "un", sortOrder: 11 },
    { categorySlug: "cupcakes", name: "Cupcake Red Velvet", slug: "cupcake-red-velvet", description: "Topping de cream cheese e coração de chocolate.", productType: ProductType.READY, priceMode: PriceMode.FIXED, priceCents: 1600, availability: Availability.AVAILABLE, featured: true, trackStock: true, stockQty: 12, stockMin: 6, unit: "un", sortOrder: 12 },
    { categorySlug: "cupcakes", name: "Cupcake de limão", slug: "cupcake-limao", description: "Glacê cítrico e raspas de limão siciliano.", productType: ProductType.READY, priceMode: PriceMode.FIXED, priceCents: 1400, availability: Availability.AVAILABLE, trackStock: true, stockQty: 15, stockMin: 6, unit: "un", sortOrder: 13 },
    { categorySlug: "cupcakes", name: "Cupcake de morango", slug: "cupcake-morango", description: "Recheio de geleia e cobertura de chantilly.", productType: ProductType.READY, priceMode: PriceMode.FIXED, priceCents: 1500, promoPriceCents: 1200, availability: Availability.AVAILABLE, trackStock: true, stockQty: 10, stockMin: 5, unit: "un", sortOrder: 14 },
    { categorySlug: "cupcakes", name: "Cupcake de Nutella", slug: "cupcake-nutella", description: "Centro de Nutella e cobertura cremosa.", productType: ProductType.READY, priceMode: PriceMode.FIXED, priceCents: 1700, availability: Availability.AVAILABLE, trackStock: true, stockQty: 14, stockMin: 6, unit: "un", sortOrder: 15 },
    { categorySlug: "cupcakes", name: "Cupcake de cenoura", slug: "cupcake-cenoura", description: "Cobertura de chocolate meio amargo.", productType: ProductType.READY, priceMode: PriceMode.FIXED, priceCents: 1300, availability: Availability.AVAILABLE, trackStock: true, stockQty: 16, stockMin: 6, unit: "un", sortOrder: 16 },
    { categorySlug: "cupcakes", name: "Caixa 6 cupcakes", slug: "caixa-6-cupcakes", description: "Mix de sabores à escolha, embalados para presente.", productType: ProductType.READY, priceMode: PriceMode.FROM, priceCents: 7200, availability: Availability.AVAILABLE, featured: true, sortOrder: 17 },
    { categorySlug: "cupcakes", name: "Caixa 12 cupcakes", slug: "caixa-12-cupcakes", description: "Dozeninha sortida ideal para festinhas.", productType: ProductType.READY, priceMode: PriceMode.FROM, priceCents: 13200, availability: Availability.AVAILABLE, sortOrder: 18 },

    // Kits
    { categorySlug: "kits", name: "Kit Festa 10 pessoas", slug: "kit-festa-10", description: "Kit compacto para comemorações menores.", productType: ProductType.PARTY_KIT, priceMode: PriceMode.FROM, priceCents: 18000, availability: Availability.MADE_TO_ORDER, kitContents: "1 bolo 1 kg\n30 brigadeiros\n10 cupcakes\n10 mini brownies", minAdvanceDays: 4, sortOrder: 10 },
    { categorySlug: "kits", name: "Kit Festa 40 pessoas", slug: "kit-festa-40", description: "Para festas maiores — bolo, doces e sobremesas.", productType: ProductType.PARTY_KIT, priceMode: PriceMode.FROM, priceCents: 58000, availability: Availability.MADE_TO_ORDER, featured: true, kitContents: "1 bolo 3 kg\n100 brigadeiros\n40 cupcakes\n40 mini brownies\n20 bem-casados", minAdvanceDays: 7, sortOrder: 11 },
    { categorySlug: "kits", name: "Kit Café da tarde", slug: "kit-cafe-tarde", description: "Bolo caseiro, brownies e docinhos para 6 pessoas.", productType: ProductType.PARTY_KIT, priceMode: PriceMode.FIXED, priceCents: 9800, availability: Availability.AVAILABLE, kitContents: "1 bolo banana ou formigueiro\n6 brownies\n12 brigadeiros", sortOrder: 12 },
    { categorySlug: "kits", name: "Kit Presente Doce", slug: "kit-presente", description: "Caixa presenteável com mix de doces gourmet.", productType: ProductType.READY, priceMode: PriceMode.FIXED, priceCents: 7900, promoPriceCents: 6900, availability: Availability.AVAILABLE, featured: true, trackStock: true, stockQty: 8, stockMin: 3, unit: "cx", suggestInCart: true, sortOrder: 13 },
    { categorySlug: "kits", name: "Kit Corporativo", slug: "kit-corporativo", description: "Mini doces embalados individualmente para eventos.", productType: ProductType.PARTY_KIT, priceMode: PriceMode.FROM, priceCents: 25000, availability: Availability.MADE_TO_ORDER, kitContents: "50 mini brigadeiros\n50 mini beijinhos\n30 cones trufados", minAdvanceDays: 5, sortOrder: 14 },
    { categorySlug: "kits", name: "Kit Chá de bebê", slug: "kit-cha-bebe", description: "Doces e bolo temáticos em tons pastel.", productType: ProductType.PARTY_KIT, priceMode: PriceMode.FROM, priceCents: 28000, availability: Availability.MADE_TO_ORDER, kitContents: "1 bolo 1,5 kg temático\n40 docinhos\n20 cupcakes decorados", minAdvanceDays: 5, sortOrder: 15 },
    { categorySlug: "kits", name: "Kit Casamento íntimo", slug: "kit-casamento", description: "Bem-casados, bolo e doces sofisticados.", productType: ProductType.PARTY_KIT, priceMode: PriceMode.FROM, priceCents: 45000, availability: Availability.MADE_TO_ORDER, kitContents: "1 bolo 2 kg\n80 bem-casados\n60 brigadeiros gourmet", minAdvanceDays: 10, sortOrder: 16 },

    // Bolos personalizados
    { categorySlug: "bolos-personalizados", name: "Bolo temático infantil", slug: "bolo-tematico-infantil", description: "Tema à escolha: personagens, cores e topo personalizado.", productType: ProductType.CAKE, priceMode: PriceMode.FROM, priceCents: 15000, availability: Availability.MADE_TO_ORDER, featured: true, minAdvanceDays: 5, sortOrder: 10 },
    { categorySlug: "bolos-personalizados", name: "Bolo naked cake", slug: "bolo-naked", description: "Estilo rústico com frutas frescas e flores comestíveis.", productType: ProductType.CAKE, priceMode: PriceMode.FROM, priceCents: 14000, availability: Availability.MADE_TO_ORDER, minAdvanceDays: 4, sortOrder: 11 },
    { categorySlug: "bolos-personalizados", name: "Bolo andares", slug: "bolo-andares", description: "Dois ou três andares para festas e casamentos.", productType: ProductType.CAKE, priceMode: PriceMode.FROM, priceCents: 28000, availability: Availability.MADE_TO_ORDER, minAdvanceDays: 7, sortOrder: 12 },
    { categorySlug: "bolos-personalizados", name: "Bolo number cake", slug: "bolo-number", description: "Formato de número ou letra com recheio e toppings.", productType: ProductType.CAKE, priceMode: PriceMode.FROM, priceCents: 16000, availability: Availability.MADE_TO_ORDER, minAdvanceDays: 4, sortOrder: 13 },
    { categorySlug: "bolos-personalizados", name: "Bolo vegan", slug: "bolo-vegan", description: "Sem ovos e sem laticínios — sabores chocolate ou cenoura.", productType: ProductType.CAKE, priceMode: PriceMode.FROM, priceCents: 13000, availability: Availability.MADE_TO_ORDER, minAdvanceDays: 4, sortOrder: 14 },
    { categorySlug: "bolos-personalizados", name: "Bolo sem glúten", slug: "bolo-sem-gluten", description: "Massa de amêndoas, sem glúten, com cobertura especial.", productType: ProductType.CAKE, priceMode: PriceMode.FROM, priceCents: 14500, availability: Availability.MADE_TO_ORDER, minAdvanceDays: 5, sortOrder: 15 },

    // Datas comemorativas
    { categorySlug: "datas", name: "Bolo de aniversário clássico", slug: "bolo-aniversario", description: "Decoração festiva com velas e mensagem personalizada.", productType: ProductType.CAKE, priceMode: PriceMode.FROM, priceCents: 11000, availability: Availability.MADE_TO_ORDER, featured: true, minAdvanceDays: 3, sortOrder: 10 },
    { categorySlug: "datas", name: "Torta dia das mães", slug: "torta-maes", description: "Torta especial com flores de buttercream.", productType: ProductType.CAKE, priceMode: PriceMode.FROM, priceCents: 12500, availability: Availability.MADE_TO_ORDER, minAdvanceDays: 4, sortOrder: 11 },
    { categorySlug: "datas", name: "Caixa namorados", slug: "caixa-namorados", description: "Doces e trufas em embalagem romântica.", productType: ProductType.READY, priceMode: PriceMode.FIXED, priceCents: 8900, availability: Availability.AVAILABLE, featured: true, trackStock: true, stockQty: 10, stockMin: 3, unit: "cx", sortOrder: 12 },
    { categorySlug: "datas", name: "Bolo de Natal", slug: "bolo-natal", description: "Frutas cristalizadas, especiarias e glacê branco.", productType: ProductType.CAKE, priceMode: PriceMode.FROM, priceCents: 15000, availability: Availability.MADE_TO_ORDER, minAdvanceDays: 5, sortOrder: 13 },
    { categorySlug: "datas", name: "Panetone trufado", slug: "panetone-trufado", description: "Panetone artesanal recheado e coberto de chocolate.", productType: ProductType.READY, priceMode: PriceMode.FIXED, priceCents: 7800, availability: Availability.AVAILABLE, trackStock: true, stockQty: 15, stockMin: 5, unit: "un", sortOrder: 14 },
    { categorySlug: "datas", name: "Bolo de Páscoa", slug: "bolo-pascoa", description: "Com ovos de chocolate e toppings coloridos.", productType: ProductType.CAKE, priceMode: PriceMode.FROM, priceCents: 13500, availability: Availability.MADE_TO_ORDER, minAdvanceDays: 5, sortOrder: 15 },
    { categorySlug: "datas", name: "Ovo de colher 350g", slug: "ovo-colher-350", description: "Ovo artesanal de colher com recheio de ninho e Nutella.", productType: ProductType.READY, priceMode: PriceMode.FIXED, priceCents: 8900, availability: Availability.AVAILABLE, featured: true, trackStock: true, stockQty: 12, stockMin: 3, unit: "un", sortOrder: 18 },
    { categorySlug: "datas", name: "Ovo de colher 500g", slug: "ovo-colher-500", description: "Versão maior, com duas camadas de recheio e toppings.", productType: ProductType.READY, priceMode: PriceMode.FIXED, priceCents: 11900, availability: Availability.AVAILABLE, trackStock: true, stockQty: 8, stockMin: 3, unit: "un", sortOrder: 19 },
    { categorySlug: "datas", name: "Kit formatura", slug: "kit-formatura", description: "Bolo e doces com tema acadêmico.", productType: ProductType.PARTY_KIT, priceMode: PriceMode.FROM, priceCents: 35000, availability: Availability.MADE_TO_ORDER, kitContents: "1 bolo 2 kg\n60 brigadeiros\n30 cupcakes", minAdvanceDays: 6, sortOrder: 16 },
    { categorySlug: "datas", name: "Doces de Halloween", slug: "doces-halloween", description: "Caixa temática com brigadeiros e cupcakes assustadores.", productType: ProductType.READY, priceMode: PriceMode.FIXED, priceCents: 6500, availability: Availability.AVAILABLE, trackStock: true, stockQty: 8, stockMin: 3, unit: "cx", sortOrder: 17 },

    // Brownies
    { categorySlug: "brownies", name: "Brownie com Nutella", slug: "brownie-nutella", description: "Centro cremoso de Nutella e cobertura crocante.", productType: ProductType.READY, priceMode: PriceMode.FIXED, priceCents: 1200, availability: Availability.AVAILABLE, featured: true, trackStock: true, stockQty: 20, stockMin: 8, unit: "un", sortOrder: 10 },
    { categorySlug: "brownies", name: "Brownie com nozes", slug: "brownie-nozes", description: "Nozes tostadas e chocolate meio amargo.", productType: ProductType.READY, priceMode: PriceMode.FIXED, priceCents: 1100, availability: Availability.AVAILABLE, trackStock: true, stockQty: 15, stockMin: 6, unit: "un", sortOrder: 11 },
    { categorySlug: "brownies", name: "Brownie de chocolate branco", slug: "brownie-branco", description: "Versão suave com chocolate branco e framboesa.", productType: ProductType.READY, priceMode: PriceMode.FIXED, priceCents: 1300, availability: Availability.AVAILABLE, trackStock: true, stockQty: 12, stockMin: 5, unit: "un", sortOrder: 12 },
    { categorySlug: "brownies", name: "Brownie salted caramel", slug: "brownie-caramel", description: "Caramelo salgado e flor de sal por cima.", productType: ProductType.READY, priceMode: PriceMode.FIXED, priceCents: 1400, promoPriceCents: 1100, availability: Availability.AVAILABLE, featured: true, trackStock: true, stockQty: 18, stockMin: 6, unit: "un", sortOrder: 13 },
    { categorySlug: "brownies", name: "Brownie Oreo", slug: "brownie-oreo", description: "Camada de Oreo e cobertura de ganache.", productType: ProductType.READY, priceMode: PriceMode.FIXED, priceCents: 1250, availability: Availability.AVAILABLE, trackStock: true, stockQty: 14, stockMin: 6, unit: "un", sortOrder: 14 },
    { categorySlug: "brownies", name: "Mini brownie (cx 12)", slug: "mini-brownie-12", description: "Caixa com 12 mini brownies para festa.", productType: ProductType.READY, priceMode: PriceMode.FIXED, priceCents: 4800, availability: Availability.AVAILABLE, trackStock: true, stockQty: 10, stockMin: 4, unit: "cx", sortOrder: 15 },
    { categorySlug: "brownies", name: "Brownie recheado doce de leite", slug: "brownie-doce-leite", description: "Fatia generosa com recheio de doce de leite.", productType: ProductType.READY, priceMode: PriceMode.FIXED, priceCents: 1350, availability: Availability.AVAILABLE, trackStock: true, stockQty: 16, stockMin: 6, unit: "un", sortOrder: 16 },
    { categorySlug: "brownies", name: "Brownie vegan", slug: "brownie-vegan", description: "Sem ovos e sem laticínios, igualmente irresistível.", productType: ProductType.READY, priceMode: PriceMode.FIXED, priceCents: 1500, availability: Availability.AVAILABLE, trackStock: true, stockQty: 8, stockMin: 4, unit: "un", sortOrder: 17 },
    { categorySlug: "brownies", name: "Brownie sem glúten", slug: "brownie-sem-gluten", description: "Farinha de amêndoas e cacau 70%.", productType: ProductType.READY, priceMode: PriceMode.FIXED, priceCents: 1600, availability: Availability.AVAILABLE, trackStock: true, stockQty: 6, stockMin: 3, unit: "un", sortOrder: 18 },
    { categorySlug: "brownies", name: "Caixa brownie mista", slug: "caixa-brownie-mista", description: "6 sabores diferentes em uma só caixa.", productType: ProductType.READY, priceMode: PriceMode.FIXED, priceCents: 6500, availability: Availability.AVAILABLE, featured: true, trackStock: true, stockQty: 7, stockMin: 3, unit: "cx", sortOrder: 19 },
  ];

  const categoryCounters: Record<string, number> = {};

  await Product.insertMany(
    bulkProducts.map((p) => {
      const idx = categoryCounters[p.categorySlug] ?? 0;
      categoryCounters[p.categorySlug] = idx + 1;
      return {
        storeId,
        categoryId: bySlug[p.categorySlug],
        name: p.name,
        slug: p.slug,
        description: p.description,
        imageUrl: pickPhoto(p.categorySlug, idx),
        productType: p.productType,
        priceMode: p.priceMode,
        priceCents: p.priceCents,
        promoPriceCents: p.promoPriceCents,
        availability: p.availability,
        featured: p.featured ?? false,
        trackStock: p.trackStock ?? false,
        stockQty: p.stockQty ?? 0,
        stockMin: p.stockMin ?? 5,
        unit: p.unit ?? "un",
        minAdvanceDays: p.minAdvanceDays,
        kitContents: p.kitContents,
        suggestInCart: p.suggestInCart ?? false,
        sortOrder: p.sortOrder,
        active: true,
      };
    }),
  );

  console.log(`+ ${bulkProducts.length} produtos de teste adicionados`);

  await StockMovement.insertMany([
    {
      storeId,
      productId: String(brigadeiro._id),
      type: StockMovementType.IN,
      quantity: 20,
      note: "Produção da semana",
    },
    {
      storeId,
      productId: String(brigadeiro._id),
      type: StockMovementType.OUT,
      quantity: 8,
      note: "Pedidos",
    },
    {
      storeId,
      productId: String(brownie._id),
      type: StockMovementType.ADJUST,
      quantity: 3,
      note: "Contagem",
    },
  ]);

  await Promotion.create({
    storeId,
    name: "10% OFF em kits de aniversário",
    code: "KIT10",
    type: PromotionType.PERCENT,
    percentOff: 10,
    startsAt: subDays(new Date(), 5),
    endsAt: subDays(new Date(), -25),
    usageLimit: 50,
    active: true,
  });

  const customer = await Customer.create({
    storeId,
    name: "Ana Paula",
    phone: "75988776655",
    email: "ana@email.com",
    notes: "Prefere retirada. Aniversário da filha em outubro.",
  });

  const order = await Order.create({
    storeId,
    customerId: String(customer._id),
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
    items: [
      {
        productId: String(brigadeiro._id),
        productName: brigadeiro.name,
        quantity: 1,
        unitPriceCents: 4500,
        lineTotalCents: 4500,
      },
    ],
  });

  await Order.create({
    storeId,
    customerId: String(customer._id),
    kind: OrderKind.QUOTE,
    status: OrderStatus.CONFIRMED,
    customerName: customer.name,
    customerPhone: customer.phone,
    fulfillment: FulfillmentType.DELIVERY,
    deliveryZone: "Kalilândia",
    deliveryFeeCents: 1000,
    eventDate: subDays(new Date(), -2),
    eventTime: "10:30",
    paymentMethod: "Sinal para encomenda",
    subtotalCents: 12000,
    totalCents: 13500,
    items: [
      {
        productId: String(bolo._id),
        productName: bolo.name,
        quantity: 1,
        unitPriceCents: 12000,
        lineTotalCents: 12000,
        customizations: { Tamanho: "2 kg", Sabor: "Ninho" },
      },
    ],
  });

  const eventTypes = [
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
      productId:
        i % 3 === 0
          ? String(bolo._id)
          : i % 3 === 1
            ? String(brigadeiro._id)
            : String(brownie._id),
      source: i % 4 === 0 ? "instagram" : i % 4 === 1 ? "whatsapp" : "direct",
      createdAt: day,
    });
  }
  await AnalyticsEvent.insertMany(analyticsData);
  await AnalyticsEvent.create({
    storeId,
    type: AnalyticsEventType.ORDER_COMPLETED,
    meta: { orderId: String(order._id) },
  });

  console.log("Seed OK — Doce Encanto · Feira de Santana");
  console.log(`Produtos: ${5 + bulkProducts.length} (5 base + ${bulkProducts.length} teste)`);
  console.log("Login: demo@doceencanto.com / demo1234");
  console.log("Vitrine: /doce-encanto");

  await mongoose.disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
