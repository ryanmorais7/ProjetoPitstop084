"use client";

import { listaPlanos, regraUtilizacaoPlanos, PlanoId } from "@/lib/data";
import { scrollToId } from "@/lib/scroll";
import { useSelection } from "@/context/SelectionContext";
import { VehicleSizeSelector } from "./VehicleSizeSelector";
import PlanoCard from "./PlanoCard";
import Reveal from "./Reveal";
import Bolt from "./Bolt";

export default function SubscriptionPlans() {
  const { porteVeiculo, selecionarPlano, setTipoAtendimento } = useSelection();

  function assinar(id: PlanoId) {
    selecionarPlano(id);
    setTipoAtendimento("assinatura");
    scrollToId("agendamento");
  }

  return (
    <section id="planos" className="bg-surface px-6 py-24">
      <div className="mx-auto max-w-5xl">
        <Reveal>
          <div className="mb-2 flex items-center gap-2 font-mono text-xs uppercase tracking-[0.2em] text-text-secondary">
            <Bolt className="h-3.5 w-3.5 text-gold" />
            Planos Pitstop
          </div>
          <h2 className="max-w-xl font-heading text-3xl font-bold md:text-5xl">
            Seu carro. Sempre em dia.
          </h2>
          <p className="mt-4 max-w-xl text-text-secondary">
            Para quem prefere transformar cuidado em rotina. Não é obrigatório assinar pra usar a
            Pitstop: quem prefere pode continuar escolhendo um serviço avulso quando quiser.
          </p>
        </Reveal>

        <Reveal delayMs={40}>
          <VehicleSizeSelector className="mt-10 max-w-xl" />
        </Reveal>

        <div className="mt-8 grid gap-6 sm:grid-cols-3">
          {listaPlanos.map((plano, i) => (
            <Reveal key={plano.id} delayMs={i * 80}>
              <PlanoCard plano={plano} porteVeiculo={porteVeiculo} onClick={() => assinar(plano.id)} />
            </Reveal>
          ))}
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
