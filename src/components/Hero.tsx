"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Bolt from "./Bolt";
import { scrollToId } from "@/lib/scroll";
import {
  HERO_VIDEO_SRC,
  HERO_VIDEO_MOBILE_SRC,
  HERO_POSTER_SRC,
  HERO_MOBILE_POSTER_SRC,
} from "@/lib/heroMedia";

export default function Hero() {
  const [mobile, setMobile] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 768px)");
    // eslint-disable-next-line react-hooks/set-state-in-effect -- lê o breakpoint atual uma vez, na montagem
    setMobile(mq.matches);
    const aoMudar = (e: MediaQueryListEvent) => setMobile(e.matches);
    mq.addEventListener("change", aoMudar);
    return () => mq.removeEventListener("change", aoMudar);
  }, []);

  const poster = (mobile ? HERO_MOBILE_POSTER_SRC : null) ?? HERO_POSTER_SRC;

  return (
    <section className="relative flex min-h-[100svh] items-end overflow-hidden bg-asphalt">
      <div className="absolute inset-0">
        {HERO_VIDEO_SRC ? (
          <video
            className="h-full w-full object-cover"
            autoPlay
            muted
            loop
            playsInline
            poster={poster ?? undefined}
          >
            <source
              src={HERO_VIDEO_MOBILE_SRC ?? HERO_VIDEO_SRC}
              media="(max-width: 768px)"
            />
            <source src={HERO_VIDEO_SRC} />
          </video>
        ) : poster ? (
          // Foto estática até o vídeo cinematográfico ser definido em src/lib/heroMedia.ts
          <Image
            src={poster}
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
        ) : (
          // Placeholder até haver vídeo ou foto em src/lib/heroMedia.ts
          <div
            className="h-full w-full"
            style={{
              background:
                "radial-gradient(120% 90% at 50% 100%, rgba(230,167,35,0.16), transparent 60%), linear-gradient(180deg, #0a0a0b 0%, #111214 55%, #0a0a0b 100%)",
            }}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-asphalt via-asphalt/60 to-asphalt/20" />
      </div>

      <div className="relative z-10 w-full px-6 pb-16 pt-40 md:px-12 md:pb-24">
        <div className="mx-auto max-w-3xl">
          <div className="mb-5 flex animate-[fadein_0.8s_ease-out] items-center gap-2 font-mono text-xs uppercase tracking-[0.2em] text-gold">
            <Bolt className="h-3.5 w-3.5" />
            Estética automotiva • Pitstop 084
          </div>

          <h1 className="animate-[fadein_0.9s_ease-out] font-heading text-4xl font-bold leading-[1.02] tracking-tight text-white sm:text-6xl md:text-7xl">
            Seu carro merece mais que uma lavagem.
          </h1>

          <p className="mt-4 max-w-md animate-[fadein_1.05s_ease-out] text-base text-text-secondary sm:text-lg">
            Cuidado, técnica e atenção aos detalhes.
          </p>

          <div className="mt-9 flex flex-wrap items-center gap-6 animate-[fadein_1.2s_ease-out]">
            <button
              type="button"
              onClick={() => scrollToId("agendamento")}
              className="rounded-sm bg-gold px-7 py-4 font-heading text-sm font-semibold tracking-wide text-asphalt transition hover:brightness-110"
            >
              ⚡ Agendar meu horário
            </button>
            <button
              type="button"
              onClick={() => scrollToId("sobre")}
              className="font-heading text-sm font-semibold tracking-wide text-text-secondary underline-offset-4 transition hover:text-white hover:underline"
            >
              Conhecer a Pitstop ↓
            </button>
          </div>
        </div>
      </div>

      <div className="absolute bottom-6 left-1/2 z-10 hidden -translate-x-1/2 flex-col items-center gap-2 text-text-secondary md:flex">
        <span className="h-8 w-px animate-pulse bg-gold/60" />
      </div>

      <style>{`
        @keyframes fadein {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </section>
  );
}
