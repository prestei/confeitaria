"use client";

import { LogOut } from "lucide-react";

export function SignOutButton({ action }: { action: () => Promise<void> }) {
  return (
    <form action={action} className="contents">
      <button
        type="submit"
        className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-medium text-[#5C5652] hover:bg-[#F3EEEA] hover:text-[#2D2926]"
      >
        <LogOut className="h-[18px] w-[18px]" strokeWidth={1.75} />
        Sair
      </button>
    </form>
  );
}
