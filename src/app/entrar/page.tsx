"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { FormEvent, Suspense, useState } from "react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const resetOk = searchParams.get("reset") === "1";
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const fd = new FormData(e.currentTarget);
    try {
      const res = await signIn("credentials", {
        email: String(fd.get("email")),
        password: String(fd.get("password")),
        redirect: false,
      });
      if (res?.error) {
        setError(
          res.error === "Configuration"
            ? "Banco de dados indisponível. No terminal: npm run db:mongo-local e npm run db:seed."
            : "E-mail ou senha inválidos.",
        );
        return;
      }
      router.push("/painel");
      router.refresh();
    } catch {
      setError("Falha de conexão. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {resetOk ? (
        <p className="mt-4 rounded-md bg-emerald-50 px-3 py-2.5 text-sm text-success">
          Senha atualizada. Entre com a nova senha.
        </p>
      ) : null}
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
            defaultValue="demo@doceencanto.com"
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
          <p className="mt-2 text-right text-xs">
            <Link href="/esqueci-senha" className="font-medium text-rosewood">
              Esqueci minha senha
            </Link>
          </p>
        </div>
        {error && <p className="text-sm text-berry-deep">{error}</p>}
        <button type="submit" className="btn-primary w-full" disabled={loading}>
          {loading ? "Entrando..." : "Entrar"}
        </button>
      </form>
    </>
  );
}

export default function LoginPage() {
  return (
    <div className="bg-atelier bg-grain flex min-h-screen items-center justify-center px-5 py-12">
      <div className="panel w-full max-w-md p-8">
        <Link href="/entrar" className="font-display text-2xl text-cocoa">
          Doce<span className="text-rosewood">Pedido</span>
        </Link>
        <h1 className="mt-6 font-display text-3xl text-cocoa">Entrar</h1>
        <p className="mt-2 text-sm text-cocoa-soft/75">
          Acesse o painel da sua confeitaria.
        </p>
        <Suspense
          fallback={
            <p className="mt-6 text-sm text-cocoa-soft">Carregando...</p>
          }
        >
          <LoginForm />
        </Suspense>
        <p className="mt-5 text-center text-sm text-cocoa-soft/70">
          Ainda não tem conta?{" "}
          <Link href="/cadastrar" className="font-semibold text-rosewood">
            Criar cardápio
          </Link>
        </p>
        <p className="mt-4 rounded-md bg-sand/80 px-3 py-2.5 text-center text-xs leading-relaxed text-cocoa-soft">
          Demo:{" "}
          <span className="font-medium text-cocoa">demo@doceencanto.com</span> /{" "}
          <span className="font-medium text-cocoa">demo1234</span>
          <br />
          Se o login falhar, suba o Mongo:{" "}
          <code className="text-cocoa">npm run db:mongo-local</code>
        </p>
      </div>
    </div>
  );
}
