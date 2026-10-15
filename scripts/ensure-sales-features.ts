import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { connectDB } from "../src/lib/db";
import { Store } from "../src/models/Store";
import { Product } from "../src/models/Product";
import { CatalogAddon } from "../src/models/Addon";
import { AddonSelectionType, Availability, PriceMode, ProductType } from "../src/lib/enums";
import { Category } from "../src/models/Category";

function loadEnv() {
  for (const file of [".env", ".env.local"]) {
    const envPath = resolve(process.cwd(), file);
    if (!existsSync(envPath)) continue;
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
}

loadEnv();

async function main() {
  await connectDB();
  const stores = await Store.find().select({ _id: 1, slug: 1 }).lean();

  for (const store of stores) {
    const storeId = String(store._id);

    await CatalogAddon.updateMany(
      { storeId, name: "Vela numérica" },
      { $set: { name: "Velas decorativas", suggestInCart: true } },
    );
    await CatalogAddon.updateMany(
      { storeId, name: "Topo de bolo" },
      { $set: { name: "Topo de bolo impresso", suggestInCart: true } },
    );
    await CatalogAddon.updateMany(
      { storeId, name: { $in: ["Caixa para presente", "Embalagem para presente"] } },
      { $set: { name: "Embalagem para presente", suggestInCart: true } },
    );
    await CatalogAddon.updateMany(
      { storeId, name: { $in: ["Velas decorativas", "Topo de bolo impresso"] } },
      { $set: { suggestInCart: true } },
    );
    await Product.updateOne(
      { storeId, slug: "kit-presente" },
      { $set: { suggestInCart: true } },
    );

    const addons = await CatalogAddon.find({ storeId })
      .select({ name: 1, suggestInCart: 1, active: 1 })
      .lean();
    console.log("addons", addons);

    if ((await CatalogAddon.countDocuments({ storeId })) === 0) {
      await CatalogAddon.insertMany([
        {
          storeId,
          name: "Velas decorativas",
          description: "Velas para o bolo — informe o número e a cor.",
          priceCents: 800,
          selectionType: AddonSelectionType.TEXT,
          maxQty: 1,
          noteLabel: "Número e cor",
          noteRequired: true,
          suggestInCart: true,
          sortOrder: 1,
          active: true,
        },
        {
          storeId,
          name: "Topo de bolo impresso",
          description: "Topo personalizado com nome ou tema.",
          priceCents: 1800,
          selectionType: AddonSelectionType.TEXT,
          maxQty: 1,
          noteLabel: "Tema ou nome",
          noteRequired: true,
          suggestInCart: true,
          sortOrder: 2,
          active: true,
        },
        {
          storeId,
          name: "Embalagem para presente",
          description: "Caixa pronta para presentear.",
          priceCents: 1500,
          selectionType: AddonSelectionType.TOGGLE,
          maxQty: 1,
          suggestInCart: true,
          sortOrder: 3,
          active: true,
        },
      ]);
      console.log(`+ adicionais de upsell em ${store.slug}`);
    }

    const datasCat = await Category.findOne({
      storeId,
      slug: { $in: ["datas", "datas-comemorativas"] },
    }).lean();
    const eggSlugs = await Product.find({
      storeId,
      slug: { $in: ["ovo-colher-350", "ovo-colher-500"] },
    })
      .select({ slug: 1 })
      .lean();
    const haveEggs = new Set(eggSlugs.map((p) => p.slug));
    if (datasCat && !haveEggs.has("ovo-colher-350")) {
      await Product.create({
        storeId,
        categoryId: String(datasCat._id),
        name: "Ovo de colher 350g",
        slug: "ovo-colher-350",
        description: "Ovo artesanal de colher com recheio de ninho e Nutella.",
        imageUrl:
          "https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&w=900&q=80",
        productType: ProductType.READY,
        priceMode: PriceMode.FIXED,
        priceCents: 8900,
        availability: Availability.AVAILABLE,
        featured: true,
        trackStock: true,
        stockQty: 12,
        stockMin: 3,
        unit: "un",
        sortOrder: 18,
        active: true,
      });
      console.log("+ produto ovo-colher-350");
    }
    if (datasCat && !haveEggs.has("ovo-colher-500")) {
      await Product.create({
        storeId,
        categoryId: String(datasCat._id),
        name: "Ovo de colher 500g",
        slug: "ovo-colher-500",
        description: "Versão maior, com duas camadas de recheio e toppings.",
        imageUrl:
          "https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&w=900&q=80",
        productType: ProductType.READY,
        priceMode: PriceMode.FIXED,
        priceCents: 11900,
        availability: Availability.AVAILABLE,
        trackStock: true,
        stockQty: 8,
        stockMin: 3,
        unit: "un",
        sortOrder: 19,
        active: true,
      });
      console.log("+ produto ovo-colher-500");
    }
  }

  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
