"use client";

import Image from "next/image";
import { duchaPitstop, precoServico } from "@/lib/data";
import { formatarPreco } from "@/lib/format";
import { useSelection } from "@/context/SelectionContext";
import Reveal from "./Reveal";
import Bolt from "./Bolt";
import MonteSeuPitstop from "./MonteSeuPitstop";

export default function DuchaPitstop() {
  const { porteVeiculo } = useSelection();
  const precoDucha = precoServico(duchaPitstop, porteVeiculo);

  return (
    <section id="servicos" className="px-6 py-24">
      <div className="mx-auto max-w-5xl">
        <Reveal>
          <div className="mb-2 flex items-center gap-2 font-mono text-xs uppercase tracking-[0.2em] text-text-secondary">
            <Bolt className="h-3.5 w-3.5 text-gold" />
            Ducha Pitstop
          </div>
          <h2 className="font-heading text-3xl font-bold md:text-5xl">Ducha Pitstop</h2>
          <p className="mt-3 max-w-lg text-text-secondary">{duchaPitstop.descricao}</p>
        </Reveal>

        <div className="mt-10 grid gap-10 md:grid-cols-2 md:items-start">
          <Reveal delayMs={60}>
            <div className="overflow-hidden rounded-sm border border-white/10 bg-panel">
              <div className="relative aspect-video w-full">
                <Image
                  src="/hero-pitstop.jpg"
                  alt="Carro coberto de espuma durante a Ducha Pitstop"
                  fill
                  sizes="(min-width: 768px) 50vw, 100vw"
                  className="object-cover"
                />
              </div>
              <div className="p-6">
                <ul className="space-y-2 text-sm">
                  {duchaPitstop.itens?.map((item) => (
                    <li key={item} className="flex items-start gap-2 text-text-primary">
                      <span className="mt-0.5 text-gold">✓</span>
                      {item}
                    </li>
                  ))}
                </ul>
                <div className="mt-4 flex flex-wrap gap-x-6 gap-y-1 font-mono text-xs text-text-secondary">
                  <span>{duchaPitstop.duracao}</span>
                </div>
                <p className="mt-2 text-xs text-text-secondary">{duchaPitstop.resultado}</p>
                <p className="mt-4 font-mono text-2xl font-bold text-gold">
                  A partir de {formatarPreco(precoDucha ?? 0)}
                </p>
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
