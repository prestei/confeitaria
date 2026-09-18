"use client";

import { useEffect, useRef } from "react";
import { motion } from "motion/react";
import {
  CalendarDays,
  MessageCircle,
  QrCode,
  ShoppingBag,
} from "lucide-react";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { cn } from "@/lib/cn";

const audiences = [
  {
    emoji: "🎂",
    title: "Bolos personalizados",
    text: "Monte seu bolo com tamanho, massa, recheio e referências — com estimativa ou orçamento.",
    tint: "from-berry/20 to-blush",
  },
  {
    emoji: "🍫",
    title: "Doceria & pronta entrega",
    text: "Preço definido, adicionais e carrinho rápido para brigadeiros, brownies e fatias.",
    tint: "from-caramel/30 to-butter/80",
  },
  {
    emoji: "🎉",
    title: "Festas e eventos",
    text: "Kits por número de pessoas com conteúdo claro antes do contato.",
    tint: "from-rose/35 to-blush/80",
  },
  {
    emoji: "📝",
    title: "Sob encomenda",
    text: "Formulário guiado que transforma “quero um bolo” em pedido estruturado.",
    tint: "from-butter/90 to-cream",
  },
  {
    emoji: "🏢",
    title: "Corporativo",
    text: "Quantidade, logo, prazo e nota fiscal em um fluxo específico para empresas.",
    tint: "from-cocoa/10 to-fog",
  },
];

const features = [
  {
    icon: ShoppingBag,
    title: "Dois modos de venda",
    text: "Loja rápida para preço fixo e encomenda personalizada para orçamento.",
    color: "bg-berry text-white",
  },
  {
    icon: MessageCircle,
    title: "Pedido para WhatsApp",
    text: "Mensagem pronta com cliente, opções, data e total estimado ou a confirmar.",
    color: "bg-caramel text-cocoa",
  },
  {
    icon: CalendarDays,
    title: "Agenda inteligente",
    text: "Prazo mínimo e datas inviáveis bloqueadas antes de chegar na conversa.",
    color: "bg-rose text-cocoa",
  },
  {
    icon: QrCode,
    title: "Link + QR Code",
    text: "Divulgue no Instagram, embalagens e mesas com um link único da sua marca.",
    color: "bg-cocoa text-white",
  },
];

const stats = [
  { value: 100, suffix: "%", label: "foco em mobile" },
  { value: 2, suffix: "", label: "fluxos de venda" },
  { value: 1, suffix: " min", label: "para montar o pedido" },
];

export function LandingScrollSections() {
  const gridRef = useRef<HTMLDivElement>(null);
  const featuresRef = useRef<HTMLDivElement>(null);
  const statsRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    if (reduced) return;
    let ctx: { revert: () => void } | undefined;
    let cancelled = false;

    (async () => {
      const gsap = (await import("gsap")).default;
      const { ScrollTrigger } = await import("gsap/ScrollTrigger");
      if (cancelled) return;
      gsap.registerPlugin(ScrollTrigger);

      ctx = gsap.context(() => {
        if (titleRef.current) {
          gsap.from(titleRef.current, {
            opacity: 0,
            y: 40,
            duration: 0.9,
            ease: "power3.out",
            scrollTrigger: { trigger: titleRef.current, start: "top 85%" },
          });
        }

        if (gridRef.current) {
          gsap.from(gridRef.current.children, {
            opacity: 0,
            y: 48,
            scale: 0.96,
            duration: 0.7,
            stagger: 0.1,
            ease: "power3.out",
            scrollTrigger: { trigger: gridRef.current, start: "top 82%" },
          });
        }

        if (featuresRef.current) {
          gsap.from(featuresRef.current.children, {
            opacity: 0,
            x: -24,
            duration: 0.65,
            stagger: 0.12,
            ease: "power2.out",
            scrollTrigger: { trigger: featuresRef.current, start: "top 85%" },
          });
        }

        // Light parallax on audience cards
        if (gridRef.current) {
          gsap.to(gridRef.current.children, {
            y: (i) => (i % 2 === 0 ? -18 : 12),
            ease: "none",
            scrollTrigger: {
              trigger: gridRef.current,
              start: "top bottom",
              end: "bottom top",
              scrub: 1.2,
            },
          });
        }
      });
    })();

    return () => {
      cancelled = true;
      ctx?.revert();
    };
  }, [reduced]);

  useEffect(() => {
    if (reduced || !statsRef.current) return;
    let cancelled = false;
    const nodes = statsRef.current.querySelectorAll<HTMLElement>("[data-count]");

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach(async (entry) => {
          if (!entry.isIntersecting || cancelled) return;
          io.disconnect();
          const { animate } = await import("animejs");
          nodes.forEach((el) => {
            const target = Number(el.dataset.count || 0);
            const state = { n: 0 };
            animate(state, {
              n: target,
              duration: 1400,
              ease: "outExpo",
              onUpdate: () => {
                el.textContent = String(Math.round(state.n));
              },
            });
          });
        });
      },
      { threshold: 0.4 },
    );

    io.observe(statsRef.current);
    return () => {
      cancelled = true;
      io.disconnect();
    };
  }, [reduced]);

  return (
    <>
      <section className="shell relative py-20">
        <div className="blob left-[10%] top-0 h-56 w-56 bg-berry/20" aria-hidden />
        <div className="mb-12 max-w-2xl">
          <h2
            ref={titleRef}
            className="font-display text-3xl text-cocoa sm:text-5xl"
          >
            Um sistema,{" "}
            <span className="text-berry">vários sabores</span>
          </h2>
          <p className="mt-4 text-lg text-cocoa-soft/85">
            Categorias e tipos de produto que se adaptam ao seu modelo — sem
            travar em “só bolos e doces”.
          </p>
        </div>

        <div
          ref={gridRef}
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
        >
          {audiences.map((a) => (
            <motion.article
              key={a.title}
              whileHover={
                reduced
                  ? undefined
                  : { y: -8, scale: 1.02, transition: { type: "spring", stiffness: 320, damping: 20 } }
              }
              className={cn(
                "relative overflow-hidden rounded-3xl border border-white/60 bg-gradient-to-br p-6 shadow-[0_12px_40px_rgba(212,82,122,0.1)]",
                a.tint,
              )}
            >
              <div className="text-4xl" aria-hidden>
                {a.emoji}
              </div>
              <h3 className="mt-4 font-display text-2xl text-cocoa">{a.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-cocoa-soft/85">
                {a.text}
              </p>
            </motion.article>
          ))}
        </div>
      </section>

      <section
        ref={statsRef}
        className="shell pb-16"
      >
        <div className="grid gap-4 overflow-hidden rounded-[2rem] border border-berry/15 bg-cocoa px-6 py-10 text-cream sm:grid-cols-3 sm:px-10">
          {stats.map((s) => (
            <div key={s.label} className="text-center sm:text-left">
              <p className="font-display text-5xl text-butter">
                <span data-count={s.value}>{reduced ? s.value : 0}</span>
                {s.suffix}
              </p>
              <p className="mt-2 text-sm text-cream/70">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="shell pb-8">
        <div
          ref={featuresRef}
          className="grid gap-4 md:grid-cols-2 lg:grid-cols-4"
        >
          {features.map((f) => (
            <motion.div
              key={f.title}
              whileHover={reduced ? undefined : { y: -6 }}
              className="rounded-3xl border border-berry/10 bg-white/90 p-5 shadow-[0_10px_30px_rgba(212,82,122,0.08)]"
            >
              <div
                className={cn(
                  "flex h-11 w-11 items-center justify-center rounded-2xl",
                  f.color,
                )}
              >
                <f.icon className="h-5 w-5" aria-hidden />
              </div>
              <h3 className="mt-4 font-semibold text-cocoa">{f.title}</h3>
              <p className="mt-2 text-sm text-cocoa-soft/80">{f.text}</p>
            </motion.div>
          ))}
        </div>
      </section>
    </>
  );
}
