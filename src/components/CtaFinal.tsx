"use client";

import Logo from "./Logo";
import Reveal from "./Reveal";
import { scrollToId } from "@/lib/scroll";

export default function CtaFinal() {
  return (
    <section className="bg-surface px-6 py-24">
      <Reveal className="mx-auto max-w-3xl rounded-sm border border-gold/25 bg-panel p-10 text-center">
        <Logo className="text-xl" />
        <h2 className="mt-4 font-heading text-3xl font-bold md:text-4xl">
          Seu carro merece hora marcada.
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-text-secondary">
          Escolha seu serviço, reserve seu horário e deixe o cuidado por nossa conta.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <button
            type="button"
            onClick={() => scrollToId("agendamento")}
            className="rounded-sm bg-gold px-6 py-3 font-heading text-sm font-semibold tracking-wide text-asphalt transition hover:brightness-110"
          >
            ⚡ Agendar meu horário
          </button>
          <button
            type="button"
            onClick={() => scrollToId("planos")}
            className="rounded-sm border border-white/15 px-6 py-3 font-heading text-sm font-semibold tracking-wide text-text-primary transition hover:border-gold hover:text-gold"
          >
            Conhecer os planos
          </button>
        </div>
      </Reveal>
    </section>
  );
}
