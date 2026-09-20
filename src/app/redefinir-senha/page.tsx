"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useState } from "react";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const fd = new FormData(e.currentTarget);
    const password = String(fd.get("password"));
    const confirm = String(fd.get("confirm"));
    if (password !== confirm) {
      setError("As senhas não coincidem.");
      setLoading(false);
      return;
    }
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) {
        setError(json?.error || "Não foi possível redefinir a senha");
        return;
      }
      router.push("/entrar?reset=1");
      router.refresh();
    } catch {
      setError("Falha de conexão. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  if (!token) {
    return (
      <div className="mt-6 space-y-4">
        <p className="text-sm text-berry-deep">
          Link inválido. Solicite uma nova recuperação de senha.
        </p>
        <Link href="/esqueci-senha" className="btn-primary inline-flex w-full justify-center">
          Recuperar senha
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="mt-6 space-y-4">
      <div>
        <label className="label" htmlFor="password">
          Nova senha
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          minLength={6}
          className="input"
          autoComplete="new-password"
        />
      </div>
      <div>
        <label className="label" htmlFor="confirm">
          Confirmar senha
        </label>
        <input
          id="confirm"
          name="confirm"
          type="password"
          required
          minLength={6}
          className="input"
          autoComplete="new-password"
        />
      </div>
      {error && <p className="text-sm text-berry-deep">{error}</p>}
      <button type="submit" className="btn-primary w-full" disabled={loading}>
        {loading ? "Salvando..." : "Redefinir senha"}
      </button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="bg-atelier bg-grain flex min-h-screen items-center justify-center px-5 py-12">
      <div className="panel w-full max-w-md p-8">
        <Link href="/" className="font-display text-2xl text-cocoa">
          Doce<span className="text-rosewood">Pedido</span>
        </Link>
        <h1 className="mt-6 font-display text-3xl text-cocoa">
          Nova senha
        </h1>
        <p className="mt-2 text-sm text-cocoa-soft/75">
          Escolha uma senha nova para acessar o painel.
        </p>
        <Suspense fallback={<p className="mt-6 text-sm text-cocoa-soft">Carregando...</p>}>
          <ResetPasswordForm />
        </Suspense>
      </div>
    </div>
  );
}
