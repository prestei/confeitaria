import Link from "next/link";
import { Palette } from "lucide-react";
import { LandingHero } from "@/components/animations/landing-hero";
import { LandingScrollSections } from "@/components/animations/landing-scroll-sections";
import { LandingModes } from "@/components/animations/landing-modes";

export default function HomePage() {
  return (
    <div className="bg-atelier bg-grain relative min-h-screen overflow-x-hidden">
      <header className="shell relative z-20 flex items-center justify-between py-6">
        <Link href="/" className="font-display text-2xl tracking-tight text-cocoa">
          Doce<span className="text-berry">Pedido</span>
        </Link>
        <nav className="flex items-center gap-3">
          <Link href="/entrar" className="btn-secondary !py-2.5 !px-4 text-sm">
            Entrar
          </Link>
          <Link href="/cadastrar" className="btn-primary !py-2.5 !px-4 text-sm">
            Criar cardápio
          </Link>
        </nav>
      </header>

      <main>
        <LandingHero />
        <LandingScrollSections />
        <LandingModes />

        <section className="shell pb-24">
          <div className="relative overflow-hidden rounded-[2rem] border border-berry/20 bg-gradient-to-br from-berry via-berry-deep to-cocoa px-8 py-12 text-center text-white shadow-[0_24px_60px_rgba(168,50,88,0.35)] sm:px-12">
            <div
              className="pointer-events-none absolute -left-10 -top-10 h-40 w-40 rounded-full bg-butter/30 blur-2xl"
              aria-hidden
            />
            <div
              className="pointer-events-none absolute -bottom-16 -right-8 h-48 w-48 rounded-full bg-rose/40 blur-3xl"
              aria-hidden
            />
            <h2 className="relative font-display text-3xl sm:text-4xl">
              Sua confeitaria merece uma vitrine à altura
            </h2>
            <p className="relative mx-auto mt-3 max-w-lg text-white/85">
              Monte o cardápio, compartilhe o link e receba pedidos organizados
              no WhatsApp — com cara de marca premium.
            </p>
            <Link
              href="/cadastrar"
              className="relative mt-8 inline-flex items-center gap-2 rounded-2xl bg-white px-6 py-3.5 font-semibold text-berry-deep shadow-lg transition hover:-translate-y-1 hover:shadow-xl"
            >
              <Palette className="h-4 w-4" />
              Criar minha loja
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-berry/10 px-5 py-8 text-center text-sm text-cocoa-soft/70">
        DocePedido — organize encomendas, apresente produtos e venda pelo WhatsApp.
      </footer>
    </div>
  );
}
