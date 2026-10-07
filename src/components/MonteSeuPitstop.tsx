"use client";

import { useState } from "react";
import { precoServico, categoriasCuidado, CategoriaCuidado, Servico } from "@/lib/data";
import { adicionaisPara, servicoBase } from "@/lib/catalogo";
import { useSelection } from "@/context/SelectionContext";
import { scrollToId } from "@/lib/scroll";
import { VehicleSizeSelector } from "./VehicleSizeSelector";
import AddonOptionCard from "./AddonOptionCard";
import FichaTecnicaSheet, { Check } from "./FichaTecnicaSheet";
import Preco from "./Preco";

const categoriasOutros: CategoriaCuidado[] = ["limpeza", "protecao", "estetica"];

const rotuloBloco = "font-mono text-[10px] uppercase tracking-[0.22em] text-text-secondary";

export default function MonteSeuPitstop() {
  const { catalogo, categoriaVeiculo, avulsosSelecionados, alternarAvulso, setTipoAtendimento } = useSelection();
  const [verMais, setVerMais] = useState(false);
  const [fichaAberta, setFichaAberta] = useState<Servico | null>(null);

  const base = servicoBase(catalogo, categoriaVeiculo);
  // só o que o cliente pode contratar pra esse veículo: ativo, compatível e com preço (ou avaliação)
  const adicionais = adicionaisPara(catalogo, categoriaVeiculo, true);
  // sem nenhum destaque (ex.: moto), todos aparecem direto
  const temDestaques = adicionais.some((s) => s.destaque);
  const destaques = temDestaques ? adicionais.filter((s) => s.destaque) : adicionais;
  const outros = temDestaques ? adicionais.filter((s) => !s.destaque) : [];

  const nomeBase = base?.nome ?? "Ducha Pitstop";
  const precoDucha = base ? (precoServico(base, categoriaVeiculo) ?? 0) : 0;
  const adicionaisAvaliacao = avulsosSelecionados.filter((s) => s.requiresEvaluation);
  const totalAdicionais = avulsosSelecionados.reduce(
    (soma, s) => soma + (precoServico(s, categoriaVeiculo) ?? 0),
    0
  );
  const total = precoDucha + totalAdicionais;
  const temAdicionais = avulsosSelecionados.length > 0;
  // escolhas que ficam escondidas quando a lista recolhe: o botão avisa pra não parecerem perdidas
  const outrosSelecionados = avulsosSelecionados.filter((s) => outros.some((o) => o.id === s.id)).length;

  const estaSelecionado = (servico: Servico) => avulsosSelecionados.some((s) => s.id === servico.id);
  const precoFicha = fichaAberta ? precoServico(fichaAberta, categoriaVeiculo) : null;
  const fichaSelecionada = fichaAberta ? estaSelecionado(fichaAberta) : false;

  function agendar() {
    setTipoAtendimento("avulso");
    scrollToId("agendamento");
  }

  function cardDe(servico: Servico) {
    return (
      <AddonOptionCard
        key={servico.id}
        servico={servico}
        preco={precoServico(servico, categoriaVeiculo)}
        selecionado={estaSelecionado(servico)}
        onToggle={() => alternarAvulso(servico)}
        onDetalhes={() => setFichaAberta(servico)}
      />
    );
  }

  return (
    <div className="rounded-sm border border-white/10 bg-panel p-5 sm:p-7 lg:p-8">
      <h3 className="font-heading text-xl font-bold tracking-wide">Monte seu Pitstop</h3>
      <p className="mt-1.5 text-sm text-text-secondary">
        Comece com a Ducha e personalize o restante do cuidado.
      </p>

      <VehicleSizeSelector className="mt-8" />

      <div className="mt-8">
        <p className={rotuloBloco}>Base do seu Pitstop</p>
        <div className="mt-3 flex items-center justify-between gap-3 rounded-sm border border-gold/40 bg-gold/[0.07] px-4 py-3.5">
          <span className="flex items-start gap-2.5 font-heading text-sm font-bold text-gold">
            <Check />
            {nomeBase} incluída
          </span>
          <span key={categoriaVeiculo} className="preco-fade">
            <Preco valor={precoDucha} className="text-lg text-gold" />
          </span>
        </div>
      </div>

      {adicionais.length > 0 && (
        <div className="mt-10">
          <p className={rotuloBloco}>Adicionais</p>
          <p className="mt-1.5 text-sm text-text-secondary">
            Toque em um cuidado para ver o que inclui. Use o + para adicionar.
          </p>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">{destaques.map(cardDe)}</div>

          {outros.length > 0 && (
            <>
              <div className="colapsavel" data-aberto={verMais} inert={!verMais}>
                <div>
                  <div className="space-y-7 pt-7">
                    {categoriasOutros.map((categoria) => {
                      const itens = outros.filter((s) => s.categoria === categoria);
                      if (itens.length === 0) return null;
                      return (
                        <div key={categoria}>
                          <p className={`mb-3 ${rotuloBloco}`}>{categoriasCuidado[categoria]}</p>
                          <div className="grid gap-3 sm:grid-cols-2">{itens.map(cardDe)}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setVerMais((atual) => !atual)}
                aria-expanded={verMais}
                className="mt-3 py-2.5 font-mono text-xs uppercase tracking-widest text-text-secondary underline-offset-4 hover:text-gold hover:underline"
              >
                {verMais
                  ? "Mostrar menos ↑"
                  : `Ver mais cuidados +${outrosSelecionados > 0 ? ` (${outrosSelecionados} escolhido${outrosSelecionados > 1 ? "s" : ""})` : ""}`}
              </button>
            </>
          )}
        </div>
      )}

      <div className="mt-8 rounded-sm border border-gold/40 bg-asphalt p-5 sm:p-6">
        <p className="font-heading text-xs font-bold tracking-[0.22em] text-gold">Seu Pitstop</p>

        <ul className="mt-3 divide-y divide-white/[0.07] text-sm">
          <li className="flex items-baseline justify-between gap-4 py-3">
            <span className="text-text-primary">{nomeBase}</span>
            <Preco valor={precoDucha} className="text-base text-text-primary" />
          </li>
          {avulsosSelecionados.map((s) => {
            const preco = precoServico(s, categoriaVeiculo);
            return (
              <li key={s.id} className="passo-entra flex items-baseline justify-between gap-4 py-3">
                <span className="min-w-0 text-text-secondary">{s.nome}</span>
                {preco != null ? (
                  <Preco valor={preco} className="text-base text-text-primary" />
                ) : (
                  <span className="shrink-0 font-mono text-[10px] uppercase tracking-widest text-gold">
                    Avaliação solicitada
                  </span>
                )}
              </li>
            );
          })}
        </ul>

        <div className="flex items-end justify-between gap-4 border-t border-white/15 pt-5">
          <span className="font-heading text-sm font-bold tracking-[0.18em] text-text-secondary">Total</span>
          <span aria-live="polite">
            <span key={total} className="valor-atualiza">
              <Preco valor={total} className="text-4xl text-gold" />
            </span>
          </span>
        </div>
        {adicionaisAvaliacao.length > 0 && (
          <p className="mt-3 text-xs leading-relaxed text-text-secondary">
            + avaliação solicitada para {adicionaisAvaliacao.length} cuidado
            {adicionaisAvaliacao.length > 1 ? "s" : ""}. O valor não entra no total: nossa equipe define com você.
          </p>
        )}

        <button
          type="button"
          onClick={agendar}
          className="mt-6 w-full rounded-sm bg-gold py-4 font-heading text-sm font-bold tracking-[0.12em] text-asphalt transition hover:brightness-110"
        >
          {temAdicionais ? "Agendar meu Pitstop" : "Agendar Ducha"}
        </button>
      </div>

      <FichaTecnicaSheet
        ficha={fichaAberta}
        etiqueta={
          fichaAberta?.categoria ? `Adicional · ${categoriasCuidado[fichaAberta.categoria]}` : "Adicional"
        }
        onFechar={() => setFichaAberta(null)}
        valor={
          <>
            <span className={rotuloBloco}>Valor</span>
            {precoFicha != null ? (
              <Preco valor={precoFicha} className="text-2xl text-gold" />
            ) : (
              <span className="font-heading text-sm font-bold tracking-[0.14em] text-gold">Mediante avaliação</span>
            )}
          </>
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
