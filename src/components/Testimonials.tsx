import { depoimentos } from "@/lib/data";
import Reveal from "./Reveal";
import Bolt from "./Bolt";

export default function Testimonials() {
  return (
    <section className="bg-surface px-6 py-24">
      <div className="mx-auto max-w-5xl">
        <Reveal>
          <div className="mb-2 flex items-center gap-2 font-mono text-xs uppercase tracking-[0.2em] text-text-secondary">
            <Bolt className="h-3.5 w-3.5 text-gold" />
            Quem já assina
          </div>
          <h2 className="max-w-xl font-heading text-3xl font-bold md:text-5xl">
            Quem cuida, percebe a diferença.
          </h2>
          <p className="mt-3 font-mono text-xs uppercase tracking-widest text-gold">
            Depoimentos de exemplo, substituir por relatos reais de clientes
          </p>
        </Reveal>

        <div className="mt-14 grid gap-10 md:grid-cols-3">
          {depoimentos.map((depoimento, i) => (
            <Reveal key={depoimento.nome} delayMs={i * 80}>
              <span className="font-heading text-4xl text-gold/50">&ldquo;</span>
              <p className="mt-2 text-lg leading-snug text-text-primary">{depoimento.frase}</p>
              <p className="mt-4 font-mono text-xs uppercase tracking-wide text-text-secondary">
                {depoimento.nome} · {depoimento.carro}
              </p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
