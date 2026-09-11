"use client";

import { useCallback, useRef, useState } from "react";
import Reveal from "./Reveal";
import Bolt from "./Bolt";
import { scrollToId } from "@/lib/scroll";

const galeria = [
  "linear-gradient(135deg, #17181b, #0a0a0b)",
  "linear-gradient(135deg, #1c1a10, #0a0a0b)",
  "linear-gradient(135deg, #15161a, #0a0a0b)",
  "linear-gradient(135deg, #1d1911, #0a0a0b)",
];

export default function BeforeAfterSlider() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [posicao, setPosicao] = useState(50);
  const arrastando = useRef(false);

  const atualizarPosicao = useCallback((clientX: number) => {
    const container = containerRef.current;
    if (!container) return;
    const { left, width } = container.getBoundingClientRect();
    const percentual = ((clientX - left) / width) * 100;
    setPosicao(Math.min(100, Math.max(0, percentual)));
  }, []);

  function iniciarArraste(e: React.PointerEvent) {
    arrastando.current = true;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    atualizarPosicao(e.clientX);
  }

  function moverArraste(e: React.PointerEvent) {
    if (!arrastando.current) return;
    atualizarPosicao(e.clientX);
  }

  function pararArraste() {
    arrastando.current = false;
  }

  function aoTeclar(e: React.KeyboardEvent) {
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      setPosicao((atual) => Math.max(0, atual - 5));
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      setPosicao((atual) => Math.min(100, atual + 5));
    }
  }

  return (
    <section className="bg-surface px-6 py-24">
      <div className="mx-auto max-w-4xl">
        <Reveal>
          <div className="mb-2 flex items-center gap-2 font-mono text-xs uppercase tracking-[0.2em] text-text-secondary">
            <Bolt className="h-3.5 w-3.5 text-gold" />
            Resultado
          </div>
          <h2 className="max-w-lg font-heading text-3xl font-bold md:text-5xl">
            Resultado fala mais alto.
          </h2>
        </Reveal>

        <Reveal delayMs={100}>
          <div
            ref={containerRef}
            onPointerDown={iniciarArraste}
            onPointerMove={moverArraste}
            onPointerUp={pararArraste}
            onPointerCancel={pararArraste}
            className="relative mt-10 aspect-[4/3] w-full touch-none select-none overflow-hidden rounded-sm border border-white/10 sm:aspect-video"
          >
            {/* DEPOIS: substituir este gradiente por <Image src="/depois.jpg" ... /> quando houver foto real */}
            <div className="absolute inset-0 flex items-center justify-center bg-[linear-gradient(135deg,#17181b,#0a0a0b)]">
              <span className="font-mono text-xs uppercase tracking-[0.3em] text-gold">Depois</span>
            </div>

            {/* ANTES: substituir este gradiente por <Image src="/antes.jpg" ... /> quando houver foto real */}
            <div
              className="absolute inset-0 flex items-center justify-center overflow-hidden bg-[linear-gradient(135deg,#2a2a2c,#111214)]"
              style={{ clipPath: `inset(0 ${100 - posicao}% 0 0)` }}
            >
              <span className="font-mono text-xs uppercase tracking-[0.3em] text-text-secondary">
                Antes
              </span>
            </div>

            <div
              className="absolute inset-y-0 w-px bg-gold"
              style={{ left: `${posicao}%` }}
            >
              <span
                role="slider"
                tabIndex={0}
                aria-label="Comparar antes e depois"
                aria-valuenow={Math.round(posicao)}
                aria-valuemin={0}
                aria-valuemax={100}
                onKeyDown={aoTeclar}
                className="absolute top-1/2 left-1/2 flex h-9 w-9 -translate-x-1/2 -translate-y-1/2 cursor-ew-resize items-center justify-center rounded-full bg-gold text-asphalt shadow-lg focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-text-primary"
              >
                <Bolt className="h-4 w-4" />
              </span>
            </div>
          </div>
        </Reveal>

        <Reveal delayMs={120}>
          <div className="mt-4 grid grid-cols-4 gap-2">
            {galeria.map((fundo, i) => (
              <div
                key={i}
                className="aspect-square rounded-sm"
                style={{ background: fundo }}
              />
            ))}
          </div>
          <p className="mt-3 text-xs text-text-secondary">
            Imagens de exemplo. Fotos reais dos resultados entram aqui em breve.
          </p>
        </Reveal>

        <Reveal delayMs={160}>
          <button
            type="button"
            onClick={() => scrollToId("agendamento")}
            className="mt-8 inline-flex items-center gap-2 rounded-sm bg-gold px-6 py-3 font-heading text-sm font-semibold tracking-wide text-asphalt transition hover:brightness-110"
          >
            Quero esse cuidado
          </button>
        </Reveal>
      </div>
    </section>
  );
}
