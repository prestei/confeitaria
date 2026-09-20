"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SETTINGS_SECTIONS } from "@/components/painel/settings-sections";
import { cn } from "@/lib/cn";

export { SETTINGS_SECTIONS } from "@/components/painel/settings-sections";

export function SettingsSubnav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Seções de configurações"
      className="-mx-1 flex gap-1 overflow-x-auto px-1 pb-0.5 scrollbar-thin"
    >
      {SETTINGS_SECTIONS.map(({ href, short, icon: Icon }) => {
        const active = pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "inline-flex shrink-0 items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition",
              active
                ? "bg-[#2D2926] text-white"
                : "border border-[#CED0D4] bg-white text-[#65676B] hover:bg-[#F0F2F5] hover:text-[#2D2926]",
            )}
          >
            <Icon className="h-3.5 w-3.5" aria-hidden />
            {short}
          </Link>
        );
      })}
    </nav>
  );
}
