"use client";

import { useEffect, useState } from "react";
import { scrollToId } from "@/lib/scroll";

export default function MobileStickyCta() {
  const [visivel, setVisivel] = useState(false);

  useEffect(() => {
    let ticking = false;

    function verificar() {
      setVisivel(window.scrollY > window.innerHeight * 0.9);
      ticking = false;
    }

    function aoRolar() {
      if (!ticking) {
        requestAnimationFrame(verificar);
        ticking = true;
      }
    }

    window.addEventListener("scroll", aoRolar, { passive: true });
    return () => window.removeEventListener("scroll", aoRolar);
  }, []);

  return (
    <div
      className={`fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-asphalt/95 p-3 backdrop-blur transition-transform duration-300 md:hidden ${
        visivel ? "translate-y-0" : "translate-y-full"
      }`}
      style={{ paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom))" }}
    >
      <button
        type="button"
        onClick={() => scrollToId("agendamento")}
        className="block w-full rounded-sm bg-gold py-3 text-center font-heading text-sm font-semibold tracking-wide text-asphalt"
      >
        ⚡ Agendar
      </button>
    </div>
  );
}
