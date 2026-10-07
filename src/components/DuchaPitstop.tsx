"use client";

import Image from "next/image";
import { duchaPitstop as duchaPadrao, precoServico } from "@/lib/data";
import { formatarDuracao, servicoBase } from "@/lib/catalogo";
import { useSelection } from "@/context/SelectionContext";
import Reveal from "./Reveal";
import Bolt from "./Bolt";
import MonteSeuPitstop from "./MonteSeuPitstop";
import Preco from "./Preco";
import { Check } from "./FichaTecnicaSheet";

export default function DuchaPitstop() {
  const { catalogo, categoriaVeiculo } = useSelection();
  // serviço base do veículo escolhido: Ducha Pitstop (carro) ou Ducha Moto
  const duchaPitstop = servicoBase(catalogo, categoriaVeiculo) ?? duchaPadrao;
  const precoDucha = precoServico(duchaPitstop, categoriaVeiculo);
  const ehMoto = categoriaVeiculo === "MOTO";

  return (
    <section id="servicos" className="px-6 py-20 md:py-28">
      <div className="mx-auto max-w-6xl">
        <Reveal>
          <div className="mb-3 flex items-center gap-2 font-mono text-xs uppercase tracking-[0.2em] text-text-secondary">
            <Bolt className="h-3.5 w-3.5 text-gold" />
            Serviço avulso
          </div>
          <h2 className="font-heading text-3xl font-bold md:text-5xl">{duchaPitstop.nome}</h2>
          <p className="mt-4 max-w-md text-text-secondary">{duchaPitstop.shortDescription}</p>
        </Reveal>

        <div className="mt-12 grid gap-8 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:items-start lg:gap-10">
          <Reveal delayMs={60} className="lg:sticky lg:top-24">
            <div className="overflow-hidden rounded-sm border border-white/10 bg-panel md:max-lg:grid md:max-lg:grid-cols-2">
              <div className="relative aspect-video w-full md:max-lg:aspect-auto md:max-lg:h-full lg:aspect-[4/3]">
                <Image
                  src="/hero-pitstop.jpg"
                  alt={ehMoto ? "Lavagem na PitStop084" : "Carro coberto de espuma durante a Ducha Pitstop"}
                  fill
                  sizes="(min-width: 1024px) 40vw, (min-width: 768px) 50vw, 100vw"
                  className="object-cover"
                />
              </div>
              <div className="p-6 sm:p-8">
                <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-text-secondary">Inclui</p>
                <ul className="mt-4 space-y-3 text-[15px]">
                  {duchaPitstop.includes?.map((item) => (
                    <li key={item} className="flex items-start gap-3 text-text-primary">
                      <Check />
                      {item}
                    </li>
                  ))}
                </ul>

                <div className="mt-8 flex items-end justify-between gap-4 border-t border-white/10 pt-6">
                  <p className="max-w-[9rem] font-mono text-[11px] uppercase leading-relaxed tracking-wider text-text-secondary">
                    {duchaPitstop.duracaoMin
                      ? `Aproximadamente ${
                          duchaPitstop.duracaoMin < 60
                            ? `${duchaPitstop.duracaoMin} minutos`
                            : formatarDuracao(duchaPitstop.duracaoMin)
                        }`
                      : ""}
                  </p>
                  {precoDucha != null && (
                    <p className="text-right">
                      <span className="block font-mono text-[10px] uppercase tracking-[0.22em] text-text-secondary">
                        A partir de
                      </span>
                      <Preco valor={precoDucha} className="mt-1.5 text-4xl text-gold" />
                    </p>
                  )}
                </div>
              </div>
            </div>
          </Reveal>

          <Reveal delayMs={100}>
            <MonteSeuPitstop />
          </Reveal>
        </div>
      </div>
    </section>
  );
}
