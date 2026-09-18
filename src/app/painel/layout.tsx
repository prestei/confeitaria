import { redirect } from "next/navigation";
import { auth, signOut } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PainelSidebar } from "@/components/painel/painel-sidebar";

export default async function PainelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/entrar");

  const store = session.user.storeId
    ? await prisma.store.findUnique({ where: { id: session.user.storeId } })
    : null;

  return (
    <div className="bg-atelier bg-grain min-h-screen lg:flex">
      <PainelSidebar
        storeName={store?.name || session.user.name || "Sua confeitaria"}
        storeSlug={store?.slug || null}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="hidden items-center justify-end gap-3 border-b border-cocoa/8 bg-cream/80 px-6 py-3 lg:flex">
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/" });
            }}
          >
            <button type="submit" className="btn-secondary !px-3 !py-2 text-sm">
              Sair
            </button>
          </form>
        </header>
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 sm:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
