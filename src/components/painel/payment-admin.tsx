"use client";

import { FormEvent, useMemo, useState } from "react";
import {
  Banknote,
  Check,
  Copy,
  CreditCard,
  ExternalLink,
  HandCoins,
  Landmark,
  MessageCircle,
  Plus,
  Receipt,
  Shield,
  Smartphone,
  Sparkles,
  Ticket,
  Zap,
  type LucideIcon,
} from "lucide-react";
import {
  PageAction,
  PageHeader,
  PageShell,
  SectionCard,
} from "@/components/painel/page-header";
import { Field } from "@/components/ui/input";
import {
  Sheet,
  SheetBody,
  SheetCancel,
  SheetContent,
  SheetFooter,
  SheetForm,
  SheetHeader,
  SheetPrimary,
} from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/cn";
import { MERCADO_PAGO_ONLINE_ENABLED } from "@/lib/mercadopago";
import {
  acceptsCardBrands,
  CARD_BRAND_PRESETS,
  OFFLINE_PAYMENT_PRESETS,
} from "@/lib/utils";

const WHATSAPP_MANUAL_PRESETS = ["Pix", "Sinal para encomenda"] as const;

const DELIVERY_PAYMENT_PRESETS = (OFFLINE_PAYMENT_PRESETS as readonly string[]).filter(
  (m) => m !== "Sinal para encomenda",
);

const MP_CHECKOUT_CHANNELS = [
  { id: "pix", label: "Pix", icon: Smartphone },
  { id: "card", label: "Cartão", icon: CreditCard },
  { id: "boleto", label: "Boleto", icon: Receipt },
] as const;

async function patchStore(payload: Record<string, unknown>) {
  return fetch("/api/store", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
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
    hasMpAccessToken: boolean;
  };
}) {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [savingMp, setSavingMp] = useState(false);

  const [methods, setMethods] = useState<string[]>(store.paymentMethods);
  const [cardBrands, setCardBrands] = useState<string[]>(store.cardBrands ?? []);
  const [methodSheetOpen, setMethodSheetOpen] = useState(false);
  const [methodDraftName, setMethodDraftName] = useState("");
  const [methodDraftPresets, setMethodDraftPresets] = useState<string[]>([]);

  const [mpEnabled, setMpEnabled] = useState(store.mpEnabled);
  const [mpPublicKey, setMpPublicKey] = useState(store.mpPublicKey);
  const [mpAccessToken, setMpAccessToken] = useState("");
  const [mpWebhookSecret, setMpWebhookSecret] = useState("");
  const [hasMpAccessToken, setHasMpAccessToken] = useState(
    store.hasMpAccessToken,
  );

  const webhookUrl = useMemo(() => {
    if (typeof window === "undefined") return "/api/payments/webhook";
    return `${window.location.origin}/api/payments/webhook`;
  }, []);

  const mpLive =
    MERCADO_PAGO_ONLINE_ENABLED &&
    mpEnabled &&
    Boolean(mpPublicKey.trim()) &&
    (hasMpAccessToken || Boolean(mpAccessToken.trim()));

  const extras = methods.filter(
    (m) =>
      !(WHATSAPP_MANUAL_PRESETS as readonly string[]).includes(m) &&
      !(OFFLINE_PAYMENT_PRESETS as readonly string[]).includes(m),
  );

  function toggleMethod(method: string) {
    setMethods((prev) =>
      prev.includes(method)
        ? prev.filter((m) => m !== method)
        : [...prev, method],
    );
  }

  const availablePresets = useMemo(
    () =>
      (OFFLINE_PAYMENT_PRESETS as readonly string[]).filter(
        (m) => !methods.includes(m),
      ),
    [methods],
  );

  function openMethodSheet() {
    setMethodDraftName("");
    setMethodDraftPresets([]);
    setMethodSheetOpen(true);
  }

  function toggleDraftPreset(method: string) {
    setMethodDraftPresets((prev) =>
      prev.includes(method)
        ? prev.filter((m) => m !== method)
        : [...prev, method],
    );
  }

  function submitNewMethods(e: FormEvent) {
    e.preventDefault();
    const custom = methodDraftName.trim();
    const toAdd = [
      ...new Set([
        ...methodDraftPresets,
        ...(custom ? [custom] : []),
      ]),
    ].filter((m) => !methods.includes(m));

    if (toAdd.length === 0) {
      toast({
        title: custom
          ? "Essa forma já está ativa"
          : "Informe um nome ou selecione uma sugestão",
        tone: "warning",
      });
      return;
    }

    setMethods((prev) => [...prev, ...toAdd]);
    setMethodSheetOpen(false);
    toast({
      title:
        toAdd.length === 1
          ? `"${toAdd[0]}" adicionada`
          : `${toAdd.length} formas adicionadas`,
      tone: "success",
    });
  }

  async function saveMercadoPago() {
    if (!MERCADO_PAGO_ONLINE_ENABLED) {
      toast({
        title: "Pagamento online indisponível no momento",
        tone: "warning",
      });
      return;
    }
    if (mpEnabled && !mpPublicKey.trim()) {
      toast({
        title: "Informe a Public Key do Mercado Pago",
        tone: "warning",
      });
      return;
    }
    if (mpEnabled && !hasMpAccessToken && !mpAccessToken.trim()) {
      toast({
        title: "Informe o Access Token do Mercado Pago",
        tone: "warning",
      });
      return;
    }

    setSavingMp(true);
    const payload: Record<string, unknown> = {
      mpEnabled,
      mpPublicKey: mpPublicKey.trim(),
    };
    if (mpAccessToken.trim()) payload.mpAccessToken = mpAccessToken.trim();
    if (mpWebhookSecret.trim()) payload.mpWebhookSecret = mpWebhookSecret.trim();

    const res = await patchStore(payload);
    setSavingMp(false);

    if (res.ok) {
      if (mpAccessToken.trim()) setHasMpAccessToken(true);
      setMpAccessToken("");
      setMpWebhookSecret("");
    }

    toast({
      title: res.ok ? "Pagamento online salvo" : "Erro ao salvar Mercado Pago",
      tone: res.ok ? "success" : "error",
    });
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (methods.length === 0) {
      toast({
        title: "Selecione ao menos uma forma manual pelo WhatsApp",
        tone: "warning",
      });
      return;
    }
    setSaving(true);
    const res = await patchStore({
      paymentMethods: methods,
      cardBrands: acceptsCardBrands(methods) ? cardBrands : [],
    });
    setSaving(false);

    toast({
      title: res.ok ? "Pagamento salvo" : "Erro ao salvar",
      tone: res.ok ? "success" : "error",
    });
  }

  const showMpWarning =
    MERCADO_PAGO_ONLINE_ENABLED &&
    !mpLive &&
    (mpEnabled || !store.mpConfigured);

  async function copyWebhook() {
    try {
      await navigator.clipboard.writeText(webhookUrl);
      toast({ title: "URL do webhook copiada", tone: "success" });
    } catch {
      toast({ title: "Não foi possível copiar", tone: "error" });
    }
  }

  const vitrinePreviewMethods = [
    ...(mpLive ? ["Mercado Pago (online)"] : []),
    ...methods,
  ];

  return (
    <form onSubmit={onSubmit} className="w-full max-w-none">
      <PageShell className="pb-8">
        <PageHeader
          title="Pagamento"
          description={
            MERCADO_PAGO_ONLINE_ENABLED
              ? "Configure checkout online e as formas que o cliente combina pelo WhatsApp na vitrine."
              : "Formas de pagamento que o cliente combina pelo WhatsApp na vitrine."
          }
          actions={
            <PageAction type="button" onClick={openMethodSheet}>
              <Plus className="h-4 w-4" />
              Nova forma
            </PageAction>
          }
        />

        <section
          className={cn(
            "overflow-hidden rounded-2xl border bg-white shadow-[0_2px_12px_rgba(15,53,46,0.06)]",
            MERCADO_PAGO_ONLINE_ENABLED
              ? "border-[#D4E8E2]"
              : "border-[#E8E2DE]",
          )}
          aria-disabled={!MERCADO_PAGO_ONLINE_ENABLED}
        >
          <div
            className={cn(
              "relative border-b px-5 py-5 sm:px-6",
              MERCADO_PAGO_ONLINE_ENABLED
                ? "border-[#D4E8E2]/80 bg-gradient-to-br from-[#0F352E] via-[#13443B] to-[#1A5C50]"
                : "border-[#E8E2DE] bg-gradient-to-br from-[#5C5652] via-[#6B6560] to-[#8C8682]",
            )}
          >
            <div
              className="pointer-events-none absolute -right-8 -top-10 h-40 w-40 rounded-full bg-white/10 blur-2xl"
              aria-hidden
            />
            <div className="relative flex flex-wrap items-start justify-between gap-4">
              <div className="flex min-w-0 gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/15 text-white ring-1 ring-white/20">
                  <CreditCard className="h-5 w-5" aria-hidden />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-wide text-white/70">
                    Pagamento online
                  </p>
                  <h2 className="mt-0.5 text-lg font-bold text-white">
                    Mercado Pago
                  </h2>
                  <p className="mt-1 max-w-xl text-sm leading-relaxed text-white/80">
                    Pix, cartão e boleto pagos na hora, direto no checkout da
                    vitrine — sem combinar no WhatsApp.
                  </p>
                </div>
              </div>
              <span
                className={cn(
                  "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ring-1",
                  !MERCADO_PAGO_ONLINE_ENABLED
                    ? "bg-white/15 text-white ring-white/25"
                    : mpLive
                      ? "bg-emerald-400/20 text-emerald-100 ring-emerald-300/30"
                      : "bg-white/10 text-white/90 ring-white/20",
                )}
              >
                {!MERCADO_PAGO_ONLINE_ENABLED
                  ? "Em breve"
                  : mpLive
                    ? "Publicado"
                    : "Não publicado"}
              </span>
            </div>
            <div className="relative mt-4 flex flex-wrap gap-2">
              {MP_CHECKOUT_CHANNELS.map(({ id, label, icon: Icon }) => (
                <span
                  key={id}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold",
                    mpLive
                      ? "bg-white/15 text-white"
                      : "bg-black/15 text-white/60",
                  )}
                >
                  <Icon className="h-3.5 w-3.5" aria-hidden />
                  {label}
                </span>
              ))}
            </div>
          </div>

          <div
            className={cn(
              "space-y-5 p-5 sm:p-6",
              !MERCADO_PAGO_ONLINE_ENABLED && "pointer-events-none opacity-60",
            )}
          >
            {!MERCADO_PAGO_ONLINE_ENABLED ? (
              <div className="pointer-events-auto -mt-1 flex gap-3 rounded-xl border border-[#E8E2DE] bg-[#F0F2F5] px-4 py-3.5">
                <Sparkles
                  className="mt-0.5 h-4 w-4 shrink-0 text-[#65676B]"
                  aria-hidden
                />
                <p className="text-sm leading-relaxed text-[#5C5652]">
                  O checkout online com Mercado Pago ainda não está disponível.
                  Por enquanto, use as formas manuais abaixo — o cliente combina
                  pelo WhatsApp na vitrine.
                </p>
              </div>
            ) : null}

            <ToggleRow
              id="mp-enabled"
              checked={MERCADO_PAGO_ONLINE_ENABLED ? mpEnabled : false}
              onCheckedChange={setMpEnabled}
              title="Aceitar pagamento online"
              description="Exibe Mercado Pago como opção no checkout quando as credenciais estiverem válidas."
              icon={CreditCard}
              variant="elevated"
              disabled={!MERCADO_PAGO_ONLINE_ENABLED}
            />

            {showMpWarning ? (
              <div className="flex gap-3 rounded-xl border border-amber-200/90 bg-gradient-to-r from-amber-50 to-[#FFFBEB] px-4 py-3.5">
                <Sparkles
                  className="mt-0.5 h-4 w-4 shrink-0 text-amber-600"
                  aria-hidden
                />
                <p className="text-sm leading-relaxed text-amber-950">
                  A vitrine ainda não cobra online. Ative o switch, informe Public
                  Key e Access Token e clique em{" "}
                  <strong className="font-semibold">Salvar integração</strong>.
                </p>
              </div>
            ) : mpLive ? (
              <div className="flex gap-3 rounded-xl border border-emerald-200/80 bg-emerald-50/80 px-4 py-3.5">
                <Shield
                  className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700"
                  aria-hidden
                />
                <p className="text-sm leading-relaxed text-emerald-950">
                  Checkout online ativo. Novos pedidos podem pagar com Pix,
                  cartão ou boleto na vitrine.
                </p>
              </div>
            ) : null}

            <div className="rounded-xl border border-[#E8E2DE] bg-[#FAFAF8] p-4 sm:p-5">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-semibold text-cocoa">
                  Credenciais da integração
                </p>
                <a
                  href="https://www.mercadopago.com.br/developers/panel/app"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--painel-brand)] hover:underline"
                >
                  Abrir painel MP
                  <ExternalLink className="h-3 w-3" aria-hidden />
                </a>
              </div>
              <div className="grid gap-4 lg:grid-cols-3">
                <Field
                  label="Public Key"
                  id="mp-public-key"
                  value={mpPublicKey}
                  onChange={(e) => setMpPublicKey(e.target.value)}
                  placeholder="APP_USR-..."
                  hint='Em "Suas Integrações" (produção ou teste).'
                  autoComplete="off"
                  controlClassName="!h-10"
                  disabled={!MERCADO_PAGO_ONLINE_ENABLED}
                />
                <Field
                  label="Access Token"
                  id="mp-access-token"
                  type="password"
                  value={mpAccessToken}
                  onChange={(e) => setMpAccessToken(e.target.value)}
                  placeholder={
                    store.mpAccessTokenMasked
                      ? `${store.mpAccessTokenMasked} (deixe vazio para manter)`
                      : "APP_USR-..."
                  }
                  hint="Mantenha em segredo. Nunca compartilhe."
                  autoComplete="off"
                  controlClassName="!h-10"
                  disabled={!MERCADO_PAGO_ONLINE_ENABLED}
                />
                <Field
                  label="Segredo do webhook"
                  id="mp-webhook-secret"
                  type="password"
                  value={mpWebhookSecret}
                  onChange={(e) => setMpWebhookSecret(e.target.value)}
                  placeholder={
                    store.mpWebhookSecretMasked
                      ? `${store.mpWebhookSecretMasked} (deixe vazio para manter)`
                      : "Chave secreta do webhooks"
                  }
                  hint='Webhooks → "Assinatura secreta".'
                  autoComplete="off"
                  controlClassName="!h-10"
                  disabled={!MERCADO_PAGO_ONLINE_ENABLED}
                />
              </div>
              <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center">
                <p className="min-w-0 flex-1 truncate text-xs text-[#8C8682]">
                  URL do webhook:{" "}
                  <code className="rounded bg-white px-1.5 py-0.5 font-mono text-[11px] text-cocoa">
                    {webhookUrl}
                  </code>
                </p>
                <button
                  type="button"
                  onClick={() => void copyWebhook()}
                  className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-lg border border-[#CED0D4] bg-white px-3 py-2 text-xs font-semibold text-cocoa transition hover:bg-[#F0F2F5]"
                >
                  <Copy className="h-3.5 w-3.5" aria-hidden />
                  Copiar URL
                </button>
              </div>
            </div>

            <div className="flex justify-end border-t border-[#E8E2DE] pt-4">
              <button
                type="button"
                onClick={() => void saveMercadoPago()}
                className="btn-primary !py-2 text-sm"
                disabled={savingMp || !MERCADO_PAGO_ONLINE_ENABLED}
              >
                {savingMp ? "Salvando…" : "Salvar integração"}
              </button>
            </div>
          </div>
        </section>

        <SectionCard
          title="Pagamento na retirada e entrega"
          className="shrink-0 overflow-hidden"
          action={
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[#8C8682]">
              <MessageCircle className="h-3.5 w-3.5" aria-hidden />
              Via WhatsApp
            </span>
          }
        >
          <div className="space-y-6 p-5 sm:p-6">
            <p className="text-sm leading-relaxed text-[#6B6560]">
              O cliente escolhe uma dessas formas no checkout e combina o
              pagamento com você pelo WhatsApp — ideal para entrega, retirada na
              loja ou pagamento presencial.
            </p>

            <PaymentMethodGroup
              title="Dinheiro, cartão e transferência"
              description="Pagamento combinado no ato da entrega ou retirada."
            >
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {DELIVERY_PAYMENT_PRESETS.map((method) => (
                  <MethodChip
                    key={method}
                    label={method}
                    hint={presetCatalogHint(method)}
                    icon={paymentMethodIcon(method)}
                    active={methods.includes(method)}
                    onClick={() => toggleMethod(method)}
                  />
                ))}
              </div>
            </PaymentMethodGroup>

            <PaymentMethodGroup
              title="Encomendas com sinal"
              description="Para produtos sob encomenda: metade na confirmação e metade na entrega."
            >
              <div className="grid gap-3 sm:grid-cols-2">
                <MethodChip
                  label="Sinal para encomenda"
                  hint="50% entrada + 50% final"
                  icon={HandCoins}
                  active={methods.includes("Sinal para encomenda")}
                  onClick={() => toggleMethod("Sinal para encomenda")}
                  featured
                />
              </div>
            </PaymentMethodGroup>

            {extras.length > 0 ? (
              <PaymentMethodGroup
                title="Formas personalizadas"
                description="Nomes que você criou para a vitrine."
              >
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {extras.map((method) => (
                    <MethodChip
                      key={method}
                      label={method}
                      hint="Forma personalizada"
                      icon={paymentMethodIcon(method)}
                      active
                      onClick={() => toggleMethod(method)}
                    />
                  ))}
                </div>
              </PaymentMethodGroup>
            ) : null}

            {acceptsCardBrands(methods) ? (
              <div className="rounded-xl border border-[#E8E2DE] bg-gradient-to-br from-[#FBF7F2] to-white p-4 sm:p-5">
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--painel-brand)]/10 text-[var(--painel-brand)]">
                    <CreditCard className="h-4 w-4" aria-hidden />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-cocoa">
                      Bandeiras aceitas na entrega
                    </p>
                    <p className="mt-1 text-xs text-[#8C8682]">
                      Aparecem na vitrine quando débito ou crédito na entrega
                      estiver ativo.
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
                              "rounded-lg border px-3 py-2 text-xs font-semibold transition shadow-sm",
                              active
                                ? "border-[var(--painel-brand)] bg-[var(--painel-brand)] text-white"
                                : "border-[#CED0D4] bg-white text-[#65676B] hover:border-[#B0AAA6]",
                            )}
                          >
                            {brand}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            ) : null}

            {vitrinePreviewMethods.length > 0 ? (
              <div className="rounded-xl border border-dashed border-[#D5D8DC] bg-[#FAFAF8] px-4 py-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-[#8C8682]">
                  Prévia no checkout
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {vitrinePreviewMethods.map((m) => (
                    <span
                      key={m}
                      className="inline-flex items-center gap-1.5 rounded-full border border-[#E8E2DE] bg-white px-3 py-1 text-xs font-semibold text-cocoa shadow-sm"
                    >
                      {m === "Mercado Pago (online)" ? (
                        <Zap className="h-3 w-3 text-[var(--painel-brand)]" />
                      ) : (
                        <MessageCircle className="h-3 w-3 text-[#4338CA]" />
                      )}
                      {m}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </SectionCard>

      <Sheet open={methodSheetOpen} onOpenChange={setMethodSheetOpen}>
        <SheetContent size="md" side="right">
          <SheetHeader title="Nova forma de pagamento" />
          <SheetForm onSubmit={submitNewMethods}>
            <SheetBody className="space-y-6">
              <div className="relative overflow-hidden rounded-2xl border border-[#E8E2DE] bg-gradient-to-br from-[#FBF7F2] via-white to-[#F0F7F4] p-4">
                <div
                  className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-[var(--painel-brand)]/8"
                  aria-hidden
                />
                <div className="relative flex gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[var(--painel-brand)] text-white shadow-sm">
                    <MessageCircle className="h-5 w-5" aria-hidden />
                  </div>
                  <div className="min-w-0 space-y-1">
                    <p className="text-sm font-semibold text-cocoa">
                      Pagamento combinado no WhatsApp
                    </p>
                    <p className="text-xs leading-relaxed text-[#6B6560]">
                      Escolha sugestões prontas ou crie um nome que o cliente
                      verá na vitrine e no checkout.
                    </p>
                  </div>
                </div>
              </div>

              <section className="rounded-2xl border border-[#E8E2DE] bg-white p-4 shadow-[0_1px_3px_rgba(45,41,38,0.04)]">
                <div className="mb-3 flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-[var(--painel-brand)]" aria-hidden />
                  <p className="text-sm font-semibold text-cocoa">
                    Nome personalizado
                  </p>
                </div>
                <Field
                  label="Como aparece para o cliente"
                  id="manual-payment-name"
                  value={methodDraftName}
                  onChange={(e) => setMethodDraftName(e.target.value)}
                  placeholder="Ex.: Pix na entrega, Dinheiro…"
                  hint="Opcional se você marcar uma ou mais sugestões abaixo."
                  autoFocus
                  controlClassName="!h-10"
                />
              </section>

              {availablePresets.length > 0 ? (
                <section className="space-y-3">
                  <div>
                    <p className="text-sm font-semibold text-cocoa">
                      Sugestões rápidas
                    </p>
                    <p className="mt-1 text-xs text-[#8C8682]">
                      Toque para selecionar — você pode escolher várias de uma
                      vez.
                    </p>
                  </div>
                  <div className="grid gap-2.5 sm:grid-cols-2">
                    {availablePresets.map((method) => (
                      <MethodChip
                        key={method}
                        label={method}
                        hint={presetCatalogHint(method)}
                        icon={paymentMethodIcon(method)}
                        active={methodDraftPresets.includes(method)}
                        onClick={() => toggleDraftPreset(method)}
                      />
                    ))}
                  </div>
                  {methodDraftPresets.length > 0 ? (
                    <p className="rounded-lg bg-[var(--painel-brand)]/8 px-3 py-2 text-xs font-medium text-[var(--painel-brand)]">
                      {methodDraftPresets.length}{" "}
                      {methodDraftPresets.length === 1
                        ? "forma selecionada"
                        : "formas selecionadas"}
                    </p>
                  ) : null}
                </section>
              ) : (
                <div className="rounded-xl border border-dashed border-[#D5D8DC] bg-[#FAFAF8] px-4 py-5 text-center">
                  <p className="text-sm font-medium text-cocoa">
                    Todas as sugestões já estão ativas
                  </p>
                  <p className="mt-1 text-xs text-[#8C8682]">
                    Crie um nome personalizado acima para uma forma extra.
                  </p>
                </div>
              )}
            </SheetBody>
            <SheetFooter>
              <SheetCancel />
              <SheetPrimary>Adicionar forma</SheetPrimary>
            </SheetFooter>
          </SheetForm>
        </SheetContent>
      </Sheet>

        <div className="flex w-full shrink-0 flex-wrap items-center justify-between gap-3 rounded-xl border border-[#E8E2DE] bg-white px-4 py-4 sm:px-5">
          <p className="text-xs text-[#8C8682]">
            As formas manuais só entram na vitrine após{" "}
            <strong className="font-semibold text-cocoa">Salvar formas</strong>.
          </p>
          <button
            type="submit"
            className="btn-primary !h-10 !px-5 text-sm"
            disabled={saving || methods.length === 0}
          >
            {saving ? "Salvando…" : "Salvar formas"}
          </button>
        </div>
      </PageShell>
    </form>
  );
}

function presetCatalogHint(method: string) {
  if (method === "Pix") return "Combinar no WhatsApp";
  if (method === "Dinheiro") return "Na retirada ou entrega";
  if (method === "Sinal para encomenda") return "50% entrada + 50% final";
  if (/cartão de crédito/i.test(method)) return "Crédito na entrega";
  if (/cartão de débito/i.test(method)) return "Débito na entrega";
  if (/vale-refeição/i.test(method)) return "VR na retirada/entrega";
  if (/vale-alimentação/i.test(method)) return "VA na retirada/entrega";
  if (method === "Transferência bancária") return "Combinar dados no WhatsApp";
  return "Combinar no WhatsApp";
}

function paymentMethodIcon(method: string): LucideIcon {
  if (method === "Pix") return Smartphone;
  if (method === "Dinheiro") return Banknote;
  if (/cartão/i.test(method)) return CreditCard;
  if (/vale/i.test(method)) return Ticket;
  if (method === "Transferência bancária") return Landmark;
  if (method === "Sinal para encomenda") return HandCoins;
  return CreditCard;
}

function PaymentMethodGroup({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-3">
      <div>
        <p className="text-sm font-semibold text-cocoa">{title}</p>
        <p className="mt-0.5 text-xs leading-relaxed text-[#8C8682]">
          {description}
        </p>
      </div>
      {children}
    </div>
  );
}

function ToggleRow({
  id,
  checked,
  onCheckedChange,
  title,
  description,
  icon: Icon,
  variant = "default",
  disabled = false,
}: {
  id: string;
  checked: boolean;
  onCheckedChange: (v: boolean) => void;
  title: string;
  description?: string;
  icon?: React.ComponentType<{ className?: string }>;
  variant?: "default" | "elevated";
  disabled?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex items-start justify-between gap-4 py-1",
        variant === "elevated" &&
          "rounded-xl border border-[#E8E2DE] bg-white px-4 py-4 shadow-sm",
        disabled && "opacity-90",
      )}
    >
      <div className="flex min-w-0 items-start gap-3">
        {Icon ? (
          <div
            className={cn(
              "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
              variant === "elevated"
                ? "bg-[var(--painel-brand)]/10 text-[var(--painel-brand)]"
                : "bg-[#F0F2F5] text-[#5C5652]",
            )}
          >
            <Icon className="h-4 w-4" aria-hidden />
          </div>
        ) : null}
        <div className="min-w-0 space-y-1">
          <p className="text-sm font-semibold text-cocoa">{title}</p>
          {description ? (
            <p className="text-xs leading-relaxed text-[#8C8682]">
              {description}
            </p>
          ) : null}
        </div>
      </div>
      <Switch
        id={id}
        checked={checked}
        onCheckedChange={onCheckedChange}
        disabled={disabled}
      />
    </div>
  );
}

function MethodChip({
  label,
  hint,
  icon: Icon,
  active,
  onClick,
  featured = false,
}: {
  label: string;
  hint: string;
  icon?: LucideIcon;
  active: boolean;
  onClick: () => void;
  featured?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex min-h-[4.25rem] w-full min-w-0 shrink-0 items-start gap-2.5 rounded-xl border px-3.5 py-3 text-left transition",
        active
          ? featured
            ? "border-[#4338CA] bg-gradient-to-br from-[#4338CA] to-[#3730A3] text-white shadow-[0_4px_14px_rgba(67,56,202,0.25)]"
            : "border-[var(--painel-brand)] bg-[var(--painel-brand)] text-white shadow-[0_4px_14px_rgba(15,53,46,0.18)]"
          : "border-[#E8E2DE] bg-white text-[#65676B] shadow-[0_1px_2px_rgba(45,41,38,0.04)] hover:border-[#CED0D4] hover:shadow-[0_2px_8px_rgba(45,41,38,0.06)]",
      )}
    >
      {Icon ? (
        <span
          className={cn(
            "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
            active
              ? "bg-white/15 text-white"
              : "bg-[#F0F7F4] text-[var(--painel-brand)]",
          )}
        >
          <Icon className="h-4 w-4" aria-hidden />
        </span>
      ) : (
        <span
          className={cn(
            "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border",
            active ? "border-white/30 bg-white/10" : "border-[#CED0D4] bg-[#F7F8FA]",
          )}
        >
          {active ? <Check className="h-3 w-3" aria-hidden /> : null}
        </span>
      )}
      <span className="min-w-0 flex-1">
        <span className="flex items-start justify-between gap-2">
          <span className="block text-sm font-semibold leading-snug">{label}</span>
          {Icon && active ? (
            <Check className="mt-0.5 h-4 w-4 shrink-0 text-white/90" aria-hidden />
          ) : null}
        </span>
        <span
          className={cn(
            "mt-0.5 block text-[11px] font-medium leading-snug",
            active ? "text-white/75" : "text-[#8C8682]",
          )}
        >
          {hint}
        </span>
      </span>
    </button>
  );
}
