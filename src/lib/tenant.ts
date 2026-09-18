import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

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
