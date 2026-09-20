import { redirect } from "next/navigation";
import { auth, signOut } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { leanDoc } from "@/lib/serialize";
import { Store } from "@/models/Store";
import { Order } from "@/models/Order";
import { Product } from "@/models/Product";
import { OrderStatus } from "@/lib/enums";
import { PainelSidebar } from "@/components/painel/painel-sidebar";
import { PainelTopbar } from "@/components/painel/painel-topbar";

export default async function PainelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/entrar");

  await connectDB();
  const store = session.user.storeId
    ? leanDoc(await Store.findOne({ _id: session.user.storeId }).lean())
    : null;

  const newOrders = store
    ? await Order.countDocuments({
        storeId: store.id,
        status: OrderStatus.NEW,
      })
    : 0;

  const lowStock = store
    ? (
        await Product.find({ storeId: store.id, trackStock: true })
          .select({ stockQty: 1, stockMin: 1 })
          .lean()
      ).filter((p) => p.stockQty <= p.stockMin).length
    : 0;

  const planLabel =
    store?.plan === "pro"
      ? "Pro"
      : store?.plan === "business"
        ? "Business"
        : "Starter";

  async function handleSignOut() {
    "use server";
    await signOut({ redirectTo: "/" });
  }

  return (
    <div className="painel-shell flex min-h-screen flex-col bg-[#F0F2F5] font-sans lg:h-screen lg:flex-row lg:overflow-hidden">
      <PainelSidebar
        storeName={store?.name || session.user.name || "Sua confeitaria"}
        userName={session.user.name || "Confeiteira"}
        storeSlug={store?.slug || null}
        plan={planLabel}
        badges={{ orders: newOrders, stock: lowStock }}
        signOutAction={handleSignOut}
      />
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <PainelTopbar
          storeName={store?.name || session.user.name || "Loja"}
          storeSlug={store?.slug || null}
          storeCity={store?.city}
          storeWhatsapp={store?.whatsapp}
          businessHours={store?.businessHours}
          isPublished={store?.isPublished ?? false}
          pickupEnabled={store?.pickupEnabled ?? true}
          deliveryEnabled={store?.deliveryEnabled ?? true}
          planLabel={planLabel}
          userName={session.user.name || "Confeiteira"}
          notificationCount={newOrders}
        />
        <main className="flex w-full min-h-0 flex-1 flex-col px-4 py-4 sm:px-6 sm:py-5 lg:px-8 xl:px-10">
          {children}
        </main>
      </div>
    </div>
  );
}
