"use client";

import { avulsos, linkWhatsapp, AvulsoServico } from "@/lib/data";
import { necessidades, necessidadeIndecisa } from "@/lib/necessidades";
import { formatarPreco } from "@/lib/format";
import { useSelection } from "@/context/SelectionContext";
import { scrollToId } from "@/lib/scroll";
import Reveal from "./Reveal";
import Bolt from "./Bolt";

const texturas = [
  "linear-gradient(135deg, #1c1a10, #0a0a0b)",
  "linear-gradient(135deg, #17181b, #0a0a0b)",
  "linear-gradient(135deg, #201c0e, #111214)",
  "linear-gradient(135deg, #15161a, #0a0a0b)",
  "linear-gradient(135deg, #1d1911, #0a0a0b)",
];

export default function ServicesEditorial() {
  const { selecionarAvulso, setTipoAtendimento } = useSelection();

  function escolherServico(servico: AvulsoServico) {
    selecionarAvulso(servico);
    setTipoAtendimento("avulso");
    scrollToId("agendamento");
  }

  function escolherNecessidade(necessidade: (typeof necessidades)[number]) {
    const alvo = necessidade.alvo;
    if (alvo.tipo !== "avulso") return;
    const servico = avulsos.find((a) => a.id === alvo.avulsoId);
    if (servico) escolherServico(servico);
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

        <Reveal delayMs={60}>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <span className="text-sm text-text-secondary">O que seu carro precisa?</span>
            {necessidades.map((necessidade) => (
              <button
                key={necessidade.id}
                type="button"
                onClick={() => escolherNecessidade(necessidade)}
                className="rounded-full border border-white/15 px-4 py-1.5 font-mono text-xs uppercase tracking-wide text-text-primary transition hover:border-gold hover:text-gold"
              >
                {necessidade.titulo}
              </button>
            ))}
            <a
              href={
                necessidadeIndecisa.alvo.tipo === "whatsapp"
                  ? linkWhatsapp(necessidadeIndecisa.alvo.mensagem)
                  : "#"
              }
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-text-secondary underline-offset-4 hover:text-gold hover:underline"
            >
              {necessidadeIndecisa.titulo}
            </a>
          </div>
        </Reveal>

        <div className="mt-10 grid gap-6 sm:grid-cols-2">
          {avulsos.map((servico, i) => (
            <Reveal key={servico.id} delayMs={i * 50}>
              <div className="flex h-full flex-col overflow-hidden rounded-sm border border-white/10 bg-panel">
                <div
                  className="aspect-[16/9] w-full"
                  style={{ background: texturas[i % texturas.length] }}
                />
                <div className="flex flex-1 flex-col p-5">
                  <h3 className="font-heading text-lg font-bold">{servico.nome}</h3>
                  <p className="mt-2 font-mono text-xl font-bold text-gold">
                    {servico.sobConsulta ? "Sob consulta" : formatarPreco(servico.preco ?? 0)}
                  </p>
                  <div className="mt-4">
                    {servico.sobConsulta ? (
                      <a
                        href={linkWhatsapp(
                          `Olá! Quero saber mais sobre o serviço "${servico.nome}" da Pitstop.`
                        )}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex rounded-sm border border-gold px-4 py-2 font-heading text-xs font-semibold tracking-wide text-gold transition hover:bg-gold hover:text-asphalt"
                      >
                        Falar no WhatsApp
                      </a>
                    ) : (
                      <button
                        type="button"
                        onClick={() => escolherServico(servico)}
                        className="inline-flex rounded-sm bg-gold px-4 py-2 font-heading text-xs font-semibold tracking-wide text-asphalt transition hover:brightness-110"
                      >
                        Agendar este serviço
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
