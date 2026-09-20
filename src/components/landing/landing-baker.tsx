const areas = [
  {
    title: "Produtos",
    text: "Cadastre itens, categorias, adicionais e disponibilidade.",
  },
  {
    title: "Pedidos",
    text: "Acompanhe status, totais e detalhes sem perder o fio da conversa.",
  },
  {
    title: "Agenda",
    text: "Visualize datas de entrega e bloqueie dias inviáveis.",
  },
  {
    title: "Clientes",
    text: "Histórico de contatos e recorrência em um só lugar.",
  },
  {
    title: "Configurações",
    text: "WhatsApp, prazos, aparência da loja e link público.",
  },
];

export function LandingBaker() {
  return (
    <section id="experiencia" className="section-pad">
      <div className="shell grid items-start gap-12 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] lg:gap-16">
        <div data-reveal>
          <p className="eyebrow">Para você</p>
          <h2 className="mt-4 font-display text-3xl text-cocoa sm:text-4xl">
            Um painel calmo para o dia a dia da produção.
          </h2>
          <p className="lead mt-4 max-w-md">
            Menos telas coloridas. Mais clareza do que precisa ser feito —
            pedidos, agenda e produtos no mesmo ritmo da sua confeitaria.
          </p>

          <ul className="mt-10 divide-y divide-cocoa/8 border-y border-cocoa/8">
            {areas.map((a) => (
              <li key={a.title} data-reveal-item className="py-5">
                <h3 className="font-display text-xl text-cocoa">{a.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-cocoa-soft">
                  {a.text}
                </p>
              </li>
            ))}
          </ul>
        </div>

        <div data-reveal className="lg:sticky lg:top-24">
          <div className="overflow-hidden rounded-xl border border-cocoa/10 bg-surface shadow-[0_20px_50px_rgba(51,37,34,0.08)]">
            <div className="flex items-center justify-between border-b border-cocoa/8 bg-sand/60 px-5 py-3.5">
              <div>
                <p className="font-display text-lg text-cocoa">Painel</p>
                <p className="text-xs text-ink-muted">Resumo do dia</p>
              </div>
              <span className="rounded-md bg-blush px-2.5 py-1 text-[11px] font-semibold text-rosewood-deep">
                3 aguardando
              </span>
            </div>

            <div className="grid grid-cols-3 gap-px bg-cocoa/6">
              {[
                { label: "Pedidos", value: "12" },
                { label: "Hoje", value: "2" },
                { label: "Produtos", value: "18" },
              ].map((m) => (
                <div key={m.label} className="bg-surface px-4 py-5">
                  <p className="text-[11px] font-medium uppercase tracking-wider text-ink-muted">
                    {m.label}
                  </p>
                  <p className="mt-1 font-display text-2xl text-cocoa">{m.value}</p>
                </div>
              ))}
            </div>

            <div className="space-y-0 divide-y divide-cocoa/6 px-1 py-1">
              {[
                { name: "Ana Clara", detail: "Bolo red velvet · Sex 14h", status: "Novo" },
                { name: "Marcos", detail: "Kit festa 50 · Sáb 10h", status: "Produção" },
                { name: "Beatriz", detail: "Box brigadeiros · Hoje", status: "Pronto" },
              ].map((o) => (
                <div
                  key={o.name}
                  className="flex items-center justify-between gap-3 px-4 py-3.5"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-cocoa">
                      {o.name}
                    </p>
                    <p className="truncate text-xs text-ink-muted">{o.detail}</p>
                  </div>
                  <span className="shrink-0 text-[11px] font-semibold text-rosewood">
                    {o.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
          <p className="mt-3 text-center text-xs text-ink-muted">
            Ilustração do painel — dados de exemplo
          </p>
        </div>
      </div>
    </section>
  );
}
