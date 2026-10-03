import { pitpassTheme, temaDoPlano } from "@/lib/pitpassTheme";

/**
 * Identifica o cliente no admin: contorno amarelo pra quem é só cadastro (PitStop 084),
 * selo preenchido pra quem tem PitPass. A cor do selo vem do mesmo tema do cartão PitPass:
 * amarelo sólido pra Black/Gold, azul frio só pro Diamante.
 */
export default function ClienteBadge({
  nomePlano,
  className = "",
}: {
  nomePlano?: string | null;
  className?: string;
}) {
  if (nomePlano) {
    const tema = pitpassTheme[temaDoPlano(nomePlano.toLowerCase())];
    return (
      <span
        className={`inline-block whitespace-nowrap rounded px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wide ${tema.classeBadge} ${className}`}
      >
        PitPass • {nomePlano}
      </span>
    );
  }

  return (
    <span
      className={`inline-block whitespace-nowrap rounded border border-gold px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wide text-gold-ink ${className}`}
    >
      Cliente PitStop 084
    </span>
  );
}
