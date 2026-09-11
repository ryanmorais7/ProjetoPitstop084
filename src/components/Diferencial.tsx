import { diferenciais } from "@/lib/data";
import Reveal from "./Reveal";
import Bolt from "./Bolt";

export default function Diferencial() {
  return (
    <section id="experiencia" className="px-6 py-24">
      <div className="mx-auto max-w-2xl">
        <Reveal>
          <div className="mb-2 flex items-center gap-2 font-mono text-xs uppercase tracking-[0.2em] text-text-secondary">
            <Bolt className="h-3.5 w-3.5 text-gold" />
            Diferencial
          </div>
          <h2 className="font-heading text-2xl font-bold md:text-4xl">
            Lava jato comum. Pitstop.
          </h2>
        </Reveal>

        <Reveal delayMs={100}>
          <div className="mt-10 divide-y divide-white/10 border-t border-white/10">
            {diferenciais.map((linha) => (
              <div
                key={linha.aspecto}
                className="flex flex-col gap-1 py-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <span className="text-sm text-text-secondary">{linha.aspecto}</span>
                <span className="font-mono text-sm">
                  <span className="text-text-secondary/60 line-through">{linha.lavaJatoComum}</span>
                  {" → "}
                  <span className="text-gold">{linha.pitstop084}</span>
                </span>
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
