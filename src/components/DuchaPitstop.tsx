"use client";

import { useState } from "react";
import { avulsos, duchaAddons, linkWhatsapp, AvulsoServico } from "@/lib/data";
import { formatarPreco } from "@/lib/format";
import { useSelection } from "@/context/SelectionContext";
import { scrollToId } from "@/lib/scroll";
import Reveal from "./Reveal";
import Bolt from "./Bolt";

const ducha = avulsos.find((a) => a.id === "ducha-pitstop")!;
const outrosCuidados = avulsos.filter((a) => a.id !== "ducha-pitstop");

export default function DuchaPitstop() {
  const { selecionarAvulso, setTipoAtendimento } = useSelection();
  const [selecionados, setSelecionados] = useState<Set<string>>(new Set());

  function alternarAddon(id: string) {
    setSelecionados((atual) => {
      const novo = new Set(atual);
      if (novo.has(id)) {
        novo.delete(id);
      } else {
        novo.add(id);
      }
      return novo;
    });
  }

  function agendarServico(servico: AvulsoServico) {
    if (servico.sobConsulta) {
      window.open(
        linkWhatsapp(`Olá! Quero saber mais sobre o serviço "${servico.nome}" da Pitstop 084.`),
        "_blank",
        "noopener,noreferrer"
      );
      return;
    }
    selecionarAvulso(servico);
    setTipoAtendimento("avulso");
    scrollToId("agendamento");
  }

  const addonsSelecionados = duchaAddons.filter((a) => selecionados.has(a.id));

  return (
    <section id="servicos" className="px-6 py-24">
      <div className="mx-auto max-w-4xl">
        <Reveal>
          <div className="mb-2 flex items-center gap-2 font-mono text-xs uppercase tracking-[0.2em] text-text-secondary">
            <Bolt className="h-3.5 w-3.5 text-gold" />
            Ducha Pitstop
          </div>
          <h2 className="font-heading text-3xl font-bold md:text-5xl">Ducha Pitstop</h2>
          <p className="mt-3 max-w-lg text-text-secondary">{ducha.descricao}</p>
        </Reveal>

        <div className="mt-10 grid gap-10 md:grid-cols-2">
          <Reveal delayMs={60}>
            <div className="overflow-hidden rounded-sm border border-white/10 bg-panel">
              <div
                className="aspect-video w-full"
                style={{ background: "linear-gradient(135deg, #1c1a10, #0a0a0b)" }}
              />
              <div className="p-6">
                <ul className="space-y-2 text-sm">
                  {ducha.itens?.map((item) => (
                    <li key={item} className="flex items-start gap-2 text-text-primary">
                      <span className="mt-0.5 text-gold">✓</span>
                      {item}
                    </li>
                  ))}
                </ul>
                <div className="mt-4 flex flex-wrap gap-x-6 gap-y-1 font-mono text-xs text-text-secondary">
                  <span>{ducha.duracao}</span>
                </div>
                <p className="mt-2 text-xs text-text-secondary">{ducha.resultado}</p>
                <p className="mt-4 font-mono text-2xl font-bold text-gold">
                  {formatarPreco(ducha.preco ?? 0)}
                </p>
              </div>
            </div>
          </Reveal>

          <Reveal delayMs={100}>
            <div className="rounded-sm border border-white/10 bg-panel p-6">
              <h3 className="font-heading text-lg font-bold">Personalize sua Ducha</h3>
              <p className="mt-1 text-sm text-text-secondary">
                Adicione o que seu carro precisa hoje.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {duchaAddons.map((addon) => {
                  const ativo = selecionados.has(addon.id);
                  return (
                    <button
                      key={addon.id}
                      type="button"
                      onClick={() => alternarAddon(addon.id)}
                      className={`rounded-full border px-4 py-1.5 font-mono text-xs uppercase tracking-wide transition ${
                        ativo
                          ? "border-gold bg-gold text-asphalt"
                          : "border-white/15 text-text-primary hover:border-gold hover:text-gold"
                      }`}
                    >
                      + {addon.nome}
                    </button>
                  );
                })}
              </div>

              <div className="mt-6 rounded-sm bg-asphalt p-4 font-mono text-sm">
                <div className="flex justify-between">
                  <span className="text-text-secondary">Ducha Pitstop</span>
                  <span className="text-gold">{formatarPreco(ducha.preco ?? 0)}</span>
                </div>
                {addonsSelecionados.map((addon) => (
                  <div key={addon.id} className="mt-1 flex justify-between text-text-secondary">
                    <span>+ {addon.nome}</span>
                    <span>a definir</span>
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={() => agendarServico(ducha)}
                className="mt-6 w-full rounded-sm bg-gold py-3 font-heading text-sm font-semibold tracking-wide text-asphalt transition hover:brightness-110"
              >
                ⚡ Agendar Ducha
              </button>
            </div>
          </Reveal>
        </div>

        <Reveal delayMs={140}>
          <div className="mt-14 border-t border-white/10 pt-8">
            <p className="mb-4 font-mono text-xs uppercase tracking-[0.2em] text-text-secondary">
              Outros cuidados
            </p>
            <div className="divide-y divide-white/10">
              {outrosCuidados.map((servico) => (
                <div
                  key={servico.id}
                  className="flex flex-wrap items-center justify-between gap-3 py-4"
                >
                  <div>
                    <span className="font-heading text-sm font-bold">{servico.nome}</span>
                    <span className="ml-2 text-xs text-text-secondary">{servico.descricao}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="font-mono text-sm text-gold">
                      {servico.sobConsulta ? "Sob consulta" : formatarPreco(servico.preco ?? 0)}
                    </span>
                    <button
                      type="button"
                      onClick={() => agendarServico(servico)}
                      className="font-mono text-xs uppercase tracking-wide text-text-secondary underline-offset-4 hover:text-gold hover:underline"
                    >
                      Agendar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
