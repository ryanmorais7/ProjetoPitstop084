/**
 * Identifica o status do cliente no admin: contorno amarelo pra quem é só cadastro
 * (Pitstop 084), preenchido amarelo pra quem tem PitPass ativo — mesma cor da marca
 * nos dois casos, mas com pesos visuais diferentes pra distinguir de relance.
 */
export default function ClienteBadge({
  nomePlano,
  className = "",
}: {
  nomePlano?: string | null;
  className?: string;
}) {
  if (nomePlano) {
    return (
      <span
        className={`rounded-sm bg-gold px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wide text-asphalt ${className}`}
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
