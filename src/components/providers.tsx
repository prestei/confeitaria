"use client";

import { SessionProvider } from "next-auth/react";
import { ToastProvider } from "@/components/toast";
import { ToastProvider as LegacyToastProvider } from "@/components/ui/toast";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ToastProvider>
        <LegacyToastProvider>{children}</LegacyToastProvider>
      </ToastProvider>
    </SessionProvider>
  );
}
