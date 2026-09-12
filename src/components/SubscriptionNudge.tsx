"use client";

import { scrollToId } from "@/lib/scroll";
import Bolt from "./Bolt";

export default function SubscriptionNudge() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 border-y border-white/10 bg-panel px-6 py-4 text-center sm:flex-row sm:gap-4">
      <p className="flex items-center gap-2 text-sm text-text-secondary">
        <Bolt className="h-3.5 w-3.5 text-gold" />
        Quer manter seu carro sempre em dia? Conheça os planos Pitstop.
      </p>
      <button
        type="button"
        onClick={() => scrollToId("planos")}
        className="font-mono text-xs font-semibold uppercase tracking-wide text-gold underline-offset-4 hover:underline"
      >
        Conhecer planos →
      </button>
    </div>
  );
}
