import { enderecoPitstop, linkComoChegar } from "@/lib/data";
import Reveal from "./Reveal";
import Bolt from "./Bolt";

export default function EnderecoSection() {
  return (
    <section className="px-6 py-20">
      <div className="mx-auto max-w-3xl">
        <Reveal>
          <div className="mb-2 flex items-center gap-2 font-mono text-xs uppercase tracking-[0.2em] text-text-secondary">
            <Bolt className="h-3.5 w-3.5 text-gold" />
            Localização
          </div>
          <h2 className="font-heading text-2xl font-bold md:text-4xl">{enderecoPitstop.nome}</h2>
          <p className="mt-2 text-text-secondary">{enderecoPitstop.linha1}</p>
          <p className="text-text-secondary">{enderecoPitstop.linha2}</p>

          <a
            href={linkComoChegar}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 inline-flex rounded-sm border border-gold px-6 py-3 font-heading text-sm font-semibold tracking-wide text-gold transition hover:bg-gold hover:text-asphalt"
          >
            Como chegar
          </a>
        </Reveal>
      </div>
    </section>
  );
}
