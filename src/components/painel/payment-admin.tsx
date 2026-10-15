"use client";

import { FormEvent, useState } from "react";
import { Check, CreditCard, Store, Truck } from "lucide-react";
import { SectionCard } from "@/components/painel/page-header";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/cn";
import {
  acceptsCardBrands,
  CARD_BRAND_PRESETS,
  DEFAULT_ON_DELIVERY_PAYMENT_METHODS,
  OFFLINE_PAYMENT_PRESETS,
} from "@/lib/utils";

const ONLINE_AVAILABLE = false;

async function patchStore(payload: Record<string, unknown>) {
  return fetch("/api/store", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

function normalizeMethods(methods: string[]) {
  if (methods.length > 0) return methods;
  return [...DEFAULT_ON_DELIVERY_PAYMENT_METHODS];
}

export function PaymentAdmin({
  store,
}: {
  store: {
    paymentMethods: string[];
    cardBrands: string[];
    mpEnabled: boolean;
    mpPublicKey: string;
    mpAccessTokenMasked: string | null;
    mpWebhookSecretMasked: string | null;
    mpConfigured: boolean;
  };
}) {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [methods, setMethods] = useState<string[]>(
    normalizeMethods(store.paymentMethods),
  );
  const [cardBrands, setCardBrands] = useState<string[]>(store.cardBrands ?? []);
  const [customMethod, setCustomMethod] = useState("");

  const extras = methods.filter(
    (m) => !(OFFLINE_PAYMENT_PRESETS as readonly string[]).includes(m),
  );

  function toggleMethod(method: string) {
    setMethods((prev) =>
      prev.includes(method)
        ? prev.filter((m) => m !== method)
        : [...prev, method],
    );
  }

  function addCustom() {
    const value = customMethod.trim();
    if (!value) return;
    if (!methods.includes(value)) setMethods((prev) => [...prev, value]);
    setCustomMethod("");
  }

  function useDefaults() {
    setMethods([...DEFAULT_ON_DELIVERY_PAYMENT_METHODS]);
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (methods.length === 0) {
      toast({
        title: "Selecione ao menos uma forma de pagamento na entrega",
        tone: "warning",
      });
      return;
    }

    setSaving(true);
    const payload: Record<string, unknown> = {
      paymentMethods: methods,
      cardBrands: acceptsCardBrands(methods) ? cardBrands : [],
      mpEnabled: ONLINE_AVAILABLE && store.mpConfigured,
    };

    const res = await patchStore(payload);
    setSaving(false);

    toast({
      title: res.ok ? "Pagamentos salvos" : "Erro ao salvar",
      tone: res.ok ? "success" : "error",
    });
  }

  return (
    <form onSubmit={onSubmit} className="mx-auto max-w-3xl space-y-6 pb-8">
      <section className="grid gap-4 sm:grid-cols-2">
        <ModeCard
          active
          icon={Truck}
          title="Pagar na entrega ou retirada"
          description="Cliente escolhe a forma e combina o pagamento pelo WhatsApp ao receber o pedido."
          badge="Disponível"
        />
        <ModeCard
          active={false}
          disabled
          icon={CreditCard}
          title="Pagar online"
          description="Pix, cartão e boleto no checkout com Mercado Pago — sem sair da vitrine."
          badge="Em breve"
        />
      </section>

      <SectionCard title="Formas ao pagar na entrega ou retirada">
        <div className="space-y-5 p-5 sm:p-6">
          <p className="text-sm leading-relaxed text-[#6B6560]">
            Marque o que sua confeitaria aceita na hora da entrega ou retirada.
            Pix, dinheiro, cartões e vales VR/VA já vêm sugeridos — ajuste como
            preferir.
          </p>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={useDefaults}
              className="text-xs font-semibold text-[var(--painel-accent)] hover:underline"
            >
              Restaurar sugestões padrão
            </button>
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            {OFFLINE_PAYMENT_PRESETS.map((method) => {
              const active = methods.includes(method);
              return (
                <MethodChip
                  key={method}
                  label={method}
                  hint={methodHint(method)}
                  active={active}
                  onClick={() => toggleMethod(method)}
                />
              );
            })}
            {extras.map((method) => (
              <MethodChip
                key={method}
                label={method}
                hint="Forma personalizada"
                active
                onClick={() => toggleMethod(method)}
              />
            ))}
          </div>

          <div className="flex flex-wrap gap-2 border-t border-[var(--painel-border)] pt-4">
            <input
              className="input max-w-xs flex-1 !py-2 text-sm"
              value={customMethod}
              onChange={(e) => setCustomMethod(e.target.value)}
              placeholder="Outra forma (ex.: Link de pagamento)"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addCustom();
                }
              }}
            />
            <button
              type="button"
              onClick={addCustom}
              className="btn-secondary !py-2 text-sm"
            >
              Adicionar
            </button>
          </div>

          {acceptsCardBrands(methods) ? (
            <div className="rounded-xl border border-[var(--painel-border)] bg-[var(--painel-subtle,#eff3f6)] p-4">
              <p className="text-sm font-semibold text-cocoa">
                Bandeiras de cartão
              </p>
              <p className="mt-1 text-xs text-[#8C8682]">
                Exibidas na vitrine quando débito ou crédito estiver ativo.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {CARD_BRAND_PRESETS.map((brand) => {
                  const active = cardBrands.includes(brand);
                  return (
                    <button
                      key={brand}
                      type="button"
                      onClick={() =>
                        setCardBrands((prev) =>
                          active
                            ? prev.filter((b) => b !== brand)
                            : [...prev, brand],
                        )
                      }
                      className={cn(
                        "rounded-md border px-3 py-1.5 text-xs font-semibold transition",
                        active
                          ? "border-[var(--painel-brand)] bg-[var(--painel-brand)] text-white"
                          : "border-[#CED0D4] bg-white text-[#65676B]",
                      )}
                    >
                      {brand}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null}

          {methods.length === 0 ? (
            <p className="text-xs font-medium text-warning">
              Selecione ao menos uma forma de pagamento.
            </p>
          ) : null}
        </div>
      </SectionCard>

      <SectionCard title="Pagar online (Mercado Pago)">
        <div className="space-y-4 p-5 sm:p-6">
          <div className="flex items-start gap-3 rounded-xl border border-dashed border-[#CED0D4] bg-[#F7F8FA] px-4 py-3.5">
            <Store className="mt-0.5 h-5 w-5 shrink-0 text-[#8C8682]" />
            <div>
              <p className="text-sm font-semibold text-cocoa">Em breve</p>
              <p className="mt-1 text-xs leading-relaxed text-[#8C8682]">
                O checkout online será liberado em uma próxima atualização. Por
                enquanto, seus clientes pagam apenas na entrega ou retirada, com
                as formas marcadas acima.
              </p>
              {store.mpConfigured ? (
                <p className="mt-2 text-xs font-medium text-success">
                  Suas credenciais do Mercado Pago já estão salvas e serão
                  usadas quando o pagamento online for ativado.
                </p>
              ) : null}
            </div>
          </div>
        </div>
      </SectionCard>

      <div className="sticky bottom-0 z-10 -mx-4 border-t border-[var(--painel-border)] bg-[var(--painel-canvas)]/95 px-4 py-4 backdrop-blur sm:mx-0 sm:rounded-xl sm:border sm:px-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-[#8C8682]">
            {methods.length} forma{methods.length === 1 ? "" : "s"} na entrega
            · online desativado
          </p>
          <button
            type="submit"
            className="btn-primary !py-2.5 text-sm"
            disabled={saving || methods.length === 0}
          >
            {saving ? "Salvando…" : "Salvar pagamentos"}
          </button>
        </div>
      </div>
    </form>
  );
}

function methodHint(method: string) {
  if (/vale-refeição|\(vr\)/i.test(method)) return "Vale refeição na entrega";
  if (/vale-alimentação|\(va\)/i.test(method)) return "Vale alimentação na entrega";
  if (method === "Pix") return "Chave ou QR na retirada/entrega";
  if (method === "Dinheiro") return "Troco combinado no WhatsApp";
  if (/cartão de débito/i.test(method)) return "Maquininha ou débito na entrega";
  if (/cartão de crédito/i.test(method)) return "Crédito na retirada/entrega";
  if (method === "Sinal para encomenda") return "50% entrada + 50% ao finalizar";
  return "Informado na vitrine";
}

function ModeCard({
  title,
  description,
  badge,
  icon: Icon,
  active,
  disabled,
}: {
  title: string;
  description: string;
  badge: string;
  icon: typeof Truck;
  active?: boolean;
  disabled?: boolean;
}) {
  return (
    <div
      className={cn(
        "relative flex flex-col rounded-2xl border p-5 transition",
        active
          ? "border-[var(--painel-brand)]/30 bg-white shadow-sm ring-1 ring-[var(--painel-brand)]/15"
          : "border-[var(--painel-border)] bg-[#F7F8FA]",
        disabled && "opacity-85",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <span
          className={cn(
            "flex h-10 w-10 items-center justify-center rounded-xl",
            active ? "bg-[#E8F0EE] text-[var(--painel-brand)]" : "bg-[var(--painel-border)] text-[#8C8682]",
          )}
        >
          <Icon className="h-5 w-5" aria-hidden />
        </span>
        <span
          className={cn(
            "rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide",
            active
              ? "bg-emerald-50 text-success"
              : "bg-[#F0F2F5] text-[#65676B]",
          )}
        >
          {badge}
        </span>
      </div>
      <h3 className="mt-4 text-sm font-semibold text-cocoa">{title}</h3>
      <p className="mt-1.5 flex-1 text-xs leading-relaxed text-[#8C8682]">
        {description}
      </p>
    </div>
  );
}

function MethodChip({
  label,
  hint,
  active,
  onClick,
}: {
  label: string;
  hint: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex items-start gap-2 rounded-xl border px-3.5 py-3 text-left transition",
        active
          ? "border-[var(--painel-brand)] bg-[var(--painel-brand)] text-white"
          : "border-[var(--painel-border)] bg-white text-[#65676B] hover:border-[#CED0D4]",
      )}
    >
      <span
        className={cn(
          "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border",
          active ? "border-white/30 bg-white/10" : "border-[#CED0D4] bg-[#F7F8FA]",
        )}
      >
        {active ? <Check className="h-3 w-3" aria-hidden /> : null}
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-semibold">{label}</span>
        <span
          className={cn(
            "mt-0.5 block text-[11px] font-medium",
            active ? "text-white/70" : "text-[#8C8682]",
          )}
        >
          {hint}
        </span>
      </span>
    </button>
  );
}
