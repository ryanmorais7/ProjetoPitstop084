import { pitpassTheme, temaDoPlano } from "@/lib/pitpassTheme";

/**
 * Identifica o status do cliente no admin: contorno amarelo pra quem é só cadastro
 * (Pitstop 084), selo preenchido pra quem tem PitPass ativo. A cor do selo vem do mesmo
 * tema do cartão PitPass: amarelo pra Black/Gold, azul frio só pro Diamante.
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
        className={`rounded-sm px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wide ${tema.classeBadge} ${className}`}
      >
        PitPass • {nomePlano}
      </span>
    );
  }

  return (
    <span
      className={`rounded-sm border border-gold px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wide text-gold ${className}`}
    >
      Cliente Pitstop 084
    </span>
  );
}
