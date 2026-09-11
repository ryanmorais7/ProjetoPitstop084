import Reveal from "./Reveal";
import Bolt from "./Bolt";

const diferenciais = [
  { numero: "01", titulo: "Hora marcada" },
  { numero: "02", titulo: "Cuidado nos detalhes" },
  { numero: "03", titulo: "Experiência premium" },
];

const etapas = ["Recebemos", "Cuidamos", "Entregamos"];

export default function SobreDiferencial() {
  return (
    <section id="sobre" className="px-6 py-24">
      <div className="mx-auto max-w-3xl">
        <Reveal>
          <div className="mb-2 flex items-center gap-2 font-mono text-xs uppercase tracking-[0.2em] text-text-secondary">
            <Bolt className="h-3.5 w-3.5 text-gold" />
            Sobre a Pitstop
          </div>
          <h2 className="font-heading text-3xl font-bold md:text-5xl">Não é só lavar. É cuidar.</h2>
          <p className="mt-4 max-w-xl text-text-secondary">
            A Pitstop transforma o cuidado com o carro em uma experiência com hora marcada,
            atenção aos detalhes e padrão de qualidade.
          </p>
        </Reveal>

        <Reveal delayMs={80}>
          <div className="mt-10 grid gap-6 sm:grid-cols-3">
            {diferenciais.map((item) => (
              <div key={item.numero}>
                <span className="font-mono text-sm text-gold">{item.numero}</span>
                <p className="mt-1 font-heading text-base font-bold">{item.titulo}</p>
              </div>
            ))}
          </div>
        </Reveal>

        <Reveal delayMs={140}>
          <div className="mt-10 flex flex-wrap items-center gap-3 text-xs">
            <span className="rounded-full border border-white/15 px-3 py-1 text-text-secondary">
              Lava-jato comum: fila · pressa · serviço genérico
            </span>
            <span className="rounded-full border border-gold/50 px-3 py-1 text-gold">
              Pitstop: hora marcada · cuidado · experiência
            </span>
          </div>
        </Reveal>

        <Reveal delayMs={180}>
          <div className="mt-10 flex items-center gap-3 font-mono text-xs uppercase tracking-wide text-text-secondary">
            {etapas.map((etapa, i) => (
              <span key={etapa} className="flex items-center gap-3">
                <span>
                  0{i + 1} {etapa}
                </span>
                {i < etapas.length - 1 && <Bolt className="h-3 w-3 text-gold" />}
              </span>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
