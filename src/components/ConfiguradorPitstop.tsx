"use client";

import { useId, useState } from "react";
import { categoriasCuidado, CategoriaCuidado, Servico } from "@/lib/data";
import { formatarDuracao } from "@/lib/catalogo";
import { usePitstop, useSelection } from "@/context/SelectionContext";
import AddonOptionCard from "./AddonOptionCard";
import FichaTecnicaSheet, { Check } from "./FichaTecnicaSheet";
import Preco from "./Preco";

const ordemCategorias: CategoriaCuidado[] = ["limpeza", "protecao", "estetica"];

/**
 * Montagem do Pitstop: a Ducha (serviço base, já incluído), os adicionais em destaque e o
 * restante do catálogo atrás de "Ver mais cuidados". É o MESMO componente na landing ("Monte seu
 * Pitstop") e no agendamento direto: seleção, preços e ofertas vêm de `usePitstop`, então o que
 * o cliente escolhe num lugar já está escolhido no outro.
 */
export default function ConfiguradorPitstop({ className = "" }: { className?: string }) {
  const { alternarAvulso } = useSelection();
  const { base, precoBase, porteNome, categoriaVeiculo, destaques, outros, selecionado, preco, recomendacoes } = usePitstop();
  const [verMais, setVerMais] = useState(false);
  const [fichaAberta, setFichaAberta] = useState<Servico | null>(null);
  const idLista = useId();

  // escolhas dentro da parte recolhida: o botão avisa, pra não parecer que sumiram
  const escondidos = outros.filter(selecionado).length;
  const recomendadoId = recomendacoes[0]?.item.id;
  const precoFicha = fichaAberta ? preco(fichaAberta) : null;
  const fichaSelecionada = fichaAberta ? selecionado(fichaAberta) : false;

  const card = (servico: Servico, destaque: boolean, extra = "") => (
    <AddonOptionCard
      key={servico.id}
      servico={servico}
      preco={preco(servico)}
      selecionado={selecionado(servico)}
      destaque={destaque}
      selo={destaque && servico.id === recomendadoId ? "Recomendado" : undefined}
      className={extra}
      onToggle={() => alternarAvulso(servico)}
      onDetalhes={() => setFichaAberta(servico)}
    />
  );

  return (
    <div className={className}>
      {/* Serviço base: não é mais um adicional, é o que já está no atendimento */}
      {base && (
        <div className="rounded-md border border-gold/50 bg-gold/[0.07] p-4 sm:p-5">
          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gold">
            <Check className="mt-0" />
            Serviço base · já incluído
          </p>
          <div className="mt-2 flex items-end justify-between gap-4">
            <div className="min-w-0">
              <h4 className="font-heading text-2xl font-bold leading-tight">{base.nome}</h4>
              <p className="mt-1 text-sm text-text-secondary">
                {porteNome}
                {base.duracaoMin ? ` · ${formatarDuracao(base.duracaoMin)}` : ""}
              </p>
            </div>
            <span key={categoriaVeiculo} className="preco-fade shrink-0">
              <Preco valor={precoBase} className="text-3xl text-gold" />
            </span>
          </div>
        </div>
      )}

      {destaques.length > 0 && (
        <div className="mt-8">
          <h4 className="font-heading text-xl font-bold">Complete seu cuidado</h4>
          <p className="mt-1 text-sm text-text-secondary">
            Aproveite que seu {categoriaVeiculo === "MOTO" ? "veículo" : "carro"} já está aqui. Você escolhe, ou segue só com a Ducha.
          </p>

          {/* 3 destaques: o primeiro ocupa a linha inteira no desktop, os outros dois dividem a seguinte */}
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {destaques.map((servico, i) => card(servico, true, i === 0 && destaques.length % 2 === 1 ? "sm:col-span-2" : ""))}
          </div>

          {outros.length > 0 && (
            <>
              <div id={idLista} className="colapsavel" data-aberto={verMais} inert={!verMais}>
                <div>
                  <div className="space-y-6 pt-6">
                    {ordemCategorias.map((categoria) => {
                      const itens = outros.filter((s) => s.categoria === categoria);
                      if (itens.length === 0) return null;
                      return (
                        <div key={categoria}>
                          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-text-secondary">
                            {categoriasCuidado[categoria]}
                          </p>
                          <div className="grid gap-3 sm:grid-cols-2">{itens.map((s) => card(s, false))}</div>
                        </div>
                      );
                    })}
                    {outros.some((s) => !s.categoria) && (
                      <div className="grid gap-3 sm:grid-cols-2">{outros.filter((s) => !s.categoria).map((s) => card(s, false))}</div>
                    )}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setVerMais((atual) => !atual)}
                aria-expanded={verMais}
                aria-controls={idLista}
                className="mt-4 flex min-h-11 w-full items-center justify-center gap-2 rounded-sm border border-white/15 px-4 text-sm font-semibold tracking-wide text-text-primary transition-colors hover:border-gold hover:text-gold"
              >
                {verMais ? "Ver menos ↑" : "Ver mais cuidados +"}
                {!verMais && escondidos > 0 && (
                  <span className="rounded-full bg-gold px-2 py-0.5 text-[11px] font-bold text-asphalt">
                    {escondidos} selecionado{escondidos > 1 ? "s" : ""}
                  </span>
                )}
              </button>
            </>
          )}
        </div>
      )}

      <FichaTecnicaSheet
        ficha={fichaAberta}
        etiqueta={fichaAberta?.categoria ? `Adicional · ${categoriasCuidado[fichaAberta.categoria]}` : "Adicional"}
        onFechar={() => setFichaAberta(null)}
        valor={
          fichaAberta && (
            <>
              <span className="text-xs font-semibold uppercase tracking-wide text-text-secondary">
                Valor{fichaAberta.duracaoMin ? ` · + ${formatarDuracao(fichaAberta.duracaoMin)}` : ""}
              </span>
              {precoFicha != null ? (
                <Preco valor={precoFicha} className="text-2xl text-gold" />
              ) : (
                <span className="font-heading text-sm font-bold tracking-[0.14em] text-gold">Mediante avaliação</span>
              )}
            </>
          )
        }
        acao={
          <button
            type="button"
            onClick={() => {
              if (fichaAberta) alternarAvulso(fichaAberta);
              setFichaAberta(null);
            }}
            className={`w-full rounded-sm py-4 font-heading text-sm font-bold tracking-[0.12em] transition ${
              fichaSelecionada
                ? "border border-white/20 text-text-primary hover:border-gold hover:text-gold"
                : "bg-gold text-asphalt hover:brightness-110"
            }`}
          >
            {fichaSelecionada ? "Remover do meu Pitstop" : "Adicionar ao meu Pitstop"}
          </button>
        }
      />
    </div>
  );
}
