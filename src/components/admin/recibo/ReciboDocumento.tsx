import type { ReactNode } from "react";
import { formatarDataCurta } from "@/lib/agenda";
import { formatarPreco } from "@/lib/format";
import { AVISO_NAO_FISCAL, DadosRecibo, dataDoRecibo, valorDoItem } from "@/lib/recibo";

/**
 * O recibo como documento: fundo branco, tipografia clara, amarelo só em detalhes. É o que vai
 * pra impressora (a classe `recibo-folha` vira a página inteira no @media print) e o espelho do PDF.
 */
export default function ReciboDocumento({ dados }: { dados: DadosRecibo }) {
  return (
    <article className="recibo-folha mx-auto w-full max-w-2xl rounded-xl border border-black/10 bg-white p-6 text-[#0a0a0b] shadow-sm sm:p-10">
      <header className="flex flex-wrap items-start justify-between gap-4 border-b-2 border-gold pb-5">
        <div>
          <p className="font-heading text-3xl font-bold leading-none tracking-[0.06em]">
            PITSTOP<span className="text-gold">084</span>
          </p>
          <p className="mt-1.5 font-mono text-[10px] uppercase tracking-[0.3em] text-[#666a71]">Premium Car Studio</p>
        </div>
        <div className="text-right">
          <p className="font-heading text-sm font-bold tracking-[0.14em]">RECIBO DE SERVIÇO</p>
          <p className="mt-1 font-mono text-sm">Nº {dados.numero}</p>
          <p className="font-mono text-xs text-[#666a71]">Data: {dataDoRecibo(dados.emitidoEm)}</p>
        </div>
      </header>

      <div className="mt-6 grid gap-x-8 gap-y-5 sm:grid-cols-2">
        <Bloco titulo="Cliente">
          <p className="font-semibold">{dados.cliente.nome}</p>
          <p className="text-sm text-[#666a71]">{dados.cliente.telefone}</p>
          {dados.cliente.codigo && <p className="font-mono text-xs text-[#666a71]">Cliente {dados.cliente.codigo}</p>}
        </Bloco>
        <Bloco titulo="Veículo">
          <p className="font-semibold">{dados.veiculo.modelo}</p>
          <p className="text-sm text-[#666a71]">
            Tipo: {dados.veiculo.tipo}
            {dados.veiculo.porte ? ` · ${dados.veiculo.porte}` : ""}
          </p>
          <p className="text-sm text-[#666a71]">
            Placa: <span className="font-mono text-[#0a0a0b]">{dados.veiculo.placa ?? "não informada"}</span>
          </p>
        </Bloco>
        <Bloco titulo="Atendimento">
          <p className="font-mono text-sm">
            {dados.codigoAtendimento ?? "-"} · {formatarDataCurta(dados.dataAtendimento)} · {dados.horario}
          </p>
        </Bloco>
        {dados.plano && (
          <Bloco titulo="Plano">
            <p className="text-sm font-semibold">{dados.plano}</p>
          </Bloco>
        )}
      </div>

      <table className="mt-7 w-full text-sm">
        <thead>
          <tr className="border-b border-black/15 text-left">
            <th className="pb-2 font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-[#666a71]">Serviços</th>
            <th className="pb-2 text-right font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-[#666a71]">
              Valor
            </th>
          </tr>
        </thead>
        <tbody>
          {dados.itens.map((item, i) => (
            <tr key={`${item.descricao}-${i}`} className="border-b border-black/[0.08] align-top">
              <td className={`py-2.5 pr-4 ${item.adicional ? "" : "font-semibold"}`}>
                {item.adicional && <span className="mr-1 text-[#666a71]">+</span>}
                {item.descricao}
                {item.adicional && <span className="ml-2 font-mono text-[10px] uppercase tracking-wide text-[#666a71]">Adicional</span>}
              </td>
              <td className={`whitespace-nowrap py-2.5 text-right tabular-nums ${item.valor != null ? "" : "text-[#666a71]"}`}>
                {valorDoItem(item)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <dl className="ml-auto mt-4 w-full max-w-xs space-y-1.5 text-sm">
        {(dados.desconto > 0 || dados.acrescimo > 0) && <Total rotulo="Subtotal" valor={formatarPreco(dados.subtotal)} />}
        {dados.desconto > 0 && <Total rotulo="Desconto" valor={`- ${formatarPreco(dados.desconto)}`} />}
        {dados.acrescimo > 0 && <Total rotulo="Acréscimo" valor={formatarPreco(dados.acrescimo)} />}
        <div className="flex items-baseline justify-between gap-4 border-t border-[#0a0a0b] pt-2.5">
          <dt className="font-heading text-sm font-bold tracking-[0.14em]">TOTAL</dt>
          <dd className="font-heading text-2xl font-bold tabular-nums">{formatarPreco(dados.total)}</dd>
        </div>
        <Total rotulo="Forma de pagamento" valor={dados.formaPagamento} />
      </dl>

      {dados.observacao && (
        <Bloco titulo="Observação" className="mt-6">
          <p className="whitespace-pre-line text-sm text-[#3d4045]">{dados.observacao}</p>
        </Bloco>
      )}

      <footer className="mt-8 border-t border-black/10 pt-4 text-xs text-[#666a71]">
        <p className="font-semibold text-[#0a0a0b]">{dados.empresa.nome}</p>
        <p className="mt-0.5">
          {[dados.empresa.documento, dados.empresa.endereco, dados.empresa.telefone].filter(Boolean).join(" · ")}
        </p>
        <p className="mt-2">{AVISO_NAO_FISCAL}</p>
      </footer>
    </article>
  );
}

function Bloco({ titulo, className = "", children }: { titulo: string; className?: string; children: ReactNode }) {
  return (
    <section className={className}>
      <h3 className="mb-1 font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-[#666a71]">{titulo}</h3>
      {children}
    </section>
  );
}

function Total({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <dt className="text-[#666a71]">{rotulo}</dt>
      <dd className="tabular-nums">{valor}</dd>
    </div>
  );
}
