import Reveal from "./Reveal";
import Bolt from "./Bolt";

export default function LocationSection() {
  return (
    <section className="bg-surface px-6 py-24">
      <div className="mx-auto max-w-3xl">
        <Reveal>
          <div className="mb-2 flex items-center gap-2 font-mono text-xs uppercase tracking-[0.2em] text-text-secondary">
            <Bolt className="h-3.5 w-3.5 text-gold" />
            Localização
          </div>
          <h2 className="font-heading text-2xl font-bold md:text-4xl">
            Seu próximo Pitstop começa aqui.
          </h2>
          <p className="mt-2 text-text-secondary">Endereço a confirmar.</p>
          <p className="mt-1 text-sm text-text-secondary">Horário de funcionamento a confirmar.</p>

          <button
            type="button"
            disabled
            title="Endereço ainda não cadastrado"
            className="mt-6 cursor-not-allowed rounded-sm border border-white/15 px-6 py-3 font-heading text-sm font-semibold tracking-wide text-text-secondary opacity-50"
          >
            Como chegar
          </button>
        </Reveal>
      </div>
    </section>
  );
}
