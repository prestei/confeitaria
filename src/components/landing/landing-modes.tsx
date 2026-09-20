export function LandingModes() {
  return (
    <section id="modos" className="section-pad bg-sand">
      <div className="shell">
        <div data-reveal className="mx-auto max-w-2xl text-center">
          <p className="eyebrow">Modos de venda</p>
          <h2 className="mt-4 font-display text-3xl text-cocoa sm:text-4xl">
            Dois fluxos. Uma operação.
          </h2>
          <p className="lead mx-auto mt-4 max-w-lg">
            Atenda pronta entrega e encomendas personalizadas sem misturar os
            processos — nem confundir o cliente.
          </p>
        </div>

        <div
          data-reveal
          className="mt-14 grid overflow-hidden rounded-xl border border-cocoa/10 bg-surface lg:grid-cols-2"
        >
          <article className="flex flex-col justify-between border-b border-cocoa/10 p-8 sm:p-10 lg:border-b-0 lg:border-r">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-ink-muted">
                Modo 01
              </p>
              <h3 className="mt-3 font-display text-3xl text-cocoa">
                Loja rápida
              </h3>
              <p className="mt-4 max-w-sm leading-relaxed text-cocoa-soft">
                Ideal para brigadeiros, brownies, fatias e itens com preço
                definido. O cliente monta o carrinho e envia o pedido.
              </p>
            </div>
            <p className="mt-10 font-display text-xl text-rosewood/80">
              Catálogo → Carrinho → WhatsApp
            </p>
          </article>

          <article className="flex flex-col justify-between bg-cocoa p-8 text-ivory sm:p-10">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-terracotta">
                Modo 02
              </p>
              <h3 className="mt-3 font-display text-3xl">
                Encomenda personalizada
              </h3>
              <p className="mt-4 max-w-sm leading-relaxed text-ivory/75">
                Ideal para bolos temáticos, kits festa e corporativo. O cliente
                personaliza, escolhe a data e solicita orçamento.
              </p>
            </div>
            <p className="mt-10 font-display text-xl text-terracotta">
              Personalizar → Data → Orçamento
            </p>
          </article>
        </div>
      </div>
    </section>
  );
}
