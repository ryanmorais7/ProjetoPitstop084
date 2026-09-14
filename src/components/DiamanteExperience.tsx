"use client";

import { useState } from "react";
import { planos, regraUtilizacaoPlanos } from "@/lib/data";
import { formatarPreco } from "@/lib/format";
import { useSelection } from "@/context/SelectionContext";
import { scrollToId } from "@/lib/scroll";
import Reveal from "./Reveal";
import Bolt from "./Bolt";

const diamante = planos.diamante;

export default function DiamanteExperience() {
  const { selecionarPlano, setCategoriaVeiculo, setTipoAtendimento } = useSelection();
  const [categoriaId, setCategoriaId] = useState(diamante.categorias?.[0]?.id ?? null);

  const categoria = diamante.categorias?.find((c) => c.id === categoriaId) ?? diamante.categorias?.[0];

  function assinarDiamante() {
    selecionarPlano("diamante");
    setCategoriaVeiculo(categoriaId);
    setTipoAtendimento("assinatura");
    scrollToId("agendamento");
  }

  return (
    <section id="diamante" className="px-6 py-24">
      <div className="mx-auto max-w-3xl">
        <Reveal>
          <div className="mb-2 flex items-center gap-2 font-mono text-xs uppercase tracking-[0.2em] text-gold">
            <Bolt className="h-3.5 w-3.5" />A experiência Diamante
          </div>
          <h2 className="font-heading text-3xl font-bold md:text-5xl">Plano Diamante</h2>
          <p className="mt-4 max-w-xl text-text-secondary">{diamante.descricao}</p>
        </Reveal>

        <Reveal delayMs={60}>
          <div className="mt-10">
            <p className="mb-3 font-mono text-xs uppercase tracking-widest text-text-secondary">
              Qual é o seu veículo?
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              {diamante.categorias?.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setCategoriaId(cat.id)}
                  className={`rounded-sm border p-5 text-left transition ${
                    cat.id === categoriaId
                      ? "border-gold bg-panel"
                      : "border-white/10 bg-panel hover:border-white/30"
                  }`}
                >
                  <span className="font-heading text-lg font-bold">{cat.nome}</span>
                  <span className="block text-sm text-text-secondary">{cat.descricao}</span>
                  <span className="mt-2 block font-mono text-xl font-bold text-gold">
                    {formatarPreco(cat.precoMensal)}
                    <span className="text-sm font-normal text-text-secondary">/mês</span>
                  </span>
                </button>
              ))}
            </div>
          </div>
        </Reveal>

        <Reveal delayMs={100}>
          <div className="mt-12">
            <p className="mb-6 font-mono text-xs uppercase tracking-widest text-text-secondary">
              Benefícios exclusivos
            </p>
            <div className="grid gap-6 sm:grid-cols-2">
              {diamante.beneficios?.map((beneficio) => (
                <div key={beneficio.numero}>
                  <span className="font-mono text-sm text-gold">{beneficio.numero}</span>
                  <p className="mt-1 font-heading text-base font-bold">{beneficio.titulo}</p>
                  {beneficio.descricao && (
                    <p className="mt-1 text-sm text-text-secondary">{beneficio.descricao}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </Reveal>

        <Reveal delayMs={140}>
          <div className="mt-12 rounded-sm border border-white/10 bg-panel p-5">
            <p className="font-mono text-xs uppercase tracking-widest text-text-secondary">
              Regra de utilização
            </p>
            <p className="mt-2 text-sm text-text-secondary">{regraUtilizacaoPlanos}</p>
          </div>
        </Reveal>

        <Reveal delayMs={180}>
          <button
            type="button"
            onClick={assinarDiamante}
            className="mt-10 w-full rounded-sm bg-gold py-4 font-heading text-sm font-bold tracking-wide text-asphalt transition hover:brightness-110 sm:w-auto sm:px-10"
          >
            Quero ser Diamante · {categoria ? formatarPreco(categoria.precoMensal) : ""}/mês
          </button>
        </Reveal>
      </div>
    </section>
  );
}
