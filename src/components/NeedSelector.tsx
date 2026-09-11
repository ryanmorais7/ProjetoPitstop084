"use client";

import { necessidades } from "@/lib/necessidades";
import { avulsos, linkWhatsapp } from "@/lib/data";
import { useSelection } from "@/context/SelectionContext";
import Reveal from "./Reveal";
import Bolt from "./Bolt";

export default function NeedSelector() {
  const { selecionarAvulso, setTipoAtendimento } = useSelection();

  function lidarComClique(necessidade: (typeof necessidades)[number]) {
    const alvo = necessidade.alvo;
    if (alvo.tipo === "avulso") {
      const servico = avulsos.find((a) => a.id === alvo.avulsoId);
      if (!servico) return;
      selecionarAvulso(servico);
      setTipoAtendimento("avulso");
      document.getElementById("agendamento")?.scrollIntoView({ behavior: "smooth" });
    } else if (alvo.tipo === "plano") {
      setTipoAtendimento("assinatura");
      document.getElementById("agendamento")?.scrollIntoView({ behavior: "smooth" });
    } else {
      window.open(linkWhatsapp(alvo.mensagem), "_blank", "noopener,noreferrer");
    }
  }

  return (
    <section id="precisa" className="bg-surface px-6 py-24">
      <div className="mx-auto max-w-6xl">
        <Reveal>
          <div className="mb-2 flex items-center gap-2 font-mono text-xs uppercase tracking-[0.2em] text-text-secondary">
            <Bolt className="h-3.5 w-3.5 text-gold" />
            Diagnóstico rápido
          </div>
          <h2 className="max-w-xl font-heading text-3xl font-bold md:text-5xl">
            O que seu carro precisa hoje?
          </h2>
          <p className="mt-4 max-w-md text-text-secondary">
            Escolha o que mais combina com o momento do seu carro.
          </p>
        </Reveal>

        <div className="mt-12 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {necessidades.map((necessidade, i) => (
            <Reveal key={necessidade.id} delayMs={i * 60}>
              <button
                type="button"
                onClick={() => lidarComClique(necessidade)}
                className="group flex h-full w-full flex-col items-start rounded-sm border border-white/10 bg-panel p-6 text-left transition hover:border-gold/60"
              >
                <span className="mb-4 font-mono text-xs text-text-secondary transition group-hover:text-gold">
                  0{i + 1}
                </span>
                <span className="font-heading text-lg font-semibold text-text-primary">
                  {necessidade.titulo}
                </span>
                <span className="mt-2 text-sm text-text-secondary">{necessidade.descricao}</span>
                <span className="mt-5 flex items-center gap-1 font-mono text-xs uppercase tracking-wide text-gold opacity-0 transition group-hover:opacity-100">
                  Continuar <Bolt className="h-3 w-3" />
                </span>
              </button>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
