import Reveal from "./Reveal";
import Bolt from "./Bolt";

const etapas = [
  { numero: "01", titulo: "Recepção", descricao: "Seu carro é recebido e a ordem de serviço é aberta." },
  { numero: "02", titulo: "Avaliação", descricao: "Verificamos o estado da pintura, interior e pontos de atenção." },
  { numero: "03", titulo: "Detalhamento", descricao: "Executamos o serviço com técnica e produtos adequados." },
  { numero: "04", titulo: "Entrega", descricao: "Conferência final e entrega com o carro pronto." },
];

export default function ProcessTimeline() {
  return (
    <section className="bg-surface px-6 py-24">
      <div className="mx-auto max-w-4xl">
        <Reveal>
          <div className="mb-2 flex items-center gap-2 font-mono text-xs uppercase tracking-[0.2em] text-text-secondary">
            <Bolt className="h-3.5 w-3.5 text-gold" />
            Processo
          </div>
          <h2 className="max-w-xl font-heading text-3xl font-bold md:text-5xl">
            Você vê o resultado. Nós cuidamos do processo.
          </h2>
        </Reveal>

        <div className="mt-14 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {etapas.map((etapa, i) => (
            <Reveal key={etapa.numero} delayMs={i * 90}>
              <div className="relative pl-6">
                {i > 0 && (
                  <span className="absolute -left-4 top-2 hidden text-gold/50 lg:-left-8 lg:block">
                    <Bolt className="h-4 w-4" />
                  </span>
                )}
                <span className="font-mono text-xs text-gold">{etapa.numero}</span>
                <h3 className="mt-2 font-heading text-lg font-bold">{etapa.titulo}</h3>
                <p className="mt-2 text-sm text-text-secondary">{etapa.descricao}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
