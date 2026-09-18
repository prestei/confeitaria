"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { FormEvent, useState } from "react";

export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const fd = new FormData(e.currentTarget);
    const payload = {
      name: String(fd.get("name")),
      email: String(fd.get("email")),
      password: String(fd.get("password")),
      storeName: String(fd.get("storeName")),
      whatsapp: String(fd.get("whatsapp")),
      slug: String(fd.get("slug") || ""),
    };

    const res = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    if (!res.ok) {
      setLoading(false);
      setError(json.error || "Erro ao cadastrar");
      return;
    }

    await signIn("credentials", {
      email: payload.email,
      password: payload.password,
      redirect: false,
    });
    setLoading(false);
    router.push("/painel");
    router.refresh();
  }

  return (
    <div className="bg-atelier bg-grain flex min-h-screen items-center justify-center px-5 py-12">
      <div className="panel w-full max-w-lg p-8">
        <Link href="/" className="font-display text-2xl text-cocoa">
          Doce<span className="text-berry">Pedido</span>
        </Link>
        <h1 className="mt-6 font-display text-3xl text-cocoa">Criar cardápio</h1>
        <p className="mt-2 text-sm text-cocoa-soft/75">
          Em minutos você terá um link público e um painel para gerenciar produtos.
        </p>
        <form onSubmit={onSubmit} className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="label" htmlFor="name">
              Seu nome
            </label>
            <input id="name" name="name" required className="input" />
          </div>
          <div>
            <label className="label" htmlFor="email">
              E-mail
            </label>
            <input id="email" name="email" type="email" required className="input" />
          </div>
          <div>
            <label className="label" htmlFor="password">
              Senha
            </label>
            <input
              id="password"
              name="password"
              type="password"
              minLength={6}
              required
              className="input"
            />
          </div>
          <div>
            <label className="label" htmlFor="storeName">
              Nome da confeitaria
            </label>
            <input id="storeName" name="storeName" required className="input" />
          </div>
          <div>
            <label className="label" htmlFor="whatsapp">
              WhatsApp
            </label>
            <input
              id="whatsapp"
              name="whatsapp"
              required
              placeholder="11999998888"
              className="input"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="label" htmlFor="slug">
              Link personalizado (opcional)
            </label>
            <div className="flex items-center gap-2">
              <span className="text-sm text-cocoa-soft/60">/</span>
              <input
                id="slug"
                name="slug"
                placeholder="minha-confeitaria"
                className="input"
              />
            </div>
          </div>
          {error && (
            <p className="sm:col-span-2 text-sm text-berry-deep">{error}</p>
          )}
          <button
            type="submit"
            className="btn-berry sm:col-span-2 w-full"
            disabled={loading}
          >
            {loading ? "Criando..." : "Criar minha loja"}
          </button>
        </form>
        <p className="mt-5 text-center text-sm text-cocoa-soft/70">
          Já tem conta?{" "}
          <Link href="/entrar" className="font-semibold text-berry">
            Entrar
          </Link>
        </p>
      </div>
    </div>
  );
}
