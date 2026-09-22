"use client";

import BrandLogo from "./BrandLogo";
import Bolt from "./Bolt";
import Reveal from "./Reveal";
import { scrollToId } from "@/lib/scroll";

export default function CtaFinal() {
  return (
    <section className="bg-surface px-6 py-24">
      <Reveal className="mx-auto max-w-3xl rounded-sm border border-gold/25 bg-panel p-10 text-center">
        <BrandLogo className="items-center text-xl" />
        <h2 className="mt-4 font-heading text-3xl font-bold md:text-4xl">
          Seu carro. Nosso padrão.
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-text-secondary">
          Escolha seu cuidado, reserve seu horário e deixe o resto com a Pitstop 084.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <button
            type="button"
            onClick={() => scrollToId("agendamento")}
            className="flex items-center justify-center gap-2 rounded-sm bg-gold px-6 py-3 font-heading text-sm font-semibold tracking-wide text-asphalt transition hover:brightness-110"
          >
            <Bolt className="h-3.5 w-3.5" />
            Agendar meu horário
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
