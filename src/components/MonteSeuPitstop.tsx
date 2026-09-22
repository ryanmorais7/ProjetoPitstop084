"use client";

import { useState } from "react";
import { duchaPitstop, servicosAvulsos, precoServico, categoriasCuidado, CategoriaCuidado } from "@/lib/data";
import { formatarPreco } from "@/lib/format";
import { useSelection } from "@/context/SelectionContext";
import { scrollToId } from "@/lib/scroll";
import { VehicleSizeSelector } from "./VehicleSizeSelector";
import AddonOptionCard from "./AddonOptionCard";

const destaques = servicosAvulsos.filter((s) => s.destaque);
const outros = servicosAvulsos.filter((s) => !s.destaque);
const categoriasOutros: CategoriaCuidado[] = ["protecao", "estetica"];

export default function MonteSeuPitstop() {
  const { porteVeiculo, avulsosSelecionados, alternarAvulso, setTipoAtendimento } = useSelection();
  const [verMais, setVerMais] = useState(false);

  const precoDucha = precoServico(duchaPitstop, porteVeiculo) ?? 0;
  const adicionaisComPreco = avulsosSelecionados.filter((s) => s.precos);
  const adicionaisAvaliacao = avulsosSelecionados.filter((s) => s.requiresEvaluation);
  const totalAdicionais = adicionaisComPreco.reduce(
    (soma, s) => soma + (precoServico(s, porteVeiculo) ?? 0),
    0
  );
  const total = precoDucha + totalAdicionais;
  const temAdicionais = avulsosSelecionados.length > 0;

  function agendar() {
    setTipoAtendimento("avulso");
    scrollToId("agendamento");
  }

  return (
    <div className="rounded-sm border border-white/10 bg-panel p-6">
      <h3 className="font-heading text-lg font-bold">Monte seu Pitstop</h3>
      <p className="mt-1 text-sm text-text-secondary">
        Comece pela Ducha e adicione os cuidados que seu carro precisa hoje.
      </p>

      <VehicleSizeSelector className="mt-6" />

      <div className="mt-6 flex items-center justify-between gap-3 rounded-sm border border-gold/40 bg-gold/10 px-4 py-3">
        <span className="font-heading text-sm font-bold text-gold">✓ Ducha Pitstop — já incluso</span>
        <span key={porteVeiculo} className="preco-fade font-mono text-sm font-bold text-gold">
          {formatarPreco(precoDucha)}
        </span>
      </div>

      <div className="mt-8">
        <h4 className="font-heading text-base font-bold">Complete seu cuidado</h4>
        <p className="mt-1 text-sm text-text-secondary">Adicione o que seu carro precisa hoje.</p>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {destaques.map((servico) => (
            <AddonOptionCard
              key={servico.id}
              servico={servico}
              preco={precoServico(servico, porteVeiculo)}
              selecionado={avulsosSelecionados.some((s) => s.id === servico.id)}
              onToggle={() => alternarAvulso(servico)}
            />
          ))}
        </div>

        <button
          type="button"
          onClick={() => setVerMais((atual) => !atual)}
          className="mt-4 font-mono text-xs uppercase tracking-widest text-text-secondary underline-offset-4 hover:text-gold hover:underline"
        >
          {verMais ? "Mostrar menos ↑" : "Ver mais cuidados +"}
        </button>

        {verMais && (
          <div className="mt-6 space-y-6">
            {categoriasOutros.map((categoria) => {
              const itens = outros.filter((s) => s.categoria === categoria);
              if (itens.length === 0) return null;
              return (
                <div key={categoria}>
                  <p className="mb-2 font-mono text-xs uppercase tracking-[0.2em] text-text-secondary">
                    {categoriasCuidado[categoria]}
                  </p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {itens.map((servico) => (
                      <AddonOptionCard
                        key={servico.id}
                        servico={servico}
                        preco={precoServico(servico, porteVeiculo)}
                        selecionado={avulsosSelecionados.some((s) => s.id === servico.id)}
                        onToggle={() => alternarAvulso(servico)}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="mt-8 rounded-sm border border-gold/50 bg-asphalt p-5">
        <p className="font-heading text-xs font-bold uppercase tracking-[0.2em] text-gold">Seu Pitstop</p>

        <div className="mt-3 space-y-1.5 font-mono text-sm">
          <div className="flex justify-between">
            <span className="text-text-secondary">Ducha Pitstop</span>
            <span className="text-white">{formatarPreco(precoDucha)}</span>
          </div>
          {avulsosSelecionados.map((s) => {
            const preco = precoServico(s, porteVeiculo);
            return (
              <div key={s.id} className="flex justify-between">
                <span className="text-text-secondary">+ {s.nome}</span>
                <span className="text-white">
                  {preco != null ? formatarPreco(preco) : "Mediante avaliação"}
                </span>
              </div>
            );
          })}
        </div>

        <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-3">
          <span className="font-heading text-sm font-bold uppercase tracking-wide">Total</span>
          <span key={total} className="preco-fade font-mono text-2xl font-bold text-gold">
            {formatarPreco(total)}
          </span>
        </div>
        {adicionaisAvaliacao.length > 0 && (
          <p className="mt-2 text-xs text-text-secondary">
            Os itens mediante avaliação não entram no total — nossa equipe define o valor com você.
          </p>
        )}

        <button
          type="button"
          onClick={agendar}
          className="mt-5 w-full rounded-sm bg-gold py-3 font-heading text-sm font-semibold tracking-wide text-asphalt transition hover:brightness-110"
        >
          {temAdicionais ? "Agendar meu Pitstop" : "Agendar Ducha"}
        </button>
      </div>
    </div>
  );
}
