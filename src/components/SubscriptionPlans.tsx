"use client";

import { useState } from "react";
import { listaPlanos, regraUtilizacaoPlanos, PlanoId } from "@/lib/data";
import { scrollToId } from "@/lib/scroll";
import { useSelection } from "@/context/SelectionContext";
import { VehicleSizeSelector } from "./VehicleSizeSelector";
import PlanoCard from "./PlanoCard";
import PlanFinder from "./PlanFinder";
import Reveal from "./Reveal";
import Bolt from "./Bolt";

export default function SubscriptionPlans() {
  const { porteVeiculo, selecionarPlano, setTipoAtendimento } = useSelection();
  // versão muda a cada recomendação pra o realce rodar de novo mesmo se o plano for o mesmo
  const [destaque, setDestaque] = useState<{ id: PlanoId; versao: number } | null>(null);

  function assinar(id: PlanoId) {
    selecionarPlano(id);
    setTipoAtendimento("assinatura");
    scrollToId("agendamento");
  }

  function conhecerRecomendado(id: PlanoId) {
    setDestaque((atual) => ({ id, versao: (atual?.versao ?? 0) + 1 }));
    // espera o assistente recolher antes de medir a posição do card
    requestAnimationFrame(() => scrollToId(`plano-${id}`));
  }

  return (
    <section id="planos" className="bg-surface px-6 py-16 md:py-24">
      <div className="mx-auto max-w-6xl">
        <Reveal>
          <div className="mb-2 flex items-center gap-2 font-mono text-xs uppercase tracking-[0.2em] text-text-secondary">
            <Bolt className="h-3.5 w-3.5 text-gold" />
            Planos Pitstop
          </div>
          <h2 className="max-w-xl font-heading text-3xl font-bold md:text-5xl">
            Seu carro. Sempre em dia.
          </h2>
          <p className="mt-4 max-w-xl text-text-secondary">
            Cuide do seu jeito. Agende quando precisar ou transforme o cuidado em rotina com um plano
            PitStop.
          </p>
        </Reveal>

        <Reveal delayMs={40}>
          <VehicleSizeSelector className="mt-10 max-w-xl" />
        </Reveal>

        <Reveal delayMs={60}>
          <div className="mt-8">
            <PlanFinder onConhecer={conhecerRecomendado} onComparar={() => scrollToId("planos-grade")} />
          </div>
        </Reveal>

        <div id="planos-grade" className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {listaPlanos.map((plano, i) => {
            const destacado = destaque?.id === plano.id;
            return (
              <Reveal
                key={plano.id}
                delayMs={i * 80}
                className="sm:last:col-span-2 sm:last:mx-auto sm:last:max-w-sm lg:last:col-span-1 lg:last:mx-0 lg:last:max-w-none"
              >
                <PlanoCard
                  key={destacado ? `${plano.id}-${destaque.versao}` : plano.id}
                  plano={plano}
                  porteVeiculo={porteVeiculo}
                  destacado={destacado}
                  onClick={() => assinar(plano.id)}
                />
              </Reveal>
            );
          })}
        </div>

        <Reveal delayMs={220}>
          <p className="mx-auto mt-8 max-w-2xl text-center text-xs text-text-secondary">
            {regraUtilizacaoPlanos}
          </p>
        </Reveal>
      </div>
    </section>
  );
}
