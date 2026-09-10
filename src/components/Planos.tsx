"use client";

import { planos, regrasFidelidade } from "@/lib/data";
import { formatarPreco } from "@/lib/format";
import { useSelection } from "@/context/SelectionContext";

export default function Planos() {
  const { selecionarPlano } = useSelection();

  return (
    <section id="planos" className="bg-surface px-6 py-20">
      <div className="mx-auto max-w-6xl">
        <div className="mb-12 text-center">
          <p className="mb-3 font-mono text-sm uppercase tracking-widest text-cyan">Planos</p>
          <h2 className="font-heading text-3xl font-bold md:text-4xl">Escolha sua assinatura</h2>
          <p className="mx-auto mt-3 max-w-xl text-text-secondary">
            Valores ilustrativos para fins de protótipo.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2">
          {planos.map((plano) => (
            <div
              key={plano.id}
              className={`flex flex-col rounded-2xl border p-8 ${
                plano.destaque
                  ? "border-gold bg-panel shadow-[0_0_40px_-15px_rgba(217,164,65,0.5)]"
                  : "border-white/10 bg-panel"
              }`}
            >
              {plano.destaque && (
                <span className="mb-4 w-fit rounded-full bg-gold px-3 py-1 font-mono text-xs font-semibold uppercase text-asphalt">
                  Mais completo
                </span>
              )}
              <h3 className="font-heading text-2xl font-bold">{plano.nome}</h3>
              <p className="mt-2 font-mono text-3xl font-semibold text-gold">
                {formatarPreco(plano.precoMensal)}
                <span className="text-base font-normal text-text-secondary">/mês</span>
              </p>

              <ul className="mt-6 space-y-3 text-sm">
                {plano.itens.map((item) => (
                  <li key={item} className="flex items-start gap-2 text-text-primary">
                    <span className="mt-0.5 text-cyan">✓</span>
                    {item}
                  </li>
                ))}
                {plano.naoInclui?.map((item) => (
                  <li key={item} className="flex items-start gap-2 text-text-secondary">
                    <span className="mt-0.5">✕</span>
                    Não inclui {item.toLowerCase()}
                  </li>
                ))}
              </ul>

              <a
                href="#assinatura"
                onClick={() => selecionarPlano(plano.id)}
                className={`mt-8 rounded-full px-6 py-3 text-center font-heading font-semibold transition ${
                  plano.destaque
                    ? "bg-gold text-asphalt hover:brightness-110"
                    : "border border-white/15 text-text-primary hover:border-cyan hover:text-cyan"
                }`}
              >
                Assinar {plano.nome}
              </a>
            </div>
          ))}
        </div>

        <p className="mx-auto mt-10 max-w-2xl text-center text-sm text-text-secondary">
          {regrasFidelidade.textoResumo}
        </p>
      </div>
    </section>
  );
}
