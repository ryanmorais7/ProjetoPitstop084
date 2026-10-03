import { NivelCuidado as Nivel, pilaresCuidado, pilaresDoNivel } from "@/lib/data";

/**
 * Comparador de nível: três traços (preenchidos até o nível) + o que o nível entrega.
 * Mesmo desenho no card do plano e na ficha técnica, pra comparar de relance.
 */
export default function NivelCuidado({
  nivel,
  claro = false,
  className = "",
}: {
  nivel: Nivel;
  /** Fundo claro (card Diamante). */
  claro?: boolean;
  className?: string;
}) {
  const vazio = claro ? "bg-black/15" : "bg-white/15";
  const rotulo = claro ? "text-light-text-secondary" : "text-text-secondary";
  const pilares = claro ? "text-light-text" : "text-text-primary";

  return (
    <div className={className}>
      <div className="flex items-center gap-3">
        <span className={`font-mono text-[10px] uppercase tracking-[0.2em] ${rotulo}`}>Nível {nivel}</span>
        <span className="flex gap-1" aria-hidden="true">
          {pilaresCuidado.map((pilar, i) => (
            <span key={pilar} className={`h-0.5 w-5 rounded-full ${i < nivel ? "bg-gold" : vazio}`} />
          ))}
        </span>
      </div>
      <p className={`mt-1.5 font-heading text-xs font-bold tracking-[0.14em] ${pilares}`}>
        {pilaresDoNivel(nivel)}
      </p>
    </div>
  );
}
