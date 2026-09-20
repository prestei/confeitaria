import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/painel/page-header";
import { SettingsSubnav } from "@/components/painel/settings-nav";

export function SettingsSectionHeader({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <div className="space-y-4">
      <Link
        href="/painel/configuracoes"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-[#8C8682] transition hover:text-[#2D2926]"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden />
        Configurações
      </Link>
      <PageHeader title={title} description={description} />
      <SettingsSubnav />
    </div>
  );
}
