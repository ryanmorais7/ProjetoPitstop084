"use client";

import { useCallback, useRef, useState } from "react";
import Image from "next/image";
import { fotosAntesDepois, fotosEspaco } from "@/lib/data";
import Reveal from "./Reveal";
import Bolt from "./Bolt";
import { scrollToId } from "@/lib/scroll";

/**
 * Resultado + espaço. O antes e depois são duas fotos do mesmo carro, no mesmo enquadramento:
 * a de "antes" fica por cima, recortada até a posição do controle, que o cliente arrasta
 * (ou move com as setas do teclado).
 */
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
          {/* fotos verticais (3:4): largura inteira no celular, coluna central no desktop */}
          <div
            ref={containerRef}
            onPointerDown={iniciarArraste}
            onPointerMove={moverArraste}
            onPointerUp={pararArraste}
            onPointerCancel={pararArraste}
            className="relative mx-auto mt-10 aspect-[3/4] w-full max-w-lg cursor-ew-resize touch-pan-y select-none overflow-hidden rounded-sm border border-white/10"
          >
            <Image
              src={fotosAntesDepois.depois}
              alt={fotosAntesDepois.altDepois}
              fill
              sizes="(min-width: 560px) 512px, 100vw"
              draggable={false}
              className="object-cover"
            />
            <Image
              src={fotosAntesDepois.antes}
              alt={fotosAntesDepois.altAntes}
              fill
              sizes="(min-width: 560px) 512px, 100vw"
              draggable={false}
              className="object-cover"
              style={{ clipPath: `inset(0 ${100 - posicao}% 0 0)` }}
            />

            <span className="pointer-events-none absolute left-3 top-3 rounded-sm bg-black/70 px-2.5 py-1 font-heading text-xs font-bold uppercase tracking-[0.18em] text-white backdrop-blur-sm sm:text-sm">
              Antes
            </span>
            <span className="pointer-events-none absolute right-3 top-3 rounded-sm bg-gold px-2.5 py-1 font-heading text-xs font-bold uppercase tracking-[0.18em] text-asphalt sm:text-sm">
              Depois
            </span>

            <div className="absolute inset-y-0 w-0.5 bg-gold" style={{ left: `${posicao}%` }}>
              <span
                role="slider"
                tabIndex={0}
                aria-label="Comparar antes e depois"
                aria-valuenow={Math.round(posicao)}
                aria-valuemin={0}
                aria-valuemax={100}
                onKeyDown={aoTeclar}
                className="absolute left-1/2 top-1/2 flex h-11 w-11 -translate-x-1/2 -translate-y-1/2 cursor-ew-resize items-center justify-center rounded-full bg-gold text-asphalt shadow-lg focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-text-primary"
              >
                <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <path d="M6 4L2 8l4 4M10 4l4 4-4 4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
            </div>
          </div>
          <p className="mt-3 text-center text-sm text-text-secondary">Arraste para comparar.</p>
        </Reveal>

        <Reveal delayMs={120}>
          <h3 className="mt-12 font-heading text-xl font-bold md:text-2xl">Conheça o espaço</h3>
          <div className="mt-4 grid grid-cols-2 gap-2 sm:gap-3 md:grid-cols-4">
            {fotosEspaco.map((foto) => (
              <div key={foto.src} className="relative aspect-[3/4] overflow-hidden rounded-sm border border-white/10">
                <Image
                  src={foto.src}
                  alt={foto.alt}
                  fill
                  sizes="(min-width: 768px) 220px, 50vw"
                  className="object-cover transition-transform duration-700 ease-out hover:scale-[1.03]"
                />
              </div>
            ))}
          </div>
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
