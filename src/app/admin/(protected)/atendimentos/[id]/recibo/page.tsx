import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { agendamentos } from "@/db/schema";
import { chavesConfiguracao, lerConfiguracoes } from "@/lib/configuracoes";
import { buscarReciboDoAtendimento, itensDoAtendimento, lerDadosRecibo, valorCobradoSugerido } from "@/lib/recibos";
import { formatarPreco } from "@/lib/format";
import ReciboDocumento from "@/components/admin/recibo/ReciboDocumento";
import ReciboAcoes from "@/components/admin/recibo/ReciboAcoes";
import FormRecibo from "@/components/admin/recibo/FormRecibo";

/**
 * Recibo de um atendimento: gera (uma vez), mostra o documento e oferece imprimir, PDF e
 * compartilhar. É comprovante de serviço, não nota fiscal.
 */
export default async function ReciboPage({ params }: PageProps<"/admin/atendimentos/[id]/recibo">) {
  const { id } = await params;
  const agendamentoId = Number(id);
  if (!Number.isInteger(agendamentoId)) notFound();

  const [registro] = await db.select().from(agendamentos).where(eq(agendamentos.id, agendamentoId));
  if (!registro) notFound();

  const [recibo, config] = await Promise.all([buscarReciboDoAtendimento(agendamentoId), lerConfiguracoes()]);
  const dados = recibo ? lerDadosRecibo(recibo) : null;
  const concluido = registro.status === "concluido";
  const ehAssinatura = registro.tipoAtendimento === "assinatura";
  const { itens, subtotal } = itensDoAtendimento(registro);

  const formulario = (
    <FormRecibo
      agendamentoId={agendamentoId}
      jaEmitido={Boolean(dados)}
      formaPagamento={dados?.formaPagamento ?? (ehAssinatura ? "PitPass (incluso no plano)" : "")}
      valorCobrado={dados?.total ?? valorCobradoSugerido(registro)}
      observacao={dados?.observacao ?? config[chavesConfiguracao.reciboObservacao] ?? ""}
    />
  );

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <Link
        href={`/admin/atendimentos/${agendamentoId}`}
        className="nao-imprimir inline-flex min-h-9 items-center text-sm text-adm-muted underline-offset-4 hover:text-adm-ink hover:underline"
      >
        ← Ficha do atendimento {registro.codigo}
      </Link>

      {!concluido && !dados && (
        <p className="adm-card px-5 py-4 text-sm text-adm-muted">
          O recibo fica disponível depois que o atendimento é concluído (carro PRONTO ou ENTREGUE na Agenda).
        </p>
      )}

      {concluido && !dados && (
        <section className="adm-card p-5 sm:p-6">
          <h2 className="font-heading text-xl font-bold">Gerar recibo</h2>
          <p className="mt-1 text-sm text-adm-muted">
            {registro.nome} · {registro.carro} · {registro.codigo}
          </p>
          <ul className="my-4 divide-y divide-adm-line rounded-lg border border-adm-line text-sm">
            {itens.map((item, i) => (
              <li key={`${item.descricao}-${i}`} className="flex items-baseline justify-between gap-4 px-4 py-2.5">
                <span className={item.adicional ? "text-adm-muted" : "font-semibold"}>
                  {item.adicional ? "+ " : ""}
                  {item.descricao}
                </span>
                <span className="tabular-nums">{item.valor != null ? formatarPreco(item.valor) : item.nota}</span>
              </li>
            ))}
            <li className="flex items-baseline justify-between gap-4 px-4 py-2.5 font-semibold">
              <span>Soma dos serviços</span>
              <span className="tabular-nums">{formatarPreco(subtotal)}</span>
            </li>
          </ul>
          {formulario}
        </section>
      )}

      {dados && (
        <>
          <ReciboAcoes dados={dados} />
          <ReciboDocumento dados={dados} />
          {concluido && (
            <details className="nao-imprimir adm-card p-5">
              <summary className="cursor-pointer text-sm font-semibold">Corrigir pagamento, valor ou observação</summary>
              <p className="mb-4 mt-2 text-sm text-adm-muted">
                O número {dados.numero} e a data de emissão são mantidos. Os dados do cliente e do atendimento são
                relidos do cadastro.
              </p>
              {formulario}
            </details>
          )}
        </>
      )}
    </div>
  );
}
