"use client";

import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function AgendaControls({
  monthLabel,
  prevMonth,
  nextMonth,
}: {
  monthLabel: string;
  prevMonth: string;
  nextMonth: string;
  currentMonth: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <Link href={`/painel/agenda?month=${prevMonth}`}>
        <Button variant="secondary" size="icon" aria-label="Mês anterior">
          <ChevronLeft className="h-4 w-4" />
        </Button>
      </Link>
      <span className="min-w-[9rem] text-center text-sm font-semibold capitalize text-cocoa">
        {monthLabel}
      </span>
      <Link href={`/painel/agenda?month=${nextMonth}`}>
        <Button variant="secondary" size="icon" aria-label="Próximo mês">
          <ChevronRight className="h-4 w-4" />
        </Button>
      </Link>
    </div>
  );
}
