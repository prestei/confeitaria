"use server";

import { signOut } from "@/lib/auth";

export async function logoutFromPainel() {
  await signOut({ redirectTo: "/entrar" });
}
