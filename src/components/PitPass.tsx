import type { CSSProperties } from "react";
import { formatarDataCurta } from "@/lib/agenda";
import { planos, PlanoId } from "@/lib/data";
import { pitpassTheme, temaDoPlano } from "@/lib/pitpassTheme";
import BrandLogo from "./BrandLogo";
import QrCode from "./QrCode";

/**
 * O PitPass. Um único componente pra confirmação do agendamento e pro "Meu PitPass"
 * (o cliente reencontra exatamente o mesmo cartão). A cor dos acentos vem do plano:
 * amarelo PitStop pra Ducha/Black/Gold, azul frio só pro Diamante.
 */
export default function PitPass({
  tipoAtendimento,
  planoId,
  nome,
  carro,
  porteNome,
  dataIso,
  horario,
  servicos,
  beneficio,
  codigo,
  checkinUrl,
  status = "Confirmado",
  fundoPicote,
}: {
  tipoAtendimento: "avulso" | "assinatura";
  /** Plano do assinante; define o tema do cartão. Ignorado em Ducha avulsa. */
  planoId?: PlanoId | null;
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
  status?: string;
  /** Cor de fundo atrás do cartão, pra o recorte lateral do picote "vazar" certo. */
  fundoPicote?: string;
}) {
  const plano = tipoAtendimento === "assinatura" && planoId ? planos[planoId] : null;
  const tema = pitpassTheme[temaDoPlano(plano?.id)];
  const estilo = (fundoPicote ? { "--picote-fundo": fundoPicote } : undefined) as CSSProperties | undefined;

  return (
    <div className="pitpass-entra mx-auto w-full max-w-[22rem]" style={estilo}>
      <div className={`pitpass-cartao pitpass-brilho ${tema.classe} rounded-2xl text-left`}>
        <div className="pitpass-filete" />

        <div className="px-6 pt-5">
          {/* Identidade + código */}
          <div className="flex items-start justify-between gap-3">
            <BrandLogo className="text-[13px]" />
            <span className="rounded-md bg-white/[0.06] px-2 py-1 font-mono text-[13px] font-semibold tracking-[0.06em] text-white">
              {codigo}
            </span>
          </div>

          <div className="mt-7">
            <p className="font-heading text-[1.75rem] font-bold leading-none tracking-[0.2em] text-white">
              PITPASS
              {plano && <span className="pitpass-acento"> • {plano.nome.toUpperCase()}</span>}
            </p>
            <p className="pitpass-acento mt-2 flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.18em]">
              <span className="pitpass-ponto h-1.5 w-1.5 rounded-full" aria-hidden="true" />
              Agendamento {status.toLowerCase()}
            </p>
          </div>

          {/* Cliente */}
          <div className="mt-7">
            <p className="font-heading text-xl font-bold leading-tight text-white">{nome}</p>
            <p className="mt-1 font-mono text-[11px] uppercase tracking-wide text-text-secondary">
              {carro} • {porteNome}
            </p>
          </div>

          {/* Quando: horário é o maior elemento depois de PITPASS */}
          <div className="mt-6 flex items-end justify-between gap-4">
            <div>
              <p className="pitpass-label font-mono text-[10px] uppercase tracking-[0.2em]">Data</p>
              <p className="mt-1 font-heading text-lg font-bold tracking-wide text-white">
                {formatarDataCurta(dataIso)}
              </p>
            </div>
            <div className="text-right">
              <p className="pitpass-label font-mono text-[10px] uppercase tracking-[0.2em]">Horário</p>
              <p className="mt-0.5 font-mono text-[2.5rem] font-semibold leading-none tracking-tight text-white">
                {horario}
              </p>
            </div>
          </div>

          {/* O quê */}
          <div className="mt-6">
            {beneficio ? (
              <>
                <p className="pitpass-acento font-mono text-[10px] uppercase tracking-[0.2em]">Benefício do plano</p>
                <p className="mt-1 font-heading text-base font-bold tracking-wide text-white">{beneficio}</p>
              </>
            ) : (
              <>
                <p className="pitpass-label font-mono text-[10px] uppercase tracking-[0.2em]">Serviço</p>
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
              className="pitpass-qr rounded-xl bg-white p-2.5"
              style={{ animation: "passo-entra 0.35s ease-out 0.25s both" }}
            >
              <QrCode conteudo={checkinUrl} className="block h-40 w-40" titulo={`QR Code do PitPass ${codigo}`} />
            </div>
          )}
          <p
            className={`font-mono text-xl font-semibold tracking-[0.14em] text-white ${checkinUrl ? "mt-5" : ""}`}
          >
            {codigo}
          </p>
          <p className="mt-1.5 flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.18em] text-text-secondary">
            Status <span aria-hidden="true">•</span> <span className="pitpass-acento">{status}</span>
          </p>
        </div>

        {/* Rodapé */}
        <div className="border-t border-white/[0.06] bg-white/[0.03] px-6 py-3 text-center">
          <p className="pitpass-label font-mono text-[10px] font-semibold uppercase tracking-[0.2em]">
            Apresente este PitPass na chegada
          </p>
        </div>
      </div>
    </div>
  );
}
