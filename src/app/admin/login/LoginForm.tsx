"use client";

import { useActionState } from "react";
import { login, LoginState } from "../actions";

const estadoInicial: LoginState = {};

export default function LoginForm() {
  const [estado, formAction, pendente] = useActionState(login, estadoInicial);

  return (
    <form action={formAction} className="w-full max-w-sm rounded-sm border border-white/10 bg-panel p-8">
      <p className="font-heading text-xs font-bold uppercase tracking-[0.2em] text-gold">Pitstop 084</p>
      <h1 className="mt-1 font-heading text-2xl font-bold">Painel administrativo</h1>
      <p className="mt-2 text-sm text-text-secondary">Entre com a senha do painel.</p>

      <label className="mt-6 block">
        <span className="mb-1 block text-xs text-text-secondary">Senha</span>
        <input
          type="password"
          name="senha"
          required
          autoFocus
          className="campo"
          placeholder="••••••••"
        />
      </label>

      {estado?.erro && <p className="mt-3 text-sm text-red-400">{estado.erro}</p>}

      <button
        type="submit"
        disabled={pendente}
        className="mt-6 w-full rounded-sm bg-gold py-3 font-heading text-sm font-semibold tracking-wide text-asphalt transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pendente ? "Entrando..." : "Entrar"}
      </button>
    </form>
  );
}
