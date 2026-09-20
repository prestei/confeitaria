const steps = [
  {
    n: "01",
    title: "Crie sua vitrine",
    text: "Cadastre a loja, personalize cores e publique um link único com QR Code.",
  },
  {
    n: "02",
    title: "Organize seus produtos",
    text: "Monte categorias, preços, adicionais e opções de personalização.",
  },
  {
    n: "03",
    title: "Receba pedidos estruturados",
    text: "O cliente finaliza e você recebe a mensagem completa no WhatsApp.",
  },
];

export function LandingHow() {
  return (
    <section id="como-funciona" className="section-pad">
      <div className="shell">
        <div data-reveal className="max-w-2xl">
          <p className="eyebrow">Como funciona</p>
          <h2 className="mt-4 font-display text-3xl text-cocoa sm:text-4xl">
            Três passos. Sem complicação.
          </h2>
          <p className="lead mt-4 max-w-xl">
            Do cadastro ao primeiro pedido, o fluxo foi pensado para caber na
            rotina de quem produz sob encomenda.
          </p>
        </div>

        <ol className="relative mt-14 grid gap-0 md:grid-cols-3">
          <div
            className="pointer-events-none absolute left-[16.5%] right-[16.5%] top-7 hidden h-px bg-cocoa/10 md:block"
            data-how-line
            aria-hidden
          />
          {steps.map((s) => (
            <li
              key={s.n}
              data-reveal-item
              className="relative border-t border-cocoa/10 pt-8 md:border-t-0 md:px-6 md:pt-0 first:md:pl-0 last:md:pr-0"
            >
              <span className="relative z-10 inline-flex h-14 w-14 items-center justify-center rounded-full border border-cocoa/10 bg-ivory font-display text-lg text-rosewood">
                {s.n}
              </span>
              <h3 className="mt-6 font-display text-2xl text-cocoa">{s.title}</h3>
              <p className="mt-3 max-w-xs text-[0.95rem] leading-relaxed text-cocoa-soft">
                {s.text}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
