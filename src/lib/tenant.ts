import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { Store } from "@/models/Store";
import { leanDoc } from "@/lib/serialize";

export async function requireStoreSession() {
  const session = await auth();
  if (!session?.user?.id || !session.user.storeId) {
    redirect("/entrar");
  }
  return {
    userId: session.user.id,
    storeId: session.user.storeId,
    storeSlug: session.user.storeSlug,
    name: session.user.name,
    email: session.user.email,
  };
}

/** Ensure DB is connected and return the store owned by the session. */
export async function requireTenantStore() {
  const session = await requireStoreSession();
  await connectDB();
  const store = leanDoc(
    await Store.findOne({
      _id: session.storeId,
      userId: session.userId,
    }).lean(),
  );
  if (!store) redirect("/entrar");
  return { session, store };
}

/** Public store lookup by slug (tenant root for the storefront). */
export async function getStoreBySlug(slug: string) {
  await connectDB();
  return leanDoc(
    await Store.findOne({ slug, isPublished: true }).lean(),
  );
}

/** Always scope tenant queries with this storeId. */
export function tenantFilter(storeId: string) {
  return { storeId } as const;
}
