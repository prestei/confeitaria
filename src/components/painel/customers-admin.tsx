"use client";

import { useState } from "react";
import { Plus, Users } from "lucide-react";
import { PageAction, PageHeader } from "@/components/painel/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import {
  CustomersTable,
  type CustomerRow,
} from "@/components/painel/customers-table";
import {
  CustomerSheet,
  type CustomerSheetValue,
} from "@/components/painel/customer-sheet";

export function CustomersAdmin({
  rows,
  startOpen = false,
}: {
  rows: CustomerRow[];
  startOpen?: boolean;
}) {
  const [open, setOpen] = useState(startOpen);
  const [customer, setCustomer] = useState<CustomerSheetValue | null>(null);

  function openCreate() {
    setCustomer(null);
    setOpen(true);
  }

  function openEdit(row: CustomerRow) {
    setCustomer({
      id: row.id,
      name: row.name,
      phone: row.phone,
      email: row.email,
      instagram: row.instagram,
      notes: row.notes,
    });
    setOpen(true);
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Clientes"
        description="CRM simples: quem pediu, quanto gastou e quando voltou."
        actions={
          <PageAction onClick={openCreate}>
            <Plus className="h-4 w-4" />
            Novo cliente
          </PageAction>
        }
      />

      {rows.length === 0 ? (
        <EmptyState
          icon={Users}
          title="Nenhum cliente ainda"
          description="Cadastre um contato ou aguarde os pedidos da vitrine."
          action={{ label: "Novo cliente", onClick: openCreate }}
        />
      ) : (
        <CustomersTable rows={rows} onEdit={openEdit} />
      )}

      <CustomerSheet open={open} onOpenChange={setOpen} customer={customer} />
    </div>
  );
}
