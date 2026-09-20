"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";

export default function ForgotPasswordPage() {
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const fd = new FormData(e.currentTarget);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: String(fd.get("email")) }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) {
        setError(json?.error || "Não foi possível enviar o e-mail");
        return;
      }
      setDone(true);
    } catch {
      setError("Falha de conexão. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-atelier bg-grain flex min-h-screen items-center justify-center px-5 py-12">
      <div className="panel w-full max-w-md p-8">
        <Link href="/" className="font-display text-2xl text-cocoa">
          Doce<span className="text-rosewood">Pedido</span>
        </Link>
        <h1 className="mt-6 font-display text-3xl text-cocoa">
          Recuperar senha
        </h1>
        <p className="mt-2 text-sm text-cocoa-soft/75">
          Enviaremos um link para redefinir o acesso ao painel.
        </p>

        {done ? (
          <div className="mt-6 space-y-4">
            <p className="rounded-md bg-sand/80 px-3 py-2.5 text-sm leading-relaxed text-cocoa">
              Se existir uma conta com este e-mail, o link de recuperação já foi
              enviado. Confira também a caixa de spam.
            </p>
            <Link href="/entrar" className="btn-primary inline-flex w-full justify-center">
              Voltar ao login
            </Link>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            <div>
              <label className="label" htmlFor="email">
                E-mail
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="input"
                autoComplete="email"
              />
            </div>
            {error && <p className="text-sm text-berry-deep">{error}</p>}
            <button type="submit" className="btn-primary w-full" disabled={loading}>
              {loading ? "Enviando..." : "Enviar link"}
            </button>
          </form>
        )}

        <p className="mt-5 text-center text-sm text-cocoa-soft/70">
          Lembrou a senha?{" "}
          <Link href="/entrar" className="font-semibold text-rosewood">
            Entrar
          </Link>
        </p>
      </div>
    </div>
  );
}
