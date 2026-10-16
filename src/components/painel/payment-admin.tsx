"use client";

import { FormEvent, useMemo, useState, type ReactNode } from "react";
import {
  Banknote,
  Check,
  ChevronRight,
  Copy,
  CreditCard,
  ExternalLink,
  HandCoins,
  Info,
  Landmark,
  MessageCircle,
  Plus,
  Receipt,
  Shield,
  Smartphone,
  Sparkles,
  Ticket,
  Truck,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { PageAction, PageHeader, PageShell } from "@/components/painel/page-header";
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
  DEFAULT_ON_DELIVERY_PAYMENT_METHODS,
  OFFLINE_PAYMENT_PRESETS,
} from "@/lib/utils";

const WHATSAPP_MANUAL_PRESETS = ["Pix", "Sinal para encomenda"] as const;

const DELIVERY_PAYMENT_PRESETS = (OFFLINE_PAYMENT_PRESETS as readonly string[]).filter(
  (m) => m !== "Sinal para encomenda",
);

const ONLINE_METHOD_ROWS = [
  {
    id: "pix",
    label: "Pix",
    description: "Pagamento instantâneo via QR Code",
    icon: Smartphone,
    iconClass: "bg-emerald-50 text-emerald-700",
  },
  {
    id: "credit",
    label: "Cartão de crédito",
    description: "Parcelamento disponível",
    icon: CreditCard,
    iconClass: "bg-violet-50 text-violet-700",
  },
  {
    id: "debit",
    label: "Cartão de débito",
    description: "Débito à vista no checkout",
    icon: CreditCard,
    iconClass: "bg-sky-50 text-sky-700",
  },
  {
    id: "wallet",
    label: "Carteiras digitais",
    description: "Apple Pay e Google Pay",
    icon: Wallet,
    iconClass: "bg-amber-50 text-amber-800",
  },
] as const;

type PaymentPanelTab = "delivery" | "online";

const PAYMENT_PANEL_TABS: {
  id: PaymentPanelTab;
  label: string;
  shortLabel: string;
  icon: LucideIcon;
}[] = [
  {
    id: "delivery",
    label: "Pagamento na entrega",
    shortLabel: "Na entrega",
    icon: Truck,
  },
  {
    id: "online",
    label: "Pagamento online",
    shortLabel: "Online",
    icon: CreditCard,
  },
];

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

  const [methods, setMethods] = useState<string[]>(store.paymentMethods);
  const [cardBrands, setCardBrands] = useState<string[]>(store.cardBrands ?? []);
  const [methodSheetOpen, setMethodSheetOpen] = useState(false);
  const [methodDraftName, setMethodDraftName] = useState("");
  const [methodDraftPresets, setMethodDraftPresets] = useState<string[]>([]);
  const [activePanel, setActivePanel] = useState<PaymentPanelTab>("delivery");
  const [mpConfigOpen, setMpConfigOpen] = useState(false);
  const [cardBrandsOpen, setCardBrandsOpen] = useState(false);

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

  const offlinePresetSet = OFFLINE_PAYMENT_PRESETS as readonly string[];

  const deliveryMasterOn =
    offlinePresetSet.some((m) => methods.includes(m)) || extras.length > 0;

  const deliveryRows = [
    ...DELIVERY_PAYMENT_PRESETS,
    "Sinal para encomenda",
    ...extras,
  ];

  function toggleMethod(method: string) {
    setMethods((prev) =>
      prev.includes(method)
        ? prev.filter((m) => m !== method)
        : [...prev, method],
    );
  }

  function setDeliveryMaster(enabled: boolean) {
    if (enabled) {
      setMethods((prev) => [
        ...new Set([...prev, ...DEFAULT_ON_DELIVERY_PAYMENT_METHODS]),
      ]);
      return;
    }
    setMethods((prev) => prev.filter((m) => !offlinePresetSet.includes(m)));
  }

  function openMethodConfigure(method: string) {
    if (/cartão de crédito|cartão de débito/i.test(method)) {
      setCardBrandsOpen(true);
      return;
    }
    toast({
      title: `"${method}" não exige configuração extra`,
      description: "Ative ou desative com o interruptor ao lado.",
      tone: "info",
    });
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
      ...new Set([...methodDraftPresets, ...(custom ? [custom] : [])]),
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

  async function saveAll(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const hasManual = methods.length > 0;
    if (!hasManual && !mpLive && !mpEnabled) {
      toast({
        title: "Ative ao menos uma forma de pagamento",
        tone: "warning",
      });
      return;
    }

    setSaving(true);
    let ok = true;

    const resMethods = await patchStore({
      paymentMethods: methods,
      cardBrands: acceptsCardBrands(methods) ? cardBrands : [],
    });
    ok = resMethods.ok;

    if (MERCADO_PAGO_ONLINE_ENABLED) {
      if (mpEnabled && !mpPublicKey.trim()) {
        setSaving(false);
        toast({
          title: "Informe a Public Key do Mercado Pago",
          tone: "warning",
        });
        return;
      }
      if (mpEnabled && !hasMpAccessToken && !mpAccessToken.trim()) {
        setSaving(false);
        toast({
          title: "Informe o Access Token do Mercado Pago",
          tone: "warning",
        });
        return;
      }

      const mpPayload: Record<string, unknown> = {
        mpEnabled,
        mpPublicKey: mpPublicKey.trim(),
      };
      if (mpAccessToken.trim()) mpPayload.mpAccessToken = mpAccessToken.trim();
      if (mpWebhookSecret.trim()) {
        mpPayload.mpWebhookSecret = mpWebhookSecret.trim();
      }
      const resMp = await patchStore(mpPayload);
      ok = ok && resMp.ok;
      if (resMp.ok) {
        if (mpAccessToken.trim()) setHasMpAccessToken(true);
        setMpAccessToken("");
        setMpWebhookSecret("");
      }
    }

    setSaving(false);
    toast({
      title: ok ? "Alterações salvas" : "Erro ao salvar pagamentos",
      tone: ok ? "success" : "error",
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

  return (
    <form onSubmit={saveAll} className="w-full max-w-none">
      <PageShell>
        <PageHeader
          title="Pagamentos"
          description="Configure as formas de pagamento disponíveis para os seus clientes"
          actions={
            <div className="hidden max-w-xs rounded-xl border border-emerald-200/80 bg-emerald-50/90 px-3 py-2 sm:flex sm:items-start sm:gap-2">
              <Shield
                className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700"
                aria-hidden
              />
              <p className="text-xs font-medium leading-snug text-emerald-950">
                Seus pagamentos são processados com segurança
              </p>
            </div>
          }
        />

        <div
          className="mb-3 flex gap-2 rounded-xl border border-emerald-200/80 bg-emerald-50/90 px-3 py-2.5 sm:hidden"
        >
          <Shield
            className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700"
            aria-hidden
          />
          <p className="text-xs font-medium leading-snug text-emerald-950">
            Seus pagamentos são processados com segurança
          </p>
        </div>

        <div className="overflow-hidden rounded-lg border border-[var(--painel-border,#E8E2DE)] bg-white shadow-[0_1px_3px_rgba(45,41,38,0.04)] sm:rounded-2xl sm:shadow-[0_2px_12px_rgba(15,53,46,0.05)]">
          <div
            className="border-b border-[var(--painel-border,#E8E2DE)] bg-[linear-gradient(180deg,#FAFBFA_0%,#F3F5F4_100%)] p-2 sm:p-3"
            role="tablist"
            aria-label="Tipo de pagamento"
          >
            <div className="grid grid-cols-2 gap-1.5 sm:gap-2">
              {PAYMENT_PANEL_TABS.map((tab) => {
                const active = activePanel === tab.id;
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => setActivePanel(tab.id)}
                    className={cn(
                      "group flex items-center justify-center gap-2 rounded-xl px-2.5 py-2.5 text-xs font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--painel-brand,#0f352e)]/25 focus-visible:ring-offset-2 sm:gap-2.5 sm:px-4 sm:py-3 sm:text-sm",
                      active
                        ? "bg-white text-[var(--painel-brand,#0f352e)] shadow-[0_2px_10px_rgba(15,53,46,0.08),0_0_0_1px_rgba(15,53,46,0.06)]"
                        : "text-[#6B7280] hover:bg-white/70 hover:text-[var(--painel-brand,#0f352e)]",
                    )}
                  >
                    <span
                      className={cn(
                        "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors sm:h-9 sm:w-9",
                        active
                          ? "bg-[#E8F3EF] text-[var(--painel-brand,#0f352e)]"
                          : "bg-white/80 text-[#8C8682] group-hover:bg-white group-hover:text-[var(--painel-brand,#0f352e)]",
                      )}
                      aria-hidden
                    >
                      <Icon className="h-4 w-4 sm:h-[1.125rem] sm:w-[1.125rem]" />
                    </span>
                    <span className="min-w-0 text-center leading-tight sm:text-left">
                      <span className="sm:hidden">{tab.shortLabel}</span>
                      <span className="hidden sm:inline">{tab.label}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="bg-white px-3 py-3 sm:p-5">
            {activePanel === "delivery" ? (
            <article
              className="flex min-h-0 flex-col overflow-hidden"
            >
              <PaymentPanelHeader
                title="Pagamento na entrega"
                description="Formas de pagamento aceitas no momento da entrega"
                masterId="delivery-master"
                masterOn={deliveryMasterOn}
                onMasterChange={setDeliveryMaster}
                extra={
                  <PageAction
                    type="button"
                    variant="secondary"
                    className="!h-9 w-full !text-xs sm:!h-8 sm:!w-auto sm:!px-2.5"
                    onClick={openMethodSheet}
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Nova forma
                  </PageAction>
                }
              />
              <div className="divide-y divide-[#EEF0F2]">
                {deliveryRows.map((method) => {
                  const active = methods.includes(method);
                  const Icon = paymentMethodIcon(method);
                  return (
                    <PaymentMethodRow
                      key={method}
                      id={`delivery-${method}`}
                      title={deliveryDisplayTitle(method)}
                      description={deliveryRowDescription(method)}
                      icon={Icon}
                      iconClassName={methodIconTone(method)}
                      active={active}
                      onToggle={(checked) => {
                        if (checked !== active) toggleMethod(method);
                      }}
                      onConfigure={() => openMethodConfigure(method)}
                    />
                  );
                })}
              </div>
              <p className="mt-auto border-t border-[#EEF0F2] py-3 text-[11px] leading-relaxed text-[#8C8682]">
                O cliente escolhe a forma no checkout e combina o pagamento com
                você pelo WhatsApp.
              </p>
            </article>
            ) : null}

            {activePanel === "online" ? (
            <article
              className={cn(
                "flex min-h-0 flex-col overflow-hidden",
                !MERCADO_PAGO_ONLINE_ENABLED && "opacity-95",
              )}
            >
              <PaymentPanelHeader
                title="Pagamento online"
                description="Formas de pagamento disponíveis no checkout da vitrine"
                masterId="online-master"
                masterOn={MERCADO_PAGO_ONLINE_ENABLED ? mpEnabled : false}
                onMasterChange={setMpEnabled}
                disabled={!MERCADO_PAGO_ONLINE_ENABLED}
              />
              <div
                className={cn(
                  "flex flex-1 flex-col",
                  !MERCADO_PAGO_ONLINE_ENABLED && "pointer-events-none opacity-60",
                )}
              >
                {!MERCADO_PAGO_ONLINE_ENABLED ? (
                  <div className="pointer-events-auto mb-2 mt-1 flex gap-3 rounded-xl border border-[#E8E2DE] bg-[#F0F2F5] px-3 py-3 sm:mt-3 sm:px-4 sm:py-3.5">
                    <Sparkles
                      className="mt-0.5 h-4 w-4 shrink-0 text-[#65676B]"
                      aria-hidden
                    />
                    <p className="text-sm leading-relaxed text-[#5C5652]">
                      Checkout online em breve. Use as formas na entrega por
                      enquanto.
                    </p>
                  </div>
                ) : null}

                {showMpWarning ? (
                  <div className="mb-2 mt-1 flex gap-3 rounded-xl border border-amber-200/90 bg-amber-50 px-3 py-3 sm:mt-3 sm:px-4">
                    <Sparkles
                      className="mt-0.5 h-4 w-4 shrink-0 text-amber-600"
                      aria-hidden
                    />
                    <p className="text-xs leading-relaxed text-amber-950 sm:text-sm">
                      Configure o Mercado Pago em{" "}
                      <strong className="font-semibold">Configurar</strong> e
                      salve as alterações.
                    </p>
                  </div>
                ) : mpLive ? (
                  <div className="mb-2 mt-1 flex gap-3 rounded-xl border border-emerald-200/80 bg-emerald-50/90 px-3 py-3 sm:mt-3 sm:px-4">
                    <Shield
                      className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700"
                      aria-hidden
                    />
                    <p className="text-xs leading-relaxed text-emerald-950 sm:text-sm">
                      Checkout online ativo na vitrine.
                    </p>
                  </div>
                ) : null}

                <div className="divide-y divide-[#EEF0F2]">
                  {ONLINE_METHOD_ROWS.map((row) => (
                    <PaymentMethodRow
                      key={row.id}
                      id={`online-${row.id}`}
                      title={row.label}
                      description={row.description}
                      icon={row.icon}
                      iconClassName={row.iconClass}
                      active={mpLive}
                      onToggle={setMpEnabled}
                      onConfigure={() => setMpConfigOpen(true)}
                      disabled={!MERCADO_PAGO_ONLINE_ENABLED}
                    />
                  ))}
                  <PaymentMethodRow
                    id="online-boleto"
                    title="Boleto"
                    description="Vencimento em até 3 dias úteis"
                    icon={Receipt}
                    iconClassName="bg-orange-50 text-orange-800"
                    active={mpLive}
                    onToggle={setMpEnabled}
                    onConfigure={() => setMpConfigOpen(true)}
                    disabled={!MERCADO_PAGO_ONLINE_ENABLED}
                  />
                </div>

                <div className="mt-auto border-t border-[#EEF0F2] bg-gradient-to-br from-[#FFF5F5] to-[#FFFBFB] py-4">
                  <p className="text-xs font-semibold text-cocoa">
                    Integração segura
                  </p>
                  <p className="mt-1 text-[11px] leading-relaxed text-[#8C8682]">
                    Processado pelo Mercado Pago com criptografia de ponta a
                    ponta.
                  </p>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    {["Pix", "Visa", "Mastercard", "Apple Pay", "Google Pay"].map(
                      (brand) => (
                        <span
                          key={brand}
                          className="rounded-md border border-[#E8E2DE] bg-white px-2 py-1 text-[10px] font-semibold text-[#65676B]"
                        >
                          {brand}
                        </span>
                      ),
                    )}
                  </div>
                </div>
              </div>
            </article>
            ) : null}
          </div>
        </div>

        <Sheet open={mpConfigOpen} onOpenChange={setMpConfigOpen}>
          <SheetContent size="lg" side="right">
            <SheetHeader title="Configurar Mercado Pago" />
            <SheetBody className="space-y-5">
              <p className="text-sm leading-relaxed text-[#6B6560]">
                Credenciais da integração para checkout online na vitrine.
              </p>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-semibold text-cocoa">Painel MP</p>
                <a
                  href="https://www.mercadopago.com.br/developers/panel/app"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--painel-brand)] hover:underline"
                >
                  Abrir desenvolvedores
                  <ExternalLink className="h-3 w-3" aria-hidden />
                </a>
              </div>
              <div className="grid gap-4">
                <Field
                  label="Public Key"
                  id="mp-public-key-sheet"
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
                  id="mp-access-token-sheet"
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
                  id="mp-webhook-secret-sheet"
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
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <p className="min-w-0 flex-1 text-xs text-[#8C8682]">
                  URL do webhook:{" "}
                  <code className="break-all rounded bg-[#F0F2F5] px-1.5 py-0.5 font-mono text-[11px] text-cocoa">
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
            </SheetBody>
            <SheetFooter>
              <SheetCancel />
              <SheetPrimary type="button" onClick={() => setMpConfigOpen(false)}>
                Concluir
              </SheetPrimary>
            </SheetFooter>
          </SheetContent>
        </Sheet>

        <Sheet open={cardBrandsOpen} onOpenChange={setCardBrandsOpen}>
          <SheetContent size="md" side="right">
            <SheetHeader title="Bandeiras na entrega" />
            <SheetBody className="space-y-4">
              <p className="text-sm leading-relaxed text-[#6B6560]">
                Selecione as bandeiras aceitas quando o cliente paga com cartão
                na entrega ou retirada.
              </p>
              <div className="flex flex-wrap gap-2">
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
            </SheetBody>
            <SheetFooter>
              <SheetCancel />
              <SheetPrimary type="button" onClick={() => setCardBrandsOpen(false)}>
                Concluir
              </SheetPrimary>
            </SheetFooter>
          </SheetContent>
        </Sheet>

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
                    <Sparkles
                      className="h-4 w-4 text-[var(--painel-brand)]"
                      aria-hidden
                    />
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

        <div className="mt-4 overflow-hidden rounded-lg border border-[var(--painel-border,#E8E2DE)] bg-white">
          <p className="hidden items-start gap-2 border-b border-[var(--painel-border,#E8E2DE)] px-5 py-3 text-xs text-[#8C8682] sm:flex">
            <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
            <span>
              As alterações só entram na vitrine após salvar.
            </span>
          </p>
          <div className="flex flex-col gap-3 px-3 py-3 sm:flex-row sm:items-center sm:justify-end sm:gap-3 sm:px-5 sm:py-3.5">
            <p className="text-center text-[11px] leading-snug text-[#8C8682] sm:hidden">
              Salve para publicar na vitrine.
            </p>
            <button
              type="submit"
              className="btn-primary inline-flex h-11 w-full items-center justify-center gap-2 text-sm sm:!h-10 sm:w-auto sm:!px-5"
              disabled={saving}
            >
              <Check className="h-4 w-4" aria-hidden />
              {saving ? "Salvando…" : "Salvar alterações"}
            </button>
          </div>
        </div>
      </PageShell>
    </form>
  );
}

function deliveryDisplayTitle(method: string) {
  if (method === "Pix") return "Pix na entrega";
  return method;
}

function deliveryRowDescription(method: string) {
  if (method === "Dinheiro") return "Pagamento em espécie na entrega";
  if (method === "Pix") return "Transferência via Pix na entrega";
  if (method === "Sinal para encomenda") {
    return "50% na confirmação e 50% na entrega";
  }
  if (/cartão de crédito/i.test(method)) return "Crédito na entrega";
  if (/cartão de débito/i.test(method)) return "Débito na entrega";
  if (/vale-refeição/i.test(method)) return "Vale-refeição na entrega";
  if (/vale-alimentação/i.test(method)) return "Vale-alimentação na entrega";
  if (method === "Transferência bancária") {
    return "Transferência combinada no WhatsApp";
  }
  return "Forma personalizada na vitrine";
}

function methodIconTone(method: string) {
  if (method === "Dinheiro") return "bg-emerald-50 text-emerald-700";
  if (method === "Pix") return "bg-teal-50 text-teal-700";
  if (/débito/i.test(method)) return "bg-sky-50 text-sky-700";
  if (/crédito/i.test(method)) return "bg-violet-50 text-violet-700";
  if (/vale-refeição/i.test(method)) return "bg-orange-50 text-orange-800";
  if (/vale-alimentação/i.test(method)) return "bg-pink-50 text-pink-800";
  if (method === "Transferência bancária") return "bg-slate-100 text-slate-700";
  if (method === "Sinal para encomenda") return "bg-indigo-50 text-indigo-700";
  return "bg-[#F0F7F4] text-[var(--painel-brand)]";
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

function PaymentPanelHeader({
  title,
  description,
  masterId,
  masterOn,
  onMasterChange,
  disabled = false,
  extra,
}: {
  title: string;
  description: string;
  masterId: string;
  masterOn: boolean;
  onMasterChange: (v: boolean) => void;
  disabled?: boolean;
  extra?: ReactNode;
}) {
  return (
    <div className="border-b border-[#EEF0F2] pb-3 sm:pb-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-bold text-cocoa sm:text-base">{title}</h2>
          <p className="mt-1 hidden text-xs leading-relaxed text-[#8C8682] sm:block sm:text-sm">
            {description}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <span
            className={cn(
              "text-[11px] font-semibold sm:text-xs",
              masterOn ? "text-emerald-700" : "text-[#8C8682]",
            )}
          >
            {masterOn ? "Ativo" : "Inativo"}
          </span>
          <div className="[&_label]:!w-auto [&_label]:items-center">
            <Switch
              id={masterId}
              checked={masterOn}
              onCheckedChange={onMasterChange}
              disabled={disabled}
              aria-label={`${masterOn ? "Desativar" : "Ativar"} ${title}`}
            />
          </div>
        </div>
      </div>
      <p className="mt-2 text-xs leading-relaxed text-[#8C8682] sm:hidden">
        {description}
      </p>
      {extra ? (
        <div className="mt-3 flex justify-stretch sm:mt-2 sm:justify-end">
          {extra}
        </div>
      ) : null}
    </div>
  );
}

function PaymentMethodRow({
  id,
  title,
  description,
  icon: Icon,
  iconClassName,
  active,
  onToggle,
  onConfigure,
  disabled = false,
}: {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  iconClassName: string;
  active: boolean;
  onToggle: (checked: boolean) => void;
  onConfigure: () => void;
  disabled?: boolean;
}) {
  return (
    <div
      className={cn(
        "py-3.5 sm:flex sm:items-center sm:justify-between sm:gap-4 sm:py-4",
        disabled && "opacity-60",
      )}
    >
      <div className="flex min-w-0 flex-1 items-start gap-3">
        <div
          className={cn(
            "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg sm:h-10 sm:w-10 sm:rounded-xl",
            iconClassName,
          )}
        >
          <Icon className="h-4 w-4 sm:h-5 sm:w-5" aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold leading-snug text-cocoa">{title}</p>
          <p className="mt-0.5 text-[11px] leading-snug text-[#8C8682] sm:text-xs sm:leading-relaxed">
            {description}
          </p>
        </div>
      </div>
      <div
        className="mt-2.5 flex items-center justify-between gap-2 pl-12 sm:mt-0 sm:shrink-0 sm:justify-end sm:gap-3 sm:pl-0"
      >
        <span
          className={cn(
            "text-[11px] font-semibold sm:min-w-[3.25rem] sm:text-right sm:text-xs",
            active ? "text-emerald-700" : "text-[#8C8682]",
          )}
        >
          {active ? "Ativo" : "Inativo"}
        </span>
        <div className="flex items-center gap-1.5 sm:gap-2">
          <div className="[&_label]:!w-auto [&_label]:items-center">
            <Switch
              id={id}
              checked={active}
              onCheckedChange={onToggle}
              disabled={disabled}
              aria-label={`${active ? "Desativar" : "Ativar"} ${title}`}
            />
          </div>
          <button
            type="button"
            onClick={onConfigure}
            disabled={disabled}
            className="inline-flex min-h-9 items-center gap-0.5 rounded-lg px-2 py-1.5 text-[11px] font-semibold text-[var(--painel-brand)] transition hover:bg-[#E8F3EF] disabled:opacity-50 sm:min-h-0 sm:text-xs"
          >
            Configurar
            <ChevronRight className="h-3.5 w-3.5" aria-hidden />
          </button>
        </div>
      </div>
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
