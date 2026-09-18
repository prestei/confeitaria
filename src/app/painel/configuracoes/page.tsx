import { PageHeader } from "@/components/painel/page-header";
import { SettingsHub } from "@/components/painel/settings-hub";

export default function ConfiguracoesPage() {
  return (
    <div className="space-y-4">
      <PageHeader
        title="Configurações"
        description="Horários, estabelecimento, pagamento e preferências gerais."
      />
      <SettingsHub />
    </div>
  );
}
