const flow = [
  { title: "Cardápio", text: "O cliente abre o link e vê seus produtos." },
  { title: "Escolha", text: "Seleciona itens, tamanhos e adicionais." },
  { title: "Personalização", text: "Informa data, referências e detalhes." },
  { title: "Pedido", text: "Confirma dados e revisa o resumo." },
  { title: "WhatsApp", text: "Envia a mensagem pronta para você." },
];

export function LandingCustomer() {
  return (
    <section id="cliente" className="section-pad bg-sand">
      <div className="shell">
        <div data-reveal className="max-w-2xl">
          <p className="eyebrow">Para o cliente</p>
          <h2 className="mt-4 font-display text-3xl text-cocoa sm:text-4xl">
            Uma experiência clara do clique ao WhatsApp.
          </h2>
          <p className="lead mt-4 max-w-xl">
            Sem perguntas repetidas. Sem perder opções no meio da conversa. O
            pedido chega completo, do jeito que você precisa para produzir.
          </p>
        </div>

        <ol className="mt-14 grid gap-8 sm:grid-cols-2 lg:grid-cols-5 lg:gap-4">
          {flow.map((step, i) => (
            <li key={step.title} data-reveal-item className="relative">
              {i < flow.length - 1 && (
                <span
                  className="absolute left-[calc(100%-0.25rem)] top-3 hidden h-px w-[calc(100%-1.5rem)] bg-cocoa/10 lg:block"
                  aria-hidden
                />
              )}
              <span className="font-display text-3xl text-rosewood/50">
                {String(i + 1).padStart(2, "0")}
              </span>
              <h3 className="mt-3 font-display text-xl text-cocoa">
                {step.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-cocoa-soft">
                {step.text}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
