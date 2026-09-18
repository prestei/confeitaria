"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { FormEvent, useState } from "react";

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const fd = new FormData(e.currentTarget);
    const res = await signIn("credentials", {
      email: String(fd.get("email")),
      password: String(fd.get("password")),
      redirect: false,
    });
    setLoading(false);
    if (res?.error) {
      setError("E-mail ou senha inválidos");
      return;
    }
    router.push("/painel");
    router.refresh();
  }

  return (
    <div className="bg-atelier bg-grain flex min-h-screen items-center justify-center px-5 py-12">
      <div className="panel w-full max-w-md p-8">
        <Link href="/" className="font-display text-2xl text-cocoa">
          Doce<span className="text-berry">Pedido</span>
        </Link>
        <h1 className="mt-6 font-display text-3xl text-cocoa">Entrar</h1>
        <p className="mt-2 text-sm text-cocoa-soft/75">
          Acesse o painel da sua confeitaria.
        </p>
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
              defaultValue="demo@docearte.com"
            />
          </div>
          <div>
            <label className="label" htmlFor="password">
              Senha
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              className="input"
              defaultValue="demo1234"
            />
          </div>
          {error && <p className="text-sm text-berry-deep">{error}</p>}
          <button type="submit" className="btn-primary w-full" disabled={loading}>
            {loading ? "Entrando..." : "Entrar"}
          </button>
        </form>
        <p className="mt-5 text-center text-sm text-cocoa-soft/70">
          Ainda não tem conta?{" "}
          <Link href="/cadastrar" className="font-semibold text-berry">
            Criar cardápio
          </Link>
        </p>
      </div>
    </div>
  );
}
