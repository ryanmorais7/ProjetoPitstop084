import { formatarDataCurta } from "@/lib/agenda";
import CarSparkMark from "./CarSparkMark";

export default function PitPass({
  tipoAtendimento,
  planoNome,
  nome,
  carro,
  porteNome,
  dataIso,
  horario,
  servicos,
  beneficio,
  codigo,
}: {
  tipoAtendimento: "avulso" | "assinatura";
  /** Nome do plano (ex.: "Diamante"), só quando for assinante. */
  planoNome?: string | null;
  nome: string;
  carro: string;
  porteNome: string;
  dataIso: string;
  horario: string;
  /** Serviço avulso + adicionais, na ordem em que devem ser listados. Ignorado se `beneficio` vier preenchido. */
  servicos: string[];
  /** Nome do benefício do plano utilizado (ex.: "Lavagem Gold"), só quando for assinante. */
  beneficio?: string | null;
  codigo: string;
}) {
  const ehAssinante = tipoAtendimento === "assinatura" && Boolean(planoNome);

  return (
    <div
      className={`mx-auto max-w-sm rounded-sm border p-6 text-left ${
        ehAssinante
          ? "border-2 border-gold bg-gradient-to-br from-panel to-asphalt"
          : "border border-white/15 bg-asphalt"
      }`}
    >
      {/* Identidade */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CarSparkMark className="h-6 w-6 text-white" />
          <span className="font-heading text-sm font-bold tracking-[0.15em]">
            PITPASS{ehAssinante && ` • ${planoNome!.toUpperCase()}`}
          </span>
        </div>
        <span className="font-mono text-xs font-bold uppercase tracking-wide text-text-secondary">P084</span>
      </div>
      <p className="mt-1 font-mono text-[11px] uppercase tracking-wide text-gold">
        {ehAssinante ? "Cliente PitPass" : "Agendamento confirmado"}
      </p>

      {/* Dados principais */}
      <div className="mt-4 border-t border-white/10 pt-4">
        <p className="font-heading text-lg font-bold text-white">{nome}</p>
        <p className="font-mono text-xs uppercase tracking-wide text-text-secondary">
          {carro} • {porteNome}
        </p>
      </div>

      {/* Agendamento */}
      <div className="mt-4 border-t border-white/10 pt-4">
        <p className="font-mono text-sm text-white">
          {formatarDataCurta(dataIso)} <span className="text-text-secondary">•</span> {horario}
        </p>
        <div className="mt-2 space-y-0.5">
          {beneficio ? (
            <>
              <p className="font-mono text-[10px] uppercase tracking-wide text-gold">Benefício utilizado</p>
              <p className="font-mono text-sm text-white">{beneficio}</p>
            </>
          ) : (
            servicos.map((servico, i) => (
              <p key={servico} className="font-mono text-sm text-white">
                {i === 0 ? servico : `+ ${servico}`}
              </p>
            ))
          )}
        </div>
      </div>

      {/* Identificação */}
      <div className="mt-4 flex items-end justify-between border-t border-white/10 pt-4">
        <div className="space-y-0.5 font-mono text-xs">
          <p className="text-text-secondary">
            Código: <span className="text-white">{codigo}</span>
          </p>
          <p className="text-text-secondary">
            Status: <span className="text-gold">Confirmado</span>
          </p>
        </div>
        <div
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-sm border border-dashed border-white/20"
          aria-hidden="true"
        >
          <span className="font-mono text-[8px] uppercase tracking-wide text-text-secondary/70">QR</span>
        </div>
      </div>

      {/* Rodapé */}
      <div className="-mx-6 -mb-6 mt-5 rounded-b-sm bg-white/5 px-6 py-2.5 text-center">
        <p className="font-mono text-[10px] uppercase tracking-wide text-text-secondary">
          Apresente este PitPass na chegada
        </p>
      </div>
    </div>
  );
}
