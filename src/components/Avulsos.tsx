"use client";

import { avulsos, linkWhatsapp } from "@/lib/data";
import { formatarPreco } from "@/lib/format";
import { useSelection } from "@/context/SelectionContext";

export default function Avulsos() {
  const { selecionarAvulso } = useSelection();

  return (
    <section id="avulsos" className="px-6 py-20">
      <div className="mx-auto max-w-6xl">
        <div className="mb-12 text-center">
          <p className="mb-3 font-mono text-sm uppercase tracking-widest text-cyan">
            Serviços avulsos
          </p>
          <h2 className="font-heading text-3xl font-bold md:text-4xl">
            Sem assinatura, sem compromisso
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-text-secondary">
            Valores ilustrativos para fins de protótipo.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {avulsos.map((servico) => (
            <div
              key={servico.id}
              className="flex flex-col rounded-2xl border border-white/10 bg-panel p-6"
            >
              <h3 className="font-heading text-lg font-bold">{servico.nome}</h3>
              <p className="mt-2 flex-1 text-sm text-text-secondary">{servico.descricao}</p>

              <div className="mt-6">
                {servico.sobConsulta ? (
                  <a
                    href={linkWhatsapp(
                      `Olá! Quero saber mais sobre o serviço "${servico.nome}" da Pitstop 084.`
                    )}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full rounded-full border border-cyan px-4 py-2 text-center font-heading text-sm font-semibold text-cyan transition hover:bg-cyan hover:text-asphalt"
                  >
                    Sob consulta, falar no WhatsApp
                  </a>
                ) : (
                  <a
                    href="#agendamento"
                    onClick={() => selecionarAvulso(servico)}
                    className="flex w-full items-center justify-between rounded-full bg-gold px-4 py-2 font-heading text-sm font-semibold text-asphalt transition hover:brightness-110"
                  >
                    <span>Agendar</span>
                    <span className="font-mono">{formatarPreco(servico.preco ?? 0)}</span>
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
