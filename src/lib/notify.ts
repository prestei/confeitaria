import { connectDB } from "@/lib/db";
import { appBaseUrl, sendMail } from "@/lib/mail";
import { formatBRL } from "@/lib/utils";
import { sendWhatsAppText } from "@/lib/whatsapp-notify";
import { Store, type StoreDoc } from "@/models/Store";
import { User } from "@/models/User";

type StoreNotifyPrefs = Pick<
  StoreDoc,
  | "name"
  | "slug"
  | "whatsapp"
  | "notifyNewOrders"
  | "notifyLowStock"
  | "notifyNewCustomers"
  | "notifyViaEmail"
  | "notifyViaWhatsApp"
  | "userId"
>;

async function loadOwnerEmail(userId: string) {
  const user = await User.findById(userId).select({ email: 1, name: 1 }).lean();
  return user
    ? { email: user.email as string, name: (user.name as string) || "" }
    : null;
}

async function dispatch(
  store: StoreNotifyPrefs,
  subject: string,
  body: string,
) {
  const tasks: Promise<unknown>[] = [];

  if (store.notifyViaEmail !== false) {
    tasks.push(
      (async () => {
        const owner = await loadOwnerEmail(store.userId);
        if (!owner?.email) return;
        await sendMail({
          to: owner.email,
          subject,
          text: body,
        });
      })(),
    );
  }

  if (store.notifyViaWhatsApp !== false && store.whatsapp) {
    tasks.push(sendWhatsAppText(store.whatsapp, `*${subject}*\n\n${body}`));
  }

  await Promise.allSettled(tasks);
}

export async function notifyNewOrder(input: {
  storeId: string;
  orderId: string;
  customerName: string;
  totalCents: number;
  priceLabel: string;
}) {
  await connectDB();
  const store = await Store.findById(input.storeId).lean();
  if (!store?.notifyNewOrders) return;

  const painelUrl = `${appBaseUrl()}/painel/pedidos/${input.orderId}`;
  const total =
    input.priceLabel === "TO_CONFIRM"
      ? "a confirmar"
      : formatBRL(input.totalCents);

  await dispatch(
    store,
    `Novo pedido — ${store.name}`,
    [
      `Você recebeu um novo pedido de ${input.customerName}.`,
      `Total: ${total}`,
      `Abrir no painel: ${painelUrl}`,
    ].join("\n"),
  );
}

export async function notifyLowStock(input: {
  storeId: string;
  productName: string;
  stockQty: number;
  stockMin: number;
}) {
  await connectDB();
  const store = await Store.findById(input.storeId).lean();
  if (!store?.notifyLowStock) return;

  await dispatch(
    store,
    `Estoque baixo — ${input.productName}`,
    [
      `O produto "${input.productName}" está com estoque baixo.`,
      `Quantidade atual: ${input.stockQty} (mínimo: ${input.stockMin})`,
      `Abrir estoque: ${appBaseUrl()}/painel/estoque`,
    ].join("\n"),
  );
}

export async function notifyNewCustomer(input: {
  storeId: string;
  customerName: string;
  customerPhone: string;
}) {
  await connectDB();
  const store = await Store.findById(input.storeId).lean();
  if (!store?.notifyNewCustomers) return;

  await dispatch(
    store,
    `Novo cliente — ${store.name}`,
    [
      `Novo cliente cadastrado: ${input.customerName}`,
      `WhatsApp: ${input.customerPhone}`,
      `Abrir clientes: ${appBaseUrl()}/painel/clientes`,
    ].join("\n"),
  );
}

/** Fires when stock crosses from above the minimum into the low/empty range. */
export async function maybeNotifyLowStockTransition(input: {
  storeId: string;
  productName: string;
  previousQty: number;
  nextQty: number;
  stockMin: number;
  trackStock: boolean;
}) {
  if (!input.trackStock) return;
  if (!(input.previousQty > input.stockMin && input.nextQty <= input.stockMin)) {
    return;
  }

  await notifyLowStock({
    storeId: input.storeId,
    productName: input.productName,
    stockQty: input.nextQty,
    stockMin: input.stockMin,
  });
}
