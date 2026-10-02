import Image from "next/image";
import { enderecoPitstop, fotoFachada, linkComoChegar, linkMapaEmbed } from "@/lib/data";
import Reveal from "./Reveal";
import Bolt from "./Bolt";

export default function EnderecoSection() {
  const info = (
    <div>
      <div className="mb-2 flex items-center gap-2 font-mono text-xs uppercase tracking-[0.2em] text-text-secondary">
        <Bolt className="h-3.5 w-3.5 text-gold" />
        Localização
      </div>
      <h2 className="font-heading text-2xl font-bold md:text-4xl">{enderecoPitstop.nome}</h2>
      <p className="mt-2 text-text-secondary">{enderecoPitstop.linha1}</p>
      <p className="text-text-secondary">{enderecoPitstop.linha2}</p>
      <p className="text-text-secondary">{enderecoPitstop.linha3}</p>

      <a
        href={linkComoChegar}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-6 inline-flex rounded-sm border border-gold px-6 py-3 font-heading text-sm font-semibold tracking-wide text-gold transition hover:bg-gold hover:text-asphalt active:scale-[0.985]"
      >
        Como chegar
      </a>
    </div>
  );

  const mapa = (
    <div className="aspect-video w-full overflow-hidden rounded-sm border border-white/10">
      <iframe
        src={linkMapaEmbed}
        title={`Mapa até a ${enderecoPitstop.nome}`}
        className="h-full w-full grayscale-[35%]"
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
      />
    </div>
  );

  // Sem foto configurada: endereço + mapa, como sempre foi. Nada de placeholder.
  if (!fotoFachada) {
    return (
      <section className="px-6 py-16 md:py-20">
        <div className="mx-auto grid max-w-5xl gap-10 md:grid-cols-2 md:items-center">
          <Reveal>{info}</Reveal>
          <Reveal delayMs={60}>{mapa}</Reveal>
        </div>
      </section>
    );
  }

  // Com foto: mobile = informações, fachada, mapa.
  // Desktop = informações e mapa à esquerda, fachada (foto vertical) ocupando a coluna direita.
  return (
    <section className="px-6 py-16 md:py-20">
      <div className="mx-auto grid max-w-5xl gap-8 md:grid-cols-2 md:grid-rows-[auto_1fr] md:gap-x-10 md:gap-y-8">
        <Reveal className="md:col-start-1 md:row-start-1">{info}</Reveal>

        <Reveal delayMs={60} className="md:col-start-2 md:row-span-2 md:row-start-1">
          <figure className="group relative h-full overflow-hidden rounded-sm border border-white/10 bg-panel">
            <div className="relative aspect-square w-full sm:aspect-[4/3] md:aspect-auto md:h-full md:min-h-[30rem]">
              <Image
                src={fotoFachada.src}
                alt={fotoFachada.alt}
                fill
                sizes="(min-width: 768px) 480px, 100vw"
                className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.02]"
                style={{ objectPosition: fotoFachada.foco }}
              />
            </div>
            {/* legenda sobre um degradê escuro: ajuda a reconhecer a loja sem competir com a foto */}
            <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/45 to-transparent px-5 pb-4 pt-12">
              <p className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.2em] text-gold">
                <Bolt className="h-3 w-3" />
                Reconheça a PitStop
              </p>
              <p className="mt-1 font-heading text-lg font-bold text-white">É aqui que seu Pitstop começa.</p>
            </figcaption>
          </figure>
        </Reveal>

        <Reveal delayMs={100} className="md:col-start-1 md:row-start-2 md:self-end">
          {mapa}
        </Reveal>
      </div>
    </section>
  );
}
