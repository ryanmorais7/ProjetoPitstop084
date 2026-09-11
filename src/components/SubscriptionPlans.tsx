"use client";

import { planos } from "@/lib/data";
import { useSelection } from "@/context/SelectionContext";
import PlanoCard from "./PlanoCard";
import Reveal from "./Reveal";
import Bolt from "./Bolt";

export default function SubscriptionPlans() {
  const { selecionarPlano, setTipoAtendimento } = useSelection();

  function escolher(id: (typeof planos)[number]["id"]) {
    selecionarPlano(id);
    setTipoAtendimento("assinatura");
    document.getElementById("agendamento")?.scrollIntoView({ behavior: "smooth" });
  }

  return (
    <section id="planos" className="bg-surface px-6 py-24">
      <div className="mx-auto max-w-4xl">
        <Reveal>
          <div className="mb-2 flex items-center gap-2 font-mono text-xs uppercase tracking-[0.2em] text-text-secondary">
            <Bolt className="h-3.5 w-3.5 text-gold" />
            Assinatura
          </div>
          <h2 className="max-w-xl font-heading text-3xl font-bold md:text-5xl">
            Para quem o cuidado não é eventual.
          </h2>
          <p className="mt-4 max-w-xl text-text-secondary">
            Se você gosta de manter seu carro sempre em dia, os planos Pitstop foram pensados
            pra transformar cuidado em rotina. Não é obrigatório assinar pra usar a Pitstop:
            quem prefere pode continuar escolhendo um serviço avulso quando quiser.
          </p>
        </Reveal>

        <div className="mt-12 grid gap-6 sm:grid-cols-2">
          {planos.map((plano, i) => (
            <Reveal key={plano.id} delayMs={i * 80}>
              <PlanoCard plano={plano} onClick={() => escolher(plano.id)} />
            </Reveal>
          ))}
        </div>

        <p className="mt-6 text-xs text-text-secondary">
          Benefícios, brindes e valores de exemplo. Detalhes finais em definição.
        </p>
      </div>
    </section>
  );
}
