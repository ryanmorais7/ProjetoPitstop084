"use client";

import { listaPlanos, PlanoId } from "@/lib/data";
import { useSelection } from "@/context/SelectionContext";
import { scrollToId } from "@/lib/scroll";
import PlanoCard from "./PlanoCard";
import Reveal from "./Reveal";
import Bolt from "./Bolt";

export default function SubscriptionPlans() {
  const { selecionarPlano, setTipoAtendimento } = useSelection();

  function escolher(id: PlanoId) {
    selecionarPlano(id);
    setTipoAtendimento("assinatura");
    scrollToId("agendamento");
  }

  return (
    <section id="planos" className="px-6 py-24">
      <div className="mx-auto max-w-4xl">
        <Reveal>
          <div className="mb-2 flex items-center gap-2 font-mono text-xs uppercase tracking-[0.2em] text-text-secondary">
            <Bolt className="h-3.5 w-3.5 text-gold" />
            Assinatura
          </div>
          <h2 className="max-w-xl font-heading text-3xl font-bold md:text-5xl">
            Seu carro. Sempre em dia.
          </h2>
          <p className="mt-4 max-w-xl text-text-secondary">
            Para quem prefere transformar cuidado em rotina. Não é obrigatório assinar pra usar a
            Pitstop: quem prefere pode continuar escolhendo um serviço avulso quando quiser.
          </p>
        </Reveal>

        <div className="mt-12 grid gap-6 sm:grid-cols-2">
          {listaPlanos.map((plano, i) => (
            <Reveal key={plano.id} delayMs={i * 80}>
              <PlanoCard plano={plano} onClick={() => escolher(plano.id)} />
            </Reveal>
          ))}
        </div>

        <p className="mt-6 text-xs text-text-secondary">
          Benefícios de exemplo. Detalhes finais em definição com o cliente.
        </p>
      </div>
    </section>
  );
}
