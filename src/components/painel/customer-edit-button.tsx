"use client";

import { useState } from "react";
import { Pencil } from "lucide-react";
import { PageAction } from "@/components/painel/page-header";
import {
  CustomerSheet,
  type CustomerSheetValue,
} from "@/components/painel/customer-sheet";

export function CustomerEditButton({
  customer,
}: {
  customer: CustomerSheetValue & { id: string };
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <PageAction onClick={() => setOpen(true)}>
        <Pencil className="h-4 w-4" />
        Editar
      </PageAction>
      <CustomerSheet open={open} onOpenChange={setOpen} customer={customer} />
    </>
  );
}
