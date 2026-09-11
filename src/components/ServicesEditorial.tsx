"use client";

import Link from "next/link";
import { avulsos } from "@/lib/data";
import { formatarPreco } from "@/lib/format";
import { useSelection } from "@/context/SelectionContext";
import Reveal from "./Reveal";
import Bolt from "./Bolt";

export default function ServicesEditorial() {
  const { selecionarAvulso, setTipoAtendimento } = useSelection();

  function escolher(servico: (typeof avulsos)[number]) {
    if (servico.sobConsulta) return;
    selecionarAvulso(servico);
    setTipoAtendimento("avulso");
  }

  return (
    <section id="servicos" className="bg-surface px-6 py-24">
      <div className="mx-auto max-w-4xl">
        <Reveal>
          <div className="mb-2 flex items-center gap-2 font-mono text-xs uppercase tracking-[0.2em] text-text-secondary">
            <Bolt className="h-3.5 w-3.5 text-gold" />
            Serviços
          </div>
          <h2 className="max-w-lg font-heading text-3xl font-bold md:text-5xl">
            Cada detalhe tem um propósito.
          </h2>
        </Reveal>

        <div className="mt-14 divide-y divide-white/10 border-t border-white/10">
          {avulsos.map((servico, i) => (
            <Reveal key={servico.id} delayMs={i * 60}>
              <Link
                href="#agendamento"
                onClick={() => escolher(servico)}
                className="group flex items-start justify-between gap-6 py-8 transition hover:pl-2"
              >
                <div className="flex gap-6">
                  <span className="font-mono text-sm text-text-secondary">
                    0{i + 1}
                  </span>
                  <div>
                    <h3 className="font-heading text-xl font-bold tracking-wide transition group-hover:text-gold sm:text-2xl">
                      {servico.nome}
                    </h3>
                    <p className="mt-2 max-w-md text-sm text-text-secondary">
                      {servico.descricao}
                    </p>
                  </div>
                </div>
                <span className="shrink-0 font-mono text-sm text-text-secondary">
                  {servico.sobConsulta ? "Sob consulta" : formatarPreco(servico.preco ?? 0)}
                </span>
              </Link>
            </Reveal>
          ))}
        </div>

        <Reveal>
          <div className="mt-10">
            <Link
              href="#agendamento"
              className="inline-flex items-center gap-2 rounded-sm bg-gold px-6 py-3 font-heading text-sm font-semibold tracking-wide text-asphalt transition hover:brightness-110"
            >
              Escolher meu serviço
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
