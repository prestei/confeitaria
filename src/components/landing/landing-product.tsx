import Image from "next/image";

const benefits = [
  {
    title: "Vitrine com a sua cara",
    text: "Apresente produtos com fotos, descrições e preços — sem planilha nem mensagem solta.",
  },
  {
    title: "Pedidos que fazem sentido",
    text: "O cliente escolhe opções, data e detalhes. Você recebe tudo organizado no WhatsApp.",
  },
  {
    title: "Rotina mais leve",
    text: "Menos idas e vindas. Mais tempo para produzir, com agenda e pedidos no mesmo lugar.",
  },
];

const INTRO_IMAGE =
  "https://images.unsplash.com/photo-1486427944299-d1955d23e34d?auto=format&fit=crop&w=1400&q=80";

export function LandingProduct() {
  return (
    <section id="produto" className="section-pad bg-sand">
      <div className="shell grid items-center gap-12 lg:grid-cols-2 lg:gap-20">
        <div data-reveal>
          <p className="eyebrow">O que é</p>
          <h2 className="mt-4 font-display text-3xl leading-tight text-cocoa sm:text-4xl lg:text-[2.75rem]">
            Uma vitrine digital feita para quem vende com as mãos.
          </h2>
          <p className="lead mt-5 max-w-lg">
            DocePedido é a forma simples de transformar o seu cardápio em uma
            experiência de compra clara — do primeiro clique até a mensagem no
            WhatsApp.
          </p>

          <ul className="mt-10 space-y-8">
            {benefits.map((b, i) => (
              <li key={b.title} data-reveal-item className="flex gap-5">
                <span className="font-display text-2xl text-rosewood/70 tabular-nums">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div>
                  <h3 className="font-display text-xl text-cocoa sm:text-2xl">
                    {b.title}
                  </h3>
                  <p className="mt-2 max-w-md text-[0.95rem] leading-relaxed text-cocoa-soft">
                    {b.text}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div data-reveal className="relative">
          <div
            data-parallax
            className="relative aspect-[4/5] overflow-hidden rounded-xl"
          >
            <Image
              src={INTRO_IMAGE}
              alt="Cupcakes artesanais em mesa de confeitaria"
              fill
              sizes="(max-width: 1024px) 100vw, 40vw"
              className="object-cover"
            />
          </div>
          <p className="mt-4 text-sm text-ink-muted">
            Feito para boleiras, docerias e profissionais de festa.
          </p>
        </div>
      </div>
    </section>
  );
}
