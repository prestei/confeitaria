"use client";

import {
  FormEvent,
  useRef,
  useState,
  type ComponentProps,
  type ReactNode,
} from "react";
import Link from "next/link";
import {
  BadgeCheck,
  Bell,
  CalendarDays,
  Camera,
  Check,
  CreditCard,
  ChevronRight,
  Clock3,
  Crown,
  Eye,
  EyeOff,
  Lock,
  Mail,
  MapPin,
  MessageCircle,
  MessagesSquare,
  Package,
  Phone,
  ShoppingBag,
  ShoppingBasket,
  UserRound,
} from "lucide-react";
import { Input, Label } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/cn";

const BRAND_NAME_MAX = 50;

async function patchStore(payload: Record<string, unknown>) {
  return fetch("/api/store", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

async function uploadFile(file: File): Promise<string> {
  const body = new FormData();
  body.append("file", file);
  const res = await fetch("/api/uploads", { method: "POST", body });
  const json = (await res.json().catch(() => null)) as {
    url?: string;
    error?: string;
  } | null;
  if (!res.ok || !json?.url) {
    throw new Error(json?.error || "Falha no upload");
  }
  return json.url;
}

function IconInput({
  icon: Icon,
  className,
  id,
  ...props
}: Omit<ComponentProps<typeof Input>, "className"> & {
  icon: typeof Phone;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "input flex min-h-[2.75rem] items-center gap-2.5 focus-within:border-[color-mix(in_oklab,var(--painel-brand)_35%,var(--painel-border))] focus-within:shadow-[0_0_0_3px_color-mix(in_oklab,var(--painel-brand)_14%,transparent)]",
        className,
      )}
    >
      <Icon className="h-4 w-4 shrink-0 text-[#8C8682]" aria-hidden />
      <input
        id={id}
        className="min-w-0 flex-1 border-0 bg-transparent p-0 text-base leading-normal text-cocoa outline-none placeholder:text-[#8C8682]/80 md:text-sm"
        {...props}
      />
    </div>
  );
}

function SectionHeading({
  icon: Icon,
  title,
}: {
  icon: typeof ShoppingBasket;
  title: string;
}) {
  return (
    <div className="flex items-center gap-2.5">
      <span
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#E8F0EE] text-[var(--painel-brand,#0f352e)]"
        aria-hidden
      >
        <Icon className="h-4 w-4" strokeWidth={1.75} />
      </span>
      <h2 className="text-sm font-semibold text-cocoa">{title}</h2>
    </div>
  );
}

function NotificationTile({
  id,
  icon: Icon,
  title,
  description,
  checked,
  onCheckedChange,
}: {
  id: string;
  icon: typeof Mail;
  title: string;
  description: string;
  checked: boolean;
  onCheckedChange: (v: boolean) => void;
}) {
  return (
    <div
      className="flex min-h-[8.5rem] flex-col justify-between gap-3 rounded-xl border border-[var(--painel-border)] bg-[#FAFAF9] p-4"
    >
      <div className="space-y-2">
        <span
          className="flex h-9 w-9 items-center justify-center rounded-lg bg-white text-[#5C5652] shadow-sm ring-1 ring-[var(--painel-border)]"
          aria-hidden
        >
          <Icon className="h-4 w-4" strokeWidth={1.75} />
        </span>
        <p className="text-[13px] font-semibold leading-snug text-cocoa sm:text-sm">
          {title}
        </p>
        <p className="text-[11px] leading-snug text-[#8C8682] sm:text-xs sm:leading-relaxed">
          {description}
        </p>
      </div>
      <div className="flex justify-end">
        <Switch id={id} checked={checked} onCheckedChange={onCheckedChange} />
      </div>
    </div>
  );
}

function AttendanceLinkCard({
  href,
  title,
  description,
  icon: Icon,
  onClick,
}: {
  href?: string;
  title: string;
  description: string;
  icon: typeof Clock3;
  onClick?: () => void;
}) {
  const className =
    "group flex min-h-[5.5rem] flex-1 items-center gap-3 rounded-xl border border-[var(--painel-border)] bg-white p-4 shadow-sm transition hover:border-[color-mix(in_oklab,var(--painel-brand)_22%,var(--painel-border))] hover:shadow-md";

  const inner = (
    <>
      <span
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F0F2F5] text-[#5C5652]"
        aria-hidden
      >
        <Icon className="h-4 w-4 sm:h-[1.125rem] sm:w-[1.125rem]" strokeWidth={1.75} />
      </span>
      <div className="min-w-0 flex-1 space-y-0.5">
        <p className="text-[13px] font-semibold text-cocoa sm:text-sm">{title}</p>
        <p className="text-[11px] leading-snug text-[#8C8682] sm:text-xs sm:leading-relaxed">
          {description}
        </p>
      </div>
      <ChevronRight
        className="h-4 w-4 shrink-0 text-[#8C8682] transition group-hover:translate-x-0.5"
        aria-hidden
      />
    </>
  );

  if (href) {
    return (
      <Link href={href} className={className}>
        {inner}
      </Link>
    );
  }

  return (
    <button type="button" className={cn(className, "text-left")} onClick={onClick}>
      {inner}
    </button>
  );
}

function StorefrontPreview({
  name,
  description,
  logoUrl,
  coverUrl,
  onCoverChange,
  uploading,
}: {
  name: string;
  description: string;
  logoUrl: string;
  coverUrl: string;
  onCoverChange: (file: File) => void;
  uploading: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="space-y-3">
      <p className="text-xs font-semibold text-[#8C8682]">Preview na vitrine</p>
      <div className="overflow-hidden rounded-xl border border-[var(--painel-border)] bg-white shadow-sm">
        <div className="relative aspect-[16/10] bg-[#E8E6E3]">
          {coverUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={coverUrl}
              alt=""
              className="h-full w-full object-cover"
            />
          ) : null}
          <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent" />
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="sr-only"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) onCoverChange(file);
              e.target.value = "";
            }}
          />
          <button
            type="button"
            disabled={uploading}
            onClick={() => inputRef.current?.click()}
            className="absolute bottom-3 left-1/2 inline-flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-white/95 px-3 py-1.5 text-xs font-semibold text-cocoa shadow-md transition hover:bg-white disabled:opacity-70"
          >
            <Camera className="h-3.5 w-3.5" aria-hidden />
            {uploading ? "Enviando…" : "Alterar foto"}
          </button>
        </div>
        <div className="space-y-2 p-3.5">
          <div className="flex items-start gap-2.5 rounded-lg border border-[var(--painel-border)] bg-[#FAFAF9] p-2.5">
            <div
              className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-[#E8E6E3] ring-1 ring-[var(--painel-border)]"
            >
              {logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={logoUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                <span className="flex h-full w-full items-center justify-center text-xs font-bold text-[#5C5652]">
                  {name.trim().slice(0, 1) || "?"}
                </span>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="flex items-center gap-1 text-xs font-semibold text-cocoa">
                <span className="truncate">{name.trim() || "Sua marca"}</span>
                <BadgeCheck
                  className="h-3.5 w-3.5 shrink-0 text-[var(--painel-accent,#1e6b5c)]"
                  aria-hidden
                />
              </p>
              <p className="mt-0.5 line-clamp-2 text-[10px] leading-snug text-[#8C8682]">
                {description.trim() ||
                  "Bolos e doces artesanais feitos com carinho…"}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export type GeneralSettingsProps = {
  store: {
    name: string;
    description: string;
    logoUrl: string;
    coverUrl: string;
    address: string;
    businessHours: string;
    plan: string;
    notifyNewOrders: boolean;
    notifyLowStock: boolean;
    notifyNewCustomers: boolean;
    notifyViaEmail: boolean;
    notifyViaWhatsApp: boolean;
  };
  user: {
    email: string;
    phone: string;
  };
};

function Block({
  icon,
  title,
  children,
}: {
  icon: typeof ShoppingBasket;
  title: string;
  children: ReactNode;
}) {
  return (
    <section
      className="overflow-hidden rounded-xl border border-[var(--painel-border)] bg-white shadow-sm"
    >
      <div className="border-b border-[var(--painel-border)] px-4 py-3.5 sm:px-5">
        <SectionHeading icon={icon} title={title} />
      </div>
      <div className="p-4 sm:p-5">{children}</div>
    </section>
  );
}

export function GeneralSettingsForm({ store, user }: GeneralSettingsProps) {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);

  const [brandName, setBrandName] = useState(store.name);
  const [address, setAddress] = useState(store.address);
  const [coverUrl, setCoverUrl] = useState(store.coverUrl);
  const [logoUrl] = useState(store.logoUrl);
  const [phone, setPhone] = useState(user.phone);
  const [password, setPassword] = useState("");

  const [notifyViaEmail, setNotifyViaEmail] = useState(store.notifyViaEmail);
  const [notifyViaWhatsApp, setNotifyViaWhatsApp] = useState(
    store.notifyViaWhatsApp,
  );
  const [notifyNewOrders, setNotifyNewOrders] = useState(store.notifyNewOrders);
  const [notifyLowStock, setNotifyLowStock] = useState(store.notifyLowStock);
  const [notifyNewCustomers, setNotifyNewCustomers] = useState(
    store.notifyNewCustomers,
  );

  const hoursSummary =
    store.businessHours?.trim() || "Configure os horários da sua loja";

  const planLabel =
    store.plan === "pro"
      ? "Pro"
      : store.plan === "business"
        ? "Business"
        : "Starter";

  async function onCoverPick(file: File) {
    setUploadingCover(true);
    try {
      const url = await uploadFile(file);
      setCoverUrl(url);
      const res = await patchStore({ coverUrl: url });
      toast({
        title: res.ok ? "Foto da vitrine atualizada" : "Upload ok, mas falhou ao salvar",
        tone: res.ok ? "success" : "warning",
      });
    } catch (e) {
      toast({
        title: e instanceof Error ? e.message : "Falha no upload",
        tone: "error",
      });
    } finally {
      setUploadingCover(false);
    }
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!notifyViaEmail && !notifyViaWhatsApp) {
      toast({
        title: "Escolha ao menos um canal (e-mail ou WhatsApp)",
        tone: "warning",
      });
      return;
    }

    setSaving(true);
    const accountRes = await fetch("/api/account", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        phone: phone || "",
        ...(password.trim() ? { password: password.trim() } : {}),
      }),
    });
    const storeRes = await patchStore({
      name: brandName.trim(),
      address: address.trim(),
      coverUrl: coverUrl || null,
      notifyNewOrders,
      notifyLowStock,
      notifyNewCustomers,
      notifyViaEmail,
      notifyViaWhatsApp,
    });
    setSaving(false);

    const ok = accountRes.ok && storeRes.ok;
    toast({
      title: ok ? "Alterações salvas" : "Erro ao salvar",
      tone: ok ? "success" : "error",
    });
    if (ok) setPassword("");
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4 sm:gap-5">
      <Block icon={ShoppingBasket} title="Dados da loja">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(15rem,260px)] lg:items-start">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1 sm:col-span-2">
              <Label htmlFor="geral-brand-name">Nome da marca</Label>
              <Input
                id="geral-brand-name"
                name="brandName"
                value={brandName}
                onChange={(e) =>
                  setBrandName(e.target.value.slice(0, BRAND_NAME_MAX))
                }
                maxLength={BRAND_NAME_MAX}
                required
              />
              <p className="text-right text-xs text-[#8C8682]">
                {brandName.length}/{BRAND_NAME_MAX}
              </p>
            </div>
            <div className="space-y-1">
              <Label htmlFor="geral-email">E-mail</Label>
              <Input
                id="geral-email"
                value={user.email}
                disabled
                className="bg-[#F0F2F5]/70"
              />
              <p className="text-[11px] text-[#8C8682] sm:text-xs">
                O e-mail não pode ser alterado por aqui.
              </p>
            </div>
            <div className="space-y-1">
              <Label htmlFor="geral-phone">Telefone</Label>
              <IconInput
                id="geral-phone"
                name="phone"
                icon={Phone}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="(11) 99999-9999"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="geral-password">Nova senha</Label>
              <div
                className="input flex min-h-[2.75rem] items-center gap-2 focus-within:border-[color-mix(in_oklab,var(--painel-brand)_35%,var(--painel-border))] focus-within:shadow-[0_0_0_3px_color-mix(in_oklab,var(--painel-brand)_14%,transparent)]"
              >
                <Lock className="h-4 w-4 shrink-0 text-[#8C8682]" aria-hidden />
                <input
                  id="geral-password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Deixe em branco para manter"
                  minLength={6}
                  className="min-w-0 flex-1 border-0 bg-transparent p-0 text-base leading-normal text-cocoa outline-none placeholder:text-[#8C8682]/80 md:text-sm"
                />
                <button
                  type="button"
                  className="shrink-0 rounded-md p-1 text-[#8C8682] hover:bg-[#F0F2F5] hover:text-cocoa"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" aria-hidden />
                  ) : (
                    <Eye className="h-4 w-4" aria-hidden />
                  )}
                </button>
              </div>
            </div>
            <div className="space-y-1 sm:col-span-2">
              <Label htmlFor="geral-address">Endereço</Label>
              <IconInput
                id="geral-address"
                name="address"
                icon={MapPin}
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Rua, número, bairro"
              />
            </div>
          </div>

          <StorefrontPreview
            name={brandName}
            description={store.description}
            logoUrl={logoUrl}
            coverUrl={coverUrl}
            uploading={uploadingCover}
            onCoverChange={onCoverPick}
          />
        </div>
      </Block>

      <Block icon={Bell} title="Notificações">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <NotificationTile
            id="notify-via-email"
            icon={Mail}
            title="Canal: e-mail"
            description="Envia para o e-mail da conta do painel (SMTP)."
            checked={notifyViaEmail}
            onCheckedChange={setNotifyViaEmail}
          />
          <NotificationTile
            id="notify-via-whatsapp"
            icon={MessageCircle}
            title="Canal: WhatsApp"
            description="Envia para o WhatsApp da loja (Meta, Evolution ou webhook)."
            checked={notifyViaWhatsApp}
            onCheckedChange={setNotifyViaWhatsApp}
          />
          <NotificationTile
            id="notify-orders"
            icon={ShoppingBag}
            title="Novos pedidos"
            description="Aviso quando um pedido chegar pela vitrine."
            checked={notifyNewOrders}
            onCheckedChange={setNotifyNewOrders}
          />
          <NotificationTile
            id="notify-stock"
            icon={Package}
            title="Estoque baixo"
            description="Quando um produto atingir o mínimo cadastrado."
            checked={notifyLowStock}
            onCheckedChange={setNotifyLowStock}
          />
          <NotificationTile
            id="notify-customers"
            icon={UserRound}
            title="Novos clientes"
            description="Quando um cliente for cadastrado pela primeira vez."
            checked={notifyNewCustomers}
            onCheckedChange={setNotifyNewCustomers}
          />
        </div>
      </Block>

      <section className="space-y-3">
        <SectionHeading icon={Clock3} title="Configurações de atendimento" />
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
          <AttendanceLinkCard
            href="/painel/configuracoes/horarios"
            icon={Clock3}
            title="Horário de funcionamento"
            description={hoursSummary}
          />
          <AttendanceLinkCard
            href="/painel/configuracoes/agendamento"
            icon={CalendarDays}
            title="Agendamento"
            description="Configure regras de agendamento na sua vitrine."
          />
          <AttendanceLinkCard
            icon={MessagesSquare}
            title="Tempo de resposta"
            description="Defina o tempo médio para responder seus clientes."
            onClick={() =>
              toast({
                title: "Em breve",
                description:
                  "Você poderá definir o tempo médio de resposta exibido na vitrine.",
                tone: "info",
              })
            }
          />
        </div>
      </section>

      <section
        className="overflow-hidden rounded-xl border border-[var(--painel-border)] bg-white shadow-sm"
      >
        <div className="border-b border-[var(--painel-border)] px-4 py-3.5 sm:px-5">
          <SectionHeading icon={CreditCard} title="Plano atual" />
        </div>
        <div className="flex flex-col gap-5 p-4 sm:p-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0 shrink-0 lg:max-w-[14rem]">
            <p className="text-2xl font-bold tracking-tight text-cocoa">
              {planLabel}
            </p>
            <p className="mt-1 text-xs leading-relaxed text-[#8C8682] sm:text-sm">
              Vitrine digital, pedidos, agenda e estoque inclusos.
            </p>
          </div>
          <ul className="grid flex-1 gap-2 text-sm text-[#5C5652] sm:grid-cols-2">
            {[
              "Vitrine personalizada",
              "Pedidos e WhatsApp",
              "Produtos e categorias ilimitados",
              "Analytics básico",
            ].map((item) => (
              <li key={item} className="flex items-center gap-2">
                <Check className="h-4 w-4 shrink-0 text-success" aria-hidden />
                {item}
              </li>
            ))}
          </ul>
          <button
            type="button"
            className="btn-secondary inline-flex h-11 w-full shrink-0 items-center justify-center gap-2 !py-2 text-sm lg:h-10 lg:w-auto"
            disabled
          >
            <Crown className="h-4 w-4" aria-hidden />
            Upgrade em breve
          </button>
        </div>
      </section>

      <div
        className="flex w-full shrink-0 flex-col gap-3 rounded-xl border border-[var(--painel-border)] bg-white px-4 py-4 shadow-sm sm:flex-row sm:items-center sm:justify-end sm:gap-2 sm:px-5"
      >
        <Link
          href="/painel/configuracoes"
          className="btn-secondary inline-flex h-11 w-full items-center justify-center !py-2 text-sm sm:h-10 sm:w-auto"
        >
          Cancelar
        </Link>
        <button
          type="submit"
          className="btn-primary inline-flex h-11 w-full items-center justify-center gap-2 !py-2 text-sm sm:h-10 sm:w-auto"
          disabled={saving || uploadingCover}
        >
          <Check className="h-4 w-4" aria-hidden />
          {saving ? "Salvando…" : "Salvar alterações"}
        </button>
      </div>
    </form>
  );
}
