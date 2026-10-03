import Image from "next/image";
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
            Na PitStop084, cada veículo recebe atenção aos detalhes, cuidado e um padrão pensado
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
            <Image
              src="/vitrificacao-pitstop084.jpg"
              alt="Aplicação de vitrificador em um aplicador de microfibra, com o carro ao fundo"
              fill
              sizes="(min-width: 768px) 40vw, 100vw"
              className="object-cover"
            />
            {/* escurece a base pra frase continuar legível sobre a foto */}
            <div className="absolute inset-0 bg-gradient-to-t from-asphalt/90 via-asphalt/20 to-transparent" />
            <p className="absolute bottom-6 left-6 right-6 font-heading text-lg font-bold text-white">
              Cuidar de um carro é mais do que limpar. É preservar cada detalhe.
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
