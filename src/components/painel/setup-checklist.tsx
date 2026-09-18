import Link from "next/link";
import { Check, Circle } from "lucide-react";
import { cn } from "@/lib/cn";

export type SetupStep = {
  id: string;
  label: string;
  done: boolean;
  href: string;
};

export function SetupChecklist({
  steps,
  complete,
}: {
  steps: SetupStep[];
  complete: boolean;
}) {
  const doneCount = steps.filter((s) => s.done).length;
  const pct = Math.round((doneCount / steps.length) * 100);

  if (complete) {
    return (
      <div className="rounded-xl border border-[#4A9E5F]/20 bg-[#F0F4EF] px-5 py-4">
        <p className="text-sm font-semibold text-[#4A9E5F]">
          Sua vitrine está pronta para receber clientes
        </p>
        <p className="mt-1 text-xs text-[#8C8682]">
          Configuração completa. Continue cadastrando produtos e divulgando o
          link.
        </p>
      </div>
    );
  }

  return (
    <section className="rounded-xl border border-[#E8E2DE] bg-white p-5 shadow-[0_1px_2px_rgba(45,41,38,0.04)] sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-[#2D2926]">
            Sua vitrine está quase pronta
          </h2>
          <p className="mt-1 text-sm text-[#8C8682]">
            Complete estes passos para começar a receber pedidos.
          </p>
        </div>
        <p className="text-sm font-semibold tabular-nums text-[#2D2926]">
          {doneCount}/{steps.length}
        </p>
      </div>

      <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-[#F5F0ED]">
        <div
          className="h-full rounded-full bg-[#C85A5A] transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>

      <ul className="mt-5 grid gap-2 sm:grid-cols-2">
        {steps.map((step) => (
          <li key={step.id}>
            <Link
              href={step.href}
              className={cn(
                "flex items-center gap-3 rounded-lg border px-3.5 py-3 text-sm transition",
                step.done
                  ? "border-[#4A9E5F]/15 bg-[#F0F4EF] text-[#8C8682]"
                  : "border-[#E8E2DE] bg-[#FDF8F6] text-[#2D2926] hover:border-[#D4C9C2]",
              )}
            >
              {step.done ? (
                <Check className="h-4 w-4 shrink-0 text-[#4A9E5F]" />
              ) : (
                <Circle className="h-4 w-4 shrink-0 text-[#C8C2BE]" />
              )}
              <span className={cn(step.done && "line-through opacity-70")}>
                {step.label}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
