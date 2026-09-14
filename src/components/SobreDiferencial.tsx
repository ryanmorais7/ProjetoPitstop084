import Reveal from "./Reveal";
import Bolt from "./Bolt";

const diferenciais = [
  { numero: "01", titulo: "Hora marcada" },
  { numero: "02", titulo: "Cuidado nos detalhes" },
  { numero: "03", titulo: "Nosso padrão" },
];

export default function SobreDiferencial() {
  return (
    <section id="sobre" className="bg-light px-6 py-24 text-light-text">
      <div className="mx-auto grid max-w-5xl gap-12 md:grid-cols-2 md:items-center">
        <Reveal>
          <div className="mb-2 flex items-center gap-2 font-mono text-xs uppercase tracking-[0.2em] text-light-text-secondary">
            <Bolt className="h-3.5 w-3.5 text-gold" />
            Sobre a Pitstop
          </div>
          <h2 className="font-heading text-3xl font-bold md:text-5xl">
            Não é só lavar. É cuidar.
          </h2>
          <p className="mt-4 max-w-md text-light-text-secondary">
            Na Pitstop 084, cada veículo recebe atenção aos detalhes, cuidado e um padrão pensado
            para quem valoriza o próprio carro.
          </p>

          <div className="mt-10 grid grid-cols-3 gap-4">
            {diferenciais.map((item) => (
              <div key={item.numero}>
                <span className="font-mono text-sm text-gold">{item.numero}</span>
                <p className="mt-1 font-heading text-sm font-bold">{item.titulo}</p>
              </div>
            ))}
          </div>
        </Reveal>

        <Reveal delayMs={100}>
          <div className="relative aspect-[4/5] w-full overflow-hidden rounded-sm">
            {/* Substituir por <Image> com foto real do carro/detalhamento quando disponível */}
            <div
              className="absolute inset-0"
              style={{
                background:
                  "linear-gradient(160deg, #0a0a0b 0%, #17181b 60%, #0a0a0b 100%)",
              }}
            />
            <p className="absolute bottom-6 left-6 right-6 font-heading text-lg font-bold text-white">
              Cuidar de um carro é mais do que limpar. É preservar cada detalhe.
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
