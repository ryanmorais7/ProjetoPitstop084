import type { CSSProperties } from "react";
import { formatarDataCurta } from "@/lib/agenda";
import BrandLogo from "./BrandLogo";
import QrCode from "./QrCode";

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
  checkinUrl,
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
  /** URL pública do QR (/checkin/<token>). Sem ela, o código P084 fica como identificação. */
  checkinUrl?: string | null;
}) {
  const ehAssinante = tipoAtendimento === "assinatura" && Boolean(planoNome);
  const estiloCartao = (
    ehAssinante ? { "--pitpass-anel": "rgba(232, 171, 31, 0.55)" } : undefined
  ) as CSSProperties | undefined;

  return (
    <div className="pitpass-entra mx-auto w-full max-w-[22rem]">
      <div className="pitpass-cartao pitpass-brilho rounded-2xl text-left" style={estiloCartao}>
        {/* filete de marca */}
        <div
          className={`h-[3px] bg-gradient-to-r ${
            ehAssinante ? "from-gold via-gold/70 to-gold/10" : "from-gold via-gold/40 to-transparent"
          }`}
        />

        <div className="px-6 pt-5">
          {/* Identidade */}
          <div className="flex items-start justify-between gap-3">
            <BrandLogo className="text-[13px]" />
            <span className="pt-0.5 font-mono text-xs font-semibold tracking-[0.08em] text-white/80">{codigo}</span>
          </div>

          <div className="mt-7">
            <p className="font-heading text-[1.75rem] font-bold leading-none tracking-[0.2em] text-white">
              PITPASS
              {ehAssinante && <span className="text-gold"> • {planoNome!.toUpperCase()}</span>}
            </p>
            <p className="mt-2 flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.18em] text-gold">
              <span className="h-1.5 w-1.5 rounded-full bg-gold" aria-hidden="true" />
              Agendamento confirmado
            </p>
          </div>

          {/* Cliente */}
          <div className="mt-7">
            <p className="font-heading text-xl font-bold leading-tight text-white">{nome}</p>
            <p className="mt-1 font-mono text-[11px] uppercase tracking-wide text-text-secondary">
              {carro} • {porteNome}
            </p>
          </div>

          {/* Quando */}
          <div className="mt-6 flex items-end justify-between gap-4">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-text-secondary">Data</p>
              <p className="mt-1 font-heading text-lg font-bold tracking-wide text-white">
                {formatarDataCurta(dataIso)}
              </p>
            </div>
            <div className="text-right">
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-text-secondary">Horário</p>
              <p className="mt-0.5 font-mono text-3xl font-semibold leading-none text-white">{horario}</p>
            </div>
          </div>

          {/* O quê */}
          <div className="mt-6">
            {beneficio ? (
              <>
                <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-gold">Benefício do plano</p>
                <p className="mt-1 font-heading text-base font-bold tracking-wide text-white">{beneficio}</p>
              </>
            ) : (
              <>
                <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-text-secondary">Serviço</p>
                {servicos.map((servico, i) => (
                  <p
                    key={servico}
                    className={
                      i === 0
                        ? "mt-1 font-heading text-base font-bold tracking-wide text-white"
                        : "font-mono text-xs text-text-secondary"
                    }
                  >
                    {i === 0 ? servico : `+ ${servico}`}
                  </p>
                ))}
              </>
            )}
          </div>
        </div>

        {/* Picote + QR */}
        <div className="pitpass-picote mt-7" />
        <div className="flex flex-col items-center px-6 pb-6 pt-7">
          {checkinUrl && (
            <div
              className="rounded-xl bg-white p-2.5 shadow-[0_8px_24px_-12px_rgba(0,0,0,0.9)]"
              style={{ animation: "passo-entra 0.35s ease-out 0.25s both" }}
            >
              <QrCode conteudo={checkinUrl} className="block h-40 w-40" titulo={`QR Code do PitPass ${codigo}`} />
            </div>
          )}
          <p
            className={`font-mono text-lg font-semibold tracking-[0.14em] text-white ${checkinUrl ? "mt-4" : ""}`}
          >
            {codigo}
          </p>
          <p className="mt-1.5 flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.18em] text-text-secondary">
            Status <span aria-hidden="true">•</span> <span className="text-gold">Confirmado</span>
          </p>
        </div>

        {/* Rodapé */}
        <div className="border-t border-white/[0.06] bg-white/[0.03] px-6 py-3 text-center">
          <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-text-secondary">
            Apresente este PitPass na chegada
          </p>
        </div>
      </div>
    </div>
  );
}
