import Link from "next/link";

export function LandingFooter() {
  return (
    <footer className="border-t border-cocoa/8">
      <div className="shell flex flex-col gap-8 py-10 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Link
            href="/"
            className="font-display text-2xl text-cocoa"
          >
            Doce<span className="text-rosewood">Pedido</span>
          </Link>
          <p className="mt-3 max-w-xs text-sm leading-relaxed text-cocoa-soft">
            Cardápio online e gestão de pedidos para confeiteiras, boleiras e
            docerias.
          </p>
        </div>

        <div className="flex flex-wrap gap-10 text-sm">
          <div className="space-y-2">
            <p className="font-semibold text-cocoa">Produto</p>
            <a href="#como-funciona" className="block text-cocoa-soft hover:text-cocoa">
              Como funciona
            </a>
            <a href="#modos" className="block text-cocoa-soft hover:text-cocoa">
              Modos de venda
            </a>
            <Link href="/doce-encanto" className="block text-cocoa-soft hover:text-cocoa">
              Ver demonstração
            </Link>
          </div>
          <div className="space-y-2">
            <p className="font-semibold text-cocoa">Conta</p>
            <Link href="/entrar" className="block text-cocoa-soft hover:text-cocoa">
              Entrar
            </Link>
            <Link href="/cadastrar" className="block text-cocoa-soft hover:text-cocoa">
              Criar conta
            </Link>
          </div>
        </div>
      </div>
      <div className="border-t border-cocoa/8">
        <p className="shell py-5 text-xs text-ink-muted">
          © {new Date().getFullYear()} DocePedido. Feito com cuidado para quem
          trabalha com confeitaria.
        </p>
      </div>
    </footer>
  );
}
