import Image from "next/image";
import { enderecoPitstop, fotoFachada, linkComoChegar, linkMapaEmbed } from "@/lib/data";
import Reveal from "./Reveal";
import Bolt from "./Bolt";

/** Só em `next dev`: mostra onde a foto da fachada vai entrar. Em produção, sem foto, nada aparece. */
const mostrarEspacoReservado = process.env.NODE_ENV !== "production";

export default function EnderecoSection() {
  const temFoto = Boolean(fotoFachada);
  const temColunaFoto = temFoto || mostrarEspacoReservado;

  const info = (
    <Reveal>
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
    </Reveal>
  );

  const mapa = (
    <Reveal delayMs={60}>
      <div className="aspect-video w-full overflow-hidden rounded-sm border border-white/10">
        <iframe
          src={linkMapaEmbed}
          title={`Mapa até a ${enderecoPitstop.nome}`}
          className="h-full w-full grayscale-[35%]"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />
      </div>
    </Reveal>
  );

  if (!temColunaFoto) {
    return (
      <section className="px-6 py-16 md:py-20">
        <div className="mx-auto grid max-w-5xl gap-10 md:grid-cols-2 md:items-center">
          {info}
          {mapa}
        </div>
      </section>
    );
  }

  // Com foto: mobile = foto, informações, mapa; desktop = foto à esquerda, informações + mapa à direita.
  return (
    <section className="px-6 py-16 md:py-20">
      <div className="mx-auto grid max-w-5xl gap-8 md:grid-cols-2 md:gap-10">
        <Reveal className="md:row-span-2">
          <figure className="h-full">
            {fotoFachada ? (
              <div className="relative aspect-[4/3] w-full overflow-hidden rounded-sm border border-white/10 md:aspect-auto md:h-full md:min-h-[26rem]">
                <Image
                  src={fotoFachada.src}
                  alt={fotoFachada.alt}
                  fill
                  sizes="(min-width: 768px) 50vw, 100vw"
                  className="object-cover"
                />
              </div>
            ) : (
              <div className="flex aspect-[4/3] w-full flex-col items-center justify-center gap-2 rounded-sm border border-dashed border-white/15 bg-panel/60 px-6 text-center md:aspect-auto md:h-full md:min-h-[26rem]">
                <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-text-secondary">
                  Espaço reservado · só em desenvolvimento
                </span>
                <span className="text-xs text-text-secondary/70">
                  Defina fotoFachada em src/lib/data.ts com a foto real da fachada.
                </span>
              </div>
            )}
            <figcaption className="mt-3 flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.2em] text-text-secondary">
              <Bolt className="h-3 w-3 text-gold" />
              Reconheça a PitStop na chegada
            </figcaption>
          </figure>
        </Reveal>
        {info}
        {mapa}
      </div>
    </section>
  );
}
