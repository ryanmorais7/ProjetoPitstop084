import { PlanoId } from "@/lib/data";
import { formatarDataCurta } from "@/lib/agenda";
import CarSparkMark from "./CarSparkMark";

const corPorPlano: Record<PlanoId, string> = {
  black: "text-white",
  gold: "text-gold",
  diamante: "text-white",
};

export default function PitPass({
  selo,
  planoId,
  carro,
  porteNome,
  dataIso,
  horario,
  servicos,
  codigo,
}: {
  /** "AGENDAMENTO" para avulso, ou o rótulo do plano para assinante. */
  selo: string;
  planoId?: PlanoId | null;
  carro: string;
  porteNome: string;
  dataIso: string;
  horario: string;
  servicos: string[];
  codigo: string;
}) {
  const corSelo = planoId ? corPorPlano[planoId] : "text-gold";

  return (
    <div className="mx-auto max-w-sm rounded-sm border-2 border-gold bg-asphalt p-6 text-left">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CarSparkMark className="h-6 w-6 text-white" />
          <span className="font-heading text-sm font-bold tracking-[0.15em]">PITPASS</span>
        </div>
        <span className="font-mono text-xs font-bold uppercase tracking-wide text-text-secondary">
          P084
        </span>
      </div>

      <p className={`mt-4 font-heading text-xl font-bold tracking-wide ${corSelo}`}>{selo}</p>

      <p className="mt-3 font-heading text-base font-bold text-white">{carro}</p>
      <p className="font-mono text-xs uppercase tracking-wide text-text-secondary">{porteNome}</p>

      <p className="mt-4 font-mono text-sm text-white">
        {formatarDataCurta(dataIso)} <span className="text-text-secondary">•</span> {horario}
      </p>

      <div className="mt-4 space-y-0.5 border-t border-white/10 pt-3">
        {servicos.map((servico, i) => (
          <p key={servico} className="font-mono text-sm text-white">
            {i === 0 ? servico : `+ ${servico}`}
          </p>
        ))}
      </div>

      <p className="mt-5 font-mono text-xs tracking-[0.1em] text-text-secondary">#{codigo}</p>
    </div>
  );
}
