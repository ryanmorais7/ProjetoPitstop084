"use client";

import Reveal from "./Reveal";
import Bolt from "./Bolt";

export default function BusinessModelSelector() {
  function scrollPara(id: string) {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  }

  return (
    <section className="px-6 py-24">
      <div className="mx-auto max-w-4xl">
        <Reveal>
          <div className="mb-2 flex items-center gap-2 font-mono text-xs uppercase tracking-[0.2em] text-text-secondary">
            <Bolt className="h-3.5 w-3.5 text-gold" />
            Você vem uma vez. Ou faz da Pitstop parte da rotina?
          </div>
          <h2 className="max-w-xl font-heading text-3xl font-bold md:text-5xl">
            Como você quer cuidar do seu carro?
          </h2>
        </Reveal>

        <div className="mt-12 grid gap-6 sm:grid-cols-2">
          <Reveal>
            <button
              type="button"
              onClick={() => scrollPara("servicos")}
              className="flex h-full w-full flex-col items-start rounded-sm border border-white/10 bg-panel p-8 text-left transition hover:border-gold/60"
            >
              <span className="font-mono text-xs uppercase tracking-widest text-text-secondary">
                Serviço avulso
              </span>
              <h3 className="mt-3 font-heading text-2xl font-bold">
                Para quando seu carro precisa de um cuidado agora.
              </h3>
              <span className="mt-6 flex items-center gap-1 font-mono text-xs uppercase tracking-wide text-gold">
                Ver serviços <Bolt className="h-3 w-3" />
              </span>
            </button>
          </Reveal>

          <Reveal delayMs={80}>
            <button
              type="button"
              onClick={() => scrollPara("planos")}
              className="flex h-full w-full flex-col items-start rounded-sm border border-white/10 bg-panel p-8 text-left transition hover:border-gold/60"
            >
              <span className="font-mono text-xs uppercase tracking-widest text-text-secondary">
                Assinatura Pitstop
              </span>
              <h3 className="mt-3 font-heading text-2xl font-bold">
                Para quem gosta de manter o carro sempre em dia e quer aproveitar benefícios
                exclusivos.
              </h3>
              <span className="mt-6 flex items-center gap-1 font-mono text-xs uppercase tracking-wide text-gold">
                Conhecer planos <Bolt className="h-3 w-3" />
              </span>
            </button>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
